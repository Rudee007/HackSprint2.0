// routes/patientAuth.routes.js
const express = require('express');
const router = express.Router();

const {
  registerPatient,
  verifyPatientRegistration,
  loginPatient,
  verifyPatientLogin,
  resendPatientOTP,
} = require('../controllers/patientAuth.controller');

/**
 * @route   POST /api/patient-auth/register
 * @desc    Patient registration (name + phone -> send OTP)
 * @access  Public
 */
router.post('/register', registerPatient);

/**
 * @route   POST /api/patient-auth/verify-registration
 * @desc    Verify registration OTP and issue tokens
 * @access  Public
 */
router.post('/verify-registration', verifyPatientRegistration);

/**
 * @route   POST /api/patient-auth/login
 * @desc    Patient login (phone only -> send OTP)
 * @access  Public
 */
router.post('/login', loginPatient);

/**
 * @route   POST /api/patient-auth/verify-login
 * @desc    Verify login OTP and issue tokens
 * @access  Public
 */
router.post('/verify-login', verifyPatientLogin);

/**
 * @route   POST /api/patient-auth/resend-otp
 * @desc    Resend OTP for given userId (register or login flow)
 * @access  Public
 */
router.post('/resend-otp', resendPatientOTP);

module.exports = router;
