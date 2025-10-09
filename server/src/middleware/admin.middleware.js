// src/middleware/admin.middleware.js
const { AppError } = require('./error.middleware');

const requireAdmin = (req, res, next) => {
  console.log('🛡️ Admin Check:', {
    hasUser: !!req.user,
    userId: req.user?._id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    userType: req.user?.type
  });

  if (!req.user) {
    console.log('❌ No user in request');
    throw new AppError('Authentication required', 401, 'NO_USER');
  }

  // ✅ Check if user is admin
  const isAdmin = 
    req.user.type === 'admin' || 
    req.user.role === 'super_admin' || 
    req.user.role === 'admin' ||
    req.user.role === 'moderator';

  if (!isAdmin) {
    console.log('❌ User is not admin:', req.user.role);
    throw new AppError('Admin access required', 403, 'NOT_ADMIN');
  }

  console.log('✅ Admin check passed');
  next();
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    console.log('🔒 Permission Check:', {
      required: permission,
      userPermissions: req.user?.permissions,
      userRole: req.user?.role
    });

    // ✅ Super admin has all permissions
    if (req.user.role === 'super_admin') {
      console.log('✅ Super admin - all permissions granted');
      return next();
    }

    // Check if user has the required permission
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      console.log('❌ Permission denied');
      throw new AppError(`Permission denied: ${permission}`, 403, 'PERMISSION_DENIED');
    }

    console.log('✅ Permission granted');
    next();
  };
};

module.exports = { requireAdmin, requirePermission };
