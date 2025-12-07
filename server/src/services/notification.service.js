// src/services/notificationService.js
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const config = require('../config');
const Notification = require('../models/Notification');
const User = require('../models/User');
const TreatmentPlan = require('../models/TreatmentPlan');
const Feedback = require('../models/Feedback');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');

class NotificationService {
  constructor() {
    this.emailTransporter = nodemailer.createTransport({
      host: config.SMTP.HOST,
      port: config.SMTP.PORT,
      secure: config.SMTP.PORT === 465,
      auth: {
        user: config.SMTP.USER,
        pass: config.SMTP.PASS
      },
      tls: config.NODE_ENV === 'production' ? undefined : { rejectUnauthorized: false }
    });

    if (config.TWILIO.ACCOUNT_SID && config.TWILIO.AUTH_TOKEN) {
      this.twilioClient = twilio(
        config.TWILIO.ACCOUNT_SID,
        config.TWILIO.AUTH_TOKEN
      );
    }

    this.registerHandlebarsHelpers();
  }

  // ---------------------------------------------------------
  // HANDLEBARS HELPERS
  // ---------------------------------------------------------
  registerHandlebarsHelpers() {
    handlebars.registerHelper('currency', function (amount) {
      return `₹${Number(amount).toLocaleString('en-IN')}`;
    });

    handlebars.registerHelper('formatDate', function (date) {
      return new Date(date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });

    handlebars.registerHelper('formatTime', function (date) {
      return new Date(date).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    handlebars.registerHelper('stars', function (rating) {
      const filled = '⭐'.repeat(Math.floor(rating));
      const empty = '☆'.repeat(5 - Math.floor(rating));
      return filled + empty;
    });

    handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
      return arg1 == arg2 ? options.fn(this) : options.inverse(this);
    });
  }

  // ---------------------------------------------------------
  // LOW-LEVEL SENDERS
  // ---------------------------------------------------------
  async sendEmail(to, subject, templateName, data = {}) {
    let htmlContent;
    try {
      const templatePath = path.join(
        __dirname,
        '../templates',
        `${templateName}.html`
      );
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      const enrichedData = {
        ...data,
        clinicName: data.clinicName || 'AyurSutra Wellness Center',
        clinicEmail:
          data.clinicEmail || config.SMTP.FROM_EMAIL || 'contact@ayursutra.com',
        clinicPhone: data.clinicPhone || '+91 98765 43210',
        frontendUrl: config.FRONTEND_URL || 'http://localhost:5173',
        dashboardUrl:
          data.dashboardUrl ||
          `${config.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`,
        timestamp: new Date().toLocaleString('en-IN', {
          dateStyle: 'long',
          timeStyle: 'short'
        })
      };

      htmlContent = template(enrichedData);
    } catch (err) {
      console.warn(`⚠️ Template ${templateName}.html not found, using fallback`);
      htmlContent = this.getFallbackTemplate(templateName, data);
    }

    const mailOptions = {
      from: `${data.clinicName || 'AyurSutra'} <${
        config.SMTP.FROM_EMAIL || 'noreply@ayursutra.com'
      }>`,
      to,
      subject,
      html: htmlContent
    };

    console.log(`📧 Sending email to ${to} with template ${templateName}`);
    const result = await this.emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId,
      recipient: to,
      template: templateName
    };
  }

  async sendSMS(to, message) {
    if (!this.twilioClient || !config.TWILIO.PHONE_NUMBER) {
      console.warn('⚠️ SMS service not configured - SMS logged instead');
      console.log(`📱 SMS to ${to}: ${message}`);
      return {
        success: true,
        messageId: 'console-log',
        recipient: to,
        note: 'SMS logged to console (Twilio not configured)'
      };
    }

    const result = await this.twilioClient.messages.create({
      body: message,
      from: config.TWILIO.PHONE_NUMBER,
      to
    });

    console.log(`✅ SMS sent to ${to}: ${result.sid}`);

    return {
      success: true,
      messageId: result.sid,
      recipient: to
    };
  }

  // ---------------------------------------------------------
  // CORE ORCHESTRATION
  // ---------------------------------------------------------
  async createAndDispatchNotification({
    recipientId,
    eventType,
    category,
    consultationId,
    treatmentPlanId,
    prescriptionId,
    feedbackId,
    title,
    body,
    templateKey,
    variables,
    channels = { inApp: true, email: false, sms: false },
    priority = 'normal',
    scheduledAt = null,
    expiresAt = null,
    metadata = {}
  }) {
    const notification = new Notification({
      recipientId,
      eventType,
      category,
      consultationId,
      treatmentPlanId,
      prescriptionId,
      feedbackId,
      title,
      body,
      templateKey,
      variables,
      channels: {
        inApp: {
          enabled: !!channels.inApp
        },
        email: {
          enabled: !!channels.email
        },
        sms: {
          enabled: !!channels.sms
        }
      },
      priority,
      scheduledAt,
      expiresAt,
      metadata
    });

    await notification.save();

    if (scheduledAt && scheduledAt > new Date()) {
      // scheduled – cron/worker will send later
      return notification;
    }

    // send immediately
    await this.dispatchNow(notification);
    return notification;
  }

  async dispatchNow(notificationDoc) {
    const notification =
      notificationDoc instanceof Notification
        ? notificationDoc
        : await Notification.findById(notificationDoc);

    if (!notification) return;

    const user = await User.findById(notification.recipientId).lean();
    if (!user) return;

    const { email, phone, name } = user;
    const { channels, title, body, templateKey, variables } = notification;

    const now = new Date();
    const firstSentAt = notification.firstSentAt || now;

    // EMAIL
    if (channels.email.enabled && email) {
      try {
        channels.email.status = 'sent';
        const subject = title;
        const templateName = templateKey || 'genericNotification';
        await this.sendEmail(email, subject, templateName, {
          userName: name,
          ...variables
        });
        channels.email.status = 'delivered';
        channels.email.deliveredAt = now;
      } catch (err) {
        channels.email.status = 'failed';
        channels.email.lastError = err.message;
      }
    }

    // SMS
    if (channels.sms.enabled && phone) {
      try {
        channels.sms.status = 'sent';
        await this.sendSMS(phone, body);
        channels.sms.status = 'delivered';
        channels.sms.deliveredAt = now;
      } catch (err) {
        channels.sms.status = 'failed';
        channels.sms.lastError = err.message;
      }
    }

    // IN-APP
    if (channels.inApp.enabled) {
      channels.inApp.status = 'delivered';
      channels.inApp.deliveredAt = now;
    }

    notification.firstSentAt = firstSentAt;
    notification.lastAttemptAt = now;
    notification.retryCount = (notification.retryCount || 0) + 1;
    await notification.save();
  }

  // ---------------------------------------------------------
  // HIGH-LEVEL HELPERS
  // ---------------------------------------------------------

  // 1) OTP / EMAIL VERIFY
  async notifyOtp(user, otp) {
    const title = 'Your AyurSutra verification code';
    const body = `Your OTP is ${otp}. It is valid for 10 minutes.`;

    return this.createAndDispatchNotification({
      recipientId: user._id,
      eventType: 'OTP',
      category: 'otp',
      title,
      body,
      templateKey: 'authOtp',
      variables: {
        userName: user.name,
        otp
      },
      channels: {
        inApp: false,
        email: !!user.email,
        sms: !!user.phone
      },
      priority: 'urgent'
    });
  }

  async notifyEmailVerification(user, verificationToken) {
    const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const title = 'Verify Your AyurSutra Account';
    const body = 'Please verify your email address to activate your account.';

    return this.createAndDispatchNotification({
      recipientId: user._id,
      eventType: 'OTP',
      category: 'otp',
      title,
      body,
      templateKey: 'emailVerification',
      variables: {
        userName: user.name,
        verificationUrl
      },
      channels: {
        inApp: true,
        email: !!user.email,
        sms: false
      },
      priority: 'high'
    });
  }

  // 2) CONSULTATION BOOKED
  async notifyConsultationBooked({ consultation, patient, doctor }) {
    const when = new Date(consultation.scheduledAt);
    const dateStr = when.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = when.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const title = `Consultation booked with Dr. ${doctor.name}`;
    const body = `Your consultation is scheduled on ${dateStr} at ${timeStr}.`;

    // To patient
    await this.createAndDispatchNotification({
      recipientId: patient._id,
      eventType: 'CONSULTATION_BOOKED',
      category: 'consultation',
      consultationId: consultation._id,
      title,
      body,
      templateKey: 'consultationBookedPatient',
      variables: {
        patientName: patient.name,
        doctorName: doctor.name,
        date: dateStr,
        time: timeStr
      },
      channels: {
        inApp: true,
        email: !!patient.email,
        sms: false   // enable when ready
      },
      priority: 'normal'
    });

    // To doctor
    const doctorTitle = `New consultation booked with ${patient.name}`;
    const doctorBody = `You have a new consultation on ${dateStr} at ${timeStr}.`;

    return this.createAndDispatchNotification({
      recipientId: doctor.userId || doctor._id,
      eventType: 'CONSULTATION_BOOKED',
      category: 'consultation',
      consultationId: consultation._id,
      title: doctorTitle,
      body: doctorBody,
      templateKey: 'consultationBookedDoctor',
      variables: {
        patientName: patient.name,
        doctorName: doctor.name,
        date: dateStr,
        time: timeStr
      },
      channels: {
        inApp: true,
        email: !!doctor.email,
        sms: !!doctor.phone
      },
      priority: 'normal'
    });
  }

  // 3) AFTER TREATMENT PLAN CREATION
  async notifyTreatmentPlanCreated(planId) {
    console.log('🔔 notifyTreatmentPlanCreated called for', planId);

    const plan = await TreatmentPlan.findById(planId)
      .populate('patientId doctorId assignedTherapistId')
      .lean();

    if (!plan) {
      console.warn('⚠️ notifyTreatmentPlanCreated: plan not found', planId);
      return;
    }

    const startDate = plan.schedulingPreferences?.startDate
      ? new Date(plan.schedulingPreferences.startDate).toLocaleDateString('en-IN')
      : 'To be scheduled';

    const patient = plan.patientId;
    const doctor = plan.doctorId;
    const therapist = plan.assignedTherapistId;

    console.log('👤 Plan notify:', {
      patientName: patient?.name,
      doctorName: doctor?.name,
      therapistName: therapist?.name
    });

    const title = `New Panchakarma plan: ${plan.treatmentName}`;
    const body = `Your ${plan.panchakarmaType} plan has been created. Start date: ${startDate}.`;

    // to patient
    if (patient?._id) {
      await this.createAndDispatchNotification({
        recipientId: patient._id,
        eventType: 'TREATMENT_PLAN_CREATED',
        category: 'treatment',
        treatmentPlanId: plan._id,
        title,
        body,
        templateKey: 'treatmentPlanCreatedPatient',
        variables: {
          patientName: patient.name,
          doctorName: doctor?.name || 'Doctor',
          therapistName: therapist?.name,
          treatmentName: plan.treatmentName,
          panchakarmaType: plan.panchakarmaType,
          startDate
        },
        channels: {
          inApp: true,
          email: !!patient.email,
          sms: !!patient.phone
        },
        priority: 'normal'
      });
    }

    // to therapist
    if (therapist) {
      const thTitle = `New patient assigned: ${patient?.name || 'Patient'}`;
      const thBody = `A new ${plan.panchakarmaType} plan has been assigned to you.`;

      await this.createAndDispatchNotification({
        recipientId: therapist.userId || therapist._id,
        eventType: 'TREATMENT_PLAN_CREATED',
        category: 'treatment',
        treatmentPlanId: plan._id,
        title: thTitle,
        body: thBody,
        templateKey: 'treatmentPlanCreatedTherapist',
        variables: {
          patientName: patient?.name,
          doctorName: doctor?.name || 'Doctor',
          treatmentName: plan.treatmentName
        },
        channels: {
          inApp: true,
          email: !!therapist.email,
          sms: !!therapist.phone
        },
        priority: 'normal'
      });
    }

    return true;
  }

async schedulePrePostPlanNotifications(plan) {
  console.log('🔔 schedulePrePostPlanNotifications called for', plan._id);

  const startDate = plan.schedulingPreferences?.startDate;
  if (!startDate) return;

  const patientId = plan.patientId;
  const patient = await User.findById(patientId).lean();
  if (!patient) return;

  const start = new Date(startDate);
  const dayBefore = new Date(start);
  dayBefore.setDate(start.getDate() - 1);

  const planEnd = plan.estimatedCompletionDate || null;

  // PRE (day before start)
  await this.createAndDispatchNotification({
    recipientId: patient._id,
    eventType: 'TREATMENT_PLAN_REMINDER_PRE',
    category: 'treatment',
    treatmentPlanId: plan._id,
    title: 'Your Panchakarma plan starts soon',
    body: `Your ${plan.panchakarmaType} treatment starts on ${start.toLocaleDateString(
      'en-IN'
    )}. Please follow the pre-treatment instructions below.`,
    templateKey: 'treatmentPlanPreReminder',
    variables: {
      patientName: patient.name,
      treatmentName: plan.treatmentName,
      panchakarmaType: plan.panchakarmaType,
      startDate: start.toLocaleDateString('en-IN'),
      preInstructions: plan.prePanchakarmaInstructions || ''
    },
    channels: {
      inApp: true,
      email: !!patient.email,
      sms: !!patient.phone
    },
    priority: 'high',
    scheduledAt: dayBefore
  });

  // POST (day after end, if known)
  if (planEnd) {
    const dayAfterEnd = new Date(planEnd);
    dayAfterEnd.setDate(planEnd.getDate() + 1);

    await this.createAndDispatchNotification({
      recipientId: patient._id,
      eventType: 'TREATMENT_PLAN_REMINDER_POST',
      category: 'treatment',
      treatmentPlanId: plan._id,
      title: `Post-treatment care for ${plan.treatmentName}`,
      body: `Your ${plan.panchakarmaType} plan has ended. Please follow the post-treatment care instructions below.`,
      templateKey: 'treatmentPlanPostReminder',
      variables: {
        patientName: patient.name,
        treatmentName: plan.treatmentName,
        panchakarmaType: plan.panchakarmaType,
        endDate: planEnd.toLocaleDateString('en-IN'),
        postInstructions: plan.postPanchakarmaInstructions || ''
      },
      channels: {
        inApp: true,
        email: !!patient.email,
        sms: !!patient.phone
      },
      priority: 'normal',
      scheduledAt: dayAfterEnd
    });
  }
}

// 5) PRESCRIPTION FOLLOW-UP REMINDER (1 day before followUpDate)
async schedulePrescriptionFollowUpReminder({ prescription, patient }) {
  // If no follow-up date, nothing to schedule
  if (!prescription.followUpDate) return;

  const followUp = new Date(prescription.followUpDate);
  const dayBeforeFollowUp = new Date(followUp);
  dayBeforeFollowUp.setDate(followUp.getDate() - 1);

  const title = 'Follow-up consultation is due soon';
  const body = `Your follow-up visit is scheduled on ${followUp.toLocaleDateString(
    'en-IN'
  )}. Please plan to visit your doctor.`;

  return this.createAndDispatchNotification({
    recipientId: patient._id,
    eventType: 'PRESCRIPTION_FOLLOWUP_REMINDER',
    category: 'prescription',
    prescriptionId: prescription._id,
    title,
    body,
    templateKey: 'prescriptionFollowUpReminder',
    variables: {
      patientName: patient.name,
      followUpDate: followUp.toLocaleDateString('en-IN'),
      chiefComplaint: prescription.chiefComplaint,
      diagnosis: prescription.diagnosis || ''
    },
    channels: {
      inApp: true,
      email: !!patient.email,
      sms: !!patient.phone
    },
    priority: 'normal',
    scheduledAt: dayBeforeFollowUp
  });
}

  getFallbackTemplate(templateName, data) {
    return `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>${data.title || 'Notification'}</h2>
        <p>${data.body || 'You have a new notification from AyurSutra.'}</p>
      </div>
    `;
  }

  async testEmailConnection() {
    try {
      await this.emailTransporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message);
      return false;
    }
  }

  async testSMSConnection() {
    try {
      if (!this.twilioClient) {
        console.log('⚠️ SMS service not configured');
        return false;
      }

      await this.twilioClient.api
        .accounts(config.TWILIO.ACCOUNT_SID)
        .fetch();
      console.log('✅ SMS service connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMS service connection failed:', error.message);
      return false;
    }
  }

  async testAllConnections() {
    const results = {
      email: await this.testEmailConnection(),
      sms: await this.testSMSConnection()
    };

    console.log('📊 Notification Service Status:', results);
    return results;
  }
}

module.exports = new NotificationService();
