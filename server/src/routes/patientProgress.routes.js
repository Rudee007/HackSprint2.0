// backend/routes/patientProgress.routes.js
const express = require('express');
const router = express.Router();

// Import controllers
const {
  getPatientProgressDashboard,
  getActiveSessionProgress,
  getUpcomingSessions,
  getCompletedSessions,
  submitPatientFeedback,
  getSessionDetails
} = require('../controllers/patientProgress.controller');

// ✅ Import YOUR existing middleware
const { authenticate, authorize } = require('../middleware/auth.middleware');

// ═══════════════════════════════════════════════════════════
// 📊 PATIENT PROGRESS ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * @route   GET /api/v1/patients/:patientId/therapy-progress
 * @desc    Get complete patient progress dashboard
 * @access  Private (Patient, Doctor, Therapist, Admin)
 * @response {
 *   success: true,
 *   data: {
 *     overallProgress: { completedSessions, totalSessionsPlanned, progressPercentage, currentPhase, ... },
 *     upcomingSessions: [{ sessionId, therapyName, scheduledDate, ... }],
 *     completedSessions: [{ _id, therapyName, rating, patientFeedback, ... }],
 *     activeSession: { sessionId, currentStage, percentage, ... } | null,
 *     instructions: { prePanchakarma, postPanchakarma, safety },
 *     phases: [{ name, totalDays, instructions, dietPlan, lifestyleGuidelines }]
 *   },
 *   message: "Patient progress retrieved successfully"
 * }
 */
router.get(
  '/:patientId/therapy-progress',
  authenticate,                                    // ✅ Your JWT authentication
  authorize('patient', 'doctor', 'therapist', 'admin', 'super_admin'),  // ✅ Your RBAC
  getPatientProgressDashboard
);

/**
 * @route   GET /api/v1/patients/:patientId/sessions/active
 * @desc    Get real-time active session progress
 * @access  Private (Patient, Doctor, Therapist, Admin)
 * @response {
 *   success: true,
 *   data: {
 *     sessionId: "...",
 *     therapyName: "Abhyanga",
 *     currentStage: "massage",
 *     percentage: 65,
 *     startedAt: "2025-12-08T09:05:00Z",
 *     estimatedEndTime: "2025-12-08T10:05:00Z",
 *     stages: ["preparation", "massage", "steam", "rest", "cleanup"]
 *   } | null,
 *   message: "Active session progress retrieved"
 * }
 */
router.get(
  '/:patientId/sessions/active',
  authenticate,
  authorize('patient', 'doctor', 'therapist', 'admin', 'super_admin'),
  getActiveSessionProgress
);

/**
 * @route   GET /api/v1/patients/:patientId/sessions/upcoming
 * @desc    Get upcoming therapy sessions
 * @access  Private (Patient, Doctor, Therapist, Admin)
 * @query   limit (optional, default: 5, max: 50)
 * @response {
 *   success: true,
 *   data: {
 *     sessions: [
 *       {
 *         sessionId: "...",
 *         therapyName: "Abhyanga",
 *         scheduledDate: "2025-12-09T00:00:00Z",
 *         scheduledStartTime: "2025-12-09T09:00:00Z",
 *         scheduledEndTime: "2025-12-09T10:00:00Z",
 *         phaseName: "purvakarma",
 *         sessionNumber: 9,
 *         dayNumber: 9,
 *         status: "scheduled"
 *       }
 *     ],
 *     count: 5
 *   },
 *   message: "Upcoming sessions retrieved successfully"
 * }
 */
router.get(
  '/:patientId/sessions/upcoming',
  authenticate,
  authorize('patient', 'doctor', 'therapist', 'admin', 'super_admin'),
  getUpcomingSessions
);

/**
 * @route   GET /api/v1/patients/:patientId/sessions/completed
 * @desc    Get completed therapy sessions history
 * @access  Private (Patient, Doctor, Therapist, Admin)
 * @query   limit (optional, default: 10, max: 100)
 * @query   page (optional, default: 1)
 * @response {
 *   success: true,
 *   data: {
 *     sessions: [
 *       {
 *         _id: "...",
 *         scheduledAt: "2025-12-08T09:00:00Z",
 *         therapyName: "Abhyanga",
 *         dayNumber: 8,
 *         rating: 5,
 *         patientFeedback: "Felt very relaxed...",
 *         status: "completed"
 *       }
 *     ],
 *     count: 10,
 *     totalCompleted: 15,
 *     currentPage: 1,
 *     hasMore: true
 *   },
 *   message: "Completed sessions retrieved successfully"
 * }
 */
router.get(
  '/:patientId/sessions/completed',
  authenticate,
  authorize('patient', 'doctor', 'therapist', 'admin', 'super_admin'),
  getCompletedSessions
);

/**
 * @route   GET /api/v1/patients/:patientId/sessions/:sessionId
 * @desc    Get detailed information about a specific session
 * @access  Private (Patient, Doctor, Therapist, Admin)
 * @response {
 *   success: true,
 *   data: {
 *     _id: "...",
 *     scheduledAt: "...",
 *     therapyData: {
 *       therapyName: "...",
 *       dayNumber: 5,
 *       progressUpdates: [...],
 *       preInstructions: "...",
 *       postInstructions: "..."
 *     },
 *     rating: 5,
 *     patientFeedback: "..."
 *   },
 *   message: "Session details retrieved successfully"
 * }
 */
router.get(
  '/:patientId/sessions/:sessionId',
  authenticate,
  authorize('patient', 'doctor', 'therapist', 'admin', 'super_admin'),
  getSessionDetails
);

/**
 * @route   POST /api/v1/patients/:patientId/sessions/:sessionId/feedback
 * @desc    Submit patient feedback for completed session
 * @access  Private (Patient Only)
 * @body    {
 *   rating: 1-5 (required),
 *   feedback: "..." (optional, max 500 chars),
 *   symptoms: "..." (optional),
 *   comfortLevel: "comfortable" | "mild_discomfort" | "moderate_discomfort" | "severe_discomfort" (optional)
 * }
 * @response {
 *   success: true,
 *   data: { ...sessionData },
 *   message: "Thank you! Your feedback has been submitted successfully."
 * }
 */
router.post(
  '/:patientId/sessions/:sessionId/feedback',
  authenticate,
  authorize('patient'),  // ✅ ONLY patients can submit feedback
  submitPatientFeedback
);

module.exports = router;
