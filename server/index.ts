import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

// Import routes
import { authRoutes } from './routes/auth.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { socialRoutes } from './routes/social.js';
import { affiliateRoutes } from './routes/affiliate.js';
import { campaignRoutes } from './routes/campaigns.js';
import { analyticsRoutes } from './routes/analytics.js';
import { earningsRoutes } from './routes/earnings.js';
import { settingsRoutes } from './routes/settings.js';
import { webhookRoutes } from './routes/webhooks.js';
import { aiRoutes } from './routes/ai.js';
import { slackRoutes } from './routes/slack.js';

// Import middleware
import { authenticateUser } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { corsMiddleware } from './middleware/cors.js';

// Import database
import { db } from './database/index.js';

// Import types
import type { Request, Response, NextFunction } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const port = process.env.PORT || 5000;

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server });

// Session store
const PgSession = connectPgSimple(session);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(corsMiddleware);

// Session configuration
app.use(session({
  store: new PgSession({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
    tableName: 'sessions',
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
app.use(rateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authenticateUser, dashboardRoutes);
app.use('/api/social', authenticateUser, socialRoutes);
app.use('/api/affiliate', authenticateUser, affiliateRoutes);
app.use('/api/campaigns', authenticateUser, campaignRoutes);
app.use('/api/analytics', authenticateUser, analyticsRoutes);
app.use('/api/earnings', authenticateUser, earningsRoutes);
app.use('/api/settings', authenticateUser, settingsRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/ai', authenticateUser, aiRoutes);
app.use('/api/slack', slackRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// WebSocket connection handling
wss.on('connection', (ws: any, req: any) => {
  console.log('New WebSocket connection');
  
  // Handle authentication for WebSocket connections
  const session = req.session as any;
  if (!session?.user) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  // Store user ID with WebSocket connection
  ws.userId = session.user.id;

  ws.on('message', (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('WebSocket message:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'subscribe_analytics':
          // Subscribe to real-time analytics updates
          ws.subscribedToAnalytics = true;
          break;
        case 'unsubscribe_analytics':
          // Unsubscribe from analytics updates
          ws.subscribedToAnalytics = false;
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });
});

// Function to broadcast to specific users
export const broadcastToUser = (userId: string, data: any) => {
  wss.clients.forEach((client: any) => {
    if (client.userId === userId && client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
};

// Function to broadcast analytics updates
export const broadcastAnalytics = (data: any) => {
  wss.clients.forEach((client: any) => {
    if (client.subscribedToAnalytics && client.readyState === 1) {
      client.send(JSON.stringify({
        type: 'analytics_update',
        data
      }));
    }
  });
};

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist/public')));
  
  // Handle client-side routing
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(port, () => {
  console.log(`🚀 Social Affiliate Pro server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server, wss }; 