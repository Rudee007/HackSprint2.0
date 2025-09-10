const Therapist = require('../models/Therapist');
const User = require('../models/User');

async function createTherapist(data) {
  // Check if user exists and has appropriate role
  const user = await User.findById(data.userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check if therapist profile already exists
  const existingTherapist = await Therapist.findOne({ userId: data.userId });
  if (existingTherapist) {
    throw new Error('Therapist profile already exists for this user');
  }
  
  const therapist = new Therapist(data);
  return await therapist.save();
}

async function getTherapistById(id) {
  return await Therapist.findById(id)
    .populate('userId', 'name phone email location');
}

async function getTherapistByUserId(userId) {
  return await Therapist.findOne({ userId })
    .populate('userId', 'name phone email location');
}

async function updateTherapist(id, updateData) {
  updateData.updatedAt = new Date();
  return await Therapist.findByIdAndUpdate(id, updateData, { new: true });
}

async function searchTherapists(filters = {}) {
  const query = { isActive: true, verificationStatus: 'approved' };
  
  // Filter by therapy type
  if (filters.therapy) {
    query['certifications.therapy'] = filters.therapy;
  }
  
  // Filter by minimum experience
  if (filters.minExperience) {
    query.experienceYears = { $gte: filters.minExperience };
  }
  
  // Filter by minimum rating
  if (filters.minRating) {
    query['metrics.averageRating'] = { $gte: filters.minRating };
  }
  
  return await Therapist.find(query)
    .populate('userId', 'name phone location')
    .sort({ 'metrics.averageRating': -1, experienceYears: -1 });
}

async function updateAvailability(therapistId, availabilityData) {
  return await Therapist.findByIdAndUpdate(
    therapistId, 
    { 
      availability: availabilityData,
      updatedAt: new Date()
    }, 
    { new: true }
  );
}

async function deleteTherapist(id) {
  return await Therapist.findByIdAndDelete(id);
}

module.exports = {
  createTherapist,
  getTherapistById,
  getTherapistByUserId,
  updateTherapist,
  searchTherapists,
  updateAvailability,
  deleteTherapist
};
