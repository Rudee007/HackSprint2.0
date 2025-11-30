// src/controllers/realtime/therapyTracking.controller.js (FIXED)
const { asyncHandler, AppError } = require('../../middleware/error.middleware');
const Consultation = require('../../models/Consultation');
const User = require('../../models/User');

class TherapyTrackingController {
  
  // ✅ FIXED: Get dashboard data for therapy tracking
  // src/controllers/realtime/therapyTracking.controller.js

  // ✅ ADD THESE TO TherapyTrackingController class

// Update vitals in real-time
updateVitals = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { vitals } = req.body;
  
  if (!vitals) {
    throw new AppError('Vitals data is required', 400, 'VALIDATION_ERROR');
  }
  
  console.log('💓 Updating vitals for session:', sessionId);
  
  const consultation = await Consultation.findById(sessionId);
  
  if (!consultation) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }
  
  // ✅ REMOVED SESSION TYPE CHECK - ALLOW ALL TYPES
  // Now vitals can be updated for ANY session type
  
  // Update vitals using model method
  await consultation.updateVitals(vitals);
  
  console.log('✅ Vitals updated for session type:', consultation.sessionType);
  
  // Broadcast real-time update
  const wsService = req.app.get('wsService');
  if (wsService) {
    wsService.emitVitalsUpdate(sessionId, {
      vitals,
      updatedBy: req.user.name,
      timestamp: new Date()
    });
  }
  
  res.json({
    success: true,
    message: 'Vitals updated successfully',
    data: { vitals, sessionId, sessionType: consultation.sessionType }
  });
});

// Update therapy progress in real-time
updateProgress = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { stage, notes, percentage } = req.body;
  
  if (!stage || percentage === undefined) {
    throw new AppError('Stage and percentage are required', 400, 'VALIDATION_ERROR');
  }
  
  console.log('📈 Updating progress for session:', sessionId, '- Stage:', stage);
  
  const consultation = await Consultation.findById(sessionId);
  
  if (!consultation) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }
  
  // Add progress using model method
  await consultation.addTherapyProgress(stage, notes, percentage);
  
  console.log('✅ Progress updated:', { stage, percentage });
  
  // Broadcast progress update
  const wsService = req.app.get('wsService');
  if (wsService) {
    wsService.emitProgressUpdate(sessionId, {
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
    data: { stage, percentage, sessionId }
  });
});

// Report adverse effect
reportAdverseEffect = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { effect, severity, description, actionTaken } = req.body;
  
  if (!effect || !severity) {
    throw new AppError('Effect and severity are required', 400, 'VALIDATION_ERROR');
  }
  
  console.log('⚠️ Adverse effect reported for session:', sessionId);
  
  const consultation = await Consultation.findById(sessionId)
    .populate('patientId', 'name')
    .populate('providerId', 'name');
  
  if (!consultation) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }
  
  // Add adverse effect using model method
  await consultation.addAdverseEffect(effect, severity, description, actionTaken);
  
  console.log('✅ Adverse effect recorded:', { effect, severity });
  
  // Broadcast to admins if severe
  const wsService = req.app.get('wsService');
  if (wsService && (severity === 'severe' || severity === 'critical')) {
    wsService.emitEmergencyAlert({
      sessionId,
      type: 'adverse_effect',
      effect,
      severity,
      patientName: consultation.patientId?.name,
      therapistName: consultation.providerId?.name,
      description,
      reportedBy: req.user.name,
      timestamp: new Date()
    });
  }
  
  // Broadcast to session participants
  if (wsService) {
    wsService.emitAdverseEffectReport(sessionId, {
      effect,
      severity,
      description,
      actionTaken,
      reportedBy: req.user.name,
      timestamp: new Date()
    });
  }
  
  res.json({
    success: true,
    message: 'Adverse effect reported successfully',
    data: { effect, severity, sessionId }
  });
});

// Add session note in real-time
addSessionNote = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { note, type } = req.body;
  
  if (!note) {
    throw new AppError('Note content is required', 400, 'VALIDATION_ERROR');
  }
  
  const consultation = await Consultation.findById(sessionId);
  
  if (!consultation) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }
  
  // Add note
  consultation.sessionNotes = consultation.sessionNotes || [];
  const newNote = {
    timestamp: new Date(),
    note,
    addedBy: req.user._id,
    type: type || 'general'
  };
  
  consultation.sessionNotes.push(newNote);
  await consultation.save();
  
  // Broadcast note
  const wsService = req.app.get('wsService');
  if (wsService) {
    wsService.emitSessionNote(sessionId, {
      ...newNote,
      addedByName: req.user.name
    });
  }
  
  res.json({
    success: true,
    message: 'Note added successfully',
    data: { note: newNote }
  });
});


getTrackingDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  try {
    console.log('📊 Loading therapy tracking dashboard for user:', req.user.id, req.user.role);
    console.log('📅 Today range:', today, 'to', tomorrow);

    const baseQuery = {
      scheduledAt: {
        $gte: today,
        $lt: tomorrow
      }
    };

    // If doctor/therapist, filter by providerId
    if (req.user.role === 'doctor' || req.user.role === 'therapist') {
      baseQuery.providerId = req.user._id;
    }

    console.log('🔍 Base query:', JSON.stringify(baseQuery));

    // ✅ FETCH EACH CATEGORY SEPARATELY WITH SPECIFIC STATUS FILTERS
    
    // 1. ACTIVE SESSIONS - Must be 'in_progress'
    const activeSessions = await Consultation.find({
      ...baseQuery,
      sessionStatus: 'in_progress'
    })
    .populate('patientId', 'name email phone')
    .populate('providerId', 'name role')
    .sort({ scheduledAt: -1 })
    .lean();

    // 2. PAUSED SESSIONS - Must be 'paused'
    const pausedSessions = await Consultation.find({
      ...baseQuery,
      sessionStatus: 'paused'
    })
    .populate('patientId', 'name email phone')
    .populate('providerId', 'name role')
    .sort({ scheduledAt: -1 })
    .lean();

    // 3. UPCOMING SESSIONS - scheduled/confirmed and NOT started yet
    const upcomingSessions = await Consultation.find({
      ...baseQuery,
      sessionStatus: { $in: ['scheduled', 'confirmed', 'patient_arrived', 'therapist_ready'] }
    })
    .populate('patientId', 'name email phone')
    .populate('providerId', 'name role')
    .sort({ scheduledAt: 1 })
    .lean();

    // 4. COMPLETED SESSIONS - Must be 'completed'
    const completedSessions = await Consultation.find({
      ...baseQuery,
      sessionStatus: 'completed'
    })
    .populate('patientId', 'name email phone')
    .populate('providerId', 'name role')
    .sort({ sessionEndTime: -1 })
    .lean();

    console.log(`📊 Results - Active: ${activeSessions.length}, Paused: ${pausedSessions.length}, Upcoming: ${upcomingSessions.length}, Completed: ${completedSessions.length}`);

    // ✅ WebSocket state
    let systemState = { 
      connectedUsers: [], 
      totalConnections: 0,
      activeSessions: [],
      activeCountdowns: 0
    };
    
    try {
      const wsService = req.app.get('wsService');
      if (wsService && typeof wsService.getSystemState === 'function') {
        systemState = wsService.getSystemState();
        console.log(`📊 WebSocket state: ${systemState.totalConnections} connected users`);
      }
    } catch (wsError) {
      console.warn('⚠️ WebSocket service not available:', wsError.message);
    }

    // ✅ Format sessions for frontend
    const formatSession = (session) => ({
      _id: session._id,
      id: session._id.toString(),
      patientId: session.patientId?._id,
      patientName: session.patientId?.name || 'Unknown Patient',
      patientEmail: session.patientId?.email,
      patientPhone: session.patientId?.phone,
      providerId: session.providerId?._id,
      therapistName: session.providerId?.name || 'Unassigned',
      providerType: session.providerType,
      type: session.type,
      scheduledAt: session.scheduledAt,
      status: session.status,
      sessionStatus: session.sessionStatus,
      fee: session.fee,
      notes: session.notes,
      meetingLink: session.meetingLink,
      sessionType: session.sessionType,
      therapyType: session.sessionType,
      estimatedDuration: session.estimatedDuration,
      actualDuration: session.actualDuration,
      sessionStartTime: session.sessionStartTime,
      sessionEndTime: session.sessionEndTime,
      roomNumber: session.roomNumber,
      dayNumber: session.dayNumber,
      totalDays: session.totalDays,
      rating: session.rating,
      patientFeedback: session.patientFeedback,
      sessionMetadata: session.sessionMetadata,
      sessionNotes: session.sessionNotes,
      activeParticipants: session.activeParticipants,
      statusHistory: session.statusHistory,
      participantCount: session.activeParticipants?.length || 0,
      timing: session.sessionStartTime && session.sessionStatus === 'in_progress' ? {
        elapsedTime: Date.now() - new Date(session.sessionStartTime).getTime(),
        remainingTime: Math.max(0, (session.estimatedDuration * 60 * 1000) - (Date.now() - new Date(session.sessionStartTime).getTime())),
        progressPercentage: Math.min(100, Math.round(((Date.now() - new Date(session.sessionStartTime).getTime()) / (session.estimatedDuration * 60 * 1000)) * 100 * 10) / 10)
      } : null
    });

    // Calculate statistics
    const stats = {
      active: activeSessions.length,
      upcoming: upcomingSessions.length,
      completed: completedSessions.length,
      paused: pausedSessions.length,
      total: activeSessions.length + upcomingSessions.length + completedSessions.length + pausedSessions.length,
      connectedUsers: systemState.totalConnections || 0,
      activeCountdowns: systemState.activeCountdowns || 0
    };

    console.log('✅ Sending response with stats:', stats);

    res.json({
      success: true,
      data: {
        activeSessions: activeSessions.map(formatSession),
        upcomingSessions: upcomingSessions.map(formatSession),
        completedSessions: completedSessions.map(formatSession),
        pausedSessions: pausedSessions.map(formatSession),
        connectedUsers: systemState.connectedUsers || [],
        totalSessions: stats.total,
        stats,
        dateRange: {
          from: today,
          to: tomorrow
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in getTrackingDashboard:', error);
    throw new AppError('Failed to load therapy tracking dashboard', 500, 'DASHBOARD_LOAD_ERROR');
  }
});

  // ✅ Get patient milestones
  getPatientMilestones = asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    console.log('🏆 Loading milestones for patient:', patientId);

    const patient = await User.findOne({ 
      _id: patientId, 
      role: 'patient' 
    }).lean();
    
    if (!patient) {
      throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');
    }

    // Get consultation history for milestones
    const consultations = await Consultation.find({
      patientId,
      $or: [
        { sessionStatus: 'completed' },
        { status: 'completed' }
      ]
    })
    .sort({ completedAt: -1 })
    .lean();

    console.log(`🏆 Found ${consultations.length} completed sessions for patient`);

    // Calculate milestones
    const milestones = this.calculatePatientMilestones(patient, consultations);

    res.json({
      success: true,
      data: {
        patientId,
        patientName: patient.name,
        milestones
      }
    });
  });

  // ✅ Update milestone achievement
  updateMilestone = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { milestoneType, title, description } = req.body;

    if (!milestoneType || !title) {
      throw new AppError('Milestone type and title are required', 400, 'VALIDATION_ERROR');
    }

    console.log('🏆 Adding milestone for patient:', patientId, '- Type:', milestoneType);

    const patient = await User.findOne({ 
      _id: patientId, 
      role: 'patient' 
    });
    
    if (!patient) {
      throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');
    }

    const newMilestone = {
      type: milestoneType,
      title,
      description,
      achievedAt: new Date(),
      achievedBy: req.user._id,
      achievedByName: req.user.name,
      patientId: patient._id,
      patientName: patient.name
    };

    console.log('✅ Milestone created:', newMilestone);

    // Broadcast milestone achievement
    try {
      const wsService = req.app.get('wsService');
      if (wsService && typeof wsService.emitMilestoneAchieved === 'function') {
        wsService.emitMilestoneAchieved(patientId, newMilestone);
        console.log('📡 Milestone broadcast sent');
      }
    } catch (wsError) {
      console.warn('⚠️ Failed to broadcast milestone:', wsError.message);
    }

    res.json({
      success: true,
      message: 'Milestone recorded successfully',
      data: { milestone: newMilestone }
    });
  });

  // ✅ FIXED: Get upcoming sessions with countdown
  getUpcomingSessions = asyncHandler(async (req, res) => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    console.log('📅 Loading upcoming sessions for user:', req.user.id);

    // ✅ FIXED: Use scheduledAt instead of scheduledFor
    const query = {
      scheduledAt: { $gte: now, $lte: endOfDay },
      $or: [
        { sessionStatus: { $in: ['scheduled', 'confirmed', 'patient_arrived', 'therapist_ready'] } },
        { status: 'scheduled' }
      ]
    };

    // Filter by provider if doctor/therapist
    if (req.user.role === 'doctor' || req.user.role === 'therapist') {
      query.providerId = req.user._id;
    }

    console.log('🔍 Upcoming sessions query:', JSON.stringify(query));

    const upcomingSessions = await Consultation.find(query)
      .populate('patientId', 'name email phone')
      .populate('providerId', 'name role')
      .sort({ scheduledAt: 1 })
      .lean();

    console.log(`📅 Found ${upcomingSessions.length} upcoming sessions`);

    const formattedSessions = upcomingSessions.map(session => {
      const timeToSession = new Date(session.scheduledAt) - now;
      const hours = Math.floor(timeToSession / (1000 * 60 * 60));
      const minutes = Math.floor((timeToSession % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeToSession % (1000 * 60)) / 1000);
      
      return {
        ...this.formatSessionForTracking(session),
        timeRemaining: {
          total: timeToSession,
          hours,
          minutes,
          seconds,
          overdue: timeToSession < 0,
          formatted: timeToSession < 0 
            ? 'Overdue' 
            : `${hours}h ${minutes}m`
        }
      };
    });

    res.json({
      success: true,
      data: { 
        sessions: formattedSessions,
        count: formattedSessions.length
      }
    });
  });

  // ✅ FIXED: Format session for tracking display
  formatSessionForTracking(consultation) {
    let elapsedTime = null;
    let remainingTime = null;
    let progressPercentage = 0;

    // Use sessionStatus or fallback to status
    const currentStatus = consultation.sessionStatus || consultation.status;

    if (currentStatus === 'in_progress' && consultation.sessionStartTime) {
      const now = new Date();
      const startTime = new Date(consultation.sessionStartTime);
      elapsedTime = now - startTime;
      
      const estimatedDuration = (consultation.estimatedDuration || 60) * 60 * 1000;
      remainingTime = Math.max(0, estimatedDuration - elapsedTime);
      progressPercentage = Math.min(100, (elapsedTime / estimatedDuration) * 100);
    }

    return {
      id: consultation._id,
      patientId: consultation.patientId?._id,
      patientName: consultation.patientId?.name || 'Unknown Patient',
      patientEmail: consultation.patientId?.email,
      patientPhone: consultation.patientId?.phone,
      therapyType: consultation.type || 'general_consultation',
      sessionType: consultation.sessionType || 'standard',
      status: currentStatus,
      sessionStatus: consultation.sessionStatus,
      scheduledAt: consultation.scheduledAt,
      startedAt: consultation.sessionStartTime,
      completedAt: consultation.sessionEndTime,
      estimatedDuration: consultation.estimatedDuration || 60,
      therapistId: consultation.providerId?._id,
      therapistName: consultation.providerId?.name || 'Assigned Therapist',
      therapistRole: consultation.providerId?.role,
      roomNumber: consultation.roomNumber || 'TBD',
      currentPhase: consultation.currentPhase,
      participantCount: consultation.activeParticipants?.length || 0,
      dayNumber: consultation.dayNumber || 1,
      totalDays: consultation.totalDays || 21,
      preparationTime: consultation.preparationTime || 30,
      alerts: consultation.preSessionAlerts || [],
      lastUpdate: consultation.updatedAt,
      timing: {
        elapsedTime,
        remainingTime,
        progressPercentage: Math.round(progressPercentage * 10) / 10
      }
    };
  }

  // ✅ Calculate patient milestones
  calculatePatientMilestones(patient, consultations) {
    const totalSessions = consultations.length;
    const completedSessions = consultations.filter(c => 
      c.sessionStatus === 'completed' || c.status === 'completed'
    ).length;
    
    const progressPercentage = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    const achievements = [];
    const upcomingGoals = [];

    const milestoneDefinitions = [
      { count: 1, type: 'first_session', title: 'First Therapy Completed', emoji: '🎯' },
      { count: 3, type: 'early_progress', title: '3 Sessions Completed', emoji: '🌱' },
      { count: 5, type: 'progress_milestone', title: '5 Sessions Completed', emoji: '⭐' },
      { count: 7, type: 'week_complete', title: 'Week 1 Complete (7 sessions)', emoji: '🏆' },
      { count: 10, type: 'double_digits', title: '10 Sessions Completed', emoji: '💪' },
      { count: 14, type: 'two_weeks', title: 'Two Weeks Complete', emoji: '🎉' },
      { count: 21, type: 'full_treatment', title: 'Full Treatment Complete (21 sessions)', emoji: '👑' }
    ];

    milestoneDefinitions.forEach((milestone) => {
      if (completedSessions >= milestone.count) {
        achievements.push({
          type: milestone.type,
          title: milestone.title,
          emoji: milestone.emoji,
          achievedAt: consultations[milestone.count - 1]?.sessionEndTime || 
                      consultations[milestone.count - 1]?.completedAt || 
                      new Date(),
          sessionNumber: milestone.count
        });
      } else if (upcomingGoals.length < 3) {
        upcomingGoals.push({
          type: milestone.type,
          title: milestone.title,
          emoji: milestone.emoji,
          sessionsNeeded: milestone.count - completedSessions,
          targetSession: milestone.count
        });
      }
    });

    const weeklyBreakdown = {
      week1: Math.min(completedSessions, 7),
      week2: Math.max(0, Math.min(completedSessions - 7, 7)),
      week3: Math.max(0, Math.min(completedSessions - 14, 7))
    };

    return {
      patientName: patient.name,
      therapyType: patient.profile?.constitution ? 'ayurvedic' : 'general',
      currentDay: completedSessions + 1,
      totalDays: 21,
      completedSessions,
      remainingSessions: Math.max(0, 21 - completedSessions),
      progressPercentage: Math.round(progressPercentage * 10) / 10,
      achievements,
      upcomingGoals,
      weeklyBreakdown,
      isComplete: completedSessions >= 21
    };
  }
}

module.exports = new TherapyTrackingController();
