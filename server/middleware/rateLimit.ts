import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware
export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // 100 requests per window

  const clientData = rateLimitStore.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    // First request or window expired
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + windowMs
    });
  } else {
    // Increment request count
    clientData.count++;
    
    if (clientData.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }
  }

  // Add rate limit headers
  const remaining = maxRequests - (clientData?.count || 1);
  const resetTime = clientData?.resetTime || (now + windowMs);
  
  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining).toString());
  res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());

  next();
};

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const key = `auth:${req.ip || 'unknown'}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // 5 login attempts per 15 minutes

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return next();
  }

  if (current.count >= maxRequests) {
    return res.status(429).json({
      error: 'Too many authentication attempts',
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    });
  }

  current.count++;
  next();
};

// API rate limiter for external integrations
export const apiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const key = `api:${req.ip || 'unknown'}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 60; // 60 requests per minute

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return next();
  }

  if (current.count >= maxRequests) {
    return res.status(429).json({
      error: 'API rate limit exceeded',
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    });
  }

  current.count++;
  next();
};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute 