const schedulingService = require('../services/scheduling.service');
const Consultation = require('../models/Consultation');
const { AppError, asyncHandler } = require('../middleware/error.middleware');
const moment = require('moment');
const alternativeSlotsService = require('../services/alternativeSlots.service');

const User = require('../models/User');
const mongoose = require('mongoose');
const logger = require('../config/logger');

class BookingController {
  

getPatientDetails = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  
  console.log('🔄 Getting patient details');
  console.log('👨‍⚕️ Doctor:', req.user.email, '| ID:', req.user._id);
  console.log('👤 Patient ID:', patientId);

  // ✅ Validate patient ID format
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PATIENT_ID',
        message: 'Invalid patient ID format'
      },
      timestamp: new Date().toISOString()
    });
  }

  // ✅ Get patient from User model
  const patient = await User.findById(patientId)
    .select('-passwordHash -refreshTokens -__v -emailVerificationToken -phoneOTP -passwordResetToken -loginAttempts -lockUntil')
    .lean();

  if (!patient) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'PATIENT_NOT_FOUND',
        message: 'Patient not found'
      },
      timestamp: new Date().toISOString()
    });
  }

  // ✅ Verify user is a patient
  if (patient.role !== 'patient') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ROLE',
        message: 'User is not a patient'
      },
      timestamp: new Date().toISOString()
    });
  }

  // ✅ Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(patient.profile?.dateOfBirth);

  // ✅ Determine dominant dosha
  const constitution = patient.profile?.constitution || { vata: 33, pitta: 33, kapha: 34 };
  const dominantDosha = Object.entries(constitution).reduce((a, b) => 
    constitution[a[0]] > constitution[b[0]] ? a : b
  )[0];

  // ✅ Format patient details response
  const patientDetails = {
    id: patient._id,
    name: patient.name,
    email: patient.email,
    phone: patient.phone,
    age: age,
    dateOfBirth: patient.profile?.dateOfBirth,
    gender: patient.profile?.gender,
    
    // Medical information
    medicalHistory: patient.profile?.medicalHistory || [],
    allergies: patient.profile?.allergies || [],
    symptoms: patient.profile?.symptoms || [],
    currentMedications: patient.profile?.currentMedications || [],
    
    // Ayurvedic profile
    constitution: constitution,
    dominantDosha: dominantDosha,
    dietHabits: patient.profile?.dietHabits,
    sleepPattern: patient.profile?.sleepPattern,
    stressLevel: patient.profile?.stressLevel,
    digestion: patient.profile?.digestion,
    bowelHabits: patient.profile?.bowelHabits,
    exerciseRoutine: patient.profile?.exerciseRoutine,
    addictions: patient.profile?.addictions || [],
    menstrualHistory: patient.profile?.menstrualHistory,
    
    // Address & metadata
    address: patient.address,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
    emailVerified: patient.emailVerified,
    phoneVerified: patient.phoneVerified,
    isActive: patient.isActive
  };

  // ✅ Log access for audit
  logger.info('Patient details viewed by doctor', {
    doctorId: req.user._id,
    doctorEmail: req.user.email,
    patientId: patientId,
    patientName: patient.name
  });

  console.log('✅ Patient details retrieved successfully');

  // ✅ Return formatted response
  return res.json({
    success: true,
    message: 'Patient details retrieved successfully',
    data: patientDetails,
    timestamp: new Date().toISOString()
  });
});

  // Check if a slot is available before booking
  checkSlotAvailability = asyncHandler(async (req, res) => {
    const { providerId, startTime, duration = 30 } = req.body;
    
    if (!providerId || !startTime) {
      throw new AppError('Provider ID and start time are required', 400, 'MISSING_FIELDS');
    }
    
    if (!moment(startTime).isValid()) {
      throw new AppError('Invalid start time format', 400, 'INVALID_TIME_FORMAT');
    }
    
    console.log(`🔍 Checking slot availability for provider ${providerId} at ${startTime}`);
    
    const availability = await schedulingService.isSlotAvailable(providerId, startTime, duration);
    
    return res.json({
      success: true,
      data: {
        providerId,
        startTime,
        duration,
        available: availability.available,
        reason: availability.reason,
        conflicts: availability.conflicts || []
      }
    });
  });
  
  // Create a new booking with conflict detection
  // Create a new booking with conflict detectionconst alternativeSlotsService = require('../services/alternativeSlots.service');

// Updated createBooking method with alternative slots integration

createBooking = asyncHandler(async (req, res) => {
    const { 
      providerId, 
      patientId, 
      startTime,
      duration = 30, 
      type = 'in_person',
      providerType,
      fee,
      sessionType,
      meetingLink,
      notes = ''
    } = req.body;
  
    // ===== VALIDATION PHASE =====
    console.log(`🏥 Starting booking creation for provider ${providerId}, patient ${patientId}`);
  
    if (!providerId || !patientId || !startTime) {
      throw new AppError('Provider ID, patient ID, and start time are required', 400, 'MISSING_FIELDS');
    }
  
    if (!providerType) {
      throw new AppError('Provider type is required', 400, 'MISSING_PROVIDER_TYPE');
    }
  
    if (!fee || fee < 0) {
      throw new AppError('Valid fee is required', 400, 'MISSING_FEE');
    }
  
    if (type === 'video' && !meetingLink) {
      throw new AppError('Meeting link is required for video consultations', 400, 'MISSING_MEETING_LINK');
    }
  
    if (!moment(startTime).isValid()) {
      throw new AppError('Invalid start time format', 400, 'INVALID_TIME_FORMAT');
    }
  
    const scheduledDate = new Date(startTime);
    if (scheduledDate <= new Date()) {
      throw new AppError('Appointment time must be in the future', 400, 'INVALID_APPOINTMENT_TIME');
    }
  
    // ===== CONFLICT DETECTION PHASE =====
    console.log(`🔍 Checking conflicts for ${moment(startTime).format('YYYY-MM-DD HH:mm')}`);
    
    const conflictCheck = await schedulingService.checkConflicts(providerId, startTime, duration);
  
    if (conflictCheck.hasConflict) {
      console.log(`⚠️ Conflict detected! Finding alternative slots...`);
      
      const conflictAppointment = conflictCheck.conflicts[0];
      let alternativesData = [];
      let totalAlternatives = 0;
  
      try {
        // ===== ALTERNATIVE SLOTS GENERATION =====
        const alternatives = await alternativeSlotsService.findAlternatives(
          providerId, 
          startTime, 
          duration,
          sessionType || 'therapy',
          5 // Get top 5 alternatives
        );
  
        console.log(`✨ Found ${alternatives.length} alternative slots`);
  
        alternativesData = alternatives.map((alt, index) => ({
          id: index + 1,
          startTime: alt.startTime,
          endTime: alt.endTime,
          date: alt.date,
          start: alt.start,
          end: alt.end,
          reason: alt.reason,
          confidence: alt.confidence,
          daysDifference: alt.dayDifference,
          timeDifference: alt.timeDifference,
          strategy: alt.strategy,
          rank: alt.rank || index + 1
        }));
  
        totalAlternatives = alternatives.length;
  
      } catch (alternativeError) {
        console.error('❌ Error finding alternatives:', alternativeError.message);
      }
  
      const conflictErrorData = {
        conflictInfo: {
          existingAppointment: {
            scheduledAt: conflictAppointment.scheduledAt,
            patientName: conflictAppointment.patientName || 'Another Patient',
            duration: conflictAppointment.duration,
            type: conflictAppointment.type,
            sessionType: conflictAppointment.sessionType
          },
          conflictReason: `This slot is already booked by ${conflictAppointment.patientName || 'another patient'}`,
          requestedSlot: {
            startTime: startTime,
            duration: duration,
            type: type
          }
        },
        suggestedAlternatives: alternativesData,
        totalAlternatives: totalAlternatives,
        alternativeMessage: totalAlternatives > 0 
          ? `We found ${totalAlternatives} alternative time slots for you` 
          : 'No alternative slots are currently available',
        rebookingInstructions: totalAlternatives > 0 
          ? 'Please select one of the suggested alternatives to complete your booking'
          : 'Please try booking for a different date or contact support for assistance'
      };
  
      throw new AppError(
        `Time slot conflicts with existing appointment at ${moment(conflictAppointment.scheduledAt).format('h:mm A')} with ${conflictAppointment.patientName || 'another patient'}`,
        409,
        'SLOT_CONFLICT',
        conflictErrorData
      );
    }
  
    console.log(`✅ No conflicts detected. Creating booking...`);
  
    const consultationData = {
      providerId,
      patientId,
      scheduledAt: scheduledDate,
      duration,
      type,
      providerType,
      fee,
      status: 'scheduled',
      notes
    };
  
    if (sessionType) {
      consultationData.sessionType = sessionType;
    }
  
    if (type === 'video' && meetingLink) {
      consultationData.meetingLink = meetingLink;
    }
  
    try {
      const consultation = await Consultation.create(consultationData);
  
      await consultation.populate([
        { path: 'providerId', select: 'name email role' },
        { path: 'patientId', select: 'name email phone' }
      ]);
  
      console.log(`🎉 Booking created successfully: ${consultation._id}`);
  
      return res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: {
          consultationId: consultation._id,
          providerId: consultation.providerId._id,
          providerName: consultation.providerId?.name || 'Provider',
          patientId: consultation.patientId._id,
          patientName: consultation.patientId?.name || 'Patient',
          scheduledAt: consultation.scheduledAt,
          duration: consultation.duration,
          type: consultation.type,
          providerType: consultation.providerType,
          fee: consultation.fee,
          status: consultation.status,
          sessionType: consultation.sessionType,
          meetingLink: consultation.meetingLink,
          notes: consultation.notes,
          bookingReference: `BK-${consultation._id.toString().slice(-6).toUpperCase()}`,
          confirmationMessage: `Your ${type === 'video' ? 'video' : 'in-person'} appointment with ${consultation.providerId?.name || 'the provider'} has been confirmed for ${moment(consultation.scheduledAt).format('MMMM Do, YYYY [at] h:mm A')}`
        },
        timestamp: new Date().toISOString()
      });
  
    } catch (createError) {
      console.error('❌ Error creating consultation:', createError);
      throw new AppError('Failed to create booking. Please try again.', 500, 'BOOKING_CREATION_FAILED');
    }
  });

  getAlternativeSlots = asyncHandler(async (req, res) => {
    const { providerId, requestedDateTime, duration = 60, therapyType = 'consultation' } = req.body;
    
    if (!providerId || !requestedDateTime) {
      throw new AppError('Provider ID and requested date/time are required', 400, 'MISSING_FIELDS');
    }
    
    if (!moment(requestedDateTime).isValid()) {
      throw new AppError('Invalid requested date/time format', 400, 'INVALID_DATETIME');
    }
    
    console.log(`🔍 Getting alternative slots for provider ${providerId} at ${requestedDateTime}`);
    
    const alternatives = await alternativeSlotsService.findAlternatives(
      providerId, 
      requestedDateTime, 
      duration, 
      therapyType,
      5 // Max 5 suggestions
    );
    
    return res.json({
      success: true,
      message: `Found ${alternatives.length} alternative slots`,
      data: {
        providerId,
        requestedDateTime,
        therapyType,
        duration,
        alternatives: alternatives.map(alt => ({
          startTime: alt.startTime,
          endTime: alt.endTime,
          date: alt.date,
          start: alt.start,
          end: alt.end,
          reason: alt.reason,
          rank: alt.rank,
          confidence: alt.confidence,
          daysDifference: alt.dayDifference,
          timeDifference: alt.timeDifference,
          strategy: alt.strategy
        })),
        totalAlternatives: alternatives.length
      }
    });
  });


  // Get all bookings for a specific provider (no date filter)
getAllProviderBookings = asyncHandler(async (req, res) => {
  const { providerId } = req.params;

  const bookings = await Consultation.find({
    providerId,
    status: { $nin: ['cancelled'] } // exclude cancelled ones if needed
  })
    .populate('patientId', 'name email')
    .sort({ scheduledAt: 1 }); // sort by date ascending

  return res.json({
    success: true,
    data: {
      providerId,
      bookings: bookings.map(booking => ({
        consultationId: booking._id,
        patientName: booking.patientId.name,
        patientEmail: booking.patientId.email,
        scheduledAt: booking.scheduledAt,
        duration: booking.duration,
        type: booking.type,
        status: booking.status
      })),
      totalBookings: bookings.length
    }
  });
});

  // Get existing bookings for a provider on a specific date
  getProviderBookings = asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      throw new AppError('Date is required', 400, 'MISSING_DATE');
    }
    
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();
    
    const bookings = await Consultation.find({
      providerId,
      scheduledAt: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $nin: ['cancelled'] }
    })
    .populate('patientId', 'name email')
    .sort({ scheduledAt: 1 });
    
    return res.json({
      success: true,
      data: {
        providerId,
        date,
        bookings: bookings.map(booking => ({
          consultationId: booking._id,
          patientName: booking.patientId.name,
          scheduledAt: booking.scheduledAt,
          duration: booking.duration,
          type: booking.type,
          status: booking.status
        })),
        totalBookings: bookings.length
      }
    });
  });
}




module.exports = new BookingController();
