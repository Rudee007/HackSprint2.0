// backend/models/Medicine.js
// 🔥 MEDICINE INVENTORY - KNOWLEDGE BASE

const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    index: true
  },
  
  genericName: {
    type: String,
    trim: true,
    index: true
  },

  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Churna (Powder)',
      'Vati (Tablet)',
      'Kwath (Decoction)',
      'Taila (Oil)',
      'Ghrita (Ghee)',
      'Asava/Arishta (Fermented)',
      'Lehya (Paste)',
      'Bhasma (Ash)',
      'Guggulu',
      'Rasayana (Rejuvenation)',
      'Other'
    ]
  },

  composition: String,
  defaultDosage: {
    type: String,
    default: '1 tablet'
  },

  // Stock Management
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  minStockLevel: {
    type: Number,
    default: 10
  },

  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  mrp: Number,

  manufacturer: String,
  batchNumber: String,
  expiryDate: Date,

  usageInstructions: String,
  indications: [String],
  contraindications: [String],
  sideEffects: [String],

  // ✅ Center Reference (like Consultation)
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
    index: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // ✅ Reference User, not Doctor
  }

}, {
  timestamps: true
});

// Indexes for fast searching
medicineSchema.index({ name: 'text', genericName: 'text', category: 'text' });
medicineSchema.index({ centerId: 1, isActive: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
