// src/models/Notification.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CHANNELS = ['in_app', 'email', 'sms'];
const DELIVERY_STATUS = ['pending', 'queued', 'sent', 'delivered', 'read', 'failed'];

const notificationSchema = new Schema(
  {
    // Who receives this notification
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required']
    },

    // High-level event that caused this notification
    eventType: {
      type: String,
      enum: [
        'OTP',
        'CONSULTATION_BOOKED',
        'TREATMENT_PLAN_CREATED',
        'TREATMENT_PLAN_REMINDER_PRE',
        'TREATMENT_PLAN_REMINDER_POST',
        'THERAPY_DAILY_REMINDER',
        'FEEDBACK_AFTER_THERAPY',
        'PRESCRIPTION_FOLLOWUP_REMINDER',
        'SYSTEM'
      ],
      required: [true, 'Notification event type is required']
    },

    // For grouping/filtering in UI
    category: {
      type: String,
      enum: [
        'otp',
        'consultation',
        'treatment',
        'prescription',
        'feedback',
        'system'
      ],
      default: 'system'
    },

    // Links back to domain entities (optional per event)
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: 'Consultation'
    },
    treatmentPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'TreatmentPlan'
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    feedbackId: {
      type: Schema.Types.ObjectId,
      ref: 'Feedback'
    },

    // Human-readable content snapshot (for in-app and auditing)
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    body: {
      type: String,
      required: [true, 'Notification body is required'],
      maxlength: [1000, 'Body cannot exceed 1000 characters']
    },

    // Template + variables for re-rendering / channel-specific formatting
    templateKey: {
      type: String, // e.g. 'otp.sms', 'consultation.booked.email'
    },
    variables: {
      type: Schema.Types.Mixed, // { otp, patientName, doctorName, date, time, therapyName, ... }
    },

    // Channel selection for this notification
    channels: {
      inApp: {
        enabled: { type: Boolean, default: true },
        status: {
          type: String,
          enum: DELIVERY_STATUS,
          default: 'pending'
        },
        deliveredAt: Date,
        readAt: Date
      },
      email: {
        enabled: { type: Boolean, default: false },
        status: {
          type: String,
          enum: DELIVERY_STATUS,
          default: 'pending'
        },
        deliveredAt: Date,
        providerMessageId: String,
        lastError: String
      },
      sms: {
        enabled: { type: Boolean, default: false },
        status: {
          type: String,
          enum: DELIVERY_STATUS,
          default: 'pending'
        },
        deliveredAt: Date,
        providerMessageId: String,
        lastError: String
      }
    },

    // Global priority + scheduling
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },

    // When it should be processed/sent
    scheduledAt: {
      type: Date
    },

    // When any channel was first sent
    firstSentAt: {
      type: Date
    },

    // Expiration: if now > expiresAt, skip sending
    expiresAt: {
      type: Date
    },

    // Aggregated status for convenience (fast query)
    overallStatus: {
      type: String,
      enum: DELIVERY_STATUS,
      default: 'pending'
    },

    // For retries / backoff
    retryCount: {
      type: Number,
      default: 0
    },
    lastAttemptAt: {
      type: Date
    },

    // Misc metadata (e.g. IP, userAgent, language, tenantId)
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// ═══════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════

// Recipient's notifications (most recent first)
notificationSchema.index({ recipientId: 1, createdAt: -1 });

// Pending / scheduled queue for workers
notificationSchema.index({
  overallStatus: 1,
  'channels.inApp.status': 1,
  'channels.email.status': 1,
  'channels.sms.status': 1,
  scheduledAt: 1
});

// Filter by domain entity
notificationSchema.index({ consultationId: 1 });
notificationSchema.index({ treatmentPlanId: 1 });
notificationSchema.index({ prescriptionId: 1 });
notificationSchema.index({ feedbackId: 1 });

// For analytics / filtering
notificationSchema.index({ eventType: 1, category: 1, createdAt: -1 });
notificationSchema.index({ 'channels.inApp.status': 1, createdAt: -1 });

// ═══════════════════════════════════════════════════════════
// PRE-SAVE HOOKS
// ═══════════════════════════════════════════════════════════

notificationSchema.pre('save', function (next) {
  // Derive category from eventType if not explicitly set
  if (!this.category) {
    const map = {
      OTP: 'otp',
      CONSULTATION_BOOKED: 'consultation',
      TREATMENT_PLAN_CREATED: 'treatment',
      TREATMENT_PLAN_REMINDER_PRE: 'treatment',
      TREATMENT_PLAN_REMINDER_POST: 'treatment',
      PRESCRIPTION_END_REMINDER: 'prescription',
      THERAPY_DAILY_REMINDER: 'consultation',
      FEEDBACK_AFTER_THERAPY: 'feedback',
      SYSTEM: 'system'
    };
    this.category = map[this.eventType] || 'system';
  }

  // Compute overallStatus as "worst" pending-like state if any channel is not final
  const statuses = [];
  if (this.channels?.inApp?.enabled) statuses.push(this.channels.inApp.status);
  if (this.channels?.email?.enabled) statuses.push(this.channels.email.status);
  if (this.channels?.sms?.enabled) statuses.push(this.channels.sms.status);

  if (statuses.length) {
    if (statuses.every((s) => s === 'read')) {
      this.overallStatus = 'read';
    } else if (statuses.some((s) => s === 'failed') && statuses.every((s) => s !== 'pending' && s !== 'queued')) {
      this.overallStatus = 'failed';
    } else if (statuses.some((s) => s === 'sent' || s === 'delivered')) {
      this.overallStatus = 'delivered';
    } else if (statuses.some((s) => s === 'queued')) {
      this.overallStatus = 'queued';
    } else {
      this.overallStatus = 'pending';
    }
  }

  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
