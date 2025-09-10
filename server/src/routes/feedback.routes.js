const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin, requirePermission } = require('../middleware/admin.middleware');
const feedbackController = require('../controllers/feedback.controller');

// Apply authentication to all routes
router.use(authenticate);

// ============ PATIENT ROUTES ============

// Submit new feedback
router.post('/', feedbackController.submitFeedback);

// Get my feedback
router.get('/my-feedback', feedbackController.getMyFeedback);

// Get feedback for specific session
router.get('/session/:sessionId', feedbackController.getSessionFeedback);

// Update my feedback (within 24 hours)
router.put('/my-feedback/:feedbackId', feedbackController.updateMyFeedback);

// ============ PROVIDER ROUTES ============

// Get feedback for my sessions (therapists/doctors)
router.get('/provider/my-feedback', 
  requirePermission('view_provider_feedback'), 
  feedbackController.getProviderFeedback
);

// Get my performance analytics
router.get('/provider/analytics', 
  requirePermission('view_provider_analytics'), 
  feedbackController.getProviderAnalytics
);

// ============ ADMIN ROUTES ============

// Get all feedback with filters
router.get('/admin/all', 
  requireAdmin, 
  requirePermission('feedback_management'), 
  feedbackController.getAllFeedback
);

// Get feedback statistics
router.get('/admin/stats', 
  requireAdmin, 
  requirePermission('system_analytics'), 
  feedbackController.getFeedbackStats
);

// Get patient progress analytics
router.get('/admin/patient/:patientId/progress', 
  requireAdmin, 
  requirePermission('patient_analytics'), 
  feedbackController.getPatientProgress
);

// Respond to feedback
router.post('/admin/:feedbackId/respond', 
  requireAdmin, 
  requirePermission('feedback_management'), 
  feedbackController.respondToFeedback
);

// Flag feedback for attention
router.patch('/admin/:feedbackId/flag', 
  requireAdmin, 
  requirePermission('feedback_management'), 
  feedbackController.flagFeedback
);

// Get feedback requiring attention
router.get('/admin/attention-required', 
  requireAdmin, 
  requirePermission('feedback_management'), 
  feedbackController.getAttentionRequired
);

// ============ ANALYTICS & REPORTING ROUTES ============

// Get analytics dashboard
router.get('/admin/analytics/dashboard', 
  requireAdmin, 
  requirePermission('system_analytics'), 
  feedbackController.getAnalyticsDashboard
);

// Get improvement trends
router.get('/admin/analytics/trends', 
  requireAdmin, 
  requirePermission('system_analytics'), 
  feedbackController.getImprovementTrends
);

// Export feedback data
router.post('/admin/export', 
  requireAdmin, 
  requirePermission('data_export'), 
  feedbackController.exportFeedbackData
);

module.exports = router;
