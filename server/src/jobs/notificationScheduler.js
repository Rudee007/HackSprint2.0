const cron = require('node-cron');
const NotificationService = require('../services/notification.service');
const Consultation = require('../models/Consultation');
const Feedback = require('../models/Feedback');

class NotificationScheduler {
  
  static init() {
    console.log('🕐 Initializing notification scheduler...');

    // Send appointment reminders daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Running daily appointment reminders...');
      await this.sendDailyReminders();
    });

    // Send feedback requests daily at 6 PM for completed sessions
    cron.schedule('0 18 * * *', async () => {
      console.log('💝 Running daily feedback requests...');
      await this.sendFeedbackRequests();
    });

    // Weekly summary for admins on Mondays at 10 AM
    cron.schedule('0 10 * * 1', async () => {
      console.log('📊 Running weekly summary...');
      await this.sendWeeklySummary();
    });

    console.log('✅ Notification scheduler initialized successfully');
  }

  static async sendDailyReminders() {
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
        status: 'scheduled'
      }).populate('patientId', 'name email notificationPreferences');

      console.log(`📧 Found ${upcomingAppointments.length} appointments for tomorrow`);

      for (const consultation of upcomingAppointments) {
        // Check if user wants reminders
        if (consultation.patientId.notificationPreferences?.appointmentReminder !== false) {
          const appointmentData = {
            patientEmail: consultation.patientId.email,
            patientName: consultation.patientId.name,
            therapyType: consultation.therapyType || 'Panchakarma',
            scheduledAt: consultation.scheduledAt
          };

          await NotificationService.sendAppointmentReminder(appointmentData);
        }
      }

      console.log('✅ Daily reminders completed');
    } catch (error) {
      console.error('❌ Error sending daily reminders:', error);
    }
  }

  static async sendFeedbackRequests() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      // Find completed sessions from yesterday without feedback
      const completedSessions = await Consultation.find({
        status: 'completed',
        sessionEndTime: {
          $gte: yesterday,
          $lte: endOfYesterday
        }
      }).populate('patientId', 'name email notificationPreferences');

      for (const consultation of completedSessions) {
        // Check if feedback already exists
        const existingFeedback = await Feedback.findOne({ sessionId: consultation._id });
        
        if (!existingFeedback && consultation.patientId.notificationPreferences?.feedbackRequest !== false) {
          const consultationData = {
            patientEmail: consultation.patientId.email,
            patientName: consultation.patientId.name,
            therapyType: consultation.therapyType || 'Panchakarma',
            sessionId: consultation._id
          };

          await NotificationService.sendFeedbackRequest(consultationData);
        }
      }

      console.log('✅ Feedback requests completed');
    } catch (error) {
      console.error('❌ Error sending feedback requests:', error);
    }
  }

  static async sendWeeklySummary() {
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const weeklyStats = await Consultation.aggregate([
        {
          $match: {
            createdAt: { $gte: lastWeek },
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

      // Send weekly summary to admins
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@panchakarma.com'];
      
      const summaryData = {
        weekStart: lastWeek.toLocaleDateString(),
        weekEnd: new Date().toLocaleDateString(),
        stats: weeklyStats
      };

      for (const email of adminEmails) {
        await NotificationService.sendEmail(
          email,
          '📊 Weekly Summary - Panchakarma Management',
          'weeklySummary',
          summaryData
        );
      }

      console.log('✅ Weekly summary sent to admins');
    } catch (error) {
      console.error('❌ Error sending weekly summary:', error);
    }
  }
}

module.exports = NotificationScheduler;
