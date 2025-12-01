// backend/routes/courseTemplate.routes.js
// 📋 COURSE TEMPLATE ROUTES

const express = require('express');
const router = express.Router();
const courseTemplateController = require('../controllers/courseTemplate.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * Public/Doctor Routes (Read-Only)
 */

// Get all templates (with filters)
router.get('/', courseTemplateController.getAllTemplates);

// Get featured templates
router.get('/featured', courseTemplateController.getFeaturedTemplates);

// Get templates for dropdown
router.get('/dropdown', courseTemplateController.getTemplatesForDropdown);

// Get template by code (MUST be before /:id)
router.get('/code/:code', courseTemplateController.getTemplateByCode);

// Get template summary (MUST be before /:id)
router.get('/:id/summary', courseTemplateController.getTemplateSummary);

// Get single template by ID
router.get('/:id', courseTemplateController.getTemplateById);

/**
 * Authenticated Routes
 */

// Increment usage count (requires authentication)
router.post('/:id/increment-usage', authenticate, courseTemplateController.incrementUsage);

module.exports = router;
