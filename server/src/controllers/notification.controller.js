const { asyncHandler, AppError } = require('../middleware/error.middleware');
const NotificationService = require('../services/notification.service');
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const Feedback = require('../models/Feedback'); // Add if you have this model

class NotificationController {

  // ============ TEST ENDPOINTS ============

  sendTestEmail = asyncHandler(async (req, res) => {
    const { email, subject, templateName, data } = req.body;

    if (!email || !subject || !templateName) {
      throw new AppError('Email, subject, and templateName are required', 400, 'MISSING_FIELDS');
    }

    const result = await NotificationService.sendEmail(email, subject, templateName, data);

    return res.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });
  });

  sendTestSMS = asyncHandler(async (req, res) => {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      throw new AppError('Phone number and message are required', 400, 'MISSING_FIELDS');
    }

    const result = await NotificationService.sendSMS(phoneNumber, message);

    return res.json({
      success: true,
      message: 'Test SMS sent successfully',
      data: result
    });
  });

  testAllConnections = asyncHandler(async (req, res) => {
    const results = await NotificationService.testAllConnections();

    return res.json({
      success: true,
      message: 'Connection tests completed',
      data: results
    });
  });

  // ============ AUTH NOTIFICATIONS ============

  sendVerificationEmail = asyncHandler(async (req, res) => {
    const { email, verificationToken, userName } = req.body;

    if (!email || !verificationToken || !userName) {
      throw new AppError('Email, verificationToken, and userName are required', 400, 'MISSING_FIELDS');
    }

    const result = await NotificationService.sendEmailVerification(email, verificationToken, userName);

    return res.json({
      success: true,
      message: 'Verification email sent successfully',
      data: result
    });
  });

  sendPhoneOTP = asyncHandler(async (req, res) => {
    const { phone, otp, userName } = req.body;

    if (!phone || !otp || !userName) {
      throw new AppError('Phone, OTP, and userName are required', 400, 'MISSING_FIELDS');
    }

    const result = await NotificationService.sendPhoneOTP(phone, otp, userName);

    return res.json({
      success: true,
      message: 'OTP sent successfully',
      data: result
    });
  });

  sendWelcomeEmail = asyncHandler(async (req, res) => {
    const { email, userName } = req.body;

    if (!email || !userName) {
      throw new AppError('Email and userName are required', 400, 'MISSING_FIELDS');
    }

    await NotificationService.sendWelcomeEmail(email, userName);

    return res.json({
      success: true,
      message: 'Welcome email sent successfully'
    });
  });

  // ============ APPOINTMENT NOTIFICATIONS ============

  sendAppointmentConfirmation = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email')
      .populate('providerId', 'name');

    if (!consultation) {
      throw new AppError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

    const appointmentData = {
      patientEmail: consultation.patientId.email,
      patientName: consultation.patientId.name,
      therapyType: consultation.therapyType || consultation.sessionType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt,
      appointmentId: consultation._id,
      centerName: consultation.centerName || 'AyurSutra Wellness Center'
    };

    const result = await NotificationService.sendAppointmentConfirmation(appointmentData);

    return res.json({
      success: true,
      message: 'Appointment confirmation sent',
      data: result
    });
  });

  sendAppointmentReminder = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email');

    if (!consultation) {
      throw new AppError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

    const appointmentData = {
      patientEmail: consultation.patientId.email,
      patientName: consultation.patientId.name,
      therapyType: consultation.therapyType || consultation.sessionType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt,
      centerName: consultation.centerName || 'AyurSutra Wellness Center'
    };

    const result = await NotificationService.sendAppointmentReminder(appointmentData);

    return res.json({
      success: true,
      message: 'Appointment reminder sent',
      data: result
    });
  });

  sendAppointmentCancellation = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;
    const { reason } = req.body;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email');

    if (!consultation) {
      throw new AppError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

    const appointmentData = {
      patientEmail: consultation.patientId.email,
      patientName: consultation.patientId.name,
      therapyType: consultation.therapyType || consultation.sessionType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt,
      reason: reason || 'Unavoidable circumstances',
      clinicName: consultation.centerName || 'AyurSutra Wellness Center',
      clinicPhone: '+91 98765 43210',
      clinicEmail: 'contact@ayursutra.com'
    };

    const result = await NotificationService.sendAppointmentCancellation(appointmentData);

    return res.json({
      success: true,
      message: 'Appointment cancellation notification sent',
      data: result
    });
  });

  sendFeedbackRequest = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email');

    if (!consultation) {
      throw new AppError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

    if (consultation.status !== 'completed') {
      throw new AppError('Can only request feedback for completed sessions', 400, 'INVALID_SESSION_STATUS');
    }

    const consultationData = {
      patientEmail: consultation.patientId.email,
      patientName: consultation.patientId.name,
      therapyType: consultation.therapyType || consultation.sessionType || 'Panchakarma',
      sessionId: consultation._id,
      centerName: consultation.centerName || 'AyurSutra Wellness Center'
    };

    const result = await NotificationService.sendFeedbackRequest(consultationData);

    return res.json({
      success: true,
      message: 'Feedback request sent',
      data: result
    });
  });

  // ============ PRE & POST THERAPY NOTIFICATIONS ============

  sendPreTherapyInstructions = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email');

    if (!consultation) {
      throw new AppError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

    const appointmentData = {
      patientEmail: consultation.patientId.email,
      patientName: consultation.patientId.name,
      therapyType: consultation.therapyType || consultation.sessionType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt,
      clinicName: consultation.centerName || 'AyurSutra Wellness Center',
      clinicPhone: '+91 98765 43210',
      clinicEmail: 'contact@ayursutra.com'
    };

    const result = await NotificationService.sendPreTherapyInstructions(appointmentData);

    return res.json({
      success: true,
      message: 'Pre-therapy instructions sent',
      data: result
    });
  });

  sendPostTherapyCare = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email');

    if (!consultation) {
      throw new AppError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

    if (consultation.status !== 'completed') {
      throw new AppError('Can only send post-care for completed sessions', 400, 'INVALID_SESSION_STATUS');
    }

    const consultationData = {
      patientEmail: consultation.patientId.email,
      patientName: consultation.patientId.name,
      therapyType: consultation.therapyType || consultation.sessionType || 'Panchakarma',
      nextSessionDate: consultation.nextSessionDate,
      clinicName: consultation.centerName || 'AyurSutra Wellness Center',
      clinicEmail: 'contact@ayursutra.com',
      clinicPhone: '+91 98765 43210'
    };

    const result = await NotificationService.sendPostTherapyCare(consultationData);

    return res.json({
      success: true,
      message: 'Post-therapy care instructions sent',
      data: result
    });
  });

  // ============ ADMIN NOTIFICATIONS ============

  sendNewPatientAlert = asyncHandler(async (req, res) => {
    const { patientId } = req.body;

    const patient = await User.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');
    }

    // Get total patient count
    const totalPatients = await User.countDocuments({ role: 'patient' });

    const patientData = {
      _id: patient._id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      totalPatients
    };

    const result = await NotificationService.sendNewPatientAlert(patientData);

    return res.json({
      success: true,
      message: 'Admin alert sent for new patient registration',
      data: result
    });
  });

  sendNewAppointmentAlert = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email')
      .populate('providerId', 'name');

    if (!consultation) {
      throw new AppError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

    const appointmentData = {
      _id: consultation._id,
      patientName: consultation.patientId.name,
      therapyType: consultation.therapyType || consultation.sessionType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt,
      therapistName: consultation.providerId?.name || 'Not assigned',
      fee: consultation.fee || 0
    };

    const result = await NotificationService.sendNewAppointmentAlert(appointmentData);

    return res.json({
      success: true,
      message: 'Admin alert sent for new appointment',
      data: result
    });
  });

  sendCriticalFeedbackAlert = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;

    let feedbackData;

    // If feedbackId provided, fetch from database
    if (feedbackId) {
      const feedback = await Feedback.findById(feedbackId)
        .populate('patientId', 'name')
        .populate('providerId', 'name')
        .populate('consultationId', 'therapyType sessionType scheduledAt');

      if (!feedback) {
        throw new AppError('Feedback not found', 404, 'FEEDBACK_NOT_FOUND');
      }

      feedbackData = {
        _id: feedback._id,
        patientName: feedback.patientId?.name || 'Unknown Patient',
        therapyType: feedback.consultationId?.therapyType || feedback.consultationId?.sessionType || 'Unknown',
        therapistName: feedback.providerId?.name || 'Unknown Therapist',
        rating: feedback.averageRating || feedback.rating || 0,
        concerns: feedback.textFeedback?.concernsOrIssues || feedback.concerns || 'No concerns specified',
        recommendations: feedback.recommendations || 'None',
        sessionDate: feedback.consultationId?.scheduledAt || feedback.createdAt
      };
    } else {
      // Use body data if no feedbackId
      feedbackData = req.body;

      if (!feedbackData.patientName || !feedbackData.therapyType || !feedbackData.rating) {
        throw new AppError('Patient name, therapy type, and rating are required', 400, 'MISSING_FIELDS');
      }
    }

    const result = await NotificationService.sendCriticalFeedbackAlert(feedbackData);

    return res.json({
      success: true,
      message: 'Critical feedback alert sent to admin',
      data: result
    });
  });

  sendDailySummary = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate summary data
    const [
      newPatients,
      totalAppointments,
      completedSessions,
      cancelledSessions,
      pendingFeedback,
      upcomingTomorrow
    ] = await Promise.all([
      User.countDocuments({ 
        role: 'patient', 
        createdAt: { $gte: today, $lt: tomorrow } 
      }),
      Consultation.countDocuments({ 
        scheduledAt: { $gte: today, $lt: tomorrow } 
      }),
      Consultation.countDocuments({ 
        status: 'completed',
        sessionEndTime: { $gte: today, $lt: tomorrow }
      }),
      Consultation.countDocuments({ 
        status: 'cancelled',
        updatedAt: { $gte: today, $lt: tomorrow }
      }),
      Consultation.countDocuments({ 
        status: 'completed',
        feedbackSubmitted: false,
        sessionEndTime: { $lt: today }
      }),
      Consultation.countDocuments({ 
        scheduledAt: { $gte: tomorrow, $lt: new Date(tomorrow.getTime() + 86400000) },
        status: { $in: ['scheduled', 'confirmed'] }
      })
    ]);

    // Calculate revenue
    const revenueData = await Consultation.aggregate([
      {
        $match: {
          status: 'completed',
          sessionEndTime: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$fee' }
        }
      }
    ]);

    // Get average rating
    const ratingData = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$averageRating' }
        }
      }
    ]);

    // Get top therapy
    const topTherapyData = await Consultation.aggregate([
      {
        $match: {
          scheduledAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: { $ifNull: ['$therapyType', '$sessionType'] },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 1
      }
    ]);

    const summaryData = {
      date: today.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      newPatients,
      totalAppointments,
      completedSessions,
      cancelledSessions,
      revenue: revenueData[0]?.totalRevenue || 0,
      averageRating: ratingData[0]?.avgRating ? ratingData[0].avgRating.toFixed(1) : 'N/A',
      topTherapy: topTherapyData[0]?._id || 'Abhyanga',
      pendingFeedback,
      upcomingTomorrow
    };

    const result = await NotificationService.sendDailySummary(summaryData);

    return res.json({
      success: true,
      message: 'Daily summary report sent to admin',
      data: {
        summary: summaryData,
        emailResults: result
      }
    });
  });

  sendTherapistAssignment = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name')
      .populate('providerId', 'name email');

    if (!consultation) {
      throw new AppError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

    if (!consultation.providerId) {
      throw new AppError('No therapist assigned to this consultation', 400, 'NO_THERAPIST');
    }

    const assignmentData = {
      therapistEmail: consultation.providerId.email,
      therapistName: consultation.providerId.name,
      patientName: consultation.patientId.name,
      therapyType: consultation.therapyType || consultation.sessionType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt
    };

    const result = await NotificationService.sendTherapistAssignment(assignmentData);

    return res.json({
      success: true,
      message: 'Therapist assignment notification sent',
      data: result
    });
  });

  // ============ BULK OPERATIONS ============

  sendBulkReminders = asyncHandler(async (req, res) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // Find appointments for tomorrow
    const upcomingAppointments = await Consultation.find({
      scheduledAt: {
        $gte: tomorrow,
        $lte: endOfTomorrow
      },
      status: { $in: ['scheduled', 'confirmed'] }
    }).populate('patientId', 'name email');

    if (upcomingAppointments.length === 0) {
      return res.json({
        success: true,
        message: 'No appointments found for tomorrow',
        data: { count: 0, successful: 0, failed: 0 }
      });
    }

    const reminderPromises = upcomingAppointments.map(async (consultation) => {
      const appointmentData = {
        patientEmail: consultation.patientId.email,
        patientName: consultation.patientId.name,
        therapyType: consultation.therapyType || consultation.sessionType || 'Panchakarma',
        scheduledAt: consultation.scheduledAt,
        centerName: consultation.centerName || 'AyurSutra Wellness Center'
      };

      return await NotificationService.sendAppointmentReminder(appointmentData);
    });

    const results = await Promise.allSettled(reminderPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return res.json({
      success: true,
      message: `Bulk reminders processed: ${successful} sent, ${failed} failed`,
      data: {
        total: upcomingAppointments.length,
        successful,
        failed,
        results: results.map((r, i) => ({
          consultationId: upcomingAppointments[i]._id,
          status: r.status,
          error: r.status === 'rejected' ? r.reason?.message : null
        }))
      }
    });
  });

  sendBulkFeedbackRequests = asyncHandler(async (req, res) => {
    // Find completed sessions without feedback from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completedSessions = await Consultation.find({
      status: 'completed',
      feedbackSubmitted: false,
      sessionEndTime: { $gte: sevenDaysAgo, $lte: new Date() }
    }).populate('patientId', 'name email');

    if (completedSessions.length === 0) {
      return res.json({
        success: true,
        message: 'No completed sessions pending feedback',
        data: { count: 0, successful: 0, failed: 0 }
      });
    }

    const feedbackPromises = completedSessions.map(async (consultation) => {
      const consultationData = {
        patientEmail: consultation.patientId.email,
        patientName: consultation.patientId.name,
        therapyType: consultation.therapyType || consultation.sessionType || 'Panchakarma',
        sessionId: consultation._id,
        centerName: consultation.centerName || 'AyurSutra Wellness Center'
      };

      return await NotificationService.sendFeedbackRequest(consultationData);
    });

    const results = await Promise.allSettled(feedbackPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return res.json({
      success: true,
      message: `Bulk feedback requests processed: ${successful} sent, ${failed} failed`,
      data: {
        total: completedSessions.length,
        successful,
        failed
      }
    });
  });

  // ============ USER PREFERENCES ============

  getNotificationPreferences = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    
    const defaultPreferences = {
      emailNotifications: true,
      smsNotifications: false,
      appointmentConfirmation: true,
      appointmentReminder: true,
      preTherapyInstructions: true,
      postTherapyCare: true,
      feedbackRequest: true,
      healthTips: false,
      promotionalEmails: false
    };

    return res.json({
      success: true,
      data: user.notificationPreferences || defaultPreferences
    });
  });

  updateNotificationPreferences = asyncHandler(async (req, res) => {
    const updates = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPreferences: updates },
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: 'Notification preferences updated',
      data: user.notificationPreferences
    });
  });

  // ============ NOTIFICATION STATS & HISTORY ============

  getNotificationStats = asyncHandler(async (req, res) => {
    // This would require a Notification model to track sent notifications
    // For now, return mock data
    return res.json({
      success: true,
      data: {
        sent: 0,
        delivered: 0,
        failed: 0,
        pending: 0
      }
    });
  });

  getNotificationHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    
    // This would require a Notification model
    // For now, return empty array
    return res.json({
      success: true,
      data: {
        notifications: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
          totalRecords: 0
        }
      }
    });
  });
}

module.exports = new NotificationController();
