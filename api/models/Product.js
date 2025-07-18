const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    enum: ['AFN', 'USD', 'EUR'],
    default: 'AFN'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  images: [{
    type: String,
    trim: true
  }],
  primaryImage: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  stock: {
    available: {
      type: Boolean,
      default: true
    },
    quantity: {
      type: Number,
      min: 0
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
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

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ storeId: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ price: 1 });
productSchema.index({ views: -1 });
productSchema.index({ favorites: -1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);