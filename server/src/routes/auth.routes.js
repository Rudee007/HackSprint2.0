const express = require('express');
const router = express.Router();

// Import only essential controllers and middleware
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter, generalLimiter } = require('../middleware/rateLimit.middleware');

/**
 * ====================================
 * PUBLIC AUTHENTICATION ROUTES
 * ====================================
 */

// User Registration
router.post('/register', 
  authLimiter,
  authController.register
);

// User Login (supports email or phone)
router.post('/login', 
  authLimiter,
  authController.login
);

/**
 * ====================================
 * VERIFICATION ROUTES
 * ====================================
 */

// Verify email address with token
router.get('/verify-email', 
  generalLimiter,
  authController.verifyEmail
);

// Verify phone number with OTP
router.post('/verify-phone', 
  authLimiter,
  authController.verifyPhone
);

// Resend email verification
router.post('/resend-email-verification', 
  authLimiter,
  authController.resendEmailVerification
);

// Resend phone OTP
router.post('/resend-phone-otp', 
  authLimiter,
  authController.resendPhoneOTP
);

/**
 * ====================================
 * AUTHENTICATED USER ROUTES
 * ====================================
 */

// // Get current user profile
router.get('/profile', 
  authenticate,
  authController.getProfile
);

// // Update user profile
// router.put('/profile',
//   authenticate,
//   authController.updateProfile
// );

// // Update user location
// router.put('/location',
//   authenticate,
//   authController.updateLocation
// );

// // Change password
// router.put('/change-password',
//   authenticate,
//   authController.changePassword
// );

// Refresh access token
router.post('/refresh-token', 
  generalLimiter,
  authController.refreshToken
);

// Logout from current device
router.post('/logout', 
  authenticate,
  authController.logout
);

// Logout from all devices
router.post('/logout-all', 
  authenticate,
  authController.logoutAll
);

/**
 * ====================================
 * PASSWORD RESET ROUTES
 * ====================================
 */

// Request password reset (forgot password)
// router.post('/forgot-password',
//   authLimiter,
//   authController.forgotPassword
// );

// // Reset password with token
// router.post('/reset-password',
//   authLimiter,
//   authController.resetPassword
// );

/**
 * ====================================
 * HEALTH CHECK
 * ====================================
 */

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication service is healthy',
    data: {
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /register',
        'POST /login',
        'GET /verify-email',
        'POST /verify-phone',
        'GET /profile',
        'POST /logout'
      ]
    }
  });
});

module.exports = router;
