const logger = require('../config/logger');

// Custom error class with support for additional data
class AppError extends Error {
  constructor(message, statusCode, code = null, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.data = data; // ✅ Added to support additional error data
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Custom async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Central error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || 'anonymous'
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new AppError(message, 400, 'DUPLICATE_FIELD');
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Something went wrong',
      // ✅ Include additional data if present (for alternative slots, etc.)
      ...(error.data && error.data),
      // Include stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    },
    timestamp: new Date().toISOString()
  };

  // Send error response
  res.status(error.statusCode || 500).json(errorResponse);
};

module.exports = { errorHandler, AppError, asyncHandler };
