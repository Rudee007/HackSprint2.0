// routes/feedback.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin, requirePermission } = require('../middleware/admin.middleware');
const feedbackController = require('../controllers/feedback.controller');

// All feedback endpoints require auth
router.use(authenticate);

// ============ PATIENT ROUTES ============
// Body for submitFeedback must include:
// sessionId, sessionType ('consultation' | 'therapy_session'),
// providerId, therapyType, ratings, healthMetrics etc.

// Submit new feedback (patient first)
// router.post(
//   '/',
//   // optional hard check: only patients can create
//   // (req, res, next) => req.user.role === 'patient' ? next() : res.status(403).json({ message: 'Only patients can submit feedback' }),
//   feedbackController.submitFeedback
// );


router.post('/',feedbackController.createFeedback);
// Get my feedback list (paginated)
// router.get(
//   '/my-feedback',
//   feedbackController.getMyFeedback
// );

router.get(
  '/me',
  feedbackController.getMyFeedback
);


router.get(
  '/doctor',
  feedbackController.getDoctorFeedback
);



router.get(
  '/doctor/:id',
  feedbackController.getDoctorFeedbackById
);

router.patch(
  '/doctor/:id/review',
  feedbackController.reviewFeedbackAsDoctor
);



// Get feedback for a specific session (current patient)
router.get(
  '/session/:sessionId',
  feedbackController.getSessionFeedback
);

// Update my feedback (within 24 hours)
router.put(
  '/my-feedback/:feedbackId',
  feedbackController.updateMyFeedback
);

// ============ PROVIDER ROUTES (enable when needed) ============

// Feedback on my sessions (doctor / therapist dashboard)
router.get(
  '/provider/my-feedback',
  // optional: ensure role is doctor/therapist
  // requirePermission('view_provider_feedback'),
  feedbackController.getProviderFeedback
);

// Provider performance analytics
router.get(
  '/provider/analytics',
  // requirePermission('view_provider_feedback'),
  feedbackController.getProviderAnalytics
);

// ============ ADMIN ROUTES (enable when needed) ============

// All feedback with filters
router.get(
  '/admin/all',
  requireAdmin,
  // requirePermission('feedback_management'),
  feedbackController.getAllFeedback
);

// Global feedback stats
router.get(
  '/admin/stats',
  requireAdmin,
  requirePermission('system_analytics'),
  feedbackController.getFeedbackStats
);

// Patient progress analytics
router.get(
  '/admin/patient/:patientId/progress',
  requireAdmin,
  requirePermission('patient_analytics'),
  feedbackController.getPatientProgress
);

// Respond to feedback (doctor vs admin decided by body.responderRole)
router.post(
  '/admin/:feedbackId/respond',
  requireAdmin,
  requirePermission('feedback_management'),
  feedbackController.respondToFeedback
);

// Flag feedback for attention
router.patch(
  '/admin/:feedbackId/flag',
  requireAdmin,
  requirePermission('feedback_management'),
  feedbackController.flagFeedback
);

// List feedback requiring attention (admin queue)
router.get(
  '/admin/attention-required',
  requireAdmin,
  requirePermission('feedback_management'),
  feedbackController.getAttentionRequired
);

// Analytics dashboard
router.get(
  '/admin/analytics/dashboard',
  requireAdmin,
  requirePermission('system_analytics'),
  feedbackController.getAnalyticsDashboard
);

// Improvement trends (metric, timeRange as query)
router.get(
  '/admin/analytics/trends',
  requireAdmin,
  requirePermission('system_analytics'),
  feedbackController.getImprovementTrends
);

// Export feedback (json/csv)
router.post(
  '/admin/export',
  requireAdmin,
  // requirePermission('data_export'),
  feedbackController.exportFeedbackData
);

module.exports = router;
