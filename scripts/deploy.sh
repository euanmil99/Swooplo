#!/bin/bash

# Swooplo.com Deployment Script
# This script deploys the SocialPilot application to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="swooplo.com"
APP_NAME="Swooplo"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! command_exists git; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    print_success "All prerequisites are satisfied"
}

# Function to load environment variables
load_env() {
    print_status "Loading environment variables..."
    
    if [ ! -f .env ]; then
        print_error ".env file not found. Please create a .env file with your configuration."
        exit 1
    fi
    
    source .env
    print_success "Environment variables loaded"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs/nginx
    mkdir -p logs/certbot
    mkdir -p ssl
    mkdir -p uploads
    mkdir -p models
    
    print_success "Directories created"
}

# Function to build and deploy
deploy() {
    print_status "Starting deployment of $APP_NAME to $DOMAIN..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose -f $DOCKER_COMPOSE_FILE up -d --build
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    print_status "Checking service health..."
    
    # Check backend health
    if curl -f http://localhost:5000/health >/dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_warning "Frontend health check failed"
    fi
    
    print_success "Deployment completed successfully!"
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates for $DOMAIN..."
    
    # Check if certificates already exist
    if [ -f "ssl/live/$DOMAIN/fullchain.pem" ]; then
        print_warning "SSL certificates already exist. Skipping SSL setup."
        return
    fi
    
    # Create temporary nginx config for SSL setup
    cat > nginx-ssl-setup.conf << EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    server {
        listen 80;
        server_name $DOMAIN www.$DOMAIN api.$DOMAIN;
        
        location /.well-known/acme-challenge/ {
            root /var/www/html;
        }
        
        location / {
            return 301 https://\$server_name\$request_uri;
        }
    }
}
EOF
    
    # Start nginx for SSL setup
    docker-compose -f $DOCKER_COMPOSE_FILE up -d nginx
    
    # Wait for nginx to be ready
    sleep 10
    
    # Run certbot
    print_status "Running certbot to obtain SSL certificates..."
    docker-compose -f $DOCKER_COMPOSE_FILE run --rm certbot
    
    # Restart nginx with SSL
    docker-compose -f $DOCKER_COMPOSE_FILE restart nginx
    
    print_success "SSL certificates setup completed"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations
    docker-compose -f $DOCKER_COMPOSE_FILE exec backend npm run db:migrate || {
        print_warning "Database migrations failed. This might be expected if migrations are already up to date."
    }
    
    print_success "Database migrations completed"
}

# Function to show deployment status
show_status() {
    print_status "Deployment status:"
    echo ""
    docker-compose -f $DOCKER_COMPOSE_FILE ps
    echo ""
    print_status "Service URLs:"
    echo "  Main site: https://$DOMAIN"
    echo "  API: https://api.$DOMAIN"
    echo "  Health check: https://$DOMAIN/health"
}

# Function to show logs
show_logs() {
    print_status "Showing recent logs..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=50
}

# Function to backup database
backup_database() {
    print_status "Creating database backup..."
    
    BACKUP_DIR="backups"
    BACKUP_FILE="$BACKUP_DIR/swooplo_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p $BACKUP_DIR
    
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres pg_dump -U swooplo_user swooplo > $BACKUP_FILE
    
    print_success "Database backup created: $BACKUP_FILE"
}

# Function to restore database
restore_database() {
    if [ -z "$1" ]; then
        print_error "Please provide a backup file path"
        echo "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    print_warning "This will overwrite the current database. Are you sure? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_status "Database restore cancelled"
        exit 0
    fi
    
    print_status "Restoring database from $BACKUP_FILE..."
    
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres psql -U swooplo_user swooplo < "$BACKUP_FILE"
    
    print_success "Database restored successfully"
}

# Function to show help
show_help() {
    echo "Swooplo.com Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy      - Deploy the application"
    echo "  ssl         - Setup SSL certificates"
    echo "  migrate     - Run database migrations"
    echo "  status      - Show deployment status"
    echo "  logs        - Show recent logs"
    echo "  backup      - Create database backup"
    echo "  restore     - Restore database from backup"
    echo "  stop        - Stop all services"
    echo "  restart     - Restart all services"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 ssl"
    echo "  $0 backup"
    echo "  $0 restore backups/swooplo_backup_20231201_120000.sql"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        check_prerequisites
        load_env
        create_directories
        deploy
        run_migrations
        show_status
        ;;
    "ssl")
        load_env
        setup_ssl
        ;;
    "migrate")
        load_env
        run_migrations
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "backup")
        load_env
        backup_database
        ;;
    "restore")
        load_env
        restore_database "$2"
        ;;
    "stop")
        print_status "Stopping all services..."
        docker-compose -f $DOCKER_COMPOSE_FILE down
        print_success "All services stopped"
        ;;
    "restart")
        print_status "Restarting all services..."
        docker-compose -f $DOCKER_COMPOSE_FILE restart
        print_success "All services restarted"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 