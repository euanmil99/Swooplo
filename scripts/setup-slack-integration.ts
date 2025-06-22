#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';
import axios from 'axios';

interface SlackConfig {
  botToken: string;
  userToken: string;
  signingSecret: string;
  appToken: string;
  channelId: string;
  workspaceId: string;
  clientId: string;
  clientSecret: string;
}

interface WebhookUrls {
  events: string;
  interactive: string;
  commands: string;
}

class SlackSetupAutomation {
  private rl: readline.Interface;
  private config: SlackConfig = {
    botToken: '',
    userToken: '',
    signingSecret: '',
    appToken: '',
    channelId: '',
    workspaceId: '',
    clientId: '',
    clientSecret: ''
  };
  private webhookUrls: WebhookUrls | null = null;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const colors = {
      info: '\x1b[36m', // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m', // Red
      warning: '\x1b[33m' // Yellow
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type]}${message}${reset}`);
  }

  private async runCommand(command: string, cwd?: string): Promise<string> {
    try {
      return execSync(command, { 
        cwd: cwd || process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (error: any) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
  }

  async start() {
    this.log('🚀 Starting Slack Integration Setup', 'info');
    this.log('This script will help you set up Slack integration for Social Affiliate Pro', 'info');
    console.log('');

    try {
      await this.checkPrerequisites();
      await this.collectSlackCredentials();
      await this.updateEnvironmentFile();
      await this.installDependencies();
      await this.setupWebhookUrls();
      await this.testConnection();
      await this.createSlackAppGuide();
      
      this.log('✅ Slack integration setup completed successfully!', 'success');
      this.log('📖 Check the generated SLACK_SETUP_GUIDE.md for next steps', 'info');
      
    } catch (error: any) {
      this.log(`❌ Setup failed: ${error.message}`, 'error');
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  private async checkPrerequisites() {
    this.log('🔍 Checking prerequisites...', 'info');

    // Check if Node.js is installed
    try {
      const nodeVersion = await this.runCommand('node --version');
      this.log(`✅ Node.js version: ${nodeVersion.trim()}`, 'success');
    } catch {
      throw new Error('Node.js is not installed. Please install Node.js first.');
    }

    // Check if npm is available
    try {
      const npmVersion = await this.runCommand('npm --version');
      this.log(`✅ npm version: ${npmVersion.trim()}`, 'success');
    } catch {
      throw new Error('npm is not available. Please install npm first.');
    }

    // Check if .env file exists
    if (!existsSync('.env')) {
      this.log('⚠️  .env file not found. Creating template...', 'warning');
      await this.createEnvTemplate();
    }

    console.log('');
  }

  private async createEnvTemplate() {
    const envTemplate = `# Database
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
`;

    writeFileSync('.env', envTemplate);
    this.log('✅ Created .env template', 'success');
  }

  private async collectSlackCredentials() {
    this.log('📝 Collecting Slack credentials...', 'info');
    console.log('');

    this.log('🔗 First, create a Slack app at: https://api.slack.com/apps', 'info');
    this.log('📖 Follow the setup guide in SLACK_INTEGRATION.md', 'info');
    console.log('');

    // Bot Token
    this.config.botToken = await this.question('Enter your Bot User OAuth Token (xoxb-...): ');
    if (!this.config.botToken.startsWith('xoxb-')) {
      throw new Error('Invalid bot token format. Should start with xoxb-');
    }

    // User Token
    this.config.userToken = await this.question('Enter your User OAuth Token (xoxp-...): ');
    if (!this.config.userToken.startsWith('xoxp-')) {
      throw new Error('Invalid user token format. Should start with xoxp-');
    }

    // Signing Secret
    this.config.signingSecret = await this.question('Enter your Signing Secret: ');
    if (!this.config.signingSecret) {
      throw new Error('Signing secret is required');
    }

    // App Token
    this.config.appToken = await this.question('Enter your App-Level Token (xapp-...): ');
    if (!this.config.appToken.startsWith('xapp-')) {
      throw new Error('Invalid app token format. Should start with xapp-');
    }

    // Channel ID
    this.config.channelId = await this.question('Enter your default Channel ID (C...): ');
    if (!this.config.channelId.startsWith('C')) {
      throw new Error('Invalid channel ID format. Should start with C');
    }

    // Workspace ID
    this.config.workspaceId = await this.question('Enter your Workspace ID (T...): ');
    if (!this.config.workspaceId.startsWith('T')) {
      throw new Error('Invalid workspace ID format. Should start with T');
    }

    // Client ID
    this.config.clientId = await this.question('Enter your Client ID: ');
    if (!this.config.clientId) {
      throw new Error('Client ID is required');
    }

    // Client Secret
    this.config.clientSecret = await this.question('Enter your Client Secret: ');
    if (!this.config.clientSecret) {
      throw new Error('Client secret is required');
    }

    console.log('');
    this.log('✅ All credentials collected successfully!', 'success');
    console.log('');
  }

  private async updateEnvironmentFile() {
    this.log('📝 Updating .env file...', 'info');

    try {
      let envContent = readFileSync('.env', 'utf8');

      // Update Slack configuration
      const updates = [
        { key: 'SLACK_BOT_TOKEN', value: this.config.botToken },
        { key: 'SLACK_USER_TOKEN', value: this.config.userToken },
        { key: 'SLACK_SIGNING_SECRET', value: this.config.signingSecret },
        { key: 'SLACK_APP_TOKEN', value: this.config.appToken },
        { key: 'SLACK_CHANNEL_ID', value: this.config.channelId },
        { key: 'SLACK_WORKSPACE_ID', value: this.config.workspaceId },
        { key: 'SLACK_CLIENT_ID', value: this.config.clientId },
        { key: 'SLACK_CLIENT_SECRET', value: this.config.clientSecret }
      ];

      for (const update of updates) {
        const regex = new RegExp(`^${update.key}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${update.key}="${update.value}"`);
        } else {
          envContent += `\n${update.key}="${update.value}"`;
        }
      }

      writeFileSync('.env', envContent);
      this.log('✅ .env file updated successfully!', 'success');
    } catch (error: any) {
      throw new Error(`Failed to update .env file: ${error.message}`);
    }
  }

  private async installDependencies() {
    this.log('📦 Installing Slack dependencies...', 'info');

    try {
      // Check if dependencies are already installed
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      const requiredDeps = ['@slack/web-api', '@slack/events-api', '@slack/interactive-messages'];
      const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

      if (missingDeps.length === 0) {
        this.log('✅ All Slack dependencies are already installed', 'success');
        return;
      }

      this.log(`Installing missing dependencies: ${missingDeps.join(', ')}`, 'info');
      await this.runCommand(`npm install ${missingDeps.join(' ')}`);
      this.log('✅ Dependencies installed successfully!', 'success');
    } catch (error: any) {
      throw new Error(`Failed to install dependencies: ${error.message}`);
    }
  }

  private async setupWebhookUrls() {
    this.log('🔗 Setting up webhook URLs...', 'info');

    const baseUrl = await this.question('Enter your server base URL (e.g., https://yourdomain.com or http://localhost:3001): ');
    
    this.webhookUrls = {
      events: `${baseUrl}/api/slack/events`,
      interactive: `${baseUrl}/api/slack/interactive`,
      commands: `${baseUrl}/api/slack/commands`
    };

    console.log('');
    this.log('📋 Configure these URLs in your Slack app settings:', 'info');
    console.log('');
    
    for (const [type, url] of Object.entries(this.webhookUrls)) {
      console.log(`${type.toUpperCase()}: ${url}`);
    }

    console.log('');
    this.log('💡 For local development, you can use ngrok to expose your local server:', 'info');
    console.log('   npx ngrok http 3001');
    console.log('');

    // Save webhook URLs to a file for reference
    const webhookConfig = {
      baseUrl,
      webhookUrls: this.webhookUrls,
      timestamp: new Date().toISOString()
    };

    writeFileSync('slack-webhooks.json', JSON.stringify(webhookConfig, null, 2));
    this.log('✅ Webhook configuration saved to slack-webhooks.json', 'success');
  }

  private async testConnection() {
    this.log('🧪 Testing Slack connection...', 'info');

    const shouldTest = await this.question('Do you want to test the connection now? (y/n): ');
    if (shouldTest.toLowerCase() !== 'y') {
      this.log('⏭️  Skipping connection test', 'warning');
      return;
    }

    try {
      // Start the server in the background
      this.log('🚀 Starting server for testing...', 'info');
      
      // Check if server is already running
      try {
        const response = await axios.get('http://localhost:3001/health', { timeout: 5000 });
        this.log('✅ Server is already running', 'success');
      } catch {
        this.log('⚠️  Server not running. Please start it manually with: npm run dev', 'warning');
        this.log('   Then run this script again to test the connection', 'info');
        return;
      }

      // Test Slack connection
      const response = await axios.get('http://localhost:3001/api/slack/test', {
        headers: {
          'Authorization': 'Bearer test-token' // You might need to adjust this
        },
        timeout: 10000
      });

      if (response.data.success) {
        this.log('✅ Slack connection test successful!', 'success');
        this.log(`   Connected to workspace: ${response.data.data.workspace}`, 'info');
        this.log(`   Default channel: ${response.data.data.channel}`, 'info');
      } else {
        this.log('❌ Slack connection test failed', 'error');
        this.log(`   Error: ${response.data.message}`, 'error');
      }
    } catch (error: any) {
      this.log('❌ Connection test failed', 'error');
      this.log(`   Error: ${error.message}`, 'error');
      this.log('   Make sure your server is running and Slack credentials are correct', 'warning');
    }
  }

  private async createSlackAppGuide() {
    this.log('📖 Creating setup guide...', 'info');

    const guide = `# Slack App Setup Guide

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
3. Set Request URL: \`${this.webhookUrls?.events || 'YOUR_BASE_URL/api/slack/events'}\`
4. Subscribe to bot events:
   - \`message.channels\`
   - \`app_mention\`
   - \`reaction_added\`

### 4. Configure Interactive Components
1. Go to "Interactivity & Shortcuts"
2. Enable interactivity
3. Set Request URL: \`${this.webhookUrls?.interactive || 'YOUR_BASE_URL/api/slack/interactive'}\`

### 5. Configure Slash Commands
Create these commands:
- \`/socialpilot\` → \`${this.webhookUrls?.commands || 'YOUR_BASE_URL/api/slack/commands'}\`
- \`/socialpilot-status\` → \`${this.webhookUrls?.commands || 'YOUR_BASE_URL/api/slack/commands'}\`
- \`/socialpilot-summary\` → \`${this.webhookUrls?.commands || 'YOUR_BASE_URL/api/slack/commands'}\`
- \`/socialpilot-generate\` → \`${this.webhookUrls?.commands || 'YOUR_BASE_URL/api/slack/commands'}\`
- \`/socialpilot-schedule\` → \`${this.webhookUrls?.commands || 'YOUR_BASE_URL/api/slack/commands'}\`

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

Generated on: ${new Date().toISOString()}
`;

    writeFileSync('SLACK_SETUP_GUIDE.md', guide);
    this.log('✅ Setup guide created: SLACK_SETUP_GUIDE.md', 'success');
  }
}

// Run the setup
if (require.main === module) {
  const setup = new SlackSetupAutomation();
  setup.start().catch(console.error);
} 