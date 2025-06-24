import axios from 'axios';
import { z } from 'zod';
import { SecureStorage } from './secureStorage';
import { db } from '../database';
import { affiliateLinks, emailSubscribers } from '../../shared/schema';
import { eq, and, like } from 'drizzle-orm';

/**
 * Email Scraper Service
 * Handles email collection and validation for affiliate marketing campaigns
 */
export class EmailScraperService {
  private static readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
  private static readonly MAX_EMAILS_PER_SOURCE = 100;
  private static readonly VALIDATION_TIMEOUT = 10000; // 10 seconds

  /**
   * Scrape emails from a website
   */
  static async scrapeEmailsFromWebsite(
    url: string,
    options: {
      maxEmails?: number;
      includeSubdomains?: boolean;
      respectRobotsTxt?: boolean;
      userAgent?: string;
    } = {}
  ): Promise<{
    emails: string[];
    totalFound: number;
    validEmails: number;
    invalidEmails: number;
    source: string;
    timestamp: Date;
  }> {
    try {
      const maxEmails = options.maxEmails || this.MAX_EMAILS_PER_SOURCE;
      const userAgent = options.userAgent || 'Mozilla/5.0 (compatible; SocialPilot/1.0)';

      console.log(`🔍 Scraping emails from: ${url}`);

      // Check robots.txt if enabled
      if (options.respectRobotsTxt) {
        const robotsAllowed = await this.checkRobotsTxt(url);
        if (!robotsAllowed) {
          throw new Error('Email scraping not allowed by robots.txt');
        }
      }

      // Fetch the webpage
      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: this.VALIDATION_TIMEOUT,
        validateStatus: (status) => status < 500,
      });

      const html = response.data;
      
      // Extract emails using regex patterns
      const emails = this.extractEmailsFromText(html);
      
      // Validate emails
      const validEmails = await this.validateEmails(emails.slice(0, maxEmails));
      
      // Filter out invalid emails
      const filteredEmails = validEmails.filter(email => email.isValid).map(email => email.email);

      console.log(`✅ Found ${emails.length} emails, ${filteredEmails.length} valid`);

      return {
        emails: filteredEmails,
        totalFound: emails.length,
        validEmails: filteredEmails.length,
        invalidEmails: emails.length - filteredEmails.length,
        source: url,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`❌ Failed to scrape emails from ${url}:`, error instanceof Error ? error.message : 'Unknown error');
      throw new Error(`Failed to scrape emails from ${url}`);
    }
  }

  /**
   * Scrape emails from social media profiles
   */
  static async scrapeEmailsFromSocialMedia(
    platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook',
    profileUrl: string,
    options: {
      maxEmails?: number;
      includeBio?: boolean;
      includePosts?: boolean;
    } = {}
  ): Promise<{
    emails: string[];
    totalFound: number;
    validEmails: number;
    source: string;
    platform: string;
    timestamp: Date;
  }> {
    try {
      const maxEmails = options.maxEmails || this.MAX_EMAILS_PER_SOURCE;
      
      console.log(`🔍 Scraping emails from ${platform}: ${profileUrl}`);

      // Platform-specific scraping logic
      let emails: string[] = [];
      
      switch (platform) {
        case 'linkedin':
          emails = await this.scrapeLinkedInEmails(profileUrl, options);
          break;
        case 'twitter':
          emails = await this.scrapeTwitterEmails(profileUrl, options);
          break;
        case 'instagram':
          emails = await this.scrapeInstagramEmails(profileUrl, options);
          break;
        case 'facebook':
          emails = await this.scrapeFacebookEmails(profileUrl, options);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Validate emails
      const validEmails = await this.validateEmails(emails.slice(0, maxEmails));
      const filteredEmails = validEmails.filter(email => email.isValid).map(email => email.email);

      console.log(`✅ Found ${emails.length} emails from ${platform}, ${filteredEmails.length} valid`);

      return {
        emails: filteredEmails,
        totalFound: emails.length,
        validEmails: filteredEmails.length,
        source: profileUrl,
        platform,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`❌ Failed to scrape emails from ${platform}:`, error instanceof Error ? error.message : 'Unknown error');
      throw new Error(`Failed to scrape emails from ${platform}`);
    }
  }

  /**
   * Extract emails from text content
   */
  private static extractEmailsFromText(text: string): string[] {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emails = text.match(emailRegex) || [];
    
    // Remove duplicates and normalize
    const uniqueEmails = [...new Set(emails.map(email => email.toLowerCase().trim()))];
    
    // Filter out common false positives
    return uniqueEmails.filter(email => {
      // Exclude common false positives
      const excludePatterns = [
        /example\.com$/,
        /test\.com$/,
        /domain\.com$/,
        /email\.com$/,
        /noreply@/,
        /no-reply@/,
        /donotreply@/,
        /admin@/,
        /webmaster@/,
        /postmaster@/,
        /mailer-daemon@/,
        /daemon@/,
      ];
      
      return !excludePatterns.some(pattern => pattern.test(email));
    });
  }

  /**
   * Validate email addresses
   */
  private static async validateEmails(emails: string[]): Promise<Array<{ email: string; isValid: boolean; reason?: string }>> {
    const results: Array<{ email: string; isValid: boolean; reason?: string }> = [];
    
    for (const email of emails) {
      try {
        const isValid = await this.validateSingleEmail(email);
        results.push({
          email,
          isValid,
          reason: isValid ? undefined : 'Invalid email format or domain'
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          email,
          isValid: false,
          reason: 'Validation error'
        });
      }
    }
    
    return results;
  }

  /**
   * Validate a single email address
   */
  private static async validateSingleEmail(email: string): Promise<boolean> {
    try {
      // Basic format validation
      const emailSchema = z.string().email();
      emailSchema.parse(email);
      
      // Check domain has MX records
      const domain = email.split('@')[1];
      const hasMxRecords = await this.checkMxRecords(domain);
      
      return hasMxRecords;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if domain has MX records
   */
  private static async checkMxRecords(domain: string): Promise<boolean> {
    try {
      // This is a simplified check - in production you'd use a proper DNS resolver
      const response = await axios.get(`https://dns.google/resolve?name=${domain}&type=MX`, {
        timeout: 5000,
      });
      
      return response.data.Answer && response.data.Answer.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check robots.txt for scraping permissions
   */
  private static async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.hostname}/robots.txt`;
      
      const response = await axios.get(robotsUrl, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });
      
      const robotsContent = response.data.toLowerCase();
      
      // Check if scraping is disallowed
      if (robotsContent.includes('disallow: /') || robotsContent.includes('user-agent: *')) {
        return false;
      }
      
      return true;
    } catch (error) {
      // If robots.txt is not found, assume scraping is allowed
      return true;
    }
  }

  /**
   * Platform-specific scraping methods
   */
  private static async scrapeLinkedInEmails(profileUrl: string, options: any): Promise<string[]> {
    // LinkedIn scraping would require authentication and API access
    // This is a placeholder implementation
    console.log('⚠️ LinkedIn scraping requires API access and authentication');
    return [];
  }

  private static async scrapeTwitterEmails(profileUrl: string, options: any): Promise<string[]> {
    try {
      const response = await axios.get(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SocialPilot/1.0)',
        },
        timeout: this.VALIDATION_TIMEOUT,
      });
      
      return this.extractEmailsFromText(response.data);
    } catch (error) {
      console.error('Twitter scraping failed:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  private static async scrapeInstagramEmails(profileUrl: string, options: any): Promise<string[]> {
    try {
      const response = await axios.get(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SocialPilot/1.0)',
        },
        timeout: this.VALIDATION_TIMEOUT,
      });
      
      return this.extractEmailsFromText(response.data);
    } catch (error) {
      console.error('Instagram scraping failed:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  private static async scrapeFacebookEmails(profileUrl: string, options: any): Promise<string[]> {
    try {
      const response = await axios.get(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SocialPilot/1.0)',
        },
        timeout: this.VALIDATION_TIMEOUT,
      });
      
      return this.extractEmailsFromText(response.data);
    } catch (error) {
      console.error('Facebook scraping failed:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Store scraped emails in database
   */
  static async storeScrapedEmails(
    userId: string,
    campaignId: string,
    emails: string[],
    source: string,
    platform?: string
  ): Promise<{
    stored: number;
    duplicates: number;
    invalid: number;
  }> {
    try {
      let stored = 0;
      let duplicates = 0;
      let invalid = 0;

      for (const email of emails) {
        try {
          // Check if email already exists
          const existing = await db
            .select()
            .from(emailSubscribers)
            .where(eq(emailSubscribers.email, email))
            .limit(1);

          if (existing.length > 0) {
            duplicates++;
            continue;
          }

          // Store new email
          await db.insert(emailSubscribers).values({
            userId,
            campaignId,
            email,
            source,
            platform: platform || 'website',
            isActive: true,
            subscribedAt: new Date(),
          });

          stored++;
        } catch (error) {
          invalid++;
          console.error(`Failed to store email ${email}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }

      console.log(`✅ Stored ${stored} emails, ${duplicates} duplicates, ${invalid} invalid`);

      return { stored, duplicates, invalid };
    } catch (error) {
      console.error('Failed to store scraped emails:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to store scraped emails');
    }
  }

  /**
   * Get email subscribers for a campaign
   */
  static async getEmailSubscribers(
    userId: string,
    campaignId: string,
    options: {
      activeOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    subscribers: any[];
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      const { activeOnly = true, limit = 100, offset = 0 } = options;

      let query = db
        .select()
        .from(emailSubscribers)
        .where(eq(emailSubscribers.userId, userId))
        .where(eq(emailSubscribers.campaignId, campaignId));

      if (activeOnly) {
        query = query.where(eq(emailSubscribers.isActive, true));
      }

      const subscribers = await query.limit(limit).offset(offset);
      const total = await db
        .select({ count: emailSubscribers.id })
        .from(emailSubscribers)
        .where(eq(emailSubscribers.userId, userId))
        .where(eq(emailSubscribers.campaignId, campaignId));

      const active = await db
        .select({ count: emailSubscribers.id })
        .from(emailSubscribers)
        .where(eq(emailSubscribers.userId, userId))
        .where(eq(emailSubscribers.campaignId, campaignId))
        .where(eq(emailSubscribers.isActive, true));

      return {
        subscribers,
        total: total.length,
        active: active.length,
        inactive: total.length - active.length,
      };
    } catch (error) {
      console.error('Failed to get email subscribers:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to get email subscribers');
    }
  }

  /**
   * Generate affiliate email content
   */
  static async generateAffiliateEmail(
    campaignId: string,
    template: 'newsletter' | 'product-promo' | 'discount' | 'review',
    options: {
      subject?: string;
      personalization?: boolean;
      includeUnsubscribe?: boolean;
    } = {}
  ): Promise<{
    subject: string;
    htmlContent: string;
    textContent: string;
    preview: string;
  }> {
    try {
      // Get campaign details
      const campaign = await db
        .select()
        .from(affiliateLinks)
        .where(eq(affiliateLinks.campaignId, campaignId))
        .limit(1);

      if (campaign.length === 0) {
        throw new Error('Campaign not found');
      }

      const campaignData = campaign[0];
      
      // Generate email content based on template
      const emailContent = this.generateEmailTemplate(template, campaignData, options);
      
      return {
        subject: emailContent.subject,
        htmlContent: emailContent.html,
        textContent: emailContent.text,
        preview: emailContent.preview,
      };
    } catch (error) {
      console.error('Failed to generate affiliate email:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to generate affiliate email');
    }
  }

  /**
   * Generate email templates
   */
  private static generateEmailTemplate(
    template: string,
    campaignData: any,
    options: any
  ): { subject: string; html: string; text: string; preview: string } {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const unsubscribeUrl = `${baseUrl}/unsubscribe?email={{email}}&campaign=${campaignData.campaignId}`;

    switch (template) {
      case 'newsletter':
        return {
          subject: `📧 Your Weekly Affiliate Marketing Insights`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Affiliate Marketing Newsletter</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2c5aa0;">📧 Affiliate Marketing Newsletter</h1>
                <p>Hi there!</p>
                <p>Here are this week's top affiliate marketing opportunities:</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>🔥 Hot Product: ${campaignData.metadata?.productName || 'Featured Product'}</h3>
                  <p>${campaignData.metadata?.description || 'Check out this amazing product!'}</p>
                  <a href="${campaignData.shortUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Learn More</a>
                </div>
                <p>Best regards,<br>Your Affiliate Team</p>
                ${options.includeUnsubscribe ? `<p style="font-size: 12px; color: #666;"><a href="${unsubscribeUrl}">Unsubscribe</a></p>` : ''}
              </div>
            </body>
            </html>
          `,
          text: `
            Affiliate Marketing Newsletter
            
            Hi there!
            
            Here are this week's top affiliate marketing opportunities:
            
            🔥 Hot Product: ${campaignData.metadata?.productName || 'Featured Product'}
            ${campaignData.metadata?.description || 'Check out this amazing product!'}
            
            Learn More: ${campaignData.shortUrl}
            
            Best regards,
            Your Affiliate Team
          `,
          preview: 'Your weekly affiliate marketing insights and top product recommendations...',
        };

      case 'product-promo':
        return {
          subject: `🎯 Special Offer: ${campaignData.metadata?.productName || 'Amazing Product'}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Special Product Offer</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #e74c3c;">🎯 Special Offer!</h1>
                <div style="background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <h2>${campaignData.metadata?.productName || 'Amazing Product'}</h2>
                  <p style="font-size: 18px; font-weight: bold; color: #e74c3c;">Limited Time Offer!</p>
                  <p>${campaignData.metadata?.description || 'Don\'t miss this incredible opportunity!'}</p>
                  <a href="${campaignData.shortUrl}" style="background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Get Your Offer Now</a>
                </div>
                <p>This offer won't last long!</p>
                ${options.includeUnsubscribe ? `<p style="font-size: 12px; color: #666;"><a href="${unsubscribeUrl}">Unsubscribe</a></p>` : ''}
              </div>
            </body>
            </html>
          `,
          text: `
            🎯 Special Offer!
            
            ${campaignData.metadata?.productName || 'Amazing Product'}
            Limited Time Offer!
            
            ${campaignData.metadata?.description || 'Don\'t miss this incredible opportunity!'}
            
            Get Your Offer Now: ${campaignData.shortUrl}
            
            This offer won't last long!
          `,
          preview: 'Limited time offer on amazing products - don\'t miss out!',
        };

      default:
        return {
          subject: 'Affiliate Marketing Update',
          html: '<p>Affiliate marketing update</p>',
          text: 'Affiliate marketing update',
          preview: 'Affiliate marketing update...',
        };
    }
  }

  /**
   * Get scraping statistics
   */
  static async getScrapingStats(userId: string): Promise<{
    totalEmails: number;
    validEmails: number;
    invalidEmails: number;
    sources: Record<string, number>;
    platforms: Record<string, number>;
    recentActivity: any[];
  }> {
    try {
      const allEmails = await db
        .select()
        .from(emailSubscribers)
        .where(eq(emailSubscribers.userId, userId));

      const sources: Record<string, number> = {};
      const platforms: Record<string, number> = {};

      allEmails.forEach(email => {
        sources[email.source] = (sources[email.source] || 0) + 1;
        platforms[email.platform || 'website'] = (platforms[email.platform || 'website'] || 0) + 1;
      });

      const recentActivity = await db
        .select()
        .from(emailSubscribers)
        .where(eq(emailSubscribers.userId, userId))
        .orderBy(emailSubscribers.subscribedAt)
        .limit(10);

      return {
        totalEmails: allEmails.length,
        validEmails: allEmails.filter(e => e.isActive).length,
        invalidEmails: allEmails.filter(e => !e.isActive).length,
        sources,
        platforms,
        recentActivity,
      };
    } catch (error) {
      console.error('Failed to get scraping stats:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to get scraping stats');
    }
  }
} 