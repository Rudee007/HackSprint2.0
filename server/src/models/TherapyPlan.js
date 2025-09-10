// src/models/TherapyPlan.js
const mongoose = require('mongoose');

const therapyPlanSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment reference is required']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient reference is required']
  },
  sessionsCount: {
    type: Number,
    required: [true, 'Total sessions count is required'],
    min: [1, 'Sessions count must be at least 1']
  },
  sessionsCompleted: {
    type: Number,
    default: 0,
    min: [0, 'Completed sessions cannot be negative']
  },
  therapyDescription: String,
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: Date,
  progressStatus: {
    type: String,
    enum: ['not-started', 'ongoing', 'completed', 'paused', 'cancelled'],
    default: 'not-started'
  },
  milestones: [{
    sessionNumber: Number,
    description: String,
    achieved: { type: Boolean, default: false },
    achievedDate: Date
  }],
  prescriptions: [{
    medicines: [String],
    dosage: String,
    instructions: String,
    duration: String
  }],
  dietaryRecommendations: [{
    phase: String, // pre-therapy, during-therapy, post-therapy
    foods: [String],
    restrictions: [String],
    instructions: String
  }],
  overallProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for completion percentage
therapyPlanSchema.virtual('completionPercentage').get(function() {
  return Math.round((this.sessionsCompleted / this.sessionsCount) * 100);
});

// Indexes
therapyPlanSchema.index({ patientId: 1, startDate: -1 });
therapyPlanSchema.index({ progressStatus: 1 });
therapyPlanSchema.index({ appointmentId: 1 });

module.exports = mongoose.model('TherapyPlan', therapyPlanSchema);
