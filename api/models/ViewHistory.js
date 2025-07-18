const mongoose = require('mongoose');

const viewHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['product', 'store'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  referrer: {
    type: String,
    trim: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  }
});

viewHistorySchema.index({ userId: 1, viewedAt: -1 });
viewHistorySchema.index({ sessionId: 1, viewedAt: -1 });
viewHistorySchema.index({ targetType: 1, targetId: 1 });
viewHistorySchema.index({ viewedAt: -1 });

module.exports = mongoose.model('ViewHistory', viewHistorySchema);