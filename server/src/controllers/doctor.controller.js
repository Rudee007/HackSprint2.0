const doctorService = require('../services/doctor.service');
const NotificationService = require('../services/notification.service');
const { validationResult } = require('express-validator');
const TreatmentPlan = require('../models/TreatmentPlan'); // ✅ Add this line
const logger = require('../config/logger');
const User = require('../models/User'); // ← ADD THIS LINE
const bcrypt = require('bcryptjs'); // ← You'll also need this for password hashing
const mongoose = require('mongoose');
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
      console.log('🟢 Doctor registration started');
      console.log('🟢 User:', req.user.email, '| Role:', req.user.role, '| ID:', req.user._id);
      
      // Validate request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data provided',
            details: errors.array()
          },
          timestamp: new Date().toISOString()
        });
      }
  
      // Check user role
      if (req.user.role !== 'doctor') {
        console.log('❌ Access denied - user role:', req.user.role);
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only users with doctor role can register doctor profiles'
          },
          timestamp: new Date().toISOString()
        });
      }
  
      const userId = req.user._id.toString(); // Convert ObjectId to string
      const doctorData = req.body;
  
      console.log('🟢 Processing doctor registration for userId:', userId);
      console.log('🟢 Doctor data keys:', Object.keys(doctorData));
  
      // Call service to register doctor
      const doctor = await doctorService.registerDoctor(userId, doctorData);
  
      console.log('✅ Doctor registered successfully:', doctor._id);
      logger.info('Doctor registered successfully', { 
        userId, 
        doctorId: doctor._id,
        userEmail: req.user.email 
      });
  
      res.status(201).json({
        success: true,
        message: 'Doctor profile created successfully. Verification pending.',
        data: {
          doctor: {
            id: doctor._id,
            userId: doctor.userId,
            verificationStatus: doctor.verificationStatus?.status || 'pending',
            isActive: doctor.isActive || false,
            specializations: doctor.specializations,
            experience: doctor.experience
          }
        },
        timestamp: new Date().toISOString()
      });
  
    } catch (error) {
      console.error('❌ Registration error:', error.message);
      logger.error('Doctor registration error:', {
        error: error.message,
        userId: req.user?._id,
        userEmail: req.user?.email
      });
  
      // Handle specific errors
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_PROFILE',
            message: 'Doctor profile already exists for this user'
          },
          timestamp: new Date().toISOString()
        });
      }
  
      if (error.message.includes('doctor role')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'User must have doctor role to create doctor profile'
          },
          timestamp: new Date().toISOString()
        });
      }
  
      next(error);
    }
  };
  

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
          doctor
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
// In: server/src/controllers/doctor.controller.js
async updateDoctorProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid update data', details: errors.array() },
        timestamp: new Date().toISOString()
      });
    }

    const userId = req.user.id;
    let updateData = req.body;

    // 🔍 COMPREHENSIVE LOGGING
    console.log('=== UPDATE PROFILE DEBUG ===');
    console.log('User ID:', userId);
    console.log('User Role:', req.user.role);
    console.log('Original Request Body:', JSON.stringify(updateData, null, 2));
    
    if (updateData.verificationStatus) {
      console.log('❌ FOUND verificationStatus in request:', updateData.verificationStatus);
      console.log('❌ verificationStatus.status type:', typeof updateData.verificationStatus.status);
      console.log('❌ verificationStatus.status value:', updateData.verificationStatus.status);
    }

    // 🛡️ NUCLEAR OPTION: Always remove verificationStatus
    if (updateData.verificationStatus) {
      console.log('🗑️ REMOVING verificationStatus from request');
      delete updateData.verificationStatus;
    }

    // 🛡️ Remove ALL system-managed fields
    const protectedFields = ['_id', 'userId', 'createdAt', 'updatedAt', '__v', 'metrics', 'verificationStatus'];
    protectedFields.forEach(field => {
      if (updateData[field]) {
        console.log(`🗑️ REMOVING protected field: ${field}`);
        delete updateData[field];
      }
    });

    console.log('Sanitized Request Body:', JSON.stringify(updateData, null, 2));
    console.log('=== END DEBUG ===');

    // Rest of your existing logic...
    const existingDoctor = await doctorService.getDoctorByUserId(userId);
    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found' },
        timestamp: new Date().toISOString()
      });
    }

    const updatedDoctor = await doctorService.updateDoctorProfile(existingDoctor._id, updateData);

    logger.info('Doctor profile updated', { userId, doctorId: updatedDoctor._id });

    res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: { doctor: updatedDoctor },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ UPDATE ERROR:', error);
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
   * Get doctor's consultations
   * GET /api/doctors/consultations
   */
  
 // In your doctor.controller.js
async getDoctorConsultations (req, res) {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    status: req.query.status,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };

  // ✅ Pass req object instead of separate doctorId
  const result = await doctorService.getDoctorConsultations(req, options);

  return res.json({
    success: true,
    data: result
  });
};

async createTreatmentPlan(req, res, next) {
  try {
    console.log('🔄 Controller: Creating treatment plan');
    console.log('📋 Request body:', req.body);
    console.log('👤 User from token:', req.user._id);
    
    // ✅ FIXED: Proper validation error handling
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    // ✅ FIXED: Add doctorId from authenticated user
    const treatmentData = {
      ...req.body,
      doctorId: req.user._id  // This comes from JWT token
    };

    console.log('📋 Sending to service:', treatmentData);
    
    const result = await doctorService.createTreatmentPlan(treatmentData);

    console.log('✅ Treatment plan created successfully');

    return res.status(201).json({
      success: true,
      message: 'Treatment plan created successfully',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Create treatment plan error:', error);
    logger.error('Create treatment plan error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to create treatment plan'
      },
      timestamp: new Date().toISOString()
    });
  }
}  
  /**
   * Get doctor's treatment plans
   * GET /api/doctors/treatment-plans
   */
  async getDoctorTreatmentPlans(req, res, next) {
    try {
      const doctorId = req.user._id;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        patientId: req.query.patientId
      };
    
      const result = await doctorService.getDoctorTreatmentPlans(doctorId, options);
    
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get doctor treatment plans error:', error);
      next(error);
    }
  }  
  /**
   * Get treatment plan details
   * GET /api/doctors/treatment-plans/:id
   */
  async getTreatmentPlanDetails  (req, res) {
    const doctorId = req.user._id;
    const { id } = req.params;
  
    const treatmentPlan = await doctorService.getTreatmentPlanDetails(id, doctorId);
  
    return res.json({
      success: true,
      data: treatmentPlan
    });
  };
  
  /**
   * Update treatment plan
   * PUT /api/doctors/treatment-plans/:id
   */
  async updateTreatmentPlan (req, res){
    const doctorId = req.user._id;
    const { id } = req.params;
  
    const treatmentPlan = await doctorService.updateTreatmentPlan(id, doctorId, req.body);
  
    return res.json({
      success: true,
      message: 'Treatment plan updated successfully',
      data: treatmentPlan
    });
  };
  
  /**
   * Delete treatment plan
   * DELETE /api/doctors/treatment-plans/:id
   */
 async deleteTreatmentPlan (req, res) {
    const doctorId = req.user._id;
    const { id } = req.params;
  
    const result = await doctorService.deleteTreatmentPlan(id, doctorId);
  
    return res.json({
      success: true,
      message: result.message
    });
  };
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
   * 3. AVAILABILITY MANAGEMENT
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
   * 4. DOCTOR SEARCH & DISCOVERY
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Search doctors by specialization
   * GET /api/doctors/search/specialization
   */
  async searchBySpecialization(req, res, next) {
    try {
      const { 
        specialization,
        page = 1,
        limit = 10,
        sortBy = 'createdAt'
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

      const result = await doctorService.findDoctorsBySpecialization(
        specialization,
        {
          page: parseInt(page),
          limit: parseInt(limit),
          sortBy
        }
      );

      res.json({
        success: true,
        message: 'Doctors found successfully',
        data: {
          ...result,
          searchCriteria: {
            specialization,
            sortBy
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Search doctors by specialization error:', error);
      next(error);
    }
  }

  /**
   * Search doctors with multiple criteria
   * POST /api/doctors/search
   */
  async searchDoctors(req, res, next) {
    try {
      const searchCriteria = req.body;

      const result = await doctorService.searchDoctors(searchCriteria);

      res.json({
        success: true,
        message: 'Doctor search completed successfully',
        data: {
          ...result,
          searchCriteria
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Search doctors error:', error);
      next(error);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 5. ANALYTICS & REPORTING
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Get doctor statistics
   * GET /api/doctors/stats
   */
  async getDoctorStats(req, res, next) {
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

      const stats = await doctorService.getDoctorStats(doctor._id, period);

      res.json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get doctor stats error:', error);
      next(error);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 6. VERIFICATION MANAGEMENT
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Update doctor verification status (Admin only)
   * PUT /api/doctors/:doctorId/verification
   */
// In controllers/doctor.controller.js

async updateVerificationStatus(req, res, next) {
  try {
    const { doctorId } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid verification status'
        },
        timestamp: new Date().toISOString()
      });
    }

    // ✅ Use direct MongoDB update - completely bypasses Mongoose validation
    const updateData = {
      verificationStatus: status,
      'verification.status': status,
      'verification.verifiedBy': req.user._id || req.user.id,
      'verification.notes': notes,
      isActive: status === 'approved'
    };

    if (status === 'approved') {
      updateData['verification.verifiedAt'] = new Date();
    }

    if (status === 'rejected') {
      updateData['verification.rejectionReason'] = notes;
    }

    // ✅ Direct MongoDB update - no Mongoose validation
    const result = await mongoose.connection.db.collection('doctors').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(doctorId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCTOR_NOT_FOUND',
          message: 'Doctor not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const updatedDoctor = result;

    // ✅ Send notifications
    try {
      if (status === 'approved') {
        await NotificationService.sendEmail(
          updatedDoctor.email,
          'Account Verified - Welcome to AyurSutra',
          'doctorVerificationApproved',
          {
            doctorName: updatedDoctor.name,
            loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/doctor-login`
          }
        );

        if (updatedDoctor.phone) {
          await NotificationService.sendSMS(
            updatedDoctor.phone,
            `Congratulations Dr. ${updatedDoctor.name}! Your AyurSutra account has been verified.`
          );
        }

      } else if (status === 'rejected') {
        await NotificationService.sendEmail(
          updatedDoctor.email,
          'Account Verification Update',
          'doctorVerificationRejected',
          {
            doctorName: updatedDoctor.name,
            reason: notes || 'Please contact support',
            supportEmail: process.env.SUPPORT_EMAIL || 'support@ayursutra.com'
          }
        );

        if (updatedDoctor.phone) {
          await NotificationService.sendSMS(
            updatedDoctor.phone,
            `Your AyurSutra application requires additional information. Check your email.`
          );
        }
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    logger.info(`Doctor verification updated`, { 
      doctorId,
      status,
      adminId: req.user.id
    });

    res.json({
      success: true,
      message: `Doctor verification status updated to ${status}`,
      data: {
        doctor: {
          id: updatedDoctor._id,
          name: updatedDoctor.name,
          email: updatedDoctor.email,
          verificationStatus: updatedDoctor.verificationStatus,
          isActive: updatedDoctor.isActive
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Update verification error:', error);
    next(error);
  }
}

/**
 * Add new patient (Doctor only)
 * POST /api/doctors/patients/add
 */
async addPatient(req, res, next) {
  try {
    console.log('🟢 Add patient started by doctor:', req.user.email);
    
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid patient data provided',
          details: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only doctors can add patients'
        },
        timestamp: new Date().toISOString()
      });
    }

    const { name, email, phone, dateOfBirth, gender, medicalHistory, allergies, symptoms } = req.body;

    // Get doctor profile
    const doctor = await doctorService.getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found' },
        timestamp: new Date().toISOString()
      });
    }

    // Check if patient already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email },
        { phone: phone }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'PATIENT_EXISTS',
          message: 'Patient with this email or phone already exists'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Create new patient
    const newPatient = new User({
      name,
      email,
      phone,
      passwordHash,
      role: 'patient',
      createdBy: req.user.id,
      location: {
        type: 'Point',
        coordinates: [0, 0] // ← ADD THIS: Default coordinates [longitude, latitude]
      },
      profile: {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        medicalHistory: medicalHistory || [],
        allergies: allergies || [],
        symptoms: symptoms || []
      },
      emailVerified: false,
      phoneVerified: false,
      isActive: true
    });

    await newPatient.save();

    console.log('✅ Patient added successfully:', newPatient._id);
    logger.info('Patient added by doctor', { 
      doctorId: doctor._id,
      patientId: newPatient._id,
      doctorEmail: req.user.email 
    });

    res.status(201).json({
      success: true,
      message: 'Patient added successfully',
      data: {
        patient: {
          id: newPatient._id,
          name: newPatient.name,
          email: newPatient.email,
          phone: newPatient.phone,
          role: newPatient.role,
          tempPassword, // Send temp password (in real app, send via email/SMS)
          createdBy: doctor._id,
          createdAt: newPatient.createdAt
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Add patient error:', error.message);
    logger.error('Add patient error:', {
      error: error.message,
      doctorId: req.user?.id
    });
    next(error);
  }
}



  /**
   * Get doctors pending verification (Admin only)
   * GET /api/doctors/pending-verification
   */
  async getPendingVerifications(req, res, next) {
    try {
      const doctors = await doctorService.getPendingVerifications();

      res.json({
        success: true,
        message: 'Pending verifications retrieved successfully',
        data: {
          doctors,
          count: doctors.length
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get pending verifications error:', error);
      next(error);
    }
  }
}

module.exports = new DoctorController();
