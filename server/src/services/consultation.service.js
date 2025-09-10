const Consultation = require('../models/Consultation');

class ConsultationService {
  
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
      .populate('providerId', 'name phone email role');
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
      'scheduled': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // Cannot change from completed
      'cancelled': []  // Cannot change from cancelled
    };
    
    if (!validTransitions[consultation.status].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${consultation.status} to ${newStatus}`);
    }
  }

  async getConsultationStats(providerId, startDate, endDate) {
    const matchStage = {
      providerId: providerId,
      scheduledAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
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
    
    return stats;
  }

  async countConsultationsByPatient(patientId, query = {}) {
    return await Consultation.countDocuments({ patientId, ...query });
  }

  async countConsultationsByProvider(providerId, query = {}) {
    return await Consultation.countDocuments({ providerId, ...query });
  }
}

module.exports = new ConsultationService();
