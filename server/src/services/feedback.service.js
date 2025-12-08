const Feedback = require('../models/Feedback');
const moment = require('moment');

class FeedbackService {
  
  // ============ CORE CRUD OPERATIONS ============
  
  async createFeedback(feedbackData) {
    const feedback = new Feedback(feedbackData);
    await feedback.save();
    
    return await Feedback.findById(feedback._id)
      .populate('patientId', 'name email')
      .populate('providerId', 'name email role')
      .populate('sessionId', 'scheduledAt therapyType');
  }

  async getPatientFeedback(patientId, options = {}) {
    const { page = 1, limit = 10, timeRange } = options;
    const skip = (page - 1) * limit;
    
    let dateFilter = {};
    if (timeRange) {
      dateFilter.createdAt = { $gte: moment().subtract(timeRange).toDate() };
    }

    const [feedback, total] = await Promise.all([
      Feedback.find({ patientId, ...dateFilter })
        .populate('providerId', 'name email role')
        .populate('sessionId', 'scheduledAt therapyType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments({ patientId, ...dateFilter })
    ]);

    return {
      feedback,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalFeedback: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    };
  }

  async getSessionFeedback(sessionId, patientId = null) {
    const filter = { sessionId };
    if (patientId) filter.patientId = patientId;

    return await Feedback.findOne(filter)
      .populate('patientId', 'name email')
      .populate('providerId', 'name email role')
      .populate('sessionId', 'scheduledAt therapyType');
  }

  async updateFeedback(feedbackId, updateData, userId) {
    // Check if feedback belongs to user and is within 24 hours
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }
    
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

  // ============ PROVIDER OPERATIONS ============
  
  async getProviderFeedback(providerId, options = {}) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔥 [FeedbackService] getProviderFeedback called');
    console.log('📊 providerId:', providerId.toString());
    
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    const providerIdString = providerId.toString();
    
    // ✅ REMOVE DATE FILTER FOR NOW (testing)
    // const dateFilter = { createdAt: { $gte: moment().subtract(3, 'months').toDate() } };
    const dateFilter = {};  // ← NO DATE FILTER
    
    console.log('🔍 Query: { providerId: "' + providerIdString + '" }');
    
    try {
      const [feedback, total, avgRating] = await Promise.all([
        Feedback.find({ providerId: providerIdString, ...dateFilter })
          .populate('patientId', 'name')
          .populate('sessionId', 'scheduledAt therapyType')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        
        Feedback.countDocuments({ providerId: providerIdString, ...dateFilter }),
        
        Feedback.aggregate([
          { $match: { providerId: providerIdString, ...dateFilter } },
          { $group: { 
            _id: null, 
            avgOverall: { $avg: '$ratings.overallSatisfaction' },
            avgEffectiveness: { $avg: '$ratings.treatmentEffectiveness' },
            avgCare: { $avg: '$ratings.patientCare' }
          }}
        ])
      ]);
      
      console.log('✅ Found:', feedback.length, 'feedback items');
      console.log('✅ Average rating:', avgRating[0]?.avgOverall || 0);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      return {
        feedback,
        averageRatings: avgRating[0] || {
          avgOverall: 0,
          avgEffectiveness: 0,
          avgCare: 0
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalFeedback: total
        }
      };
      
    } catch (error) {
      console.error('❌ ERROR:', error);
      throw error;
    }
  }
  
  
  async getAllFeedback(options = {}) {
    const { filters = {}, page = 1, limit = 20, timeRange = '1month' } = options;
    const skip = (page - 1) * limit;
    
    const dateFilter = {
      createdAt: { $gte: moment().subtract(1, 'month').toDate() }
    };

    const query = { ...filters, ...dateFilter };

    const [feedback, total] = await Promise.all([
      Feedback.find(query)
        .populate('patientId', 'name email')
        .populate('providerId', 'name email role')
        .populate('sessionId', 'scheduledAt therapyType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(query)
    ]);

    return {
      feedback,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalFeedback: total
      }
    };
  }

  async respondToFeedback(feedbackId, responseData) {
    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { 
        adminResponse: responseData,
        status: 'responded'
      },
      { new: true }
    ).populate('patientId', 'name email');

    return feedback;
  }

  async flagFeedback(feedbackId, flagType, reason) {
    const update = {};
    update[`flags.${flagType}`] = true;
    
    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      update,
      { new: true }
    );

    return feedback;
  }
  async getFeedbackRequiringAttention() {
    try {
      console.log('🔍 Getting attention-required feedback...');
  
      const criticalFeedback = await Feedback.find({
        $or: [
          { 'flags.requiresAttention': true },
          { 'flags.criticalFeedback': true },
          { 'flags.hasComplaint': true },
          { status: 'pending' }
        ]
      })
        .populate('patientId', 'name email phone')
        .populate('providerId', 'name email role')
        .populate('sessionId', 'sessionType startTime')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
  
      console.log('✅ Found critical feedback:', criticalFeedback.length);
  
      // ✅ Return as array directly
      return criticalFeedback;
    } catch (error) {
      console.error('❌ Error getting attention-required feedback:', error);
      throw error;
    }
  }
  
  // ============ DATA EXPORT ============
  
  async exportFeedbackData(options = {}) {
    const { format = 'json', timeRange = '1year', filters = {} } = options;
    
    const dateFilter = {
      createdAt: { $gte: moment().subtract(1, 'year').toDate() }
    };

    const feedback = await Feedback.find({ ...filters, ...dateFilter })
      .populate('patientId', 'name email')
      .populate('providerId', 'name email role')
      .populate('sessionId', 'scheduledAt therapyType')
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
      'Status'
    ];

    const rows = feedback.map(fb => [
      moment(fb.createdAt).format('YYYY-MM-DD'),
      fb.patientId?.name || 'Anonymous',
      fb.providerId?.name || 'N/A',
      fb.therapyType,
      fb.ratings.overallSatisfaction,
      fb.ratings.treatmentEffectiveness,
      fb.ratings.patientCare,
      fb.recommendationScore,
      fb.overallImprovement,
      fb.status
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
}

module.exports = new FeedbackService();
