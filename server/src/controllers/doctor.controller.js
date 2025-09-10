const doctorService = require('../services/doctor.service');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

class DoctorController {

  /**
   * ═══════════════════════════════════════════════════════════
   * 1. DOCTOR PROFILE MANAGEMENT
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Register new doctor profile
   * POST /api/doctors/register
   */

  async registerDoctor(req, res, next) {
    try {
      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          },
          timestamp: new Date().toISOString()
        });
      }

      const userId = req.user.id; // From auth middleware
      const doctorData = req.body;

      const doctor = await doctorService.registerDoctor(userId, doctorData);

      logger.info('Doctor registered successfully', { 
        userId, 
        doctorId: doctor._id 
      });

      res.status(201).json({
        success: true,
        message: 'Doctor profile created successfully. Verification pending.',
        data: {
          doctor: {
            id: doctor._id,
            userId: doctor.userId,
            verificationStatus: doctor.verificationStatus,
            verificationProgress: doctor.verificationProgress
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Register doctor error:', error);
      next(error);
    }
  }

  /**
   * Get doctor profile
   * GET /api/doctors/profile
   */
  async getDoctorProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const doctor = await doctorService.getDoctorByUserId(userId);

      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Doctor profile not found. Please complete registration.'
          },
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Doctor profile retrieved successfully',
        data: {
          doctor,
          calculatedExperience: doctor.calculatedExperience,
          specializationSummary: doctor.getSpecializationSummary()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get doctor profile error:', error);
      next(error);
    }
  }

  /**
   * Update doctor profile
   * PUT /api/doctors/profile
   */
  async updateDoctorProfile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: errors.array()
          },
          timestamp: new Date().toISOString()
        });
      }

      const userId = req.user.id;
      const updateData = req.body;

      // Get doctor by userId first
      const existingDoctor = await doctorService.getDoctorByUserId(userId);
      if (!existingDoctor) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Doctor profile not found'
          },
          timestamp: new Date().toISOString()
        });
      }

      const updatedDoctor = await doctorService.updateDoctorProfile(
        existingDoctor._id, 
        updateData
      );

      logger.info('Doctor profile updated', { 
        userId, 
        doctorId: updatedDoctor._id 
      });

      res.json({
        success: true,
        message: 'Doctor profile updated successfully',
        data: {
          doctor: updatedDoctor,
          verificationProgress: updatedDoctor.verificationProgress
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Update doctor profile error:', error);
      next(error);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 2. CONSULTATION MANAGEMENT
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Get doctor's patients
   * GET /api/doctors/patients
   */
  async getDoctorPatients(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status, search } = req.query;

      // Get doctor by userId
      const doctor = await doctorService.getDoctorByUserId(userId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Doctor profile not found'
          },
          timestamp: new Date().toISOString()
        });
      }

      const result = await doctorService.getDoctorPatients(doctor._id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search
      });

      res.json({
        success: true,
        message: 'Patients retrieved successfully',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get doctor patients error:', error);
      next(error);
    }
  }

  /**
   * Book consultation
   * POST /api/consultations/book
   */
  async bookConsultation(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid consultation data',
            details: errors.array()
          },
          timestamp: new Date().toISOString()
        });
      }

      const consultationData = {
        ...req.body,
        patientId: req.user.role === 'patient' ? req.user.id : req.body.patientId
      };

      const consultation = await doctorService.bookConsultation(consultationData);

      logger.info('Consultation booked', { 
        consultationId: consultation._id,
        doctorId: consultation.doctorId,
        patientId: consultation.patientId
      });

      res.status(201).json({
        success: true,
        message: 'Consultation booked successfully',
        data: {
          consultation: {
            id: consultation._id,
            doctorId: consultation.doctorId,
            patientId: consultation.patientId,
            type: consultation.type,
            scheduledFor: consultation.scheduledFor,
            fees: consultation.fees,
            status: consultation.status
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Book consultation error:', error);
      next(error);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 3. TREATMENT PLAN MANAGEMENT
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Create treatment plan
   * POST /api/treatment-plans/create
   */
  async createTreatmentPlan(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid treatment plan data',
            details: errors.array()
          },
          timestamp: new Date().toISOString()
        });
      }

      const userId = req.user.id;
      
      // Get doctor by userId
      const doctor = await doctorService.getDoctorByUserId(userId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Doctor profile not found'
          },
          timestamp: new Date().toISOString()
        });
      }

      const planData = {
        ...req.body,
        doctorId: doctor._id
      };

      const treatmentPlan = await doctorService.createTreatmentPlan(planData);

      logger.info('Treatment plan created', { 
        planId: treatmentPlan._id,
        doctorId: doctor._id,
        patientId: treatmentPlan.patientId
      });

      res.status(201).json({
        success: true,
        message: 'Treatment plan created successfully',
        data: {
          treatmentPlan: {
            id: treatmentPlan._id,
            patientId: treatmentPlan.patientId,
            treatments: treatmentPlan.treatments,
            totalSessions: treatmentPlan.totalSessions,
            estimatedDuration: treatmentPlan.estimatedDuration,
            status: treatmentPlan.status
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Create treatment plan error:', error);
      next(error);
    }
  }

  /**
   * Validate AI treatment plan
   * PUT /api/treatment-plans/:planId/validate
   */
  async validateTreatmentPlan(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid validation data',
            details: errors.array()
          },
          timestamp: new Date().toISOString()
        });
      }

      const { planId } = req.params;
      const userId = req.user.id;
      const validation = req.body; // { approved, modifications, notes }

      // Get doctor by userId
      const doctor = await doctorService.getDoctorByUserId(userId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Doctor profile not found'
          },
          timestamp: new Date().toISOString()
        });
      }

      const validatedPlan = await doctorService.validateAITreatmentPlan(
        doctor._id,
        planId,
        validation
      );

      logger.info(`Treatment plan ${validation.approved ? 'approved' : 'rejected'}`, { 
        planId,
        doctorId: doctor._id
      });

      res.json({
        success: true,
        message: `Treatment plan ${validation.approved ? 'approved' : 'rejected'} successfully`,
        data: {
          treatmentPlan: validatedPlan
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Validate treatment plan error:', error);
      next(error);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 4. AVAILABILITY MANAGEMENT
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Update doctor availability
   * PUT /api/doctors/availability
   */
  async updateAvailability(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid availability data',
            details: errors.array()
          },
          timestamp: new Date().toISOString()
        });
      }

      const userId = req.user.id;
      const availabilityData = req.body;

      // Get doctor by userId
      const doctor = await doctorService.getDoctorByUserId(userId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Doctor profile not found'
          },
          timestamp: new Date().toISOString()
        });
      }

      const updatedAvailability = await doctorService.updateAvailability(
        doctor._id,
        availabilityData
      );

      logger.info('Doctor availability updated', { 
        doctorId: doctor._id 
      });

      res.json({
        success: true,
        message: 'Availability updated successfully',
        data: {
          availability: updatedAvailability
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Update availability error:', error);
      next(error);
    }
  }

  /**
   * Get available time slots
   * GET /api/doctors/:doctorId/availability/:date
   */
  async getAvailableSlots(req, res, next) {
    try {
      const { doctorId, date } = req.params;

      const availableSlots = await doctorService.getAvailableSlots(doctorId, date);

      res.json({
        success: true,
        message: 'Available slots retrieved successfully',
        data: {
          date,
          availableSlots,
          totalSlots: availableSlots.length
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get available slots error:', error);
      next(error);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 5. DOCTOR SEARCH & RECOMMENDATIONS
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Search doctors by specialization
   * GET /api/doctors/search
   */
 // In src/controllers/doctor.controller.js - searchDoctors method
async searchDoctors(req, res, next) {
  try {
    const { 
      specialization, 
      latitude, 
      longitude, 
      maxDistance = 50000,
      limit = 10,
      sortBy = 'rating'
    } = req.query;

    if (!specialization) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Specialization parameter is required'
        },
        timestamp: new Date().toISOString()
      });
    }

    const location = latitude && longitude 
      ? { coordinates: [parseFloat(longitude), parseFloat(latitude)] }
      : null;

    const doctors = await doctorService.findDoctorsBySpecialization(
      specialization,
      {
        location,
        maxDistance: parseInt(maxDistance),
        limit: parseInt(limit),
        sortBy
      }
    );

    // Format response for aggregation results
    const formattedDoctors = doctors.map(doctor => ({
      id: doctor._id,
      name: doctor.user?.name || 'Unknown',
      specializations: doctor.specializations,
      experience: doctor.experience?.totalYears || 0,
      rating: doctor.metrics?.averageRating || 0,
      totalReviews: doctor.metrics?.totalReviews || 0,
      consultationFees: {
        video: doctor.consultationSettings?.fees?.videoConsultation || 0,
        inPerson: doctor.consultationSettings?.fees?.inPersonConsultation || 0
      },
      distance: doctor.distance ? (doctor.distance / 1000).toFixed(1) : null, // Convert to km
      location: doctor.user?.location || null
    }));

    res.json({
      success: true,
      message: 'Doctors found successfully',
      data: {
        doctors: formattedDoctors,
        searchCriteria: {
          specialization,
          location: location ? `${latitude}, ${longitude}` : 'Any',
          maxDistance: `${maxDistance / 1000} km`,
          sortBy
        },
        totalFound: formattedDoctors.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Search doctors error:', error);
    next(error);
  }
}

  /**
   * Get AI-recommended doctors
   * POST /api/doctors/recommend
   */
  async getRecommendedDoctors(req, res, next) {
    try {
      const { aiAnalysis, patientLocation } = req.body;

      if (!aiAnalysis) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_AI_ANALYSIS',
            message: 'AI analysis data is required for recommendations'
          },
          timestamp: new Date().toISOString()
        });
      }

      const recommendedDoctors = await doctorService.getRecommendedDoctors(
        aiAnalysis,
        patientLocation
      );

      res.json({
        success: true,
        message: 'Doctor recommendations generated successfully',
        data: {
          recommendedDoctors,
          aiAnalysis: {
            primaryDosha: aiAnalysis.primaryDosha,
            recommendedTreatments: aiAnalysis.recommendedTreatments
          },
          totalRecommendations: recommendedDoctors.length
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get recommended doctors error:', error);
      next(error);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 6. ANALYTICS & REPORTING
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Get doctor analytics
   * GET /api/doctors/analytics
   */
  async getDoctorAnalytics(req, res, next) {
    try {
      const userId = req.user.id;
      const { period = '30d' } = req.query;

      // Get doctor by userId
      const doctor = await doctorService.getDoctorByUserId(userId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Doctor profile not found'
          },
          timestamp: new Date().toISOString()
        });
      }

      const analytics = await doctorService.getDoctorAnalytics(doctor._id, period);

      res.json({
        success: true,
        message: 'Analytics retrieved successfully',
        data: analytics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get doctor analytics error:', error);
      next(error);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 7. ADMIN FUNCTIONS
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Approve doctor profile (Admin only)
   * PUT /api/doctors/:doctorId/approve
   */
  async approveDoctorProfile(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { approved, rejectionReason } = req.body;
      const adminId = req.user.id;

      const updateData = {
        'verificationStatus.status': approved ? 'approved' : 'rejected',
        'verificationStatus.approvedBy': adminId,
        'verificationStatus.approvedAt': new Date()
      };

      if (!approved && rejectionReason) {
        updateData['verificationStatus.rejectionReason'] = rejectionReason;
      }

      const updatedDoctor = await doctorService.updateDoctorProfile(
        doctorId,
        updateData
      );

      logger.info(`Doctor profile ${approved ? 'approved' : 'rejected'}`, { 
        doctorId,
        adminId
      });

      res.json({
        success: true,
        message: `Doctor profile ${approved ? 'approved' : 'rejected'} successfully`,
        data: {
          doctor: {
            id: updatedDoctor._id,
            verificationStatus: updatedDoctor.verificationStatus
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Approve doctor profile error:', error);
      next(error);
    }
  }
}

module.exports = new DoctorController();
