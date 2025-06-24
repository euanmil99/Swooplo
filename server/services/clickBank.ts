import { SecureStorage } from './secureStorage';
import { db } from '../database';
import { affiliateLinks, clicks, products } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * ClickBank Service
 * Handles affiliate link generation and tracking for ClickBank products
 */
export class ClickBankService {
  private static readonly CLICKBANK_API_BASE = 'https://api.clickbank.com/rest/1.3';
  private static readonly DEFAULT_API_KEY = 'API-1A4OF6WZ42KIKPDOMAU57FW1ZAO02AFFELTJ';

  /**
   * Generate ClickBank affiliate link
   */
  static async generateAffiliateLink(
    userId: string,
    productUrl: string,
    campaignId: string,
    options: {
      apiKey?: string;
      nickname?: string;
      hoplink?: string;
    } = {}
  ): Promise<string> {
    try {
      // Get user's ClickBank credentials or use default
      const credentials = await SecureStorage.getAffiliateCredentials(userId, 'clickbank');
      const apiKey = options.apiKey || credentials?.apiKey || this.DEFAULT_API_KEY;
      const nickname = options.nickname || credentials?.nickname || 'socialpilot';

      // Extract product info from URL
      const productInfo = this.extractProductInfo(productUrl);
      if (!productInfo) {
        throw new Error('Invalid ClickBank product URL. Could not extract product information.');
      }

      // Build affiliate URL
      const affiliateUrl = this.buildAffiliateUrl(productInfo, nickname);

      // Store the affiliate link in database
      const linkId = await this.storeAffiliateLink(userId, campaignId, productUrl, affiliateUrl, {
        productId: productInfo.productId,
        vendorId: productInfo.vendorId,
        nickname,
        apiKey: this.maskApiKey(apiKey),
      });

      return affiliateUrl;
    } catch (error) {
      console.error('Failed to generate ClickBank affiliate link:', error);
      throw new Error('Failed to generate ClickBank affiliate link');
    }
  }

  /**
   * Track click on ClickBank affiliate link
   */
  static async trackClick(
    linkId: string,
    request: {
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
      country?: string;
      city?: string;
      deviceType?: string;
      browser?: string;
      os?: string;
    }
  ): Promise<void> {
    try {
      // Basic fraud detection
      const fraudScore = await this.calculateFraudScore(request);
      
      // Store click data
      await db.insert(clicks).values({
        affiliateLinkId: linkId,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        referrer: request.referrer,
        country: request.country,
        city: request.city,
        deviceType: request.deviceType,
        browser: request.browser,
        os: request.os,
        isBot: fraudScore > 0.8,
        fraudScore,
        sessionId: this.generateSessionId(),
      });

      // Update click count on affiliate link
      await db
        .update(affiliateLinks)
        .set({
          clickCount: affiliateLinks.clickCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(affiliateLinks.id, linkId));

      console.log(`ClickBank click tracked for link ${linkId}, fraud score: ${fraudScore}`);
    } catch (error) {
      console.error('Failed to track ClickBank click:', error);
      // Don't throw error to avoid breaking user experience
    }
  }

  /**
   * Track conversion (sale) from ClickBank
   */
  static async trackConversion(
    linkId: string,
    saleData: {
      orderId: string;
      productId: string;
      revenue: number;
      commission: number;
      currency: string;
      vendorId?: string;
    }
  ): Promise<void> {
    try {
      // Update affiliate link with conversion data
      await db
        .update(affiliateLinks)
        .set({
          conversionCount: affiliateLinks.conversionCount + 1,
          revenue: affiliateLinks.revenue + saleData.revenue,
          conversionRate: this.calculateConversionRate(linkId),
          updatedAt: new Date(),
        })
        .where(eq(affiliateLinks.id, linkId));

      console.log(`ClickBank conversion tracked for link ${linkId}: $${saleData.revenue}`);
    } catch (error) {
      console.error('Failed to track ClickBank conversion:', error);
      throw new Error('Failed to track ClickBank conversion');
    }
  }

  /**
   * Get ClickBank product information via API
   */
  static async getProductInfo(productId: string, apiKey?: string): Promise<any> {
    try {
      const key = apiKey || this.DEFAULT_API_KEY;
      const response = await fetch(`${this.CLICKBANK_API_BASE}/products/${productId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ClickBank API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get ClickBank product info:', error);
      throw new Error('Failed to retrieve product information from ClickBank');
    }
  }

  /**
   * Get user's ClickBank statistics
   */
  static async getStatistics(userId: string): Promise<{
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    averageConversionRate: number;
    topProducts: any[];
  }> {
    try {
      const userLinks = await db
        .select()
        .from(affiliateLinks)
        .where(eq(affiliateLinks.campaignId, userId)); // Simplified for MVP

      const totalClicks = userLinks.reduce((sum, link) => sum + (link.clickCount || 0), 0);
      const totalConversions = userLinks.reduce((sum, link) => sum + (link.conversionCount || 0), 0);
      const totalRevenue = userLinks.reduce((sum, link) => sum + Number(link.revenue || 0), 0);
      const averageConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      // Get top performing products
      const topProducts = userLinks
        .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
        .slice(0, 5);

      return {
        totalClicks,
        totalConversions,
        totalRevenue,
        averageConversionRate,
        topProducts,
      };
    } catch (error) {
      console.error('Failed to get ClickBank statistics:', error);
      throw new Error('Failed to retrieve ClickBank statistics');
    }
  }

  /**
   * Extract product information from ClickBank URL
   */
  private static extractProductInfo(url: string): { productId: string; vendorId: string } | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      // ClickBank URLs typically follow pattern: /vendor/product or /product
      if (pathParts.length >= 2) {
        return {
          vendorId: pathParts[0],
          productId: pathParts[1],
        };
      } else if (pathParts.length === 1) {
        // If only product ID is provided, we'll need to get vendor info from API
        return {
          vendorId: 'unknown',
          productId: pathParts[0],
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to extract ClickBank product info:', error);
      return null;
    }
  }

  /**
   * Build ClickBank affiliate URL
   */
  private static buildAffiliateUrl(
    productInfo: { productId: string; vendorId: string },
    nickname: string
  ): string {
    // ClickBank affiliate links follow pattern: https://vendor.product.hop.clickbank.net
    return `https://${productInfo.vendorId}.${productInfo.productId}.hop.clickbank.net/?cbhop=1&cbaffiliate=${nickname}`;
  }

  /**
   * Store affiliate link in database
   */
  private static async storeAffiliateLink(
    userId: string,
    campaignId: string,
    originalUrl: string,
    affiliateUrl: string,
    metadata: any
  ): Promise<string> {
    try {
      const shortCode = this.generateShortCode();
      
      const result = await db.insert(affiliateLinks).values({
        campaignId,
        originalUrl,
        shortCode,
        shortUrl: `${process.env.BASE_URL}/r/${shortCode}`,
        cloakedUrl: affiliateUrl,
        isActive: true,
        metadata,
      }).returning({ id: affiliateLinks.id });

      return result[0].id;
    } catch (error) {
      console.error('Failed to store ClickBank affiliate link:', error);
      throw new Error('Failed to store ClickBank affiliate link');
    }
  }

  /**
   * Calculate fraud score for click
   */
  private static async calculateFraudScore(request: any): Promise<number> {
    let score = 0;

    // Check for bot indicators
    if (request.userAgent) {
      const userAgent = request.userAgent.toLowerCase();
      if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('spider')) {
        score += 0.8;
      }
    }

    // Check for suspicious IP patterns
    if (request.ipAddress) {
      if (request.ipAddress === '127.0.0.1' || request.ipAddress === '::1') {
        score += 0.3; // Local IP
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate conversion rate for a link
   */
  private static async calculateConversionRate(linkId: string): Promise<number> {
    try {
      const link = await db
        .select()
        .from(affiliateLinks)
        .where(eq(affiliateLinks.id, linkId))
        .limit(1);

      if (link.length === 0 || link[0].clickCount === 0) {
        return 0;
      }

      return (link[0].conversionCount / link[0].clickCount) * 100;
    } catch (error) {
      console.error('Failed to calculate ClickBank conversion rate:', error);
      return 0;
    }
  }

  /**
   * Generate short code for affiliate link
   */
  private static generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate session ID for tracking
   */
  private static generateSessionId(): string {
    return `cb_sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Mask API key for security
   */
  private static maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) return '***';
    return `${apiKey.substring(0, 4)}***${apiKey.substring(apiKey.length - 4)}`;
  }

  /**
   * Validate ClickBank product URL
   */
  static validateProductUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check if it's a ClickBank domain
      const isClickBankDomain = hostname.includes('clickbank.com') || 
                               hostname.includes('hop.clickbank.net') ||
                               hostname.includes('clickbank.net');
      
      if (!isClickBankDomain) {
        return false;
      }
      
      // Check if it has a product path
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test ClickBank API connection
   */
  static async testConnection(apiKey?: string): Promise<{
    status: string;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const key = apiKey || this.DEFAULT_API_KEY;
      const response = await fetch(`${this.CLICKBANK_API_BASE}/account`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          status: 'error',
          latency,
          error: `API Error: ${response.status} ${response.statusText}`,
        };
      }

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'error',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
} 