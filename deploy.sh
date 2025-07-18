#!/bin/bash

# Afghanistan Marketplace Deployment Script
# This script handles production deployment of the Afghanistan Marketplace

set -e

echo "🇦🇫 Afghanistan Marketplace Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="afghanistan-marketplace"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
BACKUP_DIR="backups"
LOG_DIR="logs"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "This script should not be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env file not found. Please copy .env.example to .env and configure it."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "api/uploads"
    mkdir -p "ssl"
    
    log_success "Directories created"
}

# Generate SSL certificates for production
generate_ssl() {
    log_info "Generating SSL certificates..."
    
    if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
        log_warning "SSL certificates not found. Generating self-signed certificates..."
        
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
            -subj "/C=AF/ST=Kabul/L=Kabul/O=Afghanistan Marketplace/OU=IT Department/CN=localhost"
        
        log_success "SSL certificates generated"
    else
        log_info "SSL certificates already exist"
    fi
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    mkdir -p "$BACKUP_PATH"
    
    # MongoDB backup
    docker-compose exec -T mongodb mongodump --out /tmp/backup
    docker cp $(docker-compose ps -q mongodb):/tmp/backup "$BACKUP_PATH/mongo"
    
    # Redis backup
    docker-compose exec -T redis redis-cli BGSAVE
    docker cp $(docker-compose ps -q redis):/data/dump.rdb "$BACKUP_PATH/redis_dump.rdb"
    
    log_success "Database backup created: $BACKUP_PATH"
}

# Deploy application
deploy() {
    log_info "Starting deployment..."
    
    # Pull latest images
    log_info "Pulling latest images..."
    docker-compose pull
    
    # Build and start services
    log_info "Building and starting services..."
    docker-compose up --build -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_health
    
    log_success "Deployment completed successfully!"
}

# Check service health
check_health() {
    log_info "Checking service health..."
    
    # Check API health
    if curl -f http://localhost:4000/health > /dev/null 2>&1; then
        log_success "API service is healthy"
    else
        log_error "API service is not responding"
        return 1
    fi
    
    # Check MongoDB
    if docker-compose exec -T mongodb mongo --eval "db.adminCommand('ismaster')" > /dev/null 2>&1; then
        log_success "MongoDB is healthy"
    else
        log_error "MongoDB is not responding"
        return 1
    fi
    
    # Check Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis is healthy"
    else
        log_error "Redis is not responding"
        return 1
    fi
}

# Show deployment status
show_status() {
    log_info "Deployment Status:"
    echo "=================="
    
    docker-compose ps
    
    echo ""
    log_info "Service URLs:"
    echo "- API: http://localhost:4000"
    echo "- Health Check: http://localhost:4000/health"
    echo "- MongoDB: mongodb://localhost:27017"
    echo "- Redis: redis://localhost:6379"
    
    echo ""
    log_info "Logs:"
    echo "- API logs: docker-compose logs -f api"
    echo "- MongoDB logs: docker-compose logs -f mongodb"
    echo "- Redis logs: docker-compose logs -f redis"
    echo "- All logs: docker-compose logs -f"
}

# Rollback deployment
rollback() {
    log_warning "Rolling back deployment..."
    
    # Stop current services
    docker-compose down
    
    # Restore from backup if provided
    if [ -n "$1" ]; then
        log_info "Restoring from backup: $1"
        # Add restore logic here
    fi
    
    # Start services
    docker-compose up -d
    
    log_success "Rollback completed"
}

# Main deployment function
main() {
    case "$1" in
        "deploy")
            check_root
            check_prerequisites
            create_directories
            generate_ssl
            backup_database
            deploy
            show_status
            ;;
        "health")
            check_health
            ;;
        "status")
            show_status
            ;;
        "backup")
            backup_database
            ;;
        "rollback")
            rollback "$2"
            ;;
        "logs")
            docker-compose logs -f
            ;;
        "stop")
            log_info "Stopping services..."
            docker-compose down
            log_success "Services stopped"
            ;;
        "clean")
            log_warning "Cleaning up containers and volumes..."
            docker-compose down -v
            docker system prune -f
            log_success "Cleanup completed"
            ;;
        *)
            echo "Usage: $0 {deploy|health|status|backup|rollback|logs|stop|clean}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy the application"
            echo "  health   - Check service health"
            echo "  status   - Show deployment status"
            echo "  backup   - Create database backup"
            echo "  rollback - Rollback deployment"
            echo "  logs     - Show application logs"
            echo "  stop     - Stop all services"
            echo "  clean    - Clean up containers and volumes"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"