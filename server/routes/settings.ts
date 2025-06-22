import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { db } from '../database/index.js';
import { users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  company: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  timezone: z.string().max(50).optional()
});

const updateSubscriptionSchema = z.object({
  subscriptionTier: z.enum(['basic', 'pro', 'enterprise']).optional(),
  subscriptionStatus: z.enum(['active', 'cancelled', 'suspended']).optional()
});

// Get user profile
router.get('/profile', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      company: users.company,
      phone: users.phone,
      timezone: users.timezone,
      subscriptionTier: users.subscriptionTier,
      subscriptionStatus: users.subscriptionStatus,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user[0]
  });
}));

// Update user profile
router.put('/profile', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const updateData = updateProfileSchema.parse(req.body);

  const [updatedUser] = await db
    .update(users)
    .set({
      ...updateData,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      company: users.company,
      phone: users.phone,
      timezone: users.timezone,
      subscriptionTier: users.subscriptionTier,
      subscriptionStatus: users.subscriptionStatus,
      updatedAt: users.updatedAt
    });

  res.json({
    success: true,
    data: updatedUser
  });
}));

// Get subscription info
router.get('/subscription', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;

  const user = await db
    .select({
      subscriptionTier: users.subscriptionTier,
      subscriptionStatus: users.subscriptionStatus,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user[0]
  });
}));

// Update subscription
router.put('/subscription', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const updateData = updateSubscriptionSchema.parse(req.body);

  const [updatedUser] = await db
    .update(users)
    .set({
      ...updateData,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning({
      subscriptionTier: users.subscriptionTier,
      subscriptionStatus: users.subscriptionStatus,
      updatedAt: users.updatedAt
    });

  res.json({
    success: true,
    data: updatedUser
  });
}));

// Get notification settings
router.get('/notifications', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  // Mock notification settings
  const notificationSettings = {
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    campaignAlerts: true,
    earningsAlerts: true,
    platformUpdates: false
  };

  res.json({
    success: true,
    data: notificationSettings
  });
}));

// Update notification settings
router.put('/notifications', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const settings = z.object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    weeklyReports: z.boolean(),
    campaignAlerts: z.boolean(),
    earningsAlerts: z.boolean(),
    platformUpdates: z.boolean()
  }).parse(req.body);

  // In a real implementation, you'd save these to a database
  res.json({
    success: true,
    data: settings
  });
}));

export { router as settingsRoutes }; 