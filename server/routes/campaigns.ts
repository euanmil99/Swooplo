import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { db } from '../database/index.js';
import { campaigns } from '../../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  productId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  targetPlatforms: z.array(z.string()).optional(),
  targetAudience: z.record(z.any()).optional(),
  contentStrategy: z.record(z.any()).optional(),
  isAbtesting: z.boolean().optional()
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  targetPlatforms: z.array(z.string()).optional(),
  targetAudience: z.record(z.any()).optional(),
  contentStrategy: z.record(z.any()).optional(),
  isAbtesting: z.boolean().optional()
});

// Create campaign
router.post('/', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const campaignData = createCampaignSchema.parse(req.body);

  const [newCampaign] = await db
    .insert(campaigns)
    .values({
      userId,
      ...campaignData,
      startDate: campaignData.startDate ? new Date(campaignData.startDate) : null,
      endDate: campaignData.endDate ? new Date(campaignData.endDate) : null,
      createdAt: new Date()
    })
    .returning();

  res.json({
    success: true,
    data: {
      id: newCampaign.id,
      name: newCampaign.name,
      status: newCampaign.status,
      createdAt: newCampaign.createdAt
    }
  });
}));

// Get campaigns
router.get('/', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { status, limit = 20 } = req.query;

  let query = db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId));

  if (status) {
    query = query.where(eq(campaigns.status, status as string));
  }

  const campaignsList = await query
    .orderBy(desc(campaigns.createdAt))
    .limit(parseInt(limit as string));

  res.json({
    success: true,
    data: campaignsList
  });
}));

// Get campaign by ID
router.get('/:id', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { id } = req.params;

  const campaign = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, id),
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

  res.json({
    success: true,
    data: campaign[0]
  });
}));

// Update campaign
router.put('/:id', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { id } = req.params;
  const updateData = updateCampaignSchema.parse(req.body);

  // Verify campaign belongs to user
  const existingCampaign = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, id),
        eq(campaigns.userId, userId)
      )
    )
    .limit(1);

  if (existingCampaign.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Update campaign
  const [updatedCampaign] = await db
    .update(campaigns)
    .set({
      ...updateData,
      startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
      endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
      updatedAt: new Date()
    })
    .where(eq(campaigns.id, id))
    .returning();

  res.json({
    success: true,
    data: updatedCampaign
  });
}));

// Delete campaign
router.delete('/:id', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { id } = req.params;

  // Verify campaign belongs to user
  const existingCampaign = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, id),
        eq(campaigns.userId, userId)
      )
    )
    .limit(1);

  if (existingCampaign.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Delete campaign
  await db
    .delete(campaigns)
    .where(eq(campaigns.id, id));

  res.json({
    success: true,
    message: 'Campaign deleted successfully'
  });
}));

export { router as campaignRoutes }; 