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
   - `channels:read`
   - `chat:write`
   - `files:write`
   - `users:read`
   - `app_mentions:read`
   - `channels:history`
3. Add these User Token Scopes:
   - `channels:read`
   - `chat:write`
4. Install app to workspace
5. Copy the tokens

### 3. Configure Event Subscriptions
1. Go to "Event Subscriptions"
2. Enable events
3. Set Request URL: `https://swooplo.com//api/slack/events`
4. Subscribe to bot events:
   - `message.channels`
   - `app_mention`
   - `reaction_added`

### 4. Configure Interactive Components
1. Go to "Interactivity & Shortcuts"
2. Enable interactivity
3. Set Request URL: `https://swooplo.com//api/slack/interactive`

### 5. Configure Slash Commands
Create these commands:
- `/socialpilot` → `https://swooplo.com//api/slack/commands`
- `/socialpilot-status` → `https://swooplo.com//api/slack/commands`
- `/socialpilot-summary` → `https://swooplo.com//api/slack/commands`
- `/socialpilot-generate` → `https://swooplo.com//api/slack/commands`
- `/socialpilot-schedule` → `https://swooplo.com//api/slack/commands`

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
6. Generate new token with `connections:write` scope

### 7. Test Integration
1. Start your server: `npm run dev`
2. Test connection: `curl http://localhost:3001/api/slack/test`
3. Try slash commands in Slack

## Troubleshooting

### Common Issues
1. **Webhook verification fails**: Check signing secret and URL accessibility
2. **Commands not working**: Verify bot token permissions and command URLs
3. **Messages not sending**: Check bot token validity and channel permissions
4. **Events not received**: Verify event subscription settings

### Local Development
For local development, use ngrok to expose your server:
```bash
npx ngrok http 3001
```

Then use the ngrok URL as your base URL for webhook configuration.

## Next Steps
1. Customize notification settings in the dashboard
2. Set up automated workflows
3. Configure content approval processes
4. Monitor performance and engagement

Generated on: 2025-06-24T17:18:20Z
