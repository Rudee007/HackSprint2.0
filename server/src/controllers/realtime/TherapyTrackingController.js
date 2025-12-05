// src/controllers/realtime/therapyTracking.controller.js
const { asyncHandler, AppError } = require('../../middleware/error.middleware');
const Consultation = require('../../models/Consultation');
const User = require('../../models/User');
const Therapist = require('../../models/Therapist');
const Doctor = require('../../models/Doctor');          // ⬅️ ensure this exists
const util = require('util');

class TherapyTrackingController {
  // ────────────────────────────────────────────────────────────
  // Helper: resolve provider scope (Doctor/Therapist) for current user
  // ────────────────────────────────────────────────────────────
  async resolveProviderScope(req) {
    if (!req.user || !req.user.role) return null;

    if (req.user.role === 'therapist') {
      const therapistDoc = await Therapist.findOne({ userId: req.user._id }).lean();
      if (!therapistDoc) {
        console.warn(
          '⚠️ [PROVIDER_SCOPE] Therapist profile not found for user',
          req.user._id.toString()
        );
        return null;
      }
      return {
        providerId: therapistDoc._id,
        providerModel: 'Therapist',
        doc: therapistDoc
      };
    }

    if (req.user.role === 'doctor') {
      const doctorDoc = await Doctor.findOne({ userId: req.user._id }).lean();
      if (!doctorDoc) {
        console.warn(
          '⚠️ [PROVIDER_SCOPE] Doctor profile not found for user',
          req.user._id.toString()
        );
        return null;
      }
      return {
        providerId: doctorDoc._id,
        providerModel: 'Doctor',
        doc: doctorDoc
      };
    }

    // admins/reception etc. → no provider scoping
    return null;
  }

  // ────────────────────────────────────────────────────────────
  // Update vitals in real-time
  // ────────────────────────────────────────────────────────────
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

    await consultation.updateVitals(vitals);

    console.log('✅ Vitals updated for session type:', consultation.sessionType);

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

  // ────────────────────────────────────────────────────────────
  // Update therapy progress
  // ────────────────────────────────────────────────────────────
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

    await consultation.addTherapyProgress(stage, notes, percentage);

    console.log('✅ Progress updated:', { stage, percentage });

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

  // ────────────────────────────────────────────────────────────
  // Report adverse effect
  // ────────────────────────────────────────────────────────────
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

    await consultation.addAdverseEffect(effect, severity, description, actionTaken);

    console.log('✅ Adverse effect recorded:', { effect, severity });

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

  // ────────────────────────────────────────────────────────────
  // Add session note
  // ────────────────────────────────────────────────────────────
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

    consultation.sessionNotes = consultation.sessionNotes || [];
    const newNote = {
      timestamp: new Date(),
      note,
      addedBy: req.user._id,
      type: type || 'general'
    };

    consultation.sessionNotes.push(newNote);
    await consultation.save();

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

  // ────────────────────────────────────────────────────────────
  // Dashboard (today) – uses professional ids
  // ────────────────────────────────────────────────────────────
  getTrackingDashboard = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 [DASHBOARD] getTrackingDashboard called');
    console.log('👤 [USER]', {
      id: req.user?._id?.toString?.() || req.user?._id,
      role: req.user?.role
    });
    console.log('📅 [RANGE]', {
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString()
    });

    try {
      const providerScope = await this.resolveProviderScope(req);
      console.log('🧾 [PROVIDER_SCOPE]', providerScope ? {
        providerId: providerScope.providerId.toString(),
        providerModel: providerScope.providerModel
      } : 'none');

      const baseQuery = {
        scheduledAt: {
          $gte: today,
          $lt: tomorrow
        }
      };

      if (providerScope) {
        baseQuery.providerId = providerScope.providerId;
        // optional: baseQuery.providerModel = providerScope.providerModel;
      }

      console.log('🔍 [BASE_QUERY]', baseQuery);

      const queryStart = Date.now();

      const [
        activeSessions,
        pausedSessions,
        upcomingSessions,
        completedSessions
      ] = await Promise.all([
        Consultation.find({ ...baseQuery, sessionStatus: 'in_progress' })
          .populate('patientId', 'name email phone profile')
          .populate('providerId', 'name role')
          .sort({ scheduledAt: -1 })
          .lean(),
        Consultation.find({ ...baseQuery, sessionStatus: 'paused' })
          .populate('patientId', 'name email phone profile')
          .populate('providerId', 'name role')
          .sort({ scheduledAt: -1 })
          .lean(),
        Consultation.find({
          ...baseQuery,
          sessionStatus: {
            $in: ['scheduled', 'confirmed', 'patient_arrived', 'therapist_ready']
          }
        })
          .populate('patientId', 'name email phone profile')
          .populate('providerId', 'name role')
          .sort({ scheduledAt: 1 })
          .lean(),
        Consultation.find({ ...baseQuery, sessionStatus: 'completed' })
          .populate('patientId', 'name email phone profile')
          .populate('providerId', 'name role')
          .sort({ sessionEndTime: -1 })
          .lean()
      ]);

      console.log('⏱️ [MONGO_DURATION_MS]', Date.now() - queryStart);
      console.log('📊 [COUNTS]', {
        active: activeSessions.length,
        paused: pausedSessions.length,
        upcoming: upcomingSessions.length,
        completed: completedSessions.length
      });

      const debugSample = (arr, label) => {
        console.log(`🔎 [SAMPLE:${label}] count=${arr.length}`);
        (arr.slice(0, 2) || []).forEach((s, i) => {
          console.log(
            `  • ${label}[${i}]`,
            util.inspect(
              {
                _id: s._id,
                patientId: s.patientId?._id,
                providerId: s.providerId?._id,
                providerType: s.providerType,
                providerModel: s.providerModel,
                sessionType: s.sessionType,
                sessionStatus: s.sessionStatus,
                status: s.status,
                scheduledAt: s.scheduledAt,
                therapyType: s.therapyData?.therapyType
              },
              { depth: null, colors: true }
            )
          );
        });
      };

      debugSample(activeSessions, 'ACTIVE');
      debugSample(pausedSessions, 'PAUSED');
      debugSample(upcomingSessions, 'UPCOMING');
      debugSample(completedSessions, 'COMPLETED');

      let systemState = {
        connectedUsers: [],
        totalConnections: 0,
        activeSessions: [],
        activeCountdowns: 0
      };
      try {
        const wsService = req.app.get('wsService');
        if (wsService?.getSystemState) {
          systemState = wsService.getSystemState();
          console.log('🌐 [WS_STATE]', systemState);
        } else {
          console.log('🌐 [WS_STATE] wsService or getSystemState not available');
        }
      } catch (wsErr) {
        console.warn('⚠️ [WS_ERROR]', wsErr.message);
      }

      const formatSession = (session, bucket) => {
        const hasTherapyData =
          session.sessionType === 'therapy' && !!session.therapyData;
        const hasTiming =
          !!session.sessionStartTime &&
          session.sessionStatus === 'in_progress' &&
          !!session.estimatedDuration;

        if (!hasTiming) {
          console.log(
            `⏱️ [TIMING_SKIP] session=${session._id} bucket=${bucket} status=${session.sessionStatus} start=${session.sessionStartTime}`
          );
        }

        const now = Date.now();
        const startTime = session.sessionStartTime
          ? new Date(session.sessionStartTime).getTime()
          : null;

        const elapsedMs = hasTiming && startTime ? now - startTime : null;
        const totalMs =
          hasTiming && session.estimatedDuration
            ? session.estimatedDuration * 60 * 1000
            : null;
        const remainingMs =
          hasTiming && totalMs != null ? Math.max(0, totalMs - elapsedMs) : null;
        const pct =
          hasTiming && totalMs ? Math.min(100, (elapsedMs / totalMs) * 100) : 0;

        const formatted = {
          _id: session._id,
          id: session._id.toString(),
          patientId: session.patientId?._id,
          patientName: session.patientId?.name || 'Unknown Patient',
          patientEmail: session.patientId?.email,
          patientPhone: session.patientId?.phone,
          patientProfile: session.patientId?.profile || {},
          providerId: session.providerId?._id,
          providerName: session.providerId?.name || 'Unassigned',
          providerRole: session.providerId?.role,
          providerType: session.providerType,
          type: session.type,
          scheduledAt: session.scheduledAt,
          scheduledDate: session.scheduledDate,
          scheduledTime: session.scheduledTime,
          status: session.status,
          sessionStatus: session.sessionStatus,
          fee: session.fee,
          notes: session.notes,
          meetingLink: session.meetingLink,
          sessionType: session.sessionType,
          therapyType:
            session.sessionType === 'therapy'
              ? session.therapyData?.therapyType
              : undefined,
          estimatedDuration: session.estimatedDuration,
          actualDuration: session.actualDuration,
          sessionStartTime: session.sessionStartTime,
          sessionEndTime: session.sessionEndTime,
          roomNumber: session.therapyData?.room,
          dayNumber: session.therapyData?.dayNumber,
          totalDays: session.therapyData?.totalDays,
          rating: session.rating,
          patientFeedback: session.patientFeedback,
          sessionMetadata: session.sessionMetadata,
          sessionNotes: session.sessionNotes,
          activeParticipants: session.activeParticipants,
          statusHistory: session.statusHistory,
          participantCount: session.activeParticipants?.length || 0,
          timing:
            hasTiming && elapsedMs != null
              ? {
                  elapsedTimeMs: elapsedMs,
                  remainingTimeMs: remainingMs,
                  progressPercentage: Math.round(pct * 10) / 10
                }
              : null
        };

        console.log(
          `✅ [FORMAT] session=${session._id} bucket=${bucket}`,
          util.inspect(
            {
              sessionType: formatted.sessionType,
              sessionStatus: formatted.sessionStatus,
              therapyType: formatted.therapyType,
              timing: formatted.timing
            },
            { depth: null, colors: true }
          )
        );

        if (formatted.sessionType === 'therapy' && !hasTherapyData) {
          console.warn(
            `⚠️ [THERAPY_MISSING] session=${session._id} marked as therapy but no therapyData`
          );
        }

        return formatted;
      };

      const formattedActive = activeSessions.map((s) =>
        formatSession(s, 'ACTIVE')
      );
      const formattedPaused = pausedSessions.map((s) =>
        formatSession(s, 'PAUSED')
      );
      const formattedUpcoming = upcomingSessions.map((s) =>
        formatSession(s, 'UPCOMING')
      );
      const formattedCompleted = completedSessions.map((s) =>
        formatSession(s, 'COMPLETED')
      );

      const stats = {
        active: activeSessions.length,
        upcoming: upcomingSessions.length,
        completed: completedSessions.length,
        paused: pausedSessions.length,
        total:
          activeSessions.length +
          upcomingSessions.length +
          completedSessions.length +
          pausedSessions.length,
        connectedUsers: systemState.totalConnections || 0,
        activeCountdowns: systemState.activeCountdowns || 0
      };

      console.log('📈 [STATS]', stats);
      console.log('🧾 [PAYLOAD_SAMPLE]', {
        activeSample: formattedActive[0],
        upcomingSample: formattedUpcoming[0]
      });

      res.json({
        success: true,
        data: {
          activeSessions: formattedActive,
          pausedSessions: formattedPaused,
          upcomingSessions: formattedUpcoming,
          completedSessions: formattedCompleted,
          connectedUsers: systemState.connectedUsers || [],
          totalSessions: stats.total,
          stats,
          dateRange: { from: today, to: tomorrow }
        },
        timestamp: new Date().toISOString()
      });

      console.log('✅ [DASHBOARD] Response sent successfully');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      console.error('❌ [DASHBOARD_ERROR]', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load therapy tracking dashboard',
        error: error.message || 'Internal server error'
      });
    }
  });

  // ────────────────────────────────────────────────────────────
  // Upcoming sessions – uses professional ids
  // ────────────────────────────────────────────────────────────
  getUpcomingSessions = asyncHandler(async (req, res) => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    console.log('📅 Loading upcoming sessions for user:', req.user._id, req.user.role);

    const query = {
      scheduledAt: { $gte: now, $lte: endOfDay },
      $or: [
        {
          sessionStatus: {
            $in: ['scheduled', 'confirmed', 'patient_arrived', 'therapist_ready']
          }
        },
        { status: 'scheduled' }
      ]
    };

    const providerScope = await this.resolveProviderScope(req);
    if (providerScope) {
      query.providerId = providerScope.providerId;
      // optional: query.providerModel = providerScope.providerModel;
    }

    console.log('🔍 Upcoming sessions query:', JSON.stringify(query));

    const upcomingSessions = await Consultation.find(query)
      .populate('patientId', 'name email phone')
      .populate('providerId', 'name role')
      .sort({ scheduledAt: 1 })
      .lean();

    console.log(`📅 Found ${upcomingSessions.length} upcoming sessions`);

    const formattedSessions = upcomingSessions.map((session) => {
      const timeToSession = new Date(session.scheduledAt) - now;
      const hours = Math.floor(timeToSession / (1000 * 60 * 60));
      const minutes = Math.floor(
        (timeToSession % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((timeToSession % (1000 * 60)) / 1000);

      return {
        ...this.formatSessionForTracking(session),
        timeRemaining: {
          total: timeToSession,
          hours,
          minutes,
          seconds,
          overdue: timeToSession < 0,
          formatted: timeToSession < 0 ? 'Overdue' : `${hours}h ${minutes}m`
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

  // ────────────────────────────────────────────────────────────
  // Format session for tracking
  // ────────────────────────────────────────────────────────────
  formatSessionForTracking(consultation) {
    let elapsedTime = null;
    let remainingTime = null;
    let progressPercentage = 0;

    const currentStatus = consultation.sessionStatus || consultation.status;

    if (currentStatus === 'in_progress' && consultation.sessionStartTime) {
      const now = new Date();
      const startTime = new Date(consultation.sessionStartTime);
      elapsedTime = now - startTime;

      const estimatedDuration =
        (consultation.estimatedDuration || 60) * 60 * 1000;
      remainingTime = Math.max(0, estimatedDuration - elapsedTime);
      progressPercentage = Math.min(100, (elapsedTime / estimatedDuration) * 100);
    }

    return {
      id: consultation._id,
      patientId: consultation.patientId?._id,
      patientName: consultation.patientId?.name || 'Unknown Patient',
      patientEmail: consultation.patientId?.email,
      patientPhone: consultation.patientId?.phone,
      therapyType:
        consultation.sessionType === 'therapy'
          ? consultation.therapyData?.therapyType || consultation.type
          : consultation.type || 'general_consultation',
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
      roomNumber: consultation.therapyData?.room || 'TBD',
      currentPhase: consultation.currentPhase,
      participantCount: consultation.activeParticipants?.length || 0,
      dayNumber: consultation.therapyData?.dayNumber || 1,
      totalDays: consultation.therapyData?.totalDays || 21,
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

  // ────────────────────────────────────────────────────────────
  // Patient milestones
  // ────────────────────────────────────────────────────────────
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

    const consultations = await Consultation.find({
      patientId,
      $or: [{ sessionStatus: 'completed' }, { status: 'completed' }]
    })
      .sort({ completedAt: -1 })
      .lean();

    console.log(
      `🏆 Found ${consultations.length} completed sessions for patient`
    );

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

  updateMilestone = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { milestoneType, title, description } = req.body;

    if (!milestoneType || !title) {
      throw new AppError('Milestone type and title are required', 400, 'VALIDATION_ERROR');
    }

    console.log(
      '🏆 Adding milestone for patient:',
      patientId,
      '- Type:',
      milestoneType
    );

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

  calculatePatientMilestones(patient, consultations) {
    const totalSessions = consultations.length;
    const completedSessions = consultations.filter(
      (c) => c.sessionStatus === 'completed' || c.status === 'completed'
    ).length;

    const progressPercentage =
      totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    const achievements = [];
    const upcomingGoals = [];

    const milestoneDefinitions = [
      {
        count: 1,
        type: 'first_session',
        title: 'First Therapy Completed',
        emoji: '🎯'
      },
      { count: 3, type: 'early_progress', title: '3 Sessions Completed', emoji: '🌱' },
      { count: 5, type: 'progress_milestone', title: '5 Sessions Completed', emoji: '⭐' },
      { count: 7, type: 'week_complete', title: 'Week 1 Complete (7 sessions)', emoji: '🏆' },
      { count: 10, type: 'double_digits', title: '10 Sessions Completed', emoji: '💪' },
      { count: 14, type: 'two_weeks', title: 'Two Weeks Complete', emoji: '🎉' },
      {
        count: 21,
        type: 'full_treatment',
        title: 'Full Treatment Complete (21 sessions)',
        emoji: '👑'
      }
    ];

    milestoneDefinitions.forEach((milestone) => {
      if (completedSessions >= milestone.count) {
        achievements.push({
          type: milestone.type,
          title: milestone.title,
          emoji: milestone.emoji,
          achievedAt:
            consultations[milestone.count - 1]?.sessionEndTime ||
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
