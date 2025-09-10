const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  // Reference to User model
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true
  },

  // Professional Qualifications
  qualifications: {
    bams: {
      degree: {
        type: String,
        required: [true, 'BAMS degree is required for Ayurvedic doctors']
      },
      university: {
        type: String,
        required: [true, 'University name is required']
      },
      yearOfCompletion: {
        type: Number,
        required: [true, 'Year of completion is required'],
        min: [1980, 'Invalid year'],
        max: [new Date().getFullYear(), 'Future dates not allowed']
      },
      certificateUrl: String // For uploaded certificate
    },
    
    postGraduation: {
      degree: String, // MD (Ayurveda), MS (Ayurveda)
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

  // Medical Registration & Licensing
  medicalRegistration: {
    registrationNumber: {
      type: String,
      required: [true, 'Medical registration number is required'],
      unique: true
    },
    council: {
      type: String,
      required: [true, 'Medical council name is required']
    },
    state: {
      type: String,
      required: [true, 'State of registration is required']
    },
    validFrom: {
      type: Date,
      required: [true, 'Registration validity start date is required']
    },
    validUpto: {
      type: Date,
      required: [true, 'Registration validity end date is required']
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'expired', 'pending'],
      default: 'pending'
    }
  },

  // Ayurvedic Specializations
  specializations: [{
    type: String,
    enum: [
      'Panchakarma',
      'Kayachikitsa', // General Medicine
      'Shalya Tantra', // Surgery
      'Shalakya Tantra', // ENT & Ophthalmology
      'Kaumarabhritya', // Pediatrics
      'Agadatantra', // Toxicology
      'Rasayana', // Rejuvenation Therapy
      'Vajikarana', // Aphrodisiac Therapy
      'Bhutavidya', // Psychiatry
      'Vata Disorders',
      'Pitta Disorders', 
      'Kapha Disorders',
      'Tridosha Imbalance',
      'Lifestyle Disorders',
      'Chronic Pain Management',
      'Stress & Mental Health',
      'Women Health',
      'Digestive Disorders',
      'Skin Disorders',
      'Respiratory Disorders'
    ]
  }],

  // Panchakarma Therapy Expertise
  panchakarmaExpertise: [{
    therapy: {
      type: String,
      enum: [
        'Vamana', // Emesis
        'Virechana', // Purgation  
        'Basti', // Enema
        'Nasya', // Nasal Administration
        'Raktamokshana', // Bloodletting
        'Abhyanga', // Oil Massage
        'Shirodhara', // Oil Pouring
        'Shirobasti', // Head Oil Bath
        'Karna Purana', // Ear Treatment
        'Akshi Tarpana', // Eye Treatment
        'Udvartana', // Powder Massage
        'Pizhichil', // Oil Bath
        'Njavarakizhi', // Rice Bolus Treatment
        'Elakizhi', // Herbal Bolus Treatment
        'Kizhi', // Bolus Treatments
        'Steam Bath',
        'Marma Therapy'
      ]
    },
    experienceYears: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Invalid experience years']
    },
    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    }
  }],

  // Professional Experience
  experience: {
    totalYears: {
      type: Number,
      required: [true, 'Total experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [60, 'Invalid experience years']
    },
    
    workHistory: [{
      position: String,
      organization: String,
      location: String,
      startDate: Date,
      endDate: Date,
      isCurrent: {
        type: Boolean,
        default: false
      },
      description: String
    }]
  },

  // Consultation Settings
  consultationSettings: {
    fees: {
      videoConsultation: {
        type: Number,
        required: [true, 'Video consultation fee is required'],
        min: [0, 'Fee cannot be negative']
      },
      inPersonConsultation: {
        type: Number,
        required: [true, 'In-person consultation fee is required'],
        min: [0, 'Fee cannot be negative']
      },
      followUpConsultation: {
        type: Number,
        min: [0, 'Fee cannot be negative']
      }
    },
    
    availability: {
      workingDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }],
      workingHours: {
        start: {
          type: String,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
        },
        end: {
          type: String,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
        }
      },
      consultationDuration: {
        type: Number,
        default: 30, // minutes
        min: [15, 'Minimum consultation duration is 15 minutes'],
        max: [120, 'Maximum consultation duration is 2 hours']
      },
      bookingAdvanceTime: {
        type: Number,
        default: 60, // minutes advance booking required
        min: [30, 'Minimum advance booking time is 30 minutes']
      }
    },

    preferences: {
      languages: [{
        type: String,
        enum: ['english', 'hindi', 'bengali', 'tamil', 'telugu', 'marathi', 'gujarati', 'kannada', 'malayalam', 'punjabi', 'urdu', 'sanskrit']
      }],
      maxPatientsPerDay: {
        type: Number,
        default: 20,
        min: [1, 'At least 1 patient per day'],
        max: [50, 'Maximum 50 patients per day']
      },
      emergencyConsultations: {
        type: Boolean,
        default: false
      }
    }
  },

  // Associated Therapy Centers
  associatedCenters: [{
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TherapyCenter'
    },
    role: {
      type: String,
      enum: ['consultant', 'visiting_doctor', 'resident_doctor', 'head_doctor'],
      default: 'consultant'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Performance Metrics
  metrics: {
    totalConsultations: {
      type: Number,
      default: 0
    },
    totalPatients: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0,
      min: [0, 'Success rate cannot be negative'],
      max: [100, 'Success rate cannot exceed 100%']
    },
    patientSatisfactionScore: {
      type: Number,
      default: 0,
      min: [0, 'Satisfaction score cannot be negative'],
      max: [10, 'Satisfaction score cannot exceed 10']
    }
  },

  // Verification Status
  verificationStatus: {
    documentsUploaded: {
      type: Boolean,
      default: false
    },
    documentsVerified: {
      type: Boolean,
      default: false
    },
    profileReviewed: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Admin who approved
    },
    approvedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'suspended'],
      default: 'pending'
    },
    rejectionReason: String
  },

  // Professional Bio & Additional Info
  professionalInfo: {
    bio: {
      type: String,
      maxlength: [1000, 'Bio cannot exceed 1000 characters']
    },
    achievements: [{
      title: String,
      description: String,
      year: Number
    }],
    publications: [{
      title: String,
      journal: String,
      year: Number,
      url: String
    }],
    conferences: [{
      name: String,
      year: Number,
      role: String // speaker, attendee, organizer
    }]
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
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

// Indexes for performance
doctorSchema.index({ 'medicalRegistration.registrationNumber': 1 }, { unique: true });
doctorSchema.index({ specializations: 1 });
doctorSchema.index({ 'verificationStatus.status': 1 });
doctorSchema.index({ 'associatedCenters.centerId': 1 });
doctorSchema.index({ 'metrics.averageRating': -1 });
doctorSchema.index({ isActive: 1, 'verificationStatus.status': 1 });

// Virtual for full name (from referenced User)
doctorSchema.virtual('fullName').get(function() {
  return this.userId ? this.userId.name : '';
});

// Virtual for years of experience calculation
doctorSchema.virtual('calculatedExperience').get(function() {
  const currentYear = new Date().getFullYear();
  const bamsYear = this.qualifications?.bams?.yearOfCompletion;
  return bamsYear ? currentYear - bamsYear : this.experience.totalYears;
});

// Virtual for verification completion percentage
doctorSchema.virtual('verificationProgress').get(function() {
  let progress = 0;
  const steps = [
    this.qualifications?.bams?.degree,
    this.medicalRegistration?.registrationNumber,
    this.specializations?.length > 0,
    this.experience?.totalYears >= 0,
    this.consultationSettings?.fees?.videoConsultation,
    this.verificationStatus?.documentsUploaded
  ];
  
  const completedSteps = steps.filter(step => step).length;
  progress = (completedSteps / steps.length) * 100;
  return Math.round(progress);
});

// Pre-save middleware
doctorSchema.pre('save', async function(next) {
  // Update lastActiveAt if doctor is being modified
  if (this.isModified() && !this.isModified('lastActiveAt')) {
    this.lastActiveAt = new Date();
  }
  
  // Validate medical registration expiry
  if (this.medicalRegistration && this.medicalRegistration.validUpto) {
    if (this.medicalRegistration.validUpto < new Date()) {
      this.medicalRegistration.status = 'expired';
    }
  }
  
  next();
});

// Method to check if doctor is available for consultation
doctorSchema.methods.isAvailableForConsultation = function(dateTime) {
  if (!this.isActive || this.verificationStatus.status !== 'approved') {
    return false;
  }
  
  const dayOfWeek = dateTime.toLocaleDateString('en', {weekday: 'long'}).toLowerCase();
  const isWorkingDay = this.consultationSettings.availability.workingDays.includes(dayOfWeek);
  
  if (!isWorkingDay) {
    return false;
  }
  
  const timeString = dateTime.toTimeString().slice(0, 5);
  const startTime = this.consultationSettings.availability.workingHours.start;
  const endTime = this.consultationSettings.availability.workingHours.end;
  
  return timeString >= startTime && timeString <= endTime;
};

// Method to get doctor's specialization summary
doctorSchema.methods.getSpecializationSummary = function() {
  return {
    primary: this.specializations[0] || 'General Ayurveda',
    all: this.specializations,
    panchakarmaExpertise: this.panchakarmaExpertise.map(exp => exp.therapy),
    experienceLevel: this.experience.totalYears >= 10 ? 'Senior' : 
                    this.experience.totalYears >= 5 ? 'Mid-level' : 'Junior'
  };
};

// Method to calculate consultation availability
doctorSchema.methods.getAvailableSlots = function(date) {
  // This will be implemented in the service layer
  // Returns available time slots for a given date
  return [];
};

// Static method to find doctors by specialization
doctorSchema.statics.findBySpecialization = function(specialization, options = {}) {
  const query = {
    specializations: specialization,
    isActive: true,
    'verificationStatus.status': 'approved'
  };
  
  return this.find(query)
    .populate('userId', 'name email phone location')
    .populate('associatedCenters.centerId', 'name location')
    .sort(options.sortBy || { 'metrics.averageRating': -1 })
    .limit(options.limit || 10);
};

// Static method to find nearby doctors// In src/models/Doctor.js - Replace the findNearby static method
doctorSchema.statics.findNearby = function(coordinates, maxDistance = 50000, options = {}) {
  const { limit = 10, specialization, sortBy = 'distance' } = options;
  
  const pipeline = [
    // 🔥 $geoNear MUST be the first stage
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: coordinates // [longitude, latitude]
        },
        distanceField: 'distance',
        maxDistance: maxDistance, // in meters
        spherical: true,
        query: {
          isActive: true,
          'verificationStatus.status': 'approved'
        }
      }
    },
    // Populate user data
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    // Add specialization filter if provided
    ...(specialization ? [{ $match: { specializations: specialization } }] : []),
    // Sort results
    {
      $sort: sortBy === 'rating' ? { 'metrics.averageRating': -1 } : { distance: 1 }
    },
    // Limit results
    {
      $limit: limit
    },
    // Project final fields
    {
      $project: {
        _id: 1,
        userId: 1,
        specializations: 1,
        experience: 1,
        metrics: 1,
        consultationSettings: 1,
        distance: 1,
        'user.name': 1,
        'user.phone': 1,
        'user.location': 1
      }
    }
  ];

  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Doctor', doctorSchema);
