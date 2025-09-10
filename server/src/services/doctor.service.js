const Doctor = require('../models/Doctor');
const User = require('../models/User');
const TherapyCenter = require('../models/TherapyCenter');
const logger = require('../config/logger');
const mongoose = require('mongoose');

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
      // Validate that user exists and has doctor role
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.role !== 'doctor') {
        throw new Error('User must have doctor role to create doctor profile');
      }

      // Check if doctor profile already exists
      const existingDoctor = await Doctor.findOne({ userId });
      if (existingDoctor) {
        throw new Error('Doctor profile already exists for this user');
      }

      // Create doctor profile
      const doctor = new Doctor({
        userId,
        ...doctorData,
        verificationStatus: {
          status: 'pending',
          documentsUploaded: !!doctorData.qualifications
        }
      });

      await doctor.save();
      
      // Populate user data
      await doctor.populate('userId', 'name email phone location');
      
      logger.info(`Doctor profile created for user ${userId}`, { doctorId: doctor._id });
      
      return doctor;
      
    } catch (error) {
      logger.error('Doctor registration error:', error);
      throw error;
    }
  }

  /**
   * Get doctor profile with populated data
   */
  async getDoctorProfile(doctorId) {
    try {
      const doctor = await Doctor.findById(doctorId)
        .populate('userId', 'name email phone location address')
        .populate('associatedCenters.centerId', 'name location contact');
      
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
        .populate('userId', 'name email phone location')
        .populate('associatedCenters.centerId', 'name location');
      
      return doctor;
      
    } catch (error) {
      logger.error('Get doctor by user ID error:', error);
      throw error;
    }
  }

  /**
   * Update doctor profile
   */
  async updateDoctorProfile(doctorId, updateData) {
    try {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Handle nested object updates
      Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'object' && !Array.isArray(updateData[key])) {
          doctor[key] = { ...doctor[key]?.toObject(), ...updateData[key] };
        } else {
          doctor[key] = updateData[key];
        }
      });

      await doctor.save();
      await doctor.populate('userId', 'name email phone location');
      
      logger.info(`Doctor profile updated: ${doctorId}`);
      
      return doctor;
      
    } catch (error) {
      logger.error('Update doctor profile error:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 2. CONSULTATION MANAGEMENT
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Get doctor's patient list
   */
  async getDoctorPatients(doctorId, options = {}) {
    try {
      const { page = 1, limit = 20, status, search } = options;
      
      // First find consultations for this doctor
      const Consultation = mongoose.model('Consultation');
      
      let query = { doctorId };
      if (status) query.status = status;
      
      const consultations = await Consultation.find(query)
        .populate('patientId', 'name email phone profile.dateOfBirth profile.gender')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      // Extract unique patients
      const patientsMap = new Map();
      consultations.forEach(consultation => {
        const patient = consultation.patientId;
        if (patient && !patientsMap.has(patient._id.toString())) {
          patientsMap.set(patient._id.toString(), {
            ...patient.toObject(),
            lastConsultation: consultation.createdAt,
            consultationStatus: consultation.status
          });
        }
      });

      const patients = Array.from(patientsMap.values());
      
      // Apply search filter if provided
      const filteredPatients = search 
        ? patients.filter(patient => 
            patient.name.toLowerCase().includes(search.toLowerCase()) ||
            patient.email.toLowerCase().includes(search.toLowerCase())
          )
        : patients;

      return {
        patients: filteredPatients,
        pagination: {
          page,
          limit,
          total: filteredPatients.length
        }
      };
      
    } catch (error) {
      logger.error('Get doctor patients error:', error);
      throw error;
    }
  }

  /**
   * Book consultation with doctor
   */
  async bookConsultation(consultationData) {
    try {
      const { doctorId, patientId, type, scheduledFor, notes } = consultationData;
      
      // Validate doctor exists and is available
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      if (!doctor.isAvailableForConsultation(new Date(scheduledFor))) {
        throw new Error('Doctor is not available at the requested time');
      }

      // Create consultation record
      const Consultation = mongoose.model('Consultation');
      const consultation = new Consultation({
        doctorId,
        patientId,
        type, // 'video', 'in_person', 'follow_up'
        scheduledFor: new Date(scheduledFor),
        status: 'scheduled',
        fees: doctor.consultationSettings.fees[`${type}Consultation`],
        notes,
        aiAnalysis: consultationData.aiAnalysis // If AI recommendations available
      });

      await consultation.save();
      
      // Update doctor metrics
      await this.updateDoctorMetrics(doctorId, { totalConsultations: 1 });
      
      logger.info(`Consultation booked: ${consultation._id}`, { doctorId, patientId });
      
      return consultation;
      
    } catch (error) {
      logger.error('Book consultation error:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 3. TREATMENT PLAN CREATION & APPROVAL
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Create treatment plan
   */
  async createTreatmentPlan(planData) {
    try {
      const { doctorId, patientId, consultationId, treatments, aiRecommendations } = planData;
      
      const TreatmentPlan = mongoose.model('TreatmentPlan');
      
      const treatmentPlan = new TreatmentPlan({
        doctorId,
        patientId,
        consultationId,
        treatments: treatments.map(treatment => ({
          ...treatment,
          approvedBy: doctorId,
          approvedAt: new Date()
        })),
        aiRecommendations,
        status: 'approved', // Doctor created = auto approved
        totalSessions: treatments.reduce((sum, t) => sum + (t.sessions || 1), 0),
        estimatedDuration: this.calculateTreatmentDuration(treatments),
        notes: planData.notes
      });

      await treatmentPlan.save();
      
      logger.info(`Treatment plan created: ${treatmentPlan._id}`, { doctorId, patientId });
      
      return treatmentPlan;
      
    } catch (error) {
      logger.error('Create treatment plan error:', error);
      throw error;
    }
  }

  /**
   * Validate and approve AI-generated treatment plan
   */
  async validateAITreatmentPlan(doctorId, planId, validation) {
    try {
      const { approved, modifications, notes } = validation;
      
      const TreatmentPlan = mongoose.model('TreatmentPlan');
      const plan = await TreatmentPlan.findById(planId);
      
      if (!plan) {
        throw new Error('Treatment plan not found');
      }

      if (approved) {
        plan.status = 'approved';
        plan.approvedBy = doctorId;
        plan.approvedAt = new Date();
        
        if (modifications) {
          plan.treatments = modifications;
          plan.modifiedBy = doctorId;
          plan.modifiedAt = new Date();
        }
      } else {
        plan.status = 'rejected';
        plan.rejectedBy = doctorId;
        plan.rejectedAt = new Date();
      }
      
      plan.doctorNotes = notes;
      await plan.save();
      
      logger.info(`Treatment plan ${approved ? 'approved' : 'rejected'}: ${planId}`, { doctorId });
      
      return plan;
      
    } catch (error) {
      logger.error('Validate treatment plan error:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 4. AVAILABILITY & SCHEDULING
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

      const requestedDate = new Date(date);
      const dayOfWeek = requestedDate.toLocaleDateString('en', {weekday: 'long'}).toLowerCase();
      
      // Check if doctor works on this day
      if (!doctor.consultationSettings.availability.workingDays.includes(dayOfWeek)) {
        return [];
      }

      // Get working hours
      const { start, end } = doctor.consultationSettings.availability.workingHours;
      const duration = doctor.consultationSettings.availability.consultationDuration;
      
      // Generate time slots
      const slots = this.generateTimeSlots(start, end, duration);
      
      // Filter out booked slots
      const Consultation = mongoose.model('Consultation');
      const bookedSlots = await Consultation.find({
        doctorId,
        scheduledFor: {
          $gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
          $lt: new Date(requestedDate.setHours(23, 59, 59, 999))
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
   * 5. DOCTOR SEARCH & DISCOVERY
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Find doctors by specialization
   */async findDoctorsBySpecialization(specialization, options = {}) {
  try {
    const { location, maxDistance = 50000, limit = 10, sortBy = 'rating' } = options;
    
    let doctors;
    
    if (location && location.coordinates) {
      // 🔥 Use aggregation-based location search
      doctors = await Doctor.findNearby(location.coordinates, maxDistance, {
        limit,
        specialization,
        sortBy
      });
    } else {
      // Non-location based search
      doctors = await Doctor.findBySpecialization(specialization, { 
        limit, 
        sortBy: sortBy === 'rating' ? { 'metrics.averageRating': -1 } : { createdAt: -1 }
      });
    }

    return doctors;
    
  } catch (error) {
    logger.error('Find doctors by specialization error:', error);
    throw error;
  }
}


  /**
   * Get recommended doctors for AI analysis
   */
  async getRecommendedDoctors(aiAnalysis, patientLocation) {
    try {
      const { primaryDosha, recommendedTreatments, severityLevel } = aiAnalysis;
      
      // Map dosha to specialization
      const specializationMap = {
        'vata': 'Vata Disorders',
        'pitta': 'Pitta Disorders', 
        'kapha': 'Kapha Disorders'
      };
      
      const primarySpecialization = specializationMap[primaryDosha.toLowerCase()] || 'Panchakarma';
      
      // Find doctors with relevant specialization
      const doctors = await this.findDoctorsBySpecialization(primarySpecialization, {
        location: patientLocation,
        limit: 5
      });

      // Score doctors based on AI analysis
      const scoredDoctors = doctors.map(doctor => ({
        ...doctor,
        matchScore: this.calculateDoctorMatchScore(doctor, aiAnalysis),
        estimatedFee: doctor.consultationSettings?.fees?.videoConsultation || 0
      }));

      // Sort by match score
      scoredDoctors.sort((a, b) => b.matchScore - a.matchScore);
      
      return scoredDoctors.slice(0, 5);
      
    } catch (error) {
      logger.error('Get recommended doctors error:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 6. ANALYTICS & REPORTING
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Get doctor analytics
   */
  async getDoctorAnalytics(doctorId, period = '30d') {
    try {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      const startDate = this.getDateFromPeriod(period);
      
      const Consultation = mongoose.model('Consultation');
      
      // Get consultation statistics
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
            averageRating: { $avg: '$rating' },
            totalRevenue: { $sum: '$fees' }
          }
        }
      ]);

      const stats = consultationStats[0] || {
        totalConsultations: 0,
        completedConsultations: 0,
        cancelledConsultations: 0,
        averageRating: 0,
        totalRevenue: 0
      };

      return {
        period,
        consultations: stats,
        metrics: doctor.metrics,
        verificationStatus: doctor.verificationStatus,
        performanceScore: this.calculatePerformanceScore(stats)
      };
      
    } catch (error) {
      logger.error('Get doctor analytics error:', error);
      throw error;
    }
  }

  /**
   * Update doctor metrics
   */
  async updateDoctorMetrics(doctorId, updates) {
    try {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      Object.keys(updates).forEach(key => {
        if (typeof updates[key] === 'number') {
          doctor.metrics[key] = (doctor.metrics[key] || 0) + updates[key];
        } else {
          doctor.metrics[key] = updates[key];
        }
      });

      await doctor.save();
      
      return doctor.metrics;
      
    } catch (error) {
      logger.error('Update doctor metrics error:', error);
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
   * Calculate treatment duration
   */
  calculateTreatmentDuration(treatments) {
    return treatments.reduce((total, treatment) => {
      const sessionDuration = treatment.sessionDuration || 60; // default 60 minutes
      const sessions = treatment.sessions || 1;
      return total + (sessionDuration * sessions);
    }, 0);
  }

  /**
   * Calculate doctor match score for AI recommendations
   */
  calculateDoctorMatchScore(doctor, aiAnalysis) {
    let score = 0;
    
    // Base score from rating
    score += doctor.metrics.averageRating * 20;
    
    // Experience bonus
    score += Math.min(doctor.experience.totalYears * 2, 20);
    
    // Specialization match
    if (doctor.specializations.some(spec => 
        aiAnalysis.recommendedTreatments.includes(spec)
    )) {
      score += 30;
    }
    
    // Panchakarma expertise bonus
    if (doctor.panchakarmaExpertise.length > 0) {
      score += 15;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(stats) {
    const completionRate = stats.totalConsultations > 0 
      ? (stats.completedConsultations / stats.totalConsultations) * 100 
      : 0;
    
    const cancellationRate = stats.totalConsultations > 0
      ? (stats.cancelledConsultations / stats.totalConsultations) * 100
      : 0;
    
    return {
      completionRate: Math.round(completionRate),
      cancellationRate: Math.round(cancellationRate),
      averageRating: stats.averageRating || 0,
      overallScore: Math.round((completionRate + (stats.averageRating * 20) - cancellationRate) / 2)
    };
  }

  /**
   * Get date from period string
   */
  getDateFromPeriod(period) {
    const now = new Date();
    const days = parseInt(period.replace('d', '')) || 30;
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  }
}

module.exports = new DoctorService();
