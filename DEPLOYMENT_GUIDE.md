# Swooplo.com Deployment Guide

## Overview

This guide will help you deploy the Swooplo application to production under the domain `swooplo.com`. The deployment uses Docker containers with Nginx as a reverse proxy and includes SSL certificates via Let's Encrypt.

## 🚀 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: Minimum 20GB available space
- **CPU**: 2+ cores
- **Network**: Public IP address with ports 80 and 443 open

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Git
- curl

### Domain Configuration
- Domain name: `swooplo.com`
- DNS records pointing to your server IP
- Subdomain: `api.swooplo.com` (optional, for API separation)

## 📋 Pre-Deployment Checklist

- [ ] Server meets minimum requirements
- [ ] Docker and Docker Compose installed
- [ ] Domain DNS configured
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] SSH access to server
- [ ] Environment variables prepared

## 🔧 Installation Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-username/swooplo.git
cd swooplo

# Make deployment script executable
chmod +x scripts/deploy.sh
```

### 3. Environment Configuration

```bash
# Copy environment template
cp env.production.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**

```env
# Database
POSTGRES_PASSWORD=your_secure_password_here

# Security
JWT_SECRET=your_long_random_jwt_secret_here
SESSION_SECRET=your_long_random_session_secret_here

# URLs
CLIENT_URL=https://swooplo.com
BASE_URL=https://swooplo.com

# SSL Certificate
CERTBOT_EMAIL=your_email@domain.com

# Optional: API Keys (configure as needed)
STRIPE_SECRET_KEY=sk_live_...
CLICKBANK_API_KEY=your_clickbank_key
AMAZON_ASSOCIATES_TAG=your_amazon_tag
LOCALAI_API_KEY=your_localai_key
SLACK_BOT_TOKEN=xoxb_...
```

### 4. Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 64

# Generate session secret
openssl rand -base64 64

# Generate database password
openssl rand -base64 32
```

### 5. Initial Deployment

```bash
# Run initial deployment
npm run deploy

# Or manually
bash scripts/deploy.sh deploy
```

### 6. SSL Certificate Setup

```bash
# Setup SSL certificates
npm run deploy:ssl

# Or manually
bash scripts/deploy.sh ssl
```

## 🔍 Verification

### Check Service Status

```bash
# View deployment status
npm run deploy:status

# Check container logs
npm run deploy:logs
```

### Test Endpoints

```bash
# Test main site
curl -I https://swooplo.com

# Test API
curl -I https://api.swooplo.com/health

# Test SSL certificate
curl -I https://swooplo.com
```

## 📊 Monitoring

### Health Checks

The application includes built-in health checks:

- **Main site**: `https://swooplo.com/health`
- **API**: `https://api.swooplo.com/health`
- **Database**: Automatic health checks in Docker Compose

### Logs

```bash
# View all logs
npm run deploy:logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Performance Monitoring

- **Nginx logs**: `/logs/nginx/`
- **Application logs**: `/logs/app.log`
- **Database logs**: Docker container logs

## 🔄 Maintenance

### Database Backups

```bash
# Create backup
npm run deploy:backup

# Restore from backup
bash scripts/deploy.sh restore backups/swooplo_backup_20231201_120000.sql
```

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
npm run deploy:restart
```

### SSL Certificate Renewal

SSL certificates auto-renew via Certbot, but you can manually renew:

```bash
# Renew certificates
docker-compose -f docker-compose.prod.yml run --rm certbot renew

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🛠 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Stop conflicting services
sudo systemctl stop apache2
sudo systemctl stop nginx
```

#### 2. SSL Certificate Issues
```bash
# Check certificate status
docker-compose -f docker-compose.prod.yml run --rm certbot certificates

# Force certificate renewal
docker-compose -f docker-compose.prod.yml run --rm certbot renew --force-renewal
```

#### 3. Database Connection Issues
```bash
# Check database container
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U swooplo_user -d swooplo
```

#### 4. Memory Issues
```bash
# Check memory usage
docker stats

# Restart services
npm run deploy:restart
```

### Debug Mode

```bash
# Run in debug mode
docker-compose -f docker-compose.prod.yml up --build

# Check specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 🔒 Security

### Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### SSL/TLS Configuration

The nginx configuration includes:
- TLS 1.2 and 1.3 only
- Strong cipher suites
- HSTS headers
- Security headers

### Rate Limiting

- API endpoints: 10 requests per 15 minutes
- Login endpoints: 1 request per 15 minutes
- Email scraping: 10 requests per 15 minutes

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale backend services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale with load balancer
# Add nginx load balancer configuration
```

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Add caching layers

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /path/to/swooplo
            git pull origin main
            npm run deploy:restart
```

## 📞 Support

### Useful Commands

```bash
# Quick status check
npm run deploy:status

# View recent logs
npm run deploy:logs

# Stop all services
npm run deploy:stop

# Restart all services
npm run deploy:restart

# Backup database
npm run deploy:backup
```

### Emergency Procedures

1. **Service Down**: `npm run deploy:restart`
2. **Database Issues**: Check logs and restore from backup
3. **SSL Issues**: Renew certificates manually
4. **Performance Issues**: Scale services or optimize

## 🎯 Post-Deployment Checklist

- [ ] All services running (`npm run deploy:status`)
- [ ] SSL certificates valid
- [ ] Health checks passing
- [ ] Database migrations completed
- [ ] Email functionality tested
- [ ] Affiliate links working
- [ ] Email scraper functional
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Documentation updated

## 🚀 Go Live!

Your Swooplo application is now deployed at:
- **Main site**: https://swooplo.com
- **API**: https://api.swooplo.com
- **Health check**: https://swooplo.com/health

The application includes:
- ✅ AI-powered social media management
- ✅ Affiliate marketing tools
- ✅ Email scraping functionality
- ✅ ClickBank integration
- ✅ Amazon Associates integration
- ✅ LocalAI integration
- ✅ Slack integration
- ✅ Comprehensive analytics
- ✅ Secure deployment with SSL
- ✅ Automated backups
- ✅ Monitoring and logging

Welcome to Swooplo! 🎉 