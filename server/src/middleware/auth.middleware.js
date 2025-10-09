// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin'); // ✅ Import Admin model
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
    
    // ✅ Check if token is for Admin or Regular User
    let user = null;
    
    if (decoded.type === 'admin' || decoded.role === 'super_admin' || decoded.role === 'admin' || decoded.role === 'moderator') {
      // ✅ Token is for Admin - check Admin collection
      console.log('🔍 Looking for ADMIN with ID:', decoded.id);
      user = await Admin.findById(decoded.id).select('_id name email role permissions isActive');
      
      if (user) {
        console.log('✅ Admin found in Admin collection');
        console.log('- Admin ID:', user._id);
        console.log('- Admin name:', user.name);
        console.log('- Admin email:', user.email);
        console.log('- Admin role:', user.role);
        console.log('- Admin permissions:', user.permissions);
        user.type = 'admin'; // ✅ Mark as admin type
      }
    } else {
      // ✅ Token is for regular User - check User collection
      console.log('🔍 Looking for USER with ID:', decoded.id);
      user = await User.findById(decoded.id).select('_id name email phone role isActive emailVerified phoneVerified');
      
      if (user) {
        console.log('✅ User found in User collection');
        console.log('- User ID:', user._id);
        console.log('- User name:', user.name);
        console.log('- User email:', user.email);
        console.log('- User role:', user.role);
        user.type = 'user'; // ✅ Mark as regular user type
      }
    }
    
    if (!user) {
      console.log('❌ User/Admin not found in database for ID:', decoded.id);
      return res.status(401).json({ 
        success: false, 
        error: {
          code: 'INVALID_USER',
          message: 'Invalid token or user not found.'
        }
      });
    }

    if (!user.isActive) {
      console.log('❌ Account is inactive:', user.email);
      return res.status(401).json({ 
        success: false, 
        error: {
          code: 'INACTIVE_USER',
          message: 'Account is inactive.'
        }
      });
    }

    console.log('✅ Authentication successful for:', user.email, '| Type:', user.type);
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
