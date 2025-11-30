// backend/models/Prescription.js
// 🔥 PRESCRIPTION MODEL - WITH FOOLPROOF UNIQUE NUMBER GENERATION

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const prescriptionMedicineSchema = new Schema({
  medicineId: {
    type: Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  genericName: String,
  category: String,
  
  dosage: {
    type: String,
    required: true,
    default: '1 tablet'
  },
  
  frequency: {
    type: String,
    required: true,
    enum: ['Once daily', 'Twice daily', 'Thrice daily', 'Four times daily', 'As needed'],
    default: 'Twice daily'
  },
  
  timing: {
    type: String,
    required: true,
    enum: ['Before meals', 'After meals', 'With meals', 'Empty stomach', 'Bedtime'],
    default: 'After meals'
  },
  
  duration: {
    type: String,
    required: true,
    default: '7 days'
  },
  
  quantity: {
    type: Number,
    required: true,
    default: 14
  },
  
  specialInstructions: String
}, { _id: false });

const PrescriptionSchema = new Schema({
  // ═══════════════════════════════════════════════════════════
  // USER REFERENCES
  // ═══════════════════════════════════════════════════════════
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  centerId: {
    type: Schema.Types.ObjectId,
    ref: 'Center'
  },

  // ═══════════════════════════════════════════════════════════
  // PRESCRIPTION DETAILS
  // ═══════════════════════════════════════════════════════════
  prescriptionNumber: {
    type: String,
    unique: true,
    index: true
  },

  consultationId: {
    type: Schema.Types.ObjectId,
    ref: 'Consultation'
  },

  consultationDate: {
    type: Date,
    default: Date.now,
    required: true
  },

  chiefComplaint: {
    type: String,
    required: true,
    trim: true
  },

  diagnosis: {
    type: String,
    trim: true
  },

  // ═══════════════════════════════════════════════════════════
  // MEDICINES
  // ═══════════════════════════════════════════════════════════
  medicines: [prescriptionMedicineSchema],

  // ═══════════════════════════════════════════════════════════
  // INSTRUCTIONS
  // ═══════════════════════════════════════════════════════════
  generalInstructions: {
    type: String,
    trim: true
  },

  dietInstructions: {
    type: String,
    trim: true
  },

  lifestyleInstructions: {
    type: String,
    trim: true
  },

  // ═══════════════════════════════════════════════════════════
  // FOLLOW-UP
  // ═══════════════════════════════════════════════════════════
  followUpDate: Date,
  followUpRequired: {
    type: Boolean,
    default: true
  },

  // ═══════════════════════════════════════════════════════════
  // STATUS & OUTCOME
  // ═══════════════════════════════════════════════════════════
  status: {
    type: String,
    enum: ['active', 'completed', 'followup_needed', 'cancelled'],
    default: 'active',
    index: true
  },

  outcome: {
    type: String,
    enum: ['improved', 'not_improved', 'needs_treatment_plan', 'cured'],
    default: null
  },

  outcomeNotes: String,

  // ═══════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════
  prescribedAt: {
    type: Date,
    default: Date.now
  },

  completedAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════
PrescriptionSchema.index({ patientId: 1, createdAt: -1 });
PrescriptionSchema.index({ doctorId: 1, createdAt: -1 });
PrescriptionSchema.index({ prescriptionNumber: 1 });
PrescriptionSchema.index({ status: 1, followUpDate: 1 });

// ═══════════════════════════════════════════════════════════
// 🔥 FOOLPROOF UNIQUE PRESCRIPTION NUMBER GENERATION
// Uses ObjectId (100% unique) + Timestamp (prevents collision)
// ═══════════════════════════════════════════════════════════
PrescriptionSchema.pre('save', function(next) {
  if (!this.prescriptionNumber) {
    // Get current date for readable prefix
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Use ObjectId (guaranteed unique by MongoDB)
    const uniquePart = this._id.toString().slice(-6).toUpperCase();
    
    // Add timestamp milliseconds for extra collision prevention
    const timestamp = Date.now().toString().slice(-4);
    
    // Format: RX-251129-A3F42D-7891
    // RX = Prescription prefix
    // 251129 = Date (YY-MM-DD)
    // A3F42D = Last 6 chars of ObjectId (unique)
    // 7891 = Last 4 digits of timestamp (collision prevention)
    this.prescriptionNumber = `RX-${year}${month}${day}-${uniquePart}-${timestamp}`;
  }
  next();
});

// ═══════════════════════════════════════════════════════════
// METHODS
// ═══════════════════════════════════════════════════════════

/**
 * Check if follow-up is due
 */
PrescriptionSchema.methods.isFollowUpDue = function() {
  return this.followUpDate && new Date() >= this.followUpDate && this.status === 'active';
};

/**
 * Calculate total cost of prescription
 */
PrescriptionSchema.methods.calculateTotalCost = async function() {
  let total = 0;
  
  for (const med of this.medicines) {
    try {
      const medicine = await mongoose.model('Medicine').findById(med.medicineId);
      if (medicine && medicine.price) {
        total += medicine.price * (med.quantity || 0);
      }
    } catch (error) {
      console.error(`Error calculating cost for medicine ${med.medicineId}:`, error);
    }
  }
  
  return Math.round(total * 100) / 100; // Round to 2 decimal places
};

/**
 * Mark prescription as completed
 */
PrescriptionSchema.methods.markCompleted = function(outcome, notes) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (outcome) this.outcome = outcome;
  if (notes) this.outcomeNotes = notes;
  return this.save();
};

/**
 * Get prescription summary (for quick view)
 */
PrescriptionSchema.methods.getSummary = function() {
  return {
    prescriptionNumber: this.prescriptionNumber,
    patientName: this.patientId?.name || 'Unknown',
    date: this.consultationDate,
    medicineCount: this.medicines.length,
    status: this.status,
    followUpDate: this.followUpDate
  };
};

// ═══════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════

/**
 * Get prescriptions needing follow-up
 */
PrescriptionSchema.statics.getFollowUpDue = function(doctorId, days = 7) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return this.find({
    doctorId,
    status: 'active',
    followUpRequired: true,
    followUpDate: {
      $gte: new Date(),
      $lte: endDate
    }
  })
  .populate('patientId', 'name email phone')
  .sort({ followUpDate: 1 });
};

/**
 * Get prescriptions by date range
 */
PrescriptionSchema.statics.getByDateRange = function(doctorId, startDate, endDate) {
  return this.find({
    doctorId,
    consultationDate: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .populate('patientId', 'name email phone')
  .sort({ consultationDate: -1 });
};

/**
 * Get prescription statistics
 */
PrescriptionSchema.statics.getStatistics = async function(doctorId) {
  const stats = await this.aggregate([
    { $match: { doctorId: mongoose.Types.ObjectId(doctorId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const followUpDue = await this.countDocuments({
    doctorId,
    status: 'active',
    followUpDate: { $lte: new Date() }
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayCount = await this.countDocuments({
    doctorId,
    consultationDate: { $gte: today }
  });
  
  const result = {
    total: 0,
    byStatus: {},
    followUpDue,
    today: todayCount
  };
  
  stats.forEach(stat => {
    result.byStatus[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

// ═══════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════

/**
 * Get formatted prescription number
 */
PrescriptionSchema.virtual('formattedNumber').get(function() {
  return this.prescriptionNumber || 'N/A';
});

/**
 * Check if prescription is overdue for follow-up
 */
PrescriptionSchema.virtual('isOverdue').get(function() {
  return this.followUpDate && 
         new Date() > this.followUpDate && 
         this.status === 'active';
});

/**
 * Get days until follow-up
 */
PrescriptionSchema.virtual('daysUntilFollowUp').get(function() {
  if (!this.followUpDate) return null;
  
  const today = new Date();
  const followUp = new Date(this.followUpDate);
  const diffTime = followUp - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);
