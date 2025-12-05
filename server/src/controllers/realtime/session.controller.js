// src/controllers/realtime/session.controller.js
// 🔥 PRODUCTION-READY - CONSULTATION SCHEMA v2.0 COMPLIANT
const { asyncHandler, AppError } = require('../../middleware/error.middleware');
const Consultation = require('../../models/Consultation');

class RealtimeSessionController {
  
  // ═══════════════════════════════════════════════════════════
  // SESSION LIFECYCLE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Start a session with countdown timer
   */
  startSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    console.log('🟢 [SESSION] Starting session:', sessionId);

    const consultation = await Consultation.findById(sessionId)
      .populate('patientId', 'name email phone profile')
      .populate({
        path: 'providerId',
        select: 'name email role specialization'
      });

    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    const allowedStatuses = ['scheduled', 'confirmed', 'patient_arrived', 'therapist_ready'];
    if (!allowedStatuses.includes(consultation.sessionStatus)) {
      throw new AppError(
        `Cannot start session from ${consultation.sessionStatus} status`,
        400,
        'INVALID_SESSION_STATE'
      );
    }

    if (consultation.sessionStatus === 'in_progress') {
      console.log('⚠️ Session already in progress');
      return res.json({
        success: true,
        message: 'Session already in progress',
        data: {
          consultation,
          countdownStarted: true,
          estimatedEndTime: new Date(
            Date.now() + consultation.estimatedDuration * 60 * 1000
          )
        }
      });
    }

    // Update live session status
    consultation.sessionStatus = 'in_progress';
    consultation.status = 'in_progress'; // valid in both enums
    consultation.sessionStartTime = new Date();

    consultation.statusHistory = consultation.statusHistory || [];
    consultation.statusHistory.push({
      status: 'in_progress',
      previousStatus: 'scheduled',
      timestamp: new Date(),
      updatedBy: req.user._id,
      reason: 'Session started'
    });

    await consultation.save();

    console.log('✅ Session started successfully');

    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.startSessionCountdown(sessionId, consultation.estimatedDuration || 60);

      wsService.emitSessionStatusUpdate(sessionId, {
        status: 'in_progress',
        startTime: consultation.sessionStartTime,
        estimatedDuration: consultation.estimatedDuration,
        patientName: consultation.patientId?.name,
        providerName: consultation.providerId?.name,
        providerId: consultation.providerId?._id,
        sessionType: consultation.sessionType,
        therapyType: consultation.therapyData?.therapyType,
        countdown: (consultation.estimatedDuration || 60) * 60
      });
    }

    res.json({
      success: true,
      message: 'Session started successfully',
      data: {
        consultation,
        countdownStarted: true,
        estimatedEndTime: new Date(
          Date.now() + consultation.estimatedDuration * 60 * 1000
        ),
        isTherapySession: consultation.sessionType === 'therapy'
      }
    });
  });
  
  /**
   * Pause an active session
   */
  pauseSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { reason } = req.body;

    console.log('⏸️ [SESSION] Pausing session:', sessionId);

    const consultation = await Consultation.findById(sessionId)
      .populate('patientId', 'name')
      .populate('providerId', 'name');

    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    if (consultation.sessionStatus !== 'in_progress') {
      throw new AppError('Only in-progress sessions can be paused', 400, 'INVALID_STATE');
    }

    const pausedAt = new Date();
    const elapsed = pausedAt - consultation.sessionStartTime;

    // 🔧 Only sessionStatus supports 'paused'
    consultation.sessionStatus = 'paused';
    // DO NOT do: consultation.status = 'paused';  // ❌ invalid enum

    consultation.sessionMetadata = consultation.sessionMetadata || {};
    consultation.sessionMetadata.totalPauses =
      (consultation.sessionMetadata.totalPauses || 0) + 1;
    consultation.sessionMetadata.lastActivity = pausedAt;

    consultation.statusHistory = consultation.statusHistory || [];
    consultation.statusHistory.push({
      status: 'paused',
      previousStatus: 'in_progress',
      timestamp: pausedAt,
      updatedBy: req.user._id,
      reason: reason || 'Session paused by user'
    });

    await consultation.save();

    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.emitSessionStatusUpdate(sessionId, {
        status: 'paused',
        reason,
        pausedBy: req.user.name,
        pausedAt,
        elapsedTime: elapsed
      });
    }

    res.json({
      success: true,
      message: 'Session paused successfully',
      data: { consultation }
    });
  });
 
  /**
   * Resume a paused session
   */
  resumeSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    console.log('▶️ [SESSION] Resuming session:', sessionId);

    const consultation = await Consultation.findById(sessionId)
      .populate('patientId', 'name')
      .populate('providerId', 'name');

    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    if (consultation.sessionStatus !== 'paused') {
      throw new AppError('Only paused sessions can be resumed', 400, 'INVALID_STATE');
    }

    const resumedAt = new Date();
    consultation.sessionStatus = 'in_progress';
    consultation.status = 'in_progress'; // ✅ allowed
    consultation.sessionMetadata = consultation.sessionMetadata || {};
    consultation.sessionMetadata.lastActivity = resumedAt;

    consultation.statusHistory = consultation.statusHistory || [];
    consultation.statusHistory.push({
      status: 'in_progress',
      previousStatus: 'paused',
      timestamp: resumedAt,
      updatedBy: req.user._id,
      reason: 'Session resumed'
    });

    await consultation.save();

    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.emitSessionStatusUpdate(sessionId, {
        status: 'in_progress',
        resumedBy: req.user.name,
        resumedAt
      });
    }

    res.json({
      success: true,
      message: 'Session resumed successfully',
      data: { consultation }
    });
  });  
  /**
   * Complete a session
   */
  completeSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { summary, notes, rating, feedback } = req.body;

    console.log('✅ [SESSION] Completing session:', sessionId);

    const consultation = await Consultation.findById(sessionId)
      .populate('patientId', 'name email')
      .populate('providerId', 'name');

    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    const allowedStatuses = ['in_progress', 'paused'];
    if (!allowedStatuses.includes(consultation.sessionStatus)) {
      throw new AppError(
        `Cannot complete session from ${consultation.sessionStatus} status`,
        400,
        'INVALID_STATE'
      );
    }

    const completedAt = new Date();
    consultation.sessionStatus = 'completed';
    consultation.status = 'completed'; // ✅ allowed
    consultation.sessionEndTime = completedAt;
    consultation.notes = notes || consultation.notes;
    consultation.patientFeedback = feedback || consultation.patientFeedback;
    consultation.rating = rating || consultation.rating;

    if (consultation.sessionStartTime) {
      const duration =
        (completedAt - consultation.sessionStartTime) / (1000 * 60);
      consultation.actualDuration = Math.round(duration);
    }

    consultation.statusHistory = consultation.statusHistory || [];
    consultation.statusHistory.push({
      status: 'completed',
      previousStatus: consultation.sessionStatus,
      timestamp: completedAt,
      updatedBy: req.user._id,
      reason: 'Session completed successfully'
    });

    await consultation.save();

    console.log(
      `✅ Session completed - Duration: ${consultation.actualDuration} minutes`
    );

    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.stopSessionCountdown(sessionId);

      wsService.emitSessionStatusUpdate(sessionId, {
        status: 'completed',
        completedBy: req.user.name,
        completedAt,
        actualDuration: consultation.actualDuration,
        rating: consultation.rating
      });

      if (consultation.patientId?._id) {
        wsService.emitToUser(consultation.patientId._id, 'session_completed', {
          sessionId,
          sessionType: consultation.sessionType,
          providerName: consultation.providerId?.name,
          summary,
          actualDuration: consultation.actualDuration,
          timestamp: completedAt
        });
      }
    }

    res.json({
      success: true,
      message: 'Session completed successfully',
      data: { consultation }
    });
  });  
  /**
   * Update session status (generic)
   */
  updateSessionStatus = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { status, reason } = req.body;

    console.log(`🔄 [SESSION] Updating status to: ${status}`);

    const consultation = await Consultation.findById(sessionId)
      .populate('patientId', 'name email')
      .populate('providerId', 'name role');

    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    const validTransitions = {
      scheduled: ['patient_arrived', 'therapist_ready', 'in_progress', 'cancelled'],
      patient_arrived: ['in_progress', 'cancelled'],
      therapist_ready: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'paused', 'cancelled'],
      paused: ['in_progress', 'cancelled'],
      completed: [],
      cancelled: []
    };

    const currentStatus = consultation.sessionStatus;
    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new AppError(
        `Cannot transition from ${currentStatus} to ${status}`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // Always update sessionStatus
    consultation.sessionStatus = status;

    // Only update root status when new value is allowed by its enum
    const statusEnumAllowed = [
      'scheduled',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
      'patient_arrived',
      'therapist_ready'
    ];
    if (statusEnumAllowed.includes(status)) {
      consultation.status = status;
    }

    consultation.statusHistory = consultation.statusHistory || [];
    consultation.statusHistory.push({
      status,
      previousStatus: currentStatus,
      timestamp: new Date(),
      updatedBy: req.user._id,
      reason: reason || `Status updated to ${status}`
    });

    await consultation.save();

    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.emitSessionStatusUpdate(sessionId, {
        status,
        reason,
        updatedBy: req.user.name,
        patientName: consultation.patientId?.name,
        providerName: consultation.providerId?.name,
        timestamp: new Date()
      });

      if (['completed', 'cancelled'].includes(status)) {
        wsService.stopSessionCountdown(sessionId);
      }
    }

    res.json({
      success: true,
      message: 'Session status updated',
      data: { consultation }
    });
  });
  
  // ═══════════════════════════════════════════════════════════
  // 🔥 THERAPY-SPECIFIC ENDPOINTS (NEW)
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Update therapy vitals (real-time)
   */
  updateTherapyVitals = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { bloodPressure, pulse, temperature, weight, respiratoryRate, oxygenSaturation } = req.body;
    
    console.log('🩺 [THERAPY] Updating vitals for session:', sessionId);
    
    const consultation = await Consultation.findById(sessionId);
    
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    if (consultation.sessionType !== 'therapy') {
      throw new AppError('Vitals can only be updated for therapy sessions', 400, 'INVALID_SESSION_TYPE');
    }
    
    // Use schema method
    const vitalsData = {
      bloodPressure: bloodPressure ? {
        systolic: bloodPressure.systolic,
        diastolic: bloodPressure.diastolic,
        measuredAt: new Date()
      } : undefined,
      pulse,
      temperature,
      weight,
      respiratoryRate,
      oxygenSaturation
    };
    
    await consultation.updateVitals(vitalsData);
    
    console.log('✅ Vitals updated successfully');
    
    // Real-time broadcast
    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.emitToSession(sessionId, 'vitals_updated', {
        sessionId,
        vitals: consultation.therapyData.vitals,
        updatedBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Vitals updated successfully',
      data: { vitals: consultation.therapyData.vitals }
    });
  });
  
  /**
   * Update therapy observations
   */
  updateTherapyObservations = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { sweatingQuality, skinTexture, skinColor, patientComfort, responseToTreatment } = req.body;
    
    console.log('👁️ [THERAPY] Updating observations for session:', sessionId);
    
    const consultation = await Consultation.findById(sessionId);
    
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    if (consultation.sessionType !== 'therapy') {
      throw new AppError('Observations can only be updated for therapy sessions', 400, 'INVALID_SESSION_TYPE');
    }
    
    // Update observations
    consultation.therapyData = consultation.therapyData || {};
    consultation.therapyData.observations = consultation.therapyData.observations || {};
    
    if (sweatingQuality) consultation.therapyData.observations.sweatingQuality = sweatingQuality;
    if (skinTexture) consultation.therapyData.observations.skinTexture = skinTexture;
    if (skinColor) consultation.therapyData.observations.skinColor = skinColor;
    if (patientComfort) consultation.therapyData.observations.patientComfort = patientComfort;
    if (responseToTreatment) consultation.therapyData.observations.responseToTreatment = responseToTreatment;
    
    consultation.therapyData.observations.timeOfObservation = consultation.therapyData.observations.timeOfObservation || [];
    consultation.therapyData.observations.timeOfObservation.push(new Date());
    
    await consultation.save();
    
    // Real-time broadcast
    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.emitToSession(sessionId, 'observations_updated', {
        sessionId,
        observations: consultation.therapyData.observations,
        updatedBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Observations updated successfully',
      data: { observations: consultation.therapyData.observations }
    });
  });
  
  /**
   * Add therapy progress update
   */
  addTherapyProgress = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { stage, notes, percentage } = req.body;
    
    console.log(`📊 [THERAPY] Adding progress - Stage: ${stage}, ${percentage}%`);
    
    if (!stage || percentage === undefined) {
      throw new AppError('Stage and percentage are required', 400, 'VALIDATION_ERROR');
    }
    
    const consultation = await Consultation.findById(sessionId);
    
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    if (consultation.sessionType !== 'therapy') {
      throw new AppError('Progress updates are only for therapy sessions', 400, 'INVALID_SESSION_TYPE');
    }
    
    // Use schema method
    await consultation.addTherapyProgress(stage, notes, percentage);
    
    console.log(`✅ Progress updated: ${stage} - ${percentage}%`);
    
    // Real-time broadcast
    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.emitToSession(sessionId, 'therapy_progress_updated', {
        sessionId,
        stage,
        percentage,
        notes,
        updatedBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: { 
        currentStage: stage,
        percentage,
        progressUpdates: consultation.therapyData.progressUpdates
      }
    });
  });
  
  /**
   * Report adverse effect (CRITICAL)
   */
  reportAdverseEffect = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { effect, severity, description, actionTaken } = req.body;
    
    console.log(`🚨 [ADVERSE EFFECT] ${severity.toUpperCase()} - ${effect}`);
    
    if (!effect || !severity) {
      throw new AppError('Effect and severity are required', 400, 'VALIDATION_ERROR');
    }
    
    const consultation = await Consultation.findById(sessionId)
      .populate('patientId', 'name email')
      .populate('providerId', 'name');
    
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    if (consultation.sessionType !== 'therapy') {
      throw new AppError('Adverse effects are only for therapy sessions', 400, 'INVALID_SESSION_TYPE');
    }
    
    // Use schema method (auto-handles emergency escalation)
    await consultation.addAdverseEffect(effect, severity, description, actionTaken);
    
    console.log('✅ Adverse effect recorded');
    
    // Real-time broadcast
    const wsService = req.app.get('wsService');
    if (wsService) {
      // Broadcast to all relevant parties
      wsService.emitToSession(sessionId, 'adverse_effect_reported', {
        sessionId,
        effect,
        severity,
        description,
        patientName: consultation.patientId?.name,
        reportedBy: req.user.name,
        timestamp: new Date()
      });
      
      // Critical alert for severe/critical effects
      if (['severe', 'critical'].includes(severity)) {
        wsService.emitEmergencyAlert({
          sessionId,
          type: 'adverse_effect',
          severity,
          effect,
          description,
          patientName: consultation.patientId?.name,
          providerName: consultation.providerId?.name,
          reportedBy: req.user.name,
          timestamp: new Date()
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Adverse effect reported successfully',
      data: { 
        effect,
        severity,
        emergencyReported: consultation.therapyData.emergencyReported,
        adverseEffects: consultation.therapyData.adverseEffects
      }
    });
  });
  
  /**
   * Add materials used in therapy
   */
  addTherapyMaterials = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { materials } = req.body; // Array of {name, quantity, unit, batchNumber}
    
    console.log('📦 [THERAPY] Adding materials used');
    
    if (!materials || !Array.isArray(materials)) {
      throw new AppError('Materials array is required', 400, 'VALIDATION_ERROR');
    }
    
    const consultation = await Consultation.findById(sessionId);
    
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    if (consultation.sessionType !== 'therapy') {
      throw new AppError('Materials tracking is only for therapy sessions', 400, 'INVALID_SESSION_TYPE');
    }
    
    // Add materials
    consultation.therapyData = consultation.therapyData || {};
    consultation.therapyData.materialsUsed = consultation.therapyData.materialsUsed || [];
    consultation.therapyData.materialsUsed.push(...materials);
    
    await consultation.save();
    
    console.log(`✅ ${materials.length} material(s) added`);
    
    res.json({
      success: true,
      message: 'Materials recorded successfully',
      data: { materialsUsed: consultation.therapyData.materialsUsed }
    });
  });
  
  /**
   * Send emergency alert
   */
  sendEmergencyAlert = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { message, severity } = req.body;
    
    console.log(`🚨 [EMERGENCY] ${severity.toUpperCase()} alert for session ${sessionId}`);
    
    if (!message || !severity) {
      throw new AppError('Message and severity are required', 400, 'VALIDATION_ERROR');
    }
    
    const consultation = await Consultation.findById(sessionId)
      .populate('patientId', 'name email')
      .populate('providerId', 'name');
    
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    // Update emergency flag
    if (consultation.sessionType === 'therapy' && consultation.therapyData) {
      consultation.therapyData.emergencyReported = true;
      consultation.therapyData.emergencyDetails = {
        type: 'manual_alert',
        message,
        severity,
        timestamp: new Date(),
        reportedBy: req.user._id
      };
      await consultation.save();
    }
    
    // Broadcast emergency to all admins and doctors
    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.emitEmergencyAlert({
        sessionId,
        sessionType: consultation.sessionType,
        message,
        severity,
        patientName: consultation.patientId?.name,
        providerName: consultation.providerId?.name,
        reportedBy: req.user.name,
        timestamp: new Date()
      });
    }
    
    console.log('✅ Emergency alert sent');
    
    res.json({
      success: true,
      message: 'Emergency alert sent successfully',
      data: { sessionId, severity, emergencyReported: true }
    });
  });
  
  // ═══════════════════════════════════════════════════════════
  // SESSION INFORMATION & PARTICIPANTS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Get real-time session details
   */
  getSessionDetails = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const consultation = await Consultation.findById(sessionId)
      .populate('patientId', 'name email phone profile')
      .populate({
        path: 'providerId',
        select: 'name email role specialization'
      })
      .populate('activeParticipants.userId', 'name email role')
      .populate('therapyData.treatmentPlanId', 'treatmentName totalDays')
      .populate('therapyData.doctorId', 'name');
    
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    // Calculate timing
    let remainingTime = null;
    let elapsedTime = null;
    let progressPercentage = 0;
    
    if (consultation.sessionStatus === 'in_progress' && consultation.sessionStartTime) {
      elapsedTime = Date.now() - consultation.sessionStartTime.getTime();
      const estimated = (consultation.estimatedDuration || 60) * 60 * 1000;
      remainingTime = Math.max(0, estimated - elapsedTime);
      progressPercentage = Math.min(100, (elapsedTime / estimated) * 100);
    }
    
    // Therapy-specific data
    const therapyInfo = consultation.sessionType === 'therapy' ? {
      hasVitals: !!consultation.therapyData?.vitals,
      hasAdverseEffects: (consultation.therapyData?.adverseEffects || []).length > 0,
      emergencyReported: consultation.therapyData?.emergencyReported || false,
      currentStage: consultation.therapyData?.progressUpdates?.slice(-1)[0]?.stage || 'preparation',
      progressPercentage: consultation.therapyData?.progressUpdates?.slice(-1)[0]?.percentage || 0,
      materialsCount: (consultation.therapyData?.materialsUsed || []).length,
      observationCount: (consultation.therapyData?.observations?.timeOfObservation || []).length
    } : null;
    
    res.json({
      success: true,
      data: {
        consultation,
        timing: {
          elapsedTime,
          remainingTime,
          estimatedDuration: consultation.estimatedDuration || 60,
          progressPercentage: Math.round(progressPercentage * 10) / 10
        },
        therapyInfo,
        isActive: ['in_progress', 'paused'].includes(consultation.sessionStatus),
        participantCount: consultation.activeParticipants?.length || 0
      }
    });
  });
  
  /**
   * Join session as participant
   */
  joinSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    console.log(`👤 [SESSION] User ${req.user.name} joining session ${sessionId}`);
    
    const consultation = await Consultation.findById(sessionId);
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    // Check if already a participant
    const isParticipant = consultation.activeParticipants?.some(
      p => p.userId.toString() === req.user._id.toString()
    );
    
    if (isParticipant) {
      return res.json({
        success: true,
        message: 'Already a participant',
        data: { sessionId, role: req.user.role }
      });
    }
    
    // Add participant
    consultation.activeParticipants = consultation.activeParticipants || [];
    consultation.activeParticipants.push({
      userId: req.user._id,
      role: req.user.role,
      joinedAt: new Date(),
      isActive: true
    });
    
    await consultation.save();
    
    console.log(`✅ User joined - Total participants: ${consultation.activeParticipants.length}`);
    
    // Broadcast join event
    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.emitSessionStatusUpdate(sessionId, {
        type: 'participant_joined',
        participant: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role
        },
        totalParticipants: consultation.activeParticipants.length
      });
    }
    
    res.json({
      success: true,
      message: 'Joined session successfully',
      data: { sessionId, role: req.user.role, participantCount: consultation.activeParticipants.length }
    });
  });
  
  /**
   * Leave session
   */
  leaveSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    console.log(`👋 [SESSION] User ${req.user.name} leaving session ${sessionId}`);
    
    const consultation = await Consultation.findById(sessionId);
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    // Remove participant
    consultation.activeParticipants = consultation.activeParticipants?.filter(
      p => p.userId.toString() !== req.user._id.toString()
    ) || [];
    
    await consultation.save();
    
    // Broadcast leave event
    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.emitSessionStatusUpdate(sessionId, {
        type: 'participant_left',
        participant: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role
        },
        totalParticipants: consultation.activeParticipants.length
      });
    }
    
    res.json({
      success: true,
      message: 'Left session successfully'
    });
  });
}

module.exports = new RealtimeSessionController();
