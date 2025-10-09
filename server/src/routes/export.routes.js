const express = require('express');
const { Parser } = require('json2csv');
const Patient = require('../models/Patient');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// CSV Export Route
router.get('/patients/export/csv', authenticate, async (req, res) => {
  try {
    // Get authenticated user's ID
    const userId = req.user.id;
    
    // Fetch patient data for this user
    const patients = await Patient.find({ userId })
      .select('name email phone age address symptoms diagnosis createdAt')
      .lean();

    if (!patients || patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No patient data found for export'
      });
    }

    // Define CSV fields
    const fields = [
      'name',
      'email', 
      'phone',
      'age',
      'address.city',
      'address.state',
      'symptoms',
      'diagnosis',
      'createdAt'
    ];

    const fieldNames = [
      'Patient Name',
      'Email',
      'Phone',
      'Age', 
      'City',
      'State',
      'Symptoms',
      'Diagnosis',
      'Registration Date'
    ];

    // Convert to CSV
    const json2csvParser = new Parser({ fields, fieldNames });
    const csv = json2csvParser.parse(patients);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=patient_data_export.csv');
    
    return res.send(csv);

  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export patient data'
    });
  }
});

module.exports = router;
