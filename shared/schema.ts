import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, decimal, varchar, index, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  company: varchar('company', { length: 200 }),
  phone: varchar('phone', { length: 20 }),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  subscriptionTier: varchar('subscription_tier', { length: 20 }).default('basic'),
  subscriptionStatus: varchar('subscription_status', { length: 20 }).default('active'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  subscriptionIdx: index('subscription_idx').on(table.subscriptionTier, table.subscriptionStatus),
}));

// Social accounts table
export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 50 }).notNull(), // twitter, instagram, snapchat, tiktok, linkedin
  accountName: varchar('account_name', { length: 100 }).notNull(),
  accountId: varchar('account_id', { length: 100 }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  isActive: boolean('is_active').default(true),
  followerCount: integer('follower_count').default(0),
  engagementRate: decimal('engagement_rate', { precision: 5, scale: 4 }).default('0'),
  lastSyncAt: timestamp('last_sync_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('social_user_id_idx').on(table.userId),
  platformIdx: index('social_platform_idx').on(table.platform),
  activeIdx: index('social_active_idx').on(table.isActive),
}));

// Affiliate networks table
export const affiliateNetworks = pgTable('affiliate_networks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  network: varchar('network', { length: 50 }).notNull(), // clickbank, amazon, shareasale, commissionjunction
  networkId: varchar('network_id', { length: 100 }),
  apiKey: text('api_key'),
  apiSecret: text('api_secret'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  isActive: boolean('is_active').default(true),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 4 }).default('0'),
  totalEarnings: decimal('total_earnings', { precision: 10, scale: 2 }).default('0'),
  lastSyncAt: timestamp('last_sync_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('affiliate_user_id_idx').on(table.userId),
  networkIdx: index('affiliate_network_idx').on(table.network),
  activeIdx: index('affiliate_active_idx').on(table.isActive),
}));

// Products table
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  networkId: uuid('network_id').notNull().references(() => affiliateNetworks.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  price: decimal('price', { precision: 10, scale: 2 }),
  commission: decimal('commission', { precision: 10, scale: 2 }),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 4 }),
  imageUrl: text('image_url'),
  productUrl: text('product_url'),
  isActive: boolean('is_active').default(true),
  gravity: integer('gravity').default(0), // ClickBank gravity score
  conversionRate: decimal('conversion_rate', { precision: 5, scale: 4 }).default('0'),
  lastSyncAt: timestamp('last_sync_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  networkIdIdx: index('product_network_id_idx').on(table.networkId),
  productIdIdx: index('product_id_idx').on(table.productId),
  activeIdx: index('product_active_idx').on(table.isActive),
  categoryIdx: index('product_category_idx').on(table.category),
}));

// Campaigns table
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  productId: uuid('product_id').references(() => products.id),
  status: varchar('status', { length: 20 }).default('draft'), // draft, active, paused, completed
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  targetPlatforms: jsonb('target_platforms'), // Array of platform names
  targetAudience: jsonb('target_audience'), // Demographics, interests, etc.
  contentStrategy: jsonb('content_strategy'), // Content guidelines, tone, hashtags
  isAbtesting: boolean('is_abtesting').default(false),
  abTestVariants: jsonb('ab_test_variants'), // A/B test configurations
  performanceMetrics: jsonb('performance_metrics'), // Clicks, conversions, CTR, etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('campaign_user_id_idx').on(table.userId),
  statusIdx: index('campaign_status_idx').on(table.status),
  productIdIdx: index('campaign_product_id_idx').on(table.productId),
}));

// Affiliate links table
export const affiliateLinks = pgTable('affiliate_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  originalUrl: text('original_url').notNull(),
  shortCode: varchar('short_code', { length: 20 }).unique(),
  shortUrl: text('short_url'),
  cloakedUrl: text('cloaked_url'),
  qrCodeUrl: text('qr_code_url'),
  isActive: boolean('is_active').default(true),
  isExpired: boolean('is_expired').default(false),
  expiresAt: timestamp('expires_at'),
  clickCount: integer('click_count').default(0),
  conversionCount: integer('conversion_count').default(0),
  revenue: decimal('revenue', { precision: 10, scale: 2 }).default('0'),
  conversionRate: decimal('conversion_rate', { precision: 5, scale: 4 }).default('0'),
  geographicData: jsonb('geographic_data'), // Click locations
  deviceData: jsonb('device_data'), // Device types, browsers
  fraudScore: decimal('fraud_score', { precision: 3, scale: 2 }).default('0'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  campaignIdIdx: index('link_campaign_id_idx').on(table.campaignId),
  shortCodeIdx: index('link_short_code_idx').on(table.shortCode),
  activeIdx: index('link_active_idx').on(table.isActive),
  productIdIdx: index('link_product_id_idx').on(table.productId),
}));

// Social posts table
export const socialPosts = pgTable('social_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  socialAccountId: uuid('social_account_id').notNull().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  affiliateLinkId: uuid('affiliate_link_id').references(() => affiliateLinks.id),
  content: text('content').notNull(),
  contentType: varchar('content_type', { length: 20 }).default('text'), // text, image, video, carousel
  mediaUrls: jsonb('media_urls'), // Array of media URLs
  hashtags: jsonb('hashtags'), // Array of hashtags
  mentions: jsonb('mentions'), // Array of mentions
  platformPostId: varchar('platform_post_id', { length: 100 }),
  status: varchar('status', { length: 20 }).default('draft'), // draft, scheduled, published, failed
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  engagementMetrics: jsonb('engagement_metrics'), // Likes, comments, shares, clicks
  aiGenerated: boolean('ai_generated').default(false),
  aiPrompt: text('ai_prompt'),
  variantId: varchar('variant_id', { length: 50 }), // For A/B testing
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  campaignIdIdx: index('post_campaign_id_idx').on(table.campaignId),
  socialAccountIdIdx: index('post_social_account_id_idx').on(table.socialAccountId),
  statusIdx: index('post_status_idx').on(table.status),
  scheduledIdx: index('post_scheduled_idx').on(table.scheduledAt),
}));

// Click tracking table
export const clicks = pgTable('clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  affiliateLinkId: uuid('affiliate_link_id').notNull().references(() => affiliateLinks.id, { onDelete: 'cascade' }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  country: varchar('country', { length: 2 }),
  city: varchar('city', { length: 100 }),
  deviceType: varchar('device_type', { length: 20 }), // mobile, desktop, tablet
  browser: varchar('browser', { length: 50 }),
  os: varchar('os', { length: 50 }),
  isBot: boolean('is_bot').default(false),
  fraudScore: decimal('fraud_score', { precision: 3, scale: 2 }).default('0'),
  sessionId: varchar('session_id', { length: 100 }),
  clickedAt: timestamp('clicked_at').defaultNow(),
}, (table) => ({
  linkIdIdx: index('click_link_id_idx').on(table.affiliateLinkId),
  clickedAtIdx: index('click_clicked_at_idx').on(table.clickedAt),
  ipIdx: index('click_ip_idx').on(table.ipAddress),
  sessionIdx: index('click_session_idx').on(table.sessionId),
}));

// Conversions table
export const conversions = pgTable('conversions', {
  id: uuid('id').primaryKey().defaultRandom(),
  affiliateLinkId: uuid('affiliate_link_id').notNull().references(() => affiliateLinks.id, { onDelete: 'cascade' }),
  clickId: uuid('click_id').references(() => clicks.id),
  orderId: varchar('order_id', { length: 100 }),
  transactionId: varchar('transaction_id', { length: 100 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  commission: decimal('commission', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected, paid
  networkData: jsonb('network_data'), // Raw data from affiliate network
  convertedAt: timestamp('converted_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
  paidAt: timestamp('paid_at'),
}, (table) => ({
  linkIdIdx: index('conversion_link_id_idx').on(table.affiliateLinkId),
  clickIdIdx: index('conversion_click_id_idx').on(table.clickId),
  statusIdx: index('conversion_status_idx').on(table.status),
  convertedAtIdx: index('conversion_converted_at_idx').on(table.convertedAt),
}));

// Earnings table
export const earnings = pgTable('earnings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  networkId: uuid('network_id').references(() => affiliateNetworks.id),
  period: varchar('period', { length: 20 }).notNull(), // daily, weekly, monthly
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  grossEarnings: decimal('gross_earnings', { precision: 10, scale: 2 }).default('0'),
  netEarnings: decimal('net_earnings', { precision: 10, scale: 2 }).default('0'),
  pendingEarnings: decimal('pending_earnings', { precision: 10, scale: 2 }).default('0'),
  conversionCount: integer('conversion_count').default(0),
  clickCount: integer('click_count').default(0),
  conversionRate: decimal('conversion_rate', { precision: 5, scale: 4 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('earnings_user_id_idx').on(table.userId),
  periodIdx: index('earnings_period_idx').on(table.period),
  dateIdx: index('earnings_date_idx').on(table.startDate, table.endDate),
}));

// A/B test results table
export const abTestResults = pgTable('ab_test_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  variantId: varchar('variant_id', { length: 50 }).notNull(),
  variantName: varchar('variant_name', { length: 100 }).notNull(),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  conversions: integer('conversions').default(0),
  revenue: decimal('revenue', { precision: 10, scale: 2 }).default('0'),
  ctr: decimal('ctr', { precision: 5, scale: 4 }).default('0'),
  conversionRate: decimal('conversion_rate', { precision: 5, scale: 4 }).default('0'),
  isWinner: boolean('is_winner').default(false),
  confidenceLevel: decimal('confidence_level', { precision: 3, scale: 2 }).default('0'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  campaignIdIdx: index('abtest_campaign_id_idx').on(table.campaignId),
  variantIdx: index('abtest_variant_idx').on(table.variantId),
  winnerIdx: index('abtest_winner_idx').on(table.isWinner),
}));

// Fraud detection logs table
export const fraudLogs = pgTable('fraud_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  affiliateLinkId: uuid('affiliate_link_id').references(() => affiliateLinks.id),
  clickId: uuid('click_id').references(() => clicks.id),
  fraudType: varchar('fraud_type', { length: 50 }).notNull(), // bot, suspicious_ip, velocity, geographic
  severity: varchar('severity', { length: 20 }).default('medium'), // low, medium, high, critical
  description: text('description'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  geographicData: jsonb('geographic_data'),
  actionTaken: varchar('action_taken', { length: 50 }).default('logged'), // logged, blocked, flagged
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('fraud_user_id_idx').on(table.userId),
  fraudTypeIdx: index('fraud_type_idx').on(table.fraudType),
  severityIdx: index('fraud_severity_idx').on(table.severity),
  createdAtIdx: index('fraud_created_at_idx').on(table.createdAt),
}));

// Subscription tiers with detailed limits
export const subscriptionTiers = pgTable('subscription_tiers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // free, pro, enterprise
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  billingCycle: varchar('billing_cycle', { length: 20 }).notNull(), // monthly, yearly
  description: text('description'),
  
  // Social Media Platform Limits
  maxSocialAccounts: integer('max_social_accounts').notNull().default(3),
  maxPostsPerDay: integer('max_posts_per_day').notNull().default(10),
  maxScheduledPosts: integer('max_scheduled_posts').notNull().default(50),
  
  // AI Content Generation Limits
  maxAIContentPerMonth: integer('max_ai_content_per_month').notNull().default(50),
  maxImageGenerationPerMonth: integer('max_image_generation_per_month').notNull().default(20),
  maxAudioTranscriptionPerMonth: integer('max_audio_transcription_per_month').notNull().default(30),
  
  // Platform-Specific Limits
  maxInstagramStoriesPerDay: integer('max_instagram_stories_per_day').notNull().default(5),
  maxInstagramPostsPerDay: integer('max_instagram_posts_per_day').notNull().default(3),
  maxInstagramReelsPerDay: integer('max_instagram_reels_per_day').notNull().default(2),
  
  maxTwitterTweetsPerDay: integer('max_twitter_tweets_per_day').notNull().default(10),
  maxTwitterThreadsPerDay: integer('max_twitter_threads_per_day').notNull().default(2),
  
  maxLinkedInPostsPerDay: integer('max_linkedin_posts_per_day').notNull().default(3),
  maxLinkedInArticlesPerMonth: integer('max_linkedin_articles_per_month').notNull().default(5),
  
  maxTikTokVideosPerDay: integer('max_tiktok_videos_per_day').notNull().default(3),
  maxTikTokLivesPerMonth: integer('max_tiktok_lives_per_month').notNull().default(5),
  
  maxFacebookPostsPerDay: integer('max_facebook_posts_per_day').notNull().default(5),
  maxFacebookStoriesPerDay: integer('max_facebook_stories_per_day').notNull().default(5),
  
  maxYouTubeVideosPerMonth: integer('max_youtube_videos_per_month').notNull().default(10),
  maxYouTubeShortsPerMonth: integer('max_youtube_shorts_per_month').notNull().default(20),
  
  // Engagement and Analytics Limits
  maxLikesPerDay: integer('max_likes_per_day').notNull().default(100),
  maxCommentsPerDay: integer('max_comments_per_day').notNull().default(50),
  maxFollowsPerDay: integer('max_follows_per_day').notNull().default(50),
  maxUnfollowsPerDay: integer('max_unfollows_per_day').notNull().default(50),
  
  // Affiliate and Revenue Limits
  maxAffiliateLinks: integer('max_affiliate_links').notNull().default(100),
  maxCampaigns: integer('max_campaigns').notNull().default(10),
  maxAbtests: integer('max_ab_tests').notNull().default(5),
  
  // Advanced Features
  hasAdvancedAnalytics: boolean('has_advanced_analytics').notNull().default(false),
  hasAIPoweredContent: boolean('has_ai_powered_content').notNull().default(false),
  hasImageGeneration: boolean('has_image_generation').notNull().default(false),
  hasAudioProcessing: boolean('has_audio_processing').notNull().default(false),
  hasCampaignOptimization: boolean('has_campaign_optimization').notNull().default(false),
  hasFraudProtection: boolean('has_fraud_protection').notNull().default(false),
  hasPrioritySupport: boolean('has_priority_support').notNull().default(false),
  hasAPI: boolean('has_api_access').notNull().default(false),
  hasWhiteLabel: boolean('has_white_label').notNull().default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Platform-specific rate limits and best practices
export const platformLimits = pgTable('platform_limits', {
  id: serial('id').primaryKey(),
  platform: varchar('platform', { length: 50 }).notNull(), // instagram, twitter, linkedin, etc.
  
  // Daily Limits
  maxPostsPerDay: integer('max_posts_per_day').notNull(),
  maxStoriesPerDay: integer('max_stories_per_day').notNull(),
  maxLikesPerDay: integer('max_likes_per_day').notNull(),
  maxCommentsPerDay: integer('max_comments_per_day').notNull(),
  maxFollowsPerDay: integer('max_follows_per_day').notNull(),
  maxUnfollowsPerDay: integer('max_unfollows_per_day').notNull(),
  maxDMsPerDay: integer('max_dms_per_day').notNull(),
  
  // Hourly Limits
  maxPostsPerHour: integer('max_posts_per_hour').notNull(),
  maxLikesPerHour: integer('max_likes_per_hour').notNull(),
  maxCommentsPerHour: integer('max_comments_per_hour').notNull(),
  maxFollowsPerHour: integer('max_follows_per_hour').notNull(),
  
  // Content Limits
  maxCharactersPerPost: integer('max_characters_per_post').notNull(),
  maxHashtagsPerPost: integer('max_hashtags_per_post').notNull(),
  maxImagesPerPost: integer('max_images_per_post').notNull(),
  maxVideosPerPost: integer('max_videos_per_post').notNull(),
  
  // Best Practices
  optimalPostingTimes: jsonb('optimal_posting_times'), // Array of optimal hours
  optimalPostingDays: jsonb('optimal_posting_days'), // Array of optimal days
  recommendedHashtags: jsonb('recommended_hashtags'), // Array of recommended hashtags
  contentGuidelines: text('content_guidelines'),
  
  // Rate Limiting
  cooldownBetweenActions: integer('cooldown_between_actions').notNull(), // seconds
  maxActionsPerWindow: integer('max_actions_per_window').notNull(),
  actionWindowMinutes: integer('action_window_minutes').notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User subscription with usage tracking
export const userSubscriptions = pgTable('user_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tierId: integer('tier_id').notNull().references(() => subscriptionTiers.id),
  
  // Subscription Details
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, cancelled, expired
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  autoRenew: boolean('auto_renew').notNull().default(true),
  
  // Usage Tracking (Monthly)
  aiContentUsed: integer('ai_content_used').notNull().default(0),
  imageGenerationUsed: integer('image_generation_used').notNull().default(0),
  audioTranscriptionUsed: integer('audio_transcription_used').notNull().default(0),
  
  // Platform Usage Tracking
  instagramPostsUsed: integer('instagram_posts_used').notNull().default(0),
  twitterTweetsUsed: integer('twitter_tweets_used').notNull().default(0),
  linkedinPostsUsed: integer('linkedin_posts_used').notNull().default(0),
  tiktokVideosUsed: integer('tiktok_videos_used').notNull().default(0),
  facebookPostsUsed: integer('facebook_posts_used').notNull().default(0),
  youtubeVideosUsed: integer('youtube_videos_used').notNull().default(0),
  
  // Engagement Usage
  likesUsed: integer('likes_used').notNull().default(0),
  commentsUsed: integer('comments_used').notNull().default(0),
  followsUsed: integer('follows_used').notNull().default(0),
  
  // Reset counters monthly
  lastResetDate: timestamp('last_reset_date').notNull().defaultNow(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  socialAccounts: many(socialAccounts),
  affiliateNetworks: many(affiliateNetworks),
  campaigns: many(campaigns),
  earnings: many(earnings),
  fraudLogs: many(fraudLogs),
}));

export const socialAccountsRelations = relations(socialAccounts, ({ one, many }) => ({
  user: one(users, { fields: [socialAccounts.userId], references: [users.id] }),
  posts: many(socialPosts),
}));

export const affiliateNetworksRelations = relations(affiliateNetworks, ({ one, many }) => ({
  user: one(users, { fields: [affiliateNetworks.userId], references: [users.id] }),
  products: many(products),
  earnings: many(earnings),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  network: one(affiliateNetworks, { fields: [products.networkId], references: [affiliateNetworks.id] }),
  campaigns: many(campaigns),
  affiliateLinks: many(affiliateLinks),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, { fields: [campaigns.userId], references: [users.id] }),
  product: one(products, { fields: [campaigns.productId], references: [products.id] }),
  affiliateLinks: many(affiliateLinks),
  socialPosts: many(socialPosts),
  abTestResults: many(abTestResults),
}));

export const affiliateLinksRelations = relations(affiliateLinks, ({ one, many }) => ({
  campaign: one(campaigns, { fields: [affiliateLinks.campaignId], references: [campaigns.id] }),
  product: one(products, { fields: [affiliateLinks.productId], references: [products.id] }),
  clicks: many(clicks),
  conversions: many(conversions),
  socialPosts: many(socialPosts),
  fraudLogs: many(fraudLogs),
}));

export const socialPostsRelations = relations(socialPosts, ({ one }) => ({
  campaign: one(campaigns, { fields: [socialPosts.campaignId], references: [campaigns.id] }),
  socialAccount: one(socialAccounts, { fields: [socialPosts.socialAccountId], references: [socialAccounts.id] }),
  affiliateLink: one(affiliateLinks, { fields: [socialPosts.affiliateLinkId], references: [affiliateLinks.id] }),
}));

export const clicksRelations = relations(clicks, ({ one, many }) => ({
  affiliateLink: one(affiliateLinks, { fields: [clicks.affiliateLinkId], references: [affiliateLinks.id] }),
  conversions: many(conversions),
  fraudLogs: many(fraudLogs),
}));

export const conversionsRelations = relations(conversions, ({ one }) => ({
  affiliateLink: one(affiliateLinks, { fields: [conversions.affiliateLinkId], references: [affiliateLinks.id] }),
  click: one(clicks, { fields: [conversions.clickId], references: [clicks.id] }),
}));

export const earningsRelations = relations(earnings, ({ one }) => ({
  user: one(users, { fields: [earnings.userId], references: [users.id] }),
  network: one(affiliateNetworks, { fields: [earnings.networkId], references: [affiliateNetworks.id] }),
}));

export const abTestResultsRelations = relations(abTestResults, ({ one }) => ({
  campaign: one(campaigns, { fields: [abTestResults.campaignId], references: [campaigns.id] }),
}));

export const fraudLogsRelations = relations(fraudLogs, ({ one }) => ({
  user: one(users, { fields: [fraudLogs.userId], references: [users.id] }),
  affiliateLink: one(affiliateLinks, { fields: [fraudLogs.affiliateLinkId], references: [affiliateLinks.id] }),
  click: one(clicks, { fields: [fraudLogs.clickId], references: [clicks.id] }),
})); 