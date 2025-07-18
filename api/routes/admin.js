const express = require('express');
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Flag = require('../models/Flag');
const Review = require('../models/Review');
const { authorize } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', authorize('admin'), async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalStores = await Store.countDocuments();
    const activeStores = await Store.countDocuments({ isActive: true });
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const totalCategories = await Category.countDocuments();
    const pendingFlags = await Flag.countDocuments({ status: 'pending' });
    const pendingReviews = await Review.countDocuments({ isApproved: false });
    
    // Get user breakdown by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');
    
    const recentStores = await Store.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name city createdAt')
      .populate('ownerId', 'name email');
    
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name category price createdAt')
      .populate('storeId', 'name');
    
    const recentFlags = await Flag.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('targetType reason status createdAt')
      .populate('reporterId', 'name email');
    
    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      stores: {
        total: totalStores,
        active: activeStores,
        inactive: totalStores - activeStores
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: totalProducts - activeProducts
      },
      categories: {
        total: totalCategories
      },
      moderation: {
        pendingFlags,
        pendingReviews
      }
    };
    
    res.json({
      success: true,
      data: {
        stats,
        recentActivity: {
          users: recentUsers,
          stores: recentStores,
          products: recentProducts,
          flags: recentFlags
        }
      }
    });
  } catch (error) {
    logger.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching dashboard'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filtering
// @access  Private (Admin only)
router.get('/users', authorize('admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { role, isActive, search } = req.query;
    
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/admin/stores
// @desc    Get all stores with filtering
// @access  Private (Admin only)
router.get('/stores', authorize('admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { isActive, city, search } = req.query;
    
    let query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const stores = await Store.find(query)
      .populate('ownerId', 'name email')
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
    logger.error('Get admin stores error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching stores'
    });
  }
});

// @route   GET /api/admin/products
// @desc    Get all products with filtering
// @access  Private (Admin only)
router.get('/products', authorize('admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { isActive, category, search } = req.query;
    
    let query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const products = await Product.find(query)
      .populate('storeId', 'name city')
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
    logger.error('Get admin products error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching products'
    });
  }
});

// @route   PUT /api/admin/products/:id/featured
// @desc    Toggle product featured status
// @access  Private (Admin only)
router.put('/products/:id/featured', authorize('admin'), async (req, res) => {
  try {
    const { isFeatured } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    product.isFeatured = isFeatured;
    product.updatedAt = new Date();
    await product.save();
    
    logger.info(`Product featured status changed: ${product.name} to ${isFeatured} by admin ${req.user.email}`);
    
    res.json({
      success: true,
      message: `Product ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: product
    });
  } catch (error) {
    logger.error('Toggle product featured error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating product'
    });
  }
});

// @route   PUT /api/admin/stores/:id/featured
// @desc    Toggle store featured status
// @access  Private (Admin only)
router.put('/stores/:id/featured', authorize('admin'), async (req, res) => {
  try {
    const { isFeatured } = req.body;
    
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }
    
    store.isFeatured = isFeatured;
    store.updatedAt = new Date();
    await store.save();
    
    logger.info(`Store featured status changed: ${store.name} to ${isFeatured} by admin ${req.user.email}`);
    
    res.json({
      success: true,
      message: `Store ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: store
    });
  } catch (error) {
    logger.error('Toggle store featured error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating store'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get system analytics
// @access  Private (Admin only)
router.get('/analytics', authorize('admin'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    // Get new users over time
    const newUsers = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get new stores over time
    const newStores = await Store.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get new products over time
    const newProducts = await Product.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get top categories
    const topCategories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get top cities
    const topCities = await Store.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: {
        period,
        charts: {
          newUsers,
          newStores,
          newProducts
        },
        insights: {
          topCategories,
          topCities
        }
      }
    });
  } catch (error) {
    logger.error('Get admin analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;