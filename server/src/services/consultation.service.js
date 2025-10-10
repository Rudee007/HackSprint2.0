// src/services/consultation.service.js
const Consultation = require('../models/Consultation');

class ConsultationService {
  
  // ============ CORE CRUD OPERATIONS ============
  
  async createConsultation(data) {
    // Validate consultation data
    this.validateConsultationData(data);
    
    // Check provider availability
    await this.checkProviderAvailability(data.providerId, data.scheduledAt);
    
    const consultation = new Consultation(data);
    const savedConsultation = await consultation.save();
    
    // Return populated consultation
    return await this.getConsultationById(savedConsultation._id);
  }

  async getConsultationById(id) {
    return await Consultation.findById(id)
      .populate('patientId', 'name phone email profile')
      .populate('providerId', 'name phone email role specialization experience');
  }

  // ✅ NEW: Get all consultations (for admin)
  async getAllConsultations(filter = {}, options = {}) {
    try {
      const consultations = await Consultation.find(filter)
        .populate('patientId', 'name email phone')
        .populate('providerId', 'name email role specialization')
        .sort(options.sort || { scheduledAt: -1 })
        .limit(options.limit || 20)
        .skip(options.skip || 0)
        .lean();

      return consultations;
    } catch (error) {
      console.error('Error getting all consultations:', error);
      throw error;
    }
  }

  // ✅ NEW: Count all consultations (for admin pagination)
  async countAllConsultations(filter = {}) {
    try {
      return await Consultation.countDocuments(filter);
    } catch (error) {
      console.error('Error counting consultations:', error);
      throw error;
    }
  }

  async getConsultationsByPatient(patientId, options = {}) {
    const { status, limit = 20, skip = 0 } = options;
    const query = { patientId };
    
    if (status) {
      query.status = status;
    }
    
    return await Consultation.find(query)
      .populate('providerId', 'name phone email role')
      .sort({ scheduledAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  async getConsultationsByProvider(providerId, options = {}) {
    const { providerType, status, limit = 20, skip = 0 } = options;
    const query = { providerId };
    
    if (providerType) {
      query.providerType = providerType;
    }
    
    if (status) {
      query.status = status;
    }
    
    return await Consultation.find(query)
      .populate('patientId', 'name phone email profile')
      .sort({ scheduledAt: 1 })
      .limit(limit)
      .skip(skip);
  }

  async getUpcomingConsultations(providerId) {
    return await Consultation.find({
      providerId,
      scheduledAt: { $gte: new Date() },
      status: 'scheduled'
    })
    .populate('patientId', 'name phone email')
    .sort({ scheduledAt: 1 });
  }

  async updateConsultation(id, updateData) {
    // Validate status transitions
    if (updateData.status) {
      await this.validateStatusTransition(id, updateData.status);
    }
    
    updateData.updatedAt = new Date();
    
    return await Consultation.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true
    })
    .populate('patientId', 'name phone email')
    .populate('providerId', 'name phone email role');
  }

  async deleteConsultation(id) {
    return await Consultation.findByIdAndDelete(id);
  }

  async cancelConsultation(id, reason = '') {
    const consultation = await Consultation.findById(id);
    
    if (!consultation) {
      throw new Error('Consultation not found');
    }
    
    if (!consultation.canBeCancelled()) {
      throw new Error('Consultation cannot be cancelled (less than 2 hours before scheduled time)');
    }
    
    return await this.updateConsultation(id, {
      status: 'cancelled',
      notes: consultation.notes + (reason ? `\nCancellation reason: ${reason}` : '')
    });
  }

  // ✅ NEW: Get provider booked slots (for availability checking)
  async getProviderBookedSlots(providerIds, startDate, endDate) {
    try {
      const bookings = await Consultation.find({
        providerId: { $in: providerIds },
        scheduledAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['scheduled', 'rescheduled'] }
      })
        .select('providerId scheduledAt duration')
        .lean();

      // Group by provider
      const bookedByProvider = {};
      bookings.forEach(booking => {
        const providerId = booking.providerId.toString();
        if (!bookedByProvider[providerId]) {
          bookedByProvider[providerId] = [];
        }
        bookedByProvider[providerId].push({
          scheduledAt: booking.scheduledAt,
          duration: booking.duration || 30
        });
      });

      return bookedByProvider;
    } catch (error) {
      console.error('Error getting booked slots:', error);
      throw error;
    }
  }

  // ============ VALIDATION METHODS ============

  validateConsultationData(data) {
    // Future date validation
    if (new Date(data.scheduledAt) <= new Date()) {
      throw new Error('Consultation must be scheduled for a future time');
    }
    
    // Fee validation
    if (data.fee <= 0) {
      throw new Error('Consultation fee must be positive');
    }
    
    // Provider type validation
    if (!['doctor', 'therapist'].includes(data.providerType)) {
      throw new Error('Provider type must be either doctor or therapist');
    }
    
    // Video consultation validation
    if (data.type === 'video' && (!data.meetingLink || !data.meetingLink.trim())) {
      throw new Error('Meeting link is required for video consultations');
    }
    
    // Validate meeting link format for video
    if (data.type === 'video' && data.meetingLink) {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(data.meetingLink)) {
        throw new Error('Meeting link must be a valid URL');
      }
    }
  }

  async checkProviderAvailability(providerId, scheduledAt) {
    const buffer = 30 * 60 * 1000; // 30 minutes buffer
    const startWindow = new Date(new Date(scheduledAt).getTime() - buffer);
    const endWindow = new Date(new Date(scheduledAt).getTime() + buffer);
    
    const conflictingConsultation = await Consultation.findOne({
      providerId,
      scheduledAt: {
        $gte: startWindow,
        $lte: endWindow
      },
      status: { $nin: ['cancelled', 'completed'] }
    });
    
    if (conflictingConsultation) {
      throw new Error('Provider is not available at the selected time');
    }
  }

  async validateStatusTransition(consultationId, newStatus) {
    const consultation = await Consultation.findById(consultationId);
    
    if (!consultation) {
      throw new Error('Consultation not found');
    }
    
    const validTransitions = {
      'scheduled': ['in_progress', 'cancelled', 'rescheduled'], // ✅ Added rescheduled
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // Cannot change from completed
      'cancelled': [],  // Cannot change from cancelled
      'rescheduled': ['scheduled', 'cancelled'] // ✅ Added rescheduled state
    };
    
    if (!validTransitions[consultation.status]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${consultation.status} to ${newStatus}`);
    }
  }

  // ============ STATISTICS ============

  async getConsultationStats(providerId, startDate, endDate) {
    const matchStage = {
      providerId: providerId
    };

    if (startDate || endDate) {
      matchStage.scheduledAt = {};
      if (startDate) matchStage.scheduledAt.$gte = new Date(startDate);
      if (endDate) matchStage.scheduledAt.$lte = new Date(endDate);
    }
    
    const stats = await Consultation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$fee' },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);
    
    // Transform to more readable format
    const formattedStats = {
      total: 0,
      completed: 0,
      cancelled: 0,
      scheduled: 0,
      totalRevenue: 0,
      averageRating: 0
    };

    stats.forEach(stat => {
      formattedStats.total += stat.count;
      formattedStats[stat._id] = stat.count;
      formattedStats.totalRevenue += stat.totalRevenue || 0;
      if (stat.averageRating) {
        formattedStats.averageRating = stat.averageRating;
      }
    });

    // Calculate completion rate
    if (formattedStats.total > 0) {
      formattedStats.completionRate = ((formattedStats.completed / formattedStats.total) * 100).toFixed(2);
      formattedStats.cancellationRate = ((formattedStats.cancelled / formattedStats.total) * 100).toFixed(2);
    }

    return formattedStats;
  }

  async countConsultationsByPatient(patientId, query = {}) {
    return await Consultation.countDocuments({ patientId, ...query });
  }

  async countConsultationsByProvider(providerId, query = {}) {
    return await Consultation.countDocuments({ providerId, ...query });
  }

  // ✅ NEW: Search consultations (for admin)
  async searchConsultations(searchTerm, filters = {}) {
    try {
      const query = { ...filters };
      
      if (searchTerm) {
        // Note: This requires populated fields or text index
        query.$or = [
          { 'patientId.name': { $regex: searchTerm, $options: 'i' } },
          { 'providerId.name': { $regex: searchTerm, $options: 'i' } }
        ];
      }

      const consultations = await Consultation.find(query)
        .populate('patientId', 'name email phone')
        .populate('providerId', 'name email role')
        .sort({ scheduledAt: -1 })
        .limit(50)
        .lean();

      return consultations;
    } catch (error) {
      console.error('Error searching consultations:', error);
      throw error;
    }
  }
}

module.exports = new ConsultationService();
