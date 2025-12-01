// routes/therapist.routes.js - FIXED WITH /available ENDPOINT
const express = require('express');
const router = express.Router();
const therapistController = require('../controllers/therapist.controller');
const { authenticate } = require('../middleware/auth.middleware');
const bookingController = require('../controllers/booking.controller');
const consultationController = require('../controllers/consultation.controller');

console.log('🔥 Loading therapist routes...');

// ═══════════════════════════════════════════════════════════
// ⚠️ CRITICAL: SPECIFIC ROUTES MUST COME BEFORE /:id
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════
router.get('/search', therapistController.searchTherapists);

// 🔥 NEW: Get available therapists for assignment
router.get('/available', authenticate, therapistController.getAvailableTherapists);

// ═══════════════════════════════════════════════════════════
// PROFILE & AUTH ROUTES
// ═══════════════════════════════════════════════════════════
router.post('/register', authenticate, therapistController.registerTherapist);
router.get('/profile', authenticate, therapistController.getMyProfile);

// ═══════════════════════════════════════════════════════════
// DASHBOARD ROUTES
// ═══════════════════════════════════════════════════════════
router.get('/dashboard/overview', authenticate, therapistController.getDashboardOverview);
router.get('/stats', authenticate, therapistController.getTherapistStats);

// Get appointments bookings 
router.get('/appointments/provider/:providerId/bookings', bookingController.getProviderBookings);
router.get('/appointments/provider/:providerId/all-bookings', bookingController.getAllProviderBookings);

// Get appointments based on provider
router.get('/provider/:providerId', authenticate, consultationController.getProviderConsultations);
router.get('/provider/:providerId/upcoming', authenticate, consultationController.getUpcomingConsultations);
router.get('/provider/:providerId/stats', authenticate, consultationController.getProviderStats);

// ═══════════════════════════════════════════════════════════
// SESSION MANAGEMENT ROUTES (ORDER MATTERS!)
// ═══════════════════════════════════════════════════════════
router.get('/sessions/today', authenticate, therapistController.getTodaySessions);
router.get('/sessions/patient/:patientId', authenticate, therapistController.getPatientSessions);

// 🔥 Session progress updates
router.patch('/sessions/:sessionId/progress', authenticate, therapistController.updateSessionProgress);
router.patch('/sessions/:sessionId/vitals', authenticate, therapistController.updateVitals);
router.patch('/sessions/:sessionId/observations', authenticate, therapistController.updateObservations);
router.post('/sessions/:sessionId/adverse-effects', authenticate, therapistController.addAdverseEffect);
router.post('/sessions/:sessionId/materials', authenticate, therapistController.addMaterialUsed);
router.post('/sessions/:sessionId/start', authenticate, therapistController.startSession);
router.post('/sessions/:sessionId/complete', authenticate, therapistController.completeSession);

// ═══════════════════════════════════════════════════════════
// PATIENT MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════
router.get('/patients/assigned', authenticate, therapistController.getAssignedPatients);
router.get('/patients/:patientId/treatment-plans', authenticate, therapistController.getPatientTreatmentPlans);

// ═══════════════════════════════════════════════════════════
// TREATMENT PLAN ROUTES
// ═══════════════════════════════════════════════════════════
router.get('/treatment-plans', therapistController.getAssignedTreatmentPlans);
router.get('/treatment-plans/:treatmentPlanId', authenticate, therapistController.getTreatmentPlanDetails);
router.post('/treatment-plans', authenticate, therapistController.createTreatmentPlan);
router.put('/treatment-plans/:id/progress', authenticate, therapistController.updateTreatmentProgress);
router.patch('/treatment-plans/:treatmentPlanId/progress', authenticate, therapistController.updateTreatmentPlanProgress);

// ═══════════════════════════════════════════════════════════
// FEEDBACK ROUTES
// ═══════════════════════════════════════════════════════════
router.get('/feedback', authenticate, therapistController.getTherapistFeedback);

// ═══════════════════════════════════════════════════════════
// PROFILE UPDATE ROUTES
// ═══════════════════════════════════════════════════════════
router.put('/:id/availability', authenticate, therapistController.updateAvailability);
router.put('/:id', authenticate, therapistController.updateProfile);

// ═══════════════════════════════════════════════════════════
// ⚠️ GENERIC :id ROUTE (MUST BE LAST!)
// ═══════════════════════════════════════════════════════════
router.get('/:id', therapistController.getTherapist);

router.use('/feedback', require('./feedback.routes'));

console.log('✅ Therapist routes loaded successfully');

module.exports = router;
