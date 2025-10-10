// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const consultationController = require('../controllers/consultation.controller');
const bookingController = require('../controllers/booking.controller');
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

// ============ APPOINTMENT/CONSULTATION MANAGEMENT ROUTES ============

// ✅ GET appointments - Use adminController if available, otherwise use consultationController
router.get('/appointments', 
  requirePermission('appointment_management'), 
  adminController.getAppointments  // This should already exist in your adminController
);

// ✅ CREATE appointment - Using BookingController (has conflict detection)
router.post('/appointments', 
  requirePermission('appointment_management'), 
  bookingController.createBooking
);

// ✅ Check slot availability before booking
router.post('/appointments/check-availability', 
  requirePermission('appointment_management'), 
  bookingController.checkSlotAvailability
);

// ✅ Get alternative slots if booking conflicts
router.post('/appointments/alternative-slots', 
  requirePermission('appointment_management'), 
  bookingController.getAlternativeSlots
);

// ✅ Get provider's bookings for a date
router.get('/appointments/provider/:providerId/bookings', 
  requirePermission('appointment_management'), 
  bookingController.getProviderBookings
);

// ✅ RESCHEDULE appointment - Use adminController
router.put('/appointments/:appointmentId/reschedule', 
  requirePermission('appointment_management'), 
  adminController.rescheduleAppointment
);

// ✅ CANCEL appointment - Use adminController
router.patch('/appointments/:appointmentId/cancel', 
  requirePermission('appointment_management'), 
  adminController.cancelAppointment
);

// Make sure this line exists in your admin.routes.js

// ✅ Assign/reassign provider to appointment
router.patch('/appointments/:id/assign-provider', 
    requirePermission('appointment_management'), 
    consultationController.adminAssignProvider  // ✅ This method must exist
  );
  

// ============ DASHBOARD & ANALYTICS ROUTES ============
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/system/metrics', adminController.getSystemMetrics);

// ============ EXPORT ROUTES ============
router.use('/export', require('./export.routes'));

// ============ FEEDBACK MANAGEMENT ROUTES ============
router.use('/feedback', require('./feedback.routes'));

module.exports = router;
