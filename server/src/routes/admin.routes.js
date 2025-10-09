// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin, requirePermission } = require('../middleware/admin.middleware');

// ============ PUBLIC AUTH ROUTES ============
router.post('/auth/login', adminController.login);
router.post('/auth/create-first-admin', adminController.createFirstAdmin);
router.post('/auth/verify-token', adminController.verifyToken);

// ============ APPLY AUTHENTICATION ============
router.use(authenticate);
router.use(requireAdmin);

// ============ USER MANAGEMENT ROUTES ============
router.get('/users', requirePermission('user_management'), adminController.getUsers);
router.get('/users/stats', requirePermission('user_management'), adminController.getUserStats);
router.get('/users/:userId', requirePermission('user_management'), adminController.getUserById);
router.post('/users', requirePermission('user_management'), adminController.createUser);
router.put('/users/:userId', requirePermission('user_management'), adminController.updateUser);
router.patch('/users/:userId/toggle-status', requirePermission('user_management'), adminController.toggleUserStatus);
router.delete('/users/:userId', requirePermission('user_management'), adminController.deleteUser);

// ============ APPOINTMENT MANAGEMENT ROUTES ============
router.get('/appointments', requirePermission('appointment_management'), adminController.getAppointments);
router.put('/appointments/:appointmentId/reschedule', requirePermission('appointment_management'), adminController.rescheduleAppointment);
router.patch('/appointments/:appointmentId/cancel', requirePermission('appointment_management'), adminController.cancelAppointment);

// ============ DASHBOARD & ANALYTICS ROUTES ============
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/system/metrics', adminController.getSystemMetrics);

// ============ EXPORT ROUTES ============
// ✅ ADD THIS LINE - This registers the export routes
router.use('/export', require('./export.routes'));

// ============ FEEDBACK MANAGEMENT ROUTES ============
router.use('/feedback', require('./feedback.routes'));

module.exports = router;
