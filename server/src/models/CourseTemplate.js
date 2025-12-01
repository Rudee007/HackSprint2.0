// backend/models/CourseTemplate.js
// 📋 PANCHAKARMA COURSE TEMPLATE SCHEMA

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ═══════════════════════════════════════════════════════════
// SUB-SCHEMAS
// ═══════════════════════════════════════════════════════════

const templateTherapySessionSchema = new Schema({
  therapyId: {
    type: Schema.Types.ObjectId,
    ref: 'Therapy',
    required: true
  },
  
  sessionCount: {
    type: Number,
    required: true,
    min: 1
  },
  
  frequency: {
    type: String,
    enum: ['daily', 'alternate_days', 'twice_daily', 'once_weekly', 'custom'],
    default: 'daily'
  },
  
  durationDays: {
    type: Number,
    required: true,
    min: 1
  },
  
  preferredTime: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'flexible']
  },
  
  notes: {
    type: String,
    maxlength: 500
  }
}, { _id: true });

const templatePhaseSchema = new Schema({
  phaseName: {
    type: String,
    enum: ['purvakarma', 'pradhanakarma', 'paschatkarma'],
    required: true
  },
  
  sequence: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  
  therapies: [templateTherapySessionSchema],
  
  totalDays: {
    type: Number,
    required: true,
    min: 1
  },
  
  minimumGapToNext: {
    type: Number,
    default: 0,
    min: 0
  },
  
  phaseInstructions: {
    type: String,
    maxlength: 2000
  },
  
  dietGuidelines: {
    type: String,
    maxlength: 1000
  }
}, { _id: true });

// ═══════════════════════════════════════════════════════════
// MAIN COURSE TEMPLATE SCHEMA
// ═══════════════════════════════════════════════════════════

const CourseTemplateSchema = new Schema({
  templateName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  
  templateCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  
  displayName: {
    type: String,
    required: true
  },
  
  category: {
    type: String,
    enum: ['Panchakarma', 'Rejuvenation', 'Detox', 'Therapeutic'],
    default: 'Panchakarma',
    required: true
  },
  
  panchakarmaType: {
    type: String,
    enum: ['vamana', 'virechana', 'basti', 'nasya', 'raktamokshana', 'mixed'],
    required: true
  },
  
  phases: [templatePhaseSchema],
  
  totalDuration: {
    type: Number,
    required: true,
    min: 3
  },
  
  estimatedSessionCount: {
    type: Number,
    required: true,
    min: 1
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  indications: [{
    type: String
  }],
  
  contraindications: [{
    type: String
  }],
  
  doshaTarget: [{
    type: String,
    enum: ['vata', 'pitta', 'kapha', 'tridosha']
  }],
  
  expectedOutcomes: [{
    type: String
  }],
  
  suitableFor: {
    ageGroup: [{
      type: String,
      enum: ['children', 'adults', 'elderly', 'all']
    }],
    
    constitution: [{
      type: String,
      enum: ['weak', 'moderate', 'strong', 'all']
    }],
    
    season: [{
      type: String,
      enum: ['spring', 'summer', 'monsoon', 'autumn', 'winter', 'all']
    }]
  },
  
  preTreatmentInstructions: {
    type: String,
    maxlength: 2000
  },
  
  postTreatmentInstructions: {
    type: String,
    maxlength: 2000
  },
  
  dietPlan: {
    type: String,
    maxlength: 2000
  },
  
  lifestyleGuidelines: {
    type: String,
    maxlength: 2000
  },
  
  defaultPreferences: {
    skipWeekends: {
      type: Boolean,
      default: false
    },
    
    preferredTimeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'flexible'],
      default: 'morning'
    },
    
    requireSameTherapist: {
      type: Boolean,
      default: true
    }
  },
  
  pricing: {
    basePrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    includesMedicines: {
      type: Boolean,
      default: false
    }
  },
  
  classicalReference: {
    type: String
  },
  
  successRate: {
    type: Number,
    min: 0,
    max: 100
  },
  
  popularityRank: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  usageCount: {
    type: Number,
    default: 0
  },
  
  // 🔥 ONLY NEW FIELD ADDED
  lastUsed: {
    type: Date,
    default: null
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════

CourseTemplateSchema.index({ templateCode: 1, isActive: 1 });
CourseTemplateSchema.index({ category: 1, panchakarmaType: 1 });
CourseTemplateSchema.index({ isActive: 1, isFeatured: 1, popularityRank: -1 });

// ═══════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════

CourseTemplateSchema.virtual('averageSessionDuration').get(function() {
  if (!this.estimatedSessionCount || this.estimatedSessionCount === 0) return 0;
  
  let totalMinutes = 0;
  this.phases.forEach(phase => {
    phase.therapies.forEach(therapy => {
      totalMinutes += therapy.sessionCount * 60;
    });
  });
  
  return Math.round(totalMinutes / this.estimatedSessionCount);
});

CourseTemplateSchema.virtual('sessionsPerWeek').get(function() {
  if (!this.totalDuration || this.totalDuration === 0) return 0;
  
  const weeks = this.totalDuration / 7;
  return Math.round(this.estimatedSessionCount / weeks);
});

// ═══════════════════════════════════════════════════════════
// METHODS
// ═══════════════════════════════════════════════════════════

CourseTemplateSchema.methods.incrementUsage = async function() {
  this.usageCount = (this.usageCount || 0) + 1;
  this.lastUsed = new Date();
  return await this.save();
};

CourseTemplateSchema.methods.isSuitableForPatient = function(patientAge, patientConstitution, currentSeason) {
  const ageGroup = patientAge < 18 ? 'children' : patientAge > 60 ? 'elderly' : 'adults';
  
  const ageOk = this.suitableFor.ageGroup.includes(ageGroup) || 
                this.suitableFor.ageGroup.includes('all');
  
  const constitutionOk = this.suitableFor.constitution.includes(patientConstitution) || 
                         this.suitableFor.constitution.includes('all');
  
  const seasonOk = this.suitableFor.season.includes(currentSeason) || 
                   this.suitableFor.season.includes('all');
  
  return ageOk && constitutionOk && seasonOk;
};

CourseTemplateSchema.methods.getSessionCountByPhase = function() {
  const counts = {
    purvakarma: 0,
    pradhanakarma: 0,
    paschatkarma: 0
  };
  
  this.phases.forEach(phase => {
    const phaseTotal = phase.therapies.reduce((sum, therapy) => {
      return sum + therapy.sessionCount;
    }, 0);
    counts[phase.phaseName] = phaseTotal;
  });
  
  return counts;
};

module.exports = mongoose.model('CourseTemplate', CourseTemplateSchema);
