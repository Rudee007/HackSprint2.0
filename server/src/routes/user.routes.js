// routes/user.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

// All routes require auth
router.use(authenticate);

// Update my profile (patient/doctor/admin)
router.put('/:id/profile', userController.updateProfile);

// Get user by id (for dashboards/admin/patient-self)
router.get('/:id', userController.getUserById);

module.exports = router;
