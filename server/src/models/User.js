// models/User.js - COMPLETE FIXED VERSION
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    lowercase: true,
    sparse: true, // Allow multiple null values
    validate: {
      validator: function(email) {
        return !email || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email'
    }
  },
  phone: {
    type: String,
    sparse: true, // Allow multiple null values
    validate: {
      validator: function(phone) {
        return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
      },
      message: 'Please enter a valid phone number'
    }
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: {
      values: ['patient', 'doctor', 'therapist', 'admin'],
      message: 'Role must be patient, doctor, therapist, or admin'
    },
    required: [true, 'User role is required']
  },
  
  // ✅ ADMIN-SPECIFIC FIELDS
  permissions: [{
    type: String,
    enum: [
      'user_management', 
      'appointment_management', 
      'provider_management',
      'system_analytics',
      'notification_management',
      'audit_logs'
    ]
  }],
  
  // ✅ AUDIT FIELDS
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  deletedAt: Date,
  deletedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // Verification fields
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  phoneOTP: String,
  phoneOTPExpires: Date,
  phoneOTPAttempts: {
    type: Number,
    default: 0
  },
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Session management
  refreshTokens: [String], // Store active refresh tokens
  
  // ✅ FIXED: Location for AyurSutra with conditional validation
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: undefined // ✅ Don't set default 'Point' without coordinates
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined, // ✅ Allow undefined
      validate: {
        validator: function(coordinates) {
          // ✅ Allow empty/null OR valid coordinates
          if (!coordinates || coordinates.length === 0) return true;
          return coordinates.length === 2 &&
                 coordinates[0] >= -180 && coordinates[0] <= 180 &&
                 coordinates[1] >= -90 && coordinates[1] <= 90;
        },
        message: 'Invalid coordinates format. Must be [longitude, latitude]'
      }
    }
  },
  
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },

  profileCompleted: {
    type: Boolean,
    default: false
  },
  
  // Profile information
  profile: {
   
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    constitution: {
      vata: { type: Number, min: 0, max: 100, default: 33 },
      pitta: { type: Number, min: 0, max: 100, default: 33 },
      kapha: { type: Number, min: 0, max: 100, default: 34 }
    },
    medicalHistory: [String],
    allergies: [String],
    symptoms: {
      type: [String],
    },
    dietHabits: String,
    sleepPattern: String,
    stressLevel: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      default: 'moderate'
    },
    digestion: String,
    bowelHabits: String,
    addictions: [String],
    exerciseRoutine: String,
    menstrualHistory: String,
    currentMedications: [String]
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true, 
    transform: function(doc, ret) {
      delete ret.passwordHash;
      delete ret.refreshTokens;
      delete ret.emailVerificationToken;
      delete ret.phoneOTP;
      delete ret.passwordResetToken;
      return ret;
    }
  }
});

userSchema.index({ location: '2dsphere' });

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin' && !this.permissions.length) {
    return true;
  }
  return this.role === 'admin' && this.permissions.includes(permission);
};

userSchema.methods.canManageUser = function(targetUser) {
  if (!this.isAdmin()) return false;
  
  if (!this.permissions.length) return true;
  
  if (this.hasPermission('user_management')) {
    return targetUser.role !== 'admin';
  }
  
  return false;
};

userSchema.methods.setAuditInfo = function(userId) {
  if (this.isNew) {
    this.createdBy = userId;
  }
  this.updatedBy = userId;
  this.updatedAt = new Date();
};

userSchema.pre('save', function(next) {
  if (this.location) {
    if (!this.location.coordinates || 
        this.location.coordinates.length !== 2 ||
        this.location.coordinates.every(coord => coord === null || coord === undefined || isNaN(coord))) {
      this.location = undefined;
    }
  }
  next();
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ PRE-SAVE MIDDLEWARE FOR ADMIN PERMISSIONS
userSchema.pre('save', function(next) {
  // Auto-assign all permissions to admin role if none specified
  if (this.role === 'admin' && (!this.permissions || this.permissions.length === 0)) {
    this.permissions = [
      'user_management', 
      'appointment_management', 
      'provider_management',
      'system_analytics',
      'notification_management',
      'audit_logs'
    ];
  }
  
  // Remove permissions from non-admin users
  if (this.role !== 'admin') {
    this.permissions = [];
  }
  
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isLocked) {
    throw new Error('Account is temporarily locked');
  }
  
  const isMatch = await bcrypt.compare(candidatePassword, this.passwordHash);
  
  if (!isMatch) {
    this.loginAttempts += 1;
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.loginAttempts >= 5) {
      this.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
    }
    
    await this.save();
    return false;
  }
  
  // Reset login attempts on successful login
  if (this.loginAttempts > 0) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    await this.save();
  }
  
  return true;
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    phone: this.phone,
    role: this.role,
    // ✅ Include admin info in JWT
    isAdmin: this.isAdmin(),
    permissions: this.permissions || []
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  this.refreshTokens.push(refreshToken);
  return refreshToken;
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Method to generate phone OTP
userSchema.methods.generatePhoneOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.phoneOTP = otp;
  this.phoneOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.phoneOTPAttempts = 0;
  
  return otp;
};

// Method to verify phone OTP
userSchema.methods.verifyPhoneOTP = function(candidateOTP) {
  if (!this.phoneOTP || !this.phoneOTPExpires) {
    throw new Error('No OTP found');
  }
  
  if (Date.now() > this.phoneOTPExpires) {
    throw new Error('OTP has expired');
  }
  
  if (this.phoneOTPAttempts >= 3) {
    throw new Error('Too many OTP attempts');
  }
  
  if (this.phoneOTP !== candidateOTP) {
    this.phoneOTPAttempts += 1;
    return false;
  }
  
  // Clear OTP data on successful verification
  this.phoneOTP = undefined;
  this.phoneOTPExpires = undefined;
  this.phoneOTPAttempts = 0;
  this.phoneVerified = true;
  
  return true;
};

module.exports = mongoose.model('User', userSchema);
