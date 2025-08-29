const express = require('express');
const Flag = require('../models/Flag');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Review = require('../models/Review');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateFlag,
  validatePagination,
  validateObjectId,
  validateFlagReview
} = require('../middleware/validation');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const router = express.Router();

const createFlagLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many reports submitted. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/flags
// @desc    Create a new flag/report
// @access  Private
router.post(
  '/',
  authenticate,
  authorize('shopper', 'merchant', 'moderator', 'admin'),
  createFlagLimiter,
  validateFlag,
  async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;
    
    // Verify target exists
    let target;
    switch (targetType) {
      case 'product':
        target = await Product.findById(targetId);
        break;
      case 'store':
        target = await Store.findById(targetId);
        break;
      case 'review':
        target = await Review.findById(targetId);
        break;
      case 'user':
        target = await User.findById(targetId);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid target type'
        });
    }
    
    if (!target) {
      return res.status(404).json({
        success: false,
        error: 'Target not found'
      });
    }
    
    // Check if user has already flagged this item
    const existingFlag = await Flag.findOne({
      reporterId: req.user._id,
      targetType,
      targetId
    });
    
    if (existingFlag) {
      return res.status(400).json({
        success: false,
        error: 'You have already reported this item'
      });
    }
    
    // Determine priority based on reason
    let priority = 'medium';
    if (['harassment', 'offensive_language', 'inappropriate_content'].includes(reason)) {
      priority = 'high';
    } else if (['spam', 'fake_listing'].includes(reason)) {
      priority = 'medium';
    } else {
      priority = 'low';
    }
    
    const flag = new Flag({
      reporterId: req.user._id,
      targetType,
      targetId,
      reason,
      description,
      priority,
      status: 'pending'
    });
    
    await flag.save();
    
    logger.info(`Flag created: ${targetType} ${targetId} by user ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: flag
    });
  } catch (error) {
    logger.error('Create flag error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while submitting report'
    });
  }
  }
);

// @route   GET /api/flags
// @desc    Get all flags (for moderators and admins)
// @access  Private (Moderators and Admins only)
router.get('/', authenticate, authorize('moderator', 'admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { status, priority, targetType, moderatorId } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (targetType) {
      query.targetType = targetType;
    }
    
    if (moderatorId) {
      query.moderatorId = moderatorId;
    }
    
    const flags = await Flag.find(query)
      .populate('reporterId', 'name email')
      .populate('moderatorId', 'name email')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Flag.countDocuments(query);
    
    res.json({
      success: true,
      data: flags,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get flags error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching flags'
    });
  }
});

// @route   GET /api/flags/:id
// @desc    Get single flag with target details
// @access  Private (Moderators and Admins only)
router.get(
  '/:id',
  authenticate,
  authorize('moderator', 'admin'),
  ...validateObjectId('id'),
  async (req, res) => {
  try {
    const flag = await Flag.findById(req.params.id)
      .populate('reporterId', 'name email')
      .populate('moderatorId', 'name email');
    
    if (!flag) {
      return res.status(404).json({
        success: false,
        error: 'Flag not found'
      });
    }
    
    // Get target details
    let target;
    switch (flag.targetType) {
      case 'product':
        target = await Product.findById(flag.targetId).populate('storeId', 'name');
        break;
      case 'store':
        target = await Store.findById(flag.targetId).populate('ownerId', 'name email');
        break;
      case 'review':
        target = await Review.findById(flag.targetId).populate('reviewerId', 'name email');
        break;
      case 'user':
        target = await User.findById(flag.targetId).select('-passwordHash');
        break;
    }
    
    res.json({
      success: true,
      data: {
        flag,
        target
      }
    });
  } catch (error) {
    logger.error('Get flag error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching flag'
    });
  }
  }
);

// @route   PUT /api/flags/:id/review
// @desc    Update flag status (for moderators and admins)
// @access  Private (Moderators and Admins only)
router.put(
  '/:id/review',
  authenticate,
  authorize('moderator', 'admin'),
  ...validateObjectId('id'),
  ...validateFlagReview,
  async (req, res) => {
  try {
    const { status, resolution, moderatorNotes } = req.body;
    
    const flag = await Flag.findById(req.params.id);
    if (!flag) {
      return res.status(404).json({
        success: false,
        error: 'Flag not found'
      });
    }
    
    // Update flag
    flag.status = status || flag.status;
    flag.resolution = resolution || flag.resolution;
    flag.moderatorNotes = moderatorNotes || flag.moderatorNotes;
    flag.moderatorId = req.user._id;
    flag.updatedAt = new Date();
    
    if (status === 'resolved') {
      flag.resolvedAt = new Date();
    }
    
    await flag.save();
    
    // Apply resolution if specified
    if (resolution && status === 'resolved') {
      await applyResolution(flag, resolution);
    }
    
    logger.info(`Flag ${flag._id} updated by moderator ${req.user.email}: ${status} - ${resolution}`);
    
    res.json({
      success: true,
      message: 'Flag updated successfully',
      data: flag
    });
  } catch (error) {
    logger.error('Update flag error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating flag'
    });
  }
  }
);

// @route   DELETE /api/flags/:id
// @desc    Delete a flag
// @access  Private (Admins only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  ...validateObjectId('id'),
  async (req, res) => {
  try {
    const flag = await Flag.findById(req.params.id);
    if (!flag) {
      return res.status(404).json({
        success: false,
        error: 'Flag not found'
      });
    }
    
    await Flag.findByIdAndDelete(req.params.id);
    
    logger.info(`Flag ${flag._id} deleted by admin ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Flag deleted successfully'
    });
  } catch (error) {
    logger.error('Delete flag error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting flag'
    });
  }
  }
);

// Helper function to apply resolution
async function applyResolution(flag, resolution) {
  try {
    switch (resolution) {
      case 'content_removed':
        if (flag.targetType === 'product') {
          await Product.findByIdAndUpdate(flag.targetId, { isActive: false });
        } else if (flag.targetType === 'store') {
          await Store.findByIdAndUpdate(flag.targetId, { isActive: false });
        } else if (flag.targetType === 'review') {
          await Review.findByIdAndUpdate(flag.targetId, { isApproved: false });
        }
        break;
        
      case 'account_suspended':
        if (flag.targetType === 'user') {
          await User.findByIdAndUpdate(flag.targetId, { isActive: false });
        } else if (flag.targetType === 'store') {
          const store = await Store.findById(flag.targetId);
          if (store) {
            await User.findByIdAndUpdate(store.ownerId, { isActive: false });
          }
        }
        break;
        
      case 'account_banned':
        if (flag.targetType === 'user') {
          await User.findByIdAndUpdate(flag.targetId, { isActive: false });
        } else if (flag.targetType === 'store') {
          const store = await Store.findById(flag.targetId);
          if (store) {
            await User.findByIdAndUpdate(store.ownerId, { isActive: false });
            await Store.findByIdAndUpdate(flag.targetId, { isActive: false });
          }
        }
        break;
        
      case 'warning_issued':
        // In a real application, you might send an email or notification
        logger.info(`Warning issued for ${flag.targetType} ${flag.targetId}`);
        break;
        
      case 'no_action':
      default:
        // No action needed
        break;
    }
  } catch (error) {
    logger.error('Apply resolution error:', error);
    throw error;
  }
}

module.exports = router;