// src/controllers/realtime/session.controller.js
const { asyncHandler, AppError } = require('../../middleware/error.middleware');
const Consultation = require('../../models/Consultation');

class RealtimeSessionController {
  
  // Update session status with real-time broadcast
  updateSessionStatus = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { status, reason } = req.body;
    
    const consultation = await Consultation.findById(sessionId);
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    // Update status in database
    await consultation.updateSessionStatus(status, req.user._id, reason);
    
    // ✅ Broadcast real-time update
    const wsService = req.app.get('wsService');
    wsService.emitSessionStatusUpdate(sessionId, {
      status,
      reason,
      updatedBy: req.user.name,
      sessionStartTime: consultation.sessionStartTime,
      sessionEndTime: consultation.sessionEndTime,
      estimatedDuration: consultation.estimatedDuration
    });
    
    res.json({
      success: true,
      message: 'Session status updated',
      data: { consultation }
    });
  });
  
  // Get real-time session details
  getSessionDetails = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const consultation = await Consultation.findById(sessionId)
      .populate('patientId', 'name email')
      .populate('providerId', 'name email role')
      .populate('activeParticipants.userId', 'name email role');
    
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    // Calculate remaining time if in progress
    let remainingTime = null;
    if (consultation.sessionStatus === 'in_progress' && consultation.sessionStartTime) {
      const elapsed = Date.now() - consultation.sessionStartTime.getTime();
      const estimated = consultation.estimatedDuration * 60 * 1000; // Convert to ms
      remainingTime = Math.max(0, estimated - elapsed);
    }
    
    res.json({
      success: true,
      data: {
        consultation,
        remainingTime,
        isActive: ['in_progress', 'paused'].includes(consultation.sessionStatus)
      }
    });
  });
  
  // Join session (for real-time tracking)
  joinSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const consultation = await Consultation.findById(sessionId);
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    // Add user as active participant
    await consultation.addParticipant(req.user._id, req.user.role);
    
    // Broadcast join event
    const wsService = req.app.get('wsService');
    wsService.emitSessionStatusUpdate(sessionId, {
      type: 'participant_joined',
      participant: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role
      }
    });
    
    res.json({
      success: true,
      message: 'Joined session successfully'
    });
  });
  
  // Start session countdown
  startSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const consultation = await Consultation.findById(sessionId);
    if (!consultation) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    
    // Update to in-progress
    await consultation.updateSessionStatus('in_progress', req.user._id, 'Session started');
    
    // ✅ Start real-time countdown
    const wsService = req.app.get('wsService');
    this.startSessionCountdown(sessionId, consultation.estimatedDuration, wsService);
    
    wsService.emitSessionStatusUpdate(sessionId, {
      status: 'in_progress',
      startTime: consultation.sessionStartTime,
      estimatedDuration: consultation.estimatedDuration,
      countdown: consultation.estimatedDuration * 60 // seconds
    });
    
    res.json({
      success: true,
      message: 'Session started',
      data: { consultation }
    });
  });
  
  // ✅ Real-time countdown implementation
  startSessionCountdown(sessionId, durationMinutes, wsService) {
    let remainingSeconds = durationMinutes * 60;
    
    const countdownInterval = setInterval(() => {
      remainingSeconds--;
      
      // Emit countdown update every 30 seconds
      if (remainingSeconds % 30 === 0 || remainingSeconds <= 60) {
        wsService.emitSessionStatusUpdate(sessionId, {
          type: 'countdown_update',
          remainingSeconds,
          remainingMinutes: Math.ceil(remainingSeconds / 60)
        });
      }
      
      // Session time ended
      if (remainingSeconds <= 0) {
        clearInterval(countdownInterval);
        wsService.emitSessionStatusUpdate(sessionId, {
          type: 'session_time_ended',
          message: 'Estimated session time has ended'
        });
      }
    }, 1000);
    
    // Store interval ID for potential cleanup
    global.sessionCountdowns = global.sessionCountdowns || {};
    global.sessionCountdowns[sessionId] = countdownInterval;
  }
}

module.exports = new RealtimeSessionController();
