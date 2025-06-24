import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AmazonAssociatesService } from '../server/services/amazonAssociates';
import { SecureStorage } from '../server/services/secureStorage';

// Mock database
jest.mock('../server/database', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock SecureStorage
jest.mock('../server/services/secureStorage');

describe('Affiliate Link Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Amazon Associates Service', () => {
    describe('generateAffiliateLink', () => {
      it('should generate valid affiliate link for Amazon product URL', async () => {
        // Mock credentials
        (SecureStorage.getAffiliateCredentials as jest.Mock).mockResolvedValue({
          apiKey: 'test-tracking-id',
        });

        const productUrl = 'https://www.amazon.com/dp/B08N5WRWNW';
        const userId = 'test-user-id';
        const campaignId = 'test-campaign-id';

        const affiliateUrl = await AmazonAssociatesService.generateAffiliateLink(
          userId,
          productUrl,
          campaignId
        );

        expect(affiliateUrl).toContain('amazon.com');
        expect(affiliateUrl).toContain('B08N5WRWNW');
        expect(affiliateUrl).toContain('tag=socialpilot-20');
        expect(affiliateUrl).toContain('linkCode=ogi');
      });

      it('should throw error for invalid Amazon URL', async () => {
        const invalidUrl = 'https://www.google.com/product/123';
        const userId = 'test-user-id';
        const campaignId = 'test-campaign-id';

        await expect(
          AmazonAssociatesService.generateAffiliateLink(userId, invalidUrl, campaignId)
        ).rejects.toThrow('Invalid Amazon product URL');
      });

      it('should throw error when credentials not found', async () => {
        (SecureStorage.getAffiliateCredentials as jest.Mock).mockResolvedValue(null);

        const productUrl = 'https://www.amazon.com/dp/B08N5WRWNW';
        const userId = 'test-user-id';
        const campaignId = 'test-campaign-id';

        await expect(
          AmazonAssociatesService.generateAffiliateLink(userId, productUrl, campaignId)
        ).rejects.toThrow('Amazon Associates credentials not found');
      });

      it('should handle different Amazon regions', async () => {
        (SecureStorage.getAffiliateCredentials as jest.Mock).mockResolvedValue({
          apiKey: 'test-tracking-id',
        });

        const productUrl = 'https://www.amazon.co.uk/dp/B08N5WRWNW';
        const userId = 'test-user-id';
        const campaignId = 'test-campaign-id';

        const affiliateUrl = await AmazonAssociatesService.generateAffiliateLink(
          userId,
          productUrl,
          campaignId,
          { region: 'UK' }
        );

        expect(affiliateUrl).toContain('amazon.co.uk');
      });
    });

    describe('trackClick', () => {
      it('should track click with valid data', async () => {
        const linkId = 'test-link-id';
        const clickData = {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          referrer: 'https://www.google.com',
          country: 'US',
          city: 'New York',
          deviceType: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
        };

        // Mock database operations
        const mockDb = require('../server/database').db;
        mockDb.insert.mockResolvedValue({ id: 'click-id' });
        mockDb.update.mockResolvedValue({ affectedRows: 1 });

        await AmazonAssociatesService.trackClick(linkId, clickData);

        expect(mockDb.insert).toHaveBeenCalledWith(expect.objectContaining({
          affiliateLinkId: linkId,
          ipAddress: clickData.ipAddress,
          userAgent: clickData.userAgent,
          referrer: clickData.referrer,
          country: clickData.country,
          city: clickData.city,
          deviceType: clickData.deviceType,
          browser: clickData.browser,
          os: clickData.os,
        }));
      });

      it('should detect bot traffic', async () => {
        const linkId = 'test-link-id';
        const botData = {
          ipAddress: '192.168.1.1',
          userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
        };

        const mockDb = require('../server/database').db;
        mockDb.insert.mockResolvedValue({ id: 'click-id' });
        mockDb.update.mockResolvedValue({ affectedRows: 1 });

        await AmazonAssociatesService.trackClick(linkId, botData);

        expect(mockDb.insert).toHaveBeenCalledWith(expect.objectContaining({
          isBot: true,
          fraudScore: expect.any(Number),
        }));
      });

      it('should handle tracking errors gracefully', async () => {
        const linkId = 'test-link-id';
        const clickData = { ipAddress: '192.168.1.1' };

        const mockDb = require('../server/database').db;
        mockDb.insert.mockRejectedValue(new Error('Database error'));

        // Should not throw error to avoid breaking user experience
        await expect(
          AmazonAssociatesService.trackClick(linkId, clickData)
        ).resolves.toBeUndefined();
      });
    });

    describe('trackConversion', () => {
      it('should track conversion with sale data', async () => {
        const linkId = 'test-link-id';
        const saleData = {
          orderId: 'order-123',
          productId: 'B08N5WRWNW',
          revenue: 99.99,
          commission: 4.99,
          currency: 'USD',
        };

        const mockDb = require('../server/database').db;
        mockDb.update.mockResolvedValue({ affectedRows: 1 });

        await AmazonAssociatesService.trackConversion(linkId, saleData);

        expect(mockDb.update).toHaveBeenCalledWith(expect.objectContaining({
          conversionCount: expect.any(Number),
          revenue: expect.any(Number),
        }));
      });

      it('should throw error on conversion tracking failure', async () => {
        const linkId = 'test-link-id';
        const saleData = {
          orderId: 'order-123',
          productId: 'B08N5WRWNW',
          revenue: 99.99,
          commission: 4.99,
          currency: 'USD',
        };

        const mockDb = require('../server/database').db;
        mockDb.update.mockRejectedValue(new Error('Database error'));

        await expect(
          AmazonAssociatesService.trackConversion(linkId, saleData)
        ).rejects.toThrow('Failed to track conversion');
      });
    });

    describe('getStatistics', () => {
      it('should return user statistics', async () => {
        const userId = 'test-user-id';
        const mockLinks = [
          { clickCount: 100, conversionCount: 5, revenue: 500 },
          { clickCount: 50, conversionCount: 2, revenue: 200 },
        ];

        const mockDb = require('../server/database').db;
        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockLinks),
          }),
        });

        const stats = await AmazonAssociatesService.getStatistics(userId);

        expect(stats.totalClicks).toBe(150);
        expect(stats.totalConversions).toBe(7);
        expect(stats.totalRevenue).toBe(700);
        expect(stats.averageConversionRate).toBeCloseTo(4.67, 2);
        expect(stats.topProducts).toHaveLength(2);
      });

      it('should handle empty statistics', async () => {
        const userId = 'test-user-id';
        const mockDb = require('../server/database').db;
        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });

        const stats = await AmazonAssociatesService.getStatistics(userId);

        expect(stats.totalClicks).toBe(0);
        expect(stats.totalConversions).toBe(0);
        expect(stats.totalRevenue).toBe(0);
        expect(stats.averageConversionRate).toBe(0);
        expect(stats.topProducts).toHaveLength(0);
      });
    });

    describe('validateProductUrl', () => {
      it('should validate correct Amazon URLs', () => {
        const validUrls = [
          'https://www.amazon.com/dp/B08N5WRWNW',
          'https://www.amazon.co.uk/gp/product/B08N5WRWNW',
          'https://www.amazon.ca/dp/B08N5WRWNW?ref=as_li_ss_tl',
        ];

        validUrls.forEach(url => {
          expect(AmazonAssociatesService.validateProductUrl(url)).toBe(true);
        });
      });

      it('should reject invalid URLs', () => {
        const invalidUrls = [
          'https://www.google.com/product/123',
          'https://www.amazon.com/search?q=product',
          'not-a-url',
          'https://www.amazon.com/',
        ];

        invalidUrls.forEach(url => {
          expect(AmazonAssociatesService.validateProductUrl(url)).toBe(false);
        });
      });
    });
  });

  describe('Secure Storage', () => {
    describe('encryption/decryption', () => {
      it('should encrypt and decrypt data correctly', () => {
        const testData = 'sensitive-api-key-123';
        const encrypted = SecureStorage.encrypt(testData);
        const decrypted = SecureStorage.decrypt(encrypted);

        expect(decrypted).toBe(testData);
        expect(encrypted).not.toBe(testData);
        expect(encrypted).toContain(':');
      });

      it('should handle different data types', () => {
        const testCases = [
          'simple-string',
          'complex-string-with-special-chars!@#$%^&*()',
          '123456789',
          '',
        ];

        testCases.forEach(testData => {
          const encrypted = SecureStorage.encrypt(testData);
          const decrypted = SecureStorage.decrypt(encrypted);
          expect(decrypted).toBe(testData);
        });
      });

      it('should throw error for invalid encrypted data', () => {
        expect(() => {
          SecureStorage.decrypt('invalid-encrypted-data');
        }).toThrow('Invalid encrypted data format');
      });
    });

    describe('affiliate credentials', () => {
      it('should store and retrieve affiliate credentials', async () => {
        const userId = 'test-user-id';
        const network = 'amazon';
        const credentials = {
          apiKey: 'test-api-key',
          apiSecret: 'test-api-secret',
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
        };

        // Mock database operations
        const mockDb = require('../server/database').db;
        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        });
        mockDb.insert.mockResolvedValue({ id: 'network-id' });

        await SecureStorage.storeAffiliateCredentials(userId, network, credentials);

        expect(mockDb.insert).toHaveBeenCalledWith(expect.objectContaining({
          userId,
          network,
          apiKey: expect.any(String), // Should be encrypted
          apiSecret: expect.any(String), // Should be encrypted
        }));
      });
    });
  });

  describe('Fraud Detection', () => {
    it('should detect bot user agents', async () => {
      const botUserAgents = [
        'Googlebot/2.1 (+http://www.google.com/bot.html)',
        'Bingbot/2.0 (+http://www.bing.com/bingbot.htm)',
        'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      ];

      for (const userAgent of botUserAgents) {
        const request = { userAgent };
        // We can't directly test the private method, but we can test through trackClick
        const mockDb = require('../server/database').db;
        mockDb.insert.mockResolvedValue({ id: 'click-id' });
        mockDb.update.mockResolvedValue({ affectedRows: 1 });

        await AmazonAssociatesService.trackClick('test-link-id', request);

        expect(mockDb.insert).toHaveBeenCalledWith(expect.objectContaining({
          isBot: true,
        }));
      }
    });

    it('should detect suspicious IP patterns', async () => {
      const suspiciousIPs = ['127.0.0.1', '::1', '0.0.0.0'];

      for (const ip of suspiciousIPs) {
        const request = { ipAddress: ip };
        const mockDb = require('../server/database').db;
        mockDb.insert.mockResolvedValue({ id: 'click-id' });
        mockDb.update.mockResolvedValue({ affectedRows: 1 });

        await AmazonAssociatesService.trackClick('test-link-id', request);

        expect(mockDb.insert).toHaveBeenCalledWith(expect.objectContaining({
          fraudScore: expect.any(Number),
        }));
      }
    });
  });

  describe('URL Processing', () => {
    it('should extract product IDs from various Amazon URL formats', () => {
      const testCases = [
        {
          url: 'https://www.amazon.com/dp/B08N5WRWNW',
          expected: 'B08N5WRWNW',
        },
        {
          url: 'https://www.amazon.co.uk/gp/product/B08N5WRWNW',
          expected: 'B08N5WRWNW',
        },
        {
          url: 'https://www.amazon.com/product/B08N5WRWNW/ref=as_li_ss_tl',
          expected: 'B08N5WRWNW',
        },
        {
          url: 'https://www.amazon.com/dp/B08N5WRWNW?ie=UTF8&psc=1',
          expected: 'B08N5WRWNW',
        },
      ];

      testCases.forEach(({ url, expected }) => {
        const affiliateUrl = AmazonAssociatesService.generateAffiliateLink(
          'test-user-id',
          url,
          'test-campaign-id'
        );
        expect(affiliateUrl).toContain(expected);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const mockDb = require('../server/database').db;
      mockDb.insert.mockRejectedValue(new Error('Connection timeout'));

      await expect(
        AmazonAssociatesService.trackClick('test-link-id', { ipAddress: '192.168.1.1' })
      ).resolves.toBeUndefined();
    });

    it('should handle invalid URLs gracefully', async () => {
      await expect(
        AmazonAssociatesService.generateAffiliateLink(
          'test-user-id',
          'not-a-valid-url',
          'test-campaign-id'
        )
      ).rejects.toThrow();
    });

    it('should handle missing credentials gracefully', async () => {
      (SecureStorage.getAffiliateCredentials as jest.Mock).mockResolvedValue(null);

      await expect(
        AmazonAssociatesService.generateAffiliateLink(
          'test-user-id',
          'https://www.amazon.com/dp/B08N5WRWNW',
          'test-campaign-id'
        )
      ).rejects.toThrow('Amazon Associates credentials not found');
    });
  });
}); 