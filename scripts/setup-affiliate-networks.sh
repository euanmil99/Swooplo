#!/bin/bash

# SocialPilot Affiliate Network Integration Setup Script
# This script sets up all affiliate networks with monitoring and error handling

echo "🚀 Setting up SocialPilot Affiliate Network Integration..."

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Install dependencies if needed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file..."
    cat > .env << EOF
# SocialPilot Environment Configuration

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/socialpilot"

# Security
ENCRYPTION_KEY="$(openssl rand -hex 32)"

# Amazon Associates
AMAZON_API_KEY=""
AMAZON_API_SECRET=""
AMAZON_TRACKING_ID=""

# ClickBank
CLICKBANK_API_KEY=""
CLICKBANK_API_SECRET=""

# Commission Junction
CJ_API_KEY=""
CJ_API_SECRET=""

# ShareASale
SHAREASALE_API_KEY=""
SHAREASALE_API_SECRET=""

# LocalAI
LOCALAI_URL="http://localhost:8080"
LOCALAI_API_KEY=""

# Base URL for affiliate links
BASE_URL="http://localhost:3000"

# Monitoring
MONITORING_INTERVAL_MS="300000"
ENABLE_MONITORING="true"

# Notifications
SLACK_WEBHOOK_URL=""
EMAIL_NOTIFICATIONS="false"
EOF
    print_success ".env file created"
    print_warning "Please update the .env file with your actual credentials"
else
    print_success ".env file already exists"
fi

# Create database tables if needed
print_status "Setting up database..."
npm run db:push
if [ $? -ne 0 ]; then
    print_error "Failed to set up database"
    exit 1
fi
print_success "Database setup complete"

# Test the setup
print_status "Testing affiliate network integration..."

# Create a test script
cat > test-integration.js << 'EOF'
const { networkIntegration } = require('./server/services/networkIntegration');

async function testIntegration() {
    try {
        console.log('🧪 Testing affiliate network integration...');
        
        // Test monitoring status
        const monitoringStatus = networkIntegration.getMonitoringStatus();
        console.log('📊 Monitoring status:', monitoringStatus);
        
        // Test available networks
        const availableNetworks = networkIntegration.getAvailableNetworks();
        console.log('🌐 Available networks:', availableNetworks);
        
        // Test supported networks
        const supportedNetworks = networkIntegration.getSupportedNetworks();
        console.log('📋 Supported networks:', supportedNetworks);
        
        // Test network statuses
        const networkStatuses = await networkIntegration.getNetworkStatuses();
        console.log('📈 Network statuses:', networkStatuses);
        
        console.log('✅ Integration test completed successfully');
    } catch (error) {
        console.error('❌ Integration test failed:', error);
        process.exit(1);
    }
}

testIntegration();
EOF

# Run the test
node test-integration.js
if [ $? -ne 0 ]; then
    print_error "Integration test failed"
    exit 1
fi

# Clean up test file
rm test-integration.js

print_success "Affiliate network integration setup completed successfully!"

# Display next steps
echo ""
echo "🎯 Next Steps:"
echo "1. Update your .env file with actual API credentials"
echo "2. Start the monitoring service: npm run start:monitoring"
echo "3. Test individual networks: npm run test:networks"
echo "4. View monitoring dashboard: http://localhost:3000/monitoring"
echo ""
echo "📚 Documentation:"
echo "- Implementation Roadmap: IMPLEMENTATION_ROADMAP.md"
echo "- API Documentation: server/routes/"
echo "- Monitoring Guide: server/services/affiliateMonitoring.ts"
echo ""
echo "🔧 Available Commands:"
echo "- npm run start:monitoring    # Start monitoring service"
echo "- npm run test:networks       # Test all network connections"
echo "- npm run add:network         # Add a new network"
echo "- npm run remove:network      # Remove a network"
echo "- npm run status              # Check monitoring status"
echo ""

print_success "Setup complete! Your affiliate network integration is ready to use." 