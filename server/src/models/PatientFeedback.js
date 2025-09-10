// src/models/PatientFeedback.js
const mongoose = require('mongoose');

const patientFeedbackSchema = new mongoose.Schema({
  therapyPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TherapyPlan',
    required: [true, 'Therapy plan reference is required']
  },
  sessionNumber: {
    type: Number,
    required: [true, 'Session number is required'],
    min: [1, 'Session number must be at least 1']
  },
  ratings: {
    painLevel: {
      type: Number,
      min: [0, 'Pain level must be between 0 and 10'],
      max: [10, 'Pain level must be between 0 and 10']
    },
    energyLevel: {
      type: Number,
      min: [0, 'Energy level must be between 0 and 10'],
      max: [10, 'Energy level must be between 0 and 10']
    },
    digestion: {
      type: Number,
      min: [0, 'Digestion rating must be between 0 and 10'],
      max: [10, 'Digestion rating must be between 0 and 10']
    },
    mood: {
      type: Number,
      min: [0, 'Mood rating must be between 0 and 10'],
      max: [10, 'Mood rating must be between 0 and 10']
    },
    overallSatisfaction: {
      type: Number,
      min: [0, 'Overall satisfaction must be between 0 and 10'],
      max: [10, 'Overall satisfaction must be between 0 and 10']
    }
  },
  symptoms: {
    current: [String],
    improved: [String],
    worsened: [String],
    new: [String]
  },
  sideEffects: [String],
  notes: String,
  therapistRating: {
    type: Number,
    min: [1, 'Therapist rating must be between 1 and 5'],
    max: [5, 'Therapist rating must be between 1 and 5']
  },
  centerRating: {
    type: Number,
    min: [1, 'Center rating must be between 1 and 5'],
    max: [5, 'Center rating must be between 1 and 5']
  },
  isAnomalous: {
    type: Boolean,
    default: false // Flag for adverse reactions
  }
}, {
  timestamps: true
});

// Compound index for therapy plan feedback queries
patientFeedbackSchema.index({ therapyPlanId: 1, sessionNumber: 1 });
patientFeedbackSchema.index({ isAnomalous: 1, createdAt: -1 });

module.exports = mongoose.model('PatientFeedback', patientFeedbackSchema);
