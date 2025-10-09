// src/routes/export.routes.js
const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin, requirePermission } = require('../middleware/admin.middleware');

// Apply authentication and admin check
router.use(authenticate);
router.use(requireAdmin);

// ============ ADMIN EXPORTS ============

// Export all users (CSV)
router.get('/users/csv', 
  requirePermission('user_management'), 
  exportController.exportAllUsersCSV
);

// Export all users (Excel)
router.get('/users/excel', 
  requirePermission('user_management'), 
  exportController.exportAllUsersExcel
);

// Export patients only (CSV)
router.get('/patients/csv', 
  requirePermission('user_management'), 
  exportController.exportPatientsCSV
);

// Export doctors only (CSV)
router.get('/doctors/csv', 
  requirePermission('user_management'), 
  exportController.exportDoctorsCSV
);

// Export appointments (CSV)
router.get('/appointments/csv', 
  requirePermission('appointment_management'), 
  exportController.exportAppointmentsCSV
);

module.exports = router;
