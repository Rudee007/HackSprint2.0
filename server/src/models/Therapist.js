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
  
  // Availability and Working Hours
  availability: {
    workingDays: [{ 
      type: String, 
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    workingHours: {
      start: { type: String, required: true }, // "09:00"
      end: { type: String, required: true }    // "18:00"
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

// // Index for efficient queries
// // TherapistSchema.index({ userId: 1 });
// TherapistSchema.index({ 'certifications.therapy': 1 });
// TherapistSchema.index({ isActive: 1, verificationStatus: 1 });

module.exports = mongoose.model('Therapist', TherapistSchema);
