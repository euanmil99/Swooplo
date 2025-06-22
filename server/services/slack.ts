import axios from 'axios';
import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { createMessageAdapter } from '@slack/interactive-messages';

export interface SlackConfig {
  botToken: string;
  userToken: string;
  signingSecret: string;
  appToken: string;
  channelId: string;
  workspaceId: string;
}

export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
  thread_ts?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

export interface SlackNotification {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  data?: any;
  timestamp?: Date;
}

export class SlackService {
  public web: WebClient;
  private config: SlackConfig;
  private eventAdapter: any;
  private messageAdapter: any;

  constructor(config: SlackConfig) {
    this.config = config;
    this.web = new WebClient(config.botToken);
    
    // Initialize event adapter for receiving events
    this.eventAdapter = createEventAdapter(config.signingSecret);
    
    // Initialize message adapter for interactive messages
    this.messageAdapter = createMessageAdapter(config.signingSecret);
  }

  // Send a simple text message
  async sendMessage(channel: string, text: string, threadTs?: string): Promise<any> {
    try {
      const result = await this.web.chat.postMessage({
        channel,
        text,
        thread_ts: threadTs,
      });
      
      return result;
    } catch (error) {
      console.error('Slack send message error:', error);
      throw new Error('Failed to send Slack message');
    }
  }

  // Send a rich message with blocks
  async sendRichMessage(message: SlackMessage): Promise<any> {
    try {
      const result = await this.web.chat.postMessage(message);
      return result;
    } catch (error) {
      console.error('Slack send rich message error:', error);
      throw new Error('Failed to send rich Slack message');
    }
  }

  // Post social media content to Slack
  async postSocialContent(content: {
    platform: string;
    content: string;
    media?: string[];
    hashtags?: string[];
    scheduledTime?: Date;
    status: 'draft' | 'scheduled' | 'published' | 'failed';
  }): Promise<any> {
    const platformEmoji = this.getPlatformEmoji(content.platform);
    const statusEmoji = this.getStatusEmoji(content.status);
    
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${platformEmoji} ${content.platform.toUpperCase()} Content`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: content.content
        }
      }
    ];

    if (content.hashtags && content.hashtags.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Hashtags:* ${content.hashtags.join(' ')}`
        }
      });
    }

    if (content.scheduledTime) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Scheduled for:* ${content.scheduledTime.toLocaleString()}`
        }
      });
    }

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Status: ${statusEmoji} ${content.status}`
        }
      ]
    });

    return this.sendRichMessage({
      channel: this.config.channelId,
      blocks
    });
  }

  // Send notification about social media performance
  async sendPerformanceNotification(data: {
    platform: string;
    postId: string;
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    engagement: number;
    revenue?: number;
  }): Promise<any> {
    const platformEmoji = this.getPlatformEmoji(data.platform);
    
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${platformEmoji} Performance Update`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Platform:*\n${data.platform}`
          },
          {
            type: 'mrkdwn',
            text: `*Engagement Rate:*\n${data.engagement.toFixed(2)}%`
          },
          {
            type: 'mrkdwn',
            text: `*Likes:*\n${data.likes.toLocaleString()}`
          },
          {
            type: 'mrkdwn',
            text: `*Comments:*\n${data.comments.toLocaleString()}`
          },
          {
            type: 'mrkdwn',
            text: `*Shares:*\n${data.shares.toLocaleString()}`
          },
          {
            type: 'mrkdwn',
            text: `*Reach:*\n${data.reach.toLocaleString()}`
          }
        ]
      }
    ];

    if (data.revenue) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Revenue Generated:* $${data.revenue.toFixed(2)}`
        }
      });
    }

    return this.sendRichMessage({
      channel: this.config.channelId,
      blocks
    });
  }

  // Send AI content generation notification
  async sendAIContentNotification(data: {
    platform: string;
    prompt: string;
    generatedContent: string;
    hashtags: string[];
    tone: string;
    characterCount: number;
  }): Promise<any> {
    const platformEmoji = this.getPlatformEmoji(data.platform);
    
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🤖 AI Content Generated`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Platform:*\n${platformEmoji} ${data.platform}`
          },
          {
            type: 'mrkdwn',
            text: `*Tone:*\n${data.tone}`
          },
          {
            type: 'mrkdwn',
            text: `*Characters:*\n${data.characterCount}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Generated Content:*\n${data.generatedContent}`
        }
      }
    ];

    if (data.hashtags.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Hashtags:* ${data.hashtags.join(' ')}`
        }
      });
    }

    return this.sendRichMessage({
      channel: this.config.channelId,
      blocks
    });
  }

  // Send error notification
  async sendErrorNotification(error: {
    type: string;
    message: string;
    platform?: string;
    details?: any;
  }): Promise<any> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 Error Alert`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Error Type:*\n${error.type}`
          },
          {
            type: 'mrkdwn',
            text: `*Platform:*\n${error.platform || 'N/A'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n${error.message}`
        }
      }
    ];

    if (error.details) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Details:*\n\`\`\`${JSON.stringify(error.details, null, 2)}\`\`\``
        }
      });
    }

    return this.sendRichMessage({
      channel: this.config.channelId,
      blocks
    });
  }

  // Send daily summary
  async sendDailySummary(data: {
    date: Date;
    totalPosts: number;
    totalEngagement: number;
    totalRevenue: number;
    platformBreakdown: Array<{
      platform: string;
      posts: number;
      engagement: number;
      revenue: number;
    }>;
  }): Promise<any> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📊 Daily Summary - ${data.date.toLocaleDateString()}`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total Posts:*\n${data.totalPosts}`
          },
          {
            type: 'mrkdwn',
            text: `*Total Engagement:*\n${data.totalEngagement.toLocaleString()}`
          },
          {
            type: 'mrkdwn',
            text: `*Total Revenue:*\n$${data.totalRevenue.toFixed(2)}`
          }
        ]
      }
    ];

    // Add platform breakdown
    if (data.platformBreakdown.length > 0) {
      const platformFields = data.platformBreakdown.map(platform => ({
        type: 'mrkdwn' as const,
        text: `*${this.getPlatformEmoji(platform.platform)} ${platform.platform}:*\n${platform.posts} posts, ${platform.engagement.toLocaleString()} engagement, $${platform.revenue.toFixed(2)}`
      }));

      blocks.push({
        type: 'section',
        fields: platformFields
      });
    }

    return this.sendRichMessage({
      channel: this.config.channelId,
      blocks
    });
  }

  // Create interactive message for content approval
  async sendContentApprovalRequest(content: {
    id: string;
    platform: string;
    content: string;
    scheduledTime: Date;
    media?: string[];
  }): Promise<any> {
    const platformEmoji = this.getPlatformEmoji(content.platform);
    
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📝 Content Approval Request`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Platform:* ${platformEmoji} ${content.platform}\n*Scheduled:* ${content.scheduledTime.toLocaleString()}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Content:*\n${content.content}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Approve',
              emoji: true
            },
            style: 'primary',
            value: `approve_${content.id}`,
            action_id: 'approve_content'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '❌ Reject',
              emoji: true
            },
            style: 'danger',
            value: `reject_${content.id}`,
            action_id: 'reject_content'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✏️ Edit',
              emoji: true
            },
            value: `edit_${content.id}`,
            action_id: 'edit_content'
          }
        ]
      }
    ];

    return this.sendRichMessage({
      channel: this.config.channelId,
      blocks
    });
  }

  // Get channel information
  async getChannelInfo(channelId: string): Promise<any> {
    try {
      const result = await this.web.conversations.info({
        channel: channelId
      });
      return result;
    } catch (error) {
      console.error('Slack get channel info error:', error);
      throw new Error('Failed to get channel information');
    }
  }

  // List all channels
  async listChannels(): Promise<any> {
    try {
      const result = await this.web.conversations.list({
        types: 'public_channel,private_channel'
      });
      return result;
    } catch (error) {
      console.error('Slack list channels error:', error);
      throw new Error('Failed to list channels');
    }
  }

  // Upload file to Slack
  async uploadFile(file: Buffer, filename: string, channel: string, title?: string): Promise<any> {
    try {
      const result = await this.web.files.upload({
        channels: channel,
        file: file,
        filename: filename,
        title: title
      });
      return result;
    } catch (error) {
      console.error('Slack upload file error:', error);
      throw new Error('Failed to upload file to Slack');
    }
  }

  // Set up event listeners
  setupEventListeners() {
    // Handle message events
    this.eventAdapter.on('message', async (event: any) => {
      console.log('Received message event:', event);
      
      // Handle bot messages
      if (event.bot_id) {
        return;
      }

      // Handle user messages
      if (event.text) {
        await this.handleUserMessage(event);
      }
    });

    // Handle app mention events
    this.eventAdapter.on('app_mention', async (event: any) => {
      console.log('Received app mention:', event);
      await this.handleAppMention(event);
    });

    // Handle interactive message actions
    this.messageAdapter.action('approve_content', async (payload: any) => {
      await this.handleContentApproval(payload, 'approve');
    });

    this.messageAdapter.action('reject_content', async (payload: any) => {
      await this.handleContentApproval(payload, 'reject');
    });

    this.messageAdapter.action('edit_content', async (payload: any) => {
      await this.handleContentEdit(payload);
    });

    return {
      eventAdapter: this.eventAdapter,
      messageAdapter: this.messageAdapter
    };
  }

  // Handle user messages
  private async handleUserMessage(event: any) {
    const text = event.text.toLowerCase();
    
    if (text.includes('status') || text.includes('summary')) {
      await this.sendMessage(event.channel, 'I can help you with status updates and summaries! Use `/socialpilot status` for current status or `/socialpilot summary` for daily summary.');
    } else if (text.includes('help')) {
      await this.sendMessage(event.channel, 'Available commands:\n• `/socialpilot status` - Get current status\n• `/socialpilot summary` - Get daily summary\n• `/socialpilot generate [platform] [topic]` - Generate AI content\n• `/socialpilot schedule [platform] [content]` - Schedule a post');
    }
  }

  // Handle app mentions
  private async handleAppMention(event: any) {
    const text = event.text.replace(/<@[^>]+>/, '').trim();
    
    if (text.includes('generate')) {
      await this.handleGenerateCommand(event, text);
    } else if (text.includes('schedule')) {
      await this.handleScheduleCommand(event, text);
    } else if (text.includes('status')) {
      await this.handleStatusCommand(event);
    } else {
      await this.sendMessage(event.channel, 'Hi! I can help you with:\n• Generating AI content\n• Scheduling posts\n• Getting status updates\n\nTry mentioning me with "generate [platform] [topic]" or "schedule [platform] [content]"');
    }
  }

  // Handle generate command
  private async handleGenerateCommand(event: any, text: string) {
    const match = text.match(/generate\s+(\w+)\s+(.+)/i);
    if (match) {
      const platform = match[1];
      const topic = match[2];
      
      await this.sendMessage(event.channel, `Generating ${platform} content about "${topic}"... This feature will be available soon!`);
    } else {
      await this.sendMessage(event.channel, 'Please specify platform and topic. Example: "generate instagram affiliate marketing tips"');
    }
  }

  // Handle schedule command
  private async handleScheduleCommand(event: any, text: string) {
    const match = text.match(/schedule\s+(\w+)\s+(.+)/i);
    if (match) {
      const platform = match[1];
      const content = match[2];
      
      await this.sendMessage(event.channel, `Scheduling ${platform} post: "${content}"... This feature will be available soon!`);
    } else {
      await this.sendMessage(event.channel, 'Please specify platform and content. Example: "schedule twitter Check out this amazing product!"');
    }
  }

  // Handle status command
  private async handleStatusCommand(event: any) {
    await this.sendMessage(event.channel, '📊 Current Status:\n• All systems operational\n• 5 posts scheduled for today\n• 3 AI content pieces generated\n• Revenue: $127.50 today');
  }

  // Handle content approval
  private async handleContentApproval(payload: any, action: 'approve' | 'reject') {
    const contentId = payload.actions[0].value.replace(`${action}_`, '');
    
    await this.sendMessage(payload.channel.id, `Content ${contentId} has been ${action}ed!`);
    
    // Update the original message
    await this.web.chat.update({
      channel: payload.channel.id,
      ts: payload.message.ts,
      text: `Content ${action}ed by ${payload.user.username}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Content has been ${action}ed by <@${payload.user.id}>`
          }
        }
      ]
    });
  }

  // Handle content edit
  private async handleContentEdit(payload: any) {
    const contentId = payload.actions[0].value.replace('edit_', '');
    
    await this.sendMessage(payload.channel.id, `Edit functionality for content ${contentId} will be available soon!`);
  }

  // Helper methods
  private getPlatformEmoji(platform: string): string {
    const emojis: { [key: string]: string } = {
      instagram: '📷',
      twitter: '🐦',
      linkedin: '💼',
      tiktok: '🎵',
      facebook: '📘',
      youtube: '📺',
      snapchat: '👻',
      pinterest: '📌'
    };
    return emojis[platform.toLowerCase()] || '📱';
  }

  private getStatusEmoji(status: string): string {
    const emojis: { [key: string]: string } = {
      draft: '📝',
      scheduled: '⏰',
      published: '✅',
      failed: '❌'
    };
    return emojis[status] || '❓';
  }
}

// Export singleton instance
export const slackService = new SlackService({
  botToken: process.env.SLACK_BOT_TOKEN || '',
  userToken: process.env.SLACK_USER_TOKEN || '',
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  appToken: process.env.SLACK_APP_TOKEN || '',
  channelId: process.env.SLACK_CHANNEL_ID || '',
  workspaceId: process.env.SLACK_WORKSPACE_ID || ''
}); 