const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  
  // Working Schedule
  workingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  
  workingHours: {
    start: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    end: {
      type: String, 
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  },
  
  // Breaks and Holidays
  breaks: [{
    start: String,
    end: String,
    recurring: {
      type: Boolean,
      default: true
    }
  }],
  
  holidays: [String], // Array of dates "YYYY-MM-DD"
  
  // Therapy-specific settings
  sessionDurations: {
    consultation: { type: Number, default: 30 },
    panchakarma: { type: Number, default: 60 },
    abhyanga: { type: Number, default: 45 },
    shirodhara: { type: Number, default: 40 }
  },
  
  bufferTimes: {
    consultation: { type: Number, default: 10 },
    panchakarma: { type: Number, default: 15 },
    abhyanga: { type: Number, default: 10 },
    shirodhara: { type: Number, default: 15 }
  },
  
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Availability', AvailabilitySchema);
