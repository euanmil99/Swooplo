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
  return 'SocialPilot Slack integration is live! Use /socialpilot-status, /socialpilot-summary, /socialpilot-generate, or /socialpilot-schedule.';
}

async function handleStatusCommand(userId: string, channelId: string): Promise<string> {
  return 'Status command is not yet implemented.';
}

async function handleSummaryCommand(userId: string, channelId: string): Promise<string> {
  return 'Summary command is not yet implemented.';
}

async function handleGenerateCommand(text: string, userId: string, channelId: string): Promise<string> {
  return 'AI content generation via Slack is not yet implemented.';
}

async function handleScheduleCommand(text: string, userId: string, channelId: string): Promise<string> {
  return 'Scheduling posts via Slack is not yet implemented.';
}

export { router as slackRoutes }; 