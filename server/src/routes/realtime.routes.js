// src/routes/realtime.routes.js (UPDATED)
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware'); // ✅ Import authorize
const sessionController = require('../controllers/realtime/session.controller');
const therapyTrackingController = require('../controllers/realtime/TherapyTrackingController');

// ✅ Session Management - Allow admin, doctor, therapist
router.put(
  '/sessions/:sessionId/status', 
  authenticate, 
  authorize('super_admin','admin', 'doctor', 'therapist'), // ✅ Add authorization
  sessionController.updateSessionStatus
);

router.get(
  '/sessions/:sessionId/details', 
  authenticate, 
  authorize('super_admin','admin', 'doctor', 'therapist'), // ✅ Add authorization
  sessionController.getSessionDetails
);

router.post(
  '/sessions/:sessionId/join', 
  authenticate, 
  authorize('super_admin','admin', 'doctor', 'therapist'), // ✅ Add authorization
  sessionController.joinSession
);

router.post(
  '/sessions/:sessionId/leave', 
  authenticate, 
  authorize('super_admin','admin', 'doctor', 'therapist'), // ✅ Add authorization
  sessionController.leaveSession
);

router.post(
  '/sessions/:sessionId/start', 
  authenticate, 
  authorize('super_admin','admin', 'doctor', 'therapist'), // ✅ Add authorization
  sessionController.startSession
);

// ✅ Therapy Tracking - Allow admin, doctor, therapist
router.get(
  '/tracking/dashboard', 
  authenticate, 
  authorize('super_admin','admin', 'doctor', 'therapist'), // ✅ Add authorization
  therapyTrackingController.getTrackingDashboard
);

router.get(
  '/tracking/sessions/upcoming', 
  authenticate, 
  authorize('super_admin','admin', 'doctor', 'therapist'), // ✅ Add authorization
  therapyTrackingController.getUpcomingSessions
);

router.get(
  '/tracking/patients/:patientId/milestones', 
  authenticate, 
  authorize('super_admin','admin', 'doctor', 'therapist'), // ✅ Add authorization
  therapyTrackingController.getPatientMilestones
);

router.post(
  '/tracking/patients/:patientId/milestones', 
  authenticate, 
  authorize('super_admin','admin', 'doctor', 'therapist'), // ✅ Add authorization
  therapyTrackingController.updateMilestone
);

module.exports = router;
