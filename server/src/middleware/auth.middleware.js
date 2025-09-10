const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');


const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : null;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access denied. No token provided.'
        }
      });
    }

    // Verify and decode JWT token
    const decoded = jwt.verify(token, config.JWT.SECRET);
    
    // Find user in database
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: {
          code: 'INVALID_USER',
          message: 'Invalid token or user not found.'
        }
      });
    }

    // Attach user to request object
    req.user = user;
    next();
    
  } catch (error) {
    // Handle different JWT errors
    let errorMessage = 'Invalid token.';
    let errorCode = 'INVALID_TOKEN';
    
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired.';
      errorCode = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Malformed token.';
      errorCode = 'MALFORMED_TOKEN';
    }
    
    res.status(401).json({ 
      success: false, 
      error: {
        code: errorCode,
        message: errorMessage
      }
    });
  }
};

module.exports = { authenticate };
