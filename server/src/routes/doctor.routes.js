const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { body, param, query } = require('express-validator');

/**
 * ═══════════════════════════════════════════════════════════
 * 1. DOCTOR PROFILE ROUTES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Register new doctor profile
 * POST /api/doctors/register
 * Auth: Required (User with doctor role)
 */
router.post('/register',
  authenticate,
  [
    // Basic validation for registration
    body('qualifications.bams.degree')
      .notEmpty()
      .withMessage('Degree is required'),
    body('qualifications.bams.university')
      .notEmpty()
      .withMessage('University is required'),
    body('qualifications.bams.yearOfCompletion')
      .isInt({ min: 1980, max: new Date().getFullYear() })
      .withMessage('Valid graduation year required'),
    body('experience.totalYears')
      .isInt({ min: 0, max: 60 })
      .withMessage('Experience must be between 0-60 years'),
    body('consultationSettings.fees.videoConsultation')
      .isInt({ min: 0 })
      .withMessage('Video consultation fee required'),
    body('consultationSettings.availability.workingDays')
      .isArray({ min: 1 })
      .withMessage('At least one working day required'),
    body('consultationSettings.preferences.languages')
      .isArray({ min: 1 })
      .withMessage('At least one language required')
  ],
  doctorController.registerDoctor
);
/**
 * Get doctor profile
 * GET /api/doctors/profile
 * Auth: Required (Doctor role)
 */
router.get('/profile',
  authenticate,
  doctorController.getDoctorProfile
);

/**
 * Update doctor profile
 * PUT /api/doctors/profile
 * Auth: Required (Doctor role)
 */

router.put('/profile',
  authenticate,
  [
    body('qualifications.bams.yearOfCompletion')
      .optional()
      .isInt({ min: 1980, max: new Date().getFullYear() }),
    body('experience.totalYears')
      .optional()
      .isInt({ min: 0, max: 60 }),
    body('consultationSettings.fees.videoConsultation')
      .optional()
      .isFloat({ min: 0 }),
    body('consultationSettings.fees.inPersonConsultation')
      .optional()
      .isFloat({ min: 0 }),
    body('specializations')
      .optional()
      .isArray({ min: 1 })
  ],
  doctorController.updateDoctorProfile
);


/**
 * Add new patient
 * POST /api/doctors/patients/add
 * Auth: Required (Doctor role)
 */
router.post('/patients/add',
  authenticate,
  [
    body('name')
      .notEmpty()
      .withMessage('Patient name is required')
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email required'),
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Valid phone number required'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Valid date of birth required'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other')
  ],
  doctorController.addPatient
);

/**
 * ═══════════════════════════════════════════════════════════
 * 2. CONSULTATION ROUTES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Get doctor's consultations (UPDATED METHOD NAME)
 * GET /api/doctors/consultations
 * Auth: Required (Doctor role)
 */
router.get('/consultations', // ✅ Changed from '/patients' to '/consultations'
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['scheduled', 'completed', 'cancelled', 'in_progress'])
      .withMessage('Invalid status value'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Valid start date required'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Valid end date required')
  ],
  doctorController.getDoctorConsultations // ✅ Changed from getDoctorPatients
);

/**
 * Book consultation
 * POST /api/consultations/book
 * Auth: Required (Patient or Doctor role)
 */
router.post('/consultations/book',
  authenticate,
  [
    body('doctorId')
      .isMongoId()
      .withMessage('Valid doctor ID is required'),
    body('type')
      .isIn(['video', 'in_person', 'follow_up'])
      .withMessage('Consultation type must be video, in_person, or follow_up'),
    body('scheduledFor')
      .isISO8601()
      .withMessage('Valid scheduled date/time is required')
      .custom((value) => {
        const scheduledDate = new Date(value);
        const now = new Date();
        if (scheduledDate <= now) {
          throw new Error('Scheduled time must be in the future');
        }
        return true;
      }),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  doctorController.bookConsultation
);

/**
 * ═══════════════════════════════════════════════════════════
 * 3. AVAILABILITY ROUTES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Update doctor availability
 * PUT /api/doctors/availability
 * Auth: Required (Doctor role)
 */
router.put('/availability',
  authenticate,
  [
    body('workingDays')
      .isArray({ min: 1 })
      .withMessage('At least one working day is required'),
    body('workingDays.*')
      .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      .withMessage('Invalid working day'),
    body('workingHours.start')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid start time format (HH:MM)'),
    body('workingHours.end')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid end time format (HH:MM)'),
    body('consultationDuration')
      .optional()
      .isInt({ min: 15, max: 120 })
      .withMessage('Consultation duration must be between 15-120 minutes'),
    body('maxPatientsPerDay')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Max patients per day must be between 1-50')
  ],
  doctorController.updateAvailability
);

/**
 * Get available time slots
 * GET /api/doctors/:doctorId/availability/:date
 * Auth: Public (for booking interface)
 */
router.get('/:doctorId/availability/:date',
  [
    param('doctorId')
      .isMongoId()
      .withMessage('Valid doctor ID is required'),
    param('date')
      .isISO8601()
      .withMessage('Valid date is required (YYYY-MM-DD)')
      .custom((value) => {
        const requestedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (requestedDate < today) {
          throw new Error('Cannot get availability for past dates');
        }
        return true;
      })
  ],
  doctorController.getAvailableSlots
);

/**
 * ═══════════════════════════════════════════════════════════
 * 4. SEARCH & DISCOVERY ROUTES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Search doctors by specialization
 * GET /api/doctors/search/specialization
 * Auth: Public
 */
router.get('/search/specialization', // ✅ Updated route path
  [
    query('specialization')
      .notEmpty()
      .withMessage('Specialization is required'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit must be between 1-20'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'experience'])
      .withMessage('Invalid sort option')
  ],
  doctorController.searchBySpecialization // ✅ Updated method name
);

/**
 * Search doctors with multiple criteria
 * POST /api/doctors/search
 * Auth: Public
 */
router.post('/search', // ✅ Changed to POST
  [
    body('specializations')
      .optional()
      .isArray()
      .withMessage('Specializations must be an array'),
    body('experience')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Experience must be a non-negative integer'),
    body('languages')
      .optional()
      .isArray()
      .withMessage('Languages must be an array'),
    body('consultationType')
      .optional()
      .isIn(['video', 'inPerson', 'followUp'])
      .withMessage('Invalid consultation type'),
    body('maxFee')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Max fee must be non-negative'),
    body('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    body('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit must be between 1-20')
  ],
  doctorController.searchDoctors
);

/**
 * ═══════════════════════════════════════════════════════════
 * 5. ANALYTICS ROUTES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Get doctor statistics (UPDATED METHOD NAME)
 * GET /api/doctors/stats
 * Auth: Required (Doctor role)
 */
router.get('/stats', // ✅ Changed from '/analytics' to '/stats'
  authenticate,
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be 7d, 30d, 90d, or 1y')
  ],
  doctorController.getDoctorStats // ✅ Changed from getDoctorAnalytics
);

/**
 * ═══════════════════════════════════════════════════════════
 * 6. VERIFICATION ROUTES (UPDATED)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Update doctor verification status (Admin only)
 * PUT /api/doctors/:doctorId/verification
 * Auth: Required (Admin role)
 */
router.put('/:doctorId/verification', // ✅ Changed from '/approve' to '/verification'
  authenticate,
  // TODO: Add role check middleware for admin
  [
    param('doctorId')
      .isMongoId()
      .withMessage('Valid doctor ID is required'),
    body('status')
      .isIn(['pending', 'under_review', 'approved', 'rejected'])
      .withMessage('Invalid verification status'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  doctorController.updateVerificationStatus // ✅ Changed from approveDoctorProfile
);

/**
 * Get doctors pending verification (Admin only)
 * GET /api/doctors/pending-verification
 * Auth: Required (Admin role)
 */
router.get('/pending-verification', // ✅ New route
  authenticate,
  // TODO: Add role check middleware for admin
  doctorController.getPendingVerifications
);
// Add these routes to your existing doctor.routes.js

/**
 * ═══════════════════════════════════════════════════════════
 * TREATMENT PLAN ROUTES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Create treatment plan
 * POST /api/doctors/treatment-plans
 */
router.post('/treatment-plans',
  authenticate,
  [
    body('patientId')
      .isMongoId()
      .withMessage('Valid patient ID is required'),
    body('consultationId')
      .isMongoId()
      .withMessage('Valid consultation ID is required'),
    body('treatmentType')
      .notEmpty()
      .withMessage('Treatment type is required'),
    body('treatmentPlan')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Treatment plan must be between 10-2000 characters'),
    body('duration')
      .notEmpty()
      .withMessage('Treatment duration is required'),
    body('preInstructions')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Pre-instructions cannot exceed 1000 characters'),
    body('postInstructions')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Post-instructions cannot exceed 1000 characters'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  doctorController.createTreatmentPlan
);

/**
 * Get treatment plans
 * GET /api/doctors/treatment-plans
 */
router.get('/treatment-plans',
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['active', 'completed', 'paused', 'cancelled'])
      .withMessage('Invalid status value')
  ],[
    body('patientId').isMongoId().withMessage('Valid patient ID is required'),
    body('consultationId').isMongoId().withMessage('Valid consultation ID is required'),
    body('treatmentType').notEmpty().withMessage('Treatment type is required'),
    body('treatmentPlan').isLength({ min: 10, max: 2000 }).withMessage('Treatment plan must be between 10-2000 characters'),
    body('duration').notEmpty().withMessage('Treatment duration is required')
  ],
  doctorController.getDoctorTreatmentPlans
);

/**
 * Get treatment plan details
 * GET /api/doctors/treatment-plans/:id
 */
router.get('/treatment-plans/:id',
  authenticate,
  [
    param('id')
      .isMongoId()
      .withMessage('Valid treatment plan ID is required')
  ],
  doctorController.getTreatmentPlanDetails
);

/**
 * Update treatment plan
 * PUT /api/doctors/treatment-plans/:id
 */
router.put('/treatment-plans/:id',
  authenticate,
  [
    param('id')
      .isMongoId()
      .withMessage('Valid treatment plan ID is required')
  ],
  doctorController.updateTreatmentPlan
);

/**
 * Delete treatment plan
 * DELETE /api/doctors/treatment-plans/:id
 */
router.delete('/treatment-plans/:id',
  authenticate,
  [
    param('id')
      .isMongoId()
      .withMessage('Valid treatment plan ID is required')
  ],
  doctorController.deleteTreatmentPlan
);

router.get('/patients/:patientId',authenticate,doctorController.getPatientDetails)


/**
 * ═══════════════════════════════════════════════════════════
 * 7. ERROR HANDLING MIDDLEWARE
 * ═══════════════════════════════════════════════════════════
 */

// Handle 404 for undefined routes


module.exports = router;
