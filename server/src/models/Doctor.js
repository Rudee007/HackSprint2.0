const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  // Reference to User model
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Professional Qualifications
  qualifications: {
    bams: {
      degree: String,
      university: String,
      yearOfCompletion: {
        type: Number,
        min: 1980,
        max: new Date().getFullYear()
      },
      certificateUrl: String
    },
    
    postGraduation: {
      degree: String,
      specialization: String,
      university: String,
      yearOfCompletion: Number,
      certificateUrl: String
    },
    
    additionalCertifications: [{
      name: String,
      institution: String,
      year: Number,
      certificateUrl: String
    }]
  },

  // Medical Registration
  medicalRegistration: {
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    council: String,
    state: String,
    validFrom: Date,
    validUpto: Date,
    status: {
      type: String,
      enum: ['active', 'suspended', 'expired', 'pending'],
      default: 'pending'
    }
  },

  // Specializations
  specializations: [{
    type: String,
    enum: [
      'Panchakarma', 'Kayachikitsa', 'Shalya Tantra', 'Shalakya Tantra',
      'Kaumarabhritya', 'Agadatantra', 'Rasayana', 'Vajikarana',
      'Bhutavidya', 'Vata Disorders', 'Pitta Disorders', 'Kapha Disorders',
      'General Ayurveda'
    ]
  }],

  // Experience
  experience: {
    totalYears: {
      type: Number,
      min: 0,
      max: 60
    },
    workHistory: [{
      position: String,
      organization: String,
      location: String,
      startDate: Date,
      endDate: Date,
      isCurrent: { type: Boolean, default: false }
    }]
  },

  // Consultation Settings
  consultationSettings: {
    fees: {
      videoConsultation: { type: Number, min: 0 },
      inPersonConsultation: { type: Number, min: 0 },
      followUpConsultation: { type: Number, min: 0 }
    },
    
    availability: {
      workingDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }],
      workingHours: {
        start: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        end: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        }
      },
      consultationDuration: {
        type: Number,
        default: 30,
        min: 15,
        max: 120
      }
    },

    preferences: {
      languages: [{
        type: String,
        enum: ['english', 'hindi', 'bengali', 'tamil', 'telugu', 'marathi', 'gujarati']
      }],
      maxPatientsPerDay: {
        type: Number,
        default: 20,
        min: 1,
        max: 50
      }
    }
  },

  // Professional Info
  professionalInfo: {
    bio: {
      type: String,
      maxlength: 1000
    },
    achievements: [String]
  },

  // Verification Status
  verificationStatus: {
    documentsVerified: { type: Boolean, default: false },
    profileReviewed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending'
    }
  },

  // Account Status
  isActive: { type: Boolean, default: true }

}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Add this before: module.exports = mongoose.model('Doctor', doctorSchema);

doctorSchema.pre('save', function(next) {
  // Ensure verificationStatus.status is always a valid enum
  const allowedStatuses = ['pending', 'under_review', 'approved', 'rejected'];
  
  if (this.verificationStatus && this.verificationStatus.status) {
    // Convert boolean to string if somehow it gets through
    if (typeof this.verificationStatus.status === 'boolean') {
      this.verificationStatus.status = this.verificationStatus.status ? 'approved' : 'pending';
      console.log('🔄 Converted boolean to enum string:', this.verificationStatus.status);
    }
    
    // Validate enum
    if (!allowedStatuses.includes(this.verificationStatus.status)) {
      return next(new Error(`Invalid verificationStatus.status: ${this.verificationStatus.status}`));
    }
  }
  
  next();
});



// Essential indexes only
doctorSchema.index({ userId: 1 }, { unique: true });
doctorSchema.index({ specializations: 1 });
doctorSchema.index({ 'verificationStatus.status': 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
