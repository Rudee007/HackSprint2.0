const mongoose = require('mongoose');
const { Schema } = mongoose;

const FeedbackSchema = new Schema({
  // Core References
  patientId: { 
    type: Schema.Types.Mixed, 
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
  
  sessionId: { 
    type: Schema.Types.Mixed, 
    ref: 'Consultation', 
    required: true 
  },
  
  providerId: { 
    type: Schema.Types.Mixed, 
    ref: 'User', 
    required: true 
  },

  // Therapy Information
  therapyType: {
    type: String,
    enum: ['abhyanga', 'shirodhara', 'panchakarma', 'consultation', 'follow_up'],
    required: true
  },

  // ============ RATING CATEGORIES (1-5 scale) ============
  ratings: {
    overallSatisfaction: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    treatmentEffectiveness: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    patientCare: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    facilityQuality: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    therapistProfessionalism: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    communicationQuality: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  },

  // ============ HEALTH PROGRESS TRACKING ============
  healthMetrics: {
    // Before and after session comparisons (1-10 scale)
    painLevel: {
      before: { type: Number, min: 1, max: 10, required: true },
      after: { type: Number, min: 1, max: 10, required: true }
    },
    energyLevel: {
      before: { type: Number, min: 1, max: 10, required: true },
      after: { type: Number, min: 1, max: 10, required: true }
    },
    sleepQuality: {
      before: { type: Number, min: 1, max: 10, required: false },
      after: { type: Number, min: 1, max: 10, required: false }
    },
    stressLevel: {
      before: { type: Number, min: 1, max: 10, required: false },
      after: { type: Number, min: 1, max: 10, required: false }
    },
    overallWellbeing: {
      before: { type: Number, min: 1, max: 10, required: false },
      after: { type: Number, min: 1, max: 10, required: false }
    },
    mobilityLevel: {
      before: { type: Number, min: 1, max: 10, required: false },
      after: { type: Number, min: 1, max: 10, required: false }
    }
  },

  // ============ SPECIFIC IMPROVEMENTS ============
  improvements: [{
    aspect: {
      type: String,
      enum: ['joint_pain', 'digestion', 'sleep', 'stress', 'energy', 'mobility', 'skin_condition', 'mental_clarity'],
      required: true
    },
    progressLevel: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    notes: String,
    significance: {
      type: String,
      enum: ['minor', 'moderate', 'significant', 'major'],
      default: 'moderate'
    }
  }],

  // ============ SIDE EFFECTS MONITORING ============
  sideEffects: [{
    type: {
      type: String,
      enum: ['fatigue', 'nausea', 'headache', 'skin_irritation', 'dizziness', 'muscle_soreness', 'other'],
      required: true
    },
    severity: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    duration: {
      type: String,
      enum: ['minutes', 'hours', 'days', 'ongoing'],
      required: true
    },
    description: String,
    resolved: {
      type: Boolean,
      default: false
    }
  }],

  // ============ QUALITATIVE FEEDBACK ============
  textFeedback: {
    positiveAspects: String,
    concernsOrIssues: String,
    suggestions: String,
    additionalComments: String
  },

  // ============ RECOMMENDATION METRICS ============
  recommendationScore: {
    type: Number,
    min: 0,
    max: 10,
    required: true
  },

  wouldReturnForTreatment: {
    type: Boolean,
    required: true
  },

  wouldRecommendToOthers: {
    type: Boolean,
    required: true
  },

  // ============ METADATA ============
  submissionMethod: {
    type: String,
    enum: ['mobile_app', 'web_portal', 'in_person', 'phone_call', 'email'],
    default: 'web_portal'
  },

  isAnonymous: {
    type: Boolean,
    default: false
  },

  timeToComplete: {
    type: Number, // in minutes
    min: 1,
    max: 60
  },

  // ============ SYSTEM FIELDS ============
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'responded', 'archived'],
    default: 'submitted'
  },

  adminResponse: {
    responseText: String,
    respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date,
    actionTaken: {
      type: String,
      enum: ['no_action', 'follow_up_scheduled', 'treatment_adjusted', 'escalated', 'resolved']
    }
  },

  flags: {
    requiresAttention: {
      type: Boolean,
      default: false
    },
    criticalFeedback: {
      type: Boolean,
      default: false
    },
    hasComplaint: {
      type: Boolean,
      default: false
    }
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ VIRTUAL FIELDS ============

// Calculate overall improvement percentage
FeedbackSchema.virtual('overallImprovement').get(function() {
  const metrics = this.healthMetrics;
  let totalImprovement = 0;
  let metricCount = 0;

  Object.keys(metrics).forEach(key => {
    if (metrics[key].before && metrics[key].after) {
      // For metrics where lower is better (pain, stress)
      const lowerIsBetter = ['painLevel', 'stressLevel'];
      const improvement = lowerIsBetter.includes(key) 
        ? ((metrics[key].before - metrics[key].after) / metrics[key].before) * 100
        : ((metrics[key].after - metrics[key].before) / metrics[key].before) * 100;
      
      totalImprovement += Math.max(0, improvement);
      metricCount++;
    }
  });

  return metricCount > 0 ? Math.round(totalImprovement / metricCount) : 0;
});

// Calculate average rating
FeedbackSchema.virtual('averageRating').get(function() {
  const ratings = this.ratings;
  const ratingValues = Object.values(ratings).filter(rating => typeof rating === 'number');
  return ratingValues.length > 0 
    ? Math.round((ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length) * 10) / 10
    : 0;
});

// Check if feedback is positive
FeedbackSchema.virtual('isPositiveFeedback').get(function() {
  return this.averageRating >= 4 && this.recommendationScore >= 7;
});

// ============ INDEXES ============
FeedbackSchema.index({ patientId: 1, createdAt: -1 });
FeedbackSchema.index({ sessionId: 1 });
FeedbackSchema.index({ providerId: 1, createdAt: -1 });
FeedbackSchema.index({ therapyType: 1, createdAt: -1 });
FeedbackSchema.index({ 'ratings.overallSatisfaction': -1 });
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ 'flags.requiresAttention': 1 });
FeedbackSchema.index({ 'flags.criticalFeedback': 1 });

// ============ PRE-SAVE MIDDLEWARE ============
FeedbackSchema.pre('save', function(next) {
  // Auto-flag feedback that requires attention
  if (this.averageRating <= 2 || this.recommendationScore <= 3) {
    this.flags.requiresAttention = true;
  }

  // Auto-flag critical feedback
  if (this.sideEffects.some(se => se.severity >= 4) || 
      this.textFeedback.concernsOrIssues?.toLowerCase().includes('complaint')) {
    this.flags.criticalFeedback = true;
    this.flags.hasComplaint = true;
  }

  next();
});

// ============ INSTANCE METHODS ============

// Get improvement summary
FeedbackSchema.methods.getImprovementSummary = function() {
  const improvements = {};
  Object.keys(this.healthMetrics).forEach(key => {
    const metric = this.healthMetrics[key];
    if (metric.before && metric.after) {
      const lowerIsBetter = ['painLevel', 'stressLevel'];
      improvements[key] = {
        before: metric.before,
        after: metric.after,
        change: metric.after - metric.before,
        improvement: lowerIsBetter.includes(key) 
          ? ((metric.before - metric.after) / metric.before) * 100
          : ((metric.after - metric.before) / metric.before) * 100
      };
    }
  });
  return improvements;
};

// Check if requires immediate attention
FeedbackSchema.methods.requiresImmediateAttention = function() {
  return this.flags.criticalFeedback || 
         this.averageRating <= 2 || 
         this.sideEffects.some(se => se.severity >= 4);
};

module.exports = mongoose.model('Feedback', FeedbackSchema);
