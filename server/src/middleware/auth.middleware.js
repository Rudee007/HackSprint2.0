const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : null;
    
    console.log('🔍 Auth header received:', authHeader ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false, 
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access denied. No token provided.'
        }
      });
    }

    console.log('🔍 Token received, verifying...');
    const decoded = jwt.verify(token, config.JWT.SECRET);
    console.log('🔍 Decoded token payload:', decoded);
    
    // ✅ FIXED: Better user query with explicit field selection
    console.log('🔍 Looking for user with ID:', decoded.id);
    const user = await User.findById(decoded.id).select('_id name email phone role isActive emailVerified phoneVerified');
    
    console.log('🔍 Database query result:');
    console.log('- User found:', !!user);
    if (user) {
      console.log('- User ID:', user._id);
      console.log('- User name:', user.name);
      console.log('- User email:', user.email);
      console.log('- User role:', user.role);
      console.log('- User isActive:', user.isActive);
    }
    
    if (!user) {
      console.log('❌ User not found in database for ID:', decoded.id);
      return res.status(401).json({ 
        success: false, 
        error: {
          code: 'INVALID_USER',
          message: 'Invalid token or user not found.'
        }
      });
    }

    if (!user.isActive) {
      console.log('❌ User account is inactive:', user.email);
      return res.status(401).json({ 
        success: false, 
        error: {
          code: 'INACTIVE_USER',
          message: 'User account is inactive.'
        }
      });
    }

    console.log('✅ Authentication successful for user:', user.email);
    req.user = user;
    next();
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    
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
