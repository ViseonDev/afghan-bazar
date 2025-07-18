# Afghanistan Marketplace - Deployment Guide

This guide covers the complete deployment process for the Afghanistan Marketplace application.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git
- SSL certificates (for production)

### Development Deployment
```bash
# Clone and setup
git clone <repository-url>
cd AfghanBazar
cp .env.example .env

# Start development environment
make dev

# Access services
# - App: http://localhost:19006
# - API: http://localhost:4000
# - MongoDB: mongodb://localhost:27017
```

### Production Deployment
```bash
# Using deployment script
./deploy.sh deploy

# Manual deployment
docker-compose up --build -d
```

## 📋 Environment Configuration

### Required Environment Variables
```bash
# Core Configuration
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-domain.com

# Database Configuration
MONGO_URI=mongodb://username:password@localhost:27017/afg_marketplace
REDIS_URL=redis://localhost:6379

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp
```

## 🐳 Docker Services

### Service Overview
| Service | Port | Description |
|---------|------|-------------|
| `app` | 19006 | React Native/Expo application |
| `api` | 4000 | Node.js API server |
| `mongodb` | 27017 | MongoDB database |
| `redis` | 6379 | Redis cache |
| `nginx` | 80/443 | Reverse proxy and load balancer |

### Service Dependencies
```
nginx → api → mongodb, redis
app → api
```

## 🔒 Security Configuration

### SSL/TLS Setup
```bash
# Generate self-signed certificates (development)
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes

# Production certificates
# Place your certificates in the ssl/ directory:
# - ssl/cert.pem
# - ssl/key.pem
```

### Security Features
- JWT authentication with secure tokens
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS protection
- Security headers with Helmet.js

## 📊 Monitoring & Health Checks

### Health Check Endpoints
```bash
# API Health
curl http://localhost:4000/health

# Service Status
./deploy.sh status

# View Logs
./deploy.sh logs
```

### Monitoring Services
- **API Health**: `GET /health`
- **Database Status**: MongoDB connection monitoring
- **Cache Status**: Redis connection monitoring
- **Application Logs**: Winston logging with file rotation

## 🔄 Backup & Recovery

### Database Backup
```bash
# Create backup
./deploy.sh backup

# Manual MongoDB backup
docker-compose exec mongodb mongodump --out /tmp/backup

# Manual Redis backup
docker-compose exec redis redis-cli BGSAVE
```

### Disaster Recovery
```bash
# Rollback deployment
./deploy.sh rollback [backup_directory]

# Restore from backup
docker-compose exec mongodb mongorestore /tmp/backup
```

## 🔧 Maintenance

### Regular Maintenance Tasks
1. **Database Optimization**
   ```bash
   # Rebuild indexes
   docker-compose exec mongodb mongo afg_marketplace --eval "db.products.reIndex()"
   
   # Clean up logs
   docker-compose exec mongodb mongo afg_marketplace --eval "db.logs.remove({timestamp: {$lt: new Date(Date.now() - 30*24*60*60*1000)}})"
   ```

2. **Cache Management**
   ```bash
   # Clear Redis cache
   docker-compose exec redis redis-cli FLUSHALL
   
   # View cache statistics
   docker-compose exec redis redis-cli INFO
   ```

3. **Log Management**
   ```bash
   # View API logs
   docker-compose logs -f api
   
   # Clean up old logs
   docker-compose exec api find /app/logs -name "*.log" -mtime +7 -delete
   ```

### Performance Optimization
1. **Database Indexing**
   - Product search indexes
   - User email unique index
   - Store location geospatial index

2. **Redis Caching**
   - Product catalog caching
   - User session management
   - API response caching

3. **Image Optimization**
   - Sharp image processing
   - Multiple image sizes
   - Lazy loading implementation

## 🚨 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check Docker status
docker-compose ps

# View service logs
docker-compose logs [service_name]

# Restart services
docker-compose restart [service_name]
```

#### Database Connection Issues
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Test connection
docker-compose exec api npm run test:db

# Rebuild database
docker-compose down -v
docker-compose up -d
```

#### Memory Issues
```bash
# Check resource usage
docker stats

# Increase memory limits in docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Regenerate certificates
rm ssl/*
./deploy.sh deploy
```

## 🔄 Scaling

### Horizontal Scaling
```bash
# Scale API service
docker-compose up --scale api=3

# Load balancer configuration
# Update nginx.conf for multiple API instances
```

### Vertical Scaling
```bash
# Increase service resources
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
```

## 📈 Performance Monitoring

### Key Metrics to Monitor
- API response times
- Database query performance
- Memory usage
- CPU utilization
- Disk space usage
- Network bandwidth

### Monitoring Tools
- Docker stats for container metrics
- MongoDB compass for database monitoring
- Redis CLI for cache monitoring
- Nginx access logs for web traffic

## 🛠️ Development vs Production

### Development Environment
- Hot reloading enabled
- Debug logging
- Development database
- Mock email service
- Self-signed certificates

### Production Environment
- Optimized builds
- Production logging
- Secure database configuration
- Real email service
- Valid SSL certificates
- Performance monitoring

## 📞 Support

For deployment issues:
1. Check service logs first
2. Review this deployment guide
3. Check environment variables
4. Verify network connectivity
5. Contact support team

### Emergency Procedures
1. **Service Outage**
   ```bash
   ./deploy.sh stop
   ./deploy.sh deploy
   ```

2. **Database Corruption**
   ```bash
   ./deploy.sh rollback [latest_backup]
   ```

3. **Security Incident**
   ```bash
   ./deploy.sh stop
   # Review logs, update security configs
   ./deploy.sh deploy
   ```

---

**Note**: Always test deployment procedures in a staging environment before applying to production.