export interface SubscriptionTier {
  id: number;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  description: string;
  
  // Social Media Platform Limits
  maxSocialAccounts: number;
  maxPostsPerDay: number;
  maxScheduledPosts: number;
  
  // AI Content Generation Limits
  maxAIContentPerMonth: number;
  maxImageGenerationPerMonth: number;
  maxAudioTranscriptionPerMonth: number;
  
  // Platform-Specific Content Limits
  instagram: {
    storiesPerDay: number;
    postsPerDay: number;
    reelsPerDay: number;
    likesPerDay: number;
    commentsPerDay: number;
    followsPerDay: number;
    unfollowsPerDay: number;
  };
  
  twitter: {
    tweetsPerDay: number;
    threadsPerDay: number;
    likesPerDay: number;
    retweetsPerDay: number;
    repliesPerDay: number;
    followsPerDay: number;
    unfollowsPerDay: number;
  };
  
  linkedin: {
    postsPerDay: number;
    articlesPerMonth: number;
    likesPerDay: number;
    commentsPerDay: number;
    connectionsPerDay: number;
    messagesPerDay: number;
  };
  
  tiktok: {
    videosPerDay: number;
    livesPerMonth: number;
    likesPerDay: number;
    commentsPerDay: number;
    followsPerDay: number;
    sharesPerDay: number;
  };
  
  facebook: {
    postsPerDay: number;
    storiesPerDay: number;
    likesPerDay: number;
    commentsPerDay: number;
    sharesPerDay: number;
    followsPerDay: number;
  };
  
  youtube: {
    videosPerMonth: number;
    shortsPerMonth: number;
    livesPerMonth: number;
    likesPerDay: number;
    commentsPerDay: number;
    subscriptionsPerDay: number;
  };
  
  // Engagement and Analytics Limits
  maxLikesPerDay: number;
  maxCommentsPerDay: number;
  maxFollowsPerDay: number;
  maxUnfollowsPerDay: number;
  maxDMsPerDay: number;
  
  // Affiliate and Revenue Limits
  maxAffiliateLinks: number;
  maxCampaigns: number;
  maxAbtests: number;
  
  // Advanced Features
  hasAdvancedAnalytics: boolean;
  hasAIPoweredContent: boolean;
  hasImageGeneration: boolean;
  hasAudioProcessing: boolean;
  hasCampaignOptimization: boolean;
  hasFraudProtection: boolean;
  hasPrioritySupport: boolean;
  hasAPI: boolean;
  hasWhiteLabel: boolean;
}

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 1,
    name: 'Free',
    price: 0,
    billingCycle: 'monthly',
    description: 'Perfect for getting started with social media automation',
    
    // Social Media Platform Limits
    maxSocialAccounts: 3,
    maxPostsPerDay: 10,
    maxScheduledPosts: 50,
    
    // AI Content Generation Limits
    maxAIContentPerMonth: 10,
    maxImageGenerationPerMonth: 5,
    maxAudioTranscriptionPerMonth: 10,
    
    // Instagram Limits
    instagram: {
      storiesPerDay: 3,
      postsPerDay: 2,
      reelsPerDay: 1,
      likesPerDay: 50,
      commentsPerDay: 20,
      followsPerDay: 30,
      unfollowsPerDay: 30,
    },
    
    // Twitter Limits
    twitter: {
      tweetsPerDay: 5,
      threadsPerDay: 1,
      likesPerDay: 100,
      retweetsPerDay: 20,
      repliesPerDay: 30,
      followsPerDay: 50,
      unfollowsPerDay: 50,
    },
    
    // LinkedIn Limits
    linkedin: {
      postsPerDay: 2,
      articlesPerMonth: 2,
      likesPerDay: 50,
      commentsPerDay: 20,
      connectionsPerDay: 25,
      messagesPerDay: 10,
    },
    
    // TikTok Limits
    tiktok: {
      videosPerDay: 2,
      livesPerMonth: 2,
      likesPerDay: 100,
      commentsPerDay: 30,
      followsPerDay: 50,
      sharesPerDay: 20,
    },
    
    // Facebook Limits
    facebook: {
      postsPerDay: 3,
      storiesPerDay: 3,
      likesPerDay: 100,
      commentsPerDay: 30,
      sharesPerDay: 20,
      followsPerDay: 50,
    },
    
    // YouTube Limits
    youtube: {
      videosPerMonth: 5,
      shortsPerMonth: 10,
      livesPerMonth: 2,
      likesPerDay: 100,
      commentsPerDay: 30,
      subscriptionsPerDay: 20,
    },
    
    // Engagement and Analytics Limits
    maxLikesPerDay: 100,
    maxCommentsPerDay: 50,
    maxFollowsPerDay: 50,
    maxUnfollowsPerDay: 50,
    maxDMsPerDay: 20,
    
    // Affiliate and Revenue Limits
    maxAffiliateLinks: 50,
    maxCampaigns: 5,
    maxAbtests: 2,
    
    // Advanced Features
    hasAdvancedAnalytics: false,
    hasAIPoweredContent: true,
    hasImageGeneration: false,
    hasAudioProcessing: false,
    hasCampaignOptimization: false,
    hasFraudProtection: false,
    hasPrioritySupport: false,
    hasAPI: false,
    hasWhiteLabel: false,
  },
  
  {
    id: 2,
    name: 'Pro',
    price: 29,
    billingCycle: 'monthly',
    description: 'Advanced features for serious content creators and marketers',
    
    // Social Media Platform Limits
    maxSocialAccounts: 10,
    maxPostsPerDay: 25,
    maxScheduledPosts: 200,
    
    // AI Content Generation Limits
    maxAIContentPerMonth: 100,
    maxImageGenerationPerMonth: 50,
    maxAudioTranscriptionPerMonth: 100,
    
    // Instagram Limits
    instagram: {
      storiesPerDay: 8,
      postsPerDay: 5,
      reelsPerDay: 3,
      likesPerDay: 200,
      commentsPerDay: 100,
      followsPerDay: 100,
      unfollowsPerDay: 100,
    },
    
    // Twitter Limits
    twitter: {
      tweetsPerDay: 15,
      threadsPerDay: 3,
      likesPerDay: 300,
      retweetsPerDay: 50,
      repliesPerDay: 100,
      followsPerDay: 150,
      unfollowsPerDay: 150,
    },
    
    // LinkedIn Limits
    linkedin: {
      postsPerDay: 5,
      articlesPerMonth: 10,
      likesPerDay: 150,
      commentsPerDay: 80,
      connectionsPerDay: 75,
      messagesPerDay: 50,
    },
    
    // TikTok Limits
    tiktok: {
      videosPerDay: 5,
      livesPerMonth: 10,
      likesPerDay: 300,
      commentsPerDay: 100,
      followsPerDay: 150,
      sharesPerDay: 50,
    },
    
    // Facebook Limits
    facebook: {
      postsPerDay: 8,
      storiesPerDay: 8,
      likesPerDay: 300,
      commentsPerDay: 100,
      sharesPerDay: 50,
      followsPerDay: 150,
    },
    
    // YouTube Limits
    youtube: {
      videosPerMonth: 20,
      shortsPerMonth: 50,
      livesPerMonth: 10,
      likesPerDay: 300,
      commentsPerDay: 100,
      subscriptionsPerDay: 50,
    },
    
    // Engagement and Analytics Limits
    maxLikesPerDay: 300,
    maxCommentsPerDay: 150,
    maxFollowsPerDay: 150,
    maxUnfollowsPerDay: 150,
    maxDMsPerDay: 100,
    
    // Affiliate and Revenue Limits
    maxAffiliateLinks: 200,
    maxCampaigns: 20,
    maxAbtests: 10,
    
    // Advanced Features
    hasAdvancedAnalytics: true,
    hasAIPoweredContent: true,
    hasImageGeneration: true,
    hasAudioProcessing: true,
    hasCampaignOptimization: true,
    hasFraudProtection: true,
    hasPrioritySupport: false,
    hasAPI: true,
    hasWhiteLabel: false,
  },
  
  {
    id: 3,
    name: 'Enterprise',
    price: 99,
    billingCycle: 'monthly',
    description: 'Complete solution for agencies and large-scale operations',
    
    // Social Media Platform Limits
    maxSocialAccounts: 50,
    maxPostsPerDay: 100,
    maxScheduledPosts: 1000,
    
    // AI Content Generation Limits
    maxAIContentPerMonth: 500,
    maxImageGenerationPerMonth: 200,
    maxAudioTranscriptionPerMonth: 300,
    
    // Instagram Limits
    instagram: {
      storiesPerDay: 20,
      postsPerDay: 15,
      reelsPerDay: 10,
      likesPerDay: 500,
      commentsPerDay: 300,
      followsPerDay: 300,
      unfollowsPerDay: 300,
    },
    
    // Twitter Limits
    twitter: {
      tweetsPerDay: 50,
      threadsPerDay: 10,
      likesPerDay: 800,
      retweetsPerDay: 150,
      repliesPerDay: 300,
      followsPerDay: 500,
      unfollowsPerDay: 500,
    },
    
    // LinkedIn Limits
    linkedin: {
      postsPerDay: 15,
      articlesPerMonth: 30,
      likesPerDay: 400,
      commentsPerDay: 200,
      connectionsPerDay: 200,
      messagesPerDay: 200,
    },
    
    // TikTok Limits
    tiktok: {
      videosPerDay: 15,
      livesPerMonth: 30,
      likesPerDay: 800,
      commentsPerDay: 300,
      followsPerDay: 500,
      sharesPerDay: 150,
    },
    
    // Facebook Limits
    facebook: {
      postsPerDay: 20,
      storiesPerDay: 20,
      likesPerDay: 800,
      commentsPerDay: 300,
      sharesPerDay: 150,
      followsPerDay: 500,
    },
    
    // YouTube Limits
    youtube: {
      videosPerMonth: 50,
      shortsPerMonth: 150,
      livesPerMonth: 30,
      likesPerDay: 800,
      commentsPerDay: 300,
      subscriptionsPerDay: 150,
    },
    
    // Engagement and Analytics Limits
    maxLikesPerDay: 800,
    maxCommentsPerDay: 400,
    maxFollowsPerDay: 500,
    maxUnfollowsPerDay: 500,
    maxDMsPerDay: 300,
    
    // Affiliate and Revenue Limits
    maxAffiliateLinks: 1000,
    maxCampaigns: 100,
    maxAbtests: 50,
    
    // Advanced Features
    hasAdvancedAnalytics: true,
    hasAIPoweredContent: true,
    hasImageGeneration: true,
    hasAudioProcessing: true,
    hasCampaignOptimization: true,
    hasFraudProtection: true,
    hasPrioritySupport: true,
    hasAPI: true,
    hasWhiteLabel: true,
  },
];

// Platform-specific rate limits and best practices
export const platformLimits = {
  instagram: {
    maxPostsPerDay: 25,
    maxStoriesPerDay: 25,
    maxLikesPerDay: 1000,
    maxCommentsPerDay: 500,
    maxFollowsPerDay: 200,
    maxUnfollowsPerDay: 200,
    maxDMsPerDay: 100,
    maxPostsPerHour: 3,
    maxLikesPerHour: 100,
    maxCommentsPerHour: 50,
    maxFollowsPerHour: 20,
    maxCharactersPerPost: 2200,
    maxHashtagsPerPost: 30,
    maxImagesPerPost: 10,
    maxVideosPerPost: 1,
    cooldownBetweenActions: 30,
    maxActionsPerWindow: 100,
    actionWindowMinutes: 60,
    optimalPostingTimes: [9, 12, 15, 18, 21],
    optimalPostingDays: [1, 2, 3, 4, 5, 6, 7],
  },
  
  twitter: {
    maxPostsPerDay: 300,
    maxStoriesPerDay: 0,
    maxLikesPerDay: 1000,
    maxCommentsPerDay: 500,
    maxFollowsPerDay: 400,
    maxUnfollowsPerDay: 400,
    maxDMsPerDay: 1000,
    maxPostsPerHour: 25,
    maxLikesPerHour: 100,
    maxCommentsPerHour: 50,
    maxFollowsPerHour: 50,
    maxCharactersPerPost: 280,
    maxHashtagsPerPost: 10,
    maxImagesPerPost: 4,
    maxVideosPerPost: 1,
    cooldownBetweenActions: 15,
    maxActionsPerWindow: 200,
    actionWindowMinutes: 60,
    optimalPostingTimes: [8, 12, 16, 20],
    optimalPostingDays: [1, 2, 3, 4, 5, 6, 7],
  },
  
  linkedin: {
    maxPostsPerDay: 25,
    maxStoriesPerDay: 0,
    maxLikesPerDay: 500,
    maxCommentsPerDay: 200,
    maxFollowsPerDay: 100,
    maxUnfollowsPerDay: 100,
    maxDMsPerDay: 100,
    maxPostsPerHour: 2,
    maxLikesPerHour: 50,
    maxCommentsPerHour: 20,
    maxFollowsPerHour: 10,
    maxCharactersPerPost: 3000,
    maxHashtagsPerPost: 5,
    maxImagesPerPost: 9,
    maxVideosPerPost: 1,
    cooldownBetweenActions: 60,
    maxActionsPerWindow: 50,
    actionWindowMinutes: 60,
    optimalPostingTimes: [8, 12, 17],
    optimalPostingDays: [1, 2, 3, 4, 5],
  },
  
  tiktok: {
    maxPostsPerDay: 50,
    maxStoriesPerDay: 0,
    maxLikesPerDay: 1000,
    maxCommentsPerDay: 500,
    maxFollowsPerDay: 200,
    maxUnfollowsPerDay: 200,
    maxDMsPerDay: 100,
    maxPostsPerHour: 5,
    maxLikesPerHour: 100,
    maxCommentsPerHour: 50,
    maxFollowsPerHour: 20,
    maxCharactersPerPost: 150,
    maxHashtagsPerPost: 20,
    maxImagesPerPost: 0,
    maxVideosPerPost: 1,
    cooldownBetweenActions: 30,
    maxActionsPerWindow: 100,
    actionWindowMinutes: 60,
    optimalPostingTimes: [9, 12, 15, 18, 21],
    optimalPostingDays: [1, 2, 3, 4, 5, 6, 7],
  },
  
  facebook: {
    maxPostsPerDay: 50,
    maxStoriesPerDay: 25,
    maxLikesPerDay: 1000,
    maxCommentsPerDay: 500,
    maxFollowsPerDay: 200,
    maxUnfollowsPerDay: 200,
    maxDMsPerDay: 100,
    maxPostsPerHour: 5,
    maxLikesPerHour: 100,
    maxCommentsPerHour: 50,
    maxFollowsPerHour: 20,
    maxCharactersPerPost: 63206,
    maxHashtagsPerPost: 30,
    maxImagesPerPost: 10,
    maxVideosPerPost: 1,
    cooldownBetweenActions: 30,
    maxActionsPerWindow: 100,
    actionWindowMinutes: 60,
    optimalPostingTimes: [9, 13, 15, 19],
    optimalPostingDays: [1, 2, 3, 4, 5, 6, 7],
  },
  
  youtube: {
    maxPostsPerDay: 10,
    maxStoriesPerDay: 0,
    maxLikesPerDay: 1000,
    maxCommentsPerDay: 500,
    maxFollowsPerDay: 100,
    maxUnfollowsPerDay: 100,
    maxDMsPerDay: 50,
    maxPostsPerHour: 1,
    maxLikesPerHour: 100,
    maxCommentsPerHour: 50,
    maxFollowsPerHour: 10,
    maxCharactersPerPost: 5000,
    maxHashtagsPerPost: 15,
    maxImagesPerPost: 0,
    maxVideosPerPost: 1,
    cooldownBetweenActions: 60,
    maxActionsPerWindow: 50,
    actionWindowMinutes: 60,
    optimalPostingTimes: [12, 15, 18, 21],
    optimalPostingDays: [1, 2, 3, 4, 5, 6, 7],
  },
};

// Helper functions
export const getTierByName = (name: string): SubscriptionTier | undefined => {
  return subscriptionTiers.find(tier => tier.name.toLowerCase() === name.toLowerCase());
};

export const getTierById = (id: number): SubscriptionTier | undefined => {
  return subscriptionTiers.find(tier => tier.id === id);
};

export const getPlatformLimits = (platform: string) => {
  return platformLimits[platform as keyof typeof platformLimits];
};

export const checkTierLimit = (
  tier: SubscriptionTier,
  platform: string,
  action: string,
  currentUsage: number
): { allowed: boolean; remaining: number; limit: number } => {
  const platformData = tier[platform as keyof SubscriptionTier] as any;
  const limit = platformData?.[action] || 0;
  const remaining = Math.max(0, limit - currentUsage);
  
  return {
    allowed: currentUsage < limit,
    remaining,
    limit
  };
}; 