import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { db } from '../database/index.js';
import { affiliateLinks, products, affiliateNetworks, campaigns } from '../../shared/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createLinkSchema = z.object({
  campaignId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  originalUrl: z.string().url(),
  shortCode: z.string().optional(),
  expiresAt: z.string().datetime().optional()
});

const updateLinkSchema = z.object({
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional()
});

// Create affiliate link
router.post('/links', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { campaignId, productId, originalUrl, shortCode, expiresAt } = createLinkSchema.parse(req.body);

  // Verify campaign belongs to user
  const campaign = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, campaignId),
        eq(campaigns.userId, userId)
      )
    )
    .limit(1);

  if (campaign.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Generate short code if not provided
  const generatedShortCode = shortCode || Math.random().toString(36).substring(2, 8);

  // Create affiliate link
  const [newLink] = await db
    .insert(affiliateLinks)
    .values({
      campaignId,
      productId,
      originalUrl,
      shortCode: generatedShortCode,
      shortUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/r/${generatedShortCode}`,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date()
    })
    .returning();

  res.json({
    success: true,
    data: {
      id: newLink.id,
      shortCode: newLink.shortCode,
      shortUrl: newLink.shortUrl,
      originalUrl: newLink.originalUrl,
      isActive: newLink.isActive,
      expiresAt: newLink.expiresAt
    }
  });
}));

// Get affiliate links
router.get('/links', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { campaignId, limit = 20 } = req.query;

  let query = db
    .select({
      id: affiliateLinks.id,
      shortCode: affiliateLinks.shortCode,
      shortUrl: affiliateLinks.shortUrl,
      originalUrl: affiliateLinks.originalUrl,
      isActive: affiliateLinks.isActive,
      isExpired: affiliateLinks.isExpired,
      expiresAt: affiliateLinks.expiresAt,
      clickCount: affiliateLinks.clickCount,
      conversionCount: affiliateLinks.conversionCount,
      revenue: affiliateLinks.revenue,
      conversionRate: affiliateLinks.conversionRate,
      createdAt: affiliateLinks.createdAt
    })
    .from(affiliateLinks)
    .innerJoin(campaigns, eq(affiliateLinks.campaignId, campaigns.id))
    .where(eq(campaigns.userId, userId));

  if (campaignId) {
    query = query.where(eq(affiliateLinks.campaignId, campaignId as string));
  }

  const links = await query
    .orderBy(desc(affiliateLinks.createdAt))
    .limit(parseInt(limit as string));

  res.json({
    success: true,
    data: links
  });
}));

// Update affiliate link
router.put('/links/:id', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { id } = req.params;
  const updateData = updateLinkSchema.parse(req.body);

  // Verify link belongs to user
  const existingLink = await db
    .select()
    .from(affiliateLinks)
    .innerJoin(campaigns, eq(affiliateLinks.campaignId, campaigns.id))
    .where(
      and(
        eq(affiliateLinks.id, id),
        eq(campaigns.userId, userId)
      )
    )
    .limit(1);

  if (existingLink.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Affiliate link not found'
    });
  }

  // Update link
  const [updatedLink] = await db
    .update(affiliateLinks)
    .set({
      ...updateData,
      expiresAt: updateData.expiresAt ? new Date(updateData.expiresAt) : undefined,
      updatedAt: new Date()
    })
    .where(eq(affiliateLinks.id, id))
    .returning();

  res.json({
    success: true,
    data: {
      id: updatedLink.id,
      isActive: updatedLink.isActive,
      expiresAt: updatedLink.expiresAt
    }
  });
}));

// Delete affiliate link
router.delete('/links/:id', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { id } = req.params;

  // Verify link belongs to user
  const existingLink = await db
    .select()
    .from(affiliateLinks)
    .innerJoin(campaigns, eq(affiliateLinks.campaignId, campaigns.id))
    .where(
      and(
        eq(affiliateLinks.id, id),
        eq(campaigns.userId, userId)
      )
    )
    .limit(1);

  if (existingLink.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Affiliate link not found'
    });
  }

  // Delete link
  await db
    .delete(affiliateLinks)
    .where(eq(affiliateLinks.id, id));

  res.json({
    success: true,
    message: 'Affiliate link deleted successfully'
  });
}));

// Get affiliate link analytics
router.get('/links/:id/analytics', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { id } = req.params;
  const { period = '30' } = req.query;

  // Verify link belongs to user
  const existingLink = await db
    .select()
    .from(affiliateLinks)
    .innerJoin(campaigns, eq(affiliateLinks.campaignId, campaigns.id))
    .where(
      and(
        eq(affiliateLinks.id, id),
        eq(campaigns.userId, userId)
      )
    )
    .limit(1);

  if (existingLink.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Affiliate link not found'
    });
  }

  const link = existingLink[0].affiliateLinks;

  // For now, return basic analytics from the link record
  // In a full implementation, you'd query the clicks table for detailed analytics
  const analytics = {
    totalClicks: link.clickCount || 0,
    totalConversions: link.conversionCount || 0,
    conversionRate: link.conversionRate || 0,
    totalRevenue: link.revenue || 0,
    geographicData: link.geographicData || {},
    deviceData: link.deviceData || {},
    fraudScore: link.fraudScore || 0
  };

  res.json({
    success: true,
    data: analytics
  });
}));

// Get affiliate networks
router.get('/networks', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;

  const networks = await db
    .select({
      id: affiliateNetworks.id,
      network: affiliateNetworks.network,
      networkId: affiliateNetworks.networkId,
      isActive: affiliateNetworks.isActive,
      commissionRate: affiliateNetworks.commissionRate,
      totalEarnings: affiliateNetworks.totalEarnings,
      lastSyncAt: affiliateNetworks.lastSyncAt,
      createdAt: affiliateNetworks.createdAt
    })
    .from(affiliateNetworks)
    .where(eq(affiliateNetworks.userId, userId))
    .orderBy(desc(affiliateNetworks.createdAt));

  res.json({
    success: true,
    data: networks
  });
}));

// Get products from networks
router.get('/products', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { networkId, category, limit = 20 } = req.query;

  let query = db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      category: products.category,
      price: products.price,
      commission: products.commission,
      commissionRate: products.commissionRate,
      imageUrl: products.imageUrl,
      productUrl: products.productUrl,
      isActive: products.isActive,
      gravity: products.gravity,
      conversionRate: products.conversionRate,
      createdAt: products.createdAt
    })
    .from(products)
    .innerJoin(affiliateNetworks, eq(products.networkId, affiliateNetworks.id))
    .where(
      and(
        eq(affiliateNetworks.userId, userId),
        eq(products.isActive, true)
      )
    );

  if (networkId) {
    query = query.where(eq(products.networkId, networkId as string));
  }

  if (category) {
    query = query.where(eq(products.category, category as string));
  }

  const productsList = await query
    .orderBy(desc(products.gravity))
    .limit(parseInt(limit as string));

  res.json({
    success: true,
    data: productsList
  });
}));

export { router as affiliateRoutes }; 