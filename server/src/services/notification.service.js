// src/jobs/notificationScheduler.js
const cron = require('node-cron');

const NotificationService = require('../services/notification.service');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const TreatmentPlan = require('../models/TreatmentPlan');
const Prescription = require('../models/Prescription');
const Feedback = require('../models/Feedback');

class NotificationScheduler {
  static init() {
    console.log('🕐 Initializing notification scheduler...');

    // 1) Generic dispatcher: run every minute
    cron.schedule('* * * * *', async () => {
      console.log('📤 Running scheduled notification dispatcher...');
      await this.dispatchDueNotifications();
    });

    // 2) Daily appointment reminders (for tomorrow) at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Running daily appointment reminders (for tomorrow)...');
      await this.sendDailyConsultationReminders();
    });

    // 3) Daily feedback requests for completed sessions at 6 PM
    cron.schedule('0 18 * * *', async () => {
      console.log('💝 Running daily feedback requests for completed sessions...');
      await this.sendDailyFeedbackRequests();
    });

    // 4) Daily prescription end reminder planner at 8 AM
    cron.schedule('0 8 * * *', async () => {
      console.log('💊 Scheduling prescription end reminders...');
      await this.schedulePrescriptionEndReminders();
    });

    // 5) Daily therapy reminders: schedule from TreatmentPlan.generatedSessions at 7 AM
    cron.schedule('0 7 * * *', async () => {
      console.log('🧘 Scheduling daily therapy reminders...');
      await this.scheduleTodayTherapyReminders();
    });

    // 6) Weekly admin summary on Mondays at 10 AM
    cron.schedule('0 10 * * 1', async () => {
      console.log('📊 Running weekly summary (admin)...');
      await this.sendWeeklySummary();
    });

    console.log('✅ Notification scheduler initialized successfully');
  }

  // =========================================================
  // 1. GENERIC DISPATCHER (FOR ANY SCHEDULED NOTIFICATION)
  // =========================================================

  static async dispatchDueNotifications() {
    try {
      const now = new Date();

      const dueNotifications = await Notification.find({
        overallStatus: { $in: ['pending', 'queued'] },
        scheduledAt: { $lte: now }
      })
        .sort({ scheduledAt: 1 })
        .limit(50); // batch size

      if (!dueNotifications.length) return;

      console.log(`📨 Found ${dueNotifications.length} due notifications to dispatch`);

      for (const notif of dueNotifications) {
        await NotificationService.dispatchNow(notif);
      }

      console.log('✅ Due notifications dispatched');
    } catch (err) {
      console.error('❌ Error in dispatchDueNotifications:', err);
    }
  }

  // =========================================================
  // 2. DAILY CONSULTATION REMINDERS (FOR TOMORROW)
  // =========================================================

  static async sendDailyConsultationReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);

      const upcomingAppointments = await Consultation.find({
        scheduledAt: {
          $gte: tomorrow,
          $lte: endOfTomorrow
        },
        status: { $in: ['scheduled', 'confirmed'] }
      }).populate('patientId', 'name email phone notificationPreferences');

      console.log(
        `📧 Found ${upcomingAppointments.length} consultations for reminder (tomorrow)`
      );

      for (const consultation of upcomingAppointments) {
        const patient = consultation.patientId;
        if (!patient) continue;

        // Respect user preferences if present
        const prefs = patient.notificationPreferences || {};
        if (prefs.appointmentReminder === false) continue;

        // Build a session-like object for therapy reminder if you want to use scheduleDailyTherapyReminder.
        // Here we send a generic email-only reminder via existing legacy helper for simplicity.

        const appointmentData = {
          patientEmail: patient.email,
          patientName: patient.name,
          therapyType:
            consultation.therapyType || consultation.sessionType || 'Panchakarma',
          scheduledAt: consultation.scheduledAt,
          centerName: consultation.centerName || 'AyurSutra Wellness Center'
        };

        await NotificationService.sendAppointmentReminder(appointmentData);
      }

      console.log('✅ Daily consultation reminders completed');
    } catch (err) {
      console.error('❌ Error in sendDailyConsultationReminders:', err);
    }
  }

  // =========================================================
  // 3. DAILY FEEDBACK REQUESTS (FOR YESTERDAY COMPLETED)
  // =========================================================

  static async sendDailyFeedbackRequests() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      const completedSessions = await Consultation.find({
        status: 'completed',
        sessionEndTime: {
          $gte: yesterday,
          $lte: endOfYesterday
        }
      }).populate('patientId', 'name email phone notificationPreferences');

      console.log(
        `💬 Found ${completedSessions.length} completed sessions from yesterday`
      );

      for (const consultation of completedSessions) {
        const patient = consultation.patientId;
        if (!patient) continue;

        // Skip if feedback already exists
        const existingFeedback = await Feedback.findOne({
          sessionId: consultation._id
        });
        if (existingFeedback) continue;

        const prefs = patient.notificationPreferences || {};
        if (prefs.feedbackRequest === false) continue;

        // Use unified feedback notification (in-app + email + SMS)
        const session = {
          therapyName:
            consultation.therapyType || consultation.sessionType || 'Panchakarma',
          consultationId: consultation._id,
          scheduledEndTime: consultation.sessionEndTime || consultation.scheduledAt
        };

        await NotificationService.notifyFeedbackAfterTherapy({
          session,
          patient,
          provider: null
        });
      }

      console.log('✅ Daily feedback notifications completed');
    } catch (err) {
      console.error('❌ Error in sendDailyFeedbackRequests:', err);
    }
  }

  // =========================================================
  // 4. PRESCRIPTION END REMINDERS
  // =========================================================

  static async schedulePrescriptionEndReminders() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Example: plan for prescriptions ending within next 3 days
      const threeDaysAhead = new Date(today);
      threeDaysAhead.setDate(today.getDate() + 3);

      const prescriptions = await Prescription.find({
        endDate: { $gte: today, $lte: threeDaysAhead }
      }).populate('patientId', 'name email phone notificationPreferences');

      console.log(
        `💊 Found ${prescriptions.length} prescriptions ending within next 3 days`
      );

      for (const prescription of prescriptions) {
        const patient = prescription.patientId;
        if (!patient) continue;

        const prefs = patient.notificationPreferences || {};
        // Add per-feature flag if you have one; for now, just respect global.
        if (prefs.smsNotifications === false && prefs.emailNotifications === false) {
          continue;
        }

        await NotificationService.schedulePrescriptionEndReminder({
          prescription,
          patient
        });
      }

      console.log('✅ Prescription end reminders scheduled');
    } catch (err) {
      console.error('❌ Error in schedulePrescriptionEndReminders:', err);
    }
  }

  // =========================================================
  // 5. DAILY THERAPY REMINDERS FROM GENERATED SESSIONS
  // =========================================================

  static async scheduleTodayTherapyReminders() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      // Find sessions scheduled for today in TreatmentPlan.generatedSessions
      const plans = await TreatmentPlan.find({
        'generatedSessions.scheduledDate': {
          $gte: today,
          $lte: endOfToday
        }
      }).populate('patientId', 'name email phone notificationPreferences');

      if (!plans.length) {
        console.log('🧘 No generated sessions found for today');
        return;
      }

      let count = 0;

      for (const plan of plans) {
        const patient = plan.patientId;
        if (!patient) continue;

        const prefs = patient.notificationPreferences || {};
        // If user disabled appointmentReminder, skip
        if (prefs.appointmentReminder === false) continue;

        const sessionsForToday = plan.generatedSessions.filter((s) => {
          const d = new Date(s.scheduledDate);
          return d >= today && d <= endOfToday && s.status === 'scheduled';
        });

        for (const session of sessionsForToday) {
          // Enrich with planId so Notification links correctly
          session.treatmentPlanId = plan._id;

          await NotificationService.scheduleDailyTherapyReminder({
            session,
            patient
          });
          count++;
        }
      }

      console.log(`✅ Scheduled ${count} therapy reminders for today`);
    } catch (err) {
      console.error('❌ Error in scheduleTodayTherapyReminders:', err);
    }
  }

  // =========================================================
  // 6. WEEKLY SUMMARY (ADMIN EMAIL ONLY)
  // =========================================================

  static async sendWeeklySummary() {
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);

      const now = new Date();

      const weeklyStats = await Consultation.aggregate([
        {
          $match: {
            createdAt: { $gte: lastWeek, $lte: now },
            status: { $in: ['completed', 'scheduled', 'cancelled'] }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const adminEmails =
        process.env.ADMIN_EMAILS?.split(',') || ['admin@ayursutra.com'];

      const summaryData = {
        weekStart: lastWeek.toLocaleDateString('en-IN'),
        weekEnd: now.toLocaleDateString('en-IN'),
        stats: weeklyStats
      };

      for (const email of adminEmails) {
        await NotificationService.sendEmail(
          email.trim(),
          '📊 Weekly Summary - AyurSutra',
          'weeklySummary',
          summaryData
        );
      }

      console.log('✅ Weekly summary sent to admins');
    } catch (err) {
      console.error('❌ Error in sendWeeklySummary:', err);
    }
  }
}

module.exports = NotificationScheduler;
