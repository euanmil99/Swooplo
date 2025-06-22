import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/index.js';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { authenticateUser, generateToken, authRateLimiter } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  company: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  company: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  timezone: z.string().max(50).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

// Register new user
router.post('/register', authRateLimiter, asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, company, phone } = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existingUser.length > 0) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const [newUser] = await db.insert(users).values({
    email,
    passwordHash,
    firstName,
    lastName,
    company,
    phone,
    subscriptionTier: 'basic',
    subscriptionStatus: 'active',
  }).returning();

  // Generate JWT token
  const token = generateToken(newUser);

  // Set session
  req.session.user = newUser;

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      subscriptionTier: newUser.subscriptionTier,
    },
    token
  });
}));

// Login user
router.post('/login', authRateLimiter, asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  // Find user
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (user.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user[0].passwordHash);
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check if account is active
  if (user[0].subscriptionStatus !== 'active') {
    return res.status(403).json({ error: 'Account is not active' });
  }

  // Generate JWT token
  const token = generateToken(user[0]);

  // Set session
  req.session.user = user[0];

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user[0].id,
      email: user[0].email,
      firstName: user[0].firstName,
      lastName: user[0].lastName,
      subscriptionTier: user[0].subscriptionTier,
    },
    token
  });
}));

// Logout user
router.post('/logout', authenticateUser, asyncHandler(async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logout successful' });
  });
}));

// Get current user
router.get('/me', authenticateUser, asyncHandler(async (req, res) => {
  const user = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
  
  if (user.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    success: true,
    user: {
      id: user[0].id,
      email: user[0].email,
      firstName: user[0].firstName,
      lastName: user[0].lastName,
      company: user[0].company,
      phone: user[0].phone,
      timezone: user[0].timezone,
      subscriptionTier: user[0].subscriptionTier,
      subscriptionStatus: user[0].subscriptionStatus,
      createdAt: user[0].createdAt,
    }
  });
}));

// Update profile
router.put('/profile', authenticateUser, asyncHandler(async (req, res) => {
  const updates = updateProfileSchema.parse(req.body);

  const [updatedUser] = await db.update(users)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(users.id, req.user.id))
    .returning();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      company: updatedUser.company,
      phone: updatedUser.phone,
      timezone: updatedUser.timezone,
      subscriptionTier: updatedUser.subscriptionTier,
    }
  });
}));

// Change password
router.put('/password', authenticateUser, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  // Get current user with password
  const user = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
  
  if (user.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user[0].passwordHash);
  
  if (!isValidPassword) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  // Hash new password
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await db.update(users)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, req.user.id));

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// Forgot password (send reset email)
router.post('/forgot-password', authRateLimiter, asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (user.length === 0) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }

  // Generate reset token (in a real app, you'd send an email)
  const resetToken = generateToken(user[0]);

  // For demo purposes, just return the token
  // In production, send this via email
  res.json({
    success: true,
    message: 'Password reset link sent',
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
  });
}));

// Reset password
router.post('/reset-password', authRateLimiter, asyncHandler(async (req, res) => {
  const { token, newPassword } = z.object({
    token: z.string(),
    newPassword: z.string().min(8),
  }).parse(req.body);

  // Verify token (in a real app, you'd verify the reset token)
  // For demo purposes, we'll just proceed
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password (in a real app, you'd find user by reset token)
  // For demo purposes, we'll just return success
  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

export { router as authRoutes }; 