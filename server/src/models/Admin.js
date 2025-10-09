// src/models/Admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: [
      'user_management',          // ✅ FIXED: Added underscores
      'appointment_management',    // ✅ FIXED: Added underscores
      'feedback_management',       // ✅ FIXED: Added underscores
      'system_analytics',          // ✅ FIXED: Added underscores
      'verification',
      'monitoring',
      'notifications'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { 
  timestamps: true 
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Don't return password in JSON
adminSchema.methods.toJSON = function() {
  const admin = this.toObject();
  delete admin.passwordHash;
  return admin;
};

module.exports = mongoose.model('Admin', adminSchema);
