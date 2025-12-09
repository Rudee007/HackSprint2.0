// routes/index.js - MAIN ROUTES INDEX FILE
const express = require('express');
const router = express.Router();

/**
 * ═══════════════════════════════════════════════════════════
 * CORE ROUTES
 * ═══════════════════════════════════════════════════════════
 */

// Authentication routes
router.use('/auth', require('./auth.routes'));

// User management routes
router.use('/users', require('./user.routes'));

/**
 * ═══════════════════════════════════════════════════════════
 * PROVIDER ROUTES (Doctors & Therapists)
 * ═══════════════════════════════════════════════════════════
 */

// Doctor routes
router.use('/doctors', require('./doctor.routes'));

// Therapist routes ✅ COMPLETE
router.use('/therapists', require('./therapist.routes'));

/**
 * ═══════════════════════════════════════════════════════════
 * CONSULTATION & SESSION ROUTES
 * ═══════════════════════════════════════════════════════════
 */

// Consultation routes (video calls, therapy sessions, appointments)
router.use('/consultations', require('./consultation.routes'));

// Booking routes (appointment scheduling)
router.use('/booking', require('./booking.routes'));

// Scheduling routes (calendar management)
router.use('/scheduling', require('./scheduling.routes'));

router.use('/auto-scheduling', require('./autoScheduling.routes'))
/**
 * ═══════════════════════════════════════════════════════════
 * REAL-TIME & COMMUNICATION ROUTES
 * ═══════════════════════════════════════════════════════════
 */

// Real-time WebSocket routes
router.use('/realtime', require('./realtime.routes'));

// Notification routes
router.use('/notifications', require('./notification.routes'));

/**
 * ═══════════════════════════════════════════════════════════
 * FEEDBACK & ADMIN ROUTES
 * ═══════════════════════════════════════════════════════════
 */

// Feedback & reviews
router.use('/feedback', require('./feedback.routes'));

// Admin panel routes
router.use('/admin', require('./admin.routes'));


// Therapy master catalog (read-only for doctors, admin creates)
router.use('/therapies', require('./therapy.routes'));

// Course template protocols (read-only for doctors, admin creates)
router.use('/course-templates', require('./courseTemplate.routes'));

// Prescription routes (medicines)
router.use('/prescriptions', require('./prescription.routes'));
/**
 * ═══════════════════════════════════════════════════════════
 * API HEALTH CHECK
 * ═══════════════════════════════════════════════════════════
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/api/auth',
      users: '/api/users',
      doctors: '/api/doctors',
      therapists: '/api/therapists',
      consultations: '/api/consultations',
      booking: '/api/booking',
      scheduling: '/api/scheduling',
      realtime: '/api/realtime',
      notifications: '/api/notifications',
      feedback: '/api/feedback',
      admin: '/api/admin'
    }
  });
});



module.exports = router;

