module.exports = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/afg_marketplace',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:19006',
  
  // Upload configuration
  upload: {
    maxSize: process.env.UPLOAD_MAX_SIZE || 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    uploadDir: process.env.UPLOAD_DIR || './uploads'
  },
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100
  },
  
  // Security
  bcryptRounds: process.env.BCRYPT_ROUNDS || 12,
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },
  
  // Languages
  supportedLanguages: ['en', 'fa', 'ps'],
  defaultLanguage: 'en'
};