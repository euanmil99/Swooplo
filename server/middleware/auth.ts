import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/index.js';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Local strategy for passport
passport.use(new (require('passport-local').Strategy)(
  async (email: string, password: string, done: any) => {
    try {
      const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (user.length === 0) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const isValidPassword = await bcrypt.compare(password, user[0].passwordHash);
      
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      return done(null, user[0]);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    done(null, user[0] || null);
  } catch (error) {
    done(error);
  }
});

// Authentication middleware
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key') as any;

    // Get user from database
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Optional authentication middleware
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    req.user = req.user || req.session?.user;
  }
  next();
};

// Admin authentication middleware
export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = req.user || req.session?.user;
  
  if (req.user.subscriptionTier !== 'enterprise') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// Subscription tier middleware
export const requireSubscriptionTier = (requiredTier: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const tierHierarchy = {
      'basic': 1,
      'pro': 2,
      'enterprise': 3
    };

    const userTier = tierHierarchy[user.subscriptionTier as keyof typeof tierHierarchy] || 0;
    const requiredTierLevel = tierHierarchy[requiredTier as keyof typeof tierHierarchy] || 0;

    if (userTier < requiredTierLevel) {
      return res.status(403).json({
        success: false,
        message: `This feature requires ${requiredTier} subscription or higher`
      });
    }

    next();
  };
};

// JWT token generation
export const generateToken = (user: any) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      subscriptionTier: user.subscriptionTier 
    },
    process.env.JWT_SECRET || 'your-jwt-secret',
    { expiresIn: '24h' }
  );
};

// JWT token verification
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
  } catch (error) {
    return null;
  }
};

// API key authentication middleware
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // In a real implementation, you would validate the API key against the database
  // For now, we'll use a simple check
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};

// Admin middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user is admin (you can add an isAdmin field to your users table)
  if (user.subscriptionTier !== 'enterprise') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Rate limiting middleware (basic implementation)
export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // In a production environment, you'd use a proper rate limiting library
  // like express-rate-limit or implement Redis-based rate limiting
  
  // For now, we'll just pass through
  next();
}; 