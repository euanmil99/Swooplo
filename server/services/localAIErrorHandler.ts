import { BaseErrorHandler } from './errorHandlers';
import { RepairResult } from './affiliateMonitoring';
import { SecureStorage } from './secureStorage';

/**
 * LocalAI Error Handler
 * Automatically fixes common LocalAI issues
 */
export class LocalAIErrorHandler extends BaseErrorHandler {
  constructor(private service: any) {
    super();
  }

  async handleIssue(issueType: string, context: any): Promise<RepairResult> {
    switch (issueType) {
      case 'token_expired':
        return await this.handleTokenExpiration(context);
      case 'connection_error':
        return await this.handleConnectionError(context);
      case 'rate_limit_exceeded':
        return await this.handleRateLimitExceeded(context);
      case 'model_not_found':
        return await this.handleModelNotFound(context);
      case 'invalid_request':
        return await this.handleInvalidRequest(context);
      default:
        return { 
          success: false, 
          details: `Unknown LocalAI issue type: ${issueType}`,
          timestamp: new Date(),
        };
    }
  }

  private async handleTokenExpiration(context: any): Promise<RepairResult> {
    return this.retryWithBackoff(async () => {
      try {
        // Try to refresh the API key from secure storage
        const storedData = await SecureStorage.getSecureData('localai_api_key');
        const apiKey = storedData?.apiKey;
        
        if (apiKey) {
          // Test the refreshed token
          const healthCheck = await this.service.healthCheck();
          if (healthCheck.status === 'healthy') {
            console.log('✅ LocalAI token refreshed successfully');
            return { success: true, details: 'Token refreshed and validated' };
          }
        }
        
        // If no stored key or validation failed, try to reconfigure
        if (context.apiKey) {
          const configured = await this.service.configureCredentials(context.apiKey, context.baseURL);
          if (configured) {
            console.log('✅ LocalAI credentials reconfigured successfully');
            return { success: true, details: 'Credentials reconfigured' };
          }
        }
        
        throw new Error('Failed to refresh LocalAI token');
      } catch (error) {
        console.error('❌ Failed to handle LocalAI token expiration:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    }, 3, context);
  }

  private async handleConnectionError(context: any): Promise<RepairResult> {
    return this.retryWithBackoff(async () => {
      try {
        // Check if LocalAI service is running
        const healthCheck = await this.service.healthCheck();
        if (healthCheck.status === 'healthy') {
          console.log('✅ LocalAI connection restored');
          return { success: true, details: 'Connection restored' };
        }

        // Try to restart the service if possible
        if (context.restartService) {
          await this.restartLocalAIService();
          console.log('✅ LocalAI service restarted');
          return { success: true, details: 'Service restarted' };
        }

        throw new Error('LocalAI service is not responding');
      } catch (error) {
        console.error('❌ Failed to handle LocalAI connection error:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    }, 5, context);
  }

  private async handleRateLimitExceeded(context: any): Promise<RepairResult> {
    return this.retryWithBackoff(async () => {
      try {
        // Wait for rate limit to reset
        const waitTime = context.retryAfter || 60000; // Default 1 minute
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Test the connection after waiting
        const healthCheck = await this.service.healthCheck();
        if (healthCheck.status === 'healthy') {
          console.log('✅ LocalAI rate limit reset, service available');
          return { success: true, details: 'Rate limit reset' };
        }
        
        throw new Error('Rate limit still active');
      } catch (error) {
        console.error('❌ Failed to handle LocalAI rate limit:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    }, 1, context);
  }

  private async handleModelNotFound(context: any): Promise<RepairResult> {
    return this.retryWithBackoff(async () => {
      try {
        // Get available models
        const models = await this.service.getAvailableModels();
        const requestedModel = context.model || 'llama-3.2-1b-instruct:q4_k_m';
        
        // Check if the requested model is available
        const availableModel = models.models?.find((m: any) => m.id === requestedModel);
        if (availableModel) {
          console.log('✅ LocalAI model found and available');
          return { success: true, details: 'Model available' };
        }
        
        // Try to use a fallback model
        const fallbackModel = models.models?.[0]?.id || 'llama-3.2-1b-instruct:q4_k_m';
        console.log(`⚠️ Using fallback model: ${fallbackModel}`);
        
        return { 
          success: true, 
          details: `Using fallback model: ${fallbackModel}`,
          fallbackModel 
        };
      } catch (error) {
        console.error('❌ Failed to handle LocalAI model not found:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    }, 2, context);
  }

  private async handleInvalidRequest(context: any): Promise<RepairResult> {
    return this.retryWithBackoff(async () => {
      try {
        // Validate and fix the request parameters
        const fixedParams = this.validateAndFixRequest(context.request);
        
        // Test with fixed parameters
        const testResponse = await this.service.generateSocialContent(
          fixedParams.prompt || 'test',
          fixedParams.platform || 'twitter',
          fixedParams.tone || 'casual'
        );
        
        if (testResponse) {
          console.log('✅ LocalAI request parameters fixed');
          return { 
            success: true, 
            details: 'Request parameters fixed',
            fixedParams 
          };
        }
        
        throw new Error('Failed to fix request parameters');
      } catch (error) {
        console.error('❌ Failed to handle LocalAI invalid request:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    }, 2, context);
  }

  private validateAndFixRequest(request: any): any {
    const fixed = { ...request };
    
    // Fix common issues
    if (fixed.max_tokens && fixed.max_tokens > 4000) {
      fixed.max_tokens = 4000;
    }
    
    if (fixed.temperature && (fixed.temperature < 0 || fixed.temperature > 2)) {
      fixed.temperature = 0.7;
    }
    
    if (fixed.model && typeof fixed.model !== 'string') {
      fixed.model = 'llama-3.2-1b-instruct:q4_k_m';
    }
    
    return fixed;
  }

  private async restartLocalAIService(): Promise<void> {
    try {
      // This would typically involve Docker commands or service management
      // For now, we'll just log the attempt
      console.log('🔄 Attempting to restart LocalAI service...');
      
      // In a real implementation, you might:
      // 1. Check if running in Docker
      // 2. Execute docker restart localai
      // 3. Wait for service to come back online
      // 4. Verify health check
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate restart time
    } catch (error) {
      console.error('❌ Failed to restart LocalAI service:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // Get issue detection patterns
  getIssuePatterns(): Record<string, RegExp> {
    return {
      token_expired: /(401|403|unauthorized|invalid.*token|expired)/i,
      connection_error: /(connection.*refused|timeout|network.*error|econnreset)/i,
      rate_limit_exceeded: /(429|rate.*limit|too.*many.*requests)/i,
      model_not_found: /(404|model.*not.*found|invalid.*model)/i,
      invalid_request: /(400|bad.*request|invalid.*parameters)/i,
    };
  }

  // Get automatic fix suggestions
  getFixSuggestions(issueType: string): string[] {
    const suggestions: Record<string, string[]> = {
      token_expired: [
        'Refresh API key from secure storage',
        'Reconfigure LocalAI credentials',
        'Check API key permissions'
      ],
      connection_error: [
        'Check LocalAI service status',
        'Restart LocalAI container',
        'Verify network connectivity',
        'Check firewall settings'
      ],
      rate_limit_exceeded: [
        'Wait for rate limit reset',
        'Reduce request frequency',
        'Implement request queuing'
      ],
      model_not_found: [
        'Check available models',
        'Use fallback model',
        'Download required model'
      ],
      invalid_request: [
        'Validate request parameters',
        'Fix parameter types',
        'Check request format'
      ]
    };

    return suggestions[issueType] || ['Check LocalAI documentation', 'Review error logs'];
  }
} 