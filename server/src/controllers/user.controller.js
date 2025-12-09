// controllers/user.controller.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const logger = require('../utils/logger');

// PUT /api/users/:id/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body.profile;

  if (!updates) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PROFILE_DATA',
        message: 'Profile data is required for update.',
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Only allow self-update (later you can allow admin override if needed)
  if (req.user._id.toString() !== id) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You can only update your own profile.',
      },
      timestamp: new Date().toISOString(),
    });
  }

  logger.info('User profile update attempt', { userId: id });

  // use authenticated user from middleware
  const user = req.user;

  // For patients you can relax this if you want profile after signup to be simple:
  // remove the hard requirement or keep a minimal version
  if (
    user.role === 'patient' &&
    updates.symptoms &&
    Array.isArray(updates.symptoms) &&
    updates.symptoms.length === 0
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_SYMPTOMS',
        message: 'Symptoms are required for patient profile.',
      },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    user.profile = {
      ...(user.profile ? user.profile.toObject?.() || user.profile : {}),
      ...updates,
    };

    if(user.role === 'patient') {
      const p = user.profile;
      user.profileCompleted = true;
      console.log('Profile completed status for patient:', user.profileCompleted);
    }

    user.updatedBy = req.user._id;
    await user.save();

    logger.info('User profile updated successfully', { userId: id });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        userId: user._id,
        profile: user.profile,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Failed to update profile', { userId: id, error: err.message });

    return res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_UPDATE_FAILED',
        message: 'An error occurred while updating the profile.',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select('-passwordHash -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.',
        },
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Failed to fetch user', { userId: id, error: err.message });

    return res.status(500).json({
      success: false,
      error: {
        code: 'USER_FETCH_FAILED',
        message: 'An error occurred while fetching the user.',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Optional: /me helpers if you add routes
const updateMyProfile = asyncHandler(async (req, res) => {
  req.params.id = req.user._id.toString();
  return updateProfile(req, res);
});

const getMe = asyncHandler(async (req, res) => {
  req.params.id = req.user._id.toString();
  return getUserById(req, res);
});

module.exports = {
  updateProfile,
  getUserById,
  updateMyProfile,
  getMe,
};
