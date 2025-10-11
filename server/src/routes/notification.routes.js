const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const notificationController = require('../controllers/notification.controller');

// Apply authentication to all routes
router.use(authenticate);

// ============ TEST ENDPOINTS ============

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

// ============ AUTH NOTIFICATIONS ============

// Send email verification
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

// ============ APPOINTMENT NOTIFICATIONS ============

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

// ============ THERAPY NOTIFICATIONS ============

// Send pre-therapy instructions
router.post('/therapy/pre-instructions', 
  notificationController.sendPreTherapyInstructions
);

// Send post-therapy care
router.post('/therapy/post-care', 
  notificationController.sendPostTherapyCare
);

// ============ ENGAGEMENT NOTIFICATIONS ============

// Send health tips
router.post('/provider/my-feedback/send-health-tips', 
  notificationController.sendHealthTips
);

// Send critical feedback alert
router.post('/critical-feedback-alert', 
  requireAdmin,
  notificationController.sendCriticalFeedbackAlert
);

// ============ BULK OPERATIONS ============

// Send bulk appointment reminders
router.post('/bulk/reminders', 
  requireAdmin, 
  notificationController.sendBulkReminders
);

// Send bulk health tips
router.post('/bulk/health-tips', 
  requireAdmin, 
  notificationController.sendBulkHealthTips
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
// ============ ADMIN NOTIFICATION ENDPOINTS ============

// Send new patient alert
router.post('/admin/new-patient-alert', 
  requireAdmin,
  notificationController.sendNewPatientAlert
);

// Send new appointment alert
router.post('/admin/appointment/:consultationId/alert', 
  requireAdmin,
  notificationController.sendNewAppointmentAlert
);

// Send session status alert
router.post('/admin/session/:consultationId/status-alert', 
  requireAdmin,
  notificationController.sendSessionStatusAlert
);

// Send daily summary report
router.post('/admin/daily-summary', 
  requireAdmin,
  notificationController.sendDailySummary
);

// Send payment notification
router.post('/admin/payment-notification', 
  requireAdmin,
  notificationController.sendPaymentNotification
);

// Send cancellation alert
router.post('/admin/appointment/:consultationId/cancellation-alert', 
  requireAdmin,
  notificationController.sendCancellationAlert
);

// Send weekly report
router.post('/admin/weekly-report', 
  requireAdmin,
  notificationController.sendWeeklyReport
);

// Send system alert
router.post('/admin/system-alert', 
  requireAdmin,
  notificationController.sendSystemAlert
);

// Send therapist assignment notification
router.post('/admin/appointment/:consultationId/assign-therapist', 
  requireAdmin,
  notificationController.sendTherapistAssignment
);


module.exports = router;
