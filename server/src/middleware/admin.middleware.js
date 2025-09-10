// src/middleware/admin.middleware.js
const { AppError } = require('./error.middleware');

// Check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    
    if (req.user.role !== 'admin') {
      throw new AppError('Admin access required', 403, 'FORBIDDEN');
    }
    
    next();
  };

// Check specific permission
const requirePermission = (permission) => {
    return (req, res, next) => {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }
      
      if (req.user.role !== 'admin') {
        throw new AppError('Admin access required', 403, 'FORBIDDEN');
      }
      
      // Check if admin has specific permission
      if (!req.user.permissions || !req.user.permissions.includes(permission)) {
        throw new AppError(`Permission '${permission}' required`, 403, 'INSUFFICIENT_PERMISSIONS');
      }
      
      next();
    };
  };
  

// Check if user can manage other users
const canManageUser = (req, res, next) => {
  const targetUserId = req.params.userId || req.body.userId;
  
  // Admin can manage anyone
  if (req.user.isAdmin()) {
    return next();
  }
  
  // Users can only manage themselves
  if (req.user._id.toString() === targetUserId) {
    return next();
  }
  
  throw new AppError('Cannot manage other users', 403, 'FORBIDDEN');
};

module.exports = {
  requireAdmin,
  requirePermission,
  canManageUser
};
