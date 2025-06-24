import { db } from '../database/index.js';
import { products, campaigns, clicks, conversions } from '../../shared/schema.js';
import { eq, and, inArray, desc, asc, sql } from 'drizzle-orm';

export interface ProductMixOptions {
  strategy: 'balanced' | 'high_commission' | 'high_conversion';
  productCount: number;
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  minCommissionRate?: number;
  maxCommissionRate?: number;
}

export interface ProductMixResult {
  recommendationId: string;
  strategy: string;
  products: ProductWithMetrics[];
  totalEstimatedRevenue: number;
  averageCommissionRate: number;
  averageConversionRate: number;
  riskScore: number; // 0-100, lower is better
}

export interface ProductWithMetrics {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  commissionRate: number;
  conversionRate: number;
  gravity?: number;
  imageUrl?: string;
  productUrl: string;
  estimatedEPC: number; // Estimated earnings per click
  riskAdjustedValue: number;
  performanceScore: number; // 0-100
}

export interface ProductPerformanceAnalysis {
  product: any;
  metrics: {
    clicks: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
    averageOrderValue: number;
    epc: number; // Earnings per click
    roi: number; // Return on investment
  };
  recommendations: string[];
  performanceTier: 'excellent' | 'good' | 'average' | 'poor';
}

export class ProductStrategyService {
  
  // Generate optimized product mix based on user goals
  async generateProductMix(userId: string, options: ProductMixOptions): Promise<ProductMixResult> {
    try {
      // Build query for available products
      let query = db.select()
        .from(products)
        .where(and(
          eq(products.isActive, true),
          sql`${products.networkId} IN (
            SELECT id FROM affiliate_networks 
            WHERE user_id = ${userId} AND is_active = true
          )`
        ));

      // Apply category filter if provided
      if (options.categories && options.categories.length > 0) {
        query = query.where(inArray(products.category, options.categories));
      }

      // Apply price filters if provided
      if (options.minPrice !== undefined) {
        query = query.where(sql`${products.price} >= ${options.minPrice}`);
      }
      if (options.maxPrice !== undefined) {
        query = query.where(sql`${products.price} <= ${options.maxPrice}`);
      }

      // Apply commission rate filters if provided
      if (options.minCommissionRate !== undefined) {
        query = query.where(sql`${products.commissionRate} >= ${options.minCommissionRate}`);
      }
      if (options.maxCommissionRate !== undefined) {
        query = query.where(sql`${products.commissionRate} <= ${options.maxCommissionRate}`);
      }

      // Get all available products
      const availableProducts = await query;

      // Calculate performance metrics for each product
      const productsWithMetrics = await Promise.all(
        availableProducts.map(async (product) => {
          const metrics = await this.calculateProductMetrics(product.id);
          return {
            ...product,
            estimatedEPC: this.calculateEstimatedEPC(product, metrics),
            riskAdjustedValue: this.calculateRiskAdjustedValue(product, metrics),
            performanceScore: this.calculatePerformanceScore(product, metrics)
          };
        })
      );

      // Sort based on strategy
      let sortedProducts = productsWithMetrics;
      switch (options.strategy) {
        case 'high_commission':
          sortedProducts = productsWithMetrics.sort((a, b) => b.commissionRate - a.commissionRate);
          break;
        case 'high_conversion':
          sortedProducts = productsWithMetrics.sort((a, b) => b.conversionRate - a.conversionRate);
          break;
        case 'balanced':
        default:
          sortedProducts = productsWithMetrics.sort((a, b) => b.riskAdjustedValue - a.riskAdjustedValue);
      }

      // Select top N products
      const selectedProducts = sortedProducts.slice(0, options.productCount);

      // Calculate mix statistics
      const totalEstimatedRevenue = selectedProducts.reduce((sum, p) => sum + p.estimatedEPC, 0);
      const averageCommissionRate = selectedProducts.reduce((sum, p) => sum + p.commissionRate, 0) / selectedProducts.length;
      const averageConversionRate = selectedProducts.reduce((sum, p) => sum + p.conversionRate, 0) / selectedProducts.length;
      const riskScore = this.calculateMixRiskScore(selectedProducts);

      // Save recommendation
      const recommendationId = await this.saveRecommendation(userId, options, selectedProducts.map(p => p.id));

      return {
        recommendationId,
        strategy: options.strategy,
        products: selectedProducts,
        totalEstimatedRevenue,
        averageCommissionRate,
        averageConversionRate,
        riskScore
      };
    } catch (error) {
      console.error('Error generating product mix:', error);
      throw new Error('Failed to generate product mix');
    }
  }

  // Calculate product performance metrics
  private async calculateProductMetrics(productId: string) {
    try {
      // Get click and conversion data for the product
      const clickData = await db.select({
        totalClicks: sql<number>`COUNT(${clicks.id})`,
        totalConversions: sql<number>`COUNT(${conversions.id})`,
        totalRevenue: sql<number>`COALESCE(SUM(${conversions.amount}), 0)`,
        totalCommission: sql<number>`COALESCE(SUM(${conversions.commission}), 0)`
      })
      .from(clicks)
      .leftJoin(conversions, eq(conversions.clickId, clicks.id))
      .where(eq(clicks.affiliateLinkId, productId))
      .groupBy(clicks.affiliateLinkId);

      const data = clickData[0] || {
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        totalCommission: 0
      };

      return {
        clicks: Number(data.totalClicks),
        conversions: Number(data.totalConversions),
        revenue: Number(data.totalRevenue),
        commission: Number(data.totalCommission),
        conversionRate: data.totalClicks > 0 ? data.totalConversions / data.totalClicks : 0,
        epc: data.totalClicks > 0 ? data.totalCommission / data.totalClicks : 0,
        averageOrderValue: data.totalConversions > 0 ? data.totalRevenue / data.totalConversions : 0
      };
    } catch (error) {
      console.error('Error calculating product metrics:', error);
      return {
        clicks: 0,
        conversions: 0,
        revenue: 0,
        commission: 0,
        conversionRate: 0,
        epc: 0,
        averageOrderValue: 0
      };
    }
  }

  // Calculate estimated earnings per click
  private calculateEstimatedEPC(product: any, metrics: any): number {
    // Use historical data if available, otherwise use estimated conversion rate
    if (metrics.clicks > 10) {
      return metrics.epc;
    } else {
      // Estimate based on product price, commission rate, and estimated conversion rate
      const estimatedConversionRate = product.conversionRate || 0.01; // Default 1%
      return (product.price * product.commissionRate * estimatedConversionRate) / 100;
    }
  }

  // Calculate risk-adjusted value (balance of commission and conversion)
  private calculateRiskAdjustedValue(product: any, metrics: any): number {
    // Higher weight (0.7) to conversion rate as it's more reliable
    // Lower weight (0.3) to commission as high commission often means lower conversion
    const conversionWeight = 0.7;
    const commissionWeight = 0.3;
    
    const conversionScore = Math.min(metrics.conversionRate * 100, 10) / 10; // Normalize to 0-1
    const commissionScore = Math.min(product.commissionRate / 100, 1); // Normalize to 0-1
    
    return (conversionScore * conversionWeight) + (commissionScore * commissionWeight);
  }

  // Calculate performance score (0-100)
  private calculatePerformanceScore(product: any, metrics: any): number {
    let score = 0;
    
    // Conversion rate score (40 points)
    if (metrics.clicks > 10) {
      const conversionScore = Math.min(metrics.conversionRate * 1000, 40);
      score += conversionScore;
    } else {
      // Use estimated conversion rate
      const estimatedScore = Math.min((product.conversionRate || 0.01) * 1000, 40);
      score += estimatedScore;
    }
    
    // EPC score (30 points)
    const epcScore = Math.min(metrics.epc * 10, 30);
    score += epcScore;
    
    // Commission rate score (20 points)
    const commissionScore = Math.min(product.commissionRate / 5, 20);
    score += commissionScore;
    
    // Gravity score (10 points) - for ClickBank products
    if (product.gravity) {
      const gravityScore = Math.min(product.gravity / 10, 10);
      score += gravityScore;
    }
    
    return Math.min(score, 100);
  }

  // Calculate risk score for the entire mix
  private calculateMixRiskScore(products: ProductWithMetrics[]): number {
    if (products.length === 0) return 100;
    
    let riskScore = 0;
    
    // High commission products tend to have lower conversion rates
    const highCommissionProducts = products.filter(p => p.commissionRate > 20);
    const lowConversionProducts = products.filter(p => p.conversionRate < 0.02);
    
    // Risk factors
    if (highCommissionProducts.length > products.length * 0.5) {
      riskScore += 30; // High commission concentration
    }
    
    if (lowConversionProducts.length > products.length * 0.3) {
      riskScore += 25; // Low conversion concentration
    }
    
    // Price diversity risk
    const prices = products.map(p => p.price);
    const priceVariance = this.calculateVariance(prices);
    if (priceVariance < 100) {
      riskScore += 20; // Low price diversity
    }
    
    // Category diversity risk
    const categories = [...new Set(products.map(p => p.category))];
    if (categories.length < Math.min(products.length, 3)) {
      riskScore += 25; // Low category diversity
    }
    
    return Math.min(riskScore, 100);
  }

  // Calculate variance of an array of numbers
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDifferences = numbers.map(num => Math.pow(num - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    
    return variance;
  }

  // Save recommendation for tracking
  private async saveRecommendation(userId: string, options: ProductMixOptions, productIds: string[]): Promise<string> {
    try {
      // Create a campaign record to track this recommendation
      const result = await db.insert(campaigns).values({
        userId,
        name: `Product Mix - ${options.strategy} Strategy`,
        description: `Generated product mix with ${options.strategy} strategy`,
        status: 'active',
        targetPlatforms: ['recommendation'],
        contentStrategy: {
          strategy: options.strategy,
          productCount: options.productCount,
          categories: options.categories,
          generatedAt: new Date()
        },
        performanceMetrics: {
          productIds,
          totalProducts: productIds.length,
          strategy: options.strategy
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning('id');

      return result[0].id;
    } catch (error) {
      console.error('Error saving recommendation:', error);
      // Return a fallback ID if saving fails
      return `rec-${Date.now()}`;
    }
  }

  // Analyze product performance and suggest improvements
  async analyzeProductPerformance(userId: string): Promise<ProductPerformanceAnalysis[]> {
    try {
      // Get all products for the user with their performance data
      const productData = await db.select({
        product: products,
        clicks: sql<number>`COUNT(${clicks.id})`,
        conversions: sql<number>`COUNT(${conversions.id})`,
        revenue: sql<number>`COALESCE(SUM(${conversions.amount}), 0)`,
        commission: sql<number>`COALESCE(SUM(${conversions.commission}), 0)`
      })
      .from(products)
      .leftJoin(sql`affiliate_links ON affiliate_links.product_id = ${products.id}`)
      .leftJoin(sql`${clicks} ON ${clicks.affiliateLinkId} = affiliate_links.id`)
      .leftJoin(sql`${conversions} ON ${conversions.clickId} = ${clicks.id}`)
      .where(sql`${products.networkId} IN (
        SELECT id FROM affiliate_networks 
        WHERE user_id = ${userId} AND is_active = true
      )`)
      .groupBy(products.id);

      // Calculate metrics and provide recommendations
      const analysis = productData.map(item => {
        const conversionRate = item.clicks > 0 ? item.conversions / item.clicks : 0;
        const averageOrderValue = item.conversions > 0 ? item.revenue / item.conversions : 0;
        const epc = item.clicks > 0 ? item.commission / item.clicks : 0;
        const roi = item.clicks > 0 ? (item.commission / item.clicks) * 100 : 0;

        // Generate recommendations based on metrics
        const recommendations = [];
        
        if (conversionRate < 0.01 && item.clicks > 100) {
          recommendations.push('Low conversion rate. Consider testing different landing pages or call-to-actions.');
        }
        
        if (epc < 0.5 && item.clicks > 50) {
          recommendations.push('Low earnings per click. Consider promoting higher-value products or improving targeting.');
        }
        
        if (item.product.price < 20 && item.product.commissionRate < 10) {
          recommendations.push('Low-value product with low commission. Consider higher-value alternatives.');
        }
        
        if (item.product.gravity && item.product.gravity < 20) {
          recommendations.push('Low gravity score. This product may not be popular or converting well.');
        }
        
        if (conversionRate > 0.05 && epc > 2) {
          recommendations.push('Excellent performance! Consider scaling this product across more campaigns.');
        }

        // Determine performance tier
        let performanceTier: 'excellent' | 'good' | 'average' | 'poor';
        if (conversionRate > 0.03 && epc > 1.5) {
          performanceTier = 'excellent';
        } else if (conversionRate > 0.015 && epc > 0.8) {
          performanceTier = 'good';
        } else if (conversionRate > 0.005 && epc > 0.3) {
          performanceTier = 'average';
        } else {
          performanceTier = 'poor';
        }

        return {
          product: item.product,
          metrics: {
            clicks: Number(item.clicks),
            conversions: Number(item.conversions),
            revenue: Number(item.revenue),
            conversionRate,
            averageOrderValue,
            epc,
            roi
          },
          recommendations,
          performanceTier
        };
      });

      return analysis;
    } catch (error) {
      console.error('Error analyzing product performance:', error);
      throw new Error('Failed to analyze product performance');
    }
  }

  // Get product mix recommendations for a user
  async getProductMixRecommendations(userId: string) {
    try {
      const recommendations = await db.select()
        .from(campaigns)
        .where(and(
          eq(campaigns.userId, userId),
          sql`${campaigns.name} LIKE '%Product Mix%'`
        ))
        .orderBy(desc(campaigns.createdAt))
        .limit(10);

      return recommendations;
    } catch (error) {
      console.error('Error getting product mix recommendations:', error);
      throw new Error('Failed to get product mix recommendations');
    }
  }

  // Get trending products based on performance
  async getTrendingProducts(userId: string, limit: number = 10) {
    try {
      const trendingProducts = await db.select({
        product: products,
        recentClicks: sql<number>`COUNT(${clicks.id})`,
        recentConversions: sql<number>`COUNT(${conversions.id})`,
        recentRevenue: sql<number>`COALESCE(SUM(${conversions.amount}), 0)`
      })
      .from(products)
      .leftJoin(sql`affiliate_links ON affiliate_links.product_id = ${products.id}`)
      .leftJoin(sql`${clicks} ON ${clicks.affiliateLinkId} = affiliate_links.id`)
      .leftJoin(sql`${conversions} ON ${conversions.clickId} = ${clicks.id}`)
      .where(and(
        sql`${products.networkId} IN (
          SELECT id FROM affiliate_networks 
          WHERE user_id = ${userId} AND is_active = true
        )`,
        sql`${clicks.clickedAt} >= NOW() - INTERVAL '30 days'`
      ))
      .groupBy(products.id)
      .orderBy(desc(sql`COUNT(${conversions.id})`))
      .limit(limit);

      return trendingProducts.map(item => ({
        ...item.product,
        recentClicks: Number(item.recentClicks),
        recentConversions: Number(item.recentConversions),
        recentRevenue: Number(item.recentRevenue),
        recentConversionRate: item.recentClicks > 0 ? item.recentConversions / item.recentClicks : 0
      }));
    } catch (error) {
      console.error('Error getting trending products:', error);
      throw new Error('Failed to get trending products');
    }
  }
} 