const mongoose = require('mongoose');
const { Schema } = mongoose;

const FeedbackSchema = new Schema(
  {
    // ========== CORE REFERENCES ==========
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      validate: {
        validator: async function (id) {
          const user = await mongoose.model('User').findById(id);
          return user && user.role === 'patient';
        },
        message: 'Referenced user must be a patient',
      },
    },

    // Can be consultation or therapy session (generated session)
    sessionId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    sessionType: {
      type: String,
      enum: ['consultation', 'therapy_session'],
      required: true,
    },

    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true, // doctor or therapist
    },

    therapyType: {
      type: String,
      enum: ['abhyanga', 'shirodhara', 'panchakarma', 'consultation', 'follow_up', 'other'],
      required: true,
    },

    // ========== ROUTING / VISIBILITY ==========
    visibility: {
      toDoctor: { type: Boolean, default: true }, // clinical + safety signals
      toAdmin: { type: Boolean, default: true },  // service + facility + complaints
    },

    assignedDoctorId: { type: Schema.Types.ObjectId, ref: 'User' }, // optional override
    assignedAdminId: { type: Schema.Types.ObjectId, ref: 'User' },  // for escalation

    // ========== RATING CATEGORIES (1-5) ==========
    ratings: {
      overallSatisfaction: { type: Number, min: 1, max: 5, required: true },
      treatmentEffectiveness: { type: Number, min: 1, max: 5, required: true }, // doctor focus
      patientCare: { type: Number, min: 1, max: 5, required: true },            // shared
      facilityQuality: { type: Number, min: 1, max: 5, required: true },        // admin focus
      therapistProfessionalism: { type: Number, min: 1, max: 5, required: true },
      communicationQuality: { type: Number, min: 1, max: 5, required: true },
    },

    // ========== HEALTH PROGRESS (doctor facing) ==========
    healthMetrics: {
      painLevel: {
        before: { type: Number, min: 1, max: 10, required: true },
        after: { type: Number, min: 1, max: 10, required: true },
      },
      energyLevel: {
        before: { type: Number, min: 1, max: 10, required: true },
        after: { type: Number, min: 1, max: 10, required: true },
      },
      sleepQuality: {
        before: { type: Number, min: 1, max: 10 },
        after: { type: Number, min: 1, max: 10 },
      },
      stressLevel: {
        before: { type: Number, min: 1, max: 10 },
        after: { type: Number, min: 1, max: 10 },
      },
      overallWellbeing: {
        before: { type: Number, min: 1, max: 10 },
        after: { type: Number, min: 1, max: 10 },
      },
      mobilityLevel: {
        before: { type: Number, min: 1, max: 10 },
        after: { type: Number, min: 1, max: 10 },
      },
    },

    // ========== SPECIFIC IMPROVEMENTS (doctor dashboards) ==========
    improvements: [
      {
        aspect: {
          type: String,
          enum: [
            'joint_pain',
            'digestion',
            'sleep',
            'stress',
            'energy',
            'mobility',
            'skin_condition',
            'mental_clarity',
          ],
          required: true,
        },
        progressLevel: { type: Number, min: 0, max: 100, required: true },
        notes: String,
        significance: {
          type: String,
          enum: ['minor', 'moderate', 'significant', 'major'],
          default: 'moderate',
        },
      },
    ],

    // ========== SIDE EFFECTS / SAFETY (doctor + critical alerts) ==========
    sideEffects: [
      {
        type: {
          type: String,
          enum: [
            'fatigue',
            'nausea',
            'headache',
            'skin_irritation',
            'dizziness',
            'muscle_soreness',
            'other',
          ],
          required: true,
        },
        severity: { type: Number, min: 1, max: 5, required: true },
        durationUnit: {
          type: String,
          enum: ['minutes', 'hours', 'days', 'ongoing'],
          required: true,
        },
        durationValue: { type: Number, min: 0 }, // optional numeric for analytics
        description: String,
        resolved: { type: Boolean, default: false },
      },
    ],

    // ========== QUALITATIVE FEEDBACK ==========
    textFeedback: {
      positiveAspects: String,
      concernsOrIssues: String, // both doctor and admin may see
      suggestions: String,
      additionalComments: String,
    },

    // ========== RECOMMENDATION / NPS ==========
    recommendationScore: { type: Number, min: 0, max: 10, required: true },
    wouldReturnForTreatment: { type: Boolean, required: true },
    wouldRecommendToOthers: { type: Boolean, required: true },

    // ========== METADATA ==========
    submissionMethod: {
      type: String,
      enum: ['mobile_app', 'web_portal', 'in_person', 'phone_call', 'email'],
      default: 'web_portal',
    },

    isAnonymous: { type: Boolean, default: false },

    timeToComplete: { type: Number, min: 1, max: 60 }, // minutes

    // ========== WORKFLOW STATE ==========
    status: {
      type: String,
      enum: ['submitted', 'triaged', 'reviewed', 'responded', 'archived'],
      default: 'submitted',
    },

    // separate responses
    doctorResponse: {
      responseText: String,
      respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      respondedAt: Date,
      actionTaken: {
        type: String,
        enum: ['no_action', 'treatment_adjusted', 'follow_up_scheduled', 'escalated'],
      },
    },

    adminResponse: {
      responseText: String,
      respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      respondedAt: Date,
      actionTaken: {
        type: String,
        enum: ['no_action', 'service_improvement', 'staff_feedback', 'escalated', 'resolved'],
      },
    },

    // ========== FLAGS FOR ROUTING / ALERTING ==========
    flags: {
      requiresAttention: { type: Boolean, default: false }, // for queues
      criticalFeedback: { type: Boolean, default: false },  // high‑severity
      hasComplaint: { type: Boolean, default: false },      // for admin
      autoRoutedToDoctor: { type: Boolean, default: false },
      autoRoutedToAdmin: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== VIRTUALS ==========
FeedbackSchema.virtual('overallImprovement').get(function () {
  const metrics = this.healthMetrics || {};
  let totalImprovement = 0;
  let metricCount = 0;

  Object.keys(metrics).forEach((key) => {
    const metric = metrics[key];
    if (!metric || metric.before == null || metric.after == null) return;

    const lowerIsBetter = ['painLevel', 'stressLevel'];
    const raw =
      lowerIsBetter.includes(key)
        ? ((metric.before - metric.after) / metric.before) * 100
        : ((metric.after - metric.before) / metric.before) * 100;

    const improvement = Math.max(0, raw || 0);
    totalImprovement += improvement;
    metricCount += 1;
  });

  return metricCount > 0 ? Math.round(totalImprovement / metricCount) : 0;
});

FeedbackSchema.virtual('averageRating').get(function () {
  const r = this.ratings || {};
  const values = Object.values(r).filter((v) => typeof v === 'number');
  if (!values.length) return 0;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(avg * 10) / 10;
});

FeedbackSchema.virtual('isPositiveFeedback').get(function () {
  return this.averageRating >= 4 && this.recommendationScore >= 7;
});

// ========== INDEXES ==========
FeedbackSchema.index({ patientId: 1, createdAt: -1 });
FeedbackSchema.index({ sessionId: 1 });
FeedbackSchema.index({ providerId: 1, createdAt: -1 });
FeedbackSchema.index({ therapyType: 1, createdAt: -1 });
FeedbackSchema.index({ 'ratings.overallSatisfaction': -1 });
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ 'flags.requiresAttention': 1 });
FeedbackSchema.index({ 'flags.criticalFeedback': 1 });
FeedbackSchema.index({ 'flags.hasComplaint': 1 });
FeedbackSchema.index({ 'visibility.toDoctor': 1 });
FeedbackSchema.index({ 'visibility.toAdmin': 1 });

// ========== PRE-SAVE HOOK ==========
FeedbackSchema.pre('save', function (next) {
  const avgRating = this.averageRating || 0;

  if (avgRating <= 2 || this.recommendationScore <= 3) {
    this.flags.requiresAttention = true;
  }

  const hasSevereSideEffects =
    Array.isArray(this.sideEffects) &&
    this.sideEffects.some((se) => se && se.severity >= 4);

  const hasComplaintText =
    this.textFeedback &&
    typeof this.textFeedback.concernsOrIssues === 'string' &&
    this.textFeedback.concernsOrIssues.toLowerCase().includes('complaint');

  if (hasSevereSideEffects || hasComplaintText) {
    this.flags.criticalFeedback = true;
    this.flags.hasComplaint = true;
  }

  // auto routing hints
  if (hasSevereSideEffects) {
    this.flags.autoRoutedToDoctor = true;
  }
  if (hasComplaintText || this.ratings.facilityQuality <= 3) {
    this.flags.autoRoutedToAdmin = true;
  }

  next();
});

// ========== INSTANCE METHODS ==========
FeedbackSchema.methods.getImprovementSummary = function () {
  const metrics = this.healthMetrics || {};
  const summary = {};
  const lowerIsBetter = ['painLevel', 'stressLevel'];

  Object.keys(metrics).forEach((key) => {
    const metric = metrics[key];
    if (!metric || metric.before == null || metric.after == null) return;

    const change = metric.after - metric.before;
    const improvement =
      lowerIsBetter.includes(key)
        ? ((metric.before - metric.after) / metric.before) * 100
        : ((metric.after - metric.before) / metric.before) * 100;

    summary[key] = {
      before: metric.before,
      after: metric.after,
      change,
      improvement,
    };
  });

  return summary;
};

FeedbackSchema.methods.requiresImmediateAttention = function () {
  const severeSideEffects =
    Array.isArray(this.sideEffects) &&
    this.sideEffects.some((se) => se && se.severity >= 4);

  return (
    this.flags.criticalFeedback ||
    this.averageRating <= 2 ||
    severeSideEffects
  );
};

module.exports = mongoose.model('Feedback', FeedbackSchema);
