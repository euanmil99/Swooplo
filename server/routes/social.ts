import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { db } from '../database/index.js';
import { socialAccounts, campaigns } from '../../shared/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Validation schemas
const connectAccountSchema = z.object({
  platform: z.enum(['instagram', 'twitter', 'linkedin', 'tiktok', 'facebook', 'youtube']),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  accountId: z.string(),
  accountName: z.string()
});

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  platform: z.enum(['instagram', 'twitter', 'linkedin', 'tiktok', 'facebook', 'youtube']),
  mediaUrls: z.array(z.string().url()).optional(),
  scheduledAt: z.string().datetime().optional(),
  campaignId: z.string().optional()
});

// Connect social media account
router.post('/connect', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { platform, accessToken, refreshToken, accountId, accountName } = connectAccountSchema.parse(req.body);

  // Check if account already exists
  const existingAccount = await db
    .select()
    .from(socialAccounts)
    .where(
      and(
        eq(socialAccounts.userId, userId),
        eq(socialAccounts.platform, platform),
        eq(socialAccounts.accountId, accountId)
      )
    );

  if (existingAccount.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Account already connected'
    });
  }

  // Insert new account
  const [newAccount] = await db
    .insert(socialAccounts)
    .values({
      userId,
      platform,
      accessToken,
      refreshToken,
      accountId,
      accountName,
      isActive: true,
      createdAt: new Date()
    })
    .returning();

  res.json({
    success: true,
    data: {
      id: newAccount.id,
      platform: newAccount.platform,
      accountName: newAccount.accountName,
      isActive: newAccount.isActive
    }
  });
}));

// Get connected accounts
router.get('/accounts', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;

  const accounts = await db
    .select({
      id: socialAccounts.id,
      platform: socialAccounts.platform,
      accountName: socialAccounts.accountName,
      isActive: socialAccounts.isActive,
      createdAt: socialAccounts.createdAt,
      lastSyncAt: socialAccounts.lastSyncAt
    })
    .from(socialAccounts)
    .where(eq(socialAccounts.userId, userId))
    .orderBy(desc(socialAccounts.createdAt));

  res.json({
    success: true,
    data: accounts
  });
}));

// Disconnect account
router.delete('/accounts/:id', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { id } = req.params;

  const deletedAccount = await db
    .delete(socialAccounts)
    .where(
      and(
        eq(socialAccounts.id, id),
        eq(socialAccounts.userId, userId)
      )
    )
    .returning();

  if (deletedAccount.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Account not found'
    });
  }

  res.json({
    success: true,
    message: 'Account disconnected successfully'
  });
}));

// Create and schedule post
router.post('/post', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { content, platform, mediaUrls, scheduledAt, campaignId } = createPostSchema.parse(req.body);

  // Check if account is connected
  const account = await db
    .select()
    .from(socialAccounts)
    .where(
      and(
        eq(socialAccounts.userId, userId),
        eq(socialAccounts.platform, platform),
        eq(socialAccounts.isActive, true)
      )
    )
    .limit(1);

  if (account.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No connected account found for this platform'
    });
  }

  // Create campaign entry
  const [newCampaign] = await db
    .insert(campaigns)
    .values({
      userId,
      name: content.substring(0, 50) + '...',
      description: content,
      status: scheduledAt ? 'draft' : 'draft', // Using draft status for now
      createdAt: new Date()
    })
    .returning();

  // If immediate posting (no scheduledAt), trigger posting logic here
  if (!scheduledAt) {
    // TODO: Implement actual social media posting logic
    // This would integrate with platform APIs
    console.log(`Posting to ${platform}: ${content}`);
  }

  res.json({
    success: true,
    data: {
      id: newCampaign.id,
      status: newCampaign.status
    }
  });
}));

// Get posting history
router.get('/history', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { platform, limit = 20 } = req.query;

  let query = db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      description: campaigns.description,
      status: campaigns.status,
      createdAt: campaigns.createdAt,
      updatedAt: campaigns.updatedAt
    })
    .from(campaigns)
    .where(eq(campaigns.userId, userId));

  const history = await query
    .orderBy(desc(campaigns.createdAt))
    .limit(parseInt(limit as string));

  res.json({
    success: true,
    data: history
  });
}));

// Get platform-specific insights
router.get('/insights/:platform', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { platform } = req.params;
  const { period = '30' } = req.query;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

  // For now, return mock data since we don't have engagement metrics in the current schema
  const insights = {
    totalPosts: 0,
    totalEngagement: 0,
    totalReach: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    avgEngagement: 0,
    avgReach: 0
  };

  res.json({
    success: true,
    data: insights
  });
}));

export { router as socialRoutes }; 