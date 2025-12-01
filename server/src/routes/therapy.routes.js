// backend/routes/therapy.routes.js
// 🌿 THERAPY ROUTES

const express = require('express');
const router = express.Router();
const therapyController = require('../controllers/therapy.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * Public/Doctor Routes (Read-Only)
 */

// Get all therapies (with filters)
router.get('/', therapyController.getAllTherapies);

// Get therapies grouped by phase
router.get('/by-phase', therapyController.getTherapiesByPhase);

// Get therapies for dropdown
router.get('/dropdown', therapyController.getTherapiesForDropdown);

// Get therapy by code (MUST be before /:id)
router.get('/code/:code', therapyController.getTherapyByCode);

// Get single therapy by ID
router.get('/:id', therapyController.getTherapyById);

module.exports = router;
