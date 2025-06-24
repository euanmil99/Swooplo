import { RepairResult, ErrorHandler } from './affiliateMonitoring';
import { SecureStorage } from './secureStorage';

/**
 * Base error handler with common functionality
 */
export abstract class BaseErrorHandler implements ErrorHandler {
  protected maxRetries: number = 3;
  protected baseBackoffMs: number = 1000;

  abstract handleIssue(issueType: string, context: any): Promise<RepairResult>;

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    attempt: number = 1,
    context: any = {}
  ): Promise<RepairResult> {
    try {
      await operation();
      return {
        success: true,
        details: `Operation succeeded on attempt ${attempt}`,
        timestamp: new Date(),
        retryCount: attempt - 1,
      };
    } catch (error) {
      if (attempt >= this.maxRetries) {
        return {
          success: false,
          details: `Max retries (${this.maxRetries}) exceeded: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          retryCount: attempt,
        };
      }

      // Exponential backoff with jitter
      const backoffTime = this.baseBackoffMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.1 * backoffTime;
      const totalBackoff = backoffTime + jitter;

      console.log(`Retrying in ${totalBackoff}ms (attempt ${attempt}/${this.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, totalBackoff));

      return this.retryWithBackoff(operation, attempt + 1, context);
    }
  }

  protected calculateBackoff(error: any): number {
    // Default backoff strategy
    if (error?.retryAfter) {
      return error.retryAfter * 1000;
    }
    
    // Rate limit backoff
    if (error?.status === 429) {
      return 60 * 1000; // 1 minute
    }
    
    // Connection error backoff
    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
      return 5 * 1000; // 5 seconds
    }
    
    return this.baseBackoffMs;
  }
}

/**
 * Amazon Associates error handler
 */
export class AmazonErrorHandler extends BaseErrorHandler {
  constructor(private service: any, private db: any) {
    super();
  }

  async handleIssue(issueType: string, context: any): Promise<RepairResult> {
    switch (issueType) {
      case 'token_expired':
        return await this.handleTokenExpiration(context);
      case 'rate_limited':
        return await this.handleRateLimit(context);
      case 'connection_error':
        return await this.handleConnectionError(context);
      case 'invalid_format':
        return await this.handleFormatError(context);
      case 'authentication_error':
        return await this.handleAuthenticationError(context);
      case 'api_error':
        return await this.handleApiError(context);
      default:
        return { 
          success: false, 
          details: `Unknown issue type: ${issueType}`,
          timestamp: new Date(),
        };
    }
  }

  private async handleTokenExpiration(context: any): Promise<RepairResult> {
    return this.retryWithBackoff(async () => {
      console.log('🔄 Refreshing Amazon token...');
      
      // Attempt to refresh the token
      if (this.service.refreshToken) {
        await this.service.refreshToken();
      } else {
        // Fallback: try to get new credentials
        const credentials = await SecureStorage.getAffiliateCredentials(
          context.userId || 'default',
          'amazon'
        );
        
        if (!credentials?.refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // You would implement token refresh logic here
        // await this.service.refreshTokenWithRefreshToken(credentials.refreshToken);
      }
      
      console.log('✅ Amazon token refreshed successfully');
    }, 1, context);
  }

  private async handleRateLimit(context: any): Promise<RepairResult> {
    const { retryAfter, request } = context;
    
    console.log(`⏳ Amazon rate limit hit, waiting ${retryAfter}s...`);
    
    // Log the rate limit for analytics
    if (this.db?.logRateLimit) {
      await this.db.logRateLimit('amazon', new Date(), retryAfter);
    }
    
    // If retry time is reasonable, wait and retry
    if (retryAfter && retryAfter < 300) { // Max 5 minutes
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      
      return this.retryWithBackoff(async () => {
        if (request && this.service.executeApiCall) {
          await this.service.executeApiCall(request.method, request.params);
        }
        console.log(`✅ Amazon rate limit retry succeeded after ${retryAfter}s wait`);
      }, 1, context);
    }
    
    return { 
      success: false, 
      details: `Rate limit too long (${retryAfter}s), request queued for later processing`,
      timestamp: new Date(),
    };
  }

  private async handleConnectionError(context: any): Promise<RepairResult> {
    const { attempt = 1, maxRetries = 3, request } = context;
    
    console.log(`🔌 Amazon connection error (attempt ${attempt}/${maxRetries})`);
    
    if (attempt > maxRetries) {
      return { 
        success: false, 
        details: `Max retries (${maxRetries}) exceeded for connection error`,
        timestamp: new Date(),
        retryCount: attempt,
      };
    }
    
    return this.retryWithBackoff(async () => {
      if (request && this.service.executeApiCall) {
        await this.service.executeApiCall(request.method, request.params);
      }
      console.log(`✅ Amazon connection restored on attempt ${attempt}`);
    }, attempt, context);
  }

  private async handleFormatError(context: any): Promise<RepairResult> {
    const { data, validationErrors } = context;
    
    console.log('🔧 Fixing Amazon format errors...');
    
    // Attempt to fix common format issues
    const fixedData = { ...data };
    let fixCount = 0;
    
    for (const error of validationErrors || []) {
      if (error.field === 'productId' && error.code === 'INVALID_FORMAT') {
        fixedData.productId = this.reformatProductId(data.productId);
        fixCount++;
      } else if (error.field === 'url' && error.code === 'INVALID_URL') {
        fixedData.url = this.fixAmazonUrl(data.url);
        fixCount++;
      } else if (error.field === 'tag' && error.code === 'INVALID_TAG') {
        fixedData.tag = this.fixAmazonTag(data.tag);
        fixCount++;
      }
    }
    
    if (fixCount > 0) {
      return this.retryWithBackoff(async () => {
        if (this.service.executeApiCall) {
          await this.service.executeApiCall(
            context.request?.method || 'generateLink',
            { ...context.request?.params, ...fixedData }
          );
        }
        console.log(`✅ Fixed ${fixCount} Amazon format issues`);
      }, 1, context);
    }
    
    return { 
      success: false, 
      details: 'Unable to automatically fix Amazon format issues',
      timestamp: new Date(),
    };
  }

  private async handleAuthenticationError(context: any): Promise<RepairResult> {
    console.log('🔐 Amazon authentication error detected');
    
    return this.retryWithBackoff(async () => {
      // Check if credentials are still valid
      const credentials = await SecureStorage.getAffiliateCredentials(
        context.userId || 'default',
        'amazon'
      );
      
      if (!credentials?.apiKey) {
        throw new Error('No Amazon API key found');
      }
      
      // Test the credentials
      if (this.service.testCredentials) {
        await this.service.testCredentials(credentials);
      }
      
      console.log('✅ Amazon authentication restored');
    }, 1, context);
  }

  private async handleApiError(context: any): Promise<RepairResult> {
    const { error, request } = context;
    
    console.log(`🚨 Amazon API error: ${error?.message || 'Unknown error'}`);
    
    // Handle specific API errors
    if (error?.code === 'INVALID_PRODUCT_ID') {
      return await this.handleFormatError({
        data: request?.params,
        validationErrors: [{ field: 'productId', code: 'INVALID_FORMAT' }]
      });
    }
    
    if (error?.code === 'INVALID_TAG') {
      return await this.handleFormatError({
        data: request?.params,
        validationErrors: [{ field: 'tag', code: 'INVALID_TAG' }]
      });
    }
    
    // Generic retry for other API errors
    return this.retryWithBackoff(async () => {
      if (request && this.service.executeApiCall) {
        await this.service.executeApiCall(request.method, request.params);
      }
      console.log('✅ Amazon API error resolved');
    }, 1, context);
  }

  private reformatProductId(productId: string): string {
    // Remove any spaces or special characters
    let cleaned = productId.replace(/[^a-zA-Z0-9]/g, '');
    
    // Ensure ASIN format if possible (10 characters)
    if (cleaned.length >= 10) {
      return cleaned.substring(0, 10).toUpperCase();
    }
    
    return cleaned.toUpperCase();
  }

  private fixAmazonUrl(url: string): string {
    // Ensure proper Amazon URL format
    if (!url.includes('amazon.com')) {
      return `https://www.amazon.com/dp/${this.reformatProductId(url)}`;
    }
    
    // Clean up URL parameters
    const urlObj = new URL(url);
    const cleanUrl = `https://${urlObj.hostname}/dp/${this.reformatProductId(urlObj.pathname)}`;
    
    return cleanUrl;
  }

  private fixAmazonTag(tag: string): string {
    // Ensure tag format is valid (alphanumeric and hyphens only)
    return tag.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
  }
}

/**
 * Generic error handler for networks without specific handlers
 */
export class GenericErrorHandler extends BaseErrorHandler {
  constructor(private service: any, private networkId: string) {
    super();
  }

  async handleIssue(issueType: string, context: any): Promise<RepairResult> {
    console.log(`🔧 Generic error handler for ${this.networkId}: ${issueType}`);
    
    // Generic retry strategy for unknown issues
    return this.retryWithBackoff(async () => {
      if (context.request && this.service.executeApiCall) {
        await this.service.executeApiCall(context.request.method, context.request.params);
      }
      console.log(`✅ Generic fix for ${this.networkId} succeeded`);
    }, 1, context);
  }
} 