const express = require('express');
const Favorite = require('../models/Favorite');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { validatePagination } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/favorites
// @desc    Get user's favorites
// @access  Private
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { targetType } = req.query;
    
    let query = { userId: req.user._id };
    
    if (targetType) {
      query.targetType = targetType;
    }
    
    const favorites = await Favorite.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Populate the target objects
    const populatedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        let target;
        if (favorite.targetType === 'product') {
          target = await Product.findById(favorite.targetId)
            .populate('storeId', 'name city address');
        } else if (favorite.targetType === 'store') {
          target = await Store.findById(favorite.targetId);
        }
        
        return {
          _id: favorite._id,
          targetType: favorite.targetType,
          targetId: favorite.targetId,
          target,
          createdAt: favorite.createdAt
        };
      })
    );
    
    const total = await Favorite.countDocuments(query);
    
    res.json({
      success: true,
      data: populatedFavorites,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching favorites'
    });
  }
});

// @route   POST /api/favorites
// @desc    Add item to favorites
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { targetType, targetId } = req.body;
    
    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        error: 'Target type and target ID are required'
      });
    }
    
    if (!['product', 'store'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        error: 'Target type must be product or store'
      });
    }
    
    // Verify target exists
    let target;
    if (targetType === 'product') {
      target = await Product.findById(targetId);
    } else {
      target = await Store.findById(targetId);
    }
    
    if (!target || !target.isActive) {
      return res.status(404).json({
        success: false,
        error: `${targetType} not found`
      });
    }
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: req.user._id,
      targetType,
      targetId
    });
    
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        error: 'Item is already in favorites'
      });
    }
    
    const favorite = new Favorite({
      userId: req.user._id,
      targetType,
      targetId
    });
    
    await favorite.save();
    
    // Update favorite count on target
    if (targetType === 'product') {
      await Product.findByIdAndUpdate(targetId, { $inc: { favorites: 1 } });
    }
    
    logger.info(`Item added to favorites: ${targetType} ${targetId} by user ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Item added to favorites',
      data: favorite
    });
  } catch (error) {
    logger.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while adding to favorites'
    });
  }
});

// @route   DELETE /api/favorites/:id
// @desc    Remove item from favorites
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const favorite = await Favorite.findById(req.params.id);
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: 'Favorite not found'
      });
    }
    
    // Check ownership
    if (favorite.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to remove this favorite'
      });
    }
    
    await Favorite.findByIdAndDelete(req.params.id);
    
    // Update favorite count on target
    if (favorite.targetType === 'product') {
      await Product.findByIdAndUpdate(favorite.targetId, { $inc: { favorites: -1 } });
    }
    
    logger.info(`Item removed from favorites: ${favorite.targetType} ${favorite.targetId} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Item removed from favorites'
    });
  } catch (error) {
    logger.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while removing from favorites'
    });
  }
});

// @route   DELETE /api/favorites/remove
// @desc    Remove item from favorites by targetType and targetId
// @access  Private
router.delete('/remove', async (req, res) => {
  try {
    const { targetType, targetId } = req.body;
    
    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        error: 'Target type and target ID are required'
      });
    }
    
    const favorite = await Favorite.findOne({
      userId: req.user._id,
      targetType,
      targetId
    });
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in favorites'
      });
    }
    
    await Favorite.findByIdAndDelete(favorite._id);
    
    // Update favorite count on target
    if (targetType === 'product') {
      await Product.findByIdAndUpdate(targetId, { $inc: { favorites: -1 } });
    }
    
    logger.info(`Item removed from favorites: ${targetType} ${targetId} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Item removed from favorites'
    });
  } catch (error) {
    logger.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while removing from favorites'
    });
  }
});

// @route   GET /api/favorites/check
// @desc    Check if item is in favorites
// @access  Private
router.get('/check', async (req, res) => {
  try {
    const { targetType, targetId } = req.query;
    
    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        error: 'Target type and target ID are required'
      });
    }
    
    const favorite = await Favorite.findOne({
      userId: req.user._id,
      targetType,
      targetId
    });
    
    res.json({
      success: true,
      isFavorite: !!favorite,
      favoriteId: favorite?._id
    });
  } catch (error) {
    logger.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while checking favorite status'
    });
  }
});

module.exports = router;