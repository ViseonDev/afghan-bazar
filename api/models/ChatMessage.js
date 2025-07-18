const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'location', 'contact'],
    default: 'text'
  },
  attachments: [{
    type: String,
    trim: true
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

chatMessageSchema.index({ storeId: 1, timestamp: -1 });
chatMessageSchema.index({ senderId: 1, timestamp: -1 });
chatMessageSchema.index({ recipientId: 1, timestamp: -1 });
chatMessageSchema.index({ isRead: 1 });
chatMessageSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);