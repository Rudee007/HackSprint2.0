// services/feedback.service.js
const Feedback = require('../models/Feedback');
const moment = require('moment');
const mongoose = require('mongoose');

class FeedbackService {
  // ============ CORE CRUD ============

  async createFeedback(feedbackData) {
    const feedback = new Feedback(feedbackData);
    await feedback.save();

    return Feedback.findById(feedback._id)
      .populate('patientId', 'name email')
      .populate('providerId', 'name email role')
      .populate('sessionId'); // generic session; UI decides how to show
  }

  async getPatientFeedback(patientId, options = {}) {
    const { page = 1, limit = 10, timeRange } = options;
    const skip = (page - 1) * limit;

    const query = { patientId: new mongoose.Types.ObjectId(patientId) };

    if (timeRange) {
      query.createdAt = { $gte: moment().subtract(6, 'months').toDate() };
    }

    const [feedback, total] = await Promise.all([
      Feedback.find(query)
        .populate('providerId', 'name email role')
        .populate('sessionId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(query),
    ]);

    return {
      feedback,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalFeedback: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getSessionFeedback(sessionId, patientId = null) {
    const filter = { sessionId: new mongoose.Types.ObjectId(sessionId) };
    if (patientId) filter.patientId = new mongoose.Types.ObjectId(patientId);

    return Feedback.findOne(filter)
      .populate('patientId', 'name email')
      .populate('providerId', 'name email role')
      .populate('sessionId');
  }

  async updateFeedback(feedbackId, updateData, userId) {
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) throw new Error('Feedback not found');

    if (feedback.patientId.toString() !== userId.toString()) {
      throw new Error('Unauthorized to update this feedback');
    }

    const hoursSinceSubmission = moment().diff(moment(feedback.createdAt), 'hours');
    if (hoursSinceSubmission > 24) {
      throw new Error('Feedback can only be updated within 24 hours of submission');
    }

    Object.assign(feedback, updateData);
    await feedback.save();

    return feedback;
  }

  // ============ PROVIDER ============

  async getProviderFeedback(providerId, options = {}) {
    const { page = 1, limit = 10, timeRange } = options;
    const skip = (page - 1) * limit;

    const query = {
      providerId: new mongoose.Types.ObjectId(providerId),
      'visibility.toDoctor': true,
    };

    if (timeRange) {
      query.createdAt = { $gte: moment().subtract(3, 'months').toDate() };
    }

    const [feedback, total, avgRating] = await Promise.all([
      Feedback.find(query)
        .populate('patientId', 'name')
        .populate('sessionId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(query),
      Feedback.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            avgOverall: { $avg: '$ratings.overallSatisfaction' },
            avgEffectiveness: { $avg: '$ratings.treatmentEffectiveness' },
            avgCare: { $avg: '$ratings.patientCare' },
          },
        },
      ]),
    ]);

    return {
      feedback,
      averageRatings: avgRating[0] || {
        avgOverall: 0,
        avgEffectiveness: 0,
        avgCare: 0,
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalFeedback: total,
      },
    };
  }

  // ============ ADMIN ============

  async getAllFeedback(options = {}) {
    const { filters = {}, page = 1, limit = 20, timeRange = '1month' } = options;
    const skip = (page - 1) * limit;

    const query = { ...filters };

    if (timeRange) {
      query.createdAt = { $gte: moment().subtract(1, 'month').toDate() };
    }

    const [feedback, total] = await Promise.all([
      Feedback.find(query)
        .populate('patientId', 'name email')
        .populate('providerId', 'name email role')
        .populate('sessionId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(query),
    ]);

    return {
      feedback,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalFeedback: total,
      },
    };
  }

  async getFeedbackStats() {
    const ratingAgg = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$ratings.overallSatisfaction' },
          totalFeedback: { $sum: 1 },
        },
      },
    ]);

    const criticalCount = await Feedback.countDocuments({
      'flags.requiresAttention': true,
    });

    return {
      overview: {
        totalFeedback: ratingAgg[0]?.totalFeedback || 0,
        averageRating: ratingAgg[0]?.averageRating || 0,
        criticalFeedbackCount: criticalCount || 0,
      },
    };
  }

  // doctor/admin split response
  async respondToFeedback(feedbackId, payload) {
    const { responderRole, ...base } = payload;

    const update = { status: 'responded' };

    if (responderRole === 'doctor' || responderRole === 'therapist') {
      update.doctorResponse = base;
    } else {
      update.adminResponse = base;
    }

    const feedback = await Feedback.findByIdAndUpdate(feedbackId, update, {
      new: true,
    }).populate('patientId', 'name email');

    return feedback;
  }

  async flagFeedback(feedbackId, flagType, reason) {
    const update = {};
    update[`flags.${flagType}`] = true;

    if (reason) {
      update['textFeedback.additionalComments'] = (reason || '').toString();
    }

    const feedback = await Feedback.findByIdAndUpdate(feedbackId, update, {
      new: true,
    });

    return feedback;
  }

  async getFeedbackRequiringAttention() {
    const criticalFeedback = await Feedback.find({
      $or: [
        { 'flags.requiresAttention': true },
        { 'flags.criticalFeedback': true },
        { 'flags.hasComplaint': true },
        { status: 'submitted' },
      ],
      'visibility.toAdmin': true,
    })
      .populate('patientId', 'name email phone')
      .populate('providerId', 'name email role')
      .populate('sessionId')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return criticalFeedback;
  }

  // ============ EXPORT ============

  async exportFeedbackData(options = {}) {
    const { format = 'json', timeRange = '1year', filters = {} } = options;

    const query = { ...filters, createdAt: { $gte: moment().subtract(1, 'year').toDate() } };

    const feedback = await Feedback.find(query)
      .populate('patientId', 'name email')
      .populate('providerId', 'name email role')
      .populate('sessionId')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      return this.convertToCSV(feedback);
    }

    return JSON.stringify(feedback, null, 2);
  }

  convertToCSV(feedback) {
    const headers = [
      'Date',
      'Patient Name',
      'Provider Name',
      'Therapy Type',
      'Overall Satisfaction',
      'Treatment Effectiveness',
      'Patient Care',
      'Recommendation Score',
      'Overall Improvement',
      'Status',
    ];

    const rows = feedback.map((fb) => [
      moment(fb.createdAt).format('YYYY-MM-DD'),
      fb.patientId?.name || 'Anonymous',
      fb.providerId?.name || 'N/A',
      fb.therapyType,
      fb.ratings.overallSatisfaction,
      fb.ratings.treatmentEffectiveness,
      fb.ratings.patientCare,
      fb.recommendationScore,
      fb.overallImprovement,
      fb.status,
    ]);

    return [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n');
  }
}

module.exports = new FeedbackService();
