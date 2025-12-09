// controllers/patientAuth.controller.js
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NotificationService = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * PATIENT REGISTER (PHONE + OTP) – STEP 1
 * POST /api/patient-auth/register
 * Body: { name, phone }
 */
const registerPatient = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'Name and phone are required.'
      },
      timestamp: new Date().toISOString()
    });
  }

  // Use same style as schema (E.164-ish, 6–16 digits)
  const phoneRegex = /^[\+]?[1-9][\d]{5,15}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PHONE',
        message: 'Invalid phone number format.'
      },
      timestamp: new Date().toISOString()
    });
  }

  // Check if phone already exists for any active user
  const existing = await User.findOne({ phone, deletedAt: null });
  if (existing) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PHONE_EXISTS',
        message: 'This phone is already registered. Please login instead.'
      },
      timestamp: new Date().toISOString()
    });
  }

  // userSchema requires: name, passwordHash, role
  const tempPassword = Math.random().toString(36).slice(-10);
  const user = new User({
    name,
    phone,
    passwordHash: tempPassword,  // will be hashed in pre-save
    role: 'patient',
    isActive: true,
    phoneVerified: false
  });

  const otp = user.generatePhoneOTP();
  await user.save();

  try {
    await NotificationService.notifyOtp(user, otp);
    logger.info('Patient registration OTP sent', { userId: user._id, phone });
  } catch (err) {
    logger.warn('Failed to send registration OTP', {
      userId: user._id,
      error: err.message
    });
  }

  return res.status(200).json({
    success: true,
    message: 'OTP sent to your phone. Please verify to complete registration.',
    data: {
      userId: user._id,
      phone: user.phone,
      otpExpiresInMinutes: 10
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * PATIENT REGISTER – STEP 2: VERIFY OTP
 * POST /api/patient-auth/verify-registration
 * Body: { userId, otp }
 */
const verifyPatientRegistration = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'User ID and OTP are required.'
      },
      timestamp: new Date().toISOString()
    });
  }

  const user = await User.findById(userId);
  if (!user || user.role !== 'patient') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Patient not found.'
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    const ok = user.verifyPhoneOTP(otp);

    if (!ok) {
      await user.save(); // persists phoneOTPAttempts++
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid OTP. Please try again.',
          attemptsRemaining: 3 - user.phoneOTPAttempts
        },
        timestamp: new Date().toISOString()
      });
    }

    // Mark phone as verified and reset attempts already done in verifyPhoneOTP
    await user.save();

    // Generate JWT tokens from schema helpers
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/patient-auth'
    });

    logger.info('Patient registration verified', { userId: user._id });

    return res.status(200).json({
      success: true,
      message: 'Registration successful!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          phoneVerified: user.phoneVerified,
          profileCompleted: user.profileCompleted
        },
        accessToken,
        expiresIn: process.env.JWT_EXPIRE || '24h'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Patient registration OTP verification error', {
      userId: user._id,
      error: err.message
    });
    return res.status(400).json({
      success: false,
      error: {
        code: 'VERIFICATION_FAILED',
        message: err.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PATIENT LOGIN – STEP 1: ENTER PHONE, SEND OTP
 * POST /api/patient-auth/login
 * Body: { phone }
 */
const loginPatient = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PHONE',
        message: 'Phone number is required.'
      },
      timestamp: new Date().toISOString()
    });
  }

  const user = await User.findOne({
    phone,
    role: 'patient',
    deletedAt: null
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'No patient registered with this phone number.'
      },
      timestamp: new Date().toISOString()
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive. Please contact support.'
      },
      timestamp: new Date().toISOString()
    });
  }

  // Generate fresh OTP for login
  const otp = user.generatePhoneOTP();
  await user.save();

  try {
    await NotificationService.notifyOtp(user, otp);
    logger.info('Patient login OTP sent', { userId: user._id, phone });
  } catch (err) {
    logger.warn('Failed to send login OTP', {
      userId: user._id,
      error: err.message
    });
  }

  return res.status(200).json({
    success: true,
    message: 'OTP sent to your phone.',
    data: {
      userId: user._id,
      phone: user.phone,
      otpExpiresInMinutes: 10
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * PATIENT LOGIN – STEP 2: VERIFY OTP
 * POST /api/patient-auth/verify-login
 * Body: { userId, otp, rememberMe? }
 */
const verifyPatientLogin = asyncHandler(async (req, res) => {
  const { userId, otp, rememberMe = false } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'User ID and OTP are required.'
      },
      timestamp: new Date().toISOString()
    });
  }

  const user = await User.findById(userId);
  if (!user || user.role !== 'patient') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Patient not found.'
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    const ok = user.verifyPhoneOTP(otp);

    if (!ok) {
      await user.save();
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid OTP. Please try again.',
          attemptsRemaining: 3 - user.phoneOTPAttempts
        },
        timestamp: new Date().toISOString()
      });
    }

    user.lastLogin = new Date();
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await user.save();

    const refreshTokenExpiry =
      rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenExpiry,
      path: '/api/patient-auth'
    });

    logger.info('Patient logged in via OTP', { userId: user._id });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          phoneVerified: user.phoneVerified,
          profileCompleted: user.profileCompleted
        },
        accessToken,
        expiresIn: process.env.JWT_EXPIRE || '24h'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Patient login OTP verification error', {
      userId: user._id,
      error: err.message
    });
    return res.status(400).json({
      success: false,
      error: {
        code: 'VERIFICATION_FAILED',
        message: err.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * RESEND OTP (for either register or login)
 * POST /api/patient-auth/resend-otp
 * Body: { userId }
 */
const resendPatientOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_USER_ID',
        message: 'User ID is required.'
      },
      timestamp: new Date().toISOString()
    });
  }

  const user = await User.findById(userId);
  if (!user || user.role !== 'patient') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Patient not found.'
      },
      timestamp: new Date().toISOString()
    });
  }

  const otp = user.generatePhoneOTP();
  await user.save();

  try {
    await NotificationService.notifyOtp(user, otp);
    logger.info('Patient OTP resent', { userId: user._id });

    return res.status(200).json({
      success: true,
      message: 'OTP resent to your phone.',
      data: {
        userId: user._id,
        otpExpiresInMinutes: 10
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Failed to resend OTP', { userId: user._id, error: err.message });
    return res.status(500).json({
      success: false,
      error: {
        code: 'OTP_SEND_FAILED',
        message: 'Failed to send OTP. Please try again.'
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = {
  registerPatient,
  verifyPatientRegistration,
  loginPatient,
  verifyPatientLogin,
  resendPatientOTP
};
