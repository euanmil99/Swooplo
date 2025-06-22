#!/bin/bash

# Slack Integration Setup Script for Social Affiliate Pro
# This script automates the setup of Slack integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to read user input
read_input() {
    local prompt="$1"
    local default="$2"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        echo "${input:-$default}"
    else
        read -p "$prompt: " input
        echo "$input"
    fi
}

# Function to validate Slack token format
validate_token() {
    local token="$1"
    local prefix="$2"
    
    if [[ ! "$token" =~ ^$prefix ]]; then
        log_error "Invalid token format. Should start with $prefix"
        return 1
    fi
    return 0
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    log_success "Node.js version: $(node --version)"
    
    # Check npm
    if ! command_exists npm; then
        log_error "npm is not available. Please install npm first."
        exit 1
    fi
    log_success "npm version: $(npm --version)"
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Creating template..."
        create_env_template
    fi
    
    echo
}

# Function to create .env template
create_env_template() {
    cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/socialpilot"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"

# Server Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Slack Configuration
SLACK_BOT_TOKEN=""
SLACK_USER_TOKEN=""
SLACK_SIGNING_SECRET=""
SLACK_APP_TOKEN=""
SLACK_CHANNEL_ID=""
SLACK_WORKSPACE_ID=""
SLACK_CLIENT_ID=""
SLACK_CLIENT_SECRET=""

# LocalAI Configuration
LOCALAI_BASE_URL=http://localhost:8080
LOCALAI_API_KEY=""

# Stripe Configuration
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PUBLISHABLE_KEY=""
EOF
    log_success "Created .env template"
}

# Function to collect Slack credentials
collect_slack_credentials() {
    log_info "Collecting Slack credentials..."
    echo
    
    log_info "First, create a Slack app at: https://api.slack.com/apps"
    log_info "Follow the setup guide in SLACK_INTEGRATION.md"
    echo
    
    # Bot Token
    while true; do
        BOT_TOKEN=$(read_input "Enter your Bot User OAuth Token (xoxb-...)" "")
        if validate_token "$BOT_TOKEN" "xoxb-"; then
            break
        fi
    done
    
    # User Token
    while true; do
        USER_TOKEN=$(read_input "Enter your User OAuth Token (xoxp-...)" "")
        if validate_token "$USER_TOKEN" "xoxp-"; then
            break
        fi
    done
    
    # Signing Secret
    while [ -z "$SIGNING_SECRET" ]; do
        SIGNING_SECRET=$(read_input "Enter your Signing Secret" "")
        if [ -z "$SIGNING_SECRET" ]; then
            log_error "Signing secret is required"
        fi
    done
    
    # App Token
    while true; do
        APP_TOKEN=$(read_input "Enter your App-Level Token (xapp-...)" "")
        if validate_token "$APP_TOKEN" "xapp-"; then
            break
        fi
    done
    
    # Channel ID
    while true; do
        CHANNEL_ID=$(read_input "Enter your default Channel ID (C...)" "")
        if validate_token "$CHANNEL_ID" "C"; then
            break
        fi
    done
    
    # Workspace ID
    while true; do
        WORKSPACE_ID=$(read_input "Enter your Workspace ID (T...)" "")
        if validate_token "$WORKSPACE_ID" "T"; then
            break
        fi
    done
    
    # Client ID
    while [ -z "$CLIENT_ID" ]; do
        CLIENT_ID=$(read_input "Enter your Client ID" "")
        if [ -z "$CLIENT_ID" ]; then
            log_error "Client ID is required"
        fi
    done
    
    # Client Secret
    while [ -z "$CLIENT_SECRET" ]; do
        CLIENT_SECRET=$(read_input "Enter your Client Secret" "")
        if [ -z "$CLIENT_SECRET" ]; then
            log_error "Client secret is required"
        fi
    done
    
    echo
    log_success "All credentials collected successfully!"
    echo
}

# Function to update .env file
update_env_file() {
    log_info "Updating .env file..."
    
    # Create backup
    cp .env .env.backup 2>/dev/null || true
    
    # Update Slack configuration
    sed -i.bak "s/^SLACK_BOT_TOKEN=.*/SLACK_BOT_TOKEN=\"$BOT_TOKEN\"/" .env
    sed -i.bak "s/^SLACK_USER_TOKEN=.*/SLACK_USER_TOKEN=\"$USER_TOKEN\"/" .env
    sed -i.bak "s/^SLACK_SIGNING_SECRET=.*/SLACK_SIGNING_SECRET=\"$SIGNING_SECRET\"/" .env
    sed -i.bak "s/^SLACK_APP_TOKEN=.*/SLACK_APP_TOKEN=\"$APP_TOKEN\"/" .env
    sed -i.bak "s/^SLACK_CHANNEL_ID=.*/SLACK_CHANNEL_ID=\"$CHANNEL_ID\"/" .env
    sed -i.bak "s/^SLACK_WORKSPACE_ID=.*/SLACK_WORKSPACE_ID=\"$WORKSPACE_ID\"/" .env
    sed -i.bak "s/^SLACK_CLIENT_ID=.*/SLACK_CLIENT_ID=\"$CLIENT_ID\"/" .env
    sed -i.bak "s/^SLACK_CLIENT_SECRET=.*/SLACK_CLIENT_SECRET=\"$CLIENT_SECRET\"/" .env
    
    # Clean up backup files
    rm -f .env.bak
    
    log_success ".env file updated successfully!"
}

# Function to install dependencies
install_dependencies() {
    log_info "Installing Slack dependencies..."
    
    # Check if dependencies are already installed
    if npm list @slack/web-api @slack/events-api @slack/interactive-messages >/dev/null 2>&1; then
        log_success "All Slack dependencies are already installed"
        return
    fi
    
    log_info "Installing missing dependencies..."
    npm install @slack/web-api @slack/events-api @slack/interactive-messages
    log_success "Dependencies installed successfully!"
}

# Function to setup webhook URLs
setup_webhook_urls() {
    log_info "Setting up webhook URLs..."
    
    BASE_URL=$(read_input "Enter your server base URL (e.g., https://yourdomain.com or http://localhost:3001)" "http://localhost:3001")
    
    EVENTS_URL="$BASE_URL/api/slack/events"
    INTERACTIVE_URL="$BASE_URL/api/slack/interactive"
    COMMANDS_URL="$BASE_URL/api/slack/commands"
    
    echo
    log_info "Configure these URLs in your Slack app settings:"
    echo
    echo "EVENTS: $EVENTS_URL"
    echo "INTERACTIVE: $INTERACTIVE_URL"
    echo "COMMANDS: $COMMANDS_URL"
    echo
    
    log_info "For local development, you can use ngrok to expose your local server:"
    echo "   npx ngrok http 3001"
    echo
    
    # Save webhook URLs to a file for reference
    cat > slack-webhooks.json << EOF
{
  "baseUrl": "$BASE_URL",
  "webhookUrls": {
    "events": "$EVENTS_URL",
    "interactive": "$INTERACTIVE_URL",
    "commands": "$COMMANDS_URL"
  },
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    log_success "Webhook configuration saved to slack-webhooks.json"
}

# Function to test connection
test_connection() {
    log_info "Testing Slack connection..."
    
    read -p "Do you want to test the connection now? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Skipping connection test"
        return
    fi
    
    # Check if server is running
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        log_success "Server is already running"
    else
        log_warning "Server not running. Please start it manually with: npm run dev"
        log_info "Then run this script again to test the connection"
        return
    fi
    
    # Test Slack connection
    if curl -s -H "Authorization: Bearer test-token" http://localhost:3001/api/slack/test >/dev/null 2>&1; then
        log_success "Slack connection test successful!"
    else
        log_error "Slack connection test failed"
        log_warning "Make sure your server is running and Slack credentials are correct"
    fi
}

# Function to create setup guide
create_setup_guide() {
    log_info "Creating setup guide..."
    
    cat > SLACK_SETUP_GUIDE.md << EOF
# Slack App Setup Guide

## Quick Setup Steps

### 1. Create Slack App
1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "Social Affiliate Pro"
4. Select your workspace

### 2. Configure OAuth & Permissions
1. Go to "OAuth & Permissions"
2. Add these Bot Token Scopes:
   - \`channels:read\`
   - \`chat:write\`
   - \`files:write\`
   - \`users:read\`
   - \`app_mentions:read\`
   - \`channels:history\`
3. Add these User Token Scopes:
   - \`channels:read\`
   - \`chat:write\`
4. Install app to workspace
5. Copy the tokens

### 3. Configure Event Subscriptions
1. Go to "Event Subscriptions"
2. Enable events
3. Set Request URL: \`$EVENTS_URL\`
4. Subscribe to bot events:
   - \`message.channels\`
   - \`app_mention\`
   - \`reaction_added\`

### 4. Configure Interactive Components
1. Go to "Interactivity & Shortcuts"
2. Enable interactivity
3. Set Request URL: \`$INTERACTIVE_URL\`

### 5. Configure Slash Commands
Create these commands:
- \`/socialpilot\` → \`$COMMANDS_URL\`
- \`/socialpilot-status\` → \`$COMMANDS_URL\`
- \`/socialpilot-summary\` → \`$COMMANDS_URL\`
- \`/socialpilot-generate\` → \`$COMMANDS_URL\`
- \`/socialpilot-schedule\` → \`$COMMANDS_URL\`

### 6. Get App Credentials
1. Go to "Basic Information"
2. Copy:
   - Signing Secret
   - Client ID
   - Client Secret
3. Go to "OAuth & Permissions"
4. Copy:
   - Bot User OAuth Token
   - User OAuth Token
5. Go to "App-Level Tokens"
6. Generate new token with \`connections:write\` scope

### 7. Test Integration
1. Start your server: \`npm run dev\`
2. Test connection: \`curl http://localhost:3001/api/slack/test\`
3. Try slash commands in Slack

## Troubleshooting

### Common Issues
1. **Webhook verification fails**: Check signing secret and URL accessibility
2. **Commands not working**: Verify bot token permissions and command URLs
3. **Messages not sending**: Check bot token validity and channel permissions
4. **Events not received**: Verify event subscription settings

### Local Development
For local development, use ngrok to expose your server:
\`\`\`bash
npx ngrok http 3001
\`\`\`

Then use the ngrok URL as your base URL for webhook configuration.

## Next Steps
1. Customize notification settings in the dashboard
2. Set up automated workflows
3. Configure content approval processes
4. Monitor performance and engagement

Generated on: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
    log_success "Setup guide created: SLACK_SETUP_GUIDE.md"
}

# Main function
main() {
    echo -e "${BLUE}🚀 Starting Slack Integration Setup${NC}"
    echo "This script will help you set up Slack integration for Social Affiliate Pro"
    echo
    
    check_prerequisites
    collect_slack_credentials
    update_env_file
    install_dependencies
    setup_webhook_urls
    test_connection
    create_setup_guide
    
    log_success "Slack integration setup completed successfully!"
    log_info "Check the generated SLACK_SETUP_GUIDE.md for next steps"
}

# Run main function
main "$@" 