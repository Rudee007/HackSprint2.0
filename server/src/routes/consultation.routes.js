const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultation.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Create consultation (booking)
router.post('/', authenticate, consultationController.createConsultation);

// Get single consultation
router.get('/:id', authenticate, consultationController.getConsultation);

// Update consultation
router.patch('/:id', authenticate, consultationController.updateConsultation);

// Cancel consultation
router.delete('/:id', authenticate, consultationController.cancelConsultation);

// Get patient's consultations
router.get('/patient/:patientId', authenticate, consultationController.getPatientConsultations);

// Get provider's consultations (generic - works for doctors and therapists)
router.get('/provider/:providerId', authenticate, consultationController.getProviderConsultations);

// Get upcoming consultations for provider
router.get('/provider/:providerId/upcoming', authenticate, consultationController.getUpcomingConsultations);

// Get consultation statistics (for providers)
router.get('/provider/:providerId/stats', authenticate, consultationController.getProviderStats);

// Backward compatibility routes
router.get('/doctor/:doctorId', authenticate, consultationController.getDoctorConsultations);
router.get('/therapist/:therapistId', authenticate, consultationController.getTherapistConsultations);

module.exports = router;
