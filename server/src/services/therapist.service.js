// services/therapist.service.js
const Therapist = require('../models/Therapist');
const TreatmentPlan = require('../models/TreatmentPlan');
const User = require('../models/User');
const NotificationService = require('../services/notification.service');
const Consultation = require('../models/Consultation'); // ✅ Use Consultation, not TherapySession
const websocketService = require('../services/websocket.service');
const mongoose = require('mongoose');
class TherapistService {
  

  async getTodaySessions(therapistId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sessions = await Consultation.find({
        providerId: therapistId,
        providerType: 'therapist',
        sessionType: 'therapy', // ✅ Filter for therapy sessions
        scheduledAt: { $gte: today, $lt: tomorrow }
      })
        .populate('patientId', 'name email phone age gender profile')
        .populate('therapyData.treatmentPlanId', 'therapyType duration dailyProcedures preInstructions')
        .populate('therapyData.doctorId', 'name specialization phone')
        .sort({ scheduledAt: 1 });

      return sessions;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🔥 Get all sessions for a specific patient
   * CRITICAL: Your key requirement!
   */
  async getPatientSessions(therapistId, patientId) {
    try {
      const sessions = await Consultation.find({
        providerId: therapistId,
        providerType: 'therapist',
        sessionType: 'therapy',
        patientId
      })
        .populate('therapyData.treatmentPlanId', 'therapyType duration dailyProcedures')
        .populate('therapyData.doctorId', 'name specialization')
        .sort({ scheduledAt: -1 });

      // Get patient details
      const patient = await User.findById(patientId);

      return {
        patient,
        sessions,
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        upcomingSessions: sessions.filter(s => s.status === 'scheduled').length,
        inProgressSessions: sessions.filter(s => s.status === 'in_progress').length
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🔴 Start therapy session (REAL-TIME)
   * ✅ Updates both sessionStatus AND status
   * ✅ Broadcasts to WebSocket
   * ✅ Creates statusHistory entry
   */
  async startTherapySession(sessionId, therapistId, startNotes) {
    try {
      const session = await Consultation.findById(sessionId)
        .populate('patientId', 'name email phone')
        .populate('therapyData.doctorId', 'name email');
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.providerId.toString() !== therapistId.toString()) {
        throw new Error('Not authorized to start this session');
      }

      // ✅ Update BOTH status fields
      session.status = 'in_progress';
      session.sessionStatus = 'in_progress';
      session.sessionStartTime = new Date();
      
      // ✅ Add to session notes
      session.sessionNotes.push({
        timestamp: new Date(),
        note: startNotes || 'Session started',
        addedBy: therapistId,
        type: 'progress'
      });

      // ✅ Add to status history
      session.statusHistory.push({
        status: 'in_progress',
        timestamp: new Date(),
        updatedBy: therapistId,
        reason: 'Session started',
        previousStatus: session.status
      });

      // ✅ Add therapist to active participants
      const therapistAlreadyJoined = session.activeParticipants.some(
        p => p.userId.toString() === therapistId.toString()
      );
      
      if (!therapistAlreadyJoined) {
        session.activeParticipants.push({
          userId: therapistId,
          joinedAt: new Date(),
          role: 'therapist',
          isActive: true
        });
      }

      // ✅ Update session metadata
      session.sessionMetadata.lastActivity = new Date();

      await session.save();

      // ✅ Real-time WebSocket broadcast
      websocketService.emit('session:started', {
        sessionId: session._id,
        patientId: session.patientId._id,
        therapistId,
        doctorId: session.therapyData?.doctorId?._id,
        timestamp: new Date(),
        sessionData: {
          therapyType: session.therapyData?.therapyType,
          patientName: session.patientId.name,
          startTime: session.sessionStartTime
        }
      });

      // ✅ Send notifications
      await NotificationService.sendSessionStartNotification({
        doctorEmail: session.therapyData?.doctorId?.email,
        patientEmail: session.patientId.email,
        patientName: session.patientId.name,
        therapyType: session.therapyData?.therapyType,
        startTime: session.sessionStartTime
      });

      return session;
    } catch (error) {
      throw error;
    }
  }

  /**
   * ✅ Complete therapy session (REAL-TIME with vitals & observations)
   * ✅ Updates Consultation with therapy data
   * ✅ Broadcasts to all stakeholders
   */
  async completeTherapySession(sessionId, therapistId, completionData) {
    try {
      const { 
        vitals, 
        observations, 
        adverseEffects, 
        materialsUsed,
        sessionNotes,
        patientFeedback,
        nextSessionPrep
      } = completionData;
      
      const session = await Consultation.findById(sessionId)
        .populate('patientId', 'name email phone')
        .populate('therapyData.doctorId', 'name email');
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.providerId.toString() !== therapistId.toString()) {
        throw new Error('Not authorized to complete this session');
      }

      // Calculate duration
      const duration = session.sessionStartTime 
        ? Math.floor((new Date() - session.sessionStartTime) / 60000)
        : 0;

      // ✅ Update status fields
      session.status = 'completed';
      session.sessionStatus = 'completed';
      session.sessionEndTime = new Date();
      session.actualDuration = duration;

      // ✅ Update therapy-specific data
      if (!session.therapyData) {
        session.therapyData = {};
      }

      session.therapyData.vitals = vitals;
      session.therapyData.observations = observations;
      session.therapyData.adverseEffects = adverseEffects || [];
      session.therapyData.materialsUsed = materialsUsed || [];
      session.therapyData.patientFeedback = patientFeedback;
      session.therapyData.nextSessionPrep = nextSessionPrep;

      // ✅ Add completion note
      session.sessionNotes.push({
        timestamp: new Date(),
        note: sessionNotes || 'Session completed successfully',
        addedBy: therapistId,
        type: 'progress'
      });

      // ✅ Add to status history
      session.statusHistory.push({
        status: 'completed',
        timestamp: new Date(),
        updatedBy: therapistId,
        reason: 'Session completed',
        previousStatus: 'in_progress'
      });

      // ✅ Update session metadata
      session.sessionMetadata.lastActivity = new Date();

      await session.save();

      // ✅ Real-time WebSocket broadcast
      websocketService.emit('session:completed', {
        sessionId: session._id,
        patientId: session.patientId._id,
        therapistId,
        doctorId: session.therapyData?.doctorId?._id,
        vitals,
        observations,
        adverseEffects,
        duration,
        timestamp: new Date()
      });

      // ✅ Send notifications to all stakeholders
      await Promise.all([
        NotificationService.sendSessionCompletionNotification({
          patientEmail: session.patientId.email,
          patientName: session.patientId.name,
          therapyType: session.therapyData?.therapyType,
          duration,
          observations
        }),
        NotificationService.sendSessionReportToDoctor({
          doctorEmail: session.therapyData?.doctorId?.email,
          patientName: session.patientId.name,
          therapyType: session.therapyData?.therapyType,
          vitals,
          observations,
          adverseEffects
        })
      ]);

      return session;
    } catch (error) {
      throw error;
    }
  }
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
      return await User.findById(id)
        .populate('userId', 'name phone email location address');
    } catch (error) {
      throw error;
    }
  }

  // Get therapist by user ID
  // async getTherapistByUserId(userId) {
  //   try {
  //     return await User.findOne({ userId })
  //       .populate('userId', 'name phone email location address');
  //   } catch (error) {
  //     throw error;
  //   }
  // }

      async getTherapistByUserId(userId) {
        try {
          const therapist = await Therapist.findOne({ userId })
            .populate('userId', 'name email phone location');
          
          return therapist;
          
        } catch (error) {
          logger.error('Get doctor by user ID error:', error);
          throw error;
        }
      }
    
  // Update therapist profile
// Service: therapist.service.js

async updateTherapist(therapistId, updateData) {
  try {
    console.log('🔧 [SERVICE] Updating therapist:', therapistId);
    console.log('📦 [SERVICE] Update data:', JSON.stringify(updateData, null, 2));
    
    // ✅ Set updatedAt timestamp
    updateData.updatedAt = new Date();
    
    // ✅ Update therapist with validation
    const therapist = await Therapist.findByIdAndUpdate(
      therapistId, 
      updateData, 
      { 
        new: true,              // Return updated document
        runValidators: true,    // Run schema validators
        context: 'query'        // Enable update validators
      }
    ).populate('userId', 'name phone email location address');
    
    if (!therapist) {
      console.error('❌ [SERVICE] Therapist not found:', therapistId);
      throw new Error('Therapist not found');
    }
    
    console.log('✅ [SERVICE] Therapist updated successfully');
    return therapist;
    
  } catch (error) {
    console.error('❌ [SERVICE] Update error:', error);
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
// Get therapist statistics
async getTherapistStats(therapistId, period = '30d') {
  try {
    console.log('🔍 [SERVICE] getTherapistStats:', { therapistId, period });
    
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      throw new Error('Therapist not found');
    }

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

    console.log('📅 [SERVICE] Date range:', {
      from: startDate.toISOString(),
      to: now.toISOString()
    });

    // 🔥 FIX: Query CONSULTATION collection, not TreatmentPlan!
    const sessions = await Consultation.find({
      providerId: therapistId,
      providerType: 'therapist',
      sessionType: 'therapy',
      createdAt: { $gte: startDate }
    });

    console.log('📊 [SERVICE] Sessions found for stats:', sessions.length);
    console.log('📊 [SERVICE] Session statuses:', {
      completed: sessions.filter(s => s.status === 'completed').length,
      inProgress: sessions.filter(s => s.status === 'in_progress').length,
      scheduled: sessions.filter(s => s.status === 'scheduled').length,
      cancelled: sessions.filter(s => s.status === 'cancelled').length
    });

    const stats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      activeSessions: sessions.filter(s => s.status === 'in_progress').length,
      scheduledSessions: sessions.filter(s => s.status === 'scheduled').length,
      cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
      averageRating: therapist.metrics?.averageRating || 0,
      totalFeedback: therapist.metrics?.totalReviews || 0,
      completionRate: sessions.length > 0 
        ? Math.round((sessions.filter(s => s.status === 'completed').length / sessions.length) * 100)
        : 0
    };

    console.log('📊 [SERVICE] Stats calculated:', stats);
    return stats;
  } catch (error) {
    console.error('❌ [SERVICE] getTherapistStats error:', error);
    throw error;
  }
}

// src/services/treatmentPlan.service.js or therapist.service.js

/**
 * Get treatment plans for a patient (for therapist view)
 * Therapists see treatment plans created by doctors for their patients
 */
async getPatientTreatmentPlans(patientId) {
  console.log('🔥 [SERVICE] getPatientTreatmentPlans called for patient:', patientId);
  
  try {
    const TreatmentPlan = mongoose.model('TreatmentPlan');
    
    const treatmentPlans = await TreatmentPlan.find({ 
      patientId 
    })
    .populate('patientId', 'name email phone profile')
    .populate('consultationId', 'type scheduledAt status notes')
    .populate('doctorId', 'userId name specialization')
    .sort({ createdAt: -1 }); // Most recent first

    console.log('✅ [SERVICE] Found treatment plans:', treatmentPlans.length);

    return treatmentPlans;
    
  } catch (error) {
    console.error('❌ [SERVICE] Get patient treatment plans error:', error);
    throw error;
  }
}

/**
 * Get single treatment plan details (for therapist view)
 */
async getTreatmentPlanDetailsForTherapist(treatmentPlanId, patientId) {
  console.log('🔥 [SERVICE] getTreatmentPlanDetailsForTherapist called');
  console.log('Treatment Plan ID:', treatmentPlanId);
  console.log('Patient ID:', patientId);
  
  try {
    const TreatmentPlan = mongoose.model('TreatmentPlan');
    
    const treatmentPlan = await TreatmentPlan.findOne({ 
      _id: treatmentPlanId, 
    })
    .populate('patientId', 'name email phone profile dateOfBirth gender')
    .populate('consultationId', 'type scheduledAt status notes')
    .populate('doctorId', 'userId name specialization experience');

    if (!treatmentPlan) {
      throw new Error('Treatment plan not found for this patient');
    }

    console.log('✅ [SERVICE] Treatment plan found:', treatmentPlan._id);

    return treatmentPlan;
    
  } catch (error) {
    console.error('❌ [SERVICE] Get treatment plan details error:', error);
    throw error;
  }
}

/**
 * Update treatment plan progress (therapist updates progress as they execute)
 */
async updateTreatmentPlanProgress(treatmentPlanId, progressData) {
  console.log('🔥 [SERVICE] updateTreatmentPlanProgress called');
  
  try {
    const TreatmentPlan = mongoose.model('TreatmentPlan');
    
    const treatmentPlan = await TreatmentPlan.findByIdAndUpdate(
      treatmentPlanId,
      {
        $set: {
          progress: progressData.progress,
          status: progressData.status,
          notes: progressData.notes,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    )
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name');

    if (!treatmentPlan) {
      throw new Error('Treatment plan not found');
    }

    console.log('✅ [SERVICE] Treatment plan progress updated');

    return treatmentPlan;
    
  } catch (error) {
    console.error('❌ [SERVICE] Update treatment plan progress error:', error);
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