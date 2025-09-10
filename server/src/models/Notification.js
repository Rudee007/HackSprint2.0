// src/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient reference is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['pre-procedure', 'post-procedure', 'appointment', 'reminder', 'emergency', 'system'],
    required: [true, 'Notification type is required']
  },
  category: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info'
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'push', 'in-app'],
    default: 'in-app'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  scheduledAt: Date,
  sentAt: Date,
  readAt: Date,
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['appointment', 'therapyPlan', 'feedback']
    },
    entityId: mongoose.Schema.Types.ObjectId
  },
  metadata: mongoose.Schema.Types.Mixed,
  retryCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for notification queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ type: 1, priority: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
