const express = require('express');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validateReview, validatePagination } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/reviews
// @desc    Get reviews for a product or store
// @access  Public
router.get('/', validatePagination, optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { targetType, targetId, rating } = req.query;
    
    let query = { isApproved: true };
    
    if (targetType && targetId) {
      query.targetType = targetType;
      query.targetId = targetId;
    }
    
    if (rating) {
      query.rating = parseInt(rating);
    }
    
    const reviews = await Review.find(query)
      .populate('reviewerId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments(query);
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching reviews'
    });
  }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', authenticate, validateReview, async (req, res) => {
  try {
    const { targetType, targetId, rating, title, comment, images } = req.body;
    
    // Verify target exists
    let target;
    if (targetType === 'product') {
      target = await Product.findById(targetId);
    } else if (targetType === 'store') {
      target = await Store.findById(targetId);
    }
    
    if (!target || !target.isActive) {
      return res.status(404).json({
        success: false,
        error: `${targetType} not found`
      });
    }
    
    // Check if user has already reviewed this item
    const existingReview = await Review.findOne({
      reviewerId: req.user._id,
      targetType,
      targetId
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this item'
      });
    }
    
    const review = new Review({
      reviewerId: req.user._id,
      targetType,
      targetId,
      rating,
      title,
      comment,
      images
    });
    
    await review.save();
    
    // Update target rating
    await updateTargetRating(targetType, targetId);
    
    logger.info(`Review created for ${targetType} ${targetId} by user ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    logger.error('Create review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating review'
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private (Review owner only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Check ownership
    if (review.reviewerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this review'
      });
    }
    
    const { rating, title, comment, images } = req.body;
    
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;
    
    review.updatedAt = new Date();
    await review.save();
    
    // Update target rating
    await updateTargetRating(review.targetType, review.targetId);
    
    logger.info(`Review updated: ${review._id} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    logger.error('Update review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating review'
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private (Review owner or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Check ownership
    if (review.reviewerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this review'
      });
    }
    
    await Review.findByIdAndDelete(req.params.id);
    
    // Update target rating
    await updateTargetRating(review.targetType, review.targetId);
    
    logger.info(`Review deleted: ${review._id} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    logger.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting review'
    });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark a review as helpful
// @access  Private
router.post('/:id/helpful', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Increment helpful votes
    review.helpfulVotes += 1;
    await review.save();
    
    res.json({
      success: true,
      message: 'Review marked as helpful'
    });
  } catch (error) {
    logger.error('Mark review helpful error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while marking review as helpful'
    });
  }
});

// @route   GET /api/reviews/moderation
// @desc    Get reviews pending moderation
// @access  Private (Moderators and Admins only)
router.get('/moderation', authenticate, authorize('moderator', 'admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({ isApproved: false })
      .populate('reviewerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments({ isApproved: false });
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get reviews for moderation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching reviews for moderation'
    });
  }
});

// @route   PUT /api/reviews/:id/moderate
// @desc    Moderate a review (approve/reject)
// @access  Private (Moderators and Admins only)
router.put('/:id/moderate', authenticate, authorize('moderator', 'admin'), async (req, res) => {
  try {
    const { isApproved, moderatorNotes } = req.body;
    
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    review.isApproved = isApproved;
    review.moderatorId = req.user._id;
    review.moderatorNotes = moderatorNotes;
    review.updatedAt = new Date();
    
    await review.save();
    
    // Update target rating if approved
    if (isApproved) {
      await updateTargetRating(review.targetType, review.targetId);
    }
    
    logger.info(`Review ${review._id} moderated by ${req.user.email}: ${isApproved ? 'approved' : 'rejected'}`);
    
    res.json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: review
    });
  } catch (error) {
    logger.error('Moderate review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while moderating review'
    });
  }
});

// Helper function to update target rating
async function updateTargetRating(targetType, targetId) {
  try {
    const reviews = await Review.find({
      targetType,
      targetId,
      isApproved: true
    });
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    const Model = targetType === 'product' ? Product : Store;
    await Model.findByIdAndUpdate(targetId, {
      'rating.average': Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      'rating.count': totalReviews
    });
  } catch (error) {
    logger.error('Update target rating error:', error);
  }
}

module.exports = router;