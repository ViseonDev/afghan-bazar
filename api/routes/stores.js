const express = require('express');
const Store = require('../models/Store');
const Product = require('../models/Product');
const ViewHistory = require('../models/ViewHistory');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validateStore, validatePagination } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/stores
// @desc    Get all stores with filtering and search
// @access  Public
router.get('/', validatePagination, optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { search, city, district, featured } = req.query;
    
    // Build query
    let query = { isActive: true };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    
    if (district) {
      query.district = { $regex: district, $options: 'i' };
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
        case 'rating':
          sort = { 'rating.average': -1 };
          break;
        case 'name':
          sort = { name: 1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }
    
    const stores = await Store.find(query)
      .populate('ownerId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Store.countDocuments(query);
    
    res.json({
      success: true,
      data: stores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching stores'
    });
  }
});

// @route   GET /api/stores/:id
// @desc    Get single store by ID with its products
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('ownerId', 'name email');
    
    if (!store || !store.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }
    
    // Get store products
    const products = await Product.find({ 
      storeId: req.params.id, 
      isActive: true 
    }).limit(20);
    
    // Track view history
    if (req.user || req.query.sessionId) {
      const viewHistory = new ViewHistory({
        userId: req.user?._id,
        sessionId: req.query.sessionId || req.user?._id,
        targetType: 'store',
        targetId: store._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      await viewHistory.save();
    }
    
    res.json({
      success: true,
      data: {
        store,
        products
      }
    });
  } catch (error) {
    logger.error('Get store error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching store'
    });
  }
});

// @route   POST /api/stores
// @desc    Create a new store
// @access  Private (Merchants only)
router.post('/', authenticate, authorize('merchant', 'admin'), validateStore, async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city,
      district,
      phone,
      whatsapp,
      email,
      images,
      coordinates,
      businessHours
    } = req.body;
    
    const store = new Store({
      name,
      description,
      address,
      city,
      district,
      phone,
      whatsapp,
      email,
      images,
      coverImage: images?.[0],
      coordinates,
      businessHours,
      ownerId: req.user._id
    });
    
    await store.save();
    
    logger.info(`Store created: ${name} by user ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: store
    });
  } catch (error) {
    logger.error('Create store error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating store'
    });
  }
});

// @route   PUT /api/stores/:id
// @desc    Update a store
// @access  Private (Store owner or admin)
router.put('/:id', authenticate, validateStore, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }
    
    // Check ownership
    if (store.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this store'
      });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        store[key] = req.body[key];
      }
    });
    
    store.updatedAt = new Date();
    await store.save();
    
    logger.info(`Store updated: ${store.name} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Store updated successfully',
      data: store
    });
  } catch (error) {
    logger.error('Update store error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating store'
    });
  }
});

// @route   DELETE /api/stores/:id
// @desc    Delete a store
// @access  Private (Store owner or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }
    
    // Check ownership
    if (store.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this store'
      });
    }
    
    // Soft delete by setting isActive to false
    store.isActive = false;
    store.updatedAt = new Date();
    await store.save();
    
    // Also deactivate all products of this store
    await Product.updateMany(
      { storeId: req.params.id },
      { isActive: false, updatedAt: new Date() }
    );
    
    logger.info(`Store deleted: ${store.name} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    logger.error('Delete store error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting store'
    });
  }
});

// @route   GET /api/stores/:id/products
// @desc    Get all products for a specific store
// @access  Public
router.get('/:id/products', validatePagination, optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const store = await Store.findById(req.params.id);
    if (!store || !store.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }
    
    const query = {
      storeId: req.params.id,
      isActive: true
    };
    
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    const products = await Product.find(query)
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
    logger.error('Get store products error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching store products'
    });
  }
});

// @route   GET /api/stores/city/:city
// @desc    Get stores by city
// @access  Public
router.get('/city/:city', validatePagination, optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const query = {
      city: { $regex: req.params.city, $options: 'i' },
      isActive: true
    };
    
    const stores = await Store.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Store.countDocuments(query);
    
    res.json({
      success: true,
      data: stores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get stores by city error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching stores by city'
    });
  }
});

module.exports = router;