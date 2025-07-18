const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    en: {
      type: String,
      required: true,
      trim: true
    },
    fa: {
      type: String,
      required: true,
      trim: true
    },
    ps: {
      type: String,
      required: true,
      trim: true
    }
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    en: {
      type: String,
      trim: true
    },
    fa: {
      type: String,
      trim: true
    },
    ps: {
      type: String,
      trim: true
    }
  },
  icon: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  productCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ isFeatured: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ 'name.en': 'text', 'name.fa': 'text', 'name.ps': 'text' });

module.exports = mongoose.model('Category', categorySchema);