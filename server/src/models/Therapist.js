const mongoose = require('mongoose');
const { Schema } = mongoose;

const TherapistSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Certifications and Qualifications
  certifications: [{
    therapy: { 
      type: String, 
      enum: ['Abhyanga', 'Shirodhara', 'Basti', 'Udvartana', 'Nasya', 'Pizhichil', 'Karna Purana', 'Other'],
      required: true 
    },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], required: true },
    experienceYears: { type: Number, min: 0, required: true },
    certificateUrl: String
  }],
  
  // ═══════════════════════════════════════════════════════════
  // 🔥 ENHANCED AVAILABILITY (FOR AUTO-SCHEDULING)
  // ═══════════════════════════════════════════════════════════
  availability: {
    // Day-by-day availability with specific time slots
    monday: {
      isAvailable: { type: Boolean, default: true },
      slots: [{
        startTime: { type: String, required: true }, // "09:00"
        endTime: { type: String, required: true }    // "12:00"
      }]
    },
    tuesday: {
      isAvailable: { type: Boolean, default: true },
      slots: [{
        startTime: { type: String, required: true },
        endTime: { type: String, required: true }
      }]
    },
    wednesday: {
      isAvailable: { type: Boolean, default: true },
      slots: [{
        startTime: { type: String, required: true },
        endTime: { type: String, required: true }
      }]
    },
    thursday: {
      isAvailable: { type: Boolean, default: true },
      slots: [{
        startTime: { type: String, required: true },
        endTime: { type: String, required: true }
      }]
    },
    friday: {
      isAvailable: { type: Boolean, default: true },
      slots: [{
        startTime: { type: String, required: true },
        endTime: { type: String, required: true }
      }]
    },
    saturday: {
      isAvailable: { type: Boolean, default: true },
      slots: [{
        startTime: { type: String, required: true },
        endTime: { type: String, required: true }
      }]
    },
    sunday: {
      isAvailable: { type: Boolean, default: false },
      slots: []
    },
    
    // 🔥 LEGACY FIELDS (Keep for backward compatibility)
    workingDays: [{ 
      type: String, 
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    workingHours: {
      start: { type: String }, // "09:00"
      end: { type: String }    // "18:00"
    },
    maxPatientsPerDay: { type: Number, min: 1, default: 8 },
    sessionDuration: { type: Number, min: 15, default: 60 } // minutes
  },
  
  // Performance Metrics
  metrics: {
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalSessions: { type: Number, default: 0 },
    completedSessions: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  
  // Professional Info
  specialization: [String], // Primary areas of expertise
  experienceYears: { type: Number, min: 0, required: true },
  bio: String,
  
  // Status and Verification
  isActive: { type: Boolean, default: true },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ═══════════════════════════════════════════════════════════
// 🔥 HELPER METHODS
// ═══════════════════════════════════════════════════════════

/**
 * Check if therapist is available on a specific day
 */
TherapistSchema.methods.isAvailableOnDay = function(dayName) {
  const day = dayName.toLowerCase();
  return this.availability[day]?.isAvailable || false;
};

/**
 * Get available time slots for a specific day
 */
TherapistSchema.methods.getSlotsForDay = function(dayName) {
  const day = dayName.toLowerCase();
  return this.availability[day]?.slots || [];
};

/**
 * Initialize default availability (Mon-Fri 9AM-5PM)
 */
TherapistSchema.methods.setDefaultAvailability = function() {
  const defaultSlots = [
    { startTime: "09:00", endTime: "12:00" },
    { startTime: "14:00", endTime: "17:00" }
  ];
  
  this.availability = {
    monday: { isAvailable: true, slots: defaultSlots },
    tuesday: { isAvailable: true, slots: defaultSlots },
    wednesday: { isAvailable: true, slots: defaultSlots },
    thursday: { isAvailable: true, slots: defaultSlots },
    friday: { isAvailable: true, slots: defaultSlots },
    saturday: { isAvailable: true, slots: [{ startTime: "09:00", endTime: "12:00" }] },
    sunday: { isAvailable: false, slots: [] },
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    workingHours: { start: "09:00", end: "17:00" },
    maxPatientsPerDay: 8,
    sessionDuration: 60
  };
  
  return this;
};

// Index for efficient queries
TherapistSchema.index({ userId: 1 });
TherapistSchema.index({ 'certifications.therapy': 1 });
TherapistSchema.index({ isActive: 1, verificationStatus: 1 });

module.exports = mongoose.model('Therapist', TherapistSchema);
