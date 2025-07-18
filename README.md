# Afghanistan Marketplace

A mobile-first marketplace application connecting users across Afghanistan with local merchants. Built with React Native, Express.js, and MongoDB.

## Features

- 🛍️ Product and store discovery
- 🔍 Advanced search and filtering
- 💬 In-app messaging between shoppers and merchants
- 🌍 Multi-language support (English, Dari, Pashto)
- ⭐ Reviews and ratings system
- 🚩 Content moderation tools
- 📱 Cross-platform (iOS, Android, Web)

## Tech Stack

- **Frontend**: React Native with Expo, React Native Web
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Redis for caching
- **Authentication**: JWT-based
- **Infrastructure**: Docker, Docker Compose, Nginx

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd AfghanBazar
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start development environment:
   ```bash
   make dev
   ```

4. Access the application:
   - **App**: http://localhost:19006
   - **API**: http://localhost:4000
   - **MongoDB Admin**: http://localhost:8081
   - **Redis Admin**: http://localhost:8082

### Production Setup

1. Generate SSL certificates:
   ```bash
   make setup-ssl
   ```

2. Start production environment:
   ```bash
   make prod
   ```

3. Access the application:
   - **App**: https://localhost
   - **API**: https://localhost/api

## Project Structure

```
AfghanBazar/
├── app/                    # React Native app
│   ├── Dockerfile         # Production Dockerfile
│   └── Dockerfile.dev     # Development Dockerfile
├── api/                   # Express.js API
│   ├── models/           # MongoDB models
│   ├── Dockerfile        # Production Dockerfile
│   └── Dockerfile.dev    # Development Dockerfile
├── scripts/              # Database initialization scripts
├── docker-compose.yml    # Production compose file
├── docker-compose.dev.yml # Development compose file
├── nginx.conf           # Nginx configuration
├── Makefile            # Common commands
└── README.md           # This file
```

## Data Models

### Core Models

- **User**: Authentication, profiles, and role management
- **Store**: Merchant store information and details
- **Product**: Product listings with categories and pricing
- **Category**: Hierarchical category system with multilingual support
- **Review**: Rating and review system for products and stores
- **ChatMessage**: In-app messaging between users and merchants
- **Flag**: Content moderation and reporting system
- **Favorite**: User favorites for products and stores
- **ViewHistory**: User browsing history tracking

### Key Features

- **Multilingual Support**: All content supports English, Dari, and Pashto
- **Role-based Access**: Shopper, Merchant, Moderator, and Admin roles
- **Advanced Search**: Full-text search with indexing
- **Caching**: Redis integration for performance optimization
- **Security**: JWT authentication, input validation, and rate limiting

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products with filtering |
| GET | `/api/products/:id` | Get product details |
| GET | `/api/stores` | List stores with filtering |
| GET | `/api/stores/:id` | Get store details |
| GET | `/api/categories` | List all categories |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User authentication |
| POST | `/api/flags` | Report content |
| GET | `/api/chat/:storeId` | Get chat messages |
| POST | `/api/chat/:storeId` | Send chat message |

## Development Commands

```bash
# Start development environment
make dev

# View logs
make dev-logs

# Stop development environment
make dev-down

# Clean development environment
make dev-clean

# Access container shells
make shell-api
make shell-app
make shell-mongo
make shell-redis

# Health check
make health-check
```

## Production Commands

```bash
# Start production environment
make prod

# View logs
make prod-logs

# Stop production environment
make prod-down

# Clean production environment
make prod-clean

# Database backup
make db-backup

# Database restore
make db-restore BACKUP_DIR=20231201_120000
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

- `NODE_ENV`: Environment (development/production)
- `MONGO_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `CORS_ORIGIN`: Allowed CORS origins

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.