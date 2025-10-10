const { asyncHandler, AppError } = require('../middleware/error.middleware');
const Feedback = require('../models/Feedback');
const FeedbackService = require('../services/feedback.service');
const FeedbackAnalyticsService = require('../services/feedbackAnalytics.service');

class FeedbackController {
  
  // ============ PATIENT FEEDBACK OPERATIONS ============
  
  // Submit new feedback
  submitFeedback = asyncHandler(async (req, res) => {
    console.log('📝 Starting feedback submission...');
    
    try {
      const feedbackData = {
        ...req.body,
        patientId: req.user.role === 'patient' ? req.user._id : req.body.patientId
      };
  
      if (!feedbackData.patientId) {
        throw new AppError('Patient ID is required', 400, 'VALIDATION_ERROR');
      }
  
      console.log('💾 Saving feedback to database...');
      const feedback = new Feedback(feedbackData);
      await feedback.save();
      console.log('✅ Feedback saved successfully:', feedback._id);
  
      // ✅ SAFE ANALYTICS WITH ERROR HANDLING
      let analytics = null;
      try {
        console.log('📊 Starting analytics processing...');
        analytics = await FeedbackAnalyticsService.updatePatientProgress(feedback.patientId);
        console.log('✅ Analytics completed successfully');
      } catch (analyticsError) {
        console.error('🚨 ANALYTICS ERROR:', analyticsError.message);
        console.error('🚨 ANALYTICS STACK:', analyticsError.stack);
        analytics = { 
          error: 'Analytics processing failed', 
          message: 'Feedback saved successfully without analytics' 
        };
      }
  
      // ✅ SAFE WEBSOCKET WITH ERROR HANDLING
      try {
        if (feedback.requiresImmediateAttention && feedback.requiresImmediateAttention()) {
          console.log('🔔 Sending critical feedback alert...');
          const wsService = req.app.get('wsService');
          if (wsService) {
            wsService.emitToAdmins('critical_feedback', {
              feedbackId: feedback._id,
              patientId: feedback.patientId,
              providerId: feedback.providerId,
              severity: 'high'
            });
            console.log('✅ WebSocket alert sent');
          } else {
            console.log('⚠️  WebSocket service not available');
          }
        }
      } catch (wsError) {
        console.error('🚨 WEBSOCKET ERROR:', wsError.message);
        // Don't fail the request for WebSocket errors
      }
  
      console.log('📤 Sending response...');
      return res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: { 
          feedback: feedback,
          analytics: analytics
        }
      });
  
    } catch (error) {
      console.error('🚨 MAIN ERROR in submitFeedback:', error.message);
      console.error('🚨 FULL STACK TRACE:', error.stack);
      throw error; // This will be caught by asyncHandler
    }
  });
  
  
  // Get patient's own feedback
  getMyFeedback = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    const result = await FeedbackService.getPatientFeedback(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    return res.json({
      success: true,
      data: result
    });
  }); // Get feedback for specific session
  getSessionFeedback = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const feedback = await FeedbackService.getSessionFeedback(sessionId, req.user._id);
    
    if (!feedback) {
      throw new AppError('No feedback found for this session', 404, 'FEEDBACK_NOT_FOUND');
    }

    return res.json({
      success: true,
      data: { feedback }
    });
  });
 // Update feedback (within 24 hours)
  updateMyFeedback = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;
    
    const feedback = await FeedbackService.updateFeedback(feedbackId, req.body, req.user._id);
    
    return res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: { feedback }
    });
  });

  // ============ PROVIDER FEEDBACK OPERATIONS ============

  // Get feedback for provider's sessions
  getProviderFeedback = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, timeRange = '3months' } = req.query;
    
    const result = await FeedbackService.getProviderFeedback(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      timeRange
    });

    return res.json({
      success: true,
      data: result
    });
  });

  // Get provider performance analytics
  getProviderAnalytics = asyncHandler(async (req, res) => {
    const { timeRange = '6months' } = req.query;
    
    const analytics = await FeedbackAnalyticsService.getProviderAnalytics(req.user._id, timeRange);
    
    return res.json({
      success: true,
      data: analytics
    });
  });

  // ============ ADMIN FEEDBACK OPERATIONS ============

  // Get all feedback with filters
  getAllFeedback = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      status,
      providerId,
      therapyType,
      requiresAttention,
      timeRange = '1month'
    } = req.query;

    const filters = {
      ...(status && { status }),
      ...(providerId && { providerId }),
      ...(therapyType && { therapyType }),
      ...(requiresAttention === 'true' && { 'flags.requiresAttention': true })
    };

    const result = await FeedbackService.getAllFeedback({
      filters,
      page: parseInt(page),
      limit: parseInt(limit),
      timeRange
    });

    return res.json({
      success: true,
      data: result
    });
  });

  // Get feedback statistics
 // In feedback.controller.js
getFeedbackStats = asyncHandler(async (req, res) => {
  try {
    const Feedback = require('../models/Feedback'); // or your model name
    
    // Calculate average rating
    const ratingAgg = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { 
            $avg: '$ratings.overallSatisfaction' // ← Check this field name
          },
          totalFeedback: { $sum: 1 }
        }
      }
    ]);
    
    const stats = {
      overview: {
        totalFeedback: ratingAgg[0]?.totalFeedback || 0,
        averageRating: ratingAgg[0]?.averageRating || 0,
        criticalFeedbackCount: await Feedback.countDocuments({
          'flags.requiresAttention': true
        })
      }
    };
    
    console.log('✅ Feedback stats calculated:', stats);
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Get feedback stats error:', error);
    throw error;
  }
});

  // Get patient progress analytics
  getPatientProgress = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { timeRange = '6months' } = req.query;
    
    try {
      const progress = await FeedbackAnalyticsService.getPatientProgressAnalytics(patientId, timeRange);
      
      return res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Patient progress error:', error);
      
      return res.json({
        success: true,
        data: {
          patientId,
          message: 'Progress analytics are being processed',
          totalSessions: 0,
          generatedAt: new Date()
        }
      });
    }
  });
  // Respond to feedback
  // Respond to feedback
respondToFeedback = asyncHandler(async (req, res) => {
  const { feedbackId } = req.params;
  const { responseText, actionTaken } = req.body;
  
  console.log('📝 Responding to feedback:', feedbackId);
  
  const feedback = await FeedbackService.respondToFeedback(feedbackId, {
    responseText,
    actionTaken,
    respondedBy: req.user._id,
    respondedAt: new Date()
  });

  console.log('✅ Response saved successfully');

  // ✅ SAFE WEBSOCKET NOTIFICATION (don't fail if WebSocket is down)
  try {
    const wsService = req.app.get('wsService');
    if (wsService && feedback.patientId) {
      wsService.emitToUser(feedback.patientId, 'feedback_response', {
        feedbackId: feedback._id,
        responseText,
        respondedBy: req.user.name || req.user.email
      });
      console.log('✅ WebSocket notification sent');
    } else {
      console.log('⚠️  WebSocket service not available or patientId missing');
    }
  } catch (wsError) {
    console.error('⚠️  WebSocket notification failed (non-critical):', wsError.message);
    // Don't throw error - WebSocket failure shouldn't fail the API
  }

  return res.json({
    success: true,
    message: 'Response added successfully',
    data: { feedback }
  });
});

  // Flag feedback for attention
  flagFeedback = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;
    const { flag, reason } = req.body;
    
    const feedback = await FeedbackService.flagFeedback(feedbackId, flag, reason);
    
    return res.json({
      success: true,
      message: 'Feedback flagged successfully',
      data: { feedback }
    });
  });

  // Get feedback requiring attention
 // Get feedback requiring attention
getAttentionRequired = asyncHandler(async (req, res) => {
  console.log('📥 GET /admin/attention-required');

  const result = await FeedbackService.getFeedbackRequiringAttention();
  
  console.log('✅ Attention required feedback:', result.length);

  return res.json({
    success: true,
    data: {
      feedback: result, // ✅ Wrap in object with feedback key
      totalCount: result.length
    }
  });
});

  // ============ ANALYTICS & REPORTING ============
  getAnalyticsDashboard = asyncHandler(async (req, res) => {
    const { timeRange = '6months' } = req.query;
    
    try {
      const dashboard = await FeedbackAnalyticsService.getOverallStats(timeRange);
      
      return res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      console.error('Analytics dashboard error:', error);
      
      // Return basic stats if analytics fail
      return res.json({
        success: true,
        data: {
          overview: {
            totalFeedback: 0,
            criticalFeedbackCount: 0,
            message: 'Analytics are being processed'
          },
          generatedAt: new Date()
        }
      });
    }
  });


  
  // Get improvement trends
  getImprovementTrends = asyncHandler(async (req, res) => {
    const { timeRange = '1year', metric = 'overallWellbeing' } = req.query;
    
    const trends = await FeedbackAnalyticsService.getImprovementTrends(metric, timeRange);
    
    return res.json({
      success: true,
      data: trends
    });
  });

  // Export feedback data
  exportFeedbackData = asyncHandler(async (req, res) => {
    const { format = 'json', timeRange = '1year', filters = {} } = req.body;
    
    const exportData = await FeedbackService.exportFeedbackData({
      format,
      timeRange,
      filters
    });

    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=feedback-export.${format}`);
    
    return res.send(exportData);
  });


  
}

module.exports = new FeedbackController();
