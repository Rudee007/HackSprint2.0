const mongoose = require('mongoose');
const { Schema } = mongoose;

const ConsultationSchema = new Schema({
  // ============ EXISTING CORE FIELDS ============
  patientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    validate: {
      validator: async function(id) {
        const user = await mongoose.model('User').findById(id);
        return user && user.role === 'patient';
      },
      message: 'Referenced user must be a patient'
    }
  },
  
  providerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    validate: {
      validator: async function(id) {
        const user = await mongoose.model('User').findById(id);
        return user && ['doctor', 'therapist'].includes(user.role);
      },
      message: 'Provider must be a doctor or therapist'
    }
  },
  
  providerType: {
    type: String,
    enum: ['doctor', 'therapist'],
    required: true
  },
  
  type: { 
    type: String, 
    enum: ['video', 'in_person'], 
    required: true 
  },
  
  scheduledAt: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Consultation must be scheduled for a future date'
    }
  },
  
  status: { 
    type: String, 
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  
  fee: { 
    type: Number, 
    required: true,
    min: [0, 'Fee cannot be negative']
  },
  
  notes: String,
  
  meetingLink: {
    type: String,
    required: function() { 
      return this.type === 'video'; 
    }
  },
  
  sessionType: {
    type: String,
    enum: ['consultation', 'therapy', 'follow_up'],
    default: function() {
      return this.providerType === 'doctor' ? 'consultation' : 'therapy';
    }
  },
  
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  patientFeedback: String,

  // ============ ✅ NEW REAL-TIME SESSION TRACKING FIELDS ============
  
  // Enhanced session status for real-time tracking
  sessionStatus: {
    type: String,
    enum: [
      'scheduled', 
      'patient_arrived', 
      'therapist_ready',
      'in_progress', 
      'paused', 
      'completed', 
      'cancelled', 
      'no_show'
    ],
    default: 'scheduled'
  },
  
  // Session timing for real-time countdown
  sessionStartTime: {
    type: Date
  },
  
  sessionEndTime: {
    type: Date
  },
  
  estimatedDuration: {
    type: Number, // in minutes
    default: 60,
    min: [15, 'Session must be at least 15 minutes'],
    max: [240, 'Session cannot exceed 4 hours']
  },
  
  actualDuration: {
    type: Number // in minutes, calculated when session ends
  },
  
  // Real-time session notes
  sessionNotes: [{
    timestamp: { type: Date, default: Date.now },
    note: { type: String, required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['general', 'progress', 'instruction', 'alert'],
      default: 'general'
    }
  }],
  
  // Track active participants in real-time
  activeParticipants: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date,
    role: { 
      type: String, 
      enum: ['patient', 'therapist', 'doctor', 'admin'] 
    },
    isActive: { type: Boolean, default: true }
  }],
  
  // Session status history for audit trail
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: String,
    previousStatus: String
  }],

  // Real-time session metadata
  sessionMetadata: {
    totalPauses: { type: Number, default: 0 },
    pausedDuration: { type: Number, default: 0 }, // in minutes
    lastActivity: { type: Date, default: Date.now },
    connectionIssues: { type: Number, default: 0 },
    qualityRating: {
      type: Number,
      min: 1,
      max: 5
    }
  },

  // Admin actions for session management
  adminActions: [{
    action: {
      type: String,
      enum: ['reschedule', 'cancel', 'override_status', 'extend_time', 'emergency_stop'],
      required: true
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    reason: String,
    details: Schema.Types.Mixed // Flexible field for action-specific data
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ VIRTUAL FIELDS ============

// Calculate remaining time for active sessions
ConsultationSchema.virtual('remainingTime').get(function() {
  if (this.sessionStatus === 'in_progress' && this.sessionStartTime) {
    const elapsed = Date.now() - this.sessionStartTime.getTime();
    const estimated = this.estimatedDuration * 60 * 1000; // Convert to ms
    return Math.max(0, estimated - elapsed);
  }
  return null;
});

// Check if session is currently active
ConsultationSchema.virtual('isActiveSession').get(function() {
  return ['in_progress', 'paused'].includes(this.sessionStatus);
});

// Get current active participant count
ConsultationSchema.virtual('activeParticipantCount').get(function() {
  return this.activeParticipants.filter(p => p.isActive && !p.leftAt).length;
});

// ============ INDEXES FOR PERFORMANCE ============
ConsultationSchema.index({ patientId: 1, sessionStatus: 1 });
ConsultationSchema.index({ providerId: 1, scheduledAt: 1 });
ConsultationSchema.index({ providerType: 1, sessionStatus: 1 });
ConsultationSchema.index({ sessionStatus: 1, scheduledAt: 1 });
ConsultationSchema.index({ 'activeParticipants.userId': 1, 'activeParticipants.isActive': 1 });
ConsultationSchema.index({ sessionStartTime: 1, sessionEndTime: 1 });

// ============ PRE-SAVE MIDDLEWARE ============
ConsultationSchema.pre('save', async function(next) {
  try {
    // Validate provider type matches user role
    const provider = await mongoose.model('User').findById(this.providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    if (provider.role !== this.providerType) {
      throw new Error(`Provider type mismatch: expected ${this.providerType}, got ${provider.role}`);
    }

    // Calculate actual duration when session completes
    if (this.sessionStatus === 'completed' && this.sessionStartTime && this.sessionEndTime) {
      this.actualDuration = Math.round((this.sessionEndTime - this.sessionStartTime) / (1000 * 60));
    }

    // Update last activity timestamp
    if (this.isModified('sessionStatus') || this.isModified('sessionNotes')) {
      this.sessionMetadata.lastActivity = new Date();
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ============ ✅ ENHANCED INSTANCE METHODS ============

// Check if consultation can be cancelled
ConsultationSchema.methods.canBeCancelled = function() {
  const hoursBefore = (this.scheduledAt - new Date()) / (1000 * 60 * 60);
  return ['scheduled', 'patient_arrived'].includes(this.sessionStatus) && hoursBefore >= 2;
};

// Check if consultation is upcoming
ConsultationSchema.methods.isUpcoming = function() {
  return this.scheduledAt > new Date() && this.sessionStatus === 'scheduled';
};

// Update session status with history tracking
ConsultationSchema.methods.updateSessionStatus = function(newStatus, userId, reason = '') {
  const previousStatus = this.sessionStatus;
  this.sessionStatus = newStatus;
  
  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    updatedBy: userId,
    reason,
    previousStatus
  });
  
  // Update session timing
  if (newStatus === 'in_progress' && !this.sessionStartTime) {
    this.sessionStartTime = new Date();
  }
  
  if (newStatus === 'completed' && !this.sessionEndTime) {
    this.sessionEndTime = new Date();
  }

  // Sync basic status field
  if (['completed', 'cancelled'].includes(newStatus)) {
    this.status = newStatus;
  } else if (newStatus === 'in_progress') {
    this.status = 'in_progress';
  }
  
  return this.save();
};

// Add participant to active session
ConsultationSchema.methods.addParticipant = function(userId, role) {
  // Remove existing entry if present
  this.activeParticipants = this.activeParticipants.filter(p => !p.userId.equals(userId));
  
  // Add new active participant
  this.activeParticipants.push({
    userId,
    role,
    joinedAt: new Date(),
    isActive: true
  });
  
  return this.save();
};

// Remove participant from active session
ConsultationSchema.methods.removeParticipant = function(userId) {
  const participant = this.activeParticipants.find(p => p.userId.equals(userId) && p.isActive);
  if (participant) {
    participant.leftAt = new Date();
    participant.isActive = false;
  }
  
  return this.save();
};

// Add session note
ConsultationSchema.methods.addSessionNote = function(note, userId, type = 'general') {
  this.sessionNotes.push({
    note,
    addedBy: userId,
    type,
    timestamp: new Date()
  });
  
  return this.save();
};

// Get session summary for admin/reports
ConsultationSchema.methods.getSessionSummary = function() {
  return {
    id: this._id,
    patient: this.patientId,
    provider: this.providerId,
    sessionType: this.sessionType,
    scheduledAt: this.scheduledAt,
    sessionStatus: this.sessionStatus,
    duration: {
      estimated: this.estimatedDuration,
      actual: this.actualDuration
    },
    participants: this.activeParticipantCount,
    notes: this.sessionNotes.length,
    statusChanges: this.statusHistory.length
  };
};

module.exports = mongoose.model('Consultation', ConsultationSchema);
