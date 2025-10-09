// services/therapist.service.js
const Therapist = require('../models/Therapist');
const TreatmentPlan = require('../models/TherapyPlan');
const User = require('../models/User');
const NotificationService = require('../services/notification.service');

class TherapistService {
  
  // Create new therapist profile
  async createTherapist(data) {
    try {
      // Check if user exists and has appropriate role
      const user = await User.findById(data.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if therapist profile already exists
      const existingTherapist = await Therapist.findOne({ userId: data.userId });
      if (existingTherapist) {
        throw new Error('Therapist profile already exists for this user');
      }
      
      const therapist = new Therapist(data);
      return await therapist.save();
    } catch (error) {
      throw error;
    }
  }

  // Get therapist by ID
  async getTherapistById(id) {
    try {
      return await Therapist.findById(id)
        .populate('userId', 'name phone email location address');
    } catch (error) {
      throw error;
    }
  }

  // Get therapist by user ID
  async getTherapistByUserId(userId) {
    try {
      return await Therapist.findOne({ userId })
        .populate('userId', 'name phone email location address');
    } catch (error) {
      throw error;
    }
  }

  // Update therapist profile
  async updateTherapist(id, updateData) {
    try {
      updateData.updatedAt = new Date();
      return await Therapist.findByIdAndUpdate(id, updateData, { 
        new: true,
        runValidators: true 
      }).populate('userId', 'name phone email location address');
    } catch (error) {
      throw error;
    }
  }

  // Search therapists with filters
  async searchTherapists(filters = {}) {
    try {
      const query = { 
        isActive: true, 
        verificationStatus: 'approved' 
      };
      
      // Filter by therapy type
      if (filters.therapy) {
        query['certifications.therapy'] = filters.therapy;
      }
      
      // Filter by specialization
      if (filters.specialization) {
        query.specialization = { $in: [filters.specialization] };
      }
      
      // Filter by minimum experience
      if (filters.minExperience) {
        query.experienceYears = { $gte: parseInt(filters.minExperience) };
      }
      
      // Filter by minimum rating
      if (filters.minRating) {
        query['metrics.averageRating'] = { $gte: parseFloat(filters.minRating) };
      }
      
      // Filter by location/city
      if (filters.city) {
        query['userId.address.city'] = new RegExp(filters.city, 'i');
      }
      
      return await Therapist.find(query)
        .populate('userId', 'name phone email location address')
        .sort({ 
          'metrics.averageRating': -1, 
          experienceYears: -1 
        })
        .limit(parseInt(filters.limit) || 20);
    } catch (error) {
      throw error;
    }
  }

  // Update therapist availability
  async updateAvailability(therapistId, availabilityData) {
    try {
      return await Therapist.findByIdAndUpdate(
        therapistId, 
        { 
          availability: availabilityData,
          updatedAt: new Date()
        }, 
        { new: true }
      ).populate('userId', 'name phone email location address');
    } catch (error) {
      throw error;
    }
  }

  // Create treatment plan with notifications
  async createTreatmentPlan(data, doctorId) {
    try {
      const {
        patientId,
        consultationId,
        treatmentType,
        treatmentPlan,
        duration,
        scheduledDate,
        scheduledTime,
        preInstructions,
        postInstructions,
        notes,
        therapistId
      } = data;

      // 1. Create treatment plan
      const treatmentPlanData = await TreatmentPlan.create({
        patientId,
        consultationId,
        doctorId,
        therapistId,
        treatmentType,
        treatmentPlan,
        duration,
        scheduledFor: scheduledDate && scheduledTime 
          ? new Date(`${scheduledDate}T${scheduledTime}`)
          : null,
        preInstructions,
        postInstructions,
        notes,
        status: 'active'
      });

      // 2. Get patient details for notifications
      const patient = await User.findById(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // 3. Schedule notifications if enabled and instructions exist
      const notificationResults = {};
      
      if (preInstructions && preInstructions.trim()) {
        try {
          await NotificationService.sendPreTherapyInstructions({
            patientEmail: patient.email,
            patientName: patient.name,
            therapyType: treatmentType,
            scheduledAt: treatmentPlanData.scheduledFor
          });
          notificationResults.preInstructionsSent = true;
        } catch (error) {
          console.error('Error sending pre-therapy instructions:', error);
          notificationResults.preInstructionsSent = false;
        }
      }

      if (postInstructions && postInstructions.trim()) {
        try {
          await NotificationService.sendPostTherapyCare({
            patientEmail: patient.email,
            patientName: patient.name,
            therapyType: treatmentType
          });
          notificationResults.postInstructionsSent = true;
        } catch (error) {
          console.error('Error sending post-therapy care:', error);
          notificationResults.postInstructionsSent = false;
        }
      }

      return {
        success: true,
        treatmentPlan: treatmentPlanData,
        notifications: notificationResults
      };
    } catch (error) {
      throw error;
    }
  }

  // Get assigned treatment plans for therapist
  async getAssignedTreatmentPlans(therapistId, filters = {}) {
    try {
      const query = { therapistId };
      
      // Add status filter if provided
      if (filters.status) {
        query.status = filters.status;
      }
      
      // Add date range filter if provided
      if (filters.startDate && filters.endDate) {
        query.scheduledFor = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const treatmentPlans = await TreatmentPlan.find(query)
        .populate('patientId', 'name email phone')
        .populate('doctorId', 'name specializations')
        .populate('consultationId')
        .sort({ scheduledFor: -1 })
        .limit(parseInt(filters.limit) || 50);

      return treatmentPlans;
    } catch (error) {
      throw error;
    }
  }

  // Update treatment plan progress
  async updateTreatmentProgress(treatmentPlanId, progressData) {
    try {
      const { progressStatus, progressNotes, lastUpdatedBy } = progressData;
      
      const updatedPlan = await TreatmentPlan.findByIdAndUpdate(
        treatmentPlanId,
        {
          progressStatus,
          progressNotes,
          lastUpdatedBy,
          lastUpdatedAt: new Date()
        },
        { new: true }
      ).populate('patientId', 'name email phone')
       .populate('doctorId', 'name')
       .populate('therapistId', 'name');

      if (!updatedPlan) {
        throw new Error('Treatment plan not found');
      }

      // Send progress notification to doctor and patient
      try {
        await NotificationService.sendProgressUpdate({
          doctorEmail: updatedPlan.doctorId.email,
          patientEmail: updatedPlan.patientId.email,
          patientName: updatedPlan.patientId.name,
          therapistName: lastUpdatedBy,
          treatmentType: updatedPlan.treatmentType,
          progressStatus,
          progressNotes
        });
      } catch (notificationError) {
        console.error('Error sending progress notification:', notificationError);
      }

      return {
        success: true,
        treatmentPlan: updatedPlan
      };
    } catch (error) {
      throw error;
    }
  }

  // Get therapist statistics
  async getTherapistStats(therapistId, period = '30d') {
    try {
      const therapist = await Therapist.findById(therapistId);
      if (!therapist) {
        throw new Error('Therapist not found');
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get treatment plans for the period
      const treatmentPlans = await TreatmentPlan.find({
        therapistId,
        createdAt: { $gte: startDate }
      });

      const stats = {
        totalTreatmentPlans: treatmentPlans.length,
        completedTreatments: treatmentPlans.filter(p => p.status === 'completed').length,
        activeTreatments: treatmentPlans.filter(p => p.status === 'active').length,
        averageRating: therapist.metrics.averageRating,
        totalSessions: therapist.metrics.totalSessions,
        completionRate: treatmentPlans.length > 0 
          ? Math.round((treatmentPlans.filter(p => p.status === 'completed').length / treatmentPlans.length) * 100)
          : 0
      };

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Delete therapist (soft delete)
  async deleteTherapist(id) {
    try {
      return await Therapist.findByIdAndUpdate(
        id,
        { 
          isActive: false,
          updatedAt: new Date()
        },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Get therapist profile with detailed metrics
  async getDetailedProfile(therapistId) {
    try {
      const therapist = await Therapist.findById(therapistId)
        .populate('userId', 'name email phone address location');

      if (!therapist) {
        throw new Error('Therapist not found');
      }

      // Get recent treatment plans
      const recentTreatments = await TreatmentPlan.find({ therapistId })
        .populate('patientId', 'name')
        .populate('doctorId', 'name')
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        therapist,
        recentTreatments,
        metrics: therapist.metrics
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TherapistService();
