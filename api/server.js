require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const redis = require('redis');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:19006",
    methods: ["GET", "POST"]
  }
});

// Redis client
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL
  });
  redisClient.on('error', (err) => {
    logger.error('Redis client error:', err);
  });
  redisClient.connect();
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:19006",
  credentials: true
}));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       '200':
 *         description: Returns API status
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/chat', authenticate, require('./routes/chat'));
app.use('/api/flags', authenticate, require('./routes/flags'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/favorites', authenticate, require('./routes/favorites'));
app.use('/api/users', authenticate, require('./routes/users'));
app.use('/api/admin', authenticate, require('./routes/admin'));
app.use('/api/upload', authenticate, require('./routes/upload'));
app.use('/api/analytics', authenticate, require('./routes/analytics'));

// Socket.io for real-time chat
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  logger.info(`User ${socket.userId} connected`);

  socket.on('join-chat', (storeId) => {
    socket.join(`chat-${storeId}`);
    logger.info(`User ${socket.userId} joined chat for store ${storeId}`);
  });

  socket.on('leave-chat', (storeId) => {
    socket.leave(`chat-${storeId}`);
    logger.info(`User ${socket.userId} left chat for store ${storeId}`);
  });

  socket.on('send-message', async (data) => {
    try {
      const { storeId, message } = data;
      const ChatMessage = require('./models/ChatMessage');
      
      const newMessage = new ChatMessage({
        storeId,
        senderId: socket.userId,
        message,
        timestamp: new Date()
      });
      
      await newMessage.save();
      
      // Broadcast to all users in the chat room
      io.to(`chat-${storeId}`).emit('new-message', {
        _id: newMessage._id,
        storeId,
        senderId: socket.userId,
        message,
        timestamp: newMessage.timestamp
      });
      
      logger.info(`Message sent in chat ${storeId} by user ${socket.userId}`);
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('disconnect', () => {
    logger.info(`User ${socket.userId} disconnected`);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/afg_marketplace', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info('Connected to MongoDB');
})
.catch((error) => {
  logger.error('MongoDB connection error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    mongoose.connection.close(() => {
      if (redisClient) {
        redisClient.quit();
      }
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    mongoose.connection.close(() => {
      if (redisClient) {
        redisClient.quit();
      }
      process.exit(0);
    });
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = { app, io, redisClient };