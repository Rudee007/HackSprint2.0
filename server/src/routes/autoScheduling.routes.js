// routes/scheduling.routes.js
// 🛣️ SCHEDULING ROUTES

const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/autoScheduling.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { body, param, query } = require('express-validator');
// const { validate } = require('../middleware/validate');

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE: All routes require authentication
// ═══════════════════════════════════════════════════════════
router.use(authenticate);

// ═══════════════════════════════════════════════════════════
// SINGLE TREATMENT PLAN SCHEDULING
// ═══════════════════════════════════════════════════════════

/**
 * @route   POST /api/scheduling/treatment-plans/:planId/schedule
 * @desc    Schedule a single treatment plan
 * @access  Doctor, Admin
 */
router.post(
  '/treatment-plans/:planId/schedule',
//   authorize(['doctor', 'admin']),
  [
    param('planId')
      .isMongoId()
      .withMessage('Invalid treatment plan ID'),
    body('forceReschedule')
      .optional()
      .isBoolean()
      .withMessage('forceReschedule must be boolean'),
    // validate
  ],
  schedulingController.scheduleSinglePlan
);

// ═══════════════════════════════════════════════════════════
// BATCH SCHEDULING
// ═══════════════════════════════════════════════════════════

/**
 * @route   POST /api/scheduling/treatment-plans/batch-schedule
 * @desc    Schedule multiple treatment plans together
 * @access  Doctor, Admin
 */
router.post(
  '/treatment-plans/batch-schedule',
//   authorize(['doctor', 'admin']),
  [
    body('treatmentPlanIds')
      .isArray({ min: 2, max: 50 })
      .withMessage('treatmentPlanIds must be an array of 2-50 IDs'),
    body('treatmentPlanIds.*')
      .isMongoId()
      .withMessage('Each treatment plan ID must be valid'),
    // validate
  ],
  schedulingController.batchSchedulePlans
);

// ═══════════════════════════════════════════════════════════
// GET SCHEDULING STATUS
// ═══════════════════════════════════════════════════════════

/**
 * @route   GET /api/scheduling/treatment-plans/:planId/status
 * @desc    Get scheduling status for a treatment plan
 * @access  Doctor, Therapist (assigned), Admin
 */
router.get(
  '/treatment-plans/:planId/status',
  [
    param('planId')
      .isMongoId()
      .withMessage('Invalid treatment plan ID'),
    // validate
  ],
  schedulingController.getSchedulingStatus
);

// ═══════════════════════════════════════════════════════════
// GET PENDING SCHEDULES
// ═══════════════════════════════════════════════════════════

/**
 * @route   GET /api/scheduling/pending
 * @desc    Get all treatment plans pending therapist approval
 * @access  Therapist, Admin
 */
router.get(
  '/pending',
//   authorize(['therapist', 'admin']),
  schedulingController.getPendingSchedules
);

// ═══════════════════════════════════════════════════════════
// APPROVE SCHEDULE
// ═══════════════════════════════════════════════════════════

/**
 * @route   POST /api/scheduling/treatment-plans/:planId/approve
 * @desc    Approve a scheduled treatment plan
 * @access  Therapist (assigned), Admin
 */
router.post(
  '/treatment-plans/:planId/approve',
//   authorize(['therapist', 'admin']),
  [
    param('planId')
      .isMongoId()
      .withMessage('Invalid treatment plan ID'),
    // validate
  ],
  schedulingController.approveSchedule
);

// ═══════════════════════════════════════════════════════════
// 🆕 GET THERAPIST DAILY SCHEDULE
// ═══════════════════════════════════════════════════════════

/**
 * @route   GET /api/scheduling/my-schedule
 * @desc    Get therapist's schedule for a date/range
 * @query   date - Single date (YYYY-MM-DD)
 * @query   startDate - Range start (YYYY-MM-DD)
 * @query   endDate - Range end (YYYY-MM-DD)
 * @access  Therapist, Admin
 */
router.get(
  '/my-schedule',
//   authorize(['therapist', 'admin']),
  [
    query('date')
      .optional()
      .isISO8601()
      .withMessage('date must be valid ISO date (YYYY-MM-DD)'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('startDate must be valid ISO date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('endDate must be valid ISO date'),
    // validate
  ],
  schedulingController.getMySchedule
);

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

module.exports = router;
