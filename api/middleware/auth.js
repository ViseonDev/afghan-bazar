const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token is not valid'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account is disabled'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Token is not valid'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-passwordHash');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Token is invalid but we continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};