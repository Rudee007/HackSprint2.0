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
    body('qualifications.bams.degree')
      .notEmpty()
      .withMessage('BAMS degree is required'),
    body('qualifications.bams.university')
      .notEmpty()
      .withMessage('University name is required'),
    body('qualifications.bams.yearOfCompletion')
      .isInt({ min: 1980, max: new Date().getFullYear() })
      .withMessage('Valid year of completion required'),
    body('medicalRegistration.registrationNumber')
      .notEmpty()
      .withMessage('Medical registration number is required'),
    body('medicalRegistration.council')
      .notEmpty()
      .withMessage('Medical council name is required'),
    body('medicalRegistration.state')
      .notEmpty()
      .withMessage('State of registration is required'),
    body('specializations')
      .isArray({ min: 1 })
      .withMessage('At least one specialization is required'),
    body('experience.totalYears')
      .isInt({ min: 0, max: 60 })
      .withMessage('Valid experience years required'),
    body('consultationSettings.fees.videoConsultation')
      .isFloat({ min: 0 })
      .withMessage('Valid video consultation fee required'),
    body('consultationSettings.fees.inPersonConsultation')
      .isFloat({ min: 0 })
      .withMessage('Valid in-person consultation fee required')
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
 * ═══════════════════════════════════════════════════════════
 * 2. CONSULTATION ROUTES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Get doctor's patients
 * GET /api/doctors/patients
 * Auth: Required (Doctor role)
 */
router.get('/patients',
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
    query('search')
      .optional()
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('Search term must be between 2-50 characters')
  ],
  doctorController.getDoctorPatients
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
      .withMessage('Notes cannot exceed 500 characters'),
    body('aiAnalysis')
      .optional()
      .isObject()
      .withMessage('AI analysis must be an object')
  ],
  doctorController.bookConsultation
);

/**
 * ═══════════════════════════════════════════════════════════
 * 3. TREATMENT PLAN ROUTES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Create treatment plan
 * POST /api/treatment-plans/create
 * Auth: Required (Doctor role)
 */
router.post('/treatment-plans/create',
  authenticate,
  [
    body('patientId')
      .isMongoId()
      .withMessage('Valid patient ID is required'),
    body('consultationId')
      .optional()
      .isMongoId()
      .withMessage('Valid consultation ID required'),
    body('treatments')
      .isArray({ min: 1 })
      .withMessage('At least one treatment is required'),
    body('treatments.*.type')
      .isIn([
        'Vamana', 'Virechana', 'Basti', 'Nasya', 'Raktamokshana',
        'Abhyanga', 'Shirodhara', 'Shirobasti', 'Udvartana', 'Pizhichil'
      ])
      .withMessage('Invalid treatment type'),
    body('treatments.*.sessions')
      .isInt({ min: 1, max: 50 })
      .withMessage('Sessions must be between 1 and 50'),
    body('treatments.*.sessionDuration')
      .optional()
      .isInt({ min: 15, max: 180 })
      .withMessage('Session duration must be between 15-180 minutes'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters')
  ],
  doctorController.createTreatmentPlan
);

/**
 * Validate AI treatment plan
 * PUT /api/treatment-plans/:planId/validate
 * Auth: Required (Doctor role)
 */
router.put('/treatment-plans/:planId/validate',
  authenticate,
  [
    param('planId')
      .isMongoId()
      .withMessage('Valid plan ID is required'),
    body('approved')
      .isBoolean()
      .withMessage('Approved status must be boolean'),
    body('modifications')
      .optional()
      .isArray()
      .withMessage('Modifications must be an array'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters')
  ],
  doctorController.validateTreatmentPlan
);

/**
 * ═══════════════════════════════════════════════════════════
 * 4. AVAILABILITY ROUTES
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
 * 5. SEARCH & DISCOVERY ROUTES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Search doctors by specialization
 * GET /api/doctors/search
 * Auth: Public
 */
router.get('/search',
  [
    query('specialization')
      .notEmpty()
      .withMessage('Specialization is required'),
    query('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Valid latitude required'),
    query('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Valid longitude required'),
    query('maxDistance')
      .optional()
      .isInt({ min: 1000, max: 100000 })
      .withMessage('Max distance must be between 1-100 km'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit must be between 1-20'),
    query('sortBy')
      .optional()
      .isIn(['rating', 'experience', 'distance', 'fees'])
      .withMessage('Invalid sort option')
  ],
  doctorController.searchDoctors
);

/**
 * Get AI-recommended doctors
 * POST /api/doctors/recommend
 * Auth: Required (Patient role)
 */
router.post('/recommend',
  authenticate,
  [
    body('aiAnalysis')
      .isObject()
      .withMessage('AI analysis data is required'),
    body('aiAnalysis.primaryDosha')
      .isIn(['vata', 'pitta', 'kapha'])
      .withMessage('Valid primary dosha is required'),
    body('aiAnalysis.recommendedTreatments')
      .isArray({ min: 1 })
      .withMessage('At least one recommended treatment is required'),
    body('patientLocation')
      .optional()
      .isObject()
      .withMessage('Patient location must be an object'),
    body('patientLocation.coordinates')
      .optional()
      .isArray({ min: 2, max: 2 })
      .withMessage('Coordinates must be [longitude, latitude]')
  ],
  doctorController.getRecommendedDoctors
);

/**
 * ═══════════════════════════════════════════════════════════
 * 6. ANALYTICS ROUTES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Get doctor analytics
 * GET /api/doctors/analytics
 * Auth: Required (Doctor role)
 */
router.get('/analytics',
  authenticate,
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be 7d, 30d, 90d, or 1y')
  ],
  doctorController.getDoctorAnalytics
);

/**
 * ═══════════════════════════════════════════════════════════
 * 7. ADMIN ROUTES
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Approve doctor profile (Admin only)
 * PUT /api/doctors/:doctorId/approve
 * Auth: Required (Admin role)
 */
router.put('/:doctorId/approve',
  authenticate,
  // TODO: Add role check middleware for admin
  [
    param('doctorId')
      .isMongoId()
      .withMessage('Valid doctor ID is required'),
    body('approved')
      .isBoolean()
      .withMessage('Approved status must be boolean'),
    body('rejectionReason')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Rejection reason cannot exceed 500 characters')
  ],
  doctorController.approveDoctorProfile
);

/**
 * ═══════════════════════════════════════════════════════════
 * 8. ERROR HANDLING MIDDLEWARE
 * ═══════════════════════════════════════════════════════════
 */

// Handle 404 for undefined routes
router.use('/*splat', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
