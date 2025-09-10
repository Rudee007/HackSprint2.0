const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/scheduling.controller');
const { authenticate } = require('../middleware/auth.middleware'); // Reuse existing auth

// Get available slots for a provider
router.get('/providers/:providerId/availability', authenticate, schedulingController.getAvailableSlots);

// Get provider availability settings
router.get('/providers/:providerId/settings', authenticate, schedulingController.getProviderAvailability);

// Update provider availability settings
router.put('/providers/:providerId/settings', authenticate, schedulingController.updateProviderAvailability);

module.exports = router;
