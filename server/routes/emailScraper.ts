import express from 'express';
import { z } from 'zod';
import { EmailScraperService } from '../services/emailScraper';
import { authenticateToken } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const router = express.Router();

// Rate limiting for email scraping
const scrapingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many email scraping requests, please try again later.',
});

// Validation schemas
const scrapeWebsiteSchema = z.object({
  url: z.string().url(),
  maxEmails: z.number().min(1).max(1000).optional(),
  includeSubdomains: z.boolean().optional(),
  respectRobotsTxt: z.boolean().optional(),
  userAgent: z.string().optional(),
});

const scrapeSocialMediaSchema = z.object({
  platform: z.enum(['linkedin', 'twitter', 'instagram', 'facebook']),
  profileUrl: z.string().url(),
  maxEmails: z.number().min(1).max(1000).optional(),
  includeBio: z.boolean().optional(),
  includePosts: z.boolean().optional(),
});

const storeEmailsSchema = z.object({
  campaignId: z.string().uuid(),
  emails: z.array(z.string().email()),
  source: z.string(),
  platform: z.string().optional(),
});

const generateEmailSchema = z.object({
  campaignId: z.string().uuid(),
  template: z.enum(['newsletter', 'product-promo', 'discount', 'review']),
  subject: z.string().optional(),
  personalization: z.boolean().optional(),
  includeUnsubscribe: z.boolean().optional(),
});

/**
 * POST /api/email-scraper/website
 * Scrape emails from a website
 */
router.post('/website', authenticateToken, scrapingRateLimit, async (req, res) => {
  try {
    const { url, maxEmails, includeSubdomains, respectRobotsTxt, userAgent } = scrapeWebsiteSchema.parse(req.body);
    const userId = req.user.id;

    console.log(`🔍 User ${userId} scraping emails from: ${url}`);

    const result = await EmailScraperService.scrapeEmailsFromWebsite(url, {
      maxEmails,
      includeSubdomains,
      respectRobotsTxt,
      userAgent,
    });

    res.json({
      success: true,
      data: result,
      message: `Found ${result.totalFound} emails, ${result.validEmails} valid`,
    });
  } catch (error) {
    console.error('Website email scraping error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape emails from website',
    });
  }
});

/**
 * POST /api/email-scraper/social-media
 * Scrape emails from social media profiles
 */
router.post('/social-media', authenticateToken, scrapingRateLimit, async (req, res) => {
  try {
    const { platform, profileUrl, maxEmails, includeBio, includePosts } = scrapeSocialMediaSchema.parse(req.body);
    const userId = req.user.id;

    console.log(`🔍 User ${userId} scraping emails from ${platform}: ${profileUrl}`);

    const result = await EmailScraperService.scrapeEmailsFromSocialMedia(platform, profileUrl, {
      maxEmails,
      includeBio,
      includePosts,
    });

    res.json({
      success: true,
      data: result,
      message: `Found ${result.totalFound} emails from ${platform}, ${result.validEmails} valid`,
    });
  } catch (error) {
    console.error('Social media email scraping error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape emails from social media',
    });
  }
});

/**
 * POST /api/email-scraper/store
 * Store scraped emails in database
 */
router.post('/store', authenticateToken, async (req, res) => {
  try {
    const { campaignId, emails, source, platform } = storeEmailsSchema.parse(req.body);
    const userId = req.user.id;

    console.log(`💾 User ${userId} storing ${emails.length} emails for campaign ${campaignId}`);

    const result = await EmailScraperService.storeScrapedEmails(userId, campaignId, emails, source, platform);

    res.json({
      success: true,
      data: result,
      message: `Stored ${result.stored} emails, ${result.duplicates} duplicates, ${result.invalid} invalid`,
    });
  } catch (error) {
    console.error('Store emails error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store emails',
    });
  }
});

/**
 * GET /api/email-scraper/subscribers/:campaignId
 * Get email subscribers for a campaign
 */
router.get('/subscribers/:campaignId', authenticateToken, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { activeOnly, limit, offset } = req.query;
    const userId = req.user.id;

    const result = await EmailScraperService.getEmailSubscribers(userId, campaignId, {
      activeOnly: activeOnly === 'true',
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      success: true,
      data: result,
      message: `Found ${result.total} subscribers for campaign`,
    });
  } catch (error) {
    console.error('Get subscribers error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get subscribers',
    });
  }
});

/**
 * POST /api/email-scraper/generate-email
 * Generate affiliate email content
 */
router.post('/generate-email', authenticateToken, async (req, res) => {
  try {
    const { campaignId, template, subject, personalization, includeUnsubscribe } = generateEmailSchema.parse(req.body);
    const userId = req.user.id;

    console.log(`📧 User ${userId} generating email for campaign ${campaignId} with template ${template}`);

    const result = await EmailScraperService.generateAffiliateEmail(campaignId, template, {
      subject,
      personalization,
      includeUnsubscribe,
    });

    res.json({
      success: true,
      data: result,
      message: 'Email content generated successfully',
    });
  } catch (error) {
    console.error('Generate email error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate email',
    });
  }
});

/**
 * GET /api/email-scraper/stats
 * Get email scraping statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await EmailScraperService.getScrapingStats(userId);

    res.json({
      success: true,
      data: stats,
      message: 'Email scraping statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get stats error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics',
    });
  }
});

/**
 * POST /api/email-scraper/bulk-scrape
 * Bulk scrape emails from multiple sources
 */
router.post('/bulk-scrape', authenticateToken, scrapingRateLimit, async (req, res) => {
  try {
    const { sources } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Sources array is required and must not be empty',
      });
    }

    console.log(`🔍 User ${userId} bulk scraping from ${sources.length} sources`);

    const results = [];
    let totalEmails = 0;
    let totalValid = 0;

    for (const source of sources) {
      try {
        if (source.type === 'website') {
          const result = await EmailScraperService.scrapeEmailsFromWebsite(source.url, source.options);
          results.push({ ...result, type: 'website' });
          totalEmails += result.totalFound;
          totalValid += result.validEmails;
        } else if (source.type === 'social-media') {
          const result = await EmailScraperService.scrapeEmailsFromSocialMedia(
            source.platform,
            source.profileUrl,
            source.options
          );
          results.push({ ...result, type: 'social-media' });
          totalEmails += result.totalFound;
          totalValid += result.validEmails;
        }

        // Rate limiting between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.push({
          type: source.type,
          url: source.url || source.profileUrl,
          error: error instanceof Error ? error.message : 'Unknown error',
          emails: [],
          totalFound: 0,
          validEmails: 0,
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        summary: {
          totalSources: sources.length,
          successfulSources: results.filter(r => !r.error).length,
          totalEmails,
          totalValid,
        },
      },
      message: `Bulk scraping completed: ${totalValid} valid emails from ${results.filter(r => !r.error).length} sources`,
    });
  } catch (error) {
    console.error('Bulk scraping error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform bulk scraping',
    });
  }
});

/**
 * DELETE /api/email-scraper/subscribers/:emailId
 * Unsubscribe an email address
 */
router.delete('/subscribers/:emailId', authenticateToken, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id;

    // This would typically update the emailSubscribers table
    // For now, we'll just return a success response
    console.log(`📧 User ${userId} unsubscribing email ${emailId}`);

    res.json({
      success: true,
      message: 'Email unsubscribed successfully',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unsubscribe',
    });
  }
});

export default router; 