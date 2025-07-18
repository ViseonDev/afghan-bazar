const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

favoriteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, createdAt: -1 });
favoriteSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);