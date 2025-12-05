// src/controllers/notification.controller.js
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const NotificationService = require('../services/notification.service');
const Notification = require('../models/Notification');

const User = require('../models/User');
const Consultation = require('../models/Consultation');
const TreatmentPlan = require('../models/TreatmentPlan');
const Feedback = require('../models/Feedback');
const Prescription = require('../models/Prescription'); // when you add it

class NotificationController {
  // ============ TEST ENDPOINTS ============

  sendTestEmail = asyncHandler(async (req, res) => {
    const { email, subject, templateName, data } = req.body;
    if (!email || !subject || !templateName) {
      throw new AppError(
        'Email, subject, and templateName are required',
        400,
        'MISSING_FIELDS'
      );
    }

    const result = await NotificationService.sendEmail(
      email,
      subject,
      templateName,
      data
    );

    return res.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });
  });

  sendTestSMS = asyncHandler(async (req, res) => {
    const { phoneNumber, message } = req.body;
    if (!phoneNumber || !message) {
      throw new AppError(
        'Phone number and message are required',
        400,
        'MISSING_FIELDS'
      );
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

  // ============ AUTH NOTIFICATIONS (OTP / VERIFY / WELCOME) ============

  sendVerificationEmail = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      throw new AppError('userId is required', 400, 'MISSING_FIELDS');
    }

    const user = await User.findById(userId);
    if (!user || !user.email) {
      throw new AppError('User or email not found', 404, 'USER_NOT_FOUND');
    }

    const token = user.generateEmailVerificationToken();
    await user.save();

    const result = await NotificationService.notifyEmailVerification(
      user,
      token
    );

    return res.json({
      success: true,
      message: 'Verification email notification created',
      data: result
    });
  });

  sendPhoneOTP = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      throw new AppError('userId is required', 400, 'MISSING_FIELDS');
    }

    const user = await User.findById(userId);
    if (!user || !user.phone) {
      throw new AppError('User or phone not found', 404, 'USER_NOT_FOUND');
    }

    const otp = user.generatePhoneOTP();
    await user.save();

    const result = await NotificationService.notifyOtp(user, otp);

    return res.json({
      success: true,
      message: 'OTP notification created',
      data: result
    });
  });

  sendWelcomeEmail = asyncHandler(async (req, res) => {
    const { email, userName } = req.body;
    if (!email || !userName) {
      throw new AppError(
        'Email and userName are required',
        400,
        'MISSING_FIELDS'
      );
    }

    await NotificationService.sendWelcomeEmail(email, userName);

    return res.json({
      success: true,
      message: 'Welcome email sent successfully'
    });
  });

  // ============ CONSULTATION / APPOINTMENT NOTIFICATIONS ============

  sendAppointmentConfirmation = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email phone');

    if (!consultation) {
      throw new AppError(
        'Consultation not found',
        404,
        'CONSULTATION_NOT_FOUND'
      );
    }

    const patient = consultation.patientId;
    const doctor = consultation.doctorId;
    if (!patient || !doctor) {
      throw new AppError(
        'Patient or doctor not linked to consultation',
        400,
        'MISSING_RELATIONS'
      );
    }

    const result = await NotificationService.notifyConsultationBooked({
      consultation,
      patient,
      doctor
    });

    return res.json({
      success: true,
      message: 'Consultation booking notifications created',
      data: result
    });
  });

  // LEGACY email-only reminder – optional, but kept for manual triggers
  sendAppointmentReminder = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email');

    if (!consultation) {
      throw new AppError(
        'Consultation not found',
        404,
        'CONSULTATION_NOT_FOUND'
      );
    }

    const appointmentData = {
      patientEmail: consultation.patientId.email,
      patientName: consultation.patientId.name,
      therapyType:
        consultation.therapyType || consultation.sessionType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt,
      centerName: consultation.centerName || 'AyurSutra Wellness Center'
    };

    const result = await NotificationService.sendAppointmentReminder(
      appointmentData
    );

    return res.json({
      success: true,
      message: 'Appointment reminder email sent',
      data: result
    });
  });

  sendAppointmentCancellation = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;
    const { reason } = req.body;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email');

    if (!consultation) {
      throw new AppError(
        'Consultation not found',
        404,
        'CONSULTATION_NOT_FOUND'
      );
    }

    const appointmentData = {
      patientEmail: consultation.patientId.email,
      patientName: consultation.patientId.name,
      therapyType:
        consultation.therapyType || consultation.sessionType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt,
      reason: reason || 'Unavoidable circumstances',
      clinicName: consultation.centerName || 'AyurSutra Wellness Center',
      clinicPhone: '+91 98765 43210',
      clinicEmail: 'contact@ayursutra.com'
    };

    const result = await NotificationService.sendAppointmentCancellation(
      appointmentData
    );

    return res.json({
      success: true,
      message: 'Appointment cancellation email sent',
      data: result
    });
  });

  // ============ FEEDBACK REQUESTS (AFTER THERAPY) ============

  sendFeedbackRequest = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email phone');

    if (!consultation) {
      throw new AppError(
        'Consultation not found',
        404,
        'CONSULTATION_NOT_FOUND'
      );
    }

    if (consultation.status !== 'completed') {
      throw new AppError(
        'Can only request feedback for completed sessions',
        400,
        'INVALID_SESSION_STATUS'
      );
    }

    // Use unified orchestrator for in-app + email + SMS
    const patient = consultation.patientId;

    const session = {
      therapyName:
        consultation.therapyType || consultation.sessionType || 'Panchakarma',
      consultationId: consultation._id,
      scheduledEndTime: consultation.sessionEndTime || consultation.scheduledAt
    };

    const result = await NotificationService.notifyFeedbackAfterTherapy({
      session,
      patient,
      provider: null
    });

    return res.json({
      success: true,
      message: 'Feedback notification created',
      data: result
    });
  });

  // ============ PRE & POST THERAPY NOTIFICATIONS (EMAIL ONLY) ============

  sendPreTherapyInstructions = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email');

    if (!consultation) {
      throw new AppError(
        'Consultation not found',
        404,
        'CONSULTATION_NOT_FOUND'
      );
    }

    const appointmentData = {
      patientEmail: consultation.patientId.email,
      patientName: consultation.patientId.name,
      therapyType:
        consultation.therapyType || consultation.sessionType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt,
      clinicName: consultation.centerName || 'AyurSutra Wellness Center',
      clinicPhone: '+91 98765 43210',
      clinicEmail: 'contact@ayursutra.com'
    };

    const result = await NotificationService.sendPreTherapyInstructions(
      appointmentData
    );

    return res.json({
      success: true,
      message: 'Pre-therapy instructions email sent',
      data: result
    });
  });

  sendPostTherapyCare = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name email');

    if (!consultation) {
      throw new AppError(
        'Consultation not found',
        404,
        'CONSULTATION_NOT_FOUND'
      );
    }

    if (consultation.status !== 'completed') {
      throw new AppError(
        'Can only send post-care for completed sessions',
        400,
        'INVALID_SESSION_STATUS'
      );
    }

    const consultationData = {
      patientEmail: consultation.patientId.email,
      patientName: consultation.patientId.name,
      therapyType:
        consultation.therapyType || consultation.sessionType || 'Panchakarma',
      nextSessionDate: consultation.nextSessionDate,
      clinicName: consultation.centerName || 'AyurSutra Wellness Center',
      clinicEmail: 'contact@ayursutra.com',
      clinicPhone: '+91 98765 43210'
    };

    const result = await NotificationService.sendPostTherapyCare(
      consultationData
    );

    return res.json({
      success: true,
      message: 'Post-therapy care email sent',
      data: result
    });
  });

  // ============ TREATMENT PLAN NOTIFICATIONS ============

  // Call this from treatment-plan controller after creating plan
  triggerTreatmentPlanCreated = asyncHandler(async (req, res) => {
    const { planId } = req.params;

    const ok = await NotificationService.notifyTreatmentPlanCreated(planId);
    if (!ok) {
      throw new AppError(
        'Treatment plan not found',
        404,
        'TREATMENT_PLAN_NOT_FOUND'
      );
    }

    const plan = await TreatmentPlan.findById(planId);
    await NotificationService.schedulePrePostPlanNotifications(plan);

    return res.json({
      success: true,
      message: 'Treatment plan notifications created'
    });
  });

  // ============ PRESCRIPTION END REMINDER ============

  triggerPrescriptionEndReminder = asyncHandler(async (req, res) => {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate('patientId', 'name email phone');

    if (!prescription) {
      throw new AppError(
        'Prescription not found',
        404,
        'PRESCRIPTION_NOT_FOUND'
      );
    }

    const result = await NotificationService.schedulePrescriptionEndReminder({
      prescription,
      patient: prescription.patientId
    });

    return res.json({
      success: true,
      message: 'Prescription end reminder scheduled',
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
      .populate('doctorId', 'name');

    if (!consultation) {
      throw new AppError(
        'Consultation not found',
        404,
        'CONSULTATION_NOT_FOUND'
      );
    }

    const appointmentData = {
      _id: consultation._id,
      patientName: consultation.patientId.name,
      therapyType:
        consultation.therapyType || consultation.sessionType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt,
      therapistName: consultation.doctorId?.name || 'Not assigned',
      fee: consultation.fee || 0
    };

    const result = await NotificationService.sendNewAppointmentAlert(
      appointmentData
    );

    return res.json({
      success: true,
      message: 'Admin alert sent for new appointment',
      data: result
    });
  });

  sendCriticalFeedbackAlert = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;

    let feedbackData;

    if (feedbackId) {
      const feedback = await Feedback.findById(feedbackId)
        .populate('patientId', 'name')
        .populate('providerId', 'name')
        .populate('sessionId', 'therapyType sessionType scheduledAt');

      if (!feedback) {
        throw new AppError('Feedback not found', 404, 'FEEDBACK_NOT_FOUND');
      }

      feedbackData = {
        _id: feedback._id,
        patientName: feedback.patientId?.name || 'Unknown Patient',
        therapyType:
          feedback.sessionId?.therapyType ||
          feedback.sessionId?.sessionType ||
          'Unknown',
        therapistName: feedback.providerId?.name || 'Unknown Therapist',
        rating: feedback.averageRating || 0,
        concerns:
          feedback.textFeedback?.concernsOrIssues ||
          'No concerns specified',
        recommendations: feedback.recommendations || 'None',
        sessionDate: feedback.sessionId?.scheduledAt || feedback.createdAt
      };
    } else {
      feedbackData = req.body;

      if (
        !feedbackData.patientName ||
        !feedbackData.therapyType ||
        !feedbackData.rating
      ) {
        throw new AppError(
          'Patient name, therapy type, and rating are required',
          400,
          'MISSING_FIELDS'
        );
      }
    }

    const result = await NotificationService.sendCriticalFeedbackAlert(
      feedbackData
    );

    return res.json({
      success: true,
      message: 'Critical feedback alert sent to admin',
      data: result
    });
  });

  sendDailySummary = asyncHandler(async (req, res) => {
    // Keep your existing aggregation logic as-is, then:
    // ... same as your previous implementation ...
    // re-use NotificationService.sendDailySummary(summaryData)
    // (omitted here for brevity since logic is pure reporting)
  });

  sendTherapistAssignment = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name')
      .populate('doctorId', 'name email');

    if (!consultation) {
      throw new AppError(
        'Consultation not found',
        404,
        'CONSULTATION_NOT_FOUND'
      );
    }

    if (!consultation.doctorId) {
      throw new AppError(
        'No therapist/doctor assigned to this consultation',
        400,
        'NO_PROVIDER'
      );
    }

    const assignmentData = {
      therapistEmail: consultation.doctorId.email,
      therapistName: consultation.doctorId.name,
      patientName: consultation.patientId.name,
      therapyType:
        consultation.therapyType || consultation.sessionType || 'Panchakarma',
      scheduledAt: consultation.scheduledAt
    };

    const result = await NotificationService.sendTherapistAssignment(
      assignmentData
    );

    return res.json({
      success: true,
      message: 'Therapist assignment email sent',
      data: result
    });
  });

  // ============ BULK OPERATIONS (EMAIL-LEGACY) ============

  // keep your existing bulk email reminder and feedback methods if you want
  // they can directly call NotificationService helpers too

  // ============ USER PREFERENCES (STILL SIMPLE) ============

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

  // ============ IN-APP NOTIFICATION STATS & HISTORY ============

  getNotificationStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [sent, delivered, failed, pending] = await Promise.all([
      Notification.countDocuments({ recipientId: userId }),
      Notification.countDocuments({
        recipientId: userId,
        overallStatus: { $in: ['delivered', 'read'] }
      }),
      Notification.countDocuments({
        recipientId: userId,
        overallStatus: 'failed'
      }),
      Notification.countDocuments({
        recipientId: userId,
        overallStatus: { $in: ['pending', 'queued'] }
      })
    ]);

    return res.json({
      success: true,
      data: { sent, delivered, failed, pending }
    });
  });

  getNotificationHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const [notifications, totalRecords] = await Promise.all([
      Notification.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipientId: userId })
    ]);

    return res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords
        }
      }
    });
  });

  markNotificationRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipientId: userId
    });
    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    notification.channels.inApp.status = 'read';
    notification.channels.inApp.readAt = new Date();
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return res.json({
      success: true,
      message: 'Notification marked as read'
    });
  });

  markAllNotificationsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipientId: userId, 'channels.inApp.status': { $ne: 'read' } },
      {
        $set: {
          'channels.inApp.status': 'read',
          'channels.inApp.readAt': new Date(),
          isRead: true,
          readAt: new Date()
        }
      }
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  });
}

module.exports = new NotificationController();
