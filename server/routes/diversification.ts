import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser, requireSubscriptionTier } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { MarketplaceService } from '../services/affiliateMarketplace.js';
import { DistributionNetworkService } from '../services/distributionNetwork.js';
import { ProductStrategyService } from '../services/productStrategy.js';
import { localAI } from '../services/localai.js';

const router = Router();
const marketplaceService = new MarketplaceService();
const distributionService = new DistributionNetworkService(localAI);
const productStrategyService = new ProductStrategyService();

// Validation schemas
const connectMarketplaceSchema = z.object({
  network: z.enum(['clickbank', 'amazon', 'shareasale', 'commissionjunction', 'rakuten', 'awin']),
  credentials: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    networkId: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })
});

const syncMarketplaceSchema = z.object({
  network: z.string().optional() // If not provided, sync all marketplaces
});

const distributionCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  productId: z.string().uuid(),
  content: z.string().min(10).max(10000),
  platforms: z.array(z.string()).min(1).max(10),
  schedule: z.enum(['immediate', 'scheduled']),
  scheduledTime: z.date().optional()
});

const productMixSchema = z.object({
  strategy: z.enum(['balanced', 'high_commission', 'high_conversion']),
  productCount: z.number().min(1).max(100),
  categories: z.array(z.string()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minCommissionRate: z.number().min(0).max(100).optional(),
  maxCommissionRate: z.number().min(0).max(100).optional()
});

// Helper functions for overview calculations
function calculateDiversificationScore(data: any): number {
  let score = 0;
  
  // Marketplace diversity (30 points)
  const marketplaceCount = data.connectedMarketplaces;
  score += Math.min(marketplaceCount * 5, 30);
  
  // Distribution diversity (25 points)
  const distributionCount = data.distributionCampaigns.length;
  score += Math.min(distributionCount * 5, 25);
  
  // Product diversity (25 points)
  const productCount = data.trendingProducts.length;
  score += Math.min(productCount * 5, 25);
  
  // Performance diversity (20 points)
  const hasGoodPerformance = data.marketplaceStats.totalEarnings > 100;
  score += hasGoodPerformance ? 20 : 10;
  
  return Math.min(score, 100);
}

function generateDiversificationRecommendations(data: any): string[] {
  const recommendations = [];
  
  if (data.connectedMarketplaces < 3) {
    recommendations.push('Connect to more affiliate marketplaces to diversify your income sources');
  }
  
  if (data.distributionCampaigns.length < 2) {
    recommendations.push('Create more distribution campaigns to reach different audiences');
  }
  
  if (data.trendingProducts.length < 5) {
    recommendations.push('Add more trending products to your portfolio for better performance');
  }
  
  if (data.marketplaceStats.totalEarnings < 100) {
    recommendations.push('Focus on high-converting products to increase your earnings');
  }
  
  return recommendations;
}

// Marketplace Management Routes

// Connect to a new marketplace
router.post('/marketplace/connect',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { network, credentials } = connectMarketplaceSchema.parse(req.body);
    const userId = req.user.id;

    const connection = await marketplaceService.connectMarketplace(userId, network, credentials);

    res.json({
      success: true,
      data: {
        connection,
        message: `Successfully connected to ${network}`
      }
    });
  })
);

// Get connected marketplaces
router.get('/marketplace/connections',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const connections = await marketplaceService.getConnectedMarketplaces(userId);

    res.json({
      success: true,
      data: connections
    });
  })
);

// Sync marketplace products
router.post('/marketplace/sync',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { network } = syncMarketplaceSchema.parse(req.body);
    const userId = req.user.id;

    let result;
    if (network) {
      result = await marketplaceService.syncMarketplaceProducts(userId, network);
    } else {
      result = await marketplaceService.syncAllMarketplaces(userId);
    }

    res.json({
      success: true,
      data: result,
      message: network 
        ? `Synced products from ${network}`
        : 'Synced products from all connected marketplaces'
    });
  })
);

// Disconnect marketplace
router.delete('/marketplace/disconnect/:network',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { network } = req.params;
    const userId = req.user.id;

    const result = await marketplaceService.disconnectMarketplace(userId, network);

    res.json({
      success: true,
      data: result
    });
  })
);

// Get marketplace statistics
router.get('/marketplace/stats',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const stats = await marketplaceService.getMarketplaceStats(userId);

    res.json({
      success: true,
      data: stats
    });
  })
);

// Distribution Network Routes

// Get available distribution platforms
router.get('/distribution/platforms',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const platforms = distributionService.getAvailablePlatforms();

    res.json({
      success: true,
      data: platforms
    });
  })
);

// Create distribution campaign
router.post('/distribution/campaign',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const campaignData = distributionCampaignSchema.parse(req.body);
    const userId = req.user.id;

    const campaignId = await distributionService.createDistributionCampaign(userId, campaignData);

    res.json({
      success: true,
      data: {
        campaignId,
        message: 'Distribution campaign created successfully'
      }
    });
  })
);

// Get user's distribution campaigns
router.get('/distribution/campaigns',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const campaigns = await distributionService.getUserCampaigns(userId);

    res.json({
      success: true,
      data: campaigns
    });
  })
);

// Get campaign statistics
router.get('/distribution/campaign/:campaignId/stats',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const stats = await distributionService.getCampaignStats(campaignId);

    res.json({
      success: true,
      data: stats
    });
  })
);

// Process pending distributions (admin/automated endpoint)
router.post('/distribution/process',
  authenticateUser,
  requireSubscriptionTier('enterprise'),
  asyncHandler(async (req, res) => {
    const processedCount = await distributionService.processDistributions();

    res.json({
      success: true,
      data: {
        processedCount,
        message: `Processed ${processedCount} distributions`
      }
    });
  })
);

// Product Strategy Routes

// Generate optimized product mix
router.post('/product-strategy/mix',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const options = productMixSchema.parse(req.body);
    const userId = req.user.id;

    const result = await productStrategyService.generateProductMix(userId, options);

    res.json({
      success: true,
      data: result
    });
  })
);

// Analyze product performance
router.get('/product-strategy/analysis',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const analysis = await productStrategyService.analyzeProductPerformance(userId);

    res.json({
      success: true,
      data: analysis
    });
  })
);

// Get product mix recommendations
router.get('/product-strategy/recommendations',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const recommendations = await productStrategyService.getProductMixRecommendations(userId);

    res.json({
      success: true,
      data: recommendations
    });
  })
);

// Get trending products
router.get('/product-strategy/trending',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const trendingProducts = await productStrategyService.getTrendingProducts(userId, limit);

    res.json({
      success: true,
      data: trendingProducts
    });
  })
);

// Combined Diversification Dashboard

// Get comprehensive diversification overview
router.get('/overview',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get all diversification data
    const [marketplaceStats, connectedMarketplaces, distributionCampaigns, trendingProducts] = await Promise.all([
      marketplaceService.getMarketplaceStats(userId),
      marketplaceService.getConnectedMarketplaces(userId),
      distributionService.getUserCampaigns(userId),
      productStrategyService.getTrendingProducts(userId, 5)
    ]);

    // Calculate diversification score
    const diversificationScore = calculateDiversificationScore({
      marketplaceStats,
      connectedMarketplaces,
      distributionCampaigns,
      trendingProducts
    });

    const overview = {
      diversificationScore,
      marketplaceStats,
      connectedMarketplaces: connectedMarketplaces.length,
      activeDistributionCampaigns: distributionCampaigns.filter(c => c.status === 'active').length,
      trendingProducts: trendingProducts.length,
      recommendations: generateDiversificationRecommendations({
        marketplaceStats,
        connectedMarketplaces,
        distributionCampaigns,
        trendingProducts
      })
    };

    res.json({
      success: true,
      data: overview
    });
  })
);

export { router as diversificationRoutes }; 