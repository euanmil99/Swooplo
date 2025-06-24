import { AffiliateMonitoringService, NetworkMonitor, NetworkCredentials } from './affiliateMonitoring';
import { AmazonAssociatesService } from './amazonAssociates';
import { ClickBankService } from './clickBank';
import { LocalAIService } from './localai';
import { LocalAIErrorHandler } from './localAIErrorHandler';
import { AmazonErrorHandler, GenericErrorHandler } from './errorHandlers';
import { SecureStorage } from './secureStorage';
import { db } from '../database';
import { affiliateNetworks } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Amazon API Client for monitoring
 */
export class AmazonApiClient {
  constructor(
    private apiKey: string,
    private apiSecret?: string
  ) {}

  async testConnection(): Promise<{
    latency: number;
    rateLimit: number;
    remainingCalls: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Make a lightweight API call to test connection
      const response = await fetch('https://api.amazon.com/paapi5/test', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const latency = Date.now() - startTime;
      
      return {
        latency,
        rateLimit: 8640, // Amazon's daily limit
        remainingCalls: parseInt(response.headers.get('X-RateLimit-Remaining') || '8640'),
      };
    } catch (error) {
      throw new Error(`Amazon API connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProductInfo(productId: string): Promise<any> {
    // Implementation for getting product information
    // This would use Amazon's Product Advertising API
    throw new Error('Amazon API product info not implemented yet');
  }
}

/**
 * Amazon Monitor for the monitoring service
 */
export class AmazonMonitor implements NetworkMonitor {
  constructor(private apiClient: AmazonApiClient) {}

  async monitorApiStatus(): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.apiClient.testConnection();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        rateLimit: {
          remaining: result.remainingCalls,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          limit: result.rateLimit,
        },
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  async checkLinkHealth(links: string[]): Promise<any> {
    const validLinks: string[] = [];
    const invalidLinks: string[] = [];
    const suggestedFixes: Record<string, string> = {};

    for (const link of links) {
      try {
        // Basic validation for Amazon links
        if (link.includes('amazon.com') && link.includes('/dp/')) {
          validLinks.push(link);
        } else {
          invalidLinks.push(link);
          suggestedFixes[link] = 'Invalid Amazon product URL format';
        }
      } catch (error) {
        invalidLinks.push(link);
        suggestedFixes[link] = 'URL validation failed';
      }
    }

    return {
      validLinks,
      invalidLinks,
      suggestedFixes,
      timestamp: new Date(),
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.apiClient.testConnection();
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * ClickBank Monitor for the monitoring service
 */
export class ClickBankMonitor implements NetworkMonitor {
  constructor(private apiKey: string) {}

  async monitorApiStatus(): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await ClickBankService.testConnection(this.apiKey);
      const responseTime = Date.now() - startTime;
      
      return {
        status: result.status,
        responseTime: result.latency,
        rateLimit: {
          remaining: 1000, // ClickBank typically has high limits
          resetTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          limit: 10000,
        },
        lastChecked: new Date(),
        error: result.error,
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  async checkLinkHealth(links: string[]): Promise<any> {
    const validLinks: string[] = [];
    const invalidLinks: string[] = [];
    const suggestedFixes: Record<string, string> = {};

    for (const link of links) {
      try {
        // Validate ClickBank links
        if (ClickBankService.validateProductUrl(link)) {
          validLinks.push(link);
        } else {
          invalidLinks.push(link);
          suggestedFixes[link] = 'Invalid ClickBank product URL format';
        }
      } catch (error) {
        invalidLinks.push(link);
        suggestedFixes[link] = 'URL validation failed';
      }
    }

    return {
      validLinks,
      invalidLinks,
      suggestedFixes,
      timestamp: new Date(),
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await ClickBankService.testConnection(this.apiKey);
      return result.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}

/**
 * Commission Junction Monitor (placeholder for future implementation)
 */
export class CommissionJunctionMonitor implements NetworkMonitor {
  async monitorApiStatus(): Promise<any> {
    // Placeholder implementation
    return {
      status: 'offline',
      responseTime: 0,
      error: 'Commission Junction integration not yet implemented',
      lastChecked: new Date(),
    };
  }

  async checkLinkHealth(links: string[]): Promise<any> {
    return {
      validLinks: [],
      invalidLinks: links,
      suggestedFixes: {},
      timestamp: new Date(),
    };
  }

  async testConnection(): Promise<boolean> {
    return false;
  }
}

/**
 * LocalAI Monitor for the monitoring service
 */
export class LocalAIMonitor implements NetworkMonitor {
  constructor(private service: LocalAIService) {}

  async monitorApiStatus(): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.service.healthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        status: result.status,
        responseTime: result.responseTime || responseTime,
        rateLimit: {
          remaining: 1000, // LocalAI typically has high limits
          resetTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          limit: 10000,
        },
        lastChecked: new Date(),
        error: result.error,
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  async checkLinkHealth(links: string[]): Promise<any> {
    // LocalAI doesn't have links, but we can check model availability
    try {
      const models = await this.service.getAvailableModels();
      const availableModels = models.models?.length || 0;
      
      return {
        validLinks: [], // LocalAI doesn't use links
        invalidLinks: [],
        suggestedFixes: {},
        availableModels,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        validLinks: [],
        invalidLinks: [],
        suggestedFixes: {},
        availableModels: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.service.healthCheck();
      return result.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}

/**
 * Main network integration service
 */
export class NetworkIntegrationService {
  private networks: Map<string, any> = new Map();
  private monitoringService: AffiliateMonitoringService;

  constructor() {
    // Initialize monitoring service with console notifications
    this.monitoringService = new AffiliateMonitoringService(
      new (require('./affiliateMonitoring').ConsoleNotificationService)(),
      5 * 60 * 1000 // 5 minutes
    );
    
    // Initialize with Amazon since it's already working
    this.initAmazonAssociates();
  }

  /**
   * Initialize Amazon Associates integration
   */
  private async initAmazonAssociates(): Promise<void> {
    try {
      // Get Amazon credentials from secure storage
      const credentials = await SecureStorage.getAffiliateCredentials('default', 'amazon');
      
      if (!credentials?.apiKey) {
        console.log('⚠️ Amazon credentials not found, skipping initialization');
        return;
      }

      // Create Amazon API client
      const amazonClient = new AmazonApiClient(credentials.apiKey, credentials.apiSecret);
      
      // Create Amazon service (using existing implementation)
      const amazonService = new AmazonAssociatesService();
      
      // Create Amazon monitor
      const amazonMonitor = new AmazonMonitor(amazonClient);
      
      // Create Amazon error handler
      const amazonErrorHandler = new AmazonErrorHandler(amazonService, db);

      // Register with monitoring service
      this.monitoringService.registerNetwork('amazon', amazonMonitor, amazonErrorHandler);
      
      // Store in networks map
      this.networks.set('amazon', amazonService);

      console.log('✅ Amazon Associates integration initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Amazon Associates:', error);
    }
  }

  /**
   * Add a new network to the integration
   */
  async addNetwork(networkId: string, credentials: NetworkCredentials): Promise<boolean> {
    try {
      console.log(`🔄 Adding network: ${networkId}`);
      
      // Store credentials securely
      await SecureStorage.storeAffiliateCredentials(
        credentials.networkId,
        networkId,
        {
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
        }
      );

      // Initialize network based on type
      switch (networkId.toLowerCase()) {
        case 'clickbank':
          return await this.initClickBank(credentials);
        case 'shareasale':
          return await this.initShareASale(credentials);
        case 'cj':
        case 'commissionjunction':
          return await this.initCommissionJunction(credentials);
        case 'rakuten':
          return await this.initRakuten(credentials);
        case 'awin':
          return await this.initAwin(credentials);
        default:
          throw new Error(`Unknown network: ${networkId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to add network ${networkId}:`, error);
      return false;
    }
  }

  /**
   * Initialize ClickBank integration
   */
  private async initClickBank(credentials: NetworkCredentials): Promise<boolean> {
    try {
      // Create ClickBank monitor (placeholder)
      const clickBankMonitor = new ClickBankMonitor(credentials.apiKey);
      
      // Create generic error handler for now
      const clickBankErrorHandler = new GenericErrorHandler({}, 'clickbank');

      // Register with monitoring service
      this.monitoringService.registerNetwork('clickbank', clickBankMonitor, clickBankErrorHandler);

      console.log('✅ ClickBank integration initialized (monitoring only)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize ClickBank:', error);
      return false;
    }
  }

  /**
   * Initialize ShareASale integration
   */
  private async initShareASale(credentials: NetworkCredentials): Promise<boolean> {
    try {
      // Placeholder implementation
      const shareASaleMonitor = new GenericErrorHandler({}, 'shareasale');
      
      this.monitoringService.registerNetwork('shareasale', {
        monitorApiStatus: async () => ({ status: 'offline', responseTime: 0, lastChecked: new Date() }),
        checkLinkHealth: async () => ({ validLinks: [], invalidLinks: [], suggestedFixes: {}, timestamp: new Date() }),
        testConnection: async () => false,
      }, shareASaleMonitor);

      console.log('✅ ShareASale integration initialized (monitoring only)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize ShareASale:', error);
      return false;
    }
  }

  /**
   * Initialize Commission Junction integration
   */
  private async initCommissionJunction(credentials: NetworkCredentials): Promise<boolean> {
    try {
      const cjMonitor = new CommissionJunctionMonitor();
      const cjErrorHandler = new GenericErrorHandler({}, 'commissionjunction');
      
      this.monitoringService.registerNetwork('commissionjunction', cjMonitor, cjErrorHandler);

      console.log('✅ Commission Junction integration initialized (monitoring only)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Commission Junction:', error);
      return false;
    }
  }

  /**
   * Initialize Rakuten integration
   */
  private async initRakuten(credentials: NetworkCredentials): Promise<boolean> {
    try {
      // Placeholder implementation
      const rakutenMonitor = new GenericErrorHandler({}, 'rakuten');
      
      this.monitoringService.registerNetwork('rakuten', {
        monitorApiStatus: async () => ({ status: 'offline', responseTime: 0, lastChecked: new Date() }),
        checkLinkHealth: async () => ({ validLinks: [], invalidLinks: [], suggestedFixes: {}, timestamp: new Date() }),
        testConnection: async () => false,
      }, rakutenMonitor);

      console.log('✅ Rakuten integration initialized (monitoring only)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Rakuten:', error);
      return false;
    }
  }

  /**
   * Initialize Awin integration
   */
  private async initAwin(credentials: NetworkCredentials): Promise<boolean> {
    try {
      // Placeholder implementation
      const awinMonitor = new GenericErrorHandler({}, 'awin');
      
      this.monitoringService.registerNetwork('awin', {
        monitorApiStatus: async () => ({ status: 'offline', responseTime: 0, lastChecked: new Date() }),
        checkLinkHealth: async () => ({ validLinks: [], invalidLinks: [], suggestedFixes: {}, timestamp: new Date() }),
        testConnection: async () => false,
      }, awinMonitor);

      console.log('✅ Awin integration initialized (monitoring only)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Awin:', error);
      return false;
    }
  }

  /**
   * Start monitoring all networks
   */
  async startMonitoring(): Promise<void> {
    await this.monitoringService.startMonitoring();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.monitoringService.stopMonitoring();
  }

  /**
   * Get network service by ID
   */
  getNetwork(networkId: string): any {
    return this.networks.get(networkId);
  }

  /**
   * Get all available networks
   */
  getAvailableNetworks(): string[] {
    return Array.from(this.networks.keys());
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): any {
    return this.monitoringService.getMonitoringStats();
  }

  /**
   * Get current network statuses
   */
  async getNetworkStatuses(): Promise<any> {
    return await this.monitoringService.getNetworkStatuses();
  }

  /**
   * Manually fix an issue
   */
  async fixIssue(networkId: string, issueType: string, context: any): Promise<boolean> {
    // Add special handling for LocalAI
    if (networkId === 'localai') {
      const localAIService = this.networks.get('localai');
      if (localAIService) {
        const localAIHandler = new LocalAIErrorHandler(localAIService);
        const result = await localAIHandler.handleIssue(issueType, context);
        return result.success;
      }
    }
    
    // Otherwise use the existing monitoring service
    return await this.monitoringService.fixIssue(networkId, issueType, context);
  }

  /**
   * Check if monitoring is active
   */
  isMonitoringActive(): boolean {
    return this.monitoringService.isMonitoringActive();
  }

  /**
   * Get supported networks
   */
  getSupportedNetworks(): string[] {
    return [
      'amazon',
      'clickbank',
      'shareasale',
      'commissionjunction',
      'rakuten',
      'awin',
    ];
  }

  /**
   * Remove a network
   */
  async removeNetwork(networkId: string): Promise<boolean> {
    try {
      // Remove from networks map
      this.networks.delete(networkId);
      
      // Remove from database
      await db
        .delete(affiliateNetworks)
        .where(eq(affiliateNetworks.network, networkId));
      
      console.log(`✅ Network removed: ${networkId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove network ${networkId}:`, error);
      return false;
    }
  }

  /**
   * Test all network connections
   */
  async testAllConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [networkId, service] of this.networks) {
      try {
        if (service.testConnection) {
          results[networkId] = await service.testConnection();
        } else {
          results[networkId] = false;
        }
      } catch (error) {
        results[networkId] = false;
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const networkIntegration = new NetworkIntegrationService(); 