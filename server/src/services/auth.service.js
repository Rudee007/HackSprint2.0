const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

class AuthService {
  // Register new user with email/phone verification
  async register(userData) {
    const { name, email, phone, password, role, location ,address} = userData;

    if (!email && !phone) {
      throw new Error('Either email or phone number is required');
    }

    const existingUser = await this.findExistingUser(email, phone);
    if (existingUser) {
      if ((email && existingUser.email === email) || (phone && existingUser.phone === phone)) {
        throw new Error('User already exists with this email or phone');
      }
    }

    const user = new User({
      name,
      email: email || undefined,
      phone: phone || undefined,
      passwordHash: password,
      role,
      location,
      address
    });

    const verificationData = {};
    if (email) {
      verificationData.emailToken = user.generateEmailVerificationToken();
    }
    if (phone) {
      verificationData.phoneOTP = user.generatePhoneOTP();
    }

    await user.save();
    return { user, verificationData };
  }

  // Find existing user by email or phone
  async findExistingUser(email, phone) {
    const query = {};
    if (email && phone) query.$or = [{ email }, { phone }];
    else if (email) query.email = email;
    else if (phone) query.phone = phone;

    return await User.findOne(query);
  }

  // Login with email or phone
  async login(identifier, password) {
    const isEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(identifier);
    const query = isEmail ? { email: identifier } : { phone: identifier };

    const user = await User.findOne(query);
    if (!user) throw new Error('Invalid credentials');

    if (!user.isActive) throw new Error('Account is deactivated');

    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
      throw new Error(`Account is locked. Try again in ${lockTimeRemaining} minutes`);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new Error('Invalid credentials');

    user.lastLogin = new Date();
    await user.save();

    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await user.save();

    
    return { user, accessToken, refreshToken };
  }

  // Verify email
  async verifyEmail(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) throw new Error('Invalid or expired verification token');

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();
    return user;
  }

  // Verify phone with OTP
  async verifyPhone(userId, otp) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const isValid = user.verifyPhoneOTP(otp);
    if (!isValid) throw new Error('Invalid OTP');

    await user.save();
    return user;
  }

  // Resend email verification
  async resendEmailVerification(email) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');
    if (user.emailVerified) throw new Error('Email is already verified');

    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    return { user, verificationToken };
  }

  // Resend phone OTP
  async resendPhoneOTP(phone) {
    const user = await User.findOne({ phone });
    if (!user) throw new Error('User not found');
    if (user.phoneVerified) throw new Error('Phone is already verified');

    const otp = user.generatePhoneOTP();
    await user.save();

    return { user, otp };
  }

  // Link email or phone
  async linkAccount(userId, email = null, phone = null) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (email) {
      const existingEmailUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmailUser) throw new Error('Email already associated with another account');
      user.email = email;
      user.emailVerified = false;
    }

    if (phone) {
      const existingPhoneUser = await User.findOne({ phone, _id: { $ne: userId } });
      if (existingPhoneUser) throw new Error('Phone already associated with another account');
      user.phone = phone;
      user.phoneVerified = false;
    }

    await user.save();
    return user;
  }

  // Refresh token
  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, config.JWT.REFRESH_SECRET);
  
      const user = await User.findById(decoded.id);
      if (!user || !user.refreshTokens.includes(token)) {
        throw new Error('Invalid refresh token');
      }
  
      const newAccessToken = user.generateAuthToken();
      return { accessToken: newAccessToken, user };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }
  

  // Logout (remove refresh token)
  async logout(userId, refreshToken) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      await user.save();
    }
  }

  // Logout all devices
  async logoutAll(userId) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }
  }
}

module.exports = new AuthService();
