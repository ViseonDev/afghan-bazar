const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('language')
    .optional()
    .isIn(['en', 'fa', 'ps'])
    .withMessage('Language must be en, fa, or ps'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('storeId')
    .isMongoId()
    .withMessage('Valid store ID is required'),
  handleValidationErrors
];

const validateStore = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Store name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('address')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be between 10 and 200 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  handleValidationErrors
];

const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must be no more than 500 characters'),
  body('targetType')
    .isIn(['product', 'store'])
    .withMessage('Target type must be product or store'),
  body('targetId')
    .isMongoId()
    .withMessage('Valid target ID is required'),
  handleValidationErrors
];

const validateFlag = [
  body('targetType')
    .isIn(['product', 'store', 'review', 'user'])
    .withMessage('Target type must be product, store, review, or user'),
  body('targetId')
    .isMongoId()
    .withMessage('Valid target ID is required'),
  body('reason')
    .isIn([
      'inappropriate_content',
      'spam',
      'fake_listing',
      'offensive_language',
      'copyright_violation',
      'misleading_information',
      'harassment',
      'other'
    ])
    .withMessage('Please provide a valid reason'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be no more than 500 characters'),
  handleValidationErrors
];

const validateMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  param('storeId')
    .isMongoId()
    .withMessage('Valid store ID is required'),
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];

const validateFlagReview = [
  body('status')
    .optional()
    .isIn(['pending', 'under_review', 'resolved', 'dismissed'])
    .withMessage('Invalid status'),
  body('resolution')
    .optional()
    .isIn(['no_action', 'warning_issued', 'content_removed', 'account_suspended', 'account_banned'])
    .withMessage('Invalid resolution'),
  body('moderatorNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Moderator notes must be no more than 1000 characters'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProduct,
  validateStore,
  validateReview,
  validateFlag,
  validateMessage,
  validatePagination,
  validateObjectId,
  validateFlagReview,
  handleValidationErrors
};