import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { db } from '../database/index.js';
import { affiliateLinks, campaigns } from '../../shared/schema.js';
import { eq, and, desc, sql, gte } from 'drizzle-orm';

const router = Router();

// Get earnings overview
router.get('/overview', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { period = '30' } = req.query;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

  // Get total earnings from affiliate links
  const earnings = await db
    .select({
      totalRevenue: sql<number>`sum(revenue)`,
      totalClicks: sql<number>`sum(click_count)`,
      totalConversions: sql<number>`sum(conversion_count)`,
      avgConversionRate: sql<number>`avg(conversion_rate)`
    })
    .from(affiliateLinks)
    .innerJoin(campaigns, eq(affiliateLinks.campaignId, campaigns.id))
    .where(
      and(
        eq(campaigns.userId, userId),
        gte(affiliateLinks.createdAt, daysAgo)
      )
    );

  const overview = earnings[0] || {
    totalRevenue: 0,
    totalClicks: 0,
    totalConversions: 0,
    avgConversionRate: 0
  };

  res.json({
    success: true,
    data: overview
  });
}));

// Get earnings by period
router.get('/by-period', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { period = '30' } = req.query;

  // Mock earnings data by period
  const earningsData = Array.from({ length: parseInt(period as string) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      revenue: Math.random() * 500,
      clicks: Math.floor(Math.random() * 100),
      conversions: Math.floor(Math.random() * 10),
      conversionRate: Math.random() * 0.1
    };
  }).reverse();

  res.json({
    success: true,
    data: earningsData
  });
}));

// Get earnings by platform
router.get('/by-platform', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { period = '30' } = req.query;

  // Mock platform earnings data
  const platformEarnings = [
    { platform: 'instagram', revenue: 2500, percentage: 35 },
    { platform: 'twitter', revenue: 1800, percentage: 25 },
    { platform: 'linkedin', revenue: 1500, percentage: 20 },
    { platform: 'tiktok', revenue: 800, percentage: 10 },
    { platform: 'facebook', revenue: 600, percentage: 10 }
  ];

  res.json({
    success: true,
    data: platformEarnings
  });
}));

// Get top earning campaigns
router.get('/top-campaigns', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { limit = 10 } = req.query;

  const topCampaigns = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      description: campaigns.description,
      status: campaigns.status,
      createdAt: campaigns.createdAt
    })
    .from(campaigns)
    .where(eq(campaigns.userId, userId))
    .orderBy(desc(campaigns.createdAt))
    .limit(parseInt(limit as string));

  res.json({
    success: true,
    data: topCampaigns
  });
}));

export { router as earningsRoutes }; 