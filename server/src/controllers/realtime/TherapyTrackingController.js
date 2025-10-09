// src/controllers/realtime/therapyTracking.controller.js (NEW)
const { asyncHandler, AppError } = require('../../middleware/error.middleware');
const Consultation = require('../../models/Consultation');
const Patient = require('../../models/Patient');

class TherapyTrackingController {
  
  // ✅ NEW: Get dashboard data for therapy tracking
  getTrackingDashboard = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    try {
      // Get today's sessions
      const todaySessions = await Consultation.find({
        scheduledFor: {
          $gte: today,
          $lt: tomorrow
        },
        providerId: req.user.role === 'doctor' ? req.user._id : undefined
      })
      .populate('patientId', 'name email phone')
      .populate('providerId', 'name role')
      .sort({ scheduledFor: 1 });

      // Categorize sessions
      const activeSessions = todaySessions.filter(s => s.sessionStatus === 'in_progress');
      const upcomingSessions = todaySessions.filter(s => 
        ['scheduled', 'confirmed'].includes(s.sessionStatus)
      );
      const completedToday = todaySessions.filter(s => s.sessionStatus === 'completed');

      // ✅ FIX: Safe WebSocket service access
      let systemState = { connectedUsers: [], totalConnections: 0 };
      try {
        const wsService = req.app.get('wsService');
        if (wsService && typeof wsService.getSystemState === 'function') {
          systemState = wsService.getSystemState();
        }
      } catch (wsError) {
        console.log('⚠️ WebSocket service not available:', wsError.message);
      }

      res.json({
        success: true,
        data: {
          activeSessions: activeSessions.map(session => this.formatSessionForTracking(session)),
          upcomingSessions: upcomingSessions.map(session => this.formatSessionForTracking(session)),
          completedToday: completedToday.map(session => this.formatSessionForTracking(session)),
          connectedUsers: systemState.connectedUsers || [],
          totalSessions: todaySessions.length,
          stats: {
            active: activeSessions.length,
            upcoming: upcomingSessions.length,
            completed: completedToday.length,
            connectedUsers: systemState.totalConnections || 0
          }
        }
      });
    } catch (error) {
      console.error('❌ Error in getTrackingDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load therapy tracking dashboard',
        error: error.message
      });
    }
  });


  
  // ✅ NEW: Get patient milestones
  getPatientMilestones = asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');
    }

    // Get consultation history for milestones
    const consultations = await Consultation.find({
      patientId,
      sessionStatus: 'completed'
    }).sort({ completedAt: -1 });

    // Calculate milestones (example logic)
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

  // ✅ NEW: Update milestone achievement
  updateMilestone = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { milestoneType, title, description } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');
    }

    // Add milestone to patient record
    if (!patient.milestones) {
      patient.milestones = [];
    }

    const newMilestone = {
      type: milestoneType,
      title,
      description,
      achievedAt: new Date(),
      achievedBy: req.user._id
    };

    patient.milestones.push(newMilestone);
    await patient.save();

    // ✅ Broadcast milestone achievement
    const wsService = req.app.get('wsService');
    wsService.emitMilestoneAchieved(patientId, {
      ...newMilestone,
      patientName: patient.name,
      achievedBy: req.user.name
    });

    res.json({
      success: true,
      message: 'Milestone updated successfully',
      data: { milestone: newMilestone }
    });
  });

  // ✅ NEW: Get upcoming sessions with countdown
  getUpcomingSessions = asyncHandler(async (req, res) => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const upcomingSessions = await Consultation.find({
      scheduledFor: { $gte: now, $lte: endOfDay },
      sessionStatus: { $in: ['scheduled', 'confirmed'] },
      providerId: req.user.role === 'doctor' ? req.user._id : undefined
    })
    .populate('patientId', 'name email phone')
    .populate('providerId', 'name role')
    .sort({ scheduledFor: 1 });

    const formattedSessions = upcomingSessions.map(session => {
      const timeToSession = session.scheduledFor - now;
      return {
        ...this.formatSessionForTracking(session),
        timeRemaining: {
          total: timeToSession,
          hours: Math.floor(timeToSession / (1000 * 60 * 60)),
          minutes: Math.floor((timeToSession % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((timeToSession % (1000 * 60)) / 1000),
          overdue: timeToSession < 0
        }
      };
    });

    res.json({
      success: true,
      data: { sessions: formattedSessions }
    });
  });

  // ✅ NEW: Format session for tracking display
  formatSessionForTracking(consultation) {
    return {
      id: consultation._id,
      patientId: consultation.patientId?._id,
      patientName: consultation.patientId?.name || 'Unknown Patient',
      therapyType: consultation.type || 'general_consultation',
      sessionType: consultation.sessionType || 'standard',
      status: consultation.sessionStatus,
      scheduledAt: consultation.scheduledFor,
      startedAt: consultation.sessionStartTime,
      estimatedDuration: consultation.estimatedDuration || 60,
      therapistName: consultation.providerId?.name || 'Assigned Therapist',
      roomNumber: consultation.roomNumber || 'TBD',
      currentPhase: consultation.currentPhase,
      participantCount: consultation.activeParticipants?.length || 0,
      dayNumber: consultation.dayNumber || 1,
      totalDays: consultation.totalDays || 21,
      preparationTime: consultation.preparationTime || 30,
      alerts: consultation.preSessionAlerts || [],
      lastUpdate: consultation.updatedAt
    };
  }

  // ✅ NEW: Calculate patient milestones
  calculatePatientMilestones(patient, consultations) {
    const totalSessions = consultations.length;
    const completedSessions = consultations.filter(c => c.sessionStatus === 'completed').length;
    const progressPercentage = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    const achievements = [];
    const upcomingGoals = [];

    // Example milestone logic
    if (completedSessions >= 1) {
      achievements.push({
        type: 'first_session',
        title: 'First Therapy Completed',
        achievedAt: consultations[0]?.completedAt || new Date()
      });
    }

    if (completedSessions >= 5) {
      achievements.push({
        type: 'progress_milestone',
        title: '5 Sessions Completed',
        achievedAt: consultations[4]?.completedAt || new Date()
      });
    }

    // Upcoming goals
    if (completedSessions < 7) {
      upcomingGoals.push({
        title: 'Complete Week 1 (7 sessions)',
        estimatedDays: 7 - completedSessions
      });
    }

    if (completedSessions < 21) {
      upcomingGoals.push({
        title: 'Complete Full Treatment (21 sessions)',
        estimatedDays: 21 - completedSessions
      });
    }

    return {
      patientName: patient.name,
      therapyType: patient.currentTreatmentPlan?.type || 'panchakarma',
      currentDay: completedSessions + 1,
      totalDays: 21,
      progressPercentage,
      achievements,
      upcomingGoals
    };
  }
}

module.exports = new TherapyTrackingController();
