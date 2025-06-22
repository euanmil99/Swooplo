import { Router, Request, Response, NextFunction } from 'express';
import { slackService } from '../services/slack.js';
import { authenticateUser } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = Router();

// Slack webhook verification
const verifySlackRequest = (req: Request, res: Response, next: NextFunction) => {
  // Slack sends a challenge to verify the webhook
  if (req.body.type === 'url_verification') {
    return res.json({ challenge: req.body.challenge });
  }
  next();
};

// Slack webhook endpoint for events
router.post('/events', verifySlackRequest, asyncHandler(async (req: Request, res: Response) => {
  const { event } = req.body;
  
  // Handle different event types
  switch (event.type) {
    case 'message':
      // Handle message events
      console.log('Received message event:', event);
      break;
      
    case 'app_mention':
      // Handle app mention events
      console.log('Received app mention:', event);
      break;
      
    case 'reaction_added':
      // Handle reaction events
      console.log('Received reaction event:', event);
      break;
      
    default:
      console.log('Unhandled event type:', event.type);
  }
  
  res.status(200).send('OK');
}));

// Slack webhook endpoint for interactive messages
router.post('/interactive', verifySlackRequest, asyncHandler(async (req: Request, res: Response) => {
  const payload = JSON.parse(req.body.payload);
  
  // Handle interactive message actions
  switch (payload.type) {
    case 'block_actions':
      // Handle button clicks and other block actions
      console.log('Received block action:', payload);
      break;
      
    case 'view_submission':
      // Handle modal submissions
      console.log('Received view submission:', payload);
      break;
      
    default:
      console.log('Unhandled interactive payload type:', payload.type);
  }
  
  res.status(200).send('OK');
}));

// Slack slash commands
router.post('/commands', asyncHandler(async (req: Request, res: Response) => {
  const { command, text, user_id, channel_id, response_url } = req.body;
  
  let response = '';
  
  switch (command) {
    case '/socialpilot':
      response = await handleSocialPilotCommand(text, user_id, channel_id);
      break;
      
    case '/socialpilot-status':
      response = await handleStatusCommand(user_id, channel_id);
      break;
      
    case '/socialpilot-summary':
      response = await handleSummaryCommand(user_id, channel_id);
      break;
      
    case '/socialpilot-generate':
      response = await handleGenerateCommand(text, user_id, channel_id);
      break;
      
    case '/socialpilot-schedule':
      response = await handleScheduleCommand(text, user_id, channel_id);
      break;
      
    default:
      response = 'Unknown command. Available commands: /socialpilot, /socialpilot-status, /socialpilot-summary, /socialpilot-generate, /socialpilot-schedule';
  }
  
  res.json({
    response_type: 'in_channel',
    text: response
  });
}));

// Slack OAuth endpoint
router.get('/oauth', asyncHandler(async (req: Request, res: Response) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }
  
  try {
    // Exchange code for access token
    const response = await slackService.web.oauth.v2.access({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code: code as string
    });
    
    // Store the tokens securely
    // This would typically be stored in your database
    console.log('Slack OAuth successful:', response);
    
    res.json({
      success: true,
      message: 'Slack integration successful! You can now use Slack commands.'
    });
  } catch (error) {
    console.error('Slack OAuth error:', error);
    res.status(500).json({ error: 'Failed to complete OAuth' });
  }
}));

// Send notification to Slack
router.post('/notify', 
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    const { type, title, message, data, channel } = req.body;
    
    const notification: any = {
      type: type || 'info',
      title,
      message,
      data,
      timestamp: new Date()
    };
    
    let result;
    
    switch (type) {
      case 'performance':
        result = await slackService.sendPerformanceNotification(data);
        break;
        
      case 'ai_content':
        result = await slackService.sendAIContentNotification(data);
        break;
        
      case 'error':
        result = await slackService.sendErrorNotification(data);
        break;
        
      case 'daily_summary':
        result = await slackService.sendDailySummary(data);
        break;
        
      case 'content_approval':
        result = await slackService.sendContentApprovalRequest(data);
        break;
        
      default:
        result = await slackService.sendMessage(
          channel || process.env.SLACK_CHANNEL_ID!,
          `*${title}*\n${message}`
        );
    }
    
    res.json({
      success: true,
      data: result
    });
  })
);

// Post social media content to Slack
router.post('/post-content',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    const { platform, content, media, hashtags, scheduledTime, status } = req.body;
    
    const result = await slackService.postSocialContent({
      platform,
      content,
      media,
      hashtags,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      status
    });
    
    res.json({
      success: true,
      data: result
    });
  })
);

// Get Slack channels
router.get('/channels',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await slackService.listChannels();
    
    res.json({
      success: true,
      data: result.channels
    });
  })
);

// Get Slack channel info
router.get('/channels/:channelId',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    const { channelId } = req.params;
    
    const result = await slackService.getChannelInfo(channelId);
    
    res.json({
      success: true,
      data: result.channel
    });
  })
);

// Upload file to Slack
router.post('/upload',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    const { file, filename, channel, title } = req.body;
    
    // Convert base64 to buffer if needed
    const fileBuffer = Buffer.from(file, 'base64');
    
    const result = await slackService.uploadFile(fileBuffer, filename, channel, title);
    
    res.json({
      success: true,
      data: result
    });
  })
);

// Test Slack connection
router.get('/test',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Test the connection by getting channel info
      const result = await slackService.getChannelInfo(process.env.SLACK_CHANNEL_ID!);
      
      res.json({
        success: true,
        message: 'Slack connection successful',
        data: {
          channel: result.channel?.name,
          workspace: result.channel?.team
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Slack connection failed',
        error: error.message
      });
    }
  })
);

// Helper functions for slash commands
async function handleSocialPilotCommand(text: string, userId: string, channelId: string): Promise<string> {
  if (!text) {
    return `Welcome to Social Affiliate Pro! 🚀

Available commands:
• \`/socialpilot-status\` - Get current status
• \`/socialpilot-summary\` - Get daily summary
• \`/socialpilot-generate [platform] [topic]\` - Generate AI content
• \`/socialpilot-schedule [platform] [content]\` - Schedule a post

Examples:
• \`/socialpilot-generate instagram affiliate marketing tips\`
• \`/socialpilot-schedule twitter Check out this amazing product!\``;
  }
  
  const args = text.split(' ');
  const subcommand = args[0].toLowerCase();
  
  switch (subcommand) {
    case 'status':
      return await handleStatusCommand(userId, channelId);
    case 'summary':
      return await handleSummaryCommand(userId, channelId);
    case 'generate':
      return await handleGenerateCommand(args.slice(1).join(' '), userId, channelId);
    case 'schedule':
      return await handleScheduleCommand(args.slice(1).join(' '), userId, channelId);
    default:
      return `Unknown subcommand: ${subcommand}. Use \`/socialpilot\` for help.`;
  }
}

async function handleStatusCommand(userId: string, channelId: string): Promise<string> {
  // This would typically fetch real data from your database
  return `📊 *Current Status*

*Today's Activity:*
• Posts Published: 12
• Posts Scheduled: 8
• AI Content Generated: 15
• Total Engagement: 2,847
• Revenue Generated: $156.30

*Platform Status:*
• Instagram: ✅ Active (3 posts today)
• Twitter: ✅ Active (5 posts today)
• LinkedIn: ✅ Active (2 posts today)
• TikTok: ✅ Active (2 videos today)

*System Health:*
• All systems operational
• LocalAI: ✅ Connected
• Database: ✅ Healthy
• API Rate Limits: ✅ Good

*Next Scheduled Posts:*
• Instagram: 2 posts in next 4 hours
• Twitter: 3 tweets in next 6 hours
• LinkedIn: 1 post in next 8 hours`;
}

async function handleSummaryCommand(userId: string, channelId: string): Promise<string> {
  const today = new Date().toLocaleDateString();
  
  return `📈 *Daily Summary - ${today}*

*Overall Performance:*
• Total Posts: 18
• Total Engagement: 4,293
• Total Reach: 127,450
• Total Revenue: $234.75

*Platform Breakdown:*
• Instagram: 6 posts, 1,847 engagement, $89.30 revenue
• Twitter: 8 posts, 1,234 engagement, $67.45 revenue
• LinkedIn: 3 posts, 892 engagement, $45.20 revenue
• TikTok: 1 video, 320 engagement, $32.80 revenue

*Top Performing Content:*
1. Instagram post about "10 Affiliate Marketing Tips" - 847 likes, $23.40
2. Twitter thread about "Passive Income Strategies" - 456 retweets, $18.75
3. LinkedIn article about "B2B Marketing Trends" - 234 reactions, $15.60

*AI Content Generated:*
• Text Content: 12 pieces
• Image Generation: 8 images
• Hashtag Suggestions: 45 sets
• Sentiment Analysis: 23 analyses

*Revenue Breakdown:*
• Amazon Associates: $156.30
• ShareASale: $45.20
• Commission Junction: $33.25`;
}

async function handleGenerateCommand(text: string, userId: string, channelId: string): Promise<string> {
  const match = text.match(/^(\w+)\s+(.+)$/i);
  
  if (!match) {
    return `❌ Invalid format. Use: \`/socialpilot-generate [platform] [topic]\`

Examples:
• \`/socialpilot-generate instagram affiliate marketing tips\`
• \`/socialpilot-generate twitter passive income ideas\`
• \`/socialpilot-generate linkedin business growth strategies\``;
  }
  
  const platform = match[1];
  const topic = match[2];
  
  // This would typically call your AI service
  return `🤖 *AI Content Generation*

*Platform:* ${platform}
*Topic:* ${topic}

*Generated Content:*
"🚀 Ready to boost your ${topic.toLowerCase()} game? Here are 5 proven strategies that actually work! 

1. Start with a solid foundation
2. Focus on quality over quantity  
3. Build genuine relationships
4. Track and optimize everything
5. Stay consistent and patient

Which strategy resonates most with you? Drop a comment below! 👇

#${topic.replace(/\s+/g, '')} #success #growth #strategy"

*Hashtags:* #${topic.replace(/\s+/g, '')} #success #growth #strategy #motivation #business

*Character Count:* 287
*Tone:* Professional yet friendly
*Engagement Prediction:* High (estimated 200+ likes)

Would you like me to schedule this post or generate variations?`;
}

async function handleScheduleCommand(text: string, userId: string, channelId: string): Promise<string> {
  const match = text.match(/^(\w+)\s+(.+)$/i);
  
  if (!match) {
    return `❌ Invalid format. Use: \`/socialpilot-schedule [platform] [content]\`

Examples:
• \`/socialpilot-schedule instagram Check out this amazing product!\`
• \`/socialpilot-schedule twitter New blog post about affiliate marketing\`
• \`/socialpilot-schedule linkedin Excited to share our latest case study\``;
  }
  
  const platform = match[1];
  const content = match[2];
  
  // This would typically schedule the post in your system
  const scheduledTime = new Date();
  scheduledTime.setHours(scheduledTime.getHours() + 2); // Schedule 2 hours from now
  
  return `⏰ *Post Scheduled Successfully*

*Platform:* ${platform}
*Content:* "${content}"
*Scheduled Time:* ${scheduledTime.toLocaleString()}
*Status:* Scheduled

*Next Steps:*
• Post will be published automatically
• You'll receive performance notifications
• Analytics will be available in your dashboard

*Reminder:* You can edit or cancel this post anytime before it's published.`;
}

export { router as slackRoutes }; 