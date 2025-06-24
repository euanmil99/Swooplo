import { db } from '../database/index.js';
import { affiliateNetworks, products } from '../../shared/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import crypto from 'crypto';

export interface MarketplaceCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  commissionRate: number;
  category: string;
  conversionRate?: number;
  imageUrl?: string;
  productUrl: string;
  gravity?: number; // ClickBank gravity score
  status: 'active' | 'inactive';
}

export interface MarketplaceConnection {
  id: string;
  network: string;
  networkId?: string;
  isActive: boolean;
  commissionRate: number;
  totalEarnings: number;
  lastSyncAt?: Date;
  metadata?: any;
}

export class MarketplaceService {
  private readonly encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

  // Connect user to a new marketplace
  async connectMarketplace(userId: string, network: string, credentials: MarketplaceCredentials) {
    try {
      // Validate API credentials with the marketplace
      const isValid = await this.validateCredentials(network, credentials);
      
      if (!isValid) {
        throw new Error('Invalid marketplace credentials');
      }
      
      // Encrypt sensitive credentials
      const encryptedCredentials = this.encryptCredentials(credentials);
      
      // Store connection in database
      const result = await db.insert(affiliateNetworks).values({
        userId,
        network,
        networkId: credentials.networkId,
        apiKey: encryptedCredentials.apiKey,
        apiSecret: encryptedCredentials.apiSecret,
        accessToken: encryptedCredentials.accessToken,
        refreshToken: encryptedCredentials.refreshToken,
        isActive: true,
        commissionRate: 0, // Will be updated after first sync
        totalEarnings: 0,
        metadata: credentials.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return result[0];
    } catch (error) {
      console.error('Error connecting marketplace:', error);
      throw new Error(`Failed to connect to ${network}: ${error.message}`);
    }
  }

  // Get all connected marketplaces for a user
  async getConnectedMarketplaces(userId: string): Promise<MarketplaceConnection[]> {
    try {
      const connections = await db.select({
        id: affiliateNetworks.id,
        network: affiliateNetworks.network,
        networkId: affiliateNetworks.networkId,
        isActive: affiliateNetworks.isActive,
        commissionRate: affiliateNetworks.commissionRate,
        totalEarnings: affiliateNetworks.totalEarnings,
        lastSyncAt: affiliateNetworks.lastSyncAt,
        metadata: affiliateNetworks.metadata
      })
      .from(affiliateNetworks)
      .where(eq(affiliateNetworks.userId, userId));

      return connections;
    } catch (error) {
      console.error('Error fetching connected marketplaces:', error);
      throw new Error('Failed to fetch connected marketplaces');
    }
  }

  // Sync products from all connected marketplaces
  async syncAllMarketplaces(userId: string) {
    try {
      const connections = await this.getConnectedMarketplaces(userId);
      const results = [];

      for (const connection of connections) {
        if (connection.isActive) {
          try {
            const result = await this.syncMarketplaceProducts(userId, connection.network);
            results.push({ network: connection.network, ...result });
          } catch (error) {
            results.push({ 
              network: connection.network, 
              error: error.message,
              productCount: 0 
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error syncing all marketplaces:', error);
      throw new Error('Failed to sync marketplaces');
    }
  }

  // Sync products from a specific marketplace
  async syncMarketplaceProducts(userId: string, network: string) {
    try {
      const connection = await db.select()
        .from(affiliateNetworks)
        .where(and(
          eq(affiliateNetworks.userId, userId),
          eq(affiliateNetworks.network, network)
        ))
        .first();

      if (!connection) {
        throw new Error('Marketplace not connected');
      }

      if (!connection.isActive) {
        throw new Error('Marketplace connection is inactive');
      }

      // Decrypt credentials
      const credentials = this.decryptCredentials({
        apiKey: connection.apiKey,
        apiSecret: connection.apiSecret,
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken
      });

      // Fetch products from the marketplace API
      const marketplaceProducts = await this.fetchProductsFromMarketplace(network, credentials);

      // Store products in database
      let syncedCount = 0;
      for (const product of marketplaceProducts) {
        try {
          await db.insert(products).values({
            networkId: connection.id,
            productId: product.id,
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            commission: (product.price * product.commissionRate) / 100,
            commissionRate: product.commissionRate,
            imageUrl: product.imageUrl,
            productUrl: product.productUrl,
            isActive: product.status === 'active',
            gravity: product.gravity || 0,
            conversionRate: product.conversionRate || 0,
            metadata: { source: network, syncedAt: new Date() },
            createdAt: new Date(),
            updatedAt: new Date()
          }).onConflictDoUpdate({
            target: [products.networkId, products.productId],
            set: {
              name: product.name,
              description: product.description,
              category: product.category,
              price: product.price,
              commission: (product.price * product.commissionRate) / 100,
              commissionRate: product.commissionRate,
              imageUrl: product.imageUrl,
              productUrl: product.productUrl,
              isActive: product.status === 'active',
              gravity: product.gravity || 0,
              conversionRate: product.conversionRate || 0,
              metadata: { source: network, syncedAt: new Date() },
              updatedAt: new Date()
            }
          });
          syncedCount++;
        } catch (error) {
          console.error(`Error syncing product ${product.id}:`, error);
        }
      }

      // Update last sync time
      await db.update(affiliateNetworks)
        .set({ 
          lastSyncAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(affiliateNetworks.id, connection.id));

      return { network, productCount: syncedCount };
    } catch (error) {
      console.error(`Error syncing marketplace ${network}:`, error);
      throw new Error(`Failed to sync ${network}: ${error.message}`);
    }
  }

  // Validate credentials with marketplace API
  private async validateCredentials(network: string, credentials: MarketplaceCredentials): Promise<boolean> {
    try {
      switch (network.toLowerCase()) {
        case 'clickbank':
          return await this.validateClickBankCredentials(credentials);
        case 'amazon':
          return await this.validateAmazonCredentials(credentials);
        case 'shareasale':
          return await this.validateShareASaleCredentials(credentials);
        case 'commissionjunction':
          return await this.validateCJCredentials(credentials);
        case 'rakuten':
          return await this.validateRakutenCredentials(credentials);
        case 'awin':
          return await this.validateAwinCredentials(credentials);
        default:
          // For unknown marketplaces, assume valid if basic fields are present
          return !!(credentials.apiKey || credentials.accessToken);
      }
    } catch (error) {
      console.error(`Error validating ${network} credentials:`, error);
      return false;
    }
  }

  // Fetch products from marketplace API
  private async fetchProductsFromMarketplace(network: string, credentials: MarketplaceCredentials): Promise<MarketplaceProduct[]> {
    try {
      switch (network.toLowerCase()) {
        case 'clickbank':
          return await this.fetchClickBankProducts(credentials);
        case 'amazon':
          return await this.fetchAmazonProducts(credentials);
        case 'shareasale':
          return await this.fetchShareASaleProducts(credentials);
        case 'commissionjunction':
          return await this.fetchCJProducts(credentials);
        case 'rakuten':
          return await this.fetchRakutenProducts(credentials);
        case 'awin':
          return await this.fetchAwinProducts(credentials);
        default:
          // Return mock data for unknown marketplaces
          return this.generateMockProducts(network);
      }
    } catch (error) {
      console.error(`Error fetching products from ${network}:`, error);
      throw new Error(`Failed to fetch products from ${network}`);
    }
  }

  // Platform-specific validation methods
  private async validateClickBankCredentials(credentials: MarketplaceCredentials): Promise<boolean> {
    // Implement ClickBank API validation
    return !!(credentials.apiKey && credentials.apiSecret);
  }

  private async validateAmazonCredentials(credentials: MarketplaceCredentials): Promise<boolean> {
    // Implement Amazon Associates API validation
    return !!(credentials.accessToken);
  }

  private async validateShareASaleCredentials(credentials: MarketplaceCredentials): Promise<boolean> {
    // Implement ShareASale API validation
    return !!(credentials.apiKey);
  }

  private async validateCJCredentials(credentials: MarketplaceCredentials): Promise<boolean> {
    // Implement Commission Junction API validation
    return !!(credentials.apiKey);
  }

  private async validateRakutenCredentials(credentials: MarketplaceCredentials): Promise<boolean> {
    // Implement Rakuten API validation
    return !!(credentials.apiKey);
  }

  private async validateAwinCredentials(credentials: MarketplaceCredentials): Promise<boolean> {
    // Implement Awin API validation
    return !!(credentials.apiKey);
  }

  // Platform-specific product fetching methods
  private async fetchClickBankProducts(credentials: MarketplaceCredentials): Promise<MarketplaceProduct[]> {
    // Implement ClickBank API product fetching
    // This would make actual API calls to ClickBank
    return this.generateMockProducts('clickbank');
  }

  private async fetchAmazonProducts(credentials: MarketplaceCredentials): Promise<MarketplaceProduct[]> {
    // Implement Amazon Associates API product fetching
    return this.generateMockProducts('amazon');
  }

  private async fetchShareASaleProducts(credentials: MarketplaceCredentials): Promise<MarketplaceProduct[]> {
    // Implement ShareASale API product fetching
    return this.generateMockProducts('shareasale');
  }

  private async fetchCJProducts(credentials: MarketplaceCredentials): Promise<MarketplaceProduct[]> {
    // Implement Commission Junction API product fetching
    return this.generateMockProducts('commissionjunction');
  }

  private async fetchRakutenProducts(credentials: MarketplaceCredentials): Promise<MarketplaceProduct[]> {
    // Implement Rakuten API product fetching
    return this.generateMockProducts('rakuten');
  }

  private async fetchAwinProducts(credentials: MarketplaceCredentials): Promise<MarketplaceProduct[]> {
    // Implement Awin API product fetching
    return this.generateMockProducts('awin');
  }

  // Generate mock products for testing
  private generateMockProducts(network: string): MarketplaceProduct[] {
    const categories = ['Technology', 'Health', 'Fitness', 'Education', 'Entertainment'];
    const products: MarketplaceProduct[] = [];

    for (let i = 1; i <= 20; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const price = Math.floor(Math.random() * 200) + 10;
      const commissionRate = Math.floor(Math.random() * 20) + 5;
      const conversionRate = Math.random() * 0.05; // 0-5%

      products.push({
        id: `${network}-product-${i}`,
        name: `${network.charAt(0).toUpperCase() + network.slice(1)} Product ${i}`,
        description: `High-quality ${category.toLowerCase()} product from ${network}`,
        price,
        commissionRate,
        category,
        conversionRate,
        imageUrl: `https://via.placeholder.com/300x200?text=${network}+${i}`,
        productUrl: `https://example.com/product/${i}`,
        gravity: Math.floor(Math.random() * 100),
        status: 'active'
      });
    }

    return products;
  }

  // Encrypt sensitive credentials
  private encryptCredentials(credentials: MarketplaceCredentials): MarketplaceCredentials {
    const encrypted: MarketplaceCredentials = {};
    
    for (const [key, value] of Object.entries(credentials)) {
      if (value && ['apiKey', 'apiSecret', 'accessToken', 'refreshToken', 'password'].includes(key)) {
        encrypted[key] = this.encrypt(value);
      } else {
        encrypted[key] = value;
      }
    }
    
    return encrypted;
  }

  // Decrypt sensitive credentials
  private decryptCredentials(credentials: MarketplaceCredentials): MarketplaceCredentials {
    const decrypted: MarketplaceCredentials = {};
    
    for (const [key, value] of Object.entries(credentials)) {
      if (value && ['apiKey', 'apiSecret', 'accessToken', 'refreshToken', 'password'].includes(key)) {
        decrypted[key] = this.decrypt(value);
      } else {
        decrypted[key] = value;
      }
    }
    
    return decrypted;
  }

  // Encryption helper methods
  private encrypt(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Disconnect marketplace
  async disconnectMarketplace(userId: string, network: string) {
    try {
      await db.update(affiliateNetworks)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(affiliateNetworks.userId, userId),
          eq(affiliateNetworks.network, network)
        ));

      return { success: true, message: `Disconnected from ${network}` };
    } catch (error) {
      console.error('Error disconnecting marketplace:', error);
      throw new Error(`Failed to disconnect from ${network}`);
    }
  }

  // Get marketplace statistics
  async getMarketplaceStats(userId: string) {
    try {
      const connections = await this.getConnectedMarketplaces(userId);
      
      const stats = {
        totalConnected: connections.length,
        activeConnections: connections.filter(c => c.isActive).length,
        totalEarnings: connections.reduce((sum, c) => sum + Number(c.totalEarnings), 0),
        averageCommissionRate: connections.length > 0 
          ? connections.reduce((sum, c) => sum + Number(c.commissionRate), 0) / connections.length 
          : 0,
        lastSync: connections
          .filter(c => c.lastSyncAt)
          .sort((a, b) => new Date(b.lastSyncAt!).getTime() - new Date(a.lastSyncAt!).getTime())[0]?.lastSyncAt
      };

      return stats;
    } catch (error) {
      console.error('Error getting marketplace stats:', error);
      throw new Error('Failed to get marketplace statistics');
    }
  }
} 