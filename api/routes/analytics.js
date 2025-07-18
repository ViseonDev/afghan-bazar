const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const ViewHistory = require('../models/ViewHistory');
const ChatMessage = require('../models/ChatMessage');
const Flag = require('../models/Flag');
const router = express.Router();

// Get merchant dashboard analytics
router.get('/merchant/dashboard', auth, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const userId = req.user.id;
    
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

    // Get user's stores
    const stores = await Store.find({ owner: userId });
    const storeIds = stores.map(store => store._id);

    // Get products for user's stores
    const products = await Product.find({ storeId: { $in: storeIds } });
    const productIds = products.map(product => product._id);

    // Basic stats
    const stats = {
      storeCount: stores.length,
      productCount: products.length,
      viewCount: await ViewHistory.countDocuments({
        targetId: { $in: [...storeIds, ...productIds] },
        viewedAt: { $gte: startDate }
      }),
      messageCount: await ChatMessage.countDocuments({
        storeId: { $in: storeIds },
        timestamp: { $gte: startDate }
      })
    };

    // Sales/views data for chart (mock data for now)
    const salesData = [];
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const interval = period === 'week' ? 1 : period === 'month' ? 1 : 30;
    
    for (let i = days; i >= 0; i -= interval) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayViews = await ViewHistory.countDocuments({
        targetId: { $in: [...storeIds, ...productIds] },
        viewedAt: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      });
      
      salesData.push({
        date: date.toISOString().split('T')[0],
        sales: dayViews
      });
    }

    // Recent activity
    const recentActivity = await ViewHistory.find({
      targetId: { $in: [...storeIds, ...productIds] },
      viewedAt: { $gte: startDate }
    })
    .populate('userId', 'name')
    .populate('targetId')
    .sort({ viewedAt: -1 })
    .limit(10);

    const formattedActivity = recentActivity.map(activity => ({
      type: activity.targetType,
      description: `${activity.userId?.name || 'Someone'} viewed your ${activity.targetType}`,
      timestamp: activity.viewedAt
    }));

    res.json({
      success: true,
      data: {
        stats,
        analytics: {
          salesData
        },
        recentActivity: formattedActivity
      }
    });
  } catch (error) {
    console.error('Merchant dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data',
      error: error.message
    });
  }
});

// Get admin dashboard analytics
router.get('/admin/dashboard', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

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

    // Basic stats
    const stats = {
      userCount: await User.countDocuments(),
      storeCount: await Store.countDocuments({ isActive: true }),
      productCount: await Product.countDocuments({ isActive: true }),
      flagCount: await Flag.countDocuments({ status: 'pending' }),
      userGrowth: await calculateGrowth(User, startDate, period),
      storeGrowth: await calculateGrowth(Store, startDate, period),
      productGrowth: await calculateGrowth(Product, startDate, period)
    };

    // Growth data for charts
    const growthData = [];
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const interval = period === 'week' ? 1 : period === 'month' ? 1 : 30;
    
    for (let i = days; i >= 0; i -= interval) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const users = await User.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });
      
      const stores = await Store.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });
      
      growthData.push({
        date: date.toISOString().split('T')[0],
        users,
        stores
      });
    }

    // Category distribution
    const categoryDistribution = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $group: {
          _id: '$categoryInfo.name',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          population: '$count',
          color: { $literal: '#' + Math.floor(Math.random()*16777215).toString(16) },
          legendFontColor: '#7F7F7F',
          legendFontSize: 12
        }
      }
    ]);

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
        analytics: {
          growthData,
          categoryDistribution
        },
        recentActivity: formattedActivity,
        users: recentUsers,
        flaggedContent
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data',
      error: error.message
    });
  }
});

// Get store analytics
router.get('/store/:storeId', auth, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { period = 'week' } = req.query;
    
    // Verify store ownership
    const store = await Store.findById(storeId);
    if (!store || store.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

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

    const products = await Product.find({ storeId });
    const productIds = products.map(p => p._id);

    const analytics = {
      views: await ViewHistory.countDocuments({
        targetId: storeId,
        viewedAt: { $gte: startDate }
      }),
      productViews: await ViewHistory.countDocuments({
        targetId: { $in: productIds },
        viewedAt: { $gte: startDate }
      }),
      messages: await ChatMessage.countDocuments({
        storeId,
        timestamp: { $gte: startDate }
      }),
      products: products.length
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Store analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load store analytics',
      error: error.message
    });
  }
});

// Helper function to calculate growth percentage
async function calculateGrowth(Model, startDate, period) {
  const currentCount = await Model.countDocuments({
    createdAt: { $gte: startDate }
  });
  
  let previousStartDate = new Date(startDate);
  switch (period) {
    case 'week':
      previousStartDate.setDate(previousStartDate.getDate() - 7);
      break;
    case 'month':
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);
      break;
    case 'year':
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
      break;
  }
  
  const previousCount = await Model.countDocuments({
    createdAt: { $gte: previousStartDate, $lt: startDate }
  });
  
  if (previousCount === 0) return currentCount > 0 ? 100 : 0;
  
  return Math.round(((currentCount - previousCount) / previousCount) * 100);
}

module.exports = router;