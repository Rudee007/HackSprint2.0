// backend/models/TreatmentPlan.js
// 🔥 PANCHAKARMA TREATMENT PLAN SCHEMA - SCHEDULING OPTIMIZED

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ═══════════════════════════════════════════════════════════
// SUB-SCHEMAS
// ═══════════════════════════════════════════════════════════

/**
 * Individual Therapy Session Configuration
 * References TherapyMaster for default values, customizable by doctor
 */
const therapySessionSchema = new Schema(
  {
    therapyId: {
      type: Schema.Types.ObjectId,
      ref: "Therapy",
      required: true,
    },

    // Overridable from TherapyMaster defaults
    therapyName: {
      type: String,
      required: true,
    },
    therapyType: {
      type: String,
      enum: [
        "snehana",
        "swedana",
        "abhyanga",
        "vamana",
        "virechana",
        "basti",
        "nasya",
        "raktamokshana",
        "samsarjana",
        "shirodhara",
        "pizhichil",
        "udvartana",
        "other",
        "general",
      ],
      required: true,
    },

    // Doctor-configurable per session
    sessionCount: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    frequency: {
      type: String,
      enum: ["daily", "alternate_days", "twice_daily", "once_weekly", "custom"],
      default: "daily",
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 15,
      default: 60,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },

    // 🔥 NEW: CSP Constraint Fields
    requiresPreviousPhaseComplete: {
      type: Boolean,
      default: false,
    },
    minimumDaysSincePreviousSession: {
      type: Number,
      default: 0, // 0=daily, 1=alternate days, etc.
    },
    allowsParallelSessions: {
      type: Boolean,
      default: false, // Can run simultaneously with other therapies
    },

    // Materials for this therapy
    materials: [
      {
        name: { type: String, required: true },
        quantity: String,
        unit: {
          type: String,
          enum: ["ml", "g", "kg", "units", "drops", "pieces"],
          default: "ml",
        },
        batchNumber: String,
      },
    ],

    // Instructions specific to this therapy
    instructions: {
      type: String,
      maxlength: 1000,
    },

    // Safety and monitoring
    preConditions: {
      type: String,
      maxlength: 500,
    },
    stopCriteria: {
      type: String,
      maxlength: 500,
    },

    // Tracking
    isCustom: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

/**
 * Phase Configuration (Purvakarma / Pradhanakarma / Paschatkarma)
 */
const phaseConfigSchema = new Schema(
  {
    phaseName: {
      type: String,
      enum: ["purvakarma", "pradhanakarma", "paschatkarma"],
      required: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },

    // Phase duration
    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },

    // Multiple therapy sessions in this phase
    therapySessions: [therapySessionSchema],

    // Phase-specific instructions
    phaseInstructions: {
      type: String,
      maxlength: 2000,
    },
    dietPlan: {
      type: String,
      maxlength: 1000,
    },
    lifestyleGuidelines: {
      type: String,
      maxlength: 1000,
    },

    // Minimum gap before next phase
    minGapDaysAfterPhase: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Tracking
    isCustom: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

/**
 * Scheduling Preferences
 */
const schedulingPreferencesSchema = new Schema(
  {
    startDate: {
      type: Date,
      required: true,
    },
    preferredTimeSlot: {
      type: String,
      enum: ["morning", "afternoon", "evening", "flexible"],
      default: "morning",
    },
    specificTime: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },

    skipWeekends: {
      type: Boolean,
      default: false,
    },
    skipHolidays: {
      type: Boolean,
      default: false,
    },
    requireSameTherapist: {
      type: Boolean,
      default: true,
    },

    // Flexibility for auto-scheduler
    flexibilityWindowDays: {
      type: Number,
      default: 0,
      min: 0,
      max: 7,
    },

    // Room preferences
    preferredRoom: String,
  },
  { _id: false }
);

/**
 * Duration with flexible units
 */
const durationSchema = new Schema(
  {
    value: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      enum: ["days", "weeks", "months"],
      default: "days",
    },
  },
  { _id: false }
);

/**
 * 🔥 NEW: Generated Session Tracking (Enhanced)
 */
const generatedSessionSchema = new Schema(
  {
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: "Consultation",
      required: true,
    },

    // Better phase linkage
    phaseSequence: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    phaseName: {
      type: String,
      enum: ["purvakarma", "pradhanakarma", "paschatkarma"],
      required: true,
    },

    // Therapy details
    therapyId: {
      type: Schema.Types.ObjectId,
      ref: "Therapy",
      required: true,
    },
    therapyName: {
      type: String,
      required: true,
    },

    // Session positioning
    sessionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    // Scheduling details
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledStartTime: {
      type: Date,
      required: true,
    },
    scheduledEndTime: {
      type: Date,
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "rescheduled",
        "no_show",
      ],
      default: "scheduled",
    },

    // 🔥 CRITICAL: CSP Dependencies
    dependsOn: [
      {
        type: Schema.Types.ObjectId,
        ref: "Consultation",
      },
    ],
    prerequisitesMet: {
      type: Boolean,
      default: true,
    },

    // Rescheduling tracking
    originalScheduledDate: Date,
    rescheduledFrom: {
      type: Schema.Types.ObjectId,
      ref: "Consultation",
    },
    rescheduledReason: String,
  },
  { _id: true }
);

/**
 * 🔥 NEW: Scheduling Metadata
 */
const schedulingMetadataSchema = new Schema(
  {
    algorithmUsed: {
      type: String,
      enum: ["greedy", "csp", "mip", "hybrid", "manual"],
      default: "hybrid",
    },
    executionTimeMs: Number,
    conflictsResolved: Number,
    optimizationScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    warnings: [String],
    scheduledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    scheduledAt: Date,
  },
  { _id: false }
);

// ═══════════════════════════════════════════════════════════
// MAIN TREATMENT PLAN SCHEMA
// ═══════════════════════════════════════════════════════════

const TreatmentPlanSchema = new Schema(
  {
    // ═══════════════════════════════════════════════════════════
    // REFERENCES
    // ═══════════════════════════════════════════════════════════

    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    consultationId: {
      type: Schema.Types.ObjectId,
      ref: "Consultation",
      required: true,
    },

    assignedTherapistId: {
      type: Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },

    // Template reference (null if fully custom)
    courseTemplateId: {
      type: Schema.Types.ObjectId,
      ref: "CourseTemplate",
      default: null,
    },

    // ═══════════════════════════════════════════════════════════
    // TREATMENT TYPE & CATEGORY
    // ═══════════════════════════════════════════════════════════

    treatmentCategory: {
      type: String,
      enum: ["Panchakarma"],
      default: "Panchakarma",
      required: true,
    },

    panchakarmaType: {
      type: String,
      enum: ["vamana", "virechana", "basti", "nasya", "raktamokshana"],
      required: true,
    },

    // Human-readable treatment name
    treatmentName: {
      type: String,
      required: true,
      trim: true,
    },

    // ═══════════════════════════════════════════════════════════
    // TEMPLATE VS CUSTOM FLAGS
    // ═══════════════════════════════════════════════════════════

    isCustomPlan: {
      type: Boolean,
      default: false,
    },

    isTemplateModified: {
      type: Boolean,
      default: false,
    },

    // ═══════════════════════════════════════════════════════════
    // DURATION
    // ═══════════════════════════════════════════════════════════

    duration: durationSchema,

    // Auto-calculated total days
    totalDays: {
      type: Number,
      required: true,
      min: 3,
    },

    // ═══════════════════════════════════════════════════════════
    // THREE PHASES (Purva → Pradhana → Paschat)
    // ═══════════════════════════════════════════════════════════

    phases: [phaseConfigSchema],

    // ═══════════════════════════════════════════════════════════
    // SCHEDULING
    // ═══════════════════════════════════════════════════════════

    schedulingPreferences: schedulingPreferencesSchema,

    autoScheduled: {
      type: Boolean,
      default: false,
    },

    // 🔥 NEW: When scheduling completed
    schedulingCompletedAt: {
      type: Date,
      default: null,
    },

    schedulingStatus: {
      type: String,
      enum: ["pending", "scheduled", "partial", "failed"],
      default: "pending",
      index: true,
    },

    schedulingErrors: [
      {
        errorType: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // 🔥 NEW: Scheduling metadata
    schedulingMetadata: schedulingMetadataSchema,

    // ═══════════════════════════════════════════════════════════
    // 🔥 ENHANCED: Generated Sessions
    // ═══════════════════════════════════════════════════════════

    generatedSessions: [generatedSessionSchema],

    // Session tracking
    totalSessionsPlanned: {
      type: Number,
      default: 0,
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
    cancelledSessions: {
      type: Number,
      default: 0,
    },

    // ═══════════════════════════════════════════════════════════
    // INSTRUCTIONS (Medicines removed as per your requirement)
    // ═══════════════════════════════════════════════════════════

    // Pre-Panchakarma preparation instructions
    prePanchakarmaInstructions: {
      type: String,
      maxlength: 2000,
    },

    // Post-Panchakarma care instructions
    postPanchakarmaInstructions: {
      type: String,
      maxlength: 2000,
    },

    // General treatment notes
    treatmentNotes: {
      type: String,
      maxlength: 2000,
    },

    // Patient safety notes
    safetyNotes: {
      type: String,
      maxlength: 1000,
    },

    // ═══════════════════════════════════════════════════════════
    // STATUS & PROGRESS
    // ═══════════════════════════════════════════════════════════

    status: {
      type: String,
      enum: ["active", "completed", "paused", "cancelled", "deleted"],
      default: "active",
      index: true,
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ═══════════════════════════════════════════════════════════
    // TIMESTAMPS
    // ═══════════════════════════════════════════════════════════

    startedAt: Date,
    completedAt: Date,
    pausedAt: Date,
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ═══════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════

TreatmentPlanSchema.index({ doctorId: 1, createdAt: -1 });
TreatmentPlanSchema.index({ patientId: 1, status: 1 });
TreatmentPlanSchema.index({ status: 1, "schedulingPreferences.startDate": 1 });
TreatmentPlanSchema.index({ courseTemplateId: 1 });
TreatmentPlanSchema.index({ autoScheduled: 1, schedulingStatus: 1 });
TreatmentPlanSchema.index({ assignedTherapistId: 1 });

// 🔥 NEW: Scheduling query optimization
TreatmentPlanSchema.index({
  schedulingStatus: 1,
  "schedulingPreferences.startDate": 1,
  assignedTherapistId: 1,
});

// 🔥 NEW: Session lookup optimization
TreatmentPlanSchema.index({ "generatedSessions.consultationId": 1 });
TreatmentPlanSchema.index({ "generatedSessions.scheduledDate": 1 });

// ═══════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════

// Progress percentage
TreatmentPlanSchema.virtual("progressPercentage").get(function () {
  if (this.totalSessionsPlanned === 0) return 0;
  return Math.round((this.completedSessions / this.totalSessionsPlanned) * 100);
});

// Is plan based on template
TreatmentPlanSchema.virtual("isTemplateBased").get(function () {
  return !!this.courseTemplateId;
});

// Get current phase
TreatmentPlanSchema.virtual("currentPhase").get(function () {
  if (!this.startedAt || !this.phases || this.phases.length === 0) return null;

  const daysSinceStart = Math.floor(
    (Date.now() - this.startedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  let dayCount = 0;

  for (const phase of this.phases) {
    dayCount += phase.totalDays;
    if (daysSinceStart < dayCount) {
      return phase.phaseName;
    }
  }

  return "completed";
});

// 🔥 NEW: Estimated completion date
TreatmentPlanSchema.virtual("estimatedCompletionDate").get(function () {
  if (!this.schedulingPreferences || !this.schedulingPreferences.startDate)
    return null;

  const startDate = new Date(this.schedulingPreferences.startDate);
  const completionDate = new Date(startDate);
  completionDate.setDate(completionDate.getDate() + this.totalDays);

  return completionDate;
});

// ═══════════════════════════════════════════════════════════
// PRE-SAVE MIDDLEWARE
// ═══════════════════════════════════════════════════════════

// Auto-calculate totalDays from duration
TreatmentPlanSchema.pre("save", function (next) {
  if (this.duration) {
    switch (this.duration.unit) {
      case "weeks":
        this.totalDays = this.duration.value * 7;
        break;
      case "months":
        this.totalDays = this.duration.value * 30;
        break;
      default:
        this.totalDays = this.duration.value;
    }
  }
  next();
});

// Validate phase sequence
TreatmentPlanSchema.pre("save", function (next) {
  if (this.phases && this.phases.length > 0) {
    const sequences = this.phases.map((p) => p.sequenceNumber).sort();
    const uniqueSequences = [...new Set(sequences)];

    if (sequences.length !== uniqueSequences.length) {
      return next(new Error("Phase sequence numbers must be unique"));
    }

    for (let i = 0; i < uniqueSequences.length; i++) {
      if (uniqueSequences[i] !== i + 1) {
        return next(
          new Error("Phase sequence must be continuous (1, 2, 3...)")
        );
      }
    }
  }
  next();
});

// Calculate total planned sessions
TreatmentPlanSchema.pre("save", function (next) {
  if (this.phases && this.phases.length > 0) {
    this.totalSessionsPlanned = this.phases.reduce((total, phase) => {
      return (
        total +
        phase.therapySessions.reduce((phaseTotal, session) => {
          return phaseTotal + session.sessionCount;
        }, 0)
      );
    }, 0);
  }
  next();
});

// ═══════════════════════════════════════════════════════════
// METHODS
// ═══════════════════════════════════════════════════════════

// Mark plan as started
TreatmentPlanSchema.methods.markAsStarted = function () {
  this.startedAt = new Date();
  this.status = "active";
  return this.save();
};

// Mark plan as completed
TreatmentPlanSchema.methods.markAsCompleted = function () {
  this.completedAt = new Date();
  this.status = "completed";
  this.progress = 100;
  return this.save();
};

TreatmentPlanSchema.methods.updateProgress = function () {
  if (this.totalSessionsPlanned > 0) {
    this.progress = Math.round(
      (this.completedSessions / this.totalSessionsPlanned) * 100
    );
  }
  return this.save();
};

TreatmentPlanSchema.methods.isReadyForScheduling = function () {
  return (
    this.phases &&
    this.phases.length > 0 &&
    this.schedulingPreferences &&
    this.schedulingPreferences.startDate &&
    this.assignedTherapistId
  );
};

TreatmentPlanSchema.methods.getNextSchedulableSession = function () {
  const scheduledSessionNumbers = this.generatedSessions
    .filter((s) => s.status !== "cancelled")
    .map((s) => s.sessionNumber);

  let sessionNum = 1;
  for (const phase of this.phases) {
    for (const therapySession of phase.therapySessions) {
      for (let i = 0; i < therapySession.sessionCount; i++) {
        if (!scheduledSessionNumbers.includes(sessionNum)) {
          return {
            sessionNumber: sessionNum,
            phase: phase.phaseName,
            phaseSequence: phase.sequenceNumber,
            therapy: therapySession.therapyName,
            therapyId: therapySession.therapyId,
            durationMinutes: therapySession.durationMinutes,
          };
        }
        sessionNum++;
      }
    }
  }

  return null;
};

TreatmentPlanSchema.methods.markSchedulingCompleted = function (metadata) {
  this.autoScheduled = true;
  this.schedulingStatus = "scheduled";
  this.schedulingCompletedAt = new Date();
  if (metadata) {
    this.schedulingMetadata = metadata;
  }
  return this.save();
};

TreatmentPlanSchema.methods.markSchedulingFailed = function (errorMessage) {
  this.schedulingStatus = "failed";
  this.schedulingErrors.push({
    errorType: "scheduling_failed",
    message: errorMessage,
    timestamp: new Date(),
  });
  return this.save();
};

module.exports = mongoose.model("TreatmentPlan", TreatmentPlanSchema);
