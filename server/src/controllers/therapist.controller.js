const therapistService = require('../services/therapist.service');
const Therapist = require('../models/Therapist');

async function registerTherapist(req, res) {
  try {
    const data = req.body;
    const therapist = await therapistService.createTherapist(data);
    res.status(201).json({ 
      success: true, 
      message: 'Therapist registered successfully',
      data: therapist 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
}

async function getTherapist(req, res) {
  try {
    const therapist = await therapistService.getTherapistById(req.params.id);
    if (!therapist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Therapist not found' 
      });
    }
    res.json({ success: true, data: therapist });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

async function getMyProfile(req, res) {
  try {
    const therapist = await therapistService.getTherapistByUserId(req.user.id);
    if (!therapist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Therapist profile not found' 
      });
    }
    res.json({ success: true, data: therapist });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

async function updateProfile(req, res) {
  try {
    const therapist = await therapistService.updateTherapist(req.params.id, req.body);
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: therapist 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

async function searchTherapists(req, res) {
  try {
    const filters = req.query;
    
    // Build query object
    const query = {
      isActive: true, // Only active therapists
      verificationStatus: 'approved' // Only approved therapists
    };
    
    // Handle specialization array search
    if (filters.specialization) {
      query.specialization = filters.specialization; // MongoDB handles array matching automatically
    }
    
    // Handle therapy certification search
    if (filters.therapy) {
      query['certifications.therapy'] = filters.therapy;
    }
    
    // Handle location search
    if (filters.city) {
      query['userId.address.city'] = new RegExp(filters.city, 'i');
    }
    
    // Handle experience filter
    if (filters.minExperience) {
      query.experienceYears = { $gte: parseInt(filters.minExperience) };
    }
    
    // Execute query with population
    const therapists = await Therapist.find(query)
      .populate('userId', 'name phone email address location')
      .sort({ 'metrics.averageRating': -1 }) // Sort by rating
      .limit(parseInt(filters.limit) || 20);
    
    res.json({ 
      success: true,
      message: `Found ${therapists.length} therapists`,
      data: therapists,
      count: therapists.length
    });
    
  } catch (error) {
    console.error('Search therapists error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}


async function updateAvailability(req, res) {
  try {
    const { id } = req.params;
    const availabilityData = req.body;
    
    const therapist = await therapistService.updateAvailability(id, availabilityData);
    res.json({ 
      success: true, 
      message: 'Availability updated successfully',
      data: therapist 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}
// controllers/therapist.controller.js - Additional methods

// Get assigned treatment plans
async function getAssignedTreatmentPlans(req, res) {
  try {
    const therapistId = req.params.id || req.user.therapistId;
    const filters = req.query;
    
    const treatmentPlans = await therapistService.getAssignedTreatmentPlans(therapistId, filters);
    
    res.json({
      success: true,
      message: 'Treatment plans retrieved successfully',
      data: {
        treatmentPlans,
        count: treatmentPlans.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// Update treatment progress
async function updateTreatmentProgress(req, res) {
  try {
    const { id } = req.params;
    const progressData = req.body;
    
    const result = await therapistService.updateTreatmentProgress(id, progressData);
    
    res.json({
      success: true,
      message: 'Treatment progress updated successfully',
      data: result.treatmentPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// Get therapist statistics
async function getTherapistStats(req, res) {
  try {
    const therapistId = req.params.id || req.user.therapistId;
    const { period } = req.query;
    
    const stats = await therapistService.getTherapistStats(therapistId, period);
    
    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// Create treatment plan
async function createTreatmentPlan(req, res) {
  try {
    const data = req.body;
    const result = await therapistService.createTreatmentPlan(data, req.user._id);
    
    res.status(201).json({
      success: true,
      message: 'Treatment plan created successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

// Export all functions
module.exports = {
  registerTherapist,
  getTherapist,
  updateProfile,
  getMyProfile,
  searchTherapists,
  updateAvailability,
  getAssignedTreatmentPlans,
  updateTreatmentProgress,
  getTherapistStats,
  createTreatmentPlan
};
