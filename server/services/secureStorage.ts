import crypto from 'crypto';
import { db } from '../database';
import { affiliateNetworks, socialAccounts } from '../../shared/schema';

/**
 * Secure Storage Service
 * Handles encryption/decryption of sensitive data like API keys and tokens
 */
export class SecureStorage {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  /**
   * Get encryption key from environment variable
   * Falls back to a default key for development (NOT for production)
   */
  private static getEncryptionKey(): Buffer {
    const envKey = process.env.ENCRYPTION_KEY;
    if (!envKey) {
      console.warn('⚠️  WARNING: ENCRYPTION_KEY not set. Using default key for development only.');
      // Default key for development - NEVER use in production
      return crypto.scryptSync('default-dev-key', 'salt', this.KEY_LENGTH);
    }
    return Buffer.from(envKey, 'hex');
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(text: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, key);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine IV, encrypted data, and auth tag
      return iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedText: string): string {
    try {
      const key = this.getEncryptionKey();
      const parts = encryptedText.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const tag = Buffer.from(parts[2], 'hex');
      
      const decipher = crypto.createDecipher(this.ALGORITHM, key);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Securely store affiliate network credentials
   */
  static async storeAffiliateCredentials(
    userId: string,
    network: string,
    credentials: {
      apiKey?: string;
      apiSecret?: string;
      accessToken?: string;
      refreshToken?: string;
    }
  ): Promise<void> {
    try {
      const encryptedCredentials = {
        apiKey: credentials.apiKey ? this.encrypt(credentials.apiKey) : null,
        apiSecret: credentials.apiSecret ? this.encrypt(credentials.apiSecret) : null,
        accessToken: credentials.accessToken ? this.encrypt(credentials.accessToken) : null,
        refreshToken: credentials.refreshToken ? this.encrypt(credentials.refreshToken) : null,
      };

      // Check if network already exists
      const existing = await db
        .select()
        .from(affiliateNetworks)
        .where(affiliateNetworks.userId.eq(userId))
        .where(affiliateNetworks.network.eq(network))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(affiliateNetworks)
          .set({
            ...encryptedCredentials,
            updatedAt: new Date(),
          })
          .where(affiliateNetworks.id.eq(existing[0].id));
      } else {
        // Create new
        await db.insert(affiliateNetworks).values({
          userId,
          network,
          ...encryptedCredentials,
        });
      }
    } catch (error) {
      console.error('Failed to store affiliate credentials:', error);
      throw new Error('Failed to store affiliate credentials securely');
    }
  }

  /**
   * Securely retrieve affiliate network credentials
   */
  static async getAffiliateCredentials(
    userId: string,
    network: string
  ): Promise<{
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    refreshToken?: string;
  } | null> {
    try {
      const result = await db
        .select()
        .from(affiliateNetworks)
        .where(affiliateNetworks.userId.eq(userId))
        .where(affiliateNetworks.network.eq(network))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const encrypted = result[0];
      return {
        apiKey: encrypted.apiKey ? this.decrypt(encrypted.apiKey) : undefined,
        apiSecret: encrypted.apiSecret ? this.decrypt(encrypted.apiSecret) : undefined,
        accessToken: encrypted.accessToken ? this.decrypt(encrypted.accessToken) : undefined,
        refreshToken: encrypted.refreshToken ? this.decrypt(encrypted.refreshToken) : undefined,
      };
    } catch (error) {
      console.error('Failed to retrieve affiliate credentials:', error);
      throw new Error('Failed to retrieve affiliate credentials');
    }
  }

  /**
   * Securely store social account credentials
   */
  static async storeSocialCredentials(
    userId: string,
    platform: string,
    credentials: {
      accessToken?: string;
      refreshToken?: string;
      accountId?: string;
    }
  ): Promise<void> {
    try {
      const encryptedCredentials = {
        accessToken: credentials.accessToken ? this.encrypt(credentials.accessToken) : null,
        refreshToken: credentials.refreshToken ? this.encrypt(credentials.refreshToken) : null,
        accountId: credentials.accountId || null,
      };

      // Check if platform already exists
      const existing = await db
        .select()
        .from(socialAccounts)
        .where(socialAccounts.userId.eq(userId))
        .where(socialAccounts.platform.eq(platform))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(socialAccounts)
          .set({
            ...encryptedCredentials,
            updatedAt: new Date(),
          })
          .where(socialAccounts.id.eq(existing[0].id));
      } else {
        // Create new
        await db.insert(socialAccounts).values({
          userId,
          platform,
          accountName: `${platform}_account`, // Default name
          ...encryptedCredentials,
        });
      }
    } catch (error) {
      console.error('Failed to store social credentials:', error);
      throw new Error('Failed to store social credentials securely');
    }
  }

  /**
   * Securely retrieve social account credentials
   */
  static async getSocialCredentials(
    userId: string,
    platform: string
  ): Promise<{
    accessToken?: string;
    refreshToken?: string;
    accountId?: string;
  } | null> {
    try {
      const result = await db
        .select()
        .from(socialAccounts)
        .where(socialAccounts.userId.eq(userId))
        .where(socialAccounts.platform.eq(platform))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const encrypted = result[0];
      return {
        accessToken: encrypted.accessToken ? this.decrypt(encrypted.accessToken) : undefined,
        refreshToken: encrypted.refreshToken ? this.decrypt(encrypted.refreshToken) : undefined,
        accountId: encrypted.accountId || undefined,
      };
    } catch (error) {
      console.error('Failed to retrieve social credentials:', error);
      throw new Error('Failed to retrieve social credentials');
    }
  }

  /**
   * Securely store any sensitive data
   */
  static async storeSecureData(
    key: string,
    data: any,
    userId?: string
  ): Promise<void> {
    try {
      const encryptedData = this.encrypt(JSON.stringify(data));
      
      // Store in a secure key-value store or database
      // For now, we'll use a simple in-memory store (NOT for production)
      if (!this.secureStore) {
        this.secureStore = new Map();
      }
      
      const storeKey = userId ? `${userId}:${key}` : key;
      this.secureStore.set(storeKey, encryptedData);
    } catch (error) {
      console.error('Failed to store secure data:', error);
      throw new Error('Failed to store data securely');
    }
  }

  /**
   * Securely retrieve any sensitive data
   */
  static async getSecureData(
    key: string,
    userId?: string
  ): Promise<any | null> {
    try {
      if (!this.secureStore) {
        return null;
      }
      
      const storeKey = userId ? `${userId}:${key}` : key;
      const encryptedData = this.secureStore.get(storeKey);
      
      if (!encryptedData) {
        return null;
      }
      
      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      throw new Error('Failed to retrieve data securely');
    }
  }

  /**
   * Rotate encryption keys (for security maintenance)
   */
  static async rotateKeys(): Promise<void> {
    try {
      // This is a complex operation that should be done carefully
      // In production, you'd want to:
      // 1. Generate new encryption key
      // 2. Re-encrypt all existing data
      // 3. Update environment variables
      // 4. Verify all data is accessible
      
      console.log('Key rotation initiated. This is a placeholder for production implementation.');
    } catch (error) {
      console.error('Key rotation failed:', error);
      throw new Error('Failed to rotate encryption keys');
    }
  }

  /**
   * Validate encryption setup
   */
  static validateSetup(): boolean {
    try {
      const testData = 'test-encryption';
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);
      
      if (decrypted !== testData) {
        console.error('Encryption validation failed');
        return false;
      }
      
      console.log('✅ Encryption setup validated successfully');
      return true;
    } catch (error) {
      console.error('❌ Encryption setup validation failed:', error);
      return false;
    }
  }

  // Private static store for development (NOT for production)
  private static secureStore: Map<string, string> | null = null;
}

// Validate setup on module load
if (process.env.NODE_ENV !== 'production') {
  SecureStorage.validateSetup();
} 