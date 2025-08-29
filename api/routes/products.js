const express = require('express');
const Product = require('../models/Product');
const Store = require('../models/Store');
const ViewHistory = require('../models/ViewHistory');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validateProduct, validatePagination } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering and search
// @access  Public
/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Get all products with optional filtering
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter products by the store's city
 *     responses:
 *       '200':
 *         description: A list of products
 */
router.get('/', validatePagination, optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { search, category, subcategory, minPrice, maxPrice, storeId, featured, city } = req.query;
    
    // Build query
    let query = { isActive: true };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (subcategory) {
      query.subcategory = subcategory;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (city && !storeId) {
      const storesInCity = await Store.find({
        city: { $regex: city, $options: 'i' }
      }).select('_id');
      query.storeId = { $in: storesInCity.map((s) => s._id) };
    }

    if (storeId) {
      query.storeId = storeId;
    }
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    // Sort options
    let sort = {};
    if (search) {
      sort.score = { $meta: 'textScore' };
    } else {
      sort.createdAt = -1;
    }
    
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price_asc':
          sort = { price: 1 };
          break;
        case 'price_desc':
          sort = { price: -1 };
          break;
        case 'rating':
          sort = { 'rating.average': -1 };
          break;
        case 'popular':
          sort = { views: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }
    
    const products = await Product.find(query)
      .populate('storeId', 'name city address phone')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching products'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('storeId', 'name description address city phone whatsapp email images');
    
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Increment view count
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    
    // Track view history
    if (req.user || req.query.sessionId) {
      const viewHistory = new ViewHistory({
        userId: req.user?._id,
        sessionId: req.query.sessionId || req.user?._id,
        targetType: 'product',
        targetId: product._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      await viewHistory.save();
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching product'
    });
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private (Merchants only)
router.post('/', authenticate, authorize('merchant', 'admin'), validateProduct, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      currency,
      category,
      subcategory,
      storeId,
      images,
      stock,
      tags,
      specifications
    } = req.body;
    
    // Verify store ownership
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }
    
    if (store.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create products for this store'
      });
    }
    
    const product = new Product({
      name,
      description,
      price,
      currency,
      category,
      subcategory,
      storeId,
      images,
      primaryImage: images?.[0],
      stock,
      tags,
      specifications
    });
    
    await product.save();
    
    logger.info(`Product created: ${name} by user ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating product'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private (Store owner or admin)
router.put('/:id', authenticate, validateProduct, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Check ownership
    const store = await Store.findById(product.storeId);
    if (store.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this product'
      });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });
    
    product.updatedAt = new Date();
    await product.save();
    
    logger.info(`Product updated: ${product.name} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating product'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (Store owner or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Check ownership
    const store = await Store.findById(product.storeId);
    if (store.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this product'
      });
    }
    
    // Soft delete by setting isActive to false
    product.isActive = false;
    product.updatedAt = new Date();
    await product.save();
    
    logger.info(`Product deleted: ${product.name} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting product'
    });
  }
});

// @route   GET /api/products/category/:category
// @desc    Get products by category
// @access  Public
router.get('/category/:category', validatePagination, optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const query = {
      category: req.params.category,
      isActive: true
    };
    
    if (req.query.subcategory) {
      query.subcategory = req.query.subcategory;
    }
    
    const products = await Product.find(query)
      .populate('storeId', 'name city address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching products by category'
    });
  }
});

module.exports = router;