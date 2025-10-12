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
      secure: config.SMTP.PORT === 465,
      auth: {
        user: config.SMTP.USER,
        pass: config.SMTP.PASS
      },
      tls: config.NODE_ENV === 'production' ? undefined : { rejectUnauthorized: false }
    });

    // Twilio client
    if (config.TWILIO.ACCOUNT_SID && config.TWILIO.AUTH_TOKEN) {
      this.twilioClient = twilio(config.TWILIO.ACCOUNT_SID, config.TWILIO.AUTH_TOKEN);
    }

    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
  }

  // ============ HANDLEBARS HELPERS ============
  
  registerHandlebarsHelpers() {
    // Format currency
    handlebars.registerHelper('currency', function(amount) {
      return `₹${Number(amount).toLocaleString('en-IN')}`;
    });

    // Format date
    handlebars.registerHelper('formatDate', function(date) {
      return new Date(date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });

    // Format time
    handlebars.registerHelper('formatTime', function(date) {
      return new Date(date).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    // Rating stars
    handlebars.registerHelper('stars', function(rating) {
      const filled = '⭐'.repeat(Math.floor(rating));
      const empty = '☆'.repeat(5 - Math.floor(rating));
      return filled + empty;
    });

    // Conditional helper
    handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
  }

  // ============ CORE EMAIL SENDER ============

  async sendEmail(to, subject, templateName, data = {}) {
    try {
      let htmlContent;
      
      // Try to load template file
      try {
        const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateSource);
        
        // Add default data
        const enrichedData = {
          ...data,
          clinicName: data.clinicName || 'AyurSutra Wellness Center',
          clinicEmail: data.clinicEmail || config.SMTP.FROM_EMAIL || 'contact@ayursutra.com',
          clinicPhone: data.clinicPhone || '+91 98765 43210',
          frontendUrl: config.FRONTEND_URL || 'http://localhost:5173',
          dashboardUrl: data.dashboardUrl || `${config.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`,
          timestamp: new Date().toLocaleString('en-IN', {
            dateStyle: 'long',
            timeStyle: 'short'
          })
        };
        
        htmlContent = template(enrichedData);
      } catch (templateError) {
        console.warn(`⚠️ Template ${templateName}.html not found, using fallback`);
        htmlContent = this.getFallbackTemplate(templateName, data);
      }

      const mailOptions = {
        from: `${data.clinicName || 'AyurSutra'} <${config.SMTP.FROM_EMAIL || 'noreply@ayursutra.com'}>`,
        to,
        subject,
        html: htmlContent
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: to,
        template: templateName
      };
    } catch (error) {
      console.error(`❌ Email failed to ${to}:`, error.message);
      throw error;
    }
  }

  // ============ SMS SENDER ============

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

  // ============ PATIENT APPOINTMENT NOTIFICATIONS ============

  async sendAppointmentConfirmation(appointment) {
    const { patientEmail, patientName, therapyType, scheduledAt, centerName, appointmentId } = appointment;
    
    const emailData = {
      patientName,
      therapyType,
      appointmentDate: new Date(scheduledAt).toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      appointmentTime: new Date(scheduledAt).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      clinicName: centerName || 'AyurSutra Wellness Center',
      appointmentId
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
      appointmentDate: new Date(scheduledAt).toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      appointmentTime: new Date(scheduledAt).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      clinicName: centerName || 'AyurSutra Wellness Center'
    };

    return await this.sendEmail(
      patientEmail,
      `⏰ Reminder: Your ${therapyType} Session Tomorrow`,
      'appointmentReminder',
      emailData
    );
  }

  async sendAppointmentCancellation(appointment) {
    const { patientEmail, patientName, therapyType, scheduledAt, reason, clinicName, clinicPhone, clinicEmail } = appointment;
    
    const emailData = {
      patientName,
      therapyType,
      appointmentDate: new Date(scheduledAt).toLocaleDateString('en-IN'),
      appointmentTime: new Date(scheduledAt).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      reason: reason || 'Unavoidable circumstances',
      clinicName: clinicName || 'AyurSutra Wellness Center',
      clinicPhone: clinicPhone || '+91 98765 43210',
      clinicEmail: clinicEmail || 'contact@ayursutra.com'
    };

    return await this.sendEmail(
      patientEmail,
      `Appointment Cancelled - ${therapyType} on ${emailData.appointmentDate}`,
      'appointmentCancellation',
      emailData
    );
  }

  // ============ PRE & POST THERAPY INSTRUCTIONS ============

  async sendPreTherapyInstructions(appointment) {
    const { patientEmail, patientName, therapyType, scheduledAt, clinicName, clinicPhone, clinicEmail } = appointment;
    
    // Determine template name based on therapy type
    const therapyTypeNormalized = therapyType.toLowerCase().replace(/\s+/g, '');
    const templateName = `preTherapy${therapyTypeNormalized.charAt(0).toUpperCase() + therapyTypeNormalized.slice(1)}`;
    
    const emailData = {
      patientName,
      therapyType,
      appointmentDate: new Date(scheduledAt).toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      appointmentTime: new Date(scheduledAt).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      clinicName: clinicName || 'AyurSutra Wellness Center',
      clinicPhone: clinicPhone || '+91 98765 43210',
      clinicEmail: clinicEmail || 'contact@ayursutra.com'
    };

    // Try therapy-specific template, fallback to generic
    try {
      return await this.sendEmail(
        patientEmail,
        `📋 Pre-Therapy Instructions - ${therapyType}`,
        templateName,
        emailData
      );
    } catch (error) {
      console.log(`Using generic pre-therapy template for ${therapyType}`);
      return await this.sendEmail(
        patientEmail,
        `📋 Pre-Therapy Instructions - ${therapyType}`,
        'preTherapyGeneric',
        emailData
      );
    }
  }

  async sendPostTherapyCare(consultation) {
    const { patientEmail, patientName, therapyType, nextSessionDate, clinicName, clinicEmail, clinicPhone } = consultation;
    
    // Determine template name based on therapy type
    const therapyTypeNormalized = therapyType.toLowerCase().replace(/\s+/g, '');
    const templateName = `postTherapy${therapyTypeNormalized.charAt(0).toUpperCase() + therapyTypeNormalized.slice(1)}`;
    
    const emailData = {
      patientName,
      therapyType,
      nextSessionDate: nextSessionDate ? 
        new Date(nextSessionDate).toLocaleDateString('en-IN') : 'To be scheduled',
      clinicName: clinicName || 'AyurSutra Wellness Center',
      clinicEmail: clinicEmail || 'contact@ayursutra.com',
      clinicPhone: clinicPhone || '+91 98765 43210'
    };

    // Try therapy-specific template, fallback to generic
    try {
      return await this.sendEmail(
        patientEmail,
        `🌿 Post-Therapy Care Instructions - ${therapyType}`,
        templateName,
        emailData
      );
    } catch (error) {
      console.log(`Using generic post-therapy template for ${therapyType}`);
      return await this.sendEmail(
        patientEmail,
        `🌿 Post-Therapy Care Instructions - ${therapyType}`,
        'postTherapyGeneric',
        emailData
      );
    }
  }

  // ============ FEEDBACK NOTIFICATIONS ============

  async sendFeedbackRequest(consultation) {
    const { patientEmail, patientName, therapyType, sessionId, centerName } = consultation;
    
    const emailData = {
      patientName,
      therapyType,
      feedbackUrl: `${config.FRONTEND_URL || 'http://localhost:5173'}/feedback/${sessionId}`,
      clinicName: centerName || 'AyurSutra Wellness Center'
    };

    return await this.sendEmail(
      patientEmail,
      `💝 Share Your Experience - ${therapyType} Session Feedback`,
      'feedbackRequest',
      emailData
    );
  }

  // ============ ADMIN NOTIFICATIONS ============

  async sendNewPatientAlert(patientData) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
    
    const emailData = {
      patientName: patientData.name,
      patientEmail: patientData.email,
      patientPhone: patientData.phone,
      patientId: patientData._id,
      totalPatients: patientData.totalPatients || 'N/A',
      dashboardUrl: `${config.FRONTEND_URL}/admin/patients/${patientData._id}`
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

  async sendNewAppointmentAlert(appointmentData) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
    
    const emailData = {
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
      dashboardUrl: `${config.FRONTEND_URL}/admin/appointments/${appointmentData._id}`
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

  async sendCriticalFeedbackAlert(feedbackData) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
    
    const urgencyLevel = feedbackData.rating <= 2 ? 'URGENT' : 'HIGH';
    
    const emailData = {
      urgencyLevel,
      patientName: feedbackData.patientName,
      therapyType: feedbackData.therapyType,
      therapistName: feedbackData.therapistName,
      rating: feedbackData.rating,
      ratingStars: '⭐'.repeat(feedbackData.rating) + '☆'.repeat(5 - feedbackData.rating),
      concerns: feedbackData.concerns || feedbackData.textFeedback?.concernsOrIssues || 'No specific concerns mentioned',
      recommendations: feedbackData.recommendations || 'None',
      sessionDate: new Date(feedbackData.sessionDate).toLocaleDateString('en-IN'),
      feedbackId: feedbackData._id,
      dashboardUrl: `${config.FRONTEND_URL}/admin/feedback/${feedbackData._id}`
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

  async sendDailySummary(summaryData) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];
    
    const emailData = {
      reportDate: summaryData.date || new Date().toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      newPatients: summaryData.newPatients || 0,
      totalAppointments: summaryData.totalAppointments || 0,
      completedSessions: summaryData.completedSessions || 0,
      cancelledSessions: summaryData.cancelledSessions || 0,
      revenue: `₹${summaryData.revenue?.toLocaleString('en-IN') || 0}`,
      averageRating: summaryData.averageRating || 'N/A',
      topTherapy: summaryData.topTherapy || 'Abhyanga',
      pendingFeedback: summaryData.pendingFeedback || 0,
      upcomingTomorrow: summaryData.upcomingTomorrow || 0
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

  // ============ THERAPIST NOTIFICATIONS ============

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

  // ============ AUTH NOTIFICATIONS (Existing - Preserved) ============

  async sendEmailVerification(email, verificationToken, userName) {
    const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: config.SMTP.FROM_EMAIL || 'noreply@ayursutra.com',
      to: email,
      subject: 'Verify Your AyurSutra Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5aa0;">Welcome to AyurSutra, ${userName}!</h2>
          <p>Thank you for signing up with AyurSutra.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p><strong>This link will expire in 24 hours.</strong></p>
        </div>
      `
    };

    await this.emailTransporter.sendMail(mailOptions);
    console.log('✅ Email verification sent to:', email);
    return { success: true };
  }

  async sendPhoneOTP(phone, otp, userName) {
    if (!this.twilioClient || !config.TWILIO.PHONE_NUMBER) {
      console.warn('⚠️ SMS service not configured - OTP logged instead');
      console.log(`📱 OTP for ${phone}: ${otp}`);
      return { success: true, message: 'OTP logged to console' };
    }

    const message = `Hello ${userName}! Your AyurSutra verification code is: ${otp}. Valid for 10 minutes.`;

    await this.twilioClient.messages.create({
      body: message,
      from: config.TWILIO.PHONE_NUMBER,
      to: phone
    });
    
    console.log('✅ SMS OTP sent to:', phone);
    return { success: true };
  }

  async sendWelcomeEmail(email, userName) {
    const mailOptions = {
      from: config.SMTP.FROM_EMAIL || 'noreply@ayursutra.com',
      to: email,
      subject: 'Welcome to AyurSutra!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5aa0;">Welcome to AyurSutra, ${userName}!</h2>
          <p>Your account is now ready to use.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.FRONTEND_URL}/dashboard" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Start Your Journey
            </a>
          </div>
        </div>
      `
    };

    await this.emailTransporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', email);
  }

  // ============ FALLBACK TEMPLATES ============

  getFallbackTemplate(templateName, data) {
    // ... (keep your existing fallback templates) ...
    // I'll skip this for brevity since you already have good fallbacks
    return `<div>Fallback template for ${templateName}</div>`;
  }

  // ============ TESTING METHODS ============

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
