// backend/services/therapist.service.js
// 🔥 COMPLETE REWRITE - SCHEMA ALIGNED

const Therapist = require('../models/Therapist');
const TreatmentPlan = require('../models/TreatmentPlan');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const NotificationService = require('./notification.service');
const websocketService = require('./websocket.service');
const mongoose = require('mongoose');

class TherapistService {
  
  // ═══════════════════════════════════════════════════════════
  // 🔥 SECTION 1: THERAPIST PROFILE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Create new therapist profile
   */
  async createTherapist(data) {
    try {
      // Validate user exists
      const user = await User.findById(data.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if profile already exists
      const existingTherapist = await Therapist.findOne({ userId: data.userId });
      if (existingTherapist) {
        throw new Error('Therapist profile already exists for this user');
      }
      
      // Create therapist with default availability if not provided
      const therapist = new Therapist(data);
      if (!data.availability || Object.keys(data.availability).length === 0) {
        therapist.setDefaultAvailability();
      }
      
      return await therapist.save();
    } catch (error) {
      console.error('❌ [SERVICE] Create therapist error:', error);
      throw error;
    }
  }

  /**
   * Get therapist by ID
   */
  async getTherapistProfile(therapistId) {
    try {
      return await Therapist.findById(therapistId)
        .populate('userId', 'name email phone location address profile');
    } catch (error) {
      console.error('❌ [SERVICE] Get therapist profile by id error:', error);
      throw error;
    }
  }
  

  /**
   * Get therapist by user ID
   */
  async getTherapistByUserId(userId) {
    try {
      return await Therapist.findOne({ userId })
        .populate('userId', 'name email phone location address profile');
    } catch (error) {
      console.error('❌ [SERVICE] Get therapist by user ID error:', error);
      throw error;
    }
  }

  /**
   * Update therapist profile (certifications, specialization, experience, bio, status)
   * Does NOT overwrite availability or metrics.
   */
  async updateTherapist(therapistId, updateData) {
    try {
      console.log('🔧 [SERVICE] Updating therapist:', therapistId);

      // Whitelist fields that belong to Therapist schema profile
      const allowedFields = [
        'certifications',
        'specialization',
        'experienceYears',
        'bio',
        'isActive',
        'verificationStatus'
      ];

      const updatePayload = { updatedAt: new Date() };

      for (const key of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(updateData, key)) {
          updatePayload[key] = updateData[key];
        }
      }

      const therapist = await Therapist.findByIdAndUpdate(
        therapistId,
        updatePayload,
        {
          new: true,
          runValidators: true,
          context: 'query'
        }
      ).populate('userId', 'name phone email location address profile');

      if (!therapist) {
        throw new Error('Therapist not found');
      }

      console.log('✅ [SERVICE] Therapist updated successfully');
      return therapist;
    } catch (error) {
      console.error('❌ [SERVICE] Update therapist error:', error);
      throw error;
    }
  }

  /**
   * Update therapist availability.
   * Accepts the full `availability` object shaped like the schema:
   * { monday: { isAvailable, slots:[{startTime,endTime}] }, ... , workingDays, workingHours, maxPatientsPerDay, sessionDuration }
   */
  async updateAvailability(therapistId, availabilityData) {
    try {
      const update = {
        availability: availabilityData,
        updatedAt: new Date()
      };

      const therapist = await Therapist.findByIdAndUpdate(
        therapistId,
        update,
        {
          new: true,
          runValidators: true,
          context: 'query'
        }
      ).populate('userId', 'name phone email location address');

      if (!therapist) {
        throw new Error('Therapist not found');
      }

      return therapist;
    } catch (error) {
      console.error('❌ [SERVICE] Update availability error:', error);
      throw error;
    }
  }


  async updateUserDetails(userId, updateData) {
    try {
      console.log('🔧 [SERVICE] Updating user details for therapist:', userId);
  
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        {
          new: true,
          runValidators: true,
          context: 'query'
        }
      );
  
      if (!user) {
        throw new Error('User not found for therapist');
      }
  
      console.log('✅ [SERVICE] User details updated successfully');
      return user;
    } catch (error) {
      console.error('❌ [SERVICE] Update user details error:', error);
      throw error;
    }
  }
  /**
   * Search therapists with filters
   */
  async searchTherapists(filters = {}) {
    try {
      const query = { 
        isActive: true, 
        verificationStatus: 'approved' 
      };
      
      if (filters.therapy) {
        query['certifications.therapy'] = filters.therapy;
      }
      
      if (filters.specialization) {
        query.specialization = { $in: [filters.specialization] };
      }
      
      if (filters.minExperience) {
        query.experienceYears = { $gte: parseInt(filters.minExperience) };
      }
      
      if (filters.minRating) {
        query['metrics.averageRating'] = { $gte: parseFloat(filters.minRating) };
      }
      
      return await Therapist.find(query)
        .populate('userId', 'name phone email location address')
        .sort({ 
          'metrics.averageRating': -1, 
          experienceYears: -1 
        })
        .limit(parseInt(filters.limit) || 20);
    } catch (error) {
      console.error('❌ [SERVICE] Search therapists error:', error);
      throw error;
    }
  }

  /**
   * Get detailed therapist profile with metrics
   */
  async getDetailedProfile(therapistId) {
    try {
      const therapist = await Therapist.findById(therapistId)
        .populate('userId', 'name email phone address location profile');

      if (!therapist) {
        throw new Error('Therapist not found');
      }

      // Get recent consultations (not TreatmentPlan!)
      const recentSessions = await Consultation.find({ 
        providerId: therapistId,
        providerType: 'therapist',
        sessionType: 'therapy'
      })
        .populate('patientId', 'name profile')
        .populate('therapyData.doctorId', 'name')
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        therapist,
        recentSessions,
        metrics: therapist.metrics
      };
    } catch (error) {
      console.error('❌ [SERVICE] Get detailed profile error:', error);
      throw error;
    }
  }

  /**
   * Soft delete therapist
   */
  async deleteTherapist(therapistId) {
    try {
      return await Therapist.findByIdAndUpdate(
        therapistId,
        { 
          isActive: false,
          updatedAt: new Date()
        },
        { new: true }
      );
    } catch (error) {
      console.error('❌ [SERVICE] Delete therapist error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 SECTION 2: SESSION MANAGEMENT (CONSULTATIONS)
  // ═══════════════════════════════════════════════════════════

  /**
   * Get today's therapy sessions
   */
  async getTodaySessions(therapistId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sessions = await Consultation.find({
        providerId: therapistId,
        providerType: 'therapist',
        sessionType: 'therapy',
        scheduledAt: { $gte: today, $lt: tomorrow }
      })
        .populate('patientId', 'name email phone age gender profile')
        .populate({
          path: 'therapyData.treatmentPlanId',
          select: 'treatmentName panchakarmaType totalDays phases prePanchakarmaInstructions postPanchakarmaInstructions'
        })
        .populate({
          path: 'therapyData.doctorId',
          populate: { path: 'userId', select: 'name phone' },
          select: 'name specialization phone'
        })
        .sort({ scheduledAt: 1 });

      return sessions;
    } catch (error) {
      console.error('❌ [SERVICE] Get today sessions error:', error);
      throw error;
    }
  }

  /**
   * Get all sessions for a specific patient
   */
  async getPatientSessions(therapistId, patientId) {
    try {
      const sessions = await Consultation.find({
        providerId: therapistId,
        providerType: 'therapist',
        sessionType: 'therapy',
        patientId
      })
        .populate({
          path: 'therapyData.treatmentPlanId',
          select: 'treatmentName panchakarmaType duration phases'
        })
        .populate({
          path: 'therapyData.doctorId',
          populate: { path: 'userId', select: 'name' },
          select: 'name specialization'
        })
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
      console.error('❌ [SERVICE] Get patient sessions error:', error);
      throw error;
    }
  }

  /**
   * Start therapy session
   */
  async startTherapySession(sessionId, therapistId, startNotes) {
    try {
      const session = await Consultation.findById(sessionId)
        .populate('patientId', 'name email phone')
        .populate({
          path: 'therapyData.doctorId',
          populate: { path: 'userId', select: 'name email' }
        });
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.providerId.toString() !== therapistId.toString()) {
        throw new Error('Not authorized to start this session');
      }

      // Update status fields
      const previousStatus = session.status;
      session.status = 'in_progress';
      session.sessionStatus = 'in_progress';
      session.sessionStartTime = new Date();
      
      // Add session note
      session.sessionNotes.push({
        timestamp: new Date(),
        note: startNotes || 'Session started',
        addedBy: therapistId,
        type: 'progress'
      });

      // Add to status history
      session.statusHistory.push({
        status: 'in_progress',
        timestamp: new Date(),
        updatedBy: therapistId,
        reason: 'Session started',
        previousStatus
      });

      // Add therapist to active participants
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

      // Update session metadata
      if (!session.sessionMetadata) {
        session.sessionMetadata = {};
      }
      session.sessionMetadata.lastActivity = new Date();

      await session.save();

      // WebSocket broadcast
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

      // Send notifications
      try {
        await NotificationService.sendSessionStartNotification({
          doctorEmail: session.therapyData?.doctorId?.userId?.email,
          patientEmail: session.patientId.email,
          patientName: session.patientId.name,
          therapyType: session.therapyData?.therapyType,
          startTime: session.sessionStartTime
        });
      } catch (notifError) {
        console.error('⚠️ [SERVICE] Notification error:', notifError);
      }

      return session;
    } catch (error) {
      console.error('❌ [SERVICE] Start session error:', error);
      throw error;
    }
  }

  /**
   * Complete therapy session
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
        .populate({
          path: 'therapyData.doctorId',
          populate: { path: 'userId', select: 'name email' }
        });
      
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

      // Update status
      session.status = 'completed';
      session.sessionStatus = 'completed';
      session.sessionEndTime = new Date();
      session.actualDuration = duration;

      // Update therapy data
      if (!session.therapyData) {
        session.therapyData = {};
      }

      session.therapyData.vitals = vitals;
      session.therapyData.observations = observations;
      session.therapyData.adverseEffects = adverseEffects || [];
      session.therapyData.materialsUsed = materialsUsed || [];
      session.therapyData.nextSessionPrep = nextSessionPrep;
      
      // Patient feedback at root level (as per schema)
      session.patientFeedback = patientFeedback;

      // Add completion note
      session.sessionNotes.push({
        timestamp: new Date(),
        note: sessionNotes || 'Session completed successfully',
        addedBy: therapistId,
        type: 'progress'
      });

      // Add to status history
      session.statusHistory.push({
        status: 'completed',
        timestamp: new Date(),
        updatedBy: therapistId,
        reason: 'Session completed',
        previousStatus: 'in_progress'
      });

      // Update metadata
      if (!session.sessionMetadata) {
        session.sessionMetadata = {};
      }
      session.sessionMetadata.lastActivity = new Date();

      await session.save();

      // WebSocket broadcast
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

      // Send notifications
      try {
        await Promise.all([
          NotificationService.sendSessionCompletionNotification({
            patientEmail: session.patientId.email,
            patientName: session.patientId.name,
            therapyType: session.therapyData?.therapyType,
            duration,
            observations
          }),
          NotificationService.sendSessionReportToDoctor({
            doctorEmail: session.therapyData?.doctorId?.userId?.email,
            patientName: session.patientId.name,
            therapyType: session.therapyData?.therapyType,
            vitals,
            observations,
            adverseEffects
          })
        ]);
      } catch (notifError) {
        console.error('⚠️ [SERVICE] Notification error:', notifError);
      }

      return session;
    } catch (error) {
      console.error('❌ [SERVICE] Complete session error:', error);
      throw error;
    }
  }

  /**
   * Update session progress (real-time)
   */
  async updateSessionProgress(sessionId, therapistId, progressData) {
    try {
      const session = await Consultation.findById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.providerId.toString() !== therapistId.toString()) {
        throw new Error('Not authorized');
      }

      // Add progress update to therapyData
      if (!session.therapyData) {
        session.therapyData = {};
      }
      
      if (!session.therapyData.progressUpdates) {
        session.therapyData.progressUpdates = [];
      }

      session.therapyData.progressUpdates.push({
        timestamp: new Date(),
        stage: progressData.stage,
        notes: progressData.notes,
        percentage: progressData.percentage
      });

      // Update metadata
      if (!session.sessionMetadata) {
        session.sessionMetadata = {};
      }
      session.sessionMetadata.lastActivity = new Date();

      await session.save();

      // WebSocket broadcast
      websocketService.emit('session:progress', {
        sessionId: session._id,
        progress: progressData,
        timestamp: new Date()
      });

      return session;
    } catch (error) {
      console.error('❌ [SERVICE] Update session progress error:', error);
      throw error;
    }
  }

  /**
   * Update vitals
   */
  async updateVitals(sessionId, therapistId, vitals) {
    try {
      const session = await Consultation.findById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.providerId.toString() !== therapistId.toString()) {
        throw new Error('Not authorized');
      }

      // Update vitals
      if (!session.therapyData) {
        session.therapyData = {};
      }

      session.therapyData.vitals = {
        ...session.therapyData.vitals,
        ...vitals
      };

      if (session.therapyData.vitals.bloodPressure) {
        session.therapyData.vitals.bloodPressure.measuredAt = new Date();
      }

      await session.save();

      // WebSocket broadcast
      websocketService.emit('session:vitals', {
        sessionId: session._id,
        vitals,
        timestamp: new Date()
      });

      return session;
    } catch (error) {
      console.error('❌ [SERVICE] Update vitals error:', error);
      throw error;
    }
  }

  /**
   * Update observations
   */
  async updateObservations(sessionId, therapistId, observations) {
    try {
      const session = await Consultation.findById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.providerId.toString() !== therapistId.toString()) {
        throw new Error('Not authorized');
      }

      // Update observations
      if (!session.therapyData) {
        session.therapyData = {};
      }

      session.therapyData.observations = {
        ...session.therapyData.observations,
        ...observations
      };

      // Add timestamp
      if (!session.therapyData.observations.timeOfObservation) {
        session.therapyData.observations.timeOfObservation = [];
      }
      session.therapyData.observations.timeOfObservation.push(new Date());

      await session.save();

      // WebSocket broadcast
      websocketService.emit('session:observation', {
        sessionId: session._id,
        observations,
        timestamp: new Date()
      });

      return session;
    } catch (error) {
      console.error('❌ [SERVICE] Update observations error:', error);
      throw error;
    }
  }

  /**
   * Add adverse effect
   */
  async addAdverseEffect(sessionId, therapistId, adverseEffect) {
    try {
      const session = await Consultation.findById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.providerId.toString() !== therapistId.toString()) {
        throw new Error('Not authorized');
      }

      // Add adverse effect using schema method
      await session.addAdverseEffect(
        adverseEffect.effect,
        adverseEffect.severity,
        adverseEffect.description,
        adverseEffect.actionTaken
      );

      // WebSocket broadcast
      websocketService.emit('session:adverse_effect', {
        sessionId: session._id,
        adverseEffect,
        timestamp: new Date()
      });

      return session;
    } catch (error) {
      console.error('❌ [SERVICE] Add adverse effect error:', error);
      throw error;
    }
  }

  /**
   * Add material used
   */
  async addMaterialUsed(sessionId, therapistId, material) {
    try {
      const session = await Consultation.findById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.providerId.toString() !== therapistId.toString()) {
        throw new Error('Not authorized');
      }

      // Add material
      if (!session.therapyData) {
        session.therapyData = {};
      }

      if (!session.therapyData.materialsUsed) {
        session.therapyData.materialsUsed = [];
      }

      session.therapyData.materialsUsed.push(material);

      await session.save();

      return session;
    } catch (error) {
      console.error('❌ [SERVICE] Add material error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 SECTION 3: TREATMENT PLAN MANAGEMENT
  // ═════════════════════════════════════════════════════════════

  /**
   * Get treatment plans assigned to therapist
   */
  async getAssignedTreatmentPlans(therapistId, filters = {}) {
    try {
      const query = { assignedTherapistId: therapistId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.schedulingStatus) {
        query.schedulingStatus = filters.schedulingStatus;
      }
      
      if (filters.startDate && filters.endDate) {
        query['schedulingPreferences.startDate'] = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const treatmentPlans = await TreatmentPlan.find(query)
        .populate('patientId', 'name email phone profile')
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name phone' }
        })
        .populate('consultationId')
        .sort({ createdAt: -1 })
        .limit(parseInt(filters.limit) || 50);

      return treatmentPlans;
    } catch (error) {
      console.error('❌ [SERVICE] Get assigned treatment plans error:', error);
      throw error;
    }
  }

  /**
   * Get treatment plans for a specific patient
   */
  async getPatientTreatmentPlans(patientId) {
    try {
      const treatmentPlans = await TreatmentPlan.find({ patientId })
        .populate('patientId', 'name email phone profile')
        .populate('consultationId', 'type scheduledAt status notes')
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name phone' },
          select: 'name specialization'
        })
        .populate('assignedTherapistId', 'name specialization')
        .populate('courseTemplateId', 'templateName category')
        .populate('phases.therapySessions.therapyId', 'therapyName therapyType durationMinutes')
        .sort({ createdAt: -1 });
  
      return treatmentPlans;
    } catch (error) {
      console.error('❌ [SERVICE] Get patient treatment plans error:', error);
      throw error;
    }
  }
  

  /**
   * Get single treatment plan details
   */
// services/therapistService.js
async getTreatmentPlanDetailsForTherapist(treatmentPlanId, therapistId) {
  try {
    console.log('🔥 [SERVICE] Fetching treatment plan:', { treatmentPlanId, therapistId });
    
    // 🔥 FULL POPULATION for therapist dashboard
    const treatmentPlan = await TreatmentPlan.findOne({ 
      _id: treatmentPlanId,
      assignedTherapistId: therapistId  // Ownership check
    })
      // Patient details
      .populate('patientId', 'name email phone profile')
      // Doctor details  
      .populate({
        path: 'doctorId',
        select: 'name specialization experience clinicId',
        populate: {
          path: 'clinicId',
          select: 'name address'
        }
      })
      // Consultation context
      .populate('consultationId', 'type scheduledAt status notes diagnosis')
      // Template reference (if used)
      .populate('courseTemplateId', 'name description panchakarmaType')
      // Generated sessions with therapist assignments
      .populate({
        path: 'generatedSessions',
        populate: [
          { path: 'consultationId', select: 'scheduledAt status' },
          { path: 'therapistId', select: 'name specialization' }
        ],
        options: { 
          sort: { scheduledDate: 1 }  // Chronological order
        }
      });

    if (!treatmentPlan) {
      throw new Error('Treatment plan not found or not assigned to this therapist');
    }

    // 🔥 ENHANCE with computed fields
    const enhancedPlan = treatmentPlan.toObject();
    
    // Calculate current phase
    enhancedPlan.currentPhaseIndex = enhancedPlan.phases?.findIndex(phase => {
      const phaseEndDay = enhancedPlan.phases.slice(0, enhancedPlan.phases.indexOf(phase) + 1)
        .reduce((sum, p) => sum + p.totalDays, 0);
      return phaseEndDay >= (enhancedPlan.totalDays * (enhancedPlan.progress || 0) / 100);
    }) || 0;

    // Next session info
    enhancedPlan.nextSession = enhancedPlan.generatedSessions?.find(s => 
      s.status === 'scheduled' && new Date(s.scheduledDate) >= new Date()
    ) || null;

    // Session stats
    enhancedPlan.sessionStats = {
      total: enhancedPlan.totalSessionsPlanned,
      scheduled: enhancedPlan.generatedSessions?.filter(s => s.status === 'scheduled').length || 0,
      completed: enhancedPlan.completedSessions,
      today: enhancedPlan.generatedSessions?.filter(s => 
        s.status === 'scheduled' && 
        new Date(s.scheduledDate).toDateString() === new Date().toDateString()
      ).length || 0
    };

    console.log('✅ [SERVICE] Enhanced treatment plan:', {
      phases: enhancedPlan.phases?.length,
      nextSession: !!enhancedPlan.nextSession,
      progress: enhancedPlan.progress
    });

    return enhancedPlan;
    
  } catch (error) {
    console.error('❌ [SERVICE] Get treatment plan details error:', error);
    throw error;
  }
}


  /**
   * Update treatment plan progress
   */
  async updateTreatmentPlanProgress(treatmentPlanId, progressData) {
    try {
      const treatmentPlan = await TreatmentPlan.findByIdAndUpdate(
        treatmentPlanId,
        {
          $set: {
            progress: progressData.progress,
            status: progressData.status,
            treatmentNotes: progressData.notes,
            updatedAt: new Date()
          }
        },
        { new: true, runValidators: true }
      )
        .populate('patientId', 'name email phone')
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name email' }
        });

      if (!treatmentPlan) {
        throw new Error('Treatment plan not found');
      }

      // Calculate progress based on completed sessions
      await treatmentPlan.updateProgress();

      return treatmentPlan;
    } catch (error) {
      console.error('❌ [SERVICE] Update treatment plan progress error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 SECTION 4: TREATMENT PLAN APPROVAL WORKFLOW
  // ═══════════════════════════════════════════════════════════

  /**
   * Get pending treatment plans awaiting therapist review
   */
  async getPendingTreatmentPlansForReview(therapistId) {
    try {
      const pendingPlans = await TreatmentPlan.find({
        assignedTherapistId: therapistId,
        schedulingStatus: 'scheduled',
        status: 'active'
      })
        .populate('patientId', 'name email phone age gender profile medicalHistory')
        .populate('consultationId')
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name phone email' },
          select: 'name specialization experience'
        })
        .populate({
          path: 'generatedSessions.consultationId',
          select: 'scheduledAt scheduledDate scheduledTime status therapyData'
        })
        .sort({ 'schedulingPreferences.startDate': 1 });

      return pendingPlans;
    } catch (error) {
      console.error('❌ [SERVICE] Get pending treatment plans error:', error);
      throw error;
    }
  }

  /**
   * Review single treatment plan (detailed view)
   */
  async reviewTreatmentPlan(planId, therapistId) {
    try {
      const plan = await TreatmentPlan.findOne({
        _id: planId,
        assignedTherapistId: therapistId
      })
        .populate('patientId', 'name email phone age gender profile medicalHistory')
        .populate('consultationId')
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name phone email' },
          select: 'name specialization experience'
        })
        .populate({
          path: 'generatedSessions.consultationId',
          populate: [
            { path: 'patientId', select: 'name' },
            { path: 'therapyData.therapyId', select: 'therapyName standardDuration' }
          ]
        });

      if (!plan) {
        throw new Error('Treatment plan not found or not assigned to you');
      }

      // Get all draft consultations for this plan
      const draftConsultations = await Consultation.find({
        _id: { $in: plan.generatedSessions.map(s => s.consultationId) },
        status: 'draft'
      })
        .populate('therapyData.therapyId')
        .sort({ scheduledAt: 1 });

      return {
        treatmentPlan: plan,
        draftConsultations,
        conflictCount: draftConsultations.filter(c => c.hasConflict).length,
        totalSessions: draftConsultations.length
      };
    } catch (error) {
      console.error('❌ [SERVICE] Review treatment plan error:', error);
      throw error;
    }
  }

  /**
   * Approve treatment plan (confirms all draft consultations)
   */
  async approveTreatmentPlan(planId, therapistId, options = {}) {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Get treatment plan
        const plan = await TreatmentPlan.findOne({
          _id: planId,
          assignedTherapistId: therapistId
        }).session(session);

        if (!plan) {
          throw new Error('Treatment plan not found or not assigned to you');
        }

        // Update all draft consultations to scheduled
        const consultationIds = plan.generatedSessions.map(s => s.consultationId);
        
        await Consultation.updateMany(
          {
            _id: { $in: consultationIds },
            status: 'draft'
          },
          {
            $set: {
              status: 'scheduled',
              sessionStatus: 'scheduled'
            },
            $push: {
              statusHistory: {
                status: 'scheduled',
                timestamp: new Date(),
                updatedBy: therapistId,
                reason: 'Approved by therapist',
                previousStatus: 'draft'
              }
            }
          }
        ).session(session);

        // Mark plan as approved
        plan.schedulingStatus = 'scheduled';
        plan.status = 'active';
        if (options.notes) {
          plan.treatmentNotes = (plan.treatmentNotes || '') + '\n\n' + 
            `[Therapist Approval - ${new Date().toISOString()}]\n${options.notes}`;
        }
        await plan.save({ session });

        await session.commitTransaction();

        // Send notification to patient
        try {
          await NotificationService.sendTreatmentPlanApprovedNotification({
            patientId: plan.patientId,
            treatmentPlanId: plan._id,
            therapistName: options.therapistName,
            startDate: plan.schedulingPreferences.startDate
          });
        } catch (notifError) {
          console.error('⚠️ Notification error:', notifError);
        }

        return {
          success: true,
          message: 'Treatment plan approved successfully',
          treatmentPlan: plan
        };
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error('❌ [SERVICE] Approve treatment plan error:', error);
      throw error;
    }
  }

  /**
   * Reject treatment plan
   */
  async rejectTreatmentPlan(planId, therapistId, rejectionData) {
    try {
      const plan = await TreatmentPlan.findOne({
        _id: planId,
        assignedTherapistId: therapistId
      });

      if (!plan) {
        throw new Error('Treatment plan not found or not assigned to you');
      }

      // Update plan status
      plan.schedulingStatus = 'failed';
      plan.schedulingErrors.push({
        errorType: 'rejected_by_therapist',
        message: rejectionData.reason,
        timestamp: new Date()
      });

      if (rejectionData.details) {
        plan.treatmentNotes = (plan.treatmentNotes || '') + '\n\n' + 
          `[Therapist Rejection - ${new Date().toISOString()}]\n${rejectionData.details}`;
      }

      await plan.save();

      // Cancel all draft consultations
      const consultationIds = plan.generatedSessions.map(s => s.consultationId);
      
      await Consultation.updateMany(
        {
          _id: { $in: consultationIds },
          status: 'draft'
        },
        {
          $set: {
            status: 'cancelled',
            sessionStatus: 'cancelled'
          }
        }
      );

      // Notify doctor
      try {
        await NotificationService.sendTreatmentPlanRejectedNotification({
          doctorId: plan.doctorId,
          patientId: plan.patientId,
          treatmentPlanId: plan._id,
          therapistName: rejectionData.therapistName,
          reason: rejectionData.reason
        });
      } catch (notifError) {
        console.error('⚠️ Notification error:', notifError);
      }

      return {
        success: true,
        message: 'Treatment plan rejected',
        treatmentPlan: plan
      };
    } catch (error) {
      console.error('❌ [SERVICE] Reject treatment plan error:', error);
      throw error;
    }
  }

  /**
   * Request changes to treatment plan
   */
  async requestTreatmentPlanChanges(planId, therapistId, changeRequest) {
    try {
      const plan = await TreatmentPlan.findOne({
        _id: planId,
        assignedTherapistId: therapistId
      });

      if (!plan) {
        throw new Error('Treatment plan not found or not assigned to you');
      }

      // Update plan with change request
      plan.schedulingStatus = 'pending';
      plan.treatmentNotes = (plan.treatmentNotes || '') + '\n\n' + 
        `[Change Request - ${new Date().toISOString()}]\n` +
        `Requested Changes:\n${changeRequest.requestedChanges.map(c => `- ${c}`).join('\n')}\n` +
        (changeRequest.additionalNotes ? `\nNotes: ${changeRequest.additionalNotes}` : '');

      if (changeRequest.suggestedStartDate) {
        plan.schedulingPreferences.startDate = new Date(changeRequest.suggestedStartDate);
      }

      if (changeRequest.suggestedSchedule) {
        if (changeRequest.suggestedSchedule.preferredTimeSlot) {
          plan.schedulingPreferences.preferredTimeSlot = changeRequest.suggestedSchedule.preferredTimeSlot;
        }
        if (changeRequest.suggestedSchedule.specificTime) {
          plan.schedulingPreferences.specificTime = changeRequest.suggestedSchedule.specificTime;
        }
      }

      await plan.save();

      // Notify doctor
      try {
        await NotificationService.sendTreatmentPlanChangeRequestNotification({
          doctorId: plan.doctorId,
          patientId: plan.patientId,
          treatmentPlanId: plan._id,
          therapistName: changeRequest.therapistName,
          requestedChanges: changeRequest.requestedChanges
        });
      } catch (notifError) {
        console.error('⚠️ Notification error:', notifError);
      }

      return {
        success: true,
        message: 'Change request sent to doctor',
        treatmentPlan: plan
      };
    } catch (error) {
      console.error('❌ [SERVICE] Request changes error:', error);
      throw error;
    }
  }

  /**
   * Get treatment plan statistics for therapist
   */
  async getTherapistTreatmentPlanStats(therapistId) {
    try {
      const plans = await TreatmentPlan.find({ assignedTherapistId: therapistId });

      const stats = {
        total: plans.length,
        pending: plans.filter(p => p.schedulingStatus === 'pending').length,
        scheduled: plans.filter(p => p.schedulingStatus === 'scheduled').length,
        active: plans.filter(p => p.status === 'active').length,
        completed: plans.filter(p => p.status === 'completed').length,
        failed: plans.filter(p => p.schedulingStatus === 'failed').length,
        averageProgress: plans.length > 0
          ? Math.round(plans.reduce((sum, p) => sum + p.progress, 0) / plans.length)
          : 0
      };

      return stats;
    } catch (error) {
      console.error('❌ [SERVICE] Get treatment plan stats error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 SECTION 5: STATISTICS & ANALYTICS
  // ═══════════════════════════════════════════════════════════

  /**
   * Get therapist statistics
   */
  async getTherapistStats(therapistId, period = '30d') {
    try {
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

      // Query Consultation collection (not TreatmentPlan!)
      const sessions = await Consultation.find({
        providerId: therapistId,
        providerType: 'therapist',
        sessionType: 'therapy',
        createdAt: { $gte: startDate }
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

      return stats;
    } catch (error) {
      console.error('❌ [SERVICE] Get therapist stats error:', error);
      throw error;
    }
  }
}

module.exports = new TherapistService();
