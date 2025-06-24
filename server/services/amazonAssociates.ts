import { SecureStorage } from './secureStorage';
import { db } from '../database';
import { affiliateLinks, clicks, products } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Amazon Associates Service
 * Handles affiliate link generation and tracking for Amazon products
 */
export class AmazonAssociatesService {
  private static readonly AMAZON_DOMAINS = {
    US: 'amazon.com',
    UK: 'amazon.co.uk',
    CA: 'amazon.ca',
    DE: 'amazon.de',
    FR: 'amazon.fr',
    IT: 'amazon.it',
    ES: 'amazon.es',
    JP: 'amazon.co.jp',
    IN: 'amazon.in',
    AU: 'amazon.com.au',
  };

  // User's specific affiliate tags for different regions
  private static readonly USER_AFFILIATE_TAGS = {
    UK: 'euanmil9901-21',
    US: 'socialpilot-20', // Default fallback
    CA: 'socialpilot-20',
    DE: 'socialpilot-20',
    FR: 'socialpilot-20',
    IT: 'socialpilot-20',
    ES: 'socialpilot-20',
    JP: 'socialpilot-20',
    IN: 'socialpilot-20',
    AU: 'socialpilot-20',
  };

  /**
   * Generate Amazon affiliate link
   */
  static async generateAffiliateLink(
    userId: string,
    productUrl: string,
    campaignId: string,
    options: {
      trackingId?: string;
      region?: string;
      tag?: string;
    } = {}
  ): Promise<string> {
    try {
      // Get user's Amazon credentials
      const credentials = await SecureStorage.getAffiliateCredentials(userId, 'amazon');
      if (!credentials?.apiKey) {
        throw new Error('Amazon Associates credentials not found. Please connect your account first.');
      }

      const trackingId = options.trackingId || credentials.apiKey;
      const region = options.region || 'UK'; // Default to UK since user provided UK link
      const tag = options.tag || this.USER_AFFILIATE_TAGS[region as keyof typeof this.USER_AFFILIATE_TAGS] || 'euanmil9901-21';

      // Parse the product URL
      const parsedUrl = new URL(productUrl);
      const domain = this.AMAZON_DOMAINS[region as keyof typeof this.AMAZON_DOMAINS] || 'amazon.co.uk';
      
      // Extract product ID from URL
      const productId = this.extractProductId(productUrl);
      if (!productId) {
        throw new Error('Invalid Amazon product URL. Could not extract product ID.');
      }

      // Build affiliate URL
      const affiliateUrl = this.buildAffiliateUrl(domain, productId, trackingId, tag);

      // Store the affiliate link in database
      const linkId = await this.storeAffiliateLink(userId, campaignId, productUrl, affiliateUrl, {
        productId,
        region,
        trackingId,
        tag,
      });

      return affiliateUrl;
    } catch (error) {
      console.error('Failed to generate Amazon affiliate link:', error);
      throw new Error('Failed to generate affiliate link');
    }
  }

  /**
   * Track click on affiliate link
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

      console.log(`Click tracked for link ${linkId}, fraud score: ${fraudScore}`);
    } catch (error) {
      console.error('Failed to track click:', error);
      // Don't throw error to avoid breaking user experience
    }
  }

  /**
   * Track conversion (sale)
   */
  static async trackConversion(
    linkId: string,
    saleData: {
      orderId: string;
      productId: string;
      revenue: number;
      commission: number;
      currency: string;
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

      console.log(`Conversion tracked for link ${linkId}: $${saleData.revenue}`);
    } catch (error) {
      console.error('Failed to track conversion:', error);
      throw new Error('Failed to track conversion');
    }
  }

  /**
   * Get user's Amazon Associates statistics
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
      console.error('Failed to get statistics:', error);
      throw new Error('Failed to retrieve statistics');
    }
  }

  /**
   * Extract product ID from Amazon URL
   */
  private static extractProductId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Look for product ID in path
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (part === 'dp' || part === 'gp' || part === 'product') {
          return pathParts[i + 1] || null;
        }
      }
      
      // Look for product ID in query parameters
      const dpParam = urlObj.searchParams.get('dp');
      if (dpParam) {
        return dpParam;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to extract product ID:', error);
      return null;
    }
  }

  /**
   * Build affiliate URL with tracking parameters
   */
  private static buildAffiliateUrl(
    domain: string,
    productId: string,
    trackingId: string,
    tag: string
  ): string {
    const baseUrl = `https://www.${domain}/dp/${productId}`;
    const params = new URLSearchParams({
      tag: tag,
      linkCode: domain.includes('amazon.co.uk') ? 'll2' : 'ogi', // UK uses ll2, others use ogi
      language: domain.includes('amazon.co.uk') ? 'en_GB' : 'en_US',
    });
    
    // Add linkId parameter for UK (as seen in user's provided link)
    if (domain.includes('amazon.co.uk')) {
      params.append('linkId', this.generateLinkId());
    }
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate linkId for UK affiliate links
   */
  private static generateLinkId(): string {
    // Generate a unique linkId similar to the one in user's provided link
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `${timestamp}${random}`;
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
      console.error('Failed to store affiliate link:', error);
      throw new Error('Failed to store affiliate link');
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
      // Basic IP validation (in production, use a proper IP reputation service)
      if (request.ipAddress === '127.0.0.1' || request.ipAddress === '::1') {
        score += 0.3; // Local IP
      }
    }

    // Check for rapid clicking (would need session tracking in production)
    // For now, just return a basic score
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
      console.error('Failed to calculate conversion rate:', error);
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
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate Amazon product URL
   */
  static validateProductUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      // Check if it's an Amazon domain
      const isAmazonDomain = Object.values(this.AMAZON_DOMAINS).some(
        amazonDomain => domain.includes(amazonDomain)
      );
      
      if (!isAmazonDomain) {
        return false;
      }
      
      // Check if it has a product ID
      const productId = this.extractProductId(url);
      return !!productId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get supported Amazon regions
   */
  static getSupportedRegions(): { [key: string]: string } {
    return this.AMAZON_DOMAINS;
  }
} 