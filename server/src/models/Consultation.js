// backend/models/Consultation.js - ENHANCED VERSION
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConsultationSchema = new Schema({
  // ═══════════════════════════════════════════════════════════
  // EXISTING FIELDS (Keep as is)
  // ═══════════════════════════════════════════════════════════
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  providerType: {
    type: String,
    enum: ['doctor', 'therapist'],
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'in_person', 'follow_up'],
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show', 'patient_arrived', 'therapist_ready'],
    default: 'scheduled',
    index: true
  },
  fee: Number,
  notes: String,
  meetingLink: String,

  // Session Type & Status
  sessionType: {
    type: String,
    enum: ['consultation', 'followup', 'therapy'],
    default: 'consultation'
  },
  sessionStatus: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'paused', 'cancelled', 'patient_arrived', 'therapist_ready'],
    default: 'scheduled'
  },
  estimatedDuration: {
    type: Number,
    default: 60
  },

  // ═══════════════════════════════════════════════════════════
  // EXISTING SESSION METADATA (Keep as is)
  // ═══════════════════════════════════════════════════════════
  sessionMetadata: {
    totalPauses: { type: Number, default: 0 },
    pausedDuration: { type: Number, default: 0 },
    connectionIssues: { type: Number, default: 0 },
    lastActivity: Date,
    qualityRating: { type: Number, min: 1, max: 5 }
  },

  // ═══════════════════════════════════════════════════════════
  // 🔥 NEW: THERAPY-SPECIFIC FIELDS
  // Only populated when sessionType === 'therapy'
  // ═══════════════════════════════════════════════════════════
  therapyData: {
    // Treatment Plan Reference
    treatmentPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'TreatmentPlan'
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Therapy Details
    therapyType: {
      type: String,
      enum: ['abhyanga', 'shirodhara', 'panchakarma', 'swedana', 'nasya', 'virechana', 'basti', 'other']
    },
    dayNumber: Number,
    totalDays: Number,
    room: String,
    todayProcedure: String,
    
    // 🔥 VITALS (Real-time tracking)
    vitals: {
      bloodPressure: {
        systolic: { type: Number, min: 70, max: 250 },
        diastolic: { type: Number, min: 40, max: 150 },
        measuredAt: Date
      },
      pulse: {
        type: Number,
        min: 40,
        max: 200
      },
      temperature: {
        type: Number,
        min: 95,
        max: 106
      },
      weight: {
        type: Number,
        min: 20,
        max: 300
      },
      respiratoryRate: Number,
      oxygenSaturation: Number
    },

    // 🔥 OBSERVATIONS (Real-time tracking)
    observations: {
      sweatingQuality: {
        type: String,
        enum: ['good', 'moderate', 'poor', 'none']
      },
      skinTexture: {
        type: String,
        enum: ['soft', 'normal', 'rough', 'dry']
      },
      skinColor: {
        type: String,
        enum: ['normal', 'flushed', 'pale']
      },
      patientComfort: {
        type: String,
        enum: ['comfortable', 'mild_discomfort', 'moderate_discomfort', 'severe_discomfort']
      },
      responseToTreatment: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      },
      timeOfObservation: [Date]
    },

    // 🔥 ADVERSE EFFECTS (Critical for safety)
    adverseEffects: [{
      effect: {
        type: String,
        enum: ['nausea', 'dizziness', 'skin_irritation', 'weakness', 'pain', 'headache', 'breathing_difficulty', 'allergic_reaction', 'other'],
        required: true
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe', 'critical'],
        required: true
      },
      description: String,
      occurredAt: {
        type: Date,
        default: Date.now
      },
      actionTaken: String,
      resolved: {
        type: Boolean,
        default: false
      }
    }],

    // 🔥 MATERIALS USED (Inventory tracking)
    materialsUsed: [{
      name: {
        type: String,
        required: true
      },
      quantity: {
        type: String,
        required: true
      },
      unit: {
        type: String,
        enum: ['ml', 'g', 'kg', 'units', 'drops'],
        default: 'ml'
      },
      batchNumber: String
    }],

    // 🔥 REAL-TIME PROGRESS (For live tracking)
    progressUpdates: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      stage: {
        type: String,
        enum: ['preparation', 'massage', 'steam', 'rest', 'cleanup', 'completed']
      },
      notes: String,
      percentage: {
        type: Number,
        min: 0,
        max: 100
      }
    }],

    // Special Instructions
    preInstructions: String,
    postInstructions: String,
    specialInstructions: String,
    
    // Emergency
    emergencyReported: {
      type: Boolean,
      default: false
    },
    emergencyDetails: {
      type: String,
      timestamp: Date,
      actionTaken: String
    },

    // Session Feedback
    patientFeedback: String,
    nextSessionPrep: String
  },

  // ═══════════════════════════════════════════════════════════
  // EXISTING FIELDS (Keep as is)
  // ═══════════════════════════════════════════════════════════
  sessionNotes: [{
    timestamp: { type: Date, default: Date.now },
    note: String,
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['progress', 'alert', 'observation', 'general'],
      default: 'general'
    }
  }],

  activeParticipants: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    joinedAt: Date,
    role: {
      type: String,
      enum: ['patient', 'doctor', 'therapist', 'admin']
    },
    isActive: { type: Boolean, default: true }
  }],

  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    previousStatus: String
  }],

  adminActions: [{
    action: String,
    performedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    timestamp: { type: Date, default: Date.now },
    reason: String,
    _id: { type: Schema.Types.ObjectId, auto: true }
  }],

  sessionStartTime: Date,
  sessionEndTime: Date,
  actualDuration: Number,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  patientFeedback: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════
ConsultationSchema.index({ patientId: 1, scheduledAt: -1 });
ConsultationSchema.index({ providerId: 1, scheduledAt: -1 });
ConsultationSchema.index({ status: 1, scheduledAt: 1 });
ConsultationSchema.index({ providerType: 1, sessionType: 1 });
ConsultationSchema.index({ 'therapyData.doctorId': 1 });

// ═══════════════════════════════════════════════════════════
// METHODS
// ═══════════════════════════════════════════════════════════

// Add therapy progress update
ConsultationSchema.methods.addTherapyProgress = function(stage, notes, percentage) {
  if (this.sessionType === 'therapy' && this.therapyData) {
    if (!this.therapyData.progressUpdates) {
      this.therapyData.progressUpdates = [];
    }
    this.therapyData.progressUpdates.push({
      timestamp: new Date(),
      stage,
      notes,
      percentage
    });
  }
  return this.save();
};

// Add adverse effect
ConsultationSchema.methods.addAdverseEffect = function(effect, severity, description, actionTaken) {
  if (this.sessionType === 'therapy' && this.therapyData) {
    if (!this.therapyData.adverseEffects) {
      this.therapyData.adverseEffects = [];
    }
    this.therapyData.adverseEffects.push({
      effect,
      severity,
      description,
      occurredAt: new Date(),
      actionTaken,
      resolved: false
    });
    
    // Auto-create admin alert for severe/critical effects
    if (severity === 'severe' || severity === 'critical') {
      this.therapyData.emergencyReported = true;
      this.therapyData.emergencyDetails = {
        type: 'adverse_effect',
        timestamp: new Date(),
        actionTaken: actionTaken || 'Pending'
      };
    }
  }
  return this.save();
};

// Update therapy vitals
ConsultationSchema.methods.updateVitals = function(vitals) {
  if (this.sessionType === 'therapy' && this.therapyData) {
    this.therapyData.vitals = {
      ...this.therapyData.vitals,
      ...vitals,
      measuredAt: new Date()
    };
  }
  return this.save();
};

module.exports = mongoose.model('Consultation', ConsultationSchema);
