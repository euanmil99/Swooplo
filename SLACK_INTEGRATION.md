# Slack API Integration Guide

This guide explains how to set up and use Slack API integration with your Social Affiliate Pro platform.

## Overview

The Slack integration allows you to:
- Receive notifications about social media performance
- Generate AI content through Slack commands
- Schedule posts directly from Slack
- Get real-time updates on your affiliate marketing campaigns
- Approve content before publishing
- Receive daily summaries and analytics

## Setup Instructions

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Enter app name: "Social Affiliate Pro"
5. Select your workspace

### 2. Configure App Permissions

In your Slack app settings, add the following OAuth scopes:

**Bot Token Scopes:**
- `channels:read` - Read public channels
- `chat:write` - Send messages
- `files:write` - Upload files
- `users:read` - Read user information
- `app_mentions:read` - Read app mentions
- `channels:history` - Read channel messages

**User Token Scopes:**
- `channels:read` - Read public channels
- `chat:write` - Send messages as user

### 3. Configure Event Subscriptions

1. Go to "Event Subscriptions" in your app settings
2. Enable events
3. Set request URL: `https://yourdomain.com/api/slack/events`
4. Subscribe to bot events:
   - `message.channels` - Messages in public channels
   - `app_mention` - App mention events
   - `reaction_added` - Reaction events

### 4. Configure Interactive Components

1. Go to "Interactivity & Shortcuts"
2. Enable interactivity
3. Set request URL: `https://yourdomain.com/api/slack/interactive`

### 5. Configure Slash Commands

Create the following slash commands:

| Command | Description | Request URL |
|---------|-------------|-------------|
| `/socialpilot` | Main command with subcommands | `https://yourdomain.com/api/slack/commands` |
| `/socialpilot-status` | Get current status | `https://yourdomain.com/api/slack/commands` |
| `/socialpilot-summary` | Get daily summary | `https://yourdomain.com/api/slack/commands` |
| `/socialpilot-generate` | Generate AI content | `https://yourdomain.com/api/slack/commands` |
| `/socialpilot-schedule` | Schedule a post | `https://yourdomain.com/api/slack/commands` |

### 6. Install App to Workspace

1. Go to "OAuth & Permissions"
2. Click "Install to Workspace"
3. Copy the Bot User OAuth Token

### 7. Environment Variables

Add these environment variables to your `.env` file:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_USER_TOKEN=xoxp-your-user-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_CHANNEL_ID=C1234567890
SLACK_WORKSPACE_ID=T1234567890
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
```

## Usage

### Slash Commands

#### `/socialpilot`
Main command that shows available options and help.

**Examples:**
```
/socialpilot
/socialpilot status
/socialpilot summary
/socialpilot generate instagram affiliate marketing tips
/socialpilot schedule twitter Check out this amazing product!
```

#### `/socialpilot-status`
Get current status of your social media campaigns.

**Response includes:**
- Today's activity summary
- Platform status
- System health
- Next scheduled posts

#### `/socialpilot-summary`
Get detailed daily summary with analytics.

**Response includes:**
- Overall performance metrics
- Platform breakdown
- Top performing content
- Revenue breakdown
- AI content generation stats

#### `/socialpilot-generate [platform] [topic]`
Generate AI content for a specific platform and topic.

**Examples:**
```
/socialpilot-generate instagram affiliate marketing tips
/socialpilot-generate twitter passive income ideas
/socialpilot-generate linkedin business growth strategies
```

#### `/socialpilot-schedule [platform] [content]`
Schedule a post for a specific platform.

**Examples:**
```
/socialpilot-schedule instagram Check out this amazing product!
/socialpilot-schedule twitter New blog post about affiliate marketing
/socialpilot-schedule linkedin Excited to share our latest case study
```

### App Mentions

You can mention the bot in any channel to interact with it:

**Examples:**
```
@Social Affiliate Pro generate instagram affiliate marketing tips
@Social Affiliate Pro schedule twitter New product launch!
@Social Affiliate Pro status
```

### Interactive Messages

The bot sends interactive messages for:
- Content approval requests
- Performance notifications
- Error alerts

Users can click buttons to:
- ✅ Approve content
- ❌ Reject content
- ✏️ Edit content

## API Endpoints

### Webhook Endpoints

#### `POST /api/slack/events`
Handles Slack events (messages, mentions, reactions)

#### `POST /api/slack/interactive`
Handles interactive message actions (button clicks)

#### `POST /api/slack/commands`
Handles slash command requests

### REST API Endpoints

#### `GET /api/slack/test`
Test Slack connection

#### `POST /api/slack/notify`
Send notification to Slack

**Request body:**
```json
{
  "type": "performance|ai_content|error|daily_summary|content_approval",
  "title": "Notification Title",
  "message": "Notification message",
  "data": {},
  "channel": "C1234567890"
}
```

#### `POST /api/slack/post-content`
Post social media content to Slack

**Request body:**
```json
{
  "platform": "instagram",
  "content": "Your post content",
  "media": ["image1.jpg", "image2.jpg"],
  "hashtags": ["#marketing", "#affiliate"],
  "scheduledTime": "2024-01-15T10:00:00Z",
  "status": "scheduled"
}
```

#### `GET /api/slack/channels`
List all Slack channels

#### `GET /api/slack/channels/:channelId`
Get specific channel information

#### `POST /api/slack/upload`
Upload file to Slack

**Request body:**
```json
{
  "file": "base64-encoded-file",
  "filename": "image.jpg",
  "channel": "C1234567890",
  "title": "File title"
}
```

## Notification Types

### Performance Notifications
Sent when posts perform well or reach milestones.

**Data includes:**
- Platform name
- Post ID
- Engagement metrics (likes, comments, shares, reach)
- Revenue generated

### AI Content Notifications
Sent when AI generates new content.

**Data includes:**
- Platform
- Generated content
- Hashtags
- Tone and character count

### Error Notifications
Sent when errors occur in the system.

**Data includes:**
- Error type
- Error message
- Platform affected
- Technical details

### Daily Summary Notifications
Sent daily with comprehensive analytics.

**Data includes:**
- Total posts and engagement
- Revenue breakdown
- Platform performance
- Top content

### Content Approval Requests
Sent when content needs approval before publishing.

**Data includes:**
- Content ID
- Platform
- Content text
- Scheduled time
- Media attachments

## Security Considerations

1. **Token Security**: Store Slack tokens securely in environment variables
2. **Request Verification**: All webhook requests are verified using the signing secret
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **User Authentication**: Require authentication for sensitive operations
5. **Channel Access**: Only post to authorized channels

## Troubleshooting

### Common Issues

1. **Webhook Verification Fails**
   - Check signing secret is correct
   - Ensure request URL is accessible
   - Verify SSL certificate

2. **Commands Not Working**
   - Check bot token permissions
   - Verify command URLs are correct
   - Ensure app is installed in workspace

3. **Messages Not Sending**
   - Check bot token validity
   - Verify channel ID is correct
   - Ensure bot has permission to post

4. **Events Not Received**
   - Check event subscription settings
   - Verify request URL is accessible
   - Check app permissions

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=slack:*
```

### Testing

Use the test endpoint to verify connection:
```bash
curl -X GET http://localhost:3001/api/slack/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Best Practices

1. **Error Handling**: Always handle errors gracefully
2. **Rate Limiting**: Respect Slack's rate limits
3. **User Experience**: Provide clear, helpful responses
4. **Security**: Validate all inputs and verify requests
5. **Monitoring**: Log important events for debugging
6. **Documentation**: Keep documentation updated

## Advanced Features

### Custom Commands
You can extend the system with custom commands by adding new handlers in the routes file.

### Automated Workflows
Set up automated workflows that trigger Slack notifications based on:
- High-performing posts
- Revenue milestones
- System errors
- Content scheduling

### Integration with Other Services
The Slack integration can be extended to work with:
- CRM systems
- Analytics platforms
- Email marketing tools
- Project management tools

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Slack API documentation
3. Check server logs for errors
4. Verify environment variables
5. Test with the `/api/slack/test` endpoint 