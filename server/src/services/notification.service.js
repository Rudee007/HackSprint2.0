const nodemailer = require('nodemailer');
const twilio = require('twilio');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const config = require('../config');

class NotificationService {
  constructor() {
    // Email transporter

    
    this.emailTransporter = nodemailer.createTransport({
      host: config.SMTP.HOST,
      port: config.SMTP.PORT,
      secure: config.SMTP.PORT === 465, // true for 465
      auth: {
        user: config.SMTP.USER,
        pass: config.SMTP.PASS
      },
      tls: config.NODE_ENV === 'production' ? undefined : { rejectUnauthorized: false }
    });

    // Twilio client (if credentials exist)
    if (config.TWILIO.ACCOUNT_SID && config.TWILIO.AUTH_TOKEN) {
      this.twilioClient = twilio(config.TWILIO.ACCOUNT_SID, config.TWILIO.AUTH_TOKEN);
    }
  }


  // ============ ADMIN-SPECIFIC NOTIFICATIONS ============

// 🔴 HIGH PRIORITY: New Patient Registration
async sendNewPatientAlert(patientData) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
  
  const emailData = {
    alertType: 'new_patient',
    patientName: patientData.name,
    patientEmail: patientData.email,
    patientPhone: patientData.phone,
    registrationDate: new Date().toLocaleString('en-IN'),
    patientId: patientData._id,
    dashboardUrl: `${config.FRONTEND_URL}/admin/patients/${patientData._id}`,
    totalPatients: patientData.totalPatients || 'N/A'
  };

  const promises = adminEmails.map(email =>
    this.sendEmail(
      email.trim(),
      `🎯 New Patient Registered - ${patientData.name}`,
      'adminNewPatient',
      emailData
    )
  );

  return await Promise.allSettled(promises);
}

// 🔴 HIGH PRIORITY: New Appointment Booked
async sendNewAppointmentAlert(appointmentData) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
  
  const emailData = {
    alertType: 'new_booking',
    patientName: appointmentData.patientName,
    therapyType: appointmentData.therapyType,
    scheduledDate: new Date(appointmentData.scheduledAt).toLocaleDateString('en-IN'),
    scheduledTime: new Date(appointmentData.scheduledAt).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    therapistName: appointmentData.therapistName || 'Not assigned',
    appointmentId: appointmentData._id,
    fee: `₹${appointmentData.fee}`,
    dashboardUrl: `${config.FRONTEND_URL}/admin/appointments/${appointmentData._id}`,
    timestamp: new Date().toLocaleString('en-IN')
  };

  const promises = adminEmails.map(email =>
    this.sendEmail(
      email.trim(),
      `📅 New Appointment: ${appointmentData.therapyType} - ${emailData.scheduledDate}`,
      'adminNewAppointment',
      emailData
    )
  );

  return await Promise.allSettled(promises);
}

// 🔴 HIGH PRIORITY: Session Status Updates
async sendSessionStatusAlert(sessionData) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
  
  const statusEmojis = {
    'started': '▶️',
    'in_progress': '🔄',
    'completed': '✅',
    'cancelled': '❌',
    'paused': '⏸️'
  };

  const emailData = {
    alertType: 'session_status',
    emoji: statusEmojis[sessionData.status] || '📋',
    status: sessionData.status.toUpperCase(),
    patientName: sessionData.patientName,
    therapyType: sessionData.therapyType,
    therapistName: sessionData.therapistName,
    sessionId: sessionData._id,
    startTime: sessionData.sessionStartTime ? 
      new Date(sessionData.sessionStartTime).toLocaleTimeString('en-IN') : 'N/A',
    endTime: sessionData.sessionEndTime ? 
      new Date(sessionData.sessionEndTime).toLocaleTimeString('en-IN') : 'Ongoing',
    duration: sessionData.actualDuration || sessionData.estimatedDuration || 'N/A',
    dashboardUrl: `${config.FRONTEND_URL}/admin/monitoring`,
    timestamp: new Date().toLocaleString('en-IN')
  };

  const promises = adminEmails.map(email =>
    this.sendEmail(
      email.trim(),
      `${emailData.emoji} Session ${emailData.status}: ${sessionData.patientName}`,
      'adminSessionStatus',
      emailData
    )
  );

  return await Promise.allSettled(promises);
}

// 🔴 HIGH PRIORITY: Critical Feedback Alert (Enhanced)
async sendCriticalFeedbackAlertV2(feedbackData) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
  
  const urgencyLevel = feedbackData.rating <= 2 ? 'URGENT' : 'HIGH';
  
  const emailData = {
    urgencyLevel,
    alertType: 'critical_feedback',
    patientName: feedbackData.patientName,
    therapyType: feedbackData.therapyType,
    therapistName: feedbackData.therapistName,
    rating: feedbackData.rating,
    ratingStars: '⭐'.repeat(feedbackData.rating) + '☆'.repeat(5 - feedbackData.rating),
    concerns: feedbackData.concerns || feedbackData.textFeedback?.concernsOrIssues || 'No specific concerns mentioned',
    recommendations: feedbackData.recommendations || 'None',
    sessionDate: new Date(feedbackData.sessionDate).toLocaleDateString('en-IN'),
    feedbackId: feedbackData._id,
    dashboardUrl: `${config.FRONTEND_URL}/admin/feedback/${feedbackData._id}`,
    timestamp: new Date().toLocaleString('en-IN')
  };

  const promises = adminEmails.map(email =>
    this.sendEmail(
      email.trim(),
      `🚨 ${urgencyLevel}: Critical Feedback - ${feedbackData.patientName}`,
      'adminCriticalFeedback',
      emailData
    )
  );

  return await Promise.allSettled(promises);
}

// 🟡 MEDIUM PRIORITY: Daily Summary Report
async sendDailySummary(summaryData) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
  
  const emailData = {
    reportType: 'daily_summary',
    reportDate: summaryData.date || new Date().toLocaleDateString('en-IN'),
    newPatients: summaryData.newPatients || 0,
    totalAppointments: summaryData.totalAppointments || 0,
    completedSessions: summaryData.completedSessions || 0,
    cancelledSessions: summaryData.cancelledSessions || 0,
    revenue: `₹${summaryData.revenue?.toLocaleString('en-IN') || 0}`,
    averageRating: summaryData.averageRating || 'N/A',
    topTherapy: summaryData.topTherapy || 'Abhyanga',
    pendingFeedback: summaryData.pendingFeedback || 0,
    upcomingTomorrow: summaryData.upcomingTomorrow || 0,
    dashboardUrl: `${config.FRONTEND_URL}/admin/dashboard`,
    timestamp: new Date().toLocaleString('en-IN')
  };

  const promises = adminEmails.map(email =>
    this.sendEmail(
      email.trim(),
      `📊 Daily Summary Report - ${emailData.reportDate}`,
      'adminDailySummary',
      emailData
    )
  );

  return await Promise.allSettled(promises);
}

// 🟡 MEDIUM PRIORITY: Payment Notification
async sendPaymentNotification(paymentData) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
  
  const emailData = {
    alertType: 'payment_received',
    patientName: paymentData.patientName,
    amount: `₹${paymentData.amount}`,
    paymentMethod: paymentData.paymentMethod,
    transactionId: paymentData.transactionId,
    appointmentId: paymentData.appointmentId,
    therapyType: paymentData.therapyType,
    paymentDate: new Date(paymentData.paymentDate).toLocaleString('en-IN'),
    status: paymentData.status,
    dashboardUrl: `${config.FRONTEND_URL}/admin/payments`,
    timestamp: new Date().toLocaleString('en-IN')
  };

  const promises = adminEmails.map(email =>
    this.sendEmail(
      email.trim(),
      `💰 Payment Received - ₹${paymentData.amount} from ${paymentData.patientName}`,
      'adminPayment',
      emailData
    )
  );

  return await Promise.allSettled(promises);
}

// 🟡 MEDIUM PRIORITY: Appointment Cancellation Alert
async sendCancellationAlert(cancellationData) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
  
  const emailData = {
    alertType: 'appointment_cancelled',
    patientName: cancellationData.patientName,
    therapyType: cancellationData.therapyType,
    scheduledDate: new Date(cancellationData.scheduledAt).toLocaleDateString('en-IN'),
    scheduledTime: new Date(cancellationData.scheduledAt).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    reason: cancellationData.reason || 'No reason provided',
    cancelledBy: cancellationData.cancelledBy || 'Patient',
    refundAmount: cancellationData.refundAmount ? `₹${cancellationData.refundAmount}` : 'No refund',
    appointmentId: cancellationData._id,
    dashboardUrl: `${config.FRONTEND_URL}/admin/appointments`,
    timestamp: new Date().toLocaleString('en-IN')
  };

  const promises = adminEmails.map(email =>
    this.sendEmail(
      email.trim(),
      `⚠️ Appointment Cancelled - ${cancellationData.patientName}`,
      'adminCancellation',
      emailData
    )
  );

  return await Promise.allSettled(promises);
}

// 🟢 LOW PRIORITY: Weekly Analytics Report
async sendWeeklyReport(weekData) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
  
  const emailData = {
    reportType: 'weekly_analytics',
    weekStart: weekData.weekStart,
    weekEnd: weekData.weekEnd,
    totalPatients: weekData.totalPatients || 0,
    newPatients: weekData.newPatients || 0,
    totalRevenue: `₹${weekData.totalRevenue?.toLocaleString('en-IN') || 0}`,
    totalSessions: weekData.totalSessions || 0,
    completionRate: `${weekData.completionRate || 0}%`,
    averageRating: weekData.averageRating || 'N/A',
    topPerformingTherapist: weekData.topPerformingTherapist || 'N/A',
    mostBookedTherapy: weekData.mostBookedTherapy || 'Abhyanga',
    patientSatisfaction: `${weekData.patientSatisfaction || 0}%`,
    dashboardUrl: `${config.FRONTEND_URL}/admin/analytics`,
    timestamp: new Date().toLocaleString('en-IN')
  };

  const promises = adminEmails.map(email =>
    this.sendEmail(
      email.trim(),
      `📈 Weekly Analytics Report - ${weekData.weekStart} to ${weekData.weekEnd}`,
      'adminWeeklyReport',
      emailData
    )
  );

  return await Promise.allSettled(promises);
}

// 🟢 LOW PRIORITY: System Alert
async sendSystemAlert(alertData) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
  const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || [];
  
  const allEmails = [...new Set([...adminEmails, ...superAdminEmails])];
  
  const severityColors = {
    'critical': '#f44336',
    'warning': '#ff9800',
    'info': '#2196f3',
    'success': '#4caf50'
  };

  const emailData = {
    alertType: 'system_alert',
    severity: alertData.severity || 'info',
    severityColor: severityColors[alertData.severity] || '#2196f3',
    title: alertData.title,
    message: alertData.message,
    component: alertData.component || 'System',
    timestamp: new Date().toLocaleString('en-IN'),
    actionRequired: alertData.actionRequired || 'Review system logs',
    dashboardUrl: `${config.FRONTEND_URL}/admin/system`
  };

  const promises = allEmails.map(email =>
    this.sendEmail(
      email.trim(),
      `🖥️ System Alert: ${alertData.title}`,
      'adminSystemAlert',
      emailData
    )
  );

  return await Promise.allSettled(promises);
}

  // ============ EXISTING METHODS (PRESERVED FOR AUTH) ============

  // Send email verification
  async sendEmailVerification(email, verificationToken, userName) {
    const frontendUrl = config.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: config.SMTP.FROM_EMAIL || 'noreply@ayursutra.com',
      to: email,
      subject: 'Verify Your AyurSutra Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5aa0;">Welcome to AyurSutra, ${userName}!</h2>
          <p>Thank you for signing up with AyurSutra - your comprehensive Panchakarma management platform.</p>
          <p>Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you didn't create an account with AyurSutra, please ignore this email.
          </p>
        </div>
      `
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log('✅ Email verification sent to:', email);
      return { success: true };
    } catch (error) {
      console.error('❌ Email sending error:', error.message);
      throw new Error('Failed to send verification email');
    }
  }

  // Send phone OTP
  async sendPhoneOTP(phone, otp, userName) {
    if (!this.twilioClient || !config.TWILIO.PHONE_NUMBER) {
      console.warn('⚠️ SMS service not configured - OTP logged instead');
      console.log(`📱 OTP for ${phone}: ${otp}`);
      return { success: true, message: 'OTP logged to console (SMS not configured)' };
    }

    const message = `Hello ${userName}! Your AyurSutra verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: config.TWILIO.PHONE_NUMBER,
        to: phone
      });
      console.log('✅ SMS OTP sent to:', phone);
      return { success: true };
    } catch (error) {
      console.error('❌ SMS sending error:', error.message);
      throw new Error('Failed to send OTP');
    }
  }

  // ============ THERAPIST ASSIGNMENT NOTIFICATION ============
async sendTherapistAssignment(assignmentData) {
  const { therapistEmail, therapistName, patientName, therapyType, scheduledAt } = assignmentData;
  
  const emailData = {
    therapistName,
    patientName,
    therapyType,
    appointmentDate: new Date(scheduledAt).toLocaleDateString('en-IN'),
    appointmentTime: new Date(scheduledAt).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    dashboardUrl: `${config.FRONTEND_URL}/therapist/dashboard`
  };

  return await this.sendEmail(
    therapistEmail,
    `📋 New Appointment Assigned - ${therapyType}`,
    'therapistAssignment',
    emailData
  );
}

  // Send welcome email
  async sendWelcomeEmail(email, userName) {
    const frontendUrl = config.FRONTEND_URL || 'http://localhost:3000';

    const mailOptions = {
      from: config.SMTP.FROM_EMAIL || 'noreply@ayursutra.com',
      to: email,
      subject: 'Welcome to AyurSutra - Your Account is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5aa0;">Welcome to AyurSutra, ${userName}!</h2>
          <p>Your account has been successfully verified and is now ready to use.</p>
          <p>With AyurSutra, you can:</p>
          <ul>
            <li>Find nearby Panchakarma therapy centers</li>
            <li>Get AI-powered therapy recommendations</li>
            <li>Book and manage your therapy sessions</li>
            <li>Track your healing progress in real-time</li>
            <li>Receive personalized care notifications</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/dashboard" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Start Your Healing Journey
            </a>
          </div>
          <p>Thank you for choosing AyurSutra for your wellness journey!</p>
        </div>
      `
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent to:', email);
    } catch (error) {
      console.error('⚠️ Welcome email error:', error.message);
      // Not critical → don't throw
    }
  }

  // Test email config
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

  // ============ NEW PANCHAKARMA-SPECIFIC METHODS ============

  // Helper method for sending emails with fallback templates
  async sendEmail(to, subject, templateName, data = {}) {
    try {
      let htmlContent;
      
      // Try to load template file first
      try {
        const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateSource);
        htmlContent = template(data);
      } catch (templateError) {
        // Use fallback template if file not found
        console.warn(`⚠️ Template ${templateName} not found, using fallback`);
        htmlContent = this.getFallbackTemplate(templateName, data);
      }

      const mailOptions = {
        from: config.SMTP.FROM_EMAIL || 'noreply@ayursutra.com',
        to,
        subject,
        html: htmlContent
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: to
      };
    } catch (error) {
      console.error(`❌ Email failed to ${to}:`, error.message);
      throw error;
    }
  }

  // Helper method for sending SMS
  async sendSMS(to, message) {
    try {
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
        to: to
      });

      console.log(`✅ SMS sent to ${to}: ${result.sid}`);
      
      return {
        success: true,
        messageId: result.sid,
        recipient: to
      };
    } catch (error) {
      console.error(`❌ SMS failed to ${to}:`, error.message);
      throw error;
    }
  }

  // ============ APPOINTMENT NOTIFICATIONS ============

  async sendAppointmentConfirmation(appointment) {
    const { patientEmail, patientName, therapyType, scheduledAt, centerName } = appointment;
    
    const emailData = {
      patientName,
      therapyType,
      appointmentDate: new Date(scheduledAt).toLocaleDateString('en-IN'),
      appointmentTime: new Date(scheduledAt).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      centerName: centerName || 'AyurSutra Wellness Center',
      frontendUrl: config.FRONTEND_URL || 'http://localhost:3000'
    };

    return await this.sendEmail(
      patientEmail,
      `🌿 Appointment Confirmed - ${therapyType} Therapy`,
      'appointmentConfirmation',
      emailData
    );
  }

  async sendAppointmentReminder(appointment) {
    const { patientEmail, patientName, therapyType, scheduledAt, centerName } = appointment;
    
    const emailData = {
      patientName,
      therapyType,
      appointmentDate: new Date(scheduledAt).toLocaleDateString('en-IN'),
      appointmentTime: new Date(scheduledAt).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      centerName: centerName || 'AyurSutra Wellness Center',
      reminderTime: '24 hours',
      frontendUrl: config.FRONTEND_URL || 'http://localhost:3000'
    };

    return await this.sendEmail(
      patientEmail,
      `⏰ Reminder: Your ${therapyType} Session Tomorrow`,
      'appointmentReminder',
      emailData
    );
  }

  async sendAppointmentCancellation(appointment) {
    const { patientEmail, patientName, therapyType, scheduledAt, reason } = appointment;
    
    const emailData = {
      patientName,
      therapyType,
      appointmentDate: new Date(scheduledAt).toLocaleDateString('en-IN'),
      appointmentTime: new Date(scheduledAt).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      reason: reason || 'unavoidable circumstances',
      frontendUrl: config.FRONTEND_URL || 'http://localhost:3000'
    };

    return await this.sendEmail(
      patientEmail,
      `Appointment Cancelled - ${therapyType} on ${emailData.appointmentDate}`,
      'appointmentCancellation',
      emailData
    );
  }

  // ============ FEEDBACK NOTIFICATIONS ============

  async sendFeedbackRequest(consultation) {
    const { patientEmail, patientName, therapyType, sessionId, centerName } = consultation;
    
    const emailData = {
      patientName,
      therapyType,
      feedbackUrl: `${config.FRONTEND_URL || 'http://localhost:3000'}/feedback/${sessionId}`,
      centerName: centerName || 'AyurSutra Wellness Center'
    };

    return await this.sendEmail(
      patientEmail,
      `💝 Share Your Experience - ${therapyType} Session Feedback`,
      'feedbackRequest',
      emailData
    );
  }

  async sendCriticalFeedbackAlert(feedbackData) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
    
    const emailData = {
      patientName: feedbackData.patientName,
      therapyType: feedbackData.therapyType,
      rating: feedbackData.averageRating,
      concerns: feedbackData.textFeedback?.concernsOrIssues,
      feedbackUrl: `${config.FRONTEND_URL || 'http://localhost:3003'}/admin/feedback/${feedbackData._id}`,
      timestamp: new Date().toLocaleString('en-IN')
    };

    const promises = adminEmails.map(email =>
      this.sendEmail(
        email.trim(),
        '🚨 Critical Patient Feedback Requires Attention',
        'criticalFeedbackAlert',
        emailData
      )
    );

    return await Promise.allSettled(promises);
  }

  // ============ THERAPY-SPECIFIC NOTIFICATIONS ============

  async sendPreTherapyInstructions(appointment) {
    const { patientEmail, patientName, therapyType, scheduledAt } = appointment;
    
    const emailData = {
      patientName,
      therapyType,
      appointmentDate: new Date(scheduledAt).toLocaleDateString('en-IN'),
      instructions: this.getTherapyInstructions(therapyType)
    };

    return await this.sendEmail(
      patientEmail,
      `📋 Pre-Therapy Instructions - ${therapyType}`,
      'preTherapyInstructions',
      emailData
    );
  }

  async sendPostTherapyCare(consultation) {
    const { patientEmail, patientName, therapyType } = consultation;
    
    const emailData = {
      patientName,
      therapyType,
      careInstructions: this.getPostTherapyCare(therapyType)
    };

    return await this.sendEmail(
      patientEmail,
      `🌿 Post-Therapy Care Instructions - ${therapyType}`,
      'postTherapyCare',
      emailData
    );
  }

  // ============ BULK NOTIFICATIONS ============

  async sendBulkNotifications(recipients, subject, templateName, data) {
    const promises = recipients.map(recipient =>
      this.sendEmail(recipient.email, subject, templateName, {
        ...data,
        ...recipient
      })
    );

    return await Promise.allSettled(promises);
  }

  async sendHealthTips(patientData) {
    const { email, name, preferences } = patientData;
    
    const emailData = {
      patientName: name,
      tips: this.getPersonalizedHealthTips(preferences),
      frontendUrl: config.FRONTEND_URL || 'http://localhost:3000'
    };

    return await this.sendEmail(
      email,
      '🌿 Your Weekly Wellness Tips',
      'healthTips',
      emailData
    );
  }

  // ============ UTILITY METHODS ============

  getFallbackTemplate(templateName, data) {
    const fallbackTemplates = {
      appointmentConfirmation: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c5aa0;">🌿 Appointment Confirmed</h2>
          <p>Dear ${data.patientName || 'Patient'},</p>
          <p>Your <strong>${data.therapyType || 'therapy'}</strong> appointment has been confirmed for:</p>
          <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>📅 Date:</strong> ${data.appointmentDate || 'TBD'}</p>
            <p><strong>⏰ Time:</strong> ${data.appointmentTime || 'TBD'}</p>
            <p><strong>🏥 Location:</strong> ${data.centerName || 'AyurSutra Wellness Center'}</p>
          </div>
          <p>Please arrive 15 minutes early. We look forward to serving you!</p>
          <p style="color: #666;">Thank you for choosing ${data.centerName || 'AyurSutra Wellness Center'}</p>
        </div>
      `,
      appointmentReminder: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff6b35;">⏰ Appointment Reminder</h2>
          <p>Dear ${data.patientName || 'Patient'},</p>
          <p>This is a friendly reminder about your <strong>${data.therapyType || 'therapy'}</strong> appointment:</p>
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>📅 Tomorrow:</strong> ${data.appointmentDate || 'TBD'}</p>
            <p><strong>⏰ Time:</strong> ${data.appointmentTime || 'TBD'}</p>
          </div>
          <h3>🌿 Preparation Tips:</h3>
          <ul>
            <li>Arrive 15 minutes early</li>
            <li>Wear comfortable, loose-fitting clothes</li>
            <li>Avoid heavy meals 2 hours before</li>
            <li>Stay well hydrated</li>
          </ul>
          <p>We look forward to seeing you tomorrow!</p>
        </div>
      `,
      feedbackRequest: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4facfe;">💝 Share Your Experience</h2>
          <p>Dear ${data.patientName || 'Patient'},</p>
          <p>We hope you had a wonderful <strong>${data.therapyType || 'therapy'}</strong> session with us!</p>
          <p>Your feedback helps us continue providing excellent Panchakarma care.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.feedbackUrl || '#'}" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Share Your Feedback
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">Takes less than 2 minutes • Your feedback is valuable to us</p>
          <p>Thank you for choosing ${data.centerName || 'AyurSutra Wellness Center'}!</p>
        </div>
      `,
      criticalFeedbackAlert: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f44336;">🚨 Critical Feedback Alert</h2>
          <p><strong>A patient has submitted feedback that requires immediate attention.</strong></p>
          <div style="background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 15px 0;">
            <p><strong>Patient:</strong> ${data.patientName || 'N/A'}</p>
            <p><strong>Therapy:</strong> ${data.therapyType || 'N/A'}</p>
            <p><strong>Rating:</strong> ${data.rating || 'N/A'}/5 ⭐</p>
            <p><strong>Concerns:</strong> ${data.concerns || 'N/A'}</p>
            <p><strong>Time:</strong> ${data.timestamp || new Date().toLocaleString()}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.feedbackUrl || '#'}" style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Review Feedback Immediately
            </a>
          </div>
        </div>
      `
    };

    return fallbackTemplates[templateName] || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>🌿 Notification from AyurSutra</h2>
        <p>Dear ${data.patientName || 'Valued Patient'},</p>
        <p>Thank you for choosing AyurSutra for your wellness journey!</p>
      </div>
    `;
  }

  getTherapyInstructions(therapyType) {
    const instructions = {
      abhyanga: [
        'Take a light meal 2 hours before therapy',
        'Wear comfortable, easily removable clothing',
        'Inform us about any skin allergies or sensitivities',
        'Arrive 15 minutes early for consultation'
      ],
      shirodhara: [
        'Avoid washing hair on the day of treatment',
        'Wear old clothes (oil may stain)',
        'Do not consume alcohol 24 hours prior',
        'Bring a towel and extra clothes'
      ],
      panchakarma: [
        'Follow the prescribed diet regimen',
        'Avoid strenuous activities before treatment',
        'Complete all pre-therapy consultations',
        'Bring prescribed medications and reports'
      ]
    };

    return instructions[therapyType?.toLowerCase()] || instructions.abhyanga;
  }

  getPostTherapyCare(therapyType) {
    const careInstructions = {
      abhyanga: [
        'Keep the body warm for 2-3 hours post-therapy',
        'Avoid cold water bath for 6 hours',
        'Drink warm water throughout the day',
        'Rest for at least 1 hour after treatment'
      ],
      shirodhara: [
        'Do not wash hair for 6 hours',
        'Avoid direct sunlight and cold air',
        'Take gentle head massage if comfortable',
        'Sleep early and avoid screen time'
      ],
      panchakarma: [
        'Follow prescribed post-therapy diet strictly',
        'Take adequate rest and avoid exertion',
        'Continue prescribed medications as advised',
        'Schedule follow-up consultation as recommended'
      ]
    };

    return careInstructions[therapyType?.toLowerCase()] || careInstructions.abhyanga;
  }

  getPersonalizedHealthTips(preferences = {}) {
    const tips = [
      '🌅 Start your day with warm water and lemon',
      '🧘‍♀️ Practice 10 minutes of meditation daily',
      '🌿 Include turmeric in your diet for natural healing',
      '💧 Stay hydrated with 8-10 glasses of water daily',
      '🚶‍♂️ Take a 20-minute walk in nature',
      '😴 Maintain consistent sleep schedule (10 PM - 6 AM)',
      '🍃 Practice deep breathing exercises'
    ];

    return tips.slice(0, 5); // Return 5 tips
  }

  // ============ ENHANCED TESTING METHODS ============

  async testSMSConnection() {
    try {
      if (!this.twilioClient) {
        console.log('⚠️ SMS service not configured');
        return false;
      }
      
      // Test by fetching account info
      await this.twilioClient.api.accounts(config.TWILIO.ACCOUNT_SID).fetch();
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
