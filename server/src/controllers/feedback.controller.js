// controllers/feedback.controller.js
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const Feedback = require('../models/Feedback');
const FeedbackService = require('../services/feedback.service');
const FeedbackAnalyticsService = require('../services/feedbackAnalytics.service');
const therapistApiService = require('../services/therapist.service');
const mongoose = require('mongoose')
class FeedbackController {
  // ============ PATIENT FEEDBACK ============

  // Patient submits feedback after each therapy/consultation
  // submitFeedback = asyncHandler(async (req, res) => {
  //   const { sessionId, sessionType, providerId, therapyType } = req.body;

  //   if (!sessionId || !sessionType || !providerId || !therapyType) {
  //     throw new AppError('sessionId, sessionType, providerId, therapyType are required', 400, 'VALIDATION_ERROR');
  //   }

  //   const feedbackData = {
  //     ...req.body,
  //     patientId: req.user.role === 'patient' ? req.user._id : req.body.patientId,
  //   };

  //   if (!feedbackData.patientId) {
  //     throw new AppError('Patient ID is required', 400, 'VALIDATION_ERROR');
  //   }

  //   // createFeedback will apply schema defaults, flags, visibility, etc.
  //   const feedback = await FeedbackService.createFeedback(feedbackData);

  //   // patient progress analytics (non‑blocking)
  //   let analytics = null;
  //   try {
  //     analytics = await FeedbackAnalyticsService.updatePatientProgress(feedback.patientId);
  //   } catch (err) {
  //     analytics = {
  //       error: 'Analytics processing failed',
  //       message: 'Feedback saved successfully without analytics',
  //     };
  //   }

  //   // critical alerts to admins (side effects, very low ratings etc.)
  //   try {
  //     if (feedback.requiresImmediateAttention && feedback.requiresImmediateAttention()) {
  //       const wsService = req.app.get('wsService');
  //       if (wsService) {
  //         wsService.emitToAdmins('critical_feedback', {
  //           feedbackId: feedback._id,
  //           patientId: feedback.patientId,
  //           providerId: feedback.providerId,
  //           severity: 'high',
  //         });
  //       }
  //     }
  //   } catch (err) {
  //     // ignore websocket errors
  //   }

  //   return res.status(201).json({
  //     success: true,
  //     message: 'Feedback submitted successfully',
  //     data: { feedback, analytics },
  //   });
  // });

  createFeedback = async (req, res) => {
    try {
      const patientId = req.user._id; // from auth middleware
  
      const {
        sessionId,
        sessionType,        // 'consultation' | 'therapy_session'
        providerId,
        therapyType,        // e.g. 'panchakarma'
        ratings,
        healthMetrics,
        textFeedback,
        recommendationScore,
        wouldReturnForTreatment,
        wouldRecommendToOthers,
      } = req.body;
  
      if (!sessionId || !sessionType || !providerId || !therapyType) {
        return res.status(400).json({
          success: false,
          message: 'sessionId, sessionType, providerId and therapyType are required',
        });
      }
  
      // build minimal doc – everything else stays optional in schema
      const feedback = await Feedback.create({
        patientId,
        sessionId,
        sessionType,
        providerId,
        therapyType,
        ratings: {
          overallSatisfaction: ratings?.overallSatisfaction,
          treatmentEffectiveness: ratings?.treatmentEffectiveness,
          patientCare: ratings?.patientCare,
          facilityQuality: ratings?.facilityQuality,
          therapistProfessionalism: ratings?.therapistProfessionalism,
          communicationQuality: ratings?.communicationQuality,
        },
        healthMetrics,
        textFeedback,
        recommendationScore,
        wouldReturnForTreatment,
        wouldRecommendToOthers,
        submissionMethod: 'web_portal',
      });
  
      return res.status(201).json({
        success: true,
        data: feedback,
      });
    } catch (err) {
      console.error('createFeedback error:', err);
      return res.status(500).json({
        success: false,
        message: 'Could not submit feedback',
      });
    }
  };

  getMyFeedback = async (req, res) => {
    try {
      const patientId = req.user._id;
  
      const feedbacks = await Feedback.find({ patientId })
        .sort({ createdAt: -1 })
        .lean();
  
      return res.json({
        success: true,
        data: feedbacks,
      });
    } catch (err) {
      console.error('getMyFeedback error:', err);
      return res.status(500).json({
        success: false,
        message: 'Could not load feedback',
      });
    }
  };
  
  // Patient: list own feedback
  // getMyFeedback = asyncHandler(async (req, res) => {
  //   const { page = 1, limit = 10, timeRange } = req.query;

  //   const result = await FeedbackService.getPatientFeedback(req.user._id, {
  //     page: parseInt(page, 10),
  //     limit: parseInt(limit, 10),
  //     timeRange,
  //   });

  //   return res.json({ success: true, data: result });
  // });

// ============================================
// 🐛 DEBUGGED FEEDBACK CONTROLLERS
// ============================================

// backend/controllers/feedback.controller.js

// backend/controllers/feedback.controller.js

getDoctorFeedback = async (req, res) => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 [GET_DOCTOR_FEEDBACK] Request received');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // req.user._id could be from Doctor or User collection
    const doctorUserId = req.user._id;
    
    console.log('👤 [USER] Request user info:', {
      userId: doctorUserId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
    });

    // Step 1: Find the Doctor document to get the actual Doctor ID
    const Doctor = mongoose.model('Doctor');
    const doctor = await Doctor.findOne({ userId: doctorUserId }).select('_id').lean();
    
    if (!doctor) {
      console.error('❌ [ERROR] No doctor profile found for user:', doctorUserId);
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const doctorId = doctor._id;
    console.log('✅ [DOCTOR] Doctor profile found:', {
      doctorId,
      userId: doctorUserId,
    });

    // Step 2: Query feedbacks using doctorId
    console.log('🔍 [QUERY] Building feedback query:', {
      doctorId,
      'visibility.toDoctor': true,
    });

    const feedbacks = await Feedback.find({
      doctorId: doctorUserId, // ✅ Using doctorId instead of providerId
      'visibility.toDoctor': true,
    })
      .populate('patientId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    console.log('✅ [RESULT] Query completed:', {
      count: feedbacks.length,
      feedbackIds: feedbacks.map(f => f._id),
    });

    if (feedbacks.length > 0) {
      console.log('📋 [RESULT] First feedback sample:', {
        _id: feedbacks[0]._id,
        patientName: feedbacks[0].patientId?.name,
        doctorId: feedbacks[0].doctorId,
        providerId: feedbacks[0].providerId,
        status: feedbacks[0].status,
        ratings: feedbacks[0].ratings,
        createdAt: feedbacks[0].createdAt,
      });
    }

    console.log('📤 [RESPONSE] Sending response with', feedbacks.length, 'feedbacks');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return res.json({
      success: true,
      data: feedbacks,
    });
  } catch (err) {
    console.error('❌ [ERROR] getDoctorFeedback error:', {
      message: err.message,
      stack: err.stack,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return res.status(500).json({
      success: false,
      message: 'Could not load doctor feedback',
    });
  }
};

getDoctorFeedbackById = async (req, res) => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 [GET_DOCTOR_FEEDBACK_BY_ID] Request received');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const doctorUserId = req.user._id;
    const { id } = req.params;

    // Get Doctor ID
    const Doctor = mongoose.model('Doctor');
    const doctor = await Doctor.findOne({ userId: doctorUserId }).select('_id').lean();
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const doctorId = doctor._id;

    console.log('👤 [USER] Request info:', {
      doctorId,
      feedbackId: id,
    });

    const feedback = await Feedback.findOne({
      _id: id,
      doctorId: doctorId, // ✅ Using doctorId
      'visibility.toDoctor': true,
    })
      .populate('patientId', 'name email phone')
      .lean();

    if (!feedback) {
      console.log('❌ [NOT_FOUND] Feedback not found');
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    console.log('✅ [FOUND] Feedback retrieved');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return res.json({
      success: true,
      data: feedback,
    });
  } catch (err) {
    console.error('❌ [ERROR] getDoctorFeedbackById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Could not load feedback',
    });
  }
};

reviewFeedbackAsDoctor = async (req, res) => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 [REVIEW_FEEDBACK] Request received');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const doctorUserId = req.user._id;
    const { id } = req.params;
    const { responseText, actionTaken } = req.body;

    // Get Doctor ID
    const Doctor = mongoose.model('Doctor');
    const doctor = await Doctor.findOne({ userId: doctorUserId }).select('_id').lean();
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const doctorId = doctor._id;

    const feedback = await Feedback.findOne({
      _id: id,
      doctorId: doctorId, // ✅ Using doctorId
      'visibility.toDoctor': true,
    });

    if (!feedback) {
      console.log('❌ [NOT_FOUND] Feedback not found');
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    feedback.status = 'reviewed';
    feedback.doctorResponse = {
      responseText: responseText || '',
      respondedBy: doctorUserId,
      respondedAt: new Date(),
      actionTaken: actionTaken || 'no_action',
    };

    await feedback.save();
    await feedback.populate('patientId', 'name email phone');

    console.log('✅ [SAVED] Feedback updated successfully');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return res.json({
      success: true,
      data: feedback,
    });
  } catch (err) {
    console.error('❌ [ERROR] reviewFeedbackAsDoctor error:', err);
    return res.status(500).json({
      success: false,
      message: 'Could not update feedback review',
    });
  }
};


getDoctorFeedbackById = async (req, res) => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 [GET_DOCTOR_FEEDBACK_BY_ID] Request received');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const doctorUserId = req.user._id;
    const { id } = req.params;

    // Get Doctor ID
    const Doctor = mongoose.model('Doctor');
    const doctor = await Doctor.findOne({ userId: doctorUserId }).select('_id').lean();
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const doctorId = doctor._id;

    console.log('👤 [USER] Request info:', {
      doctorId,
      feedbackId: id,
    });

    const feedback = await Feedback.findOne({
      _id: id,
      doctorId: doctorId, // ✅ Using doctorId
      'visibility.toDoctor': true,
    })
      .populate('patientId', 'name email phone')
      .lean();

    if (!feedback) {
      console.log('❌ [NOT_FOUND] Feedback not found');
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    console.log('✅ [FOUND] Feedback retrieved');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return res.json({
      success: true,
      data: feedback,
    });
  } catch (err) {
    console.error('❌ [ERROR] getDoctorFeedbackById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Could not load feedback',
    });
  }
};
reviewFeedbackAsDoctor = async (req, res) => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 [REVIEW_FEEDBACK] Request received');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const doctorUserId = req.user._id;
    const { id } = req.params;
    const { responseText, actionTaken } = req.body;

    console.log('👤 [USER] Request user info:', {
      userId: doctorUserId,
      userName: req.user.name,
      feedbackId: id,
    });

    console.log('📦 [BODY] Request body:', {
      responseText: responseText?.substring(0, 50) + '...',
      responseTextLength: responseText?.length,
      actionTaken,
    });

    // Step 1: Find the Doctor document to get the actual Doctor ID
    const Doctor = mongoose.model('Doctor');
    const doctor = await Doctor.findOne({ userId: doctorUserId }).select('_id').lean();
    
    if (!doctor) {
      console.error('❌ [ERROR] No doctor profile found for user:', doctorUserId);
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const doctorId = doctor._id;
    console.log('✅ [DOCTOR] Doctor profile found:', {
      doctorId,
      userId: doctorUserId,
    });

    // Step 2: Find feedback using doctorId
    console.log('🔍 [QUERY] Finding feedback to update:', {
      _id: id,
      doctorId,
      'visibility.toDoctor': true,
    });

    const feedback = await Feedback.findOne({
      _id: id,
      doctorId: doctorUserId, // ✅ Using doctorUserId (same as getDoctorFeedback)
      'visibility.toDoctor': true,
    });

    if (!feedback) {
      console.log('❌ [NOT_FOUND] Feedback not found');
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    console.log('✅ [FOUND] Feedback found, current state:', {
      _id: feedback._id,
      currentStatus: feedback.status,
      hasExistingResponse: !!feedback.doctorResponse,
    });

    // Step 3: Update feedback
    feedback.status = 'reviewed';
    feedback.doctorResponse = {
      responseText: responseText || '',
      respondedBy: doctorUserId,
      respondedAt: new Date(),
      actionTaken: actionTaken || 'no_action',
    };

    console.log('🔄 [UPDATE] Saving feedback with new response:', {
      newStatus: feedback.status,
      responseLength: feedback.doctorResponse.responseText.length,
      actionTaken: feedback.doctorResponse.actionTaken,
    });

    await feedback.save();

    console.log('✅ [SAVED] Feedback saved successfully');

    // Step 4: Populate patient info before sending
    await feedback.populate('patientId', 'name email phone');

    console.log('📤 [RESPONSE] Sending updated feedback');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return res.json({
      success: true,
      data: feedback,
    });
  } catch (err) {
    console.error('❌ [ERROR] reviewFeedbackAsDoctor error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return res.status(500).json({
      success: false,
      message: 'Could not update feedback review',
    });
  }
};


// getDoctorFeedbackById = async (req, res) => {


//   console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//   console.log('🔍 [GET_DOCTOR_FEEDBACK_BY_ID] Request received');
//   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
//   try {
//     const doctorId = req.user._id;
//     const { id } = req.params;

//     console.log('👤 [USER] Request info:', {
//       doctorId,
//       doctorName: req.user.name,
//       feedbackId: id,
//     });

//     console.log('🔍 [QUERY] Finding feedback:', {
//       _id: id,
//       providerId: doctorId,
//       'visibility.toDoctor': true,
//     });

//     const feedback = await Feedback.findOne({
//       _id: id,
//       providerId: doctorId,
//       'visibility.toDoctor': true,
//     })
//       .populate('patientId', 'name email phone')
//       .lean();

//     if (!feedback) {
//       console.log('❌ [NOT_FOUND] Feedback not found with given criteria');
      
//       // Debug: Check if feedback exists at all
//       const feedbackExists = await Feedback.findById(id).lean();
//       console.log('🔍 [DEBUG] Feedback exists in DB:', !!feedbackExists);
      
//       if (feedbackExists) {
//         console.log('🔍 [DEBUG] Feedback details:', {
//           _id: feedbackExists._id,
//           providerId: feedbackExists.providerId,
//           providerIdMatches: feedbackExists.providerId.toString() === doctorId.toString(),
//           visibility: feedbackExists.visibility,
//         });
//       }
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
//       return res.status(404).json({
//         success: false,
//         message: 'Feedback not found',
//       });
//     }

//     console.log('✅ [FOUND] Feedback retrieved:', {
//       _id: feedback._id,
//       patientName: feedback.patientId?.name,
//       status: feedback.status,
//       ratings: feedback.ratings,
//     });
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

//     return res.json({
//       success: true,
//       data: feedback,
//     });
//   } catch (err) {
//     console.error('❌ [ERROR] getDoctorFeedbackById error:', {
//       message: err.message,
//       stack: err.stack,
//     });
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
//     return res.status(500).json({
//       success: false,
//       message: 'Could not load feedback',
//     });
//   }
// };

// PATCH /api/feedback/doctor/:id/review
// doctor reviews feedback and updates treatment plan status / notes
// reviewFeedbackAsDoctor = async (req, res) => {
//   console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//   console.log('📝 [REVIEW_FEEDBACK] Request received');
//   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
//   try {
//     const doctorId = req.user._id;
//     const { id } = req.params;
//     const { responseText, actionTaken } = req.body;

//     console.log('👤 [USER] Request info:', {
//       doctorId,
//       doctorName: req.user.name,
//       feedbackId: id,
//     });

//     console.log('📦 [BODY] Request body:', {
//       responseText: responseText?.substring(0, 100) + '...',
//       responseTextLength: responseText?.length,
//       actionTaken,
//     });

//     console.log('🔍 [QUERY] Finding feedback to update:', {
//       _id: id,
//       providerId: doctorId,
//       'visibility.toDoctor': true,
//     });

//     const feedback = await Feedback.findOne({
//       _id: id,
//       providerId: doctorId,
//       'visibility.toDoctor': true,
//     });

//     if (!feedback) {
//       console.log('❌ [NOT_FOUND] Feedback not found');
      
//       // Debug
//       const feedbackExists = await Feedback.findById(id).lean();
//       console.log('🔍 [DEBUG] Feedback exists:', !!feedbackExists);
//       if (feedbackExists) {
//         console.log('🔍 [DEBUG] Mismatch reason:', {
//           providerId: feedbackExists.providerId,
//           requestDoctorId: doctorId,
//           idsMatch: feedbackExists.providerId.toString() === doctorId.toString(),
//           visibility: feedbackExists.visibility,
//         });
//       }
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
//       return res.status(404).json({
//         success: false,
//         message: 'Feedback not found',
//       });
//     }

//     console.log('✅ [FOUND] Feedback found, current state:', {
//       _id: feedback._id,
//       currentStatus: feedback.status,
//       hasExistingResponse: !!feedback.doctorResponse,
//     });

//     // Update feedback
//     feedback.status = 'reviewed';
//     feedback.doctorResponse = {
//       responseText: responseText || '',
//       respondedBy: doctorId,
//       respondedAt: new Date(),
//       actionTaken: actionTaken || 'no_action',
//     };

//     console.log('🔄 [UPDATE] Saving feedback with new response:', {
//       newStatus: feedback.status,
//       responseLength: feedback.doctorResponse.responseText.length,
//       actionTaken: feedback.doctorResponse.actionTaken,
//     });

//     await feedback.save();

//     console.log('✅ [SAVED] Feedback updated successfully');

//     // Populate patient info before sending
//     await feedback.populate('patientId', 'name email phone');

//     console.log('📤 [RESPONSE] Sending updated feedback');
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

//     return res.json({
//       success: true,
//       data: feedback,
//     });
//   } catch (err) {
//     console.error('❌ [ERROR] reviewFeedbackAsDoctor error:', {
//       message: err.message,
//       stack: err.stack,
//       name: err.name,
//     });
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
//     return res.status(500).json({
//       success: false,
//       message: 'Could not update feedback review',
//     });
//   }
// };


  // Patient: feedback for a particular session
 
 
  getSessionFeedback = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const feedback = await FeedbackService.getSessionFeedback(sessionId, req.user._id);
    if (!feedback) {
      throw new AppError('No feedback found for this session', 404, 'FEEDBACK_NOT_FOUND');
    }

    return res.json({ success: true, data: { feedback } });
  });

  // Patient: update own feedback within 24h
  updateMyFeedback = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;

    const feedback = await FeedbackService.updateFeedback(feedbackId, req.body, req.user._id);

    return res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: { feedback },
    });
  });

  // ============ PROVIDER (DOCTOR / THERAPIST) ============

  // Provider: feedback for own sessions (doctor / therapist dashboard)
  getProviderFeedback = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, timeRange = '3months' } = req.query;

    // If you use therapistApiService only for therapists, keep it; otherwise use req.user._id directly
    const therapist = await therapistApiService.getTherapistByUserId(req.user._id);
    const providerId = therapist ? therapist._id : req.user._id;

    const result = await FeedbackService.getProviderFeedback(providerId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      timeRange,
    });

    return res.json({ success: true, data: result });
  });

  // Provider: analytics (NPS, trends, etc.)
  getProviderAnalytics = asyncHandler(async (req, res) => {
    const { timeRange = '6months' } = req.query;

    const analytics = await FeedbackAnalyticsService.getProviderAnalytics(req.user._id, timeRange);

    return res.json({ success: true, data: analytics });
  });

  // ============ ADMIN ============

  // Admin: list all feedback (with filters)
  getAllFeedback = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      status,
      providerId,
      therapyType,
      requiresAttention,
      toDoctor,
      toAdmin,
      timeRange = '1month',
    } = req.query;

    const filters = {
      ...(status && { status }),
      ...(providerId && { providerId }),
      ...(therapyType && { therapyType }),
      ...(requiresAttention === 'true' && { 'flags.requiresAttention': true }),
      ...(toDoctor === 'true' && { 'visibility.toDoctor': true }),
      ...(toAdmin === 'true' && { 'visibility.toAdmin': true }),
    };

    const result = await FeedbackService.getAllFeedback({
      filters,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      timeRange,
    });

    return res.json({ success: true, data: result });
  });

  // Admin: dashboard stats (global)
  getFeedbackStats = asyncHandler(async (req, res) => {
    const stats = await FeedbackService.getFeedbackStats();
    return res.json({ success: true, data: stats });
  });

  // Admin / Provider: patient progress view
  getPatientProgress = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { timeRange = '6months' } = req.query;

    const progress = await FeedbackAnalyticsService.getPatientProgressAnalytics(patientId, timeRange);

    return res.json({ success: true, data: progress });
  });

  // Respond to feedback (doctor or admin branch)
  respondToFeedback = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;
    const { responseText, actionTaken, responderRole } = req.body; // responderRole: 'doctor' | 'admin'

    const feedback = await FeedbackService.respondToFeedback(feedbackId, {
      responseText,
      actionTaken,
      responderRole: responderRole || req.user.role,
      respondedBy: req.user._id,
      respondedAt: new Date(),
    });

    // notify patient via WS (non‑critical)
    try {
      const wsService = req.app.get('wsService');
      if (wsService && feedback.patientId) {
        wsService.emitToUser(feedback.patientId, 'feedback_response', {
          feedbackId: feedback._id,
          responseText,
          responderRole: responderRole || req.user.role,
          respondedBy: req.user.name || req.user.email,
        });
      }
    } catch (e) {
      // ignore
    }

    return res.json({
      success: true,
      message: 'Response added successfully',
      data: { feedback },
    });
  });

  // Admin: flag feedback
  flagFeedback = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;
    const { flag, reason } = req.body;

    const feedback = await FeedbackService.flagFeedback(feedbackId, flag, reason);

    return res.json({
      success: true,
      message: 'Feedback flagged successfully',
      data: { feedback },
    });
  });

  // Admin: queue of feedback requiring attention
  getAttentionRequired = asyncHandler(async (req, res) => {
    const result = await FeedbackService.getFeedbackRequiringAttention();

    return res.json({
      success: true,
      data: {
        feedback: result,
        totalCount: result.length,
      },
    });
  });

  // Analytics dashboard (overall)
  getAnalyticsDashboard = asyncHandler(async (req, res) => {
    const { timeRange = '6months' } = req.query;

    const dashboard = await FeedbackAnalyticsService.getOverallStats(timeRange);

    return res.json({ success: true, data: dashboard });
  });

  // Trends for a particular metric
  getImprovementTrends = asyncHandler(async (req, res) => {
    const { timeRange = '1year', metric = 'overallWellbeing' } = req.query;

    const trends = await FeedbackAnalyticsService.getImprovementTrends(metric, timeRange);

    return res.json({ success: true, data: trends });
  });

  // Export feedback (for admin reporting)
  exportFeedbackData = asyncHandler(async (req, res) => {
    const { format = 'json', timeRange = '1year', filters = {} } = req.body;

    const exportData = await FeedbackService.exportFeedbackData({ format, timeRange, filters });

    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=feedback-export.${format}`);

    return res.send(exportData);
  });
}

module.exports = new FeedbackController();
