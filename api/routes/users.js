const express = require('express');
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const ViewHistory = require('../models/ViewHistory');
const { authorize } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile with stats
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = req.user;
    
    // Get user stats
    let stats = {};
    
    if (user.role === 'merchant') {
      const storeCount = await Store.countDocuments({ 
        ownerId: user._id, 
        isActive: true 
      });
      const productCount = await Product.countDocuments({ 
        storeId: { $in: await Store.find({ ownerId: user._id }).select('_id') },
        isActive: true 
      });
      
      stats = {
        storeCount,
        productCount
      };
    }
    
    const viewHistoryCount = await ViewHistory.countDocuments({ userId: user._id });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          language: user.language,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        },
        stats: {
          ...stats,
          viewHistoryCount
        }
      }
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching profile'
    });
  }
});

// @route   GET /api/users/history
// @desc    Get user's view history
// @access  Private
router.get('/history', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { targetType } = req.query;
    
    let query = { userId: req.user._id };
    
    if (targetType) {
      query.targetType = targetType;
    }
    
    const history = await ViewHistory.find(query)
      .sort({ viewedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Populate the target objects
    const populatedHistory = await Promise.all(
      history.map(async (item) => {
        let target;
        if (item.targetType === 'product') {
          target = await Product.findById(item.targetId)
            .populate('storeId', 'name city address');
        } else if (item.targetType === 'store') {
          target = await Store.findById(item.targetId);
        }
        
        return {
          _id: item._id,
          targetType: item.targetType,
          targetId: item.targetId,
          target,
          viewedAt: item.viewedAt
        };
      })
    );
    
    const total = await ViewHistory.countDocuments(query);
    
    res.json({
      success: true,
      data: populatedHistory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get user history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching history'
    });
  }
});

// @route   DELETE /api/users/history
// @desc    Clear user's view history
// @access  Private
router.delete('/history', async (req, res) => {
  try {
    await ViewHistory.deleteMany({ userId: req.user._id });
    
    logger.info(`View history cleared for user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'View history cleared successfully'
    });
  } catch (error) {
    logger.error('Clear user history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while clearing history'
    });
  }
});

// @route   GET /api/users/merchant/dashboard
// @desc    Get merchant dashboard data
// @access  Private (Merchants only)
router.get('/merchant/dashboard', authorize('merchant', 'admin'), async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get merchant's stores
    const stores = await Store.find({ ownerId: userId, isActive: true });
    const storeIds = stores.map(store => store._id);
    
    // Get products for all stores
    const products = await Product.find({ 
      storeId: { $in: storeIds },
      isActive: true 
    }).populate('storeId', 'name');
    
    // Get recent view history for merchant's products
    const recentViews = await ViewHistory.find({
      targetType: 'product',
      targetId: { $in: products.map(p => p._id) }
    })
      .populate('targetId', 'name')
      .sort({ viewedAt: -1 })
      .limit(10);
    
    // Calculate stats
    const stats = {
      totalStores: stores.length,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
      totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0),
      totalFavorites: products.reduce((sum, p) => sum + (p.favorites || 0), 0),
      averageRating: stores.reduce((sum, s) => sum + (s.rating?.average || 0), 0) / stores.length || 0
    };
    
    res.json({
      success: true,
      data: {
        stores,
        products,
        recentViews,
        stats
      }
    });
  } catch (error) {
    logger.error('Get merchant dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching dashboard'
    });
  }
});

// @route   GET /api/users/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin only)
router.get('/admin/dashboard', authorize('admin', 'moderator'), async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const Flag = require('../models/Flag');

    // Basic stats
    const stats = {
      userCount: await User.countDocuments(),
      storeCount: await Store.countDocuments({ isActive: true }),
      productCount: await Product.countDocuments({ isActive: true }),
      flagCount: await Flag.countDocuments({ status: 'pending' })
    };

    // Recent users
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent activity
    const recentActivity = await ViewHistory.find({ viewedAt: { $gte: startDate } })
      .populate('userId', 'name')
      .sort({ viewedAt: -1 })
      .limit(10);

    const formattedActivity = recentActivity.map(activity => ({
      type: activity.targetType,
      description: `${activity.userId?.name || 'Someone'} viewed a ${activity.targetType}`,
      timestamp: activity.viewedAt
    }));

    // Flagged content
    const flaggedContent = await Flag.find({ status: 'pending' })
      .populate('reporterId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        stats,
        recentActivity: formattedActivity,
        users: recentUsers,
        flaggedContent
      }
    });
  } catch (error) {
    logger.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching dashboard data'
    });
  }
});

// @route   PUT /api/users/role
// @desc    Change user role (Admin only)
// @access  Private (Admin only)
router.put('/role', authorize('admin'), async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    
    if (!userId || !newRole) {
      return res.status(400).json({
        success: false,
        error: 'User ID and new role are required'
      });
    }
    
    if (!['shopper', 'merchant', 'moderator', 'admin'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role specified'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const oldRole = user.role;
    user.role = newRole;
    user.updatedAt = new Date();
    await user.save();
    
    logger.info(`User role changed: ${user.email} from ${oldRole} to ${newRole} by admin ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        userId: user._id,
        email: user.email,
        oldRole,
        newRole
      }
    });
  } catch (error) {
    logger.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while changing user role'
    });
  }
});

// @route   PUT /api/users/status
// @desc    Change user status (Admin only)
// @access  Private (Admin only)
router.put('/status', authorize('admin'), async (req, res) => {
  try {
    const { userId, isActive } = req.body;
    
    if (!userId || typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'User ID and status are required'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    user.isActive = isActive;
    user.updatedAt = new Date();
    await user.save();
    
    logger.info(`User status changed: ${user.email} to ${isActive ? 'active' : 'inactive'} by admin ${req.user.email}`);
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        userId: user._id,
        email: user.email,
        isActive
      }
    });
  } catch (error) {
    logger.error('Change user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while changing user status'
    });
  }
});

module.exports = router;