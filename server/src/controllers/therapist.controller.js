// controllers/therapist.controller.js - WITH DEBUGGING
const therapistService = require('../services/therapist.service');
const Therapist = require('../models/Therapist');
const User = require('../models/User');

/**
 * ═══════════════════════════════════════════════════════════
 * AUTHENTICATION & PROFILE CONTROLLERS
 * ═══════════════════════════════════════════════════════════
 */

// @desc    Register new therapist profile
// @route   POST /api/therapists/register
// @access  Private (authenticated user with therapist role)
async function registerTherapist(req, res) {
  console.log('🔥 [CONTROLLER] registerTherapist - START');
  console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const data = req.body;
    const therapist = await therapistService.createTherapist(data);
    
    console.log('✅ [CONTROLLER] Therapist registered:', therapist._id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Therapist registered successfully',
      data: therapist 
    });
  } catch (error) {
    console.error('❌ [CONTROLLER] Register therapist error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
}

// @desc    Get therapist by ID
// @route   GET /api/therapists/:id
// @access  Public
async function getTherapist(req, res) {
  console.log('🔥 [CONTROLLER] getTherapist - START');
  console.log('🆔 Therapist ID:', req.params.id);
  
  try {
    const therapist = await therapistService.getTherapistById(req.params.id);
    
    if (!therapist) {
      console.log('❌ [CONTROLLER] Therapist not found');
      return res.status(404).json({ 
        success: false, 
        message: 'Therapist not found' 
      });
    }
    
    console.log('✅ [CONTROLLER] Therapist found:', therapist._id);
    res.json({ success: true, data: therapist });
  } catch (error) {
    console.error('❌ [CONTROLLER] Get therapist error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}


async function getMyProfile(req, res) {
  console.log('🔥 [CONTROLLER] getMyProfile - START');
  console.log('👤 User ID from token:', req.user?.id);
  console.log('👤 Full user object:', JSON.stringify(req.user, null, 2));
  
  try {
    const therapist = await therapistService.getTherapistByUserId(req.user.id);
    
    if (!therapist) {
      console.log('❌ [CONTROLLER] Therapist profile not found for userId:', req.user.id);
      return res.status(404).json({ 
        success: false, 
        message: 'Therapist profile not found' 
      });
    }
    
    console.log('✅ [CONTROLLER] Profile found:', {
      _id: therapist._id,
      userId: therapist.userId,
      name: therapist.userId?.name
    });
    
    res.json({ success: true, data: therapist });
  } catch (error) {
    console.error('❌ [CONTROLLER] Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}


async function updateProfile(req, res) {
  console.log('🔥 [CONTROLLER] updateProfile - START');
  console.log('🆔 Therapist ID:', req.params.id);
  console.log('📦 Update Data:', JSON.stringify(req.body, null, 2));
  
  try {
    const {
      name,
      email,
      phone,
      bio,
      specialization,
      experienceYears,
      certifications,
      isActive,
      verificationStatus
    } = req.body;

    // ═══════════════════════════════════════════════════════
    // ✅ BUILD THERAPIST UPDATE OBJECT (schema-aligned)
    // ═══════════════════════════════════════════════════════
    const therapistUpdateData = {};

    if (typeof bio === 'string') {
      therapistUpdateData.bio = bio;
    }

    if (Array.isArray(specialization)) {
      therapistUpdateData.specialization = specialization;
    }

    if (experienceYears !== undefined) {
      const exp = parseInt(experienceYears, 10);
      if (!Number.isNaN(exp)) {
        therapistUpdateData.experienceYears = exp;
      }
    }

    // Certifications: expect array with (therapy, level, experienceYears, certificateUrl)
    if (Array.isArray(certifications)) {
      therapistUpdateData.certifications = certifications.map(cert => ({
        therapy: cert.therapy,
        level: cert.level,
        experienceYears: Number(cert.experienceYears) || 0,
        certificateUrl: cert.certificateUrl
      }));
    }

    if (typeof isActive === 'boolean') {
      therapistUpdateData.isActive = isActive;
    }

    if (typeof verificationStatus === 'string') {
      therapistUpdateData.verificationStatus = verificationStatus;
    }

    console.log('📝 [CONTROLLER] Sanitized therapist data:', JSON.stringify(therapistUpdateData, null, 2));

    // ═══════════════════════════════════════════════════════
    // ✅ UPDATE THERAPIST PROFILE (no availability here)
    // ═══════════════════════════════════════════════════════
    const therapist = await therapistService.updateTherapist(req.params.id, therapistUpdateData);
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    // ═══════════════════════════════════════════════════════
    // ✅ UPDATE USER DETAILS (if provided)
    // ═══════════════════════════════════════════════════════
    if (therapist.userId) {
      const userUpdateData = {};
      if (name) userUpdateData.name = name;
      if (email) userUpdateData.email = email;
      if (phone) userUpdateData.phone = phone;

      if (Object.keys(userUpdateData).length > 0) {
        console.log('👤 [CONTROLLER] Updating user details:', userUpdateData);
        await therapistService.updateUserDetails(
          therapist.userId._id || therapist.userId,
          userUpdateData
        );
      }
    }

    console.log('✅ [CONTROLLER] Profile updated successfully');
    
    // ═══════════════════════════════════════════════════════
    // ✅ FETCH UPDATED PROFILE WITH POPULATED DATA
    // ═══════════════════════════════════════════════════════
    const updatedTherapist = await therapistService.getTherapistProfile(req.params.id);
    
    return res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedTherapist 
    });
    
  } catch (error) {
    console.error('❌ [CONTROLLER] Update profile error:', error);
    
    // ✅ HANDLE VALIDATION ERRORS
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // ✅ HANDLE DUPLICATE KEY ERRORS
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email or phone already exists'
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update profile'
    });
  }
}

async function updateAvailability(req, res) {
  console.log('🔥 [CONTROLLER] updateAvailability - START');
  console.log('🆔 Therapist ID:', req.params.id);
  console.log('📦 Availability Data:', JSON.stringify(req.body, null, 2));
  
  try {
    const { id } = req.params;
    const availabilityData = req.body; // should be full availability object

    const therapist = await therapistService.updateAvailability(id, availabilityData);
    
    console.log('✅ [CONTROLLER] Availability updated successfully');
    
    return res.json({ 
      success: true, 
      message: 'Availability updated successfully',
      data: therapist 
    });
  } catch (error) {
    console.error('❌ [CONTROLLER] Update availability error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update availability' 
    });
  }
}


async function searchTherapists(req, res) {
  console.log('🔥 [CONTROLLER] searchTherapists - START');
  console.log('🔍 Query Params:', req.query);
  
  try {
    const filters = req.query;
    
    const query = {
      isActive: true,
      verificationStatus: 'approved'
    };
    
    if (filters.specialization) {
      query.specialization = filters.specialization;
      console.log('🔍 Filter by specialization:', filters.specialization);
    }
    
    if (filters.therapy) {
      query['certifications.therapy'] = filters.therapy;
      console.log('🔍 Filter by therapy:', filters.therapy);
    }
    
    if (filters.city) {
      query['userId.address.city'] = new RegExp(filters.city, 'i');
      console.log('🔍 Filter by city:', filters.city);
    }
    
    if (filters.minExperience) {
      query.experienceYears = { $gte: parseInt(filters.minExperience) };
      console.log('🔍 Filter by min experience:', filters.minExperience);
    }
    
    console.log('📊 Final Query:', JSON.stringify(query, null, 2));
    
    const therapists = await Therapist.find(query)
      .populate('userId', 'name phone email address location')
      .sort({ 'metrics.averageRating': -1 })
      .limit(parseInt(filters.limit) || 20);
    
    console.log('✅ [CONTROLLER] Found therapists:', therapists.length);
    
    res.json({ 
      success: true,
      message: `Found ${therapists.length} therapists`,
      data: therapists,
      count: therapists.length
    });
    
  } catch (error) {
    console.error('❌ [CONTROLLER] Search therapists error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

// @desc    Update therapist availability
// @route   PUT /api/therapists/:id/availability
// @access  Private (therapist only)

/**
 * ═══════════════════════════════════════════════════════════
 * DASHBOARD & ANALYTICS CONTROLLERS
 * ═══════════════════════════════════════════════════════════
 */

// @desc    Get dashboard overview with today's stats and sessions
// @route   GET /api/therapists/dashboard/overview
// @access  Private (therapist only)
async function getDashboardOverview(req, res) {
  console.log('🔥 [CONTROLLER] getDashboardOverview - START');
  console.log('👤 User ID:', req.user?.id);
  
  try {
    const therapistId = req.user.id;
    
    console.log('🔍 Finding therapist profile...');
    const therapistProfile = await therapistService.getTherapistByUserId(therapistId);
    
    if (!therapistProfile) {
      console.log('❌ [CONTROLLER] Therapist profile not found');
      return res.status(404).json({
        success: false,
        message: 'Therapist profile not found'
      });
    }

    console.log('✅ [CONTROLLER] Therapist profile found:', therapistProfile._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('📅 Date range:', {
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString()
    });

    console.log('🔍 Fetching today\'s sessions...');
    const todaysSessions = await therapistService.getTodaySessions(therapistProfile._id);
    console.log('📊 Today\'s sessions found:', todaysSessions.length);

    const todayStats = {
      sessionsScheduled: todaysSessions.length,
      sessionsInProgress: todaysSessions.filter(s => s.status === 'in_progress').length,
      sessionsCompleted: todaysSessions.filter(s => s.status === 'completed').length,
      sessionsCancelled: todaysSessions.filter(s => s.status === 'cancelled').length
    };

    console.log('📊 Today Stats:', todayStats);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    
    console.log('🔍 Fetching weekly sessions...');
    const Consultation = require('../models/Consultation');
    const weeklySessions = await Consultation.find({
      providerId: therapistProfile._id,
      providerType: 'therapist',
      sessionType: 'therapy',
      scheduledAt: { $gte: weekStart }
    });

    console.log('📊 Weekly sessions found:', weeklySessions.length);

    const weeklyStats = {
      totalSessions: weeklySessions.length,
      completedSessions: weeklySessions.filter(s => s.status === 'completed').length,
      averageDuration: weeklySessions
        .filter(s => s.actualDuration)
        .reduce((acc, s) => acc + s.actualDuration, 0) / 
        (weeklySessions.filter(s => s.actualDuration).length || 1)
    };

    console.log('📊 Weekly Stats:', weeklyStats);
    console.log('✅ [CONTROLLER] Dashboard overview complete');

    res.status(200).json({
      success: true,
      data: {
        todayStats,
        weeklyStats,
        todaysSessions
      }
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard overview',
      error: error.message
    });
  }
}

// @desc    Get therapist statistics
// @route   GET /api/therapists/stats
// @access  Private (therapist only)
async function getTherapistStats(req, res) {
  console.log('🔥 [CONTROLLER] getTherapistStats - START');
  console.log('👤 User ID:', req.user?.id);
  console.log('📊 Period:', req.query.period || '30d');
  
  try {
    const therapistId = req.user.id;
    const { period = '30d' } = req.query;
    
    console.log('🔍 Finding therapist profile...');
    const therapistProfile = await therapistService.getTherapistByUserId(therapistId);
    
    if (!therapistProfile) {
      console.log('❌ [CONTROLLER] Therapist profile not found');
      return res.status(404).json({
        success: false,
        message: 'Therapist profile not found'
      });
    }
    
    console.log('✅ [CONTROLLER] Therapist found:', therapistProfile._id);
    
    const stats = await therapistService.getTherapistStats(therapistProfile._id, period);
    
    console.log('📊 Stats retrieved:', stats);
    console.log('✅ [CONTROLLER] Stats complete');
    
    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('❌ [CONTROLLER] Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * SESSION MANAGEMENT CONTROLLERS
 * ═══════════════════════════════════════════════════════════
 */

// @desc    Get today's therapy sessions
// @route   GET /api/therapists/sessions/today
// @access  Private (therapist only)
async function getTodaySessions(req, res) {
  console.log('🔥 [CONTROLLER] getTodaySessions - START');
  console.log('👤 User ID:', req.user?.id);
  
  try {
    const therapistId = req.user.id;
    
    console.log('🔍 Finding therapist profile...');
    const therapistProfile = await therapistService.getTherapistByUserId(therapistId);
    
    if (!therapistProfile) {
      console.log('❌ [CONTROLLER] Therapist profile not found');
      return res.status(404).json({
        success: false,
        message: 'Therapist profile not found'
      });
    }

    console.log('✅ [CONTROLLER] Therapist found:', therapistProfile._id);
    
    const sessions = await therapistService.getTodaySessions(therapistProfile._id);

    console.log('📊 Sessions found:', sessions.length);
    console.log('✅ [CONTROLLER] Today\'s sessions complete');

    res.status(200).json({
      success: true,
      data: { sessions }
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Get today sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s sessions',
      error: error.message
    });
  }
}

// @desc    Get all sessions for a specific patient
// @route   GET /api/therapists/sessions/patient/:patientId
// @access  Private (therapist only)
async function getPatientSessions(req, res) {
  console.log('🔥 [CONTROLLER] getPatientSessions - START');
  console.log('🆔 Patient ID:', req.params.patientId);
  console.log('👤 User ID:', req.user?.id);
  
  try {
    const { patientId } = req.params;
    const therapistId = req.user.id;
    
    const therapistProfile = await therapistService.getTherapistByUserId(therapistId);
    
    if (!therapistProfile) {
      console.log('❌ [CONTROLLER] Therapist profile not found');
      return res.status(404).json({
        success: false,
        message: 'Therapist profile not found'
      });
    }

    console.log('✅ [CONTROLLER] Therapist found:', therapistProfile._id);

    const result = await therapistService.getPatientSessions(therapistProfile._id, patientId);

    console.log('📊 Patient sessions retrieved');
    console.log('✅ [CONTROLLER] Patient sessions complete');

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Get patient sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient sessions',
      error: error.message
    });
  }
}

// @desc    Start a therapy session
// @route   POST /api/therapists/sessions/:sessionId/start
// @access  Private (therapist only)
async function startSession(req, res) {
  console.log('🔥 [CONTROLLER] startSession - START');
  console.log('🆔 Session ID:', req.params.sessionId);
  console.log('📦 Start Notes:', req.body.startNotes);
  
  try {
    const { sessionId } = req.params;
    const { startNotes } = req.body;
    const therapistId = req.user.id;
    
    const therapistProfile = await therapistService.getTherapistByUserId(therapistId);
    
    if (!therapistProfile) {
      console.log('❌ [CONTROLLER] Therapist profile not found');
      return res.status(404).json({
        success: false,
        message: 'Therapist profile not found'
      });
    }

    console.log('✅ [CONTROLLER] Therapist found:', therapistProfile._id);

    const session = await therapistService.startTherapySession(
      sessionId, 
      therapistProfile._id, 
      startNotes
    );

    console.log('✅ [CONTROLLER] Session started successfully');

    res.status(200).json({
      success: true,
      message: 'Session started successfully',
      data: session
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Start session error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start session'
    });
  }
}

// @desc    Complete a therapy session
// @route   POST /api/therapists/sessions/:sessionId/complete
// @access  Private (therapist only)
async function completeSession(req, res) {
  console.log('🔥 [CONTROLLER] completeSession - START');
  console.log('🆔 Session ID:', req.params.sessionId);
  console.log('📦 Completion Data:', JSON.stringify(req.body, null, 2));
  
  try {
    const { sessionId } = req.params;
    const completionData = req.body;
    const therapistId = req.user.id;
    
    const therapistProfile = await therapistService.getTherapistByUserId(therapistId);
    
    if (!therapistProfile) {
      console.log('❌ [CONTROLLER] Therapist profile not found');
      return res.status(404).json({
        success: false,
        message: 'Therapist profile not found'
      });
    }

    console.log('✅ [CONTROLLER] Therapist found:', therapistProfile._id);

    const session = await therapistService.completeTherapySession(
      sessionId,
      therapistProfile._id,
      completionData
    );

    console.log('✅ [CONTROLLER] Session completed successfully');

    res.status(200).json({
      success: true,
      message: 'Session completed successfully',
      data: session
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Complete session error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete session'
    });
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * PATIENT MANAGEMENT CONTROLLERS
 * ═══════════════════════════════════════════════════════════
 */

// @desc    Get all assigned patients
// @route   GET /api/therapists/patients/assigned
// @access  Private (therapist only)
async function getAssignedPatients(req, res) {
  console.log('🔥 [CONTROLLER] getAssignedPatients - START');
  console.log('👤 User ID:', req.user?.id);
  
  try {
    const therapistId = req.user.id;
    
    console.log('🔍 Finding therapist profile...');
    const therapistProfile = await therapistService.getTherapistByUserId(therapistId);
    
    if (!therapistProfile) {
      console.log('❌ [CONTROLLER] Therapist profile not found');
      return res.status(404).json({
        success: false,
        message: 'Therapist profile not found'
      });
    }

    console.log('✅ [CONTROLLER] Therapist found:', therapistProfile._id);

    const Consultation = require('../models/Consultation');
    const User = require('../models/User');

    console.log('🔍 Finding unique patient IDs...');
    const sessionPatientIds = await Consultation.find({ 
      providerId: therapistProfile._id,
      providerType: 'therapist',
      sessionType: 'therapy'
    }).distinct('patientId');

    console.log('📊 Unique patient IDs found:', sessionPatientIds.length);

    console.log('🔍 Fetching patient details...');
    const patients = await Promise.all(sessionPatientIds.map(async (patientId) => {
      const patient = await User.findById(patientId).lean();
      
      if (!patient) {
        console.log('⚠️ Patient not found for ID:', patientId);
        return null;
      }

      const allSessions = await Consultation.find({
        patientId,
        providerId: therapistProfile._id,
        providerType: 'therapist',
        sessionType: 'therapy'
      });

      const treatmentSummary = {
        totalSessions: allSessions.length,
        completedSessions: allSessions.filter(s => s.status === 'completed').length,
        upcomingSessions: allSessions.filter(s => 
          s.status === 'scheduled' && new Date(s.scheduledAt) > new Date()
        ).length,
        lastSessionDate: allSessions.length > 0 
          ? allSessions.sort((a, b) => b.scheduledAt - a.scheduledAt)[0].scheduledAt
          : null
      };

      return {
        ...patient,
        treatmentSummary
      };
    }));

    const validPatients = patients.filter(p => p !== null);

    console.log('📊 Valid patients:', validPatients.length);
    console.log('✅ [CONTROLLER] Assigned patients complete');

    res.status(200).json({
      success: true,
      data: { patients: validPatients }
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Get assigned patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned patients',
      error: error.message
    });
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * TREATMENT PLAN CONTROLLERS
 * ═══════════════════════════════════════════════════════════
 */

// @desc    Get assigned treatment plans
// @route   GET /api/therapists/treatment-plans
// @access  Private (therapist only)
async function getAssignedTreatmentPlans(req, res) {
  console.log('🔥 [CONTROLLER] getAssignedTreatmentPlans - START');
  console.log('👤 User ID:', req.user?.id);
  console.log('🔍 Filters:', req.query);
  
  try {
    const therapistId = req.user.id;
    const filters = req.query;
    
    const therapistProfile = await therapistService.getTherapistByUserId(therapistId);
    
    if (!therapistProfile) {
      console.log('❌ [CONTROLLER] Therapist profile not found');
      return res.status(404).json({
        success: false,
        message: 'Therapist profile not found'
      });
    }
    
    console.log('✅ [CONTROLLER] Therapist found:', therapistProfile._id);
    
    const treatmentPlans = await therapistService.getAssignedTreatmentPlans(
      therapistProfile._id, 
      filters
    );
    
    console.log('📊 Treatment plans found:', treatmentPlans.length);
    console.log('✅ [CONTROLLER] Treatment plans complete');
    
    res.json({
      success: true,
      message: 'Treatment plans retrieved successfully',
      data: {
        treatmentPlans,
        count: treatmentPlans.length
      }
    });
  } catch (error) {
    console.error('❌ [CONTROLLER] Get treatment plans error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


// @desc    Update treatment progress
// @route   PUT /api/treatment-plans/:id/progress
// @access  Private (therapist only)
async function updateTreatmentProgress(req, res) {
  console.log('🔥 [CONTROLLER] updateTreatmentProgress - START');
  console.log('🆔 Plan ID:', req.params.id);
  console.log('📦 Progress Data:', JSON.stringify(req.body, null, 2));
  
  try {
    const { id } = req.params;
    const progressData = req.body;
    
    const result = await therapistService.updateTreatmentProgress(id, progressData);
    
    console.log('✅ [CONTROLLER] Treatment progress updated');
    
    res.json({
      success: true,
      message: 'Treatment progress updated successfully',
      data: result.treatmentPlan
    });
  } catch (error) {
    console.error('❌ [CONTROLLER] Update treatment progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// @desc    Create treatment plan
// @route   POST /api/therapists/treatment-plans
// @access  Private (therapist only)
async function createTreatmentPlan(req, res) {
  console.log('🔥 [CONTROLLER] createTreatmentPlan - START');
  console.log('👤 User ID:', req.user?._id);
  console.log('📦 Plan Data:', JSON.stringify(req.body, null, 2));
  
  try {
    const data = req.body;
    const result = await therapistService.createTreatmentPlan(data, req.user._id);
    
    console.log('✅ [CONTROLLER] Treatment plan created');
    
    res.status(201).json({
      success: true,
      message: 'Treatment plan created successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ [CONTROLLER] Create treatment plan error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}




// 🔥 NEW: Update session progress (for slide navigation)
async function updateSessionProgress(req, res) {
  console.log('🔥 [CONTROLLER] updateSessionProgress - START');
  console.log('🆔 Session ID:', req.params.sessionId);
  console.log('📦 Progress Data:', JSON.stringify(req.body, null, 2));
  
  try {
    const { sessionId } = req.params;
    const progressData = req.body;
    
    const Consultation = require('../models/Consultation');
    
    const session = await Consultation.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Update vitals if provided
    if (progressData.vitals) {
      session.therapyData = session.therapyData || {};
      session.therapyData.vitals = {
        ...session.therapyData.vitals,
        ...progressData.vitals,
        measuredAt: new Date()
      };
    }

    // Update observations if provided
    if (progressData.observations) {
      session.therapyData = session.therapyData || {};
      session.therapyData.observations = {
        ...session.therapyData.observations,
        ...progressData.observations
      };
    }

    // Update progress stages
    if (progressData.progressUpdate) {
      session.therapyData.progressUpdates = session.therapyData.progressUpdates || [];
      session.therapyData.progressUpdates.push({
        timestamp: new Date(),
        stage: progressData.progressUpdate.stage,
        notes: progressData.progressUpdate.notes,
        percentage: progressData.progressUpdate.percentage
      });
    }

    // Update session metadata
    session.sessionMetadata.lastActivity = new Date();

    await session.save();

    console.log('✅ [CONTROLLER] Session progress updated');

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: session
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Update session progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// 🔥 NEW: Update vitals only
async function updateVitals(req, res) {
  console.log('🔥 [CONTROLLER] updateVitals - START');
  
  try {
    const { sessionId } = req.params;
    const { vitals } = req.body;
    
    const Consultation = require('../models/Consultation');
    const session = await Consultation.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.therapyData = session.therapyData || {};
    session.therapyData.vitals = {
      ...session.therapyData.vitals,
      ...vitals,
      measuredAt: new Date()
    };

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Vitals updated successfully',
      data: session.therapyData.vitals
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Update vitals error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// 🔥 NEW: Update observations only
async function updateObservations(req, res) {
  console.log('🔥 [CONTROLLER] updateObservations - START');
  
  try {
    const { sessionId } = req.params;
    const { observations } = req.body;
    
    const Consultation = require('../models/Consultation');
    const session = await Consultation.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.therapyData = session.therapyData || {};
    session.therapyData.observations = {
      ...session.therapyData.observations,
      ...observations
    };

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Observations updated successfully',
      data: session.therapyData.observations
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Update observations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// 🔥 NEW: Add adverse effect
async function addAdverseEffect(req, res) {
  console.log('🔥 [CONTROLLER] addAdverseEffect - START');
  
  try {
    const { sessionId } = req.params;
    const { effect, severity, description, actionTaken } = req.body;
    
    const Consultation = require('../models/Consultation');
    const session = await Consultation.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.therapyData = session.therapyData || {};
    session.therapyData.adverseEffects = session.therapyData.adverseEffects || [];
    
    session.therapyData.adverseEffects.push({
      effect,
      severity,
      description,
      occurredAt: new Date(),
      actionTaken,
      resolved: false
    });

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Adverse effect added successfully',
      data: session.therapyData.adverseEffects
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Add adverse effect error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// 🔥 NEW: Add material used
async function addMaterialUsed(req, res) {
  console.log('🔥 [CONTROLLER] addMaterialUsed - START');
  
  try {
    const { sessionId } = req.params;
    const { name, quantity, unit, batchNumber } = req.body;
    
    const Consultation = require('../models/Consultation');
    const session = await Consultation.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.therapyData = session.therapyData || {};
    session.therapyData.materialsUsed = session.therapyData.materialsUsed || [];
    
    session.therapyData.materialsUsed.push({
      name,
      quantity,
      unit,
      batchNumber
    });

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Material added successfully',
      data: session.therapyData.materialsUsed
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Add material used error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}



// src/controllers/therapist.controller.js

/**
 * Get all treatment plans for a patient
 * GET /api/therapists/patients/:patientId/treatment-plans
 */
async function getPatientTreatmentPlans(req, res) {
  console.log('🔥 [CONTROLLER] getPatientTreatmentPlans called');
  
  try {
    const { patientId } = req.params;
    
    console.log('Patient ID:', patientId);
    console.log('Therapist ID:', req.user._id);
    
    const treatmentPlans = await therapistService.getPatientTreatmentPlans(patientId);
    
    return res.json({
      success: true,
      message: `Found ${treatmentPlans.length} treatment plans`,
      data: treatmentPlans
    });
    
  } catch (error) {
    console.error('❌ [CONTROLLER] Get patient treatment plans error:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch treatment plans',
      data: []
    });
  }
}


/**
 * Get treatment plan details
 * GET /api/therapists/treatment-plans/:treatmentPlanId
 */
// controllers/therapistController.js
async function getTreatmentPlanDetails(req, res) {
  console.log('🔥 [CONTROLLER] getTreatmentPlanDetails:', {
    treatmentPlanId: req.params.treatmentPlanId,
    therapistId: req.user._id
  });
  
  try {
    const { treatmentPlanId } = req.params;
    const therapist = await therapistService.getTherapistByUserId(req.user.id);

    // 🔥 VALIDATE therapist ownership & populate FULL schema
    const treatmentPlan = await therapistService.getTreatmentPlanDetailsForTherapist(
      treatmentPlanId, 
      therapist._id  // Pass therapistId for ownership check
    );

    console.log('✅ [CONTROLLER] Treatment plan loaded:', {
      patient: treatmentPlan.patientId?.name,
      status: treatmentPlan.status,
      phases: treatmentPlan.phases?.length || 0,
      totalSessions: treatmentPlan.totalSessionsPlanned
    });

    return res.json({
      success: true,
      message: 'Treatment plan retrieved successfully',
      data: treatmentPlan
    });
    
  } catch (error) {
    console.error('❌ [CONTROLLER] Get treatment plan details error:', error);
    
    const statusCode = error.message.includes('not found') || error.message.includes('not assigned') 
      ? 404 
      : 500;
      
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch treatment plan details',
      data: null
    });
  }
}

/**
 * Update treatment plan progress
 * PATCH /api/therapists/treatment-plans/:treatmentPlanId/progress
 */
async function updateTreatmentPlanProgress(req, res) {
  console.log('🔥 [CONTROLLER] updateTreatmentPlanProgress called');
  
  try {
    const { treatmentPlanId } = req.params;
    const progressData = req.body;
    
    console.log('Treatment Plan ID:', treatmentPlanId);
    console.log('Progress Data:', progressData);
    console.log('Therapist ID:', req.user._id);
    
    const treatmentPlan = await therapistService.updateTreatmentPlanProgress(
      treatmentPlanId, 
      progressData
    );
    
    return res.json({
      success: true,
      message: 'Treatment plan progress updated successfully',
      data: treatmentPlan
    });
    
  } catch (error) {
    console.error('❌ [CONTROLLER] Update treatment plan progress error:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update treatment plan progress',
      data: null
    });
  }
}

/**
 * @desc    Get available therapists for treatment assignment
 * @route   GET /api/therapists/available
 * @access  Private (doctor only)
 */
// controllers/therapist.controller.js

async function getAvailableTherapists(req, res) {
  console.log('🔥 [CONTROLLER] getAvailableTherapists - START');
  console.log('📋 Raw query params:', req.query);

  try {
    const filters = {
      specialization: req.query.specialization,
      therapy: req.query.therapy,
      skillLevel: req.query.skillLevel,
      date: req.query.date,
      patientId: req.query.patientId, // from frontend
    };

    console.log('🧩 [CONTROLLER] Parsed filters:', filters);

    const query = {
      isActive: true,
      verificationStatus: 'approved',
    };

    // existing filters…
    if (filters.specialization) {
      query.specialization = { $in: [filters.specialization] };
    }
    if (filters.therapy) {
      query['certifications.therapy'] = filters.therapy;
    }
    if (filters.skillLevel) {
      query['certifications.level'] = filters.skillLevel;
    }

    // ⬅ gender rule: female patient → female therapist
    let userFilter = { role: 'therapist', isActive: true };

    console.log('🧪 [CONTROLLER] Initial userFilter:', userFilter);

    if (filters.patientId) {
      console.log('🔎 [CONTROLLER] Looking up patient for gender filter, patientId =', filters.patientId);

      const patient = await User.findById(filters.patientId)
        .select('role profile.gender')
        .lean();

      console.log('🧍 [CONTROLLER] Loaded patient for filter:', patient);

      if (patient && patient.role === 'patient') {
        const g = patient.profile?.gender;
        console.log('👀 [CONTROLLER] Patient gender:', g);

        if (g === 'female') {
          userFilter['profile.gender'] = 'female';
          console.log('🎯 [CONTROLLER] Applied gender filter: female patient → female therapists only');
        }
        if(g === 'male'){

          userFilter['profile.gender'] =  'male';
          console.log('🎯 [CONTROLLER] Applied gender filter: male patient → male therapists only');
        }
        // if you also want male→male matching, uncomment:
        // if (g === 'male') {
        //   userFilter['profile.gender'] = 'male';
        //   console.log('🎯 [CONTROLLER] Applied gender filter: male patient → male therapists only');
        // }
      } else {
        console.log('⚠️ [CONTROLLER] Patient not found or not role=patient, skipping gender filter');
      }
    } else {
      console.log('ℹ️ [CONTROLLER] No patientId provided, NOT applying gender filter');
    }

    console.log('🧪 [CONTROLLER] Final userFilter for User.find:', userFilter);

    const therapistUsers = await User.find(userFilter)
      .select('_id profile.gender name')
      .lean();

    console.log('📊 [CONTROLLER] therapistUsers count =', therapistUsers.length);
    console.log(
      '📊 [CONTROLLER] therapistUsers sample (first 5):',
      therapistUsers.slice(0, 5).map(u => ({
        _id: u._id,
        gender: u.profile?.gender,
        name: u.name,
      }))
    );

    const therapistUserIds = therapistUsers.map(u => u._id);
    console.log('📊 [CONTROLLER] therapistUserIds length =', therapistUserIds.length);

    // merge therapist user filter into therapist query
    query.userId = { $in: therapistUserIds };

    console.log('📊 [CONTROLLER] Final Therapist query:', JSON.stringify(query, null, 2));

    const therapists = await Therapist.find(query)
      .populate('userId', 'name email phone profile.gender')
      .select(
        'userId certifications availability metrics specialization experienceYears bio isActive'
      )
      .sort({ 'metrics.averageRating': -1, experienceYears: -1 })
      .limit(50)
      .lean();

    console.log(`✅ [CONTROLLER] Found ${therapists.length} available therapists`);
    console.log(
      '✅ [CONTROLLER] Therapists genders (first 10):',
      therapists.slice(0, 10).map(t => ({
        therapistId: t._id,
        userId: t.userId?._id,
        name: t.userId?.name,
        gender: t.userId?.profile?.gender,
      }))
    );

    return res.json({
      success: true,
      data: therapists,
      count: therapists.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [CONTROLLER] Get available therapists error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ... rest of your code ...

// ═══════════════════════════════════════════════════════════


/**
 * ═══════════════════════════════════════════════════════════
 * FEEDBACK CONTROLLERS
 * ═══════════════════════════════════════════════════════════
 */

// @desc    Get therapist feedback/reviews
// @route   GET /api/therapists/feedback
// @access  Private (therapist only)
async function getTherapistFeedback(req, res) {
  console.log('🔥 [CONTROLLER] getTherapistFeedback - START');
  console.log('👤 User ID:', req.user?.id);
  
  try {
    const therapistId = req.user.id;
    
    const therapistProfile = await therapistService.getTherapistByUserId(therapistId);
    
    if (!therapistProfile) {
      console.log('❌ [CONTROLLER] Therapist profile not found');
      return res.status(404).json({
        success: false,
        message: 'Therapist profile not found'
      });
    }

    console.log('✅ [CONTROLLER] Therapist found:', therapistProfile._id);

    const Feedback = require('../models/Feedback');
    
    console.log('🔍 Fetching feedbacks...');
    const feedbacks = await Feedback.find({ therapistId: therapistProfile._id })
      .populate('patientId', 'name profile')
      .populate('sessionId', 'scheduledAt therapyData.therapyType')
      .sort({ createdAt: -1 });

    console.log('📊 Feedbacks found:', feedbacks.length);

    const analytics = {
      totalFeedback: feedbacks.length,
      averageRating: feedbacks.length > 0 
        ? feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0) / feedbacks.length
        : 0,
      ratingDistribution: {
        5: feedbacks.filter(f => f.rating === 5).length,
        4: feedbacks.filter(f => f.rating === 4).length,
        3: feedbacks.filter(f => f.rating === 3).length,
        2: feedbacks.filter(f => f.rating === 2).length,
        1: feedbacks.filter(f => f.rating === 1).length
      },
      positiveRate: feedbacks.length > 0
        ? (feedbacks.filter(f => f.rating >= 4).length / feedbacks.length) * 100
        : 0
    };

    console.log('📊 Analytics:', analytics);
    console.log('✅ [CONTROLLER] Feedback complete');

    res.status(200).json({
      success: true,
      data: {
        feedbacks,
        analytics
      }
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
}

// Export all controllers
module.exports = {
  // Profile & Auth
  registerTherapist,
  getTherapist,
  updateProfile,
  getMyProfile,
  searchTherapists,
  updateAvailability,
  
  // Dashboard & Analytics
  getDashboardOverview,
  getTherapistStats,
  
  // Session Management
  getTodaySessions,
  getPatientSessions,
  startSession,
  completeSession,
  
  // Patient Management
  getAssignedPatients,
  
  // Treatment Plans
  getAssignedTreatmentPlans,
  updateTreatmentProgress,
  createTreatmentPlan,
  
  // Feedback
  getTherapistFeedback,

  // Add to exports
  // ... existing exports
  updateSessionProgress,
  updateVitals,
  updateObservations,
  addAdverseEffect,
  addMaterialUsed,
  getPatientTreatmentPlans,
  getTreatmentPlanDetails,
  updateTreatmentPlanProgress,
  getAvailableTherapists, // 🔥 ADD THIS

};
