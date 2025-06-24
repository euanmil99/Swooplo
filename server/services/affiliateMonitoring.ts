import { db } from '../database';
import { affiliateNetworks } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export interface LinkHealthReport {
  validLinks: string[];
  invalidLinks: string[];
  suggestedFixes: Record<string, string>;
  timestamp: Date;
}

export interface ApiStatusReport {
  status: 'healthy' | 'warning' | 'error' | 'offline';
  responseTime: number;
  rateLimit?: {
    remaining: number;
    resetTime: Date;
    limit: number;
  };
  error?: string;
  retryAfter?: number;
  lastChecked: Date;
}

export interface NetworkMonitor {
  monitorApiStatus(): Promise<ApiStatusReport>;
  checkLinkHealth(links: string[]): Promise<LinkHealthReport>;
  testConnection(): Promise<boolean>;
}

export interface ErrorHandler {
  handleIssue(issueType: string, context: any): Promise<RepairResult>;
}

export interface RepairResult {
  success: boolean;
  details: string;
  timestamp: Date;
  retryCount?: number;
}

export interface NetworkCredentials {
  apiKey: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  networkId: string;
}

/**
 * Central monitoring service for all affiliate networks
 */
export class AffiliateMonitoringService {
  private monitors: Map<string, NetworkMonitor> = new Map();
  private errorHandlers: Map<string, ErrorHandler> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(
    private notificationService?: NotificationService,
    private monitoringIntervalMs: number = 5 * 60 * 1000 // 5 minutes
  ) {}

  /**
   * Register a network with its monitor and error handler
   */
  registerNetwork(networkId: string, monitor: NetworkMonitor, errorHandler: ErrorHandler): void {
    this.monitors.set(networkId, monitor);
    this.errorHandlers.set(networkId, errorHandler);
    console.log(`✅ Network registered: ${networkId}`);
  }

  /**
   * Start continuous monitoring of all networks
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ Monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log('🚀 Starting affiliate network monitoring...');

    // Initial monitoring run
    await this.monitorAllNetworks();

    // Set up continuous monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.monitorAllNetworks();
    }, this.monitoringIntervalMs);

    console.log(`📊 Monitoring active - checking every ${this.monitoringIntervalMs / 1000}s`);
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Monitoring stopped');
  }

  /**
   * Monitor all registered networks
   */
  async monitorAllNetworks(): Promise<void> {
    const timestamp = new Date();
    const results: Record<string, ApiStatusReport> = {};

    console.log(`🔍 Monitoring ${this.monitors.size} networks at ${timestamp.toISOString()}`);

    const monitoringPromises = Array.from(this.monitors.entries()).map(async ([networkId, monitor]) => {
      try {
        const status = await monitor.monitorApiStatus();
        results[networkId] = status;

        // Update database with network status
        await this.updateNetworkStatus(networkId, status);

        // Handle any issues automatically
        if (status.status !== 'healthy') {
          await this.handleNetworkIssue(networkId, status);
        }

        console.log(`✅ ${networkId}: ${status.status} (${status.responseTime}ms)`);
        return { networkId, status, success: true };
      } catch (error) {
        const errorStatus: ApiStatusReport = {
          status: 'error',
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: timestamp,
        };

        results[networkId] = errorStatus;
        await this.updateNetworkStatus(networkId, errorStatus);
        await this.handleNetworkIssue(networkId, errorStatus);

        console.error(`❌ ${networkId}: ${errorStatus.error}`);
        return { networkId, status: errorStatus, success: false, error };
      }
    });

    const monitoringResults = await Promise.allSettled(monitoringPromises);
    
    // Log monitoring results
    await this.logMonitoringRun(timestamp, monitoringResults, results);

    // Send summary notification if there are issues
    const issues = Object.values(results).filter(status => status.status !== 'healthy');
    if (issues.length > 0) {
      await this.sendMonitoringAlert(issues, results);
    }
  }

  /**
   * Handle network issues automatically
   */
  private async handleNetworkIssue(networkId: string, status: ApiStatusReport): Promise<void> {
    const handler = this.errorHandlers.get(networkId);
    if (!handler) {
      console.error(`❌ No error handler for network: ${networkId}`);
      return;
    }

    let issueType = 'unknown';
    if (status.status === 'error') {
      issueType = status.error?.includes('rate limit') ? 'rate_limited' : 'connection_error';
    } else if (status.status === 'offline') {
      issueType = 'connection_error';
    }

    try {
      const context = {
        networkId,
        status,
        timestamp: new Date(),
        retryCount: 0,
      };

      const result = await handler.handleIssue(issueType, context);
      await this.logRepairAttempt(networkId, issueType, result);

      if (result.success) {
        console.log(`🔧 Auto-fixed ${issueType} for ${networkId}: ${result.details}`);
      } else {
        console.warn(`⚠️ Could not auto-fix ${issueType} for ${networkId}: ${result.details}`);
      }
    } catch (error) {
      console.error(`❌ Error handling issue for ${networkId}:`, error);
      await this.logRepairAttempt(networkId, issueType, {
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Update network status in database
   */
  private async updateNetworkStatus(networkId: string, status: ApiStatusReport): Promise<void> {
    try {
      await db
        .update(affiliateNetworks)
        .set({
          metadata: {
            ...status,
            lastStatusCheck: new Date(),
          },
          updatedAt: new Date(),
        })
        .where(eq(affiliateNetworks.network, networkId));
    } catch (error) {
      console.error(`Failed to update status for ${networkId}:`, error);
    }
  }

  /**
   * Log monitoring run results
   */
  private async logMonitoringRun(
    timestamp: Date,
    results: PromiseSettledResult<any>[],
    statuses: Record<string, ApiStatusReport>
  ): Promise<void> {
    try {
      const summary = {
        timestamp,
        totalNetworks: this.monitors.size,
        healthyNetworks: Object.values(statuses).filter(s => s.status === 'healthy').length,
        warningNetworks: Object.values(statuses).filter(s => s.status === 'warning').length,
        errorNetworks: Object.values(statuses).filter(s => s.status === 'error').length,
        offlineNetworks: Object.values(statuses).filter(s => s.status === 'offline').length,
        averageResponseTime: Object.values(statuses).reduce((sum, s) => sum + s.responseTime, 0) / Object.values(statuses).length,
      };

      // Store in database or log file
      console.log('📊 Monitoring Summary:', summary);
      
      // You could also store this in a monitoring_logs table
      // await db.insert(monitoringLogs).values(summary);
    } catch (error) {
      console.error('Failed to log monitoring run:', error);
    }
  }

  /**
   * Log repair attempts
   */
  private async logRepairAttempt(
    networkId: string,
    issueType: string,
    result: RepairResult
  ): Promise<void> {
    try {
      const repairLog = {
        networkId,
        issueType,
        success: result.success,
        details: result.details,
        timestamp: result.timestamp,
        retryCount: result.retryCount || 0,
      };

      console.log(`🔧 Repair attempt logged:`, repairLog);
      
      // You could store this in a repair_logs table
      // await db.insert(repairLogs).values(repairLog);
    } catch (error) {
      console.error('Failed to log repair attempt:', error);
    }
  }

  /**
   * Send monitoring alerts
   */
  private async sendMonitoringAlert(
    issues: ApiStatusReport[],
    allStatuses: Record<string, ApiStatusReport>
  ): Promise<void> {
    if (!this.notificationService) {
      console.log('📢 Monitoring alert (no notification service configured):', issues);
      return;
    }

    try {
      const alert = {
        type: 'monitoring_alert',
        severity: issues.some(i => i.status === 'error') ? 'high' : 'medium',
        message: `${issues.length} network(s) have issues`,
        details: {
          issues: issues.map(status => ({
            status: status.status,
            error: status.error,
            responseTime: status.responseTime,
          })),
          summary: {
            total: Object.keys(allStatuses).length,
            healthy: Object.values(allStatuses).filter(s => s.status === 'healthy').length,
            issues: issues.length,
          },
        },
        timestamp: new Date(),
      };

      await this.notificationService.sendAlert(alert);
    } catch (error) {
      console.error('Failed to send monitoring alert:', error);
    }
  }

  /**
   * Get current status of all networks
   */
  async getNetworkStatuses(): Promise<Record<string, ApiStatusReport>> {
    const statuses: Record<string, ApiStatusReport> = {};
    
    for (const [networkId, monitor] of this.monitors) {
      try {
        statuses[networkId] = await monitor.monitorApiStatus();
      } catch (error) {
        statuses[networkId] = {
          status: 'error',
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date(),
        };
      }
    }

    return statuses;
  }

  /**
   * Manually trigger issue resolution
   */
  async fixIssue(networkId: string, issueType: string, context: any): Promise<boolean> {
    const handler = this.errorHandlers.get(networkId);
    if (!handler) {
      console.error(`No error handler for network: ${networkId}`);
      return false;
    }

    try {
      const result = await handler.handleIssue(issueType, context);
      await this.logRepairAttempt(networkId, issueType, result);
      return result.success;
    } catch (error) {
      console.error(`Error fixing ${issueType} for ${networkId}:`, error);
      await this.logRepairAttempt(networkId, issueType, {
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
      return false;
    }
  }

  /**
   * Check if monitoring is active
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    activeNetworks: number;
    isMonitoring: boolean;
    lastCheck?: Date;
  } {
    return {
      activeNetworks: this.monitors.size,
      isMonitoring: this.isMonitoring,
    };
  }
}

/**
 * Simple notification service interface
 */
export interface NotificationService {
  sendAlert(alert: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    details: any;
    timestamp: Date;
  }): Promise<void>;
}

/**
 * Basic console notification service
 */
export class ConsoleNotificationService implements NotificationService {
  async sendAlert(alert: any): Promise<void> {
    const emoji = alert.severity === 'high' ? '🚨' : alert.severity === 'medium' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} ALERT: ${alert.message}`, alert.details);
  }
}

// Skeleton monitor and error handler for ClickBank
class ClickBankMonitor implements NetworkMonitor {
  async monitorApiStatus() {
    return {
      status: 'warning',
      responseTime: 0,
      lastChecked: new Date(),
      error: 'Not implemented',
    };
  }
  async checkLinkHealth() {
    return {
      validLinks: [],
      invalidLinks: [],
      suggestedFixes: {},
      timestamp: new Date(),
    };
  }
  async testConnection() { return false; }
}
class ClickBankErrorHandler implements ErrorHandler {
  async handleIssue(issueType: string, context: any) {
    return { success: false, details: 'Not implemented', timestamp: new Date() };
  }
}

// Skeletons for CJ, ShareASale, Rakuten, Awin
class CJMonitor extends ClickBankMonitor {}
class CJErrorHandler extends ClickBankErrorHandler {}
class ShareASaleMonitor extends ClickBankMonitor {}
class ShareASaleErrorHandler extends ClickBankErrorHandler {}
class RakutenMonitor extends ClickBankMonitor {}
class RakutenErrorHandler extends ClickBankErrorHandler {}
class AwinMonitor extends ClickBankMonitor {}
class AwinErrorHandler extends ClickBankErrorHandler {} 