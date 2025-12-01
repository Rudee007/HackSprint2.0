// backend/models/Therapy.js
// 🌿 PANCHAKARMA THERAPY MASTER CATALOG

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TherapySchema = new Schema({
  // ═══════════════════════════════════════════════════════════
  // BASIC IDENTIFICATION
  // ═══════════════════════════════════════════════════════════
  
  therapyCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
    // Examples: "SNEHANA_INTERNAL", "VAMANA", "ABHYANGA"
  },
  
  therapyName: {
    type: String,
    required: true,
    trim: true
    // Examples: "Snehapana (Internal Oleation)", "Vamana (Therapeutic Emesis)"
  },
  
  therapyNameSanskrit: {
    type: String,
    trim: true
    // Sanskrit/traditional name
  },
  
  // ═══════════════════════════════════════════════════════════
  // PANCHAKARMA CLASSIFICATION
  // ═══════════════════════════════════════════════════════════
  
  panchakarmaPhase: {
    type: String,
    enum: ['purvakarma', 'pradhanakarma', 'paschatkarma', 'standalone'],
    required: true,
    index: true
  },
  
  panchakarmaType: {
    type: String,
    enum: [
      // Main 5 Panchakarma
      'vamana',           // Therapeutic emesis
      'virechana',        // Purgation
      'basti',            // Enema
      'nasya',            // Nasal therapy
      'raktamokshana',    // Bloodletting
      
      // Preparation therapies
      'snehana',          // Oleation
      'swedana',          // Sweating
      'abhyanga',         // Oil massage
      
      // Post-care
      'samsarjana',       // Graded diet
      'rasayana',         // Rejuvenation
      
      // Supportive therapies
      'shirodhara',       // Oil pour on forehead
      'pizhichil',        // Oil bath
      'udvartana',        // Powder massage
      'kati_basti',       // Lower back therapy
      'janu_basti',       // Knee therapy
      'netra_tarpana',    // Eye therapy
      
      'other'
    ],
    required: true
  },
  
  category: {
    type: String,
    enum: ['preparation', 'main_procedure', 'post_care', 'supportive', 'rejuvenation'],
    required: true
  },
  
  // ═══════════════════════════════════════════════════════════
  // 🔥 CRITICAL: SCHEDULING PARAMETERS
  // ═══════════════════════════════════════════════════════════
  
  standardDuration: {
    type: Number,
    required: true,
    min: 15,
    // Duration in minutes
    // Examples: Snehapana: 30, Abhyanga: 60, Vamana: 120
  },
  
  bufferTime: {
    type: Number,
    default: 15,
    min: 0,
    // Rest/cleanup time after procedure (minutes)
  },
  
  // ═══════════════════════════════════════════════════════════
  // 🔥 CRITICAL: CSP PREREQUISITES
  // ═══════════════════════════════════════════════════════════
  
  prerequisites: [{
    therapyCode: {
      type: String,
      required: true
      // Code of prerequisite therapy
    },
    minimumDays: {
      type: Number,
      required: true,
      min: 0
      // Minimum days of prerequisite therapy required
    },
    mustComplete: {
      type: Boolean,
      default: true
      // Must all prerequisite sessions complete before this therapy?
    },
    reason: {
      type: String,
      maxlength: 500
      // Clinical reason for prerequisite
    }
  }],
  
  // ═══════════════════════════════════════════════════════════
  // POST-CARE REQUIREMENTS
  // ═══════════════════════════════════════════════════════════
  
  postCareRequirements: {
    duration: {
      type: Number,
      default: 0
      // Days of post-care required
    },
    dietRestrictions: [{
      type: String,
      enum: [
        'liquid_diet',
        'semi_solid_diet', 
        'light_diet',
        'avoid_cold_food',
        'avoid_heavy_food',
        'warm_food_only',
        'specific_samsarjana'
      ]
    }],
    activityRestrictions: [{
      type: String,
      enum: [
        'complete_rest',
        'avoid_exercise',
        'avoid_travel',
        'avoid_sexual_activity',
        'avoid_sun_exposure',
        'avoid_cold_water',
        'stay_warm',
        'no_talking'
      ]
    }],
    observationRequired: {
      type: Boolean,
      default: false
      // Requires medical observation post-procedure?
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // RESOURCE REQUIREMENTS
  // ═══════════════════════════════════════════════════════════
  
  resourceRequirements: {
    skillLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate',
      required: true
      // Therapist skill level required
    },
    
    minimumTherapists: {
      type: Number,
      default: 1,
      min: 1
      // Some therapies need 2+ therapists
    },
    
    roomType: {
      type: String,
      enum: ['consultation', 'massage_room', 'panchakarma_suite', 'steam_room', 'any']
    },
    
    equipment: [{
      type: String
      // Examples: "steam_chamber", "shirodhara_stand", "droni_table"
    }],
    
    consumables: [{
      item: {
        type: String,
        required: true
        // Examples: "medicated_ghee", "sesame_oil", "castor_oil"
      },
      quantityPerSession: {
        type: Number,
        required: true,
        min: 0
      },
      unit: {
        type: String,
        enum: ['ml', 'grams', 'kg', 'liters', 'units', 'drops', 'pieces'],
        default: 'ml'
      }
    }]
  },
  
  // ═══════════════════════════════════════════════════════════
  // SCHEDULING CONSTRAINTS
  // ═══════════════════════════════════════════════════════════
  
  constraints: {
    preferredTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'specific', 'any'],
      default: 'morning'
    },
    
    specificTime: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] - ([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      // Format: "06:00 - 08:00"
    },
    
    requiresFasting: {
      type: Boolean,
      default: false
    },
    
    fastingDuration: {
      type: Number,
      default: 0
      // Hours of fasting required before procedure
    },
    
    canRunParallel: {
      type: Boolean,
      default: false
      // Can this therapy run simultaneously with others?
    },
    
    seasonalRecommendation: [{
      type: String,
      enum: ['spring', 'summer', 'monsoon', 'autumn', 'winter', 'all']
    }],
    
    contraindications: [{
      type: String
      // Examples: "pregnancy", "high_blood_pressure", "heart_disease"
    }]
  },
  
  // ═══════════════════════════════════════════════════════════
  // CLINICAL INFORMATION
  // ═══════════════════════════════════════════════════════════
  
  indications: [{
    type: String
    // When to use this therapy
  }],
  
  doshaTarget: [{
    type: String,
    enum: ['vata', 'pitta', 'kapha', 'tridosha']
  }],
  
  expectedOutcome: {
    type: String,
    maxlength: 1000
  },
  
  procedureSteps: [{
    stepNumber: Number,
    stepName: String,
    description: String,
    duration: Number // minutes
  }],
  
  safetyNotes: {
    type: String,
    maxlength: 2000
  },
  
  // ═══════════════════════════════════════════════════════════
  // DESCRIPTION & DOCUMENTATION
  // ═══════════════════════════════════════════════════════════
  
  description: {
    type: String,
    maxlength: 2000
  },
  
  benefits: [{
    type: String
  }],
  
  classicalReference: {
    type: String
    // Reference to classical Ayurvedic texts
  },
  
  // ═══════════════════════════════════════════════════════════
  // PRICING (Optional)
  // ═══════════════════════════════════════════════════════════
  
  pricing: {
    basePrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // STATUS & METADATA
  // ═══════════════════════════════════════════════════════════
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════

TherapySchema.index({ therapyCode: 1, isActive: 1 });
TherapySchema.index({ panchakarmaPhase: 1, panchakarmaType: 1 });
TherapySchema.index({ category: 1, isActive: 1 });
TherapySchema.index({ 'resourceRequirements.skillLevel': 1 });

// ═══════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════

// Total time including buffer
TherapySchema.virtual('totalTimeRequired').get(function() {
  return this.standardDuration + this.bufferTime;
});

// Has prerequisites
TherapySchema.virtual('hasPrerequisites').get(function() {
  return this.prerequisites && this.prerequisites.length > 0;
});

// ═══════════════════════════════════════════════════════════
// METHODS
// ═══════════════════════════════════════════════════════════

// Check if therapist is qualified
TherapySchema.methods.isTherapistQualified = function(therapistSkillLevel) {
  const skillHierarchy = {
    'Beginner': 1,
    'Intermediate': 2,
    'Advanced': 3,
    'Expert': 4
  };
  
  const requiredLevel = skillHierarchy[this.resourceRequirements.skillLevel];
  const therapistLevel = skillHierarchy[therapistSkillLevel];
  
  return therapistLevel >= requiredLevel;
};

// Check if therapy can be scheduled at given time
TherapySchema.methods.canScheduleAtTime = function(time) {
  if (this.constraints.preferredTime === 'any') return true;
  if (this.constraints.preferredTime === 'specific') {
    // Check if time falls within specificTime range
    // Implementation depends on time format
    return true; // Simplified
  }
  
  const hour = new Date(time).getHours();
  
  switch(this.constraints.preferredTime) {
    case 'morning':
      return hour >= 6 && hour < 12;
    case 'afternoon':
      return hour >= 12 && hour < 17;
    case 'evening':
      return hour >= 17 && hour < 21;
    default:
      return true;
  }
};

module.exports = mongoose.model('Therapy', TherapySchema);
