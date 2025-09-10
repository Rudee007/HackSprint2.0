// src/models/TherapyCenter.js
const mongoose = require('mongoose');

const therapyCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Center name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Center location is required']
    }
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: String
  },
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    email: String,
    website: String
  },
  facilities: [{
    type: String,
    enum: ['steam_chamber', 'massage_rooms', 'meditation_hall', 'yoga_studio', 
           'herbal_pharmacy', 'consultation_rooms', 'reception', 'parking']
  }],
  services: [{
    name: String,
    description: String,
    duration: Number, // in minutes
    price: Number
  }],
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  rating: {
    average: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  licenseNumber: String,
  certifications: [String]
}, {
  timestamps: true
});

// Geospatial index for location queries
therapyCenterSchema.index({ location: '2dsphere' });
therapyCenterSchema.index({ isActive: 1 });

module.exports = mongoose.model('TherapyCenter', therapyCenterSchema);
