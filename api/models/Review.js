const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatorNotes: {
    type: String,
    trim: true
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  reportedCount: {
    type: Number,
    default: 0
  },
  images: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

reviewSchema.index({ reviewerId: 1 });
reviewSchema.index({ targetType: 1, targetId: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ isApproved: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpfulVotes: -1 });

module.exports = mongoose.model('Review', reviewSchema);