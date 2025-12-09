// backend/controllers/patientProgress.controller.js
const TreatmentPlan = require('../models/TreatmentPlan');
const Consultation = require('../models/Consultation');
const mongoose = require('mongoose');

/**
 * ✅ Verify patient can access the requested data
 * Patients can only access their own data
 * Doctors/therapists/admins can access any patient data
 */
const verifyPatientAccess = (req, patientId) => {
  const authenticatedUserId = req.user._id.toString();
  const userRole = req.user.role?.toLowerCase();

  console.log('🔐 Verifying patient access:', {
    requestedPatientId: patientId,
    authenticatedUserId: authenticatedUserId,
    userRole: userRole
  });

  // ✅ Admins, doctors, and therapists can access any patient data
  if (['admin', 'super_admin', 'moderator', 'doctor', 'therapist'].includes(userRole)) {
    console.log('✅ Access granted - privileged role');
    return true;
  }

  // ✅ Patients can only access their own data
  if (userRole === 'patient' && patientId === authenticatedUserId) {
    console.log('✅ Access granted - patient accessing own data');
    return true;
  }

  console.log('❌ Access denied - insufficient permissions');
  return false;
};

/**
 * 📊 Get Complete Patient Progress Dashboard
 * Returns all patient-facing therapy progress data
 * 
 * @route   GET /api/v1/patients/:patientId/therapy-progress
 * @access  Private (Patient, Doctor, Therapist, Admin)
 */
const getPatientProgressDashboard = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Validate patientId
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PATIENT_ID',
          message: 'Invalid patient ID format'
        }
      });
    }

    // ✅ Verify patient access
    if (!verifyPatientAccess(req, patientId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only access your own therapy progress'
        }
      });
    }

    // Find active treatment plan for patient
    const treatmentPlan = await TreatmentPlan.findOne({
      patientId: patientId,
      status: { $in: ['active', 'paused'] }
    })
    .select('-schedulingMetadata -schedulingErrors -__v')
    .lean();

    if (!treatmentPlan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No active treatment plan found for this patient'
        }
      });
    }

    // Use the schema method to get dashboard data
    const treatmentPlanDoc = await TreatmentPlan.findById(treatmentPlan._id);
    const dashboardData = await treatmentPlanDoc.getPatientProgressDashboard();

    console.log('✅ Patient progress retrieved successfully');

    // ✅ Return patient-safe data only
    return res.status(200).json({
      success: true,
      data: {
        treatmentPlanId: treatmentPlan._id,
        ...dashboardData,
        lastUpdated: new Date().toISOString()
      },
      message: 'Patient progress retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching patient progress:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve patient progress data'
      }
    });
  }
};

/**
 * 🔴 Get Active Session Progress (Real-time)
 * Returns current session stage and percentage
 * 
 * @route   GET /api/v1/patients/:patientId/sessions/active
 * @access  Private (Patient, Doctor, Therapist, Admin)
 */
const getActiveSessionProgress = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Validate patientId
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PATIENT_ID',
          message: 'Invalid patient ID format'
        }
      });
    }

    // ✅ Verify patient access
    if (!verifyPatientAccess(req, patientId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only access your own session data'
        }
      });
    }

    // Find active therapy session
    const activeSession = await Consultation.findOne({
      patientId: patientId,
      sessionType: 'therapy',
      status: 'in_progress'
    });

    if (!activeSession) {
      console.log('ℹ️ No active session in progress');
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active session in progress'
      });
    }

    // Get patient-safe progress data
    const progressData = activeSession.getActiveSessionProgress();

    console.log('✅ Active session progress retrieved');

    return res.status(200).json({
      success: true,
      data: progressData,
      message: 'Active session progress retrieved'
    });

  } catch (error) {
    console.error('❌ Error fetching active session:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve active session data'
      }
    });
  }
};

/**
 * 📅 Get Upcoming Sessions
 * Returns next N therapy sessions for patient
 * 
 * @route   GET /api/v1/patients/:patientId/sessions/upcoming
 * @access  Private (Patient, Doctor, Therapist, Admin)
 */
const getUpcomingSessions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const limit = parseInt(req.query.limit) || 5; // Default 5 sessions

    // Validate patientId
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PATIENT_ID',
          message: 'Invalid patient ID format'
        }
      });
    }

    // Validate limit
    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'Limit must be between 1 and 50'
        }
      });
    }

    // ✅ Verify patient access
    if (!verifyPatientAccess(req, patientId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only access your own session data'
        }
      });
    }

    // Find active treatment plan
    const treatmentPlan = await TreatmentPlan.findOne({
      patientId: patientId,
      status: { $in: ['active', 'paused'] }
    });

    if (!treatmentPlan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No active treatment plan found'
        }
      });
    }

    // Get upcoming sessions
    const upcomingSessions = treatmentPlan.getUpcomingSessionsForPatient(limit);

    console.log(`✅ Retrieved ${upcomingSessions.length} upcoming sessions`);

    return res.status(200).json({
      success: true,
      data: {
        sessions: upcomingSessions,
        count: upcomingSessions.length
      },
      message: 'Upcoming sessions retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching upcoming sessions:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve upcoming sessions'
      }
    });
  }
};

/**
 * 📝 Get Completed Sessions History
 * Returns historical therapy sessions with patient feedback
 * 
 * @route   GET /api/v1/patients/:patientId/sessions/completed
 * @access  Private (Patient, Doctor, Therapist, Admin)
 */
const getCompletedSessions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const limit = parseInt(req.query.limit) || 10; // Default 10 sessions
    const page = parseInt(req.query.page) || 1; // Default page 1

    // Validate patientId
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PATIENT_ID',
          message: 'Invalid patient ID format'
        }
      });
    }

    // Validate limit
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'Limit must be between 1 and 100'
        }
      });
    }

    // ✅ Verify patient access
    if (!verifyPatientAccess(req, patientId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only access your own session data'
        }
      });
    }

    // Find treatment plan (including completed ones)
    const treatmentPlan = await TreatmentPlan.findOne({
      patientId: patientId,
      status: { $in: ['active', 'completed', 'paused'] }
    });

    if (!treatmentPlan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No treatment plan found'
        }
      });
    }

    // Get completed sessions
    const completedSessions = await treatmentPlan.getCompletedSessionsForPatient(limit);

    console.log(`✅ Retrieved ${completedSessions.length} completed sessions`);

    return res.status(200).json({
      success: true,
      data: {
        sessions: completedSessions,
        count: completedSessions.length,
        totalCompleted: treatmentPlan.completedSessions,
        currentPage: page,
        hasMore: completedSessions.length === limit
      },
      message: 'Completed sessions retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching completed sessions:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve completed sessions'
      }
    });
  }
};

/**
 * 📄 Get Session Details
 * Returns detailed information about a specific session
 * 
 * @route   GET /api/v1/patients/:patientId/sessions/:sessionId
 * @access  Private (Patient, Doctor, Therapist, Admin)
 */
const getSessionDetails = async (req, res) => {
  try {
    const { patientId, sessionId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid patient or session ID format'
        }
      });
    }

    // ✅ Verify patient access
    if (!verifyPatientAccess(req, patientId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only access your own session data'
        }
      });
    }

    // Find consultation
    const consultation = await Consultation.findOne({
      _id: sessionId,
      patientId: patientId,
      sessionType: 'therapy'
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      });
    }

    // Return patient-safe view
    const safeView = consultation.getPatientSafeView();

    console.log('✅ Session details retrieved');

    return res.status(200).json({
      success: true,
      data: safeView,
      message: 'Session details retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching session details:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve session details'
      }
    });
  }
};

/**
 * ⭐ Submit Patient Feedback
 * Allows patients to rate session and provide feedback
 * 
 * @route   POST /api/v1/patients/:patientId/sessions/:sessionId/feedback
 * @access  Private (Patient Only)
 */
const submitPatientFeedback = async (req, res) => {
  try {
    const { patientId, sessionId } = req.params;
    const { rating, feedback, symptoms, comfortLevel } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid patient or session ID format'
        }
      });
    }

    // ✅ Only patients can submit their own feedback
    const authenticatedUserId = req.user._id.toString();
    const userRole = req.user.role?.toLowerCase();

    if (userRole !== 'patient' || patientId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only patients can submit feedback for their own sessions'
        }
      });
    }

    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RATING',
          message: 'Rating must be a number between 1 and 5'
        }
      });
    }

    // Validate feedback length
    if (feedback && feedback.length > 500) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FEEDBACK_TOO_LONG',
          message: 'Feedback must not exceed 500 characters'
        }
      });
    }

    // Validate comfortLevel enum
    const validComfortLevels = ['comfortable', 'mild_discomfort', 'moderate_discomfort', 'severe_discomfort'];
    if (comfortLevel && !validComfortLevels.includes(comfortLevel)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COMFORT_LEVEL',
          message: `Comfort level must be one of: ${validComfortLevels.join(', ')}`
        }
      });
    }

    // Find consultation
    const consultation = await Consultation.findOne({
      _id: sessionId,
      patientId: patientId,
      sessionType: 'therapy',
      status: 'completed'
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found or not yet completed'
        }
      });
    }

    // Check if feedback already submitted
    if (consultation.rating) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FEEDBACK_EXISTS',
          message: 'Feedback already submitted for this session. You can only submit feedback once.'
        }
      });
    }

    // Build feedback text
    let feedbackText = feedback || '';
    
    // ✅ Store patient-reported symptoms (this is safe, it's from patient)
    if (symptoms) {
      feedbackText += `\n\n[Symptoms Reported]: ${symptoms}`;
    }
    if (comfortLevel) {
      feedbackText += `\n\n[Comfort Level]: ${comfortLevel}`;
    }

    // Update consultation with patient feedback
    consultation.rating = rating;
    consultation.patientFeedback = feedbackText.trim();

    await consultation.save();

    console.log(`✅ Feedback submitted for session ${sessionId} by patient ${patientId}`);

    // Return patient-safe view
    const safeView = consultation.getPatientSafeView();

    return res.status(200).json({
      success: true,
      data: safeView,
      message: 'Thank you! Your feedback has been submitted successfully.'
    });

  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to submit feedback. Please try again.'
      }
    });
  }
};

module.exports = {
  getPatientProgressDashboard,
  getActiveSessionProgress,
  getUpcomingSessions,
  getCompletedSessions,
  submitPatientFeedback,
  getSessionDetails
};
