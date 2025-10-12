const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const notificationController = require('../controllers/notification.controller');

// ============ PUBLIC/AUTH ENDPOINTS (No authentication required) ============

// Send email verification (called during signup)
router.post('/send-verification-email', 
  notificationController.sendVerificationEmail
);

// Send phone OTP (SMS)
router.post('/send-otp', 
  notificationController.sendPhoneOTP
);

// Send welcome email
router.post('/send-welcome-email', 
  notificationController.sendWelcomeEmail
);

// ============ AUTHENTICATED ENDPOINTS ============

// Apply authentication to all routes below
router.use(authenticate);

// ============ TEST ENDPOINTS (Admin Only) ============

// Send test email
router.post('/test-email', 
  requireAdmin, 
  notificationController.sendTestEmail
);

// Send test SMS
router.post('/test-sms', 
  requireAdmin, 
  notificationController.sendTestSMS
);

// Test all connections
router.get('/test-connection', 
  requireAdmin, 
  notificationController.testAllConnections
);

// ============ APPOINTMENT NOTIFICATIONS (Patient/Provider) ============

// Send appointment confirmation
router.post('/appointment/:consultationId/confirmation', 
  notificationController.sendAppointmentConfirmation
);

// Send appointment reminder
router.post('/appointment/:consultationId/reminder', 
  notificationController.sendAppointmentReminder
);

// Send appointment cancellation
router.post('/appointment/:consultationId/cancellation', 
  notificationController.sendAppointmentCancellation
);

// Send feedback request
router.post('/appointment/:consultationId/feedback-request', 
  notificationController.sendFeedbackRequest
);

// ============ PRE & POST THERAPY INSTRUCTIONS ============

// Send pre-therapy instructions
router.post('/appointment/:consultationId/pre-instructions', 
  notificationController.sendPreTherapyInstructions
);

// Send post-therapy care
router.post('/appointment/:consultationId/post-care', 
  notificationController.sendPostTherapyCare
);

// ============ USER PREFERENCES ============

// Get user notification preferences
router.get('/preferences', 
  notificationController.getNotificationPreferences
);

// Update user notification preferences
router.put('/preferences', 
  notificationController.updateNotificationPreferences
);

// ============ ADMIN NOTIFICATIONS ============

// Send new patient alert to admin
router.post('/admin/new-patient-alert', 
  requireAdmin,
  notificationController.sendNewPatientAlert
);

// Send new appointment alert to admin
router.post('/admin/appointment/:consultationId/alert', 
  requireAdmin,
  notificationController.sendNewAppointmentAlert
);

// ✅ FIXED: Send critical feedback alert (with feedbackId)
router.post('/admin/critical-feedback/:feedbackId', 
  requireAdmin,
  notificationController.sendCriticalFeedbackAlert
);

// ✅ FIXED: Send critical feedback alert (without feedbackId - uses body)
router.post('/admin/critical-feedback', 
  requireAdmin,
  notificationController.sendCriticalFeedbackAlert
);

// Send daily summary report to admin
router.post('/admin/daily-summary', 
  requireAdmin,
  notificationController.sendDailySummary
);

// Send therapist assignment notification
router.post('/admin/appointment/:consultationId/assign-therapist', 
  requireAdmin,
  notificationController.sendTherapistAssignment
);

// ============ BULK OPERATIONS (Admin Only) ============

// Send bulk appointment reminders (for tomorrow)
router.post('/admin/bulk/reminders', 
  requireAdmin, 
  notificationController.sendBulkReminders
);

// Send bulk feedback requests
router.post('/admin/bulk/feedback-requests', 
  requireAdmin, 
  notificationController.sendBulkFeedbackRequests
);

// ============ NOTIFICATION STATS & HISTORY (Admin Only) ============

// Get notification statistics
router.get('/admin/stats', 
  requireAdmin, 
  notificationController.getNotificationStats
);

// Get notification history
router.get('/admin/history', 
  requireAdmin, 
  notificationController.getNotificationHistory
);

module.exports = router;
