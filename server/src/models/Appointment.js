// src/models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient reference is required']
  },
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist',
    required: [true, 'Therapist reference is required']
  },
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TherapyCenter',
    required: [true, 'Therapy center reference is required']
  },
  therapyType: {
    type: String,
    required: [true, 'Therapy type is required'],
    enum: ['vamana', 'virechana', 'basti', 'nasya', 'raktamokshana', 
           'abhyanga', 'swedana', 'shirodhara', 'pizhichil', 'udvartana']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  aiRecommendation: {
    confidence: Number,
    reasoning: String,
    alternativeOptions: [String]
  },
  bookingDetails: {
    totalCost: Number,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: String,
    transactionId: String
  },
  notes: String,
  cancellationReason: String,
  remindersSent: {
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    app: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Compound indexes for scheduling queries (your core feature)
appointmentSchema.index({ therapistId: 1, startTime: 1, status: 1 });
appointmentSchema.index({ patientId: 1, startTime: -1 });
appointmentSchema.index({ centerId: 1, startTime: 1 });
appointmentSchema.index({ startTime: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
