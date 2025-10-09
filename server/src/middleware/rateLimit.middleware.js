const rateLimit = require('express-rate-limit');

// Generic rate limiter factory - IPv6 compatible
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 60 * 1000,  // 15 minutes default
    max = 1000000000,                  // 100 requests per window default
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = true,
    skipFailedRequests = true,
    standardHeaders = true,
    legacyHeaders = true
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { 
      success: false, 
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: message
      }
    },
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    // Remove custom keyGenerator to use default IPv6-compatible one
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message,
          retryAfter: Math.round(windowMs / 1000) // seconds
        }
      });
    }
  });
};

// Specific rate limiters for different endpoints
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP per 15 minutes
  message: 'Too many requests from this IP address'
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 authentication attempts per IP per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true // Don't count successful requests
});

const schedulingLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 scheduling requests per IP per minute
  message: 'Too many scheduling requests, please slow down'
});

const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 API calls per minute per IP
  message: 'API rate limit exceeded'
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per IP per hour
  message: 'Too many password reset attempts, please try again later'
});

const smartSchedulingLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 optimization requests per 5 minutes
  message: 'Smart scheduling optimization rate limit exceeded'
});

module.exports = { 
  generalLimiter,
  authLimiter,
  schedulingLimiter,
  apiLimiter,
  passwordResetLimiter,
  smartSchedulingLimiter,
  createRateLimiter
};
