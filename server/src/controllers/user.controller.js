const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const logger = require("../utils/logger");

const updateProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body.profile;

  // Validate request data
  if (!updates) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PROFILE_DATA",
        message: "Profile data is required for update."
      },
      timestamp: new Date().toISOString()
    });
  }

  // ✅ Ensure user can only update their own profile
  if (req.user._id.toString() !== id) {
    return res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You can only update your own profile."
      },
      timestamp: new Date().toISOString()
    });
  }

  logger.info("User profile update attempt", { userId: id });

  // ✅ Use authenticated user from middleware instead of separate query
  const user = req.user;

  // Validate required fields for patients
  if (user.role === "patient" && (!updates.symptoms || updates.symptoms.length === 0)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_SYMPTOMS",
        message: "Symptoms are required for patient profile."
      },
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // Merge existing profile with updates
    user.profile = {
      ...user.profile?.toObject(),
      ...updates
    };

    user.updatedBy = req.user._id;
    await user.save();

    logger.info("User profile updated successfully", { userId: id });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        userId: user._id,
        profile: user.profile
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error("Failed to update profile", { userId: id, error: err.message });

    res.status(500).json({
      success: false,
      error: {
        code: "PROFILE_UPDATE_FAILED",
        message: "An error occurred while updating the profile."
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = {
  updateProfile
};
