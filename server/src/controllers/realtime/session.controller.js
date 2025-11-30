// src/controllers/realtime/session.controller.js (PRODUCTION-READY)
const { asyncHandler, AppError } = require('../../middleware/error.middleware');
const Consultation = require('../../models/Consultation');

class RealtimeSessionController {
  



  // ✅ ADD THIS TO RealtimeSessionController class

// Send emergency alert
sendEmergencyAlert = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { message, severity } = req.body;
  
  if (!message || !severity) {
    throw new AppError('Message and severity are required', 400, 'VALIDATION_ERROR');
  }
  
  const consultation = await Consultation.findById(sessionId)
    .populate('patientId', 'name email')
    .populate('providerId', 'name');
  
  if (!consultation) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }
  
  // Update emergency flag in database
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
      therapistName: consultation.providerId?.name,
      reportedBy: req.user.name,
      timestamp: new Date()
    });
  }
  
  res.json({
    success: true,
    message: 'Emergency alert sent successfully',
    data: { sessionId, severity }
  });
});

// Pause session
pauseSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { reason } = req.body;
  
  const consultation = await Consultation.findById(sessionId);
  
  if (!consultation) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }
  
  if (consultation.sessionStatus !== 'in_progress') {
    throw new AppError('Only in-progress sessions can be paused', 400, 'INVALID_STATE');
  }
  
  // Update status
  consultation.sessionStatus = 'paused';
  consultation.sessionMetadata = consultation.sessionMetadata || {};
  consultation.sessionMetadata.totalPauses = (consultation.sessionMetadata.totalPauses || 0) + 1;
  consultation.sessionMetadata.lastActivity = new Date();
  
  await consultation.save();
  
  // Broadcast pause event
  const wsService = req.app.get('wsService');
  if (wsService) {
    wsService.emitSessionStatusUpdate(sessionId, {
      status: 'paused',
      reason,
      pausedBy: req.user.name,
      timestamp: new Date()
    });
  }
  
  res.json({
    success: true,
    message: 'Session paused',
    data: { consultation }
  });
});

// Resume session
resumeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  const consultation = await Consultation.findById(sessionId);
  
  if (!consultation) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }
  
  if (consultation.sessionStatus !== 'paused') {
    throw new AppError('Only paused sessions can be resumed', 400, 'INVALID_STATE');
  }
  
  // Resume session
  consultation.sessionStatus = 'in_progress';
  consultation.sessionMetadata = consultation.sessionMetadata || {};
  consultation.sessionMetadata.lastActivity = new Date();
  
  await consultation.save();
  
  // Broadcast resume event
  const wsService = req.app.get('wsService');
  if (wsService) {
    wsService.emitSessionStatusUpdate(sessionId, {
      status: 'in_progress',
      resumedBy: req.user.name,
      timestamp: new Date()
    });
  }
  
  res.json({
    success: true,
    message: 'Session resumed',
    data: { consultation }
  });
});

// Complete session
completeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { summary, notes } = req.body;
  
  const consultation = await Consultation.findById(sessionId)
    .populate('patientId', 'name email')
    .populate('providerId', 'name');
  
  if (!consultation) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }
  
  if (consultation.sessionStatus !== 'in_progress' && consultation.sessionStatus !== 'paused') {
    throw new AppError('Only in-progress or paused sessions can be completed', 400, 'INVALID_STATE');
  }
  
  // Complete session
  consultation.sessionStatus = 'completed';
  consultation.sessionEndTime = new Date();
  consultation.notes = notes || consultation.notes;
  
  // Calculate actual duration
  if (consultation.sessionStartTime) {
    const duration = (consultation.sessionEndTime - consultation.sessionStartTime) / (1000 * 60); // minutes
    consultation.actualDuration = Math.round(duration);
  }
  
  await consultation.save();
  
  // Stop countdown
  const wsService = req.app.get('wsService');
  if (wsService) {
    wsService.stopSessionCountdown(sessionId);
    
    wsService.emitSessionStatusUpdate(sessionId, {
      status: 'completed',
      completedBy: req.user.name,
      actualDuration: consultation.actualDuration,
      timestamp: new Date()
    });
    
    // Notify patient
    wsService.emitToUser(consultation.patientId._id, 'session_completed', {
      sessionId,
      therapyType: consultation.sessionType,
      therapistName: consultation.providerId?.name,
      summary,
      timestamp: new Date()
    });
  }
  
  res.json({
    success: true,
    message: 'Session completed successfully',
    data: { consultation }
  });
});

  // Update session status with real-time broadcast
  updateSessionStatus = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { status, reason } = req.body;
    
    const consultation = await Consultation.findById(sessionId)
      .populate('patientId', 'name email')
      .populate('providerId', 'name role');
      
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    // Validate status transition
    const validTransitions = {
      'scheduled': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'paused', 'cancelled'],
      'paused': ['in_progress', 'cancelled'],
      'completed': [],
      'cancelled': []
    };
    
    const currentStatus = consultation.sessionStatus;
    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new AppError(
        `Cannot transition from ${currentStatus} to ${status}`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }
    
    // Update status in database
    await consultation.updateSessionStatus(status, req.user._id, reason);
    
    // ✅ Get WebSocket service safely
    const wsService = req.app.get('wsService');
    if (!wsService) {
      console.warn('⚠️ WebSocket service not available');
    } else {
      // Broadcast real-time update
      wsService.emitSessionStatusUpdate(sessionId, {
        status,
        reason,
        updatedBy: req.user.name,
        patientName: consultation.patientId?.name,
        providerName: consultation.providerId?.name,
        sessionStartTime: consultation.sessionStartTime,
        sessionEndTime: consultation.sessionEndTime,
        estimatedDuration: consultation.estimatedDuration,
        timestamp: new Date()
      });
      
      // ✅ Stop countdown if session ends
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
  
  // Start session with countdown
  startSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const consultation = await Consultation.findById(sessionId)
      .populate('patientId', 'name')
      .populate('providerId', 'name');
      
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    // ✅ ALLOW BOTH 'scheduled' AND 'confirmed'
    if (!['scheduled', 'confirmed'].includes(consultation.sessionStatus)) {
      throw new AppError(
        `Cannot start session from ${consultation.sessionStatus} status`,
        400,
        'INVALID_SESSION_STATE'
      );
    }
    
    // ✅ ALREADY IN PROGRESS? Just return success
    if (consultation.sessionStatus === 'in_progress') {
      return res.json({
        success: true,
        message: 'Session already in progress',
        data: { 
          consultation,
          countdownStarted: true,
          estimatedEndTime: new Date(Date.now() + (consultation.estimatedDuration * 60 * 1000))
        }
      });
    }
    
    // Update to in-progress
    consultation.sessionStatus = 'in_progress';
    consultation.sessionStartTime = new Date();
    consultation.actualStartedBy = req.user._id;
    await consultation.save();
    
    // ✅ Get WebSocket service
    const wsService = req.app.get('wsService');
    if (!wsService) {
      console.warn('⚠️ WebSocket service unavailable');
    } else {
      // ✅ Start countdown in WebSocket service
      wsService.startSessionCountdown(sessionId, consultation.estimatedDuration || 60);
      
      // Broadcast session started
      wsService.emitSessionStatusUpdate(sessionId, {
        status: 'in_progress',
        startTime: consultation.sessionStartTime,
        estimatedDuration: consultation.estimatedDuration,
        patientName: consultation.patientId?.name,
        providerName: consultation.providerId?.name,
        countdown: (consultation.estimatedDuration || 60) * 60
      });
    }
    
    res.json({
      success: true,
      message: 'Session started successfully',
      data: { 
        consultation,
        countdownStarted: true,
        estimatedEndTime: new Date(Date.now() + (consultation.estimatedDuration * 60 * 1000))
      }
    });
  });
    
  // Get real-time session details
  getSessionDetails = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const consultation = await Consultation.findById(sessionId)
      .populate('patientId', 'name email phone')
      .populate('providerId', 'name email role')
      .populate('activeParticipants.userId', 'name email role');
    
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    // Calculate remaining time if in progress
    let remainingTime = null;
    let elapsedTime = null;
    let progressPercentage = 0;
    
    if (consultation.sessionStatus === 'in_progress' && consultation.sessionStartTime) {
      elapsedTime = Date.now() - consultation.sessionStartTime.getTime();
      const estimated = (consultation.estimatedDuration || 60) * 60 * 1000;
      remainingTime = Math.max(0, estimated - elapsedTime);
      progressPercentage = Math.min(100, (elapsedTime / estimated) * 100);
    }
    
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
        isActive: ['in_progress', 'paused'].includes(consultation.sessionStatus),
        participantCount: consultation.activeParticipants?.length || 0
      }
    });
  });
  
  // Join session
  joinSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
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
    
    // Add user as active participant
    if (typeof consultation.addParticipant === 'function') {
      await consultation.addParticipant(req.user._id, req.user.role);
    } else {
      // Fallback if method doesn't exist
      consultation.activeParticipants = consultation.activeParticipants || [];
      consultation.activeParticipants.push({
        userId: req.user._id,
        role: req.user.role,
        joinedAt: new Date()
      });
      await consultation.save();
    }
    
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
      data: { sessionId, role: req.user.role }
    });
  });
  
  // Leave session
  leaveSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const consultation = await Consultation.findById(sessionId);
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    // Remove participant
    if (typeof consultation.removeParticipant === 'function') {
      await consultation.removeParticipant(req.user._id);
    } else {
      // Fallback
      consultation.activeParticipants = consultation.activeParticipants?.filter(
        p => p.userId.toString() !== req.user._id.toString()
      ) || [];
      await consultation.save();
    }
    
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
