import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { db } from '../database/index.js';
import { campaigns, socialAccounts, affiliateLinks, analytics } from '../../shared/schema.js';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

const router = Router();

// Get dashboard overview data
router.get('/overview', authenticateUser, asyncHandler(async (req, res) => {
  const userId = (req.user as any).id;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get campaign statistics
  const campaignStats = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where status = 'active')`,
      completed: sql<number>`count(*) filter (where status = 'completed')`,
      draft: sql<number>`count(*) filter (where status = 'draft')`
    })
    .from(campaigns)
    .where(eq(campaigns.userId, userId));

  // Get social account statistics
  const socialStats = await db
    .select({
      total: sql<number>`count(*)`,
      connected: sql<number>`count(*) filter (where status = 'connected')`,
      disconnected: sql<number>`count(*) filter (where status = 'disconnected')`
    })
    .from(socialAccounts)
    .where(eq(socialAccounts.userId, userId));

  // Get affiliate link statistics
  const affiliateStats = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where status = 'active')`,
      clicks: sql<number>`sum(clicks)`,
      conversions: sql<number>`sum(conversions)`,
      revenue: sql<number>`sum(revenue)`
    })
    .from(affiliateLinks)
    .where(eq(affiliateLinks.userId, userId));

  // Get recent analytics
  const recentAnalytics = await db
    .select()
    .from(analytics)
    .where(
      and(
        eq(analytics.userId, userId),
        gte(analytics.date, thirtyDaysAgo)
      )
    )
    .orderBy(desc(analytics.date))
    .limit(7);

  res.json({
    success: true,
    data: {
      campaigns: campaignStats[0] || { total: 0, active: 0, completed: 0, draft: 0 },
      socialAccounts: socialStats[0] || { total: 0, connected: 0, disconnected: 0 },
      affiliateLinks: affiliateStats[0] || { total: 0, active: 0, clicks: 0, conversions: 0, revenue: 0 },
      recentAnalytics: recentAnalytics.map(analytic => ({
        date: analytic.date,
        engagement: analytic.engagement,
        reach: analytic.reach,
        clicks: analytic.clicks,
        conversions: analytic.conversions,
        revenue: analytic.revenue
      }))
    }
  });
}));

// Get performance metrics
router.get('/performance', authenticateUser, asyncHandler(async (req, res) => {
  const userId = (req.user as any).id;
  const { period = '30' } = req.query;
  
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

  const performanceData = await db
    .select({
      date: analytics.date,
      engagement: analytics.engagement,
      reach: analytics.reach,
      clicks: analytics.clicks,
      conversions: analytics.conversions,
      revenue: analytics.revenue
    })
    .from(analytics)
    .where(
      and(
        eq(analytics.userId, userId),
        gte(analytics.date, daysAgo)
      )
    )
    .orderBy(analytics.date);

  res.json({
    success: true,
    data: performanceData
  });
}));

// Get top performing content
router.get('/top-content', authenticateUser, asyncHandler(async (req, res) => {
  const userId = (req.user as any).id;
  const { limit = 10 } = req.query;

  const topContent = await db
    .select({
      id: campaigns.id,
      title: campaigns.title,
      platform: campaigns.platform,
      engagement: campaigns.engagement,
      reach: campaigns.reach,
      clicks: campaigns.clicks,
      conversions: campaigns.conversions,
      revenue: campaigns.revenue,
      createdAt: campaigns.createdAt
    })
    .from(campaigns)
    .where(eq(campaigns.userId, userId))
    .orderBy(desc(campaigns.engagement))
    .limit(parseInt(limit as string));

  res.json({
    success: true,
    data: topContent
  });
}));

// Get revenue breakdown
router.get('/revenue-breakdown', authenticateUser, asyncHandler(async (req, res) => {
  const userId = (req.user as any).id;
  const { period = '30' } = req.query;
  
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

  const revenueData = await db
    .select({
      platform: campaigns.platform,
      revenue: sql<number>`sum(${campaigns.revenue})`,
      conversions: sql<number>`sum(${campaigns.conversions})`,
      clicks: sql<number>`sum(${campaigns.clicks})`
    })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.userId, userId),
        gte(campaigns.createdAt, daysAgo)
      )
    )
    .groupBy(campaigns.platform);

  res.json({
    success: true,
    data: revenueData
  });
}));

export { router as dashboardRoutes }; 