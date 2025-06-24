#!/bin/bash

# Deployment Checklist Script for SocialPilot
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}
print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}
print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Checking deployment status..."
npm run deploy:status || { print_error "Service status check failed"; exit 1; }

print_status "Checking SSL certificate..."
if ! openssl s_client -connect swooplo.com:443 </dev/null 2>/dev/null | openssl x509 -noout -dates; then
  print_error "SSL certificate check failed"; exit 1;
else
  print_success "SSL certificate is valid"
fi

print_status "Checking database migrations..."
npm run db:migrate || { print_error "Database migration check failed"; exit 1; }

print_status "Testing email functionality..."
node scripts/test-email.ts || { print_error "Email test failed"; exit 1; }

print_status "Testing affiliate links..."
node scripts/test-affiliate-links.ts || { print_error "Affiliate link test failed"; exit 1; }

print_status "All deployment checklist items passed!" 