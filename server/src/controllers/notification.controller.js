const { asyncHandler, AppError } = require('../middleware/error.middleware');
const NotificationService = require('../services/notification.service');
const User = require('../models/User');
const Consultation = require('../models/Consultation');

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
      therapyType: consultation.therapyType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt,
      providerId: consultation.providerId._id,
      centerName: 'AyurSutra Wellness Center'
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
      therapyType: consultation.therapyType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt,
      centerName: 'AyurSutra Wellness Center'
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
      therapyType: consultation.therapyType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt,
      reason: reason || 'unavoidable circumstances'
    };

    const result = await NotificationService.sendAppointmentCancellation(appointmentData);

    return res.json({
      success: true,
      message: 'Appointment cancellation sent',
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
      therapyType: consultation.therapyType || 'Panchakarma',
      sessionId: consultation._id,
      centerName: 'AyurSutra Wellness Center'
    };

    const result = await NotificationService.sendFeedbackRequest(consultationData);

    return res.json({
      success: true,
      message: 'Feedback request sent',
      data: result
    });
  });

  // ============ THERAPY NOTIFICATIONS ============

  sendPreTherapyInstructions = asyncHandler(async (req, res) => {
    const { patientEmail, patientName, therapyType, scheduledAt } = req.body;

    if (!patientEmail || !patientName || !therapyType || !scheduledAt) {
      throw new AppError('Patient email, name, therapy type, and scheduled time are required', 400, 'MISSING_FIELDS');
    }

    const appointmentData = {
      patientEmail,
      patientName,
      therapyType,
      scheduledAt
    };

    const result = await NotificationService.sendPreTherapyInstructions(appointmentData);

    return res.json({
      success: true,
      message: 'Pre-therapy instructions sent',
      data: result
    });
  });

  sendPostTherapyCare = asyncHandler(async (req, res) => {
    const { patientEmail, patientName, therapyType } = req.body;

    if (!patientEmail || !patientName || !therapyType) {
      throw new AppError('Patient email, name, and therapy type are required', 400, 'MISSING_FIELDS');
    }

    const consultationData = {
      patientEmail,
      patientName,
      therapyType
    };

    const result = await NotificationService.sendPostTherapyCare(consultationData);

    return res.json({
      success: true,
      message: 'Post-therapy care instructions sent',
      data: result
    });
  });

  // ============ ENGAGEMENT NOTIFICATIONS ============

  sendHealthTips = asyncHandler(async (req, res) => {
    const { email, name, preferences } = req.body;

    if (!email || !name) {
      throw new AppError('Email and name are required', 400, 'MISSING_FIELDS');
    }

    const patientData = {
      email,
      name,
      preferences: preferences || {}
    };

    const result = await NotificationService.sendHealthTips(patientData);

    return res.json({
      success: true,
      message: 'Health tips sent',
      data: result
    });
  });

  sendCriticalFeedbackAlert = asyncHandler(async (req, res) => {
    const feedbackData = req.body;

    if (!feedbackData.patientName || !feedbackData.therapyType) {
      throw new AppError('Patient name and therapy type are required', 400, 'MISSING_FIELDS');
    }

    const results = await NotificationService.sendCriticalFeedbackAlert(feedbackData);

    return res.json({
      success: true,
      message: 'Critical feedback alerts sent',
      data: results
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
      status: 'scheduled'
    }).populate('patientId', 'name email');

    if (upcomingAppointments.length === 0) {
      return res.json({
        success: true,
        message: 'No appointments found for tomorrow',
        data: { count: 0 }
      });
    }

    const reminderPromises = upcomingAppointments.map(async (consultation) => {
      const appointmentData = {
        patientEmail: consultation.patientId.email,
        patientName: consultation.patientId.name,
        therapyType: consultation.therapyType || 'Panchakarma',
        scheduledAt: consultation.scheduledAt,
        centerName: 'AyurSutra Wellness Center'
      };

      return await NotificationService.sendAppointmentReminder(appointmentData);
    });

    const results = await Promise.allSettled(reminderPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return res.json({
      success: true,
      message: `Bulk reminders processed`,
      data: {
        total: upcomingAppointments.length,
        successful,
        failed
      }
    });
  });

  sendBulkHealthTips = asyncHandler(async (req, res) => {
    const { recipients } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new AppError('Recipients array is required', 400, 'MISSING_FIELDS');
    }

    const promises = recipients.map(recipient => 
      NotificationService.sendHealthTips({
        email: recipient.email,
        name: recipient.name,
        preferences: recipient.preferences || {}
      })
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return res.json({
      success: true,
      message: 'Bulk health tips processed',
      data: {
        total: recipients.length,
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
      feedbackRequest: true,
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
}

module.exports = new NotificationController();
