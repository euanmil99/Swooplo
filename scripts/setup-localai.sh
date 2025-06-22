#!/bin/bash

# LocalAI Setup Script for Social Affiliate Pro
# This script sets up LocalAI with optimized models for social media content generation

set -e

echo "🚀 Setting up LocalAI for Social Affiliate Pro..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker Compose is installed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p localai-config
    mkdir -p models
    mkdir -p uploads
    mkdir -p backups
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    mkdir -p ssl
    
    print_success "Directories created"
}

# Download and configure LocalAI models
setup_models() {
    print_status "Setting up LocalAI models..."
    
    # Create models directory if it doesn't exist
    mkdir -p models
    
    # Download essential models for social media content generation
    print_status "Downloading text generation model (llama-3.2-1b-instruct)..."
    docker run --rm -v $(pwd)/models:/models localai/localai:latest-aio-gpu \
        local-ai run llama-3.2-1b-instruct:q4_k_m
    
    print_status "Downloading vision model (llava-v1.5-7b)..."
    docker run --rm -v $(pwd)/models:/models localai/localai:latest-aio-gpu \
        local-ai run llava-v1.5-7b:q4_k_m
    
    print_status "Downloading image generation model (stablediffusion)..."
    docker run --rm -v $(pwd)/models:/models localai/localai:latest-aio-gpu \
        local-ai run stablediffusion
    
    print_status "Downloading audio transcription model (whisper)..."
    docker run --rm -v $(pwd)/models:/models localai/localai:latest-aio-gpu \
        local-ai run whisper-1
    
    print_status "Downloading text-to-speech model (piper)..."
    docker run --rm -v $(pwd)/models:/models localai/localai:latest-aio-gpu \
        local-ai run piper-tts
    
    print_success "Models downloaded successfully"
}

# Create environment file
create_env_file() {
    print_status "Creating environment file..."
    
    cat > .env << EOF
# Database Configuration
POSTGRES_PASSWORD=socialpilot123
DATABASE_URL=postgresql://socialpilot:socialpilot123@localhost:5432/socialpilot

# Redis Configuration
REDIS_URL=redis://localhost:6379

# LocalAI Configuration
LOCALAI_URL=http://localhost:8080
LOCALAI_API_KEY=

# Session and Security
SESSION_SECRET=your-super-secret-key-change-in-production
JWT_SECRET=your-jwt-secret-key-change-in-production

# Environment
NODE_ENV=development

# Monitoring
GRAFANA_PASSWORD=admin123

# Social Media API Keys (Add your own)
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_TOKEN_SECRET=

INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=

LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_ACCESS_TOKEN=

TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_ACCESS_TOKEN=

# Affiliate Network API Keys
AMAZON_ASSOCIATES_TAG=
AMAZON_ACCESS_KEY_ID=
AMAZON_SECRET_ACCESS_KEY=

SHAREASALE_PUBLISHER_ID=
SHAREASALE_API_TOKEN=

COMMISSION_JUNCTION_API_KEY=
COMMISSION_JUNCTION_WEBSITE_ID=

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket
WS_HEARTBEAT_INTERVAL=30000
WS_HEARTBEAT_TIMEOUT=5000
EOF
    
    print_success "Environment file created"
}

# Create Nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration..."
    
    cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }
    
    upstream backend {
        server backend:5000;
    }
    
    upstream localai {
        server localai:8080;
    }
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=ai:10m rate=5r/s;
    
    server {
        listen 80;
        server_name localhost;
        
        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Backend API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # LocalAI API
        location /ai/ {
            limit_req zone=ai burst=10 nodelay;
            proxy_pass http://localai/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Increase timeout for AI requests
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }
        
        # WebSocket support
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Health check
        location /health {
            proxy_pass http://backend/api/health;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF
    
    print_success "Nginx configuration created"
}

# Create Prometheus configuration
create_prometheus_config() {
    print_status "Creating Prometheus configuration..."
    
    mkdir -p monitoring
    
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'socialpilot-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'localai'
    static_configs:
      - targets: ['localai:8080']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s
EOF
    
    print_success "Prometheus configuration created"
}

# Create Grafana datasource configuration
create_grafana_datasources() {
    print_status "Creating Grafana datasource configuration..."
    
    mkdir -p monitoring/grafana/datasources
    
    cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF
    
    print_success "Grafana datasource configuration created"
}

# Create backup script
create_backup_script() {
    print_status "Creating backup script..."
    
    mkdir -p scripts
    
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# Backup script for Social Affiliate Pro
# This script creates daily backups of the database and uploads

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="database_backup_${DATE}.sql"
UPLOADS_BACKUP_FILE="uploads_backup_${DATE}.tar.gz"

echo "Starting backup at $(date)"

# Database backup
echo "Creating database backup..."
pg_dump -h postgres -U socialpilot -d socialpilot > "${BACKUP_DIR}/${DB_BACKUP_FILE}"

# Uploads backup
echo "Creating uploads backup..."
tar -czf "${BACKUP_DIR}/${UPLOADS_BACKUP_FILE}" -C /app uploads/

# Keep only last 7 days of backups
find "${BACKUP_DIR}" -name "database_backup_*.sql" -mtime +7 -delete
find "${BACKUP_DIR}" -name "uploads_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed at $(date)"
echo "Files created:"
echo "  - ${DB_BACKUP_FILE}"
echo "  - ${UPLOADS_BACKUP_FILE}"
EOF
    
    chmod +x scripts/backup.sh
    print_success "Backup script created"
}

# Main setup function
main() {
    print_status "Starting LocalAI setup for Social Affiliate Pro..."
    
    # Check prerequisites
    check_docker
    check_docker_compose
    
    # Create directories and files
    create_directories
    create_env_file
    create_nginx_config
    create_prometheus_config
    create_grafana_datasources
    create_backup_script
    
    # Setup models (optional - can be done later)
    read -p "Do you want to download LocalAI models now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_models
    else
        print_warning "Models will need to be downloaded manually or through the LocalAI interface"
    fi
    
    print_success "LocalAI setup completed!"
    echo
    print_status "Next steps:"
    echo "1. Edit .env file with your API keys and configuration"
    echo "2. Run 'docker-compose up -d' to start all services"
    echo "3. Access the application at http://localhost"
    echo "4. Access LocalAI at http://localhost:8080"
    echo "5. Access Grafana at http://localhost:3001 (admin/admin123)"
    echo "6. Access Prometheus at http://localhost:9090"
    echo
    print_warning "Remember to change default passwords in production!"
}

# Run main function
main "$@" 