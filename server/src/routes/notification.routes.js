// src/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const notificationController = require('../controllers/notification.controller');

// ============ PUBLIC/AUTH ENDPOINTS (No authentication required) ============

// Send email verification (called during signup) – now uses userId
router.post(
  '/send-verification-email',
  notificationController.sendVerificationEmail
);

// Send phone OTP (SMS) – now uses userId
router.post('/send-otp', notificationController.sendPhoneOTP);

// Send welcome email (pure email, no Notification record)
router.post('/send-welcome-email', notificationController.sendWelcomeEmail);

// ============ AUTHENTICATED ENDPOINTS ============

router.use(authenticate);

// ============ TEST ENDPOINTS (Admin Only) ============

router.post(
  '/test-email',
  requireAdmin,
  notificationController.sendTestEmail
);

router.post('/test-sms', requireAdmin, notificationController.sendTestSMS);

router.get(
  '/test-connection',
  requireAdmin,
  notificationController.testAllConnections
);

// ============ APPOINTMENT / CONSULTATION NOTIFICATIONS ============

router.post(
  '/appointment/:consultationId/confirmation',
  notificationController.sendAppointmentConfirmation
);

router.post(
  '/appointment/:consultationId/reminder',
  notificationController.sendAppointmentReminder
);

router.post(
  '/appointment/:consultationId/cancellation',
  notificationController.sendAppointmentCancellation
);

router.post(
  '/appointment/:consultationId/feedback-request',
  notificationController.sendFeedbackRequest
);

router.post(
  '/appointment/:consultationId/pre-instructions',
  notificationController.sendPreTherapyInstructions
);

router.post(
  '/appointment/:consultationId/post-care',
  notificationController.sendPostTherapyCare
);

// ============ TREATMENT PLAN & PRESCRIPTION TRIGGERS (Admin/Doctor) ============

router.post(
  '/treatment-plan/:planId/trigger-created',
  requireAdmin,
  notificationController.triggerTreatmentPlanCreated
);

router.post(
  '/prescription/:prescriptionId/end-reminder',
  requireAdmin,
  notificationController.triggerPrescriptionEndReminder
);

// ============ USER PREFERENCES ============

router.get('/preferences', notificationController.getNotificationPreferences);

router.put('/preferences', notificationController.updateNotificationPreferences);

// ============ ADMIN NOTIFICATIONS ============

router.post(
  '/admin/new-patient-alert',
  requireAdmin,
  notificationController.sendNewPatientAlert
);

router.post(
  '/admin/appointment/:consultationId/alert',
  requireAdmin,
  notificationController.sendNewAppointmentAlert
);

router.post(
  '/admin/critical-feedback/:feedbackId',
  requireAdmin,
  notificationController.sendCriticalFeedbackAlert
);

router.post(
  '/admin/critical-feedback',
  requireAdmin,
  notificationController.sendCriticalFeedbackAlert
);

// daily-summary & bulk operations can stay as you wrote them if needed

router.post(
  '/admin/appointment/:consultationId/assign-therapist',
  requireAdmin,
  notificationController.sendTherapistAssignment
);

// ============ IN-APP NOTIFICATION STATS & HISTORY ============

router.get('/stats', notificationController.getNotificationStats);

router.get('/history', notificationController.getNotificationHistory);

router.post('/mark-read/:id', notificationController.markNotificationRead);

router.post('/mark-all-read', notificationController.markAllNotificationsRead);

module.exports = router;
