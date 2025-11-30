// routes/therapist.routes.js - COMPLETE WITH PROGRESS TRACKING
const express = require('express');
const router = express.Router();
const therapistController = require('../controllers/therapist.controller');
const { authenticate } = require('../middleware/auth.middleware');
const bookingController = require('../controllers/booking.controller');
const consultationController = require('../controllers/consultation.controller');


console.log('🔥 Loading therapist routes...');

// ═══════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════
router.get('/search', therapistController.searchTherapists);

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


//get appointments bookings 
router.get('/appointments/provider/:providerId/bookings', 
    bookingController.getProviderBookings
  );

  router.get('/appointments/provider/:providerId/all-bookings', 
    bookingController.getAllProviderBookings
  );


//get appointments based on provider:

// Get provider's consultations (generic - works for doctors and therapists)
router.get('/provider/:providerId', authenticate, consultationController.getProviderConsultations);

// Get upcoming consultations for provider
router.get('/provider/:providerId/upcoming', authenticate, consultationController.getUpcomingConsultations);

// Get consultation statistics (for providers)
router.get('/provider/:providerId/stats', authenticate, consultationController.getProviderStats);

// ═══════════════════════════════════════════════════════════
// SESSION MANAGEMENT ROUTES (ORDER MATTERS!)
// ═══════════════════════════════════════════════════════════
router.get('/sessions/today', authenticate, therapistController.getTodaySessions);
router.get('/sessions/patient/:patientId', authenticate, therapistController.getPatientSessions);

// 🔥 NEW: Update session progress (vitals, observations, etc.)
router.patch('/sessions/:sessionId/progress', authenticate, therapistController.updateSessionProgress);

// 🔥 NEW: Update vitals only
router.patch('/sessions/:sessionId/vitals', authenticate, therapistController.updateVitals);

// 🔥 NEW: Update observations only
router.patch('/sessions/:sessionId/observations', authenticate, therapistController.updateObservations);

// 🔥 NEW: Add adverse effect
router.post('/sessions/:sessionId/adverse-effects', authenticate, therapistController.addAdverseEffect);

// 🔥 NEW: Add material used
router.post('/sessions/:sessionId/materials', authenticate, therapistController.addMaterialUsed);

router.post('/sessions/:sessionId/start', authenticate, therapistController.startSession);
router.post('/sessions/:sessionId/complete', authenticate, therapistController.completeSession);

// ═══════════════════════════════════════════════════════════
// PATIENT MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════
router.get('/patients/assigned', authenticate, therapistController.getAssignedPatients);

// ═══════════════════════════════════════════════════════════
// TREATMENT PLAN ROUTES
// ═══════════════════════════════════════════════════════════
router.get('/treatment-plans', therapistController.getAssignedTreatmentPlans);
router.post('/treatment-plans', authenticate, therapistController.createTreatmentPlan);
router.put('/treatment-plans/:id/progress', authenticate, therapistController.updateTreatmentProgress);


router.get('/patients/:patientId/treatment-plans', authenticate, therapistController.getPatientTreatmentPlans);

// Get specific treatment plan details
router.get('/treatment-plans/:treatmentPlanId', authenticate, therapistController.getTreatmentPlanDetails);

// Update treatment plan progress (therapist executing the plan)
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
// GENERIC ID ROUTE (MUST BE LAST!)
// ═══════════════════════════════════════════════════════════
router.get('/:id', therapistController.getTherapist);


router.use('/feedback', require('./feedback.routes'));

console.log('✅ Therapist routes loaded successfully');

module.exports = router;
