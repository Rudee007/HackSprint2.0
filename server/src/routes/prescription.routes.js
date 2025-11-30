// backend/routes/prescriptionRoutes.js
// 🔥 PRESCRIPTION ROUTES - FOLLOWING CONSULTATION PATTERN

const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authenticate } = require('../middleware/auth.middleware');

// ═══════════════════════════════════════════════════════════
// MEDICINE INVENTORY ROUTES (MUST BE FIRST!)
// ═══════════════════════════════════════════════════════════

// Get medicine inventory (with search)
router.get('/medicines/inventory', 
  authenticate, 
  prescriptionController.getMedicineInventory
);

// Search medicines (autocomplete)
router.get('/medicines/search', 
  authenticate, 
  prescriptionController.searchMedicines
);

// Add this route BEFORE the generic /:id route
router.get('/:id/download', 
    authenticate, 
    prescriptionController.downloadPrescriptionPDF
  );
  
// ═══════════════════════════════════════════════════════════
// SPECIFIC ROUTES (BEFORE GENERIC :id ROUTE)
// ═══════════════════════════════════════════════════════════

// Get prescription by consultation
router.get('/consultation/:consultationId', 
  authenticate, 
  prescriptionController.getPrescriptionByConsultation
);

// Get patient's prescriptions
router.get('/patient/:patientId', 
  authenticate, 
  prescriptionController.getPatientPrescriptions
);

// Get doctor's prescriptions (explicit route)
router.get('/doctor/:doctorId', 
  authenticate, 
  prescriptionController.getDoctorPrescriptions
);

// Get prescription statistics (for doctors)
router.get('/doctor/:doctorId/stats', 
  authenticate, 
  prescriptionController.getDoctorStats
);

// Get upcoming follow-ups for doctor
router.get('/doctor/:doctorId/followups', 
  authenticate, 
  prescriptionController.getUpcomingFollowups
);

// ═══════════════════════════════════════════════════════════
// 🔥 MAIN ROUTE - GET CURRENT DOCTOR'S PRESCRIPTIONS
// ═══════════════════════════════════════════════════════════

// Get current doctor's prescriptions (used by frontend)
// This matches: GET /prescriptions?page=1&limit=20
router.get('/', 
  authenticate, 
  async (req, res, next) => {
    // Set doctorId from authenticated user
    req.params.doctorId = req.user._id;
    next();
  },
  prescriptionController.getDoctorPrescriptions
);

// ═══════════════════════════════════════════════════════════
// PRESCRIPTION CRUD ROUTES
// ═══════════════════════════════════════════════════════════

// Create prescription
router.post('/', 
  authenticate, 
  prescriptionController.createPrescription
);

// Get single prescription (MUST BE AFTER SPECIFIC ROUTES)
router.get('/:id', 
  authenticate, 
  prescriptionController.getPrescription
);

// Update prescription (PUT method)
router.put('/:id', 
  authenticate, 
  prescriptionController.updatePrescription
);

// Update prescription (PATCH method)
router.patch('/:id', 
  authenticate, 
  prescriptionController.updatePrescription
);

// Delete prescription
router.delete('/:id', 
  authenticate, 
  prescriptionController.deletePrescription
);

// ═══════════════════════════════════════════════════════════
// STATUS MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════

// Update prescription status
router.patch('/:id/status', 
  authenticate, 
  prescriptionController.updatePrescriptionStatus
);

// Mark prescription as completed
router.post('/:id/complete', 
  authenticate, 
  prescriptionController.completePrescription
);

module.exports = router;
