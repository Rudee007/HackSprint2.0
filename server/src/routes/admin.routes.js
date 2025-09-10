// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin, requirePermission } = require('../middleware/admin.middleware');

// Apply authentication to all admin routes
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
router.get('/dashboard/stats', requirePermission('system_analytics'), adminController.getDashboardStats);
router.get('/system/metrics', requirePermission('system_analytics'), adminController.getSystemMetrics);


// feed back management 

// Add feedback management to admin routes
router.use('/feedback', require('../routes/feedback.routes'));

module.exports = router;
