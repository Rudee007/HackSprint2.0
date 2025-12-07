const authService = require('../services/auth.service');
const notificationService = require('../services/notification.service');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../config/logger');
const config = require('../config');
const jwt = require('jsonwebtoken');
/**
 * Register new user with email and/or phone verification
 * POST /api/auth/register
 */

// controllers/auth.controller.js (register)

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, location, address } = req.body;

  if (!email && !phone) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_IDENTIFIER',
        message: 'Either email or phone number is required for registration.'
      },
      timestamp: new Date().toISOString()
    });
  }

  logger.info('User registration attempt', { role });

  const result = await authService.register({
    name, email, phone, password, role, location, address
  });

  const notifications = [];

  // Email verification notification
  if (email && result.verificationData?.emailToken) {
    try {
      await notificationService.notifyEmailVerification(
        result.user,                  // full user doc
        result.verificationData.emailToken
      );
      notifications.push('verification_email_notification_created');
    } catch (err) {
      logger.warn('Failed to create/send verification email notification', {
        userId: result.user._id,
        error: err.message
      });
      notifications.push('verification_email_notification_failed');
    }
  }

  // Phone OTP notification
  if (phone && result.verificationData?.phoneOTP) {
    try {
      await notificationService.notifyOtp(
        result.user,
        result.verificationData.phoneOTP
      );
      notifications.push('otp_notification_created');
    } catch (err) {
      logger.warn('Failed to create/send OTP notification', {
        userId: result.user._id,
        error: err.message
      });
      notifications.push('otp_notification_failed');
    }
  }

  logger.info('User registered successfully', {
    userId: result.user._id,
    notifications
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your contact details.',
    data: {
      userId: result.user._id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone,
      role: result.user.role,
      verificationRequired: {
        email: !!email && !result.user.emailVerified,
        phone: !!phone && !result.user.phoneVerified
      },
      notifications
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Login user with email or phone number
 * POST /api/auth/login
 */// In controllers/auth.controller.js -> login
const login = asyncHandler(async (req, res) => {
  const { identifier, password, rememberMe = false } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_CREDENTIALS', message: 'Identifier and password are required.' },
      timestamp: new Date().toISOString()
    });
  }

  logger.info('Login attempt', { rememberMe });

  // Returns { user, accessToken, refreshToken }
  const { user, accessToken, refreshToken } = await authService.login(identifier, password);

  const refreshTokenExpiry = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

  // Use production-appropriate cookie flags (see notes below)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // was wrong before
    sameSite: 'strict', // adjust if cross-site needed
    maxAge: refreshTokenExpiry,
    path: '/api/auth'
  });

  logger.info('User logged in successfully', { userId: user._id });

  console.log("req.body:", req.body);
  console.log("req.cookies:", req.cookies);
  // console.log("user:", user); // remove or use the scoped 'user' safely if desired

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
      },
      accessToken: accessToken, // not result.tokens.accessToken
      expiresIn: process.env.JWT_EXPIRE || '24h' // align with generateAuthToken
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Verify email address with token
 * GET /api/auth/verify-email?token=xxx
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Verification token is required.'
      },
      timestamp: new Date().toISOString()
    });
  }

  const user = await authService.verifyEmail(token);

  try {
    if (user.email) {
      await notificationService.sendWelcomeEmail(user.email, user.name);
    }
  } catch (err) {
    logger.warn('Failed to send welcome email', {
      userId: user._id,
      error: err.message
    });
  }

  logger.info('Email verified successfully', { userId: user._id });

  res.json({
    success: true,
    message: 'Email verified successfully!',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Verify phone number with OTP
 * POST /api/auth/verify-phone
 *//**
 * Verify phone number with OTP
 * POST /api/auth/verify-phone
 */const verifyPhone = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_OTP_DETAILS',
        message: 'User ID and OTP are required.'
      },
      timestamp: new Date().toISOString()
    });
  }

  const user = await authService.verifyPhone(userId, otp);

  if (!user) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_OTP',
        message: 'Invalid OTP or verification failed.'
      },
      timestamp: new Date().toISOString()
    });
  }

  logger.info('Phone verified successfully', { userId: user._id });

  // ✅ Generate JWT tokens after successful verification
  const payload = { 
    id: user._id, 
    role: user.role,
    phone: user.phone 
  };
  
  const accessToken = jwt.sign(
    payload, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' }
  );
  
  const refreshToken = jwt.sign(
    payload, 
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    message: 'Phone number verified successfully!',
    data: {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phoneVerified
      },
      accessToken,      // ✅ Now includes token
      refreshToken,     // ✅ Now includes refresh token
      expiresIn: '24h'  // ✅ Token expiry info
    },
    timestamp: new Date().toISOString()
  });
});


/**
 * Resend email verification
 * POST /api/auth/resend-email-verification
 */
// resendEmailVerification
const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_EMAIL', message: 'Email is required.' },
      timestamp: new Date().toISOString()
    });
  }

  const result = await authService.resendEmailVerification(email);
  // result: { user, verificationToken }

  try {
    await notificationService.notifyEmailVerification(
      result.user,
      result.verificationToken
    );

    logger.info('Email verification resent', { userId: result.user._id });

    res.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Failed to resend verification email', {
      userId: result.user._id,
      error: err.message
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'EMAIL_SEND_FAILED',
        message: 'Failed to send verification email. Please try again later.'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Resend phone OTP
 * POST /api/auth/resend-phone-otp
 */
// resendPhoneOTP
const resendPhoneOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_PHONE', message: 'Phone number is required.' },
      timestamp: new Date().toISOString()
    });
  }

  const result = await authService.resendPhoneOTP(phone);
  // result: { user, otp }

  try {
    await notificationService.notifyOtp(result.user, result.otp);

    logger.info('Phone OTP resent', { userId: result.user._id });

    res.json({
      success: true,
      message: 'OTP sent successfully. Please check your phone.',
      data: { otpExpiry: '10 minutes' },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Failed to resend OTP', {
      userId: result.user._id,
      error: err.message
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'SMS_SEND_FAILED',
        message: 'Failed to send OTP. Please try again later.'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_TOKEN_MISSING',
        message: 'Refresh token not provided'
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    const result = await authService.refreshToken(refreshToken);

    logger.info('Access token refreshed', { userId: result.user._id });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: {
          id: result.user._id,
          name: result.user.name,
          role: result.user.role
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.warn('Invalid refresh token', { error: err.message });

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or expired.'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Logout current session
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (refreshToken && req.user) {
    await authService.logout(req.user._id, refreshToken);
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth'
  });

  logger.info('User logged out', { userId: req.user?._id || 'anonymous' });

  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * Logout from all sessions
 * POST /api/auth/logout-all
 */
const logoutAll = asyncHandler(async (req, res) => {
  if (req.user) {
    await authService.logoutAll(req.user._id);
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth'
  });

  logger.info('User logged out from all devices', {
    userId: req.user?._id || 'anonymous'
  });

  res.json({
    success: true,
    message: 'Logged out from all devices successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get profile of authenticated user
 * GET /api/auth/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        location: user.location,
        address: user.address,
        profile: user.profile,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  register,
  login,
  verifyEmail,
  verifyPhone,
  resendEmailVerification,
  resendPhoneOTP,
  refreshToken,
  logout,
  logoutAll,
  getProfile
};
