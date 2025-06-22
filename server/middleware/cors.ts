import { Request, Response, NextFunction } from 'express';

// CORS middleware
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Allow requests from any origin in development
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL || 'http://localhost:3000']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];

  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
}; 