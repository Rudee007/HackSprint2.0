const Doctor = require('../models/Doctor');
const User = require('../models/User');
const logger = require('../config/logger');
const mongoose = require('mongoose');
const TreatmentPlan = require('../models/TreatmentPlan'); // ✅ Add this line
// At the top of your doctor.service.js

class DoctorService {
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 1. DOCTOR REGISTRATION & PROFILE MANAGEMENT
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Register a new doctor profile
   */
  async registerDoctor(userId, doctorData) {
    try {
      // Check if user exists and is a doctor
      const user = await User.findById(userId);
      if (!user || user.role !== 'doctor') {
        throw new Error('User must have doctor role to create doctor profile');
      }

      // Prevent duplicate doctor profile
      const existing = await Doctor.findOne({ userId });
      if (existing) {
        throw new Error('Doctor profile already exists for this user');
      }

      const doctor = new Doctor({
        userId,
        ...doctorData
      });

      await doctor.save();
      logger.info(`Doctor registered: ${doctor._id}`, { userId });
      
      return doctor;
      
    } catch (error) {
      logger.error('Register doctor error:', error);
      throw error;
    }
  }

  /**
   * Get doctor profile with populated data
   */
  async getDoctorProfile(doctorId) {
    try {
      const doctor = await Doctor.findById(doctorId)
        .populate('userId', 'name email phone location address');
      
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      return doctor;
      
    } catch (error) {
      logger.error('Get doctor profile error:', error);
      throw error;
    }
  }

  /**
   * Get doctor by user ID
   */
  async getDoctorByUserId(userId) {
    try {
      const doctor = await Doctor.findOne({ userId })
        .populate('userId', 'name email phone location');
      
      return doctor;
      
    } catch (error) {
      logger.error('Get doctor by user ID error:', error);
      throw error;
    }
  }

  /**
   * Update doctor profile
   */
  // Update your doctor.service.js updateDoctorProfile method
  async updateDoctorProfile(doctorId, updateData) {
    try {
      console.log('=== SERVICE LAYER DEBUG ===');
      console.log('Doctor ID:', doctorId);
      console.log('Update Data Received:', JSON.stringify(updateData, null, 2));
  
      // 🛡️ TRIPLE CHECK: Remove verificationStatus
      if (updateData.verificationStatus) {
        console.log('❌ STILL FOUND verificationStatus in service - REMOVING');
        delete updateData.verificationStatus;
      }
  
      // 🛡️ Remove any field that starts with 'verification'
      Object.keys(updateData).forEach(key => {
        if (key.toLowerCase().includes('verification')) {
          console.log(`🗑️ REMOVING verification-related field: ${key}`);
          delete updateData[key];
        }
      });
  
      console.log('Final Update Data:', JSON.stringify(updateData, null, 2));
  
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) throw new Error('Doctor not found');
  
      // Safe merge that NEVER touches verificationStatus
      Object.keys(updateData).forEach((key) => {
        if (key === 'verificationStatus') {
          console.log('🔒 SKIPPING verificationStatus field entirely');
          return;
        }
        
        if (typeof updateData[key] === 'object' && !Array.isArray(updateData[key]) && updateData[key] !== null) {
          const existingValue = doctor[key];
          let currentValue = {};
          
          if (existingValue) {
            if (typeof existingValue.toObject === 'function') {
              currentValue = existingValue.toObject();
            } else if (typeof existingValue === 'object') {
              currentValue = { ...existingValue };
            }
          }
          
          doctor[key] = { ...currentValue, ...updateData[key] };
        } else {
          doctor[key] = updateData[key];
        }
      });
  
      console.log('About to save doctor with verification status:', doctor.verificationStatus?.status);
      console.log('=== END SERVICE DEBUG ===');
      
      await doctor.save();
      await doctor.populate('userId', 'name email phone location');
      return doctor;
    } catch (err) {
      console.error('❌ SERVICE ERROR:', err);
      throw err;
    }
  }
    
  /**
   * ═══════════════════════════════════════════════════════════
   * 2. CONSULTATION MANAGEMENT
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Get doctor's consultation history
   */
  async getDoctorConsultations(req, options = {}) {
    try {
      // ✅ Extract user ID from authentication token
      const userId = req.user._id; // This is the doctor's User ID from token
      
      const { page = 1, limit = 20, status, startDate, endDate } = options;
      
      const Consultation = mongoose.model('Consultation');
      
      // ✅ Use userId from token as providerId in query
      let query = { providerId: userId };
      
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      const consultations = await Consultation.find(query)
        .populate('patientId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
  
      const total = await Consultation.countDocuments(query);
  
      return {
        consultations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
    } catch (error) {
      logger.error('Get doctor consultations error:', error);
      throw error;
    }
  }
  
  /**
   * Book consultation with doctor
   */
  async bookConsultation(consultationData) {
    try {
      const { doctorId, patientId, type, scheduledFor, notes } = consultationData;
      
      // Validate doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Check if doctor is active
      if (!doctor.isActive) {
        throw new Error('Doctor is currently inactive');
      }

      // Create consultation record
      const Consultation = mongoose.model('Consultation');
      const consultation = new Consultation({
        doctorId,
        patientId,
        type,
        scheduledFor: new Date(scheduledFor),
        status: 'scheduled',
        fees: doctor.consultationSettings?.fees?.[`${type}Consultation`] || 0,
        notes
      });

      await consultation.save();
      
      logger.info(`Consultation booked: ${consultation._id}`, { doctorId, patientId });
      
      return consultation;
      
    } catch (error) {
      logger.error('Book consultation error:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 3. AVAILABILITY & SCHEDULING
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Update doctor availability
   */
  async updateAvailability(doctorId, availabilityData) {
    try {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Ensure consultationSettings exists
      if (!doctor.consultationSettings) {
        doctor.consultationSettings = {};
      }

      doctor.consultationSettings.availability = {
        ...doctor.consultationSettings.availability,
        ...availabilityData
      };

      await doctor.save();
      
      logger.info(`Doctor availability updated: ${doctorId}`);
      
      return doctor.consultationSettings.availability;
      
    } catch (error) {
      logger.error('Update availability error:', error);
      throw error;
    }
  }

  /**
   * Get doctor's available time slots for a date
   */
  async getAvailableSlots(doctorId, date) {
    try {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      if (!doctor.consultationSettings?.availability) {
        return [];
      }

      const requestedDate = new Date(date);
      const dayOfWeek = requestedDate.toLocaleDateString('en', {weekday: 'long'}).toLowerCase();
      
      // Check if doctor works on this day
      const workingDays = doctor.consultationSettings.availability.workingDays || [];
      if (!workingDays.includes(dayOfWeek)) {
        return [];
      }

      // Get working hours
      const workingHours = doctor.consultationSettings.availability.workingHours;
      if (!workingHours?.start || !workingHours?.end) {
        return [];
      }

      const duration = doctor.consultationSettings.availability.consultationDuration || 30;
      
      // Generate time slots
      const slots = this.generateTimeSlots(workingHours.start, workingHours.end, duration);
      
      // Filter out booked slots
      const Consultation = mongoose.model('Consultation');
      const startOfDay = new Date(requestedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(requestedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const bookedSlots = await Consultation.find({
        doctorId,
        scheduledFor: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: { $in: ['scheduled', 'in_progress'] }
      }).select('scheduledFor');

      const bookedTimes = bookedSlots.map(slot => 
        slot.scheduledFor.toTimeString().slice(0, 5)
      );

      const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));
      
      return availableSlots;
      
    } catch (error) {
      logger.error('Get available slots error:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 4. DOCTOR SEARCH & DISCOVERY
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Find doctors by specialization
   */
  async findDoctorsBySpecialization(specialization, options = {}) {
    try {
      const { limit = 10, page = 1, sortBy = 'createdAt' } = options;
      
      const query = {
        specializations: specialization,
        isActive: true,
        'verificationStatus.status': 'approved'
      };

      const sortOptions = {};
      if (sortBy === 'experience') {
        sortOptions['experience.totalYears'] = -1;
      } else {
        sortOptions[sortBy] = -1;
      }

      const doctors = await Doctor.find(query)
        .populate('userId', 'name email phone location')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Doctor.countDocuments(query);

      return {
        doctors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
    } catch (error) {
      logger.error('Find doctors by specialization error:', error);
      throw error;
    }
  }

  /**
   * Search doctors by multiple criteria
   */
  async searchDoctors(searchCriteria) {
    try {
      const { 
        specializations, 
        experience, 
        languages, 
        consultationType,
        maxFee,
        page = 1, 
        limit = 10 
      } = searchCriteria;

      let query = {
        isActive: true,
        'verificationStatus.status': 'approved'
      };

      // Add search filters
      if (specializations && specializations.length > 0) {
        query.specializations = { $in: specializations };
      }

      if (experience) {
        query['experience.totalYears'] = { $gte: experience };
      }

      if (languages && languages.length > 0) {
        query['consultationSettings.preferences.languages'] = { $in: languages };
      }

      if (consultationType && maxFee) {
        query[`consultationSettings.fees.${consultationType}Consultation`] = { $lte: maxFee };
      }

      const doctors = await Doctor.find(query)
        .populate('userId', 'name email phone location')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Doctor.countDocuments(query);

      return {
        doctors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
    } catch (error) {
      logger.error('Search doctors error:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 5. VERIFICATION & STATUS MANAGEMENT
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Update doctor verification status
   */
  async updateVerificationStatus(doctorId, status, notes = '') {
    try {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      doctor.verificationStatus.status = status;
      
      if (status === 'approved') {
        doctor.verificationStatus.profileReviewed = true;
        doctor.verificationStatus.documentsVerified = true;
      }

      await doctor.save();
      
      logger.info(`Doctor verification status updated: ${doctorId} -> ${status}`);
      
      return doctor;
      
    } catch (error) {
      logger.error('Update verification status error:', error);
      throw error;
    }
  }

  /**
   * Get doctors pending verification
   */
  async getPendingVerifications() {
    try {
      const doctors = await Doctor.find({
        'verificationStatus.status': { $in: ['pending', 'under_review'] }
      })
      .populate('userId', 'name email phone')
      .sort({ createdAt: 1 });

      return doctors;
      
    } catch (error) {
      logger.error('Get pending verifications error:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 6. ANALYTICS & REPORTING
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Get doctor statistics
   */
  async getDoctorStats(doctorId, period = '30d') {
    try {
      const startDate = this.getDateFromPeriod(period);
      
      const Consultation = mongoose.model('Consultation');
      
      const consultationStats = await Consultation.aggregate([
        {
          $match: {
            doctorId: new mongoose.Types.ObjectId(doctorId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalConsultations: { $sum: 1 },
            completedConsultations: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            cancelledConsultations: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
            totalRevenue: { $sum: '$fees' }
          }
        }
      ]);

      const stats = consultationStats[0] || {
        totalConsultations: 0,
        completedConsultations: 0,
        cancelledConsultations: 0,
        totalRevenue: 0
      };

      const completionRate = stats.totalConsultations > 0 
        ? (stats.completedConsultations / stats.totalConsultations) * 100 
        : 0;

      return {
        period,
        ...stats,
        completionRate: Math.round(completionRate)
      };
      
    } catch (error) {
      logger.error('Get doctor stats error:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 7. HELPER METHODS
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Generate time slots for availability
   */
  generateTimeSlots(startTime, endTime, duration) {
    const slots = [];
    let current = this.timeStringToMinutes(startTime);
    const end = this.timeStringToMinutes(endTime);
    
    while (current + duration <= end) {
      slots.push(this.minutesToTimeString(current));
      current += duration;
    }
    
    return slots;
  }

  /**
   * Convert time string to minutes
   */
  timeStringToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes to time string
   */
  minutesToTimeString(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get date from period string
   */
  getDateFromPeriod(period) {
    const now = new Date();
    const days = parseInt(period.replace('d', '')) || 30;
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  }


  // Add these methods to your existing DoctorService class (around line 613)

/**
 * ═══════════════════════════════════════════════════════════
 * 8. TREATMENT PLAN MANAGEMENT  
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Create treatment plan with notifications
 */

async createTreatmentPlan(treatmentData) {
  try {
    const {
      doctorId,
      patientId,
      consultationId,
      treatmentType,
      treatmentPlan,
      duration,
      scheduledDate,
      scheduledTime,
      preInstructions,
      postInstructions,
      notes
    } = treatmentData;

    // Validate doctor exists
     const doctor = await User.findById(doctorId);
    if(!doctorId){
      throw new Error('ee laudee doctor id dee');
    }
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Validate patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Create scheduled datetime
    let scheduledFor = null;
    if (scheduledDate && scheduledTime) {
      scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
    }

    // Create treatment plan document
    const TreatmentPlan = mongoose.model('TreatmentPlan');
    const newTreatmentPlan = new TreatmentPlan({
      doctorId,
      patientId,
      consultationId,
      treatmentType,
      treatmentPlan,
      duration,
      scheduledFor,
      preInstructions,
      postInstructions,
      notes,
      status: 'active'
    });

    await newTreatmentPlan.save();
    logger.info(`Treatment plan created: ${newTreatmentPlan._id}`, { doctorId, patientId });

    // Track notification results
    const notificationResults = {
      preInstructionsSent: false,
      postInstructionsSent: false,
      errors: []
    };

    // Send pre-treatment notifications if enabled
    if (preInstructions && preInstructions.trim()) {
      try {
        const NotificationService = require('./notification.service');
        await NotificationService.sendPreTherapyInstructions({
          patientEmail: patient.email,
          patientName: patient.name,
          therapyType: treatmentType,
          scheduledAt: scheduledFor
        });
        notificationResults.preInstructionsSent = true;
        logger.info(`Pre-therapy instructions sent for plan: ${newTreatmentPlan._id}`);
      } catch (notifyError) {
        logger.error('Failed to send pre-therapy instructions:', notifyError);
        notificationResults.errors.push('Failed to send pre-therapy instructions');
      }
    }

    // Send post-treatment notifications if enabled  
    if (postInstructions && postInstructions.trim()) {
      try {
        const NotificationService = require('./notification.service');
        await NotificationService.sendPostTherapyCare({
          patientEmail: patient.email,
          patientName: patient.name,
          therapyType: treatmentType
        });
        notificationResults.postInstructionsSent = true;
        logger.info(`Post-therapy instructions sent for plan: ${newTreatmentPlan._id}`);
      } catch (notifyError) {
        logger.error('Failed to send post-therapy care instructions:', notifyError);
        notificationResults.errors.push('Failed to send post-therapy care instructions');
      }
    }

    return {
      treatmentPlan: newTreatmentPlan,
      notifications: notificationResults
    };

  } catch (error) {
    logger.error('Create treatment plan error:', error);
    throw error;
  }
}

/**
 * Get doctor's treatment plans
 */
async getDoctorTreatmentPlans(doctorId, options = {}) {
  try {
    const { page = 1, limit = 20, status, patientId } = options;
    
    const TreatmentPlan = mongoose.model('TreatmentPlan');
    
    let query = { doctorId };
    if (status) query.status = status;
    if (patientId) query.patientId = patientId;
    
    const treatmentPlans = await TreatmentPlan.find(query)
      .populate('patientId', 'name email phone')
      .populate('consultationId', 'type scheduledFor')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await TreatmentPlan.countDocuments(query);

    return {
      treatmentPlans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
  } catch (error) {
    logger.error('Get doctor treatment plans error:', error);
    throw error;
  }
}

/**
 * Update treatment plan
 */
async updateTreatmentPlan(treatmentPlanId, doctorId, updateData) {
  try {
    const TreatmentPlan = mongoose.model('TreatmentPlan');
    
    const treatmentPlan = await TreatmentPlan.findOne({ 
      _id: treatmentPlanId, 
      doctorId 
    });

    if (!treatmentPlan) {
      throw new Error('Treatment plan not found or unauthorized');
    }

    // Update allowed fields only
    const allowedUpdates = [
      'treatmentPlan', 'duration', 'scheduledFor', 
      'preInstructions', 'postInstructions', 'notes', 'status'
    ];

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        treatmentPlan[field] = updateData[field];
      }
    });

    treatmentPlan.updatedAt = new Date();
    await treatmentPlan.save();

    logger.info(`Treatment plan updated: ${treatmentPlanId}`, { doctorId });
    
    return treatmentPlan;
    
  } catch (error) {
    logger.error('Update treatment plan error:', error);
    throw error;
  }
}

/**
 * Get treatment plan details
 */
async getTreatmentPlanDetails(treatmentPlanId, doctorId) {
  try {
    const TreatmentPlan = mongoose.model('TreatmentPlan');
    
    const treatmentPlan = await TreatmentPlan.findOne({ 
      _id: treatmentPlanId, 
      doctorId 
    })
    .populate('patientId', 'name email phone dateOfBirth gender')
    .populate('consultationId', 'type scheduledFor status notes')
    .populate('doctorId', 'userId');

    if (!treatmentPlan) {
      throw new Error('Treatment plan not found or unauthorized');
    }

    return treatmentPlan;
    
  } catch (error) {
    logger.error('Get treatment plan details error:', error);
    throw error;
  }
}

/**
 * Delete treatment plan (soft delete)
 */
async deleteTreatmentPlan(treatmentPlanId, doctorId) {
  try {
    const TreatmentPlan = mongoose.model('TreatmentPlan');
    
    const treatmentPlan = await TreatmentPlan.findOne({ 
      _id: treatmentPlanId, 
      doctorId 
    });

    if (!treatmentPlan) {
      throw new Error('Treatment plan not found or unauthorized');
    }

    // Soft delete by setting status
    treatmentPlan.status = 'deleted';
    treatmentPlan.deletedAt = new Date();
    await treatmentPlan.save();

    logger.info(`Treatment plan deleted: ${treatmentPlanId}`, { doctorId });
    
    return { success: true, message: 'Treatment plan deleted successfully' };
    
  } catch (error) {
    logger.error('Delete treatment plan error:', error);
    throw error;
  }
}

// Add this method to your existing helper methods section
/**
 * Add patient (existing method, ensure it exists)
 */
async addPatient(doctorId, patientData) {
  try {
    const { name, email, phone, dateOfBirth, gender, medicalHistory, allergies, symptoms } = patientData;

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    // Create user account for patient
    const user = new User({
      name,
      email: email || `${phone}@temp.com`, // Use phone as fallback email
      phone,
      password: tempPassword, // You should hash this
      role: 'patient',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender,
      isEmailVerified: false,
      medicalHistory,
      allergies,
      symptoms
    });

    await user.save();
    logger.info(`Patient added by doctor: ${doctorId}`, { patientId: user._id });

    return {
      patient: user,
      tempPassword
    };

  } catch (error) {
    logger.error('Add patient error:', error);
    throw error;
  }
}



  
}

module.exports = new DoctorService();
