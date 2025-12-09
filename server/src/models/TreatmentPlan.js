// backend/models/TreatmentPlan.js - ENHANCED WITH PATIENT DASHBOARD METHODS
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ═══════════════════════════════════════════════════════════
// SUB-SCHEMAS (UNCHANGED)
// ═══════════════════════════════════════════════════════════

const therapySessionSchema = new Schema(
  {
    therapyId: {
      type: Schema.Types.ObjectId,
      ref: "Therapy",
      required: true,
    },

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

    requiresPreviousPhaseComplete: {
      type: Boolean,
      default: false,
    },
    minimumDaysSincePreviousSession: {
      type: Number,
      default: 0,
    },
    allowsParallelSessions: {
      type: Boolean,
      default: false,
    },

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

    instructions: {
      type: String,
      maxlength: 1000,
    },

    preConditions: {
      type: String,
      maxlength: 500,
    },
    stopCriteria: {
      type: String,
      maxlength: 500,
    },

    isCustom: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

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

    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },

    therapySessions: [therapySessionSchema],

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

    minGapDaysAfterPhase: {
      type: Number,
      default: 0,
      min: 0,
    },

    isCustom: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

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

    flexibilityWindowDays: {
      type: Number,
      default: 0,
      min: 0,
      max: 7,
    },

    preferredRoom: String,
  },
  { _id: false }
);

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

const generatedSessionSchema = new Schema(
  {
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: "Consultation",
      required: true,
    },

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

    therapyId: {
      type: Schema.Types.ObjectId,
      ref: "Therapy",
      required: true,
    },
    therapyName: {
      type: String,
      required: true,
    },

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

    originalScheduledDate: Date,
    rescheduledFrom: {
      type: Schema.Types.ObjectId,
      ref: "Consultation",
    },
    rescheduledReason: String,
  },
  { _id: true }
);

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
// MAIN TREATMENT PLAN SCHEMA (UNCHANGED)
// ═══════════════════════════════════════════════════════════

const TreatmentPlanSchema = new Schema(
  {
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

    courseTemplateId: {
      type: Schema.Types.ObjectId,
      ref: "CourseTemplate",
      default: null,
    },

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

    treatmentName: {
      type: String,
      required: true,
      trim: true,
    },

    isCustomPlan: {
      type: Boolean,
      default: false,
    },

    isTemplateModified: {
      type: Boolean,
      default: false,
    },

    duration: durationSchema,

    totalDays: {
      type: Number,
      required: true,
      min: 3,
    },

    phases: [phaseConfigSchema],

    schedulingPreferences: schedulingPreferencesSchema,

    autoScheduled: {
      type: Boolean,
      default: false,
    },

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

    schedulingMetadata: schedulingMetadataSchema,

    generatedSessions: [generatedSessionSchema],

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

    prePanchakarmaInstructions: {
      type: String,
      maxlength: 2000,
    },

    postPanchakarmaInstructions: {
      type: String,
      maxlength: 2000,
    },

    treatmentNotes: {
      type: String,
      maxlength: 2000,
    },

    safetyNotes: {
      type: String,
      maxlength: 1000,
    },

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
// INDEXES (UNCHANGED)
// ═══════════════════════════════════════════════════════════

TreatmentPlanSchema.index({ doctorId: 1, createdAt: -1 });
TreatmentPlanSchema.index({ patientId: 1, status: 1 });
TreatmentPlanSchema.index({ status: 1, "schedulingPreferences.startDate": 1 });
TreatmentPlanSchema.index({ courseTemplateId: 1 });
TreatmentPlanSchema.index({ autoScheduled: 1, schedulingStatus: 1 });
TreatmentPlanSchema.index({ assignedTherapistId: 1 });
TreatmentPlanSchema.index({
  schedulingStatus: 1,
  "schedulingPreferences.startDate": 1,
  assignedTherapistId: 1,
});
TreatmentPlanSchema.index({ "generatedSessions.consultationId": 1 });
TreatmentPlanSchema.index({ "generatedSessions.scheduledDate": 1 });

// ═══════════════════════════════════════════════════════════
// EXISTING VIRTUALS (UNCHANGED)
// ═══════════════════════════════════════════════════════════

TreatmentPlanSchema.virtual("progressPercentage").get(function () {
  if (this.totalSessionsPlanned === 0) return 0;
  return Math.round((this.completedSessions / this.totalSessionsPlanned) * 100);
});

TreatmentPlanSchema.virtual("isTemplateBased").get(function () {
  return !!this.courseTemplateId;
});

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

TreatmentPlanSchema.virtual("estimatedCompletionDate").get(function () {
  if (!this.schedulingPreferences || !this.schedulingPreferences.startDate)
    return null;

  const startDate = new Date(this.schedulingPreferences.startDate);
  const completionDate = new Date(startDate);
  completionDate.setDate(completionDate.getDate() + this.totalDays);

  return completionDate;
});

// 🆕 NEW VIRTUAL: Next scheduled session
TreatmentPlanSchema.virtual("nextScheduledSession").get(function () {
  if (!this.generatedSessions || this.generatedSessions.length === 0) return null;
  
  const now = new Date();
  const upcomingSessions = this.generatedSessions
    .filter(s => ['scheduled', 'confirmed'].includes(s.status) && s.scheduledDate >= now)
    .sort((a, b) => a.scheduledDate - b.scheduledDate);
  
  return upcomingSessions.length > 0 ? upcomingSessions[0] : null;
});

// ═══════════════════════════════════════════════════════════
// EXISTING PRE-SAVE MIDDLEWARE (UNCHANGED)
// ═══════════════════════════════════════════════════════════

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
// EXISTING METHODS (UNCHANGED)
// ═══════════════════════════════════════════════════════════

TreatmentPlanSchema.methods.markAsStarted = function () {
  this.startedAt = new Date();
  this.status = "active";
  return this.save();
};

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

// ═══════════════════════════════════════════════════════════
// 🆕 NEW METHODS - PATIENT DASHBOARD
// ═══════════════════════════════════════════════════════════

/**
 * 🆕 Get complete patient progress dashboard data
 * Aggregates all patient-facing information in one call
 * @returns {Promise<Object>} Complete patient dashboard data
 */
TreatmentPlanSchema.methods.getPatientProgressDashboard = async function() {
  const Consultation = mongoose.model('Consultation');
  
  // Get completed sessions with patient-safe data
  const completedConsultations = await Consultation.find({
    'therapyData.treatmentPlanId': this._id,
    status: 'completed'
  })
  .sort({ scheduledAt: -1 })
  .limit(10)
  .lean();

  // Get active session if any
  const activeSession = await Consultation.findOne({
    'therapyData.treatmentPlanId': this._id,
    status: 'in_progress'
  }).lean();

  return {
    // Overall progress
    overallProgress: {
      treatmentName: this.treatmentName,
      panchakarmaType: this.panchakarmaType,
      completedSessions: this.completedSessions,
      totalSessionsPlanned: this.totalSessionsPlanned,
      progressPercentage: this.progressPercentage,
      currentPhase: this.currentPhase,
      estimatedCompletionDate: this.estimatedCompletionDate,
      startedAt: this.startedAt,
      status: this.status
    },

    // Upcoming sessions (next 5)
    upcomingSessions: this.getUpcomingSessionsForPatient(5),

    // Completed sessions (sanitized)
    completedSessions: completedConsultations.map(c => ({
      _id: c._id,
      scheduledAt: c.scheduledAt,
      therapyName: c.therapyData?.therapyName,
      dayNumber: c.therapyData?.dayNumber,
      rating: c.rating,
      patientFeedback: c.patientFeedback,
      status: c.status
    })),

    // Active session progress (if any)
    activeSession: activeSession ? {
      sessionId: activeSession._id,
      therapyName: activeSession.therapyData?.therapyName,
      currentStage: activeSession.therapyData?.progressUpdates?.length > 0
        ? activeSession.therapyData.progressUpdates[activeSession.therapyData.progressUpdates.length - 1].stage
        : 'preparation',
      percentage: activeSession.therapyData?.progressUpdates?.length > 0
        ? activeSession.therapyData.progressUpdates[activeSession.therapyData.progressUpdates.length - 1].percentage
        : 0
    } : null,

    // Instructions
    instructions: {
      prePanchakarma: this.prePanchakarmaInstructions,
      postPanchakarma: this.postPanchakarmaInstructions,
      safety: this.safetyNotes
    },

    // Phase breakdown
    phases: this.phases.map(phase => ({
      name: phase.phaseName,
      totalDays: phase.totalDays,
      instructions: phase.phaseInstructions,
      dietPlan: phase.dietPlan,
      lifestyleGuidelines: phase.lifestyleGuidelines
    }))
  };
};

/**
 * 🆕 Get upcoming sessions for patient
 * @param {Number} limit - Number of sessions to return (default: 5)
 * @returns {Array} Array of upcoming sessions
 */
TreatmentPlanSchema.methods.getUpcomingSessionsForPatient = function(limit = 5) {
  if (!this.generatedSessions || this.generatedSessions.length === 0) {
    return [];
  }

  const now = new Date();
  return this.generatedSessions
    .filter(s => ['scheduled', 'confirmed'].includes(s.status) && s.scheduledDate >= now)
    .sort((a, b) => a.scheduledDate - b.scheduledDate)
    .slice(0, limit)
    .map(s => ({
      sessionId: s.consultationId,
      therapyName: s.therapyName,
      scheduledDate: s.scheduledDate,
      scheduledStartTime: s.scheduledStartTime,
      scheduledEndTime: s.scheduledEndTime,
      phaseName: s.phaseName,
      sessionNumber: s.sessionNumber,
      dayNumber: s.dayNumber,
      status: s.status
    }));
};

/**
 * 🆕 Get completed sessions summary
 * @param {Number} limit - Number of sessions to return (default: 10)
 * @returns {Promise<Array>} Array of completed sessions
 */
TreatmentPlanSchema.methods.getCompletedSessionsForPatient = async function(limit = 10) {
  const Consultation = mongoose.model('Consultation');
  
  const completedSessions = await Consultation.find({
    'therapyData.treatmentPlanId': this._id,
    status: 'completed'
  })
  .sort({ scheduledAt: -1 })
  .limit(limit)
  .select('scheduledAt therapyData.therapyName therapyData.dayNumber patientFeedback rating')
  .lean();

  return completedSessions.map(session => ({
    _id: session._id,
    scheduledAt: session.scheduledAt,
    therapyName: session.therapyData?.therapyName,
    dayNumber: session.therapyData?.dayNumber,
    patientFeedback: session.patientFeedback,
    rating: session.rating
  }));
};

module.exports = mongoose.model("TreatmentPlan", TreatmentPlanSchema);
