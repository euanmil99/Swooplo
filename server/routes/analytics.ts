import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { db } from '../database/index.js';
import { campaigns, affiliateLinks, clicks } from '../../shared/schema.js';
import { eq, and, desc, sql, gte } from 'drizzle-orm';

const router = Router();

// Get overall analytics
router.get('/overview', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { period = '30' } = req.query;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

  // Get campaign statistics
  const campaignStats = await db
    .select({
      totalCampaigns: sql<number>`count(*)`,
      activeCampaigns: sql<number>`count(*) filter (where status = 'active')`,
      totalRevenue: sql<number>`sum(cast(performance_metrics->>'revenue' as decimal))`,
      totalClicks: sql<number>`sum(cast(performance_metrics->>'clicks' as integer))`,
      totalConversions: sql<number>`sum(cast(performance_metrics->>'conversions' as integer))`
    })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.userId, userId),
        gte(campaigns.createdAt, daysAgo)
      )
    );

  // Get affiliate link statistics
  const linkStats = await db
    .select({
      totalLinks: sql<number>`count(*)`,
      activeLinks: sql<number>`count(*) filter (where is_active = true)`,
      totalClicks: sql<number>`sum(click_count)`,
      totalConversions: sql<number>`sum(conversion_count)`,
      totalRevenue: sql<number>`sum(revenue)`
    })
    .from(affiliateLinks)
    .innerJoin(campaigns, eq(affiliateLinks.campaignId, campaigns.id))
    .where(
      and(
        eq(campaigns.userId, userId),
        gte(affiliateLinks.createdAt, daysAgo)
      )
    );

  const overview = {
    campaigns: campaignStats[0] || {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalRevenue: 0,
      totalClicks: 0,
      totalConversions: 0
    },
    links: linkStats[0] || {
      totalLinks: 0,
      activeLinks: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0
    }
  };

  res.json({
    success: true,
    data: overview
  });
}));

// Get performance trends
router.get('/trends', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { period = '30', metric = 'revenue' } = req.query;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

  // For now, return mock trend data
  // In a full implementation, you'd aggregate data by date
  const trends = Array.from({ length: parseInt(period as string) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      revenue: Math.random() * 1000,
      clicks: Math.floor(Math.random() * 100),
      conversions: Math.floor(Math.random() * 10),
      engagement: Math.random() * 100
    };
  }).reverse();

  res.json({
    success: true,
    data: trends
  });
}));

// Get platform performance
router.get('/platforms', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { period = '30' } = req.query;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

  // Mock platform performance data
  const platforms = [
    { platform: 'instagram', revenue: 2500, clicks: 1500, conversions: 75, engagement: 85 },
    { platform: 'twitter', revenue: 1800, clicks: 1200, conversions: 60, engagement: 70 },
    { platform: 'linkedin', revenue: 3200, clicks: 800, conversions: 40, engagement: 90 },
    { platform: 'tiktok', revenue: 1500, clicks: 2000, conversions: 50, engagement: 95 },
    { platform: 'facebook', revenue: 1200, clicks: 900, conversions: 45, engagement: 65 }
  ];

  res.json({
    success: true,
    data: platforms
  });
}));

// Get geographic performance
router.get('/geographic', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { period = '30' } = req.query;

  // Mock geographic data
  const geographic = [
    { country: 'US', revenue: 4500, clicks: 2500, conversions: 125 },
    { country: 'UK', revenue: 2800, clicks: 1500, conversions: 75 },
    { country: 'CA', revenue: 1800, clicks: 1000, conversions: 50 },
    { country: 'AU', revenue: 1200, clicks: 800, conversions: 40 },
    { country: 'DE', revenue: 900, clicks: 600, conversions: 30 }
  ];

  res.json({
    success: true,
    data: geographic
  });
}));

// Get device performance
router.get('/devices', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { period = '30' } = req.query;

  // Mock device data
  const devices = [
    { device: 'mobile', revenue: 3500, clicks: 2000, conversions: 100, percentage: 60 },
    { device: 'desktop', revenue: 2500, clicks: 1200, conversions: 60, percentage: 30 },
    { device: 'tablet', revenue: 800, clicks: 500, conversions: 25, percentage: 10 }
  ];

  res.json({
    success: true,
    data: devices
  });
}));

// Get top performing content
router.get('/top-content', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { limit = 10 } = req.query;

  const topContent = await db
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
    data: topContent
  });
}));

export { router as analyticsRoutes }; 