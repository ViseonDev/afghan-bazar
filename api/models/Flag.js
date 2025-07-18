const mongoose = require('mongoose');

const flagSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['product', 'store', 'review', 'user'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  reason: {
    type: String,
    enum: [
      'inappropriate_content',
      'spam',
      'fake_listing',
      'offensive_language',
      'copyright_violation',
      'misleading_information',
      'harassment',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatorNotes: {
    type: String,
    trim: true
  },
  resolution: {
    type: String,
    enum: ['no_action', 'warning_issued', 'content_removed', 'account_suspended', 'account_banned'],
    default: 'no_action'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  }
});

flagSchema.index({ reporterId: 1 });
flagSchema.index({ targetType: 1, targetId: 1 });
flagSchema.index({ status: 1 });
flagSchema.index({ moderatorId: 1 });
flagSchema.index({ priority: 1 });
flagSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Flag', flagSchema);