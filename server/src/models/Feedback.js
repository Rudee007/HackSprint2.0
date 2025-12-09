// backend/models/feedback.model.js
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

    sessionId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    sessionType: {
      type: String,
      enum: ['consultation', 'therapy'], // ✅ FIXED: Changed 'therapy' to 'therapy_session'
      required: true,
    },

    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 🆕 NEW: Doctor ID (auto-populated from treatment plan)
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      index: true,
    },

    therapyType: {
      type: String,
      enum: ['abhyanga', 'shirodhara', 'panchakarma', 'consultation', 'follow_up', 'other'],
      required: true,
    },

    // ... rest of your schema (unchanged)
    visibility: {
      toDoctor: { type: Boolean, default: true },
      toAdmin: { type: Boolean, default: true },
    },

    ratings: {
      overallSatisfaction: { type: Number, min: 1, max: 5, required: true },
      treatmentEffectiveness: { type: Number, min: 1, max: 5, required: true },
      patientCare: { type: Number, min: 1, max: 5, required: true },
      facilityQuality: { type: Number, min: 1, max: 5, required: true },
      therapistProfessionalism: { type: Number, min: 1, max: 5, required: true },
      communicationQuality: { type: Number, min: 1, max: 5, required: true },
    },

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
    },

    textFeedback: {
      positiveAspects: String,
      concernsOrIssues: String,
      suggestions: String,
    },

    recommendationScore: { type: Number, min: 0, max: 10, required: true },
    wouldReturnForTreatment: { type: Boolean, required: true },
    wouldRecommendToOthers: { type: Boolean, required: true },

    submissionMethod: {
      type: String,
      enum: ['mobile_app', 'web_portal', 'in_person', 'phone_call', 'email'],
      default: 'web_portal',
    },

    isAnonymous: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['submitted', 'triaged', 'reviewed', 'responded', 'archived'],
      default: 'submitted',
    },

    doctorResponse: {
      responseText: String,
      respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      respondedAt: Date,
      actionTaken: {
        type: String,
        enum: ['no_action', 'treatment_adjusted', 'follow_up_scheduled', 'escalated'],
      },
    },

    flags: {
      requiresAttention: { type: Boolean, default: false },
      criticalFeedback: { type: Boolean, default: false },
      hasComplaint: { type: Boolean, default: false },
      autoRoutedToDoctor: { type: Boolean, default: false },
      autoRoutedToAdmin: { type: Boolean, default: false },
    },

    improvements: [],
    sideEffects: [],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== INDEXES ==========
FeedbackSchema.index({ patientId: 1, createdAt: -1 });
FeedbackSchema.index({ sessionId: 1 });
FeedbackSchema.index({ providerId: 1, createdAt: -1 });
FeedbackSchema.index({ doctorId: 1, createdAt: -1 }); // 🆕 NEW INDEX
FeedbackSchema.index({ therapyType: 1, createdAt: -1 });
FeedbackSchema.index({ 'ratings.overallSatisfaction': -1 });
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ 'visibility.toDoctor': 1 });

// ========== 🆕 PRE-SAVE HOOK: Auto-populate doctorId ==========
FeedbackSchema.pre('save', async function (next) {
  console.log('\n🔄 [FEEDBACK PRE-SAVE] Running pre-save hook...');
  
  // Only populate doctorId if it's not already set
  if (!this.doctorId && this.patientId) {
    try {
      console.log('🔍 [FEEDBACK PRE-SAVE] Looking up treatment plan for patient:', this.patientId);
      
      const TreatmentPlan = mongoose.model('TreatmentPlan');
      
      // Find active treatment plan for this patient
      const treatmentPlan = await TreatmentPlan.findOne({
        patientId: this.patientId,
        status: { $in: ['active', 'paused'] }
      })
      .sort({ createdAt: -1 })
      .select('doctorId')
      .lean();

      if (treatmentPlan && treatmentPlan.doctorId) {
        this.doctorId = treatmentPlan.doctorId;
        console.log('✅ [FEEDBACK PRE-SAVE] doctorId populated:', this.doctorId);
      } else {
        console.warn('⚠️ [FEEDBACK PRE-SAVE] No active treatment plan found for patient:', this.patientId);
      }
    } catch (err) {
      console.error('❌ [FEEDBACK PRE-SAVE] Error populating doctorId:', err);
      // Don't fail the save, just log the error
    }
  } else {
    console.log('ℹ️ [FEEDBACK PRE-SAVE] doctorId already set or patientId missing');
  }

  // Existing pre-save logic
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

  if (hasSevereSideEffects) {
    this.flags.autoRoutedToDoctor = true;
  }
  if (hasComplaintText || this.ratings.facilityQuality <= 3) {
    this.flags.autoRoutedToAdmin = true;
  }

  next();
});

// ========== VIRTUALS (UNCHANGED) ==========
FeedbackSchema.virtual('averageRating').get(function () {
  const r = this.ratings || {};
  const values = Object.values(r).filter((v) => typeof v === 'number');
  if (!values.length) return 0;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(avg * 10) / 10;
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
