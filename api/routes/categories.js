const express = require('express');
const Category = require('../models/Category');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    
    const categories = await Category.find({ isActive: true })
      .populate('subcategories', 'name slug')
      .sort({ sortOrder: 1, 'name.en': 1 });
    
    // Transform categories based on language
    const transformedCategories = categories.map(category => ({
      _id: category._id,
      name: category.name[language] || category.name.en,
      originalName: category.name,
      slug: category.slug,
      description: category.description[language] || category.description.en,
      icon: category.icon,
      image: category.image,
      parentCategory: category.parentCategory,
      subcategories: category.subcategories,
      isFeatured: category.isFeatured,
      productCount: category.productCount,
      sortOrder: category.sortOrder
    }));
    
    res.json({
      success: true,
      data: transformedCategories
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching categories'
    });
  }
});

// @route   GET /api/categories/:slug
// @desc    Get category by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    
    const category = await Category.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    }).populate('subcategories', 'name slug');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    const transformedCategory = {
      _id: category._id,
      name: category.name[language] || category.name.en,
      originalName: category.name,
      slug: category.slug,
      description: category.description[language] || category.description.en,
      icon: category.icon,
      image: category.image,
      parentCategory: category.parentCategory,
      subcategories: category.subcategories,
      isFeatured: category.isFeatured,
      productCount: category.productCount,
      sortOrder: category.sortOrder
    };
    
    res.json({
      success: true,
      data: transformedCategory
    });
  } catch (error) {
    logger.error('Get category error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching category'
    });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      icon,
      image,
      parentCategory,
      isFeatured,
      sortOrder
    } = req.body;
    
    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category with this slug already exists'
      });
    }
    
    const category = new Category({
      name,
      slug,
      description,
      icon,
      image,
      parentCategory,
      isFeatured,
      sortOrder
    });
    
    await category.save();
    
    // Update parent category's subcategories array
    if (parentCategory) {
      await Category.findByIdAndUpdate(
        parentCategory,
        { $push: { subcategories: category._id } }
      );
    }
    
    logger.info(`Category created: ${name.en} by user ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    logger.error('Create category error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating category'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        category[key] = req.body[key];
      }
    });
    
    category.updatedAt = new Date();
    await category.save();
    
    logger.info(`Category updated: ${category.name.en} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    logger.error('Update category error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating category'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Check if category has products
    const Product = require('../models/Product');
    const productCount = await Product.countDocuments({ 
      category: category.slug,
      isActive: true 
    });
    
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing products'
      });
    }
    
    // Soft delete by setting isActive to false
    category.isActive = false;
    category.updatedAt = new Date();
    await category.save();
    
    // Remove from parent category's subcategories array
    if (category.parentCategory) {
      await Category.findByIdAndUpdate(
        category.parentCategory,
        { $pull: { subcategories: category._id } }
      );
    }
    
    logger.info(`Category deleted: ${category.name.en} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting category'
    });
  }
});

// @route   GET /api/categories/featured
// @desc    Get featured categories
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    
    const categories = await Category.find({ 
      isActive: true,
      isFeatured: true 
    })
      .sort({ sortOrder: 1, 'name.en': 1 })
      .limit(10);
    
    const transformedCategories = categories.map(category => ({
      _id: category._id,
      name: category.name[language] || category.name.en,
      slug: category.slug,
      icon: category.icon,
      image: category.image,
      productCount: category.productCount
    }));
    
    res.json({
      success: true,
      data: transformedCategories
    });
  } catch (error) {
    logger.error('Get featured categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching featured categories'
    });
  }
});

module.exports = router;