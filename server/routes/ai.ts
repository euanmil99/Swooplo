import { Router } from 'express';
import { localAI } from '../services/localai.js';
import { authenticateUser, requireSubscriptionTier } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const generateContentSchema = z.object({
  prompt: z.string().min(1).max(1000),
  platform: z.enum(['twitter', 'instagram', 'linkedin', 'tiktok', 'snapchat', 'facebook']),
  tone: z.enum(['casual', 'professional', 'excited', 'friendly', 'authoritative']).optional(),
  includeHashtags: z.boolean().optional(),
  characterLimit: z.number().optional()
});

const generateVariationsSchema = z.object({
  prompt: z.string().min(1).max(1000),
  platform: z.enum(['twitter', 'instagram', 'linkedin', 'tiktok', 'snapchat', 'facebook']),
  count: z.number().min(1).max(10).optional(),
  tones: z.array(z.string()).optional()
});

const hashtagSchema = z.object({
  topic: z.string().min(1).max(200),
  platform: z.enum(['twitter', 'instagram', 'linkedin', 'tiktok', 'snapchat', 'facebook']),
  count: z.number().min(1).max(20).optional()
});

const imageGenerationSchema = z.object({
  prompt: z.string().min(1).max(500),
  style: z.string().optional(),
  size: z.enum(['256x256', '512x512', '1024x1024']).optional(),
  count: z.number().min(1).max(4).optional()
});

const sentimentAnalysisSchema = z.object({
  text: z.string().min(1).max(5000)
});

const engagementPredictionSchema = z.object({
  content: z.string().min(1).max(2000),
  platform: z.enum(['twitter', 'instagram', 'linkedin', 'tiktok', 'snapchat', 'facebook']),
  audience: z.string().min(1).max(200)
});

const productRecommendationsSchema = z.object({
  userInterests: z.array(z.string()).min(1).max(10),
  platform: z.enum(['twitter', 'instagram', 'linkedin', 'tiktok', 'snapchat', 'facebook']),
  industry: z.string().optional()
});

const trendingTopicsSchema = z.object({
  platform: z.enum(['twitter', 'instagram', 'linkedin', 'tiktok', 'snapchat', 'facebook']),
  industry: z.string().min(1).max(200)
});

// SEO Enhancement validation schemas
const seoOptimizationSchema = z.object({
  content: z.string().min(1).max(5000),
  keywords: z.array(z.string()).min(1).max(20),
  industry: z.string().min(1).max(200)
});

const contentCalendarSchema = z.object({
  industry: z.string().min(1).max(200),
  timeframe: z.enum(['weekly', 'monthly', 'quarterly']),
  platforms: z.array(z.string()).min(1).max(6)
});

const keywordResearchSchema = z.object({
  topic: z.string().min(1).max(200),
  industry: z.string().min(1).max(200)
});

const topicClusterSchema = z.object({
  mainTopic: z.string().min(1).max(200),
  industry: z.string().min(1).max(200),
  depth: z.number().min(1).max(5).optional()
});

// Generate social media content
router.post('/generate-content', 
  authenticateUser, 
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { prompt, platform, tone, includeHashtags, characterLimit } = generateContentSchema.parse(req.body);

    const content = await localAI.generateSocialContent(prompt, platform, tone || 'casual');
    
    let hashtags = [];
    if (includeHashtags) {
      hashtags = await localAI.generateHashtags(prompt, platform, 5);
    }

    res.json({
      success: true,
      data: {
        content,
        hashtags,
        platform,
        tone: tone || 'casual',
        characterCount: content.length,
        generatedAt: new Date().toISOString()
      }
    });
  })
);

// Generate content variations for A/B testing
router.post('/generate-variations',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { prompt, platform, count, tones } = generateVariationsSchema.parse(req.body);

    const variations = await localAI.generateContentVariations(prompt, platform, count || 3);

    res.json({
      success: true,
      data: {
        variations,
        platform,
        prompt,
        generatedAt: new Date().toISOString()
      }
    });
  })
);

// Generate hashtags
router.post('/generate-hashtags',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { topic, platform, count } = hashtagSchema.parse(req.body);

    const hashtags = await localAI.generateHashtags(topic, platform, count || 10);

    res.json({
      success: true,
      data: {
        hashtags,
        topic,
        platform,
        count: hashtags.length,
        generatedAt: new Date().toISOString()
      }
    });
  })
);

// Generate images
router.post('/generate-image',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { prompt, style, size, count } = imageGenerationSchema.parse(req.body);

    const imageUrl = await localAI.generateImage(prompt, style || 'realistic');

    res.json({
      success: true,
      data: {
        imageUrl,
        prompt,
        style: style || 'realistic',
        size: size || '1024x1024',
        generatedAt: new Date().toISOString()
      }
    });
  })
);

// Analyze image and generate description
router.post('/analyze-image',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { imageUrl, platform } = z.object({
      imageUrl: z.string().url(),
      platform: z.enum(['twitter', 'instagram', 'linkedin', 'tiktok', 'snapchat', 'facebook'])
    }).parse(req.body);

    const result = await localAI.generateImageDescription(imageUrl, platform);

    res.json({
      success: true,
      data: {
        description: result.description,
        caption: result.caption,
        imageUrl,
        platform,
        generatedAt: new Date().toISOString()
      }
    });
  })
);

// Transcribe audio
router.post('/transcribe-audio',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    // This would typically handle file upload
    const { audioFile, language } = z.object({
      audioFile: z.any(), // File buffer
      language: z.string().optional()
    }).parse(req.body);

    const transcription = await localAI.transcribeAudio(audioFile, language || 'en');

    res.json({
      success: true,
      data: {
        transcription,
        language: language || 'en',
        generatedAt: new Date().toISOString()
      }
    });
  })
);

// Generate speech from text
router.post('/generate-speech',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { text, voice } = z.object({
      text: z.string().min(1).max(1000),
      voice: z.string().optional()
    }).parse(req.body);

    const audioBuffer = await localAI.generateSpeech(text, voice || 'alloy');

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="generated-speech.mp3"');
    res.send(audioBuffer);
  })
);

// Analyze sentiment
router.post('/analyze-sentiment',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { text } = sentimentAnalysisSchema.parse(req.body);

    const sentiment = await localAI.analyzeSentiment(text);

    res.json({
      success: true,
      data: {
        sentiment,
        text,
        analyzedAt: new Date().toISOString()
      }
    });
  })
);

// Predict engagement
router.post('/predict-engagement',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { content, platform, audience } = engagementPredictionSchema.parse(req.body);

    const prediction = await localAI.predictEngagement(content, platform, audience);

    res.json({
      success: true,
      data: {
        prediction,
        content,
        platform,
        audience,
        predictedAt: new Date().toISOString()
      }
    });
  })
);

// Generate conversation response
router.post('/generate-response',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { context, userMessage, brandVoice } = z.object({
      context: z.string().min(1).max(1000),
      userMessage: z.string().min(1).max(500),
      brandVoice: z.string().optional()
    }).parse(req.body);

    const response = await localAI.generateResponse(context, userMessage, brandVoice || 'friendly');

    res.json({
      success: true,
      data: {
        response,
        context,
        userMessage,
        brandVoice: brandVoice || 'friendly',
        generatedAt: new Date().toISOString()
      }
    });
  })
);

// Generate product recommendations
router.post('/product-recommendations',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { userInterests, platform, industry } = productRecommendationsSchema.parse(req.body);

    const recommendations = await localAI.generateProductRecommendations(userInterests, platform);

    res.json({
      success: true,
      data: {
        recommendations,
        userInterests,
        platform,
        industry,
        generatedAt: new Date().toISOString()
      }
    });
  })
);

// Analyze trending topics
router.post('/trending-topics',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { platform, industry } = trendingTopicsSchema.parse(req.body);

    const analysis = await localAI.analyzeTrendingTopics(platform, industry);

    res.json({
      success: true,
      data: {
        analysis,
        platform,
        industry,
        analyzedAt: new Date().toISOString()
      }
    });
  })
);

// SEO Content Optimization
router.post('/seo-optimize',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { content, keywords, industry } = seoOptimizationSchema.parse(req.body);
    
    const optimizedContent = await localAI.optimizeContentForSEO(content, keywords, industry);
    
    res.json({
      success: true,
      data: {
        ...optimizedContent,
        originalContent: content,
        keywords,
        industry,
        optimizedAt: new Date().toISOString()
      }
    });
  })
);

// Content Calendar Planning
router.post('/content-calendar',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { industry, timeframe, platforms } = contentCalendarSchema.parse(req.body);
    
    const calendar = await localAI.generateContentCalendar(industry, timeframe, platforms);
    
    res.json({
      success: true,
      data: {
        ...calendar,
        industry,
        timeframe,
        platforms,
        generatedAt: new Date().toISOString()
      }
    });
  })
);

// Keyword Research Integration
router.post('/keyword-research',
  authenticateUser,
  requireSubscriptionTier('pro'),
  asyncHandler(async (req, res) => {
    const { topic, industry } = keywordResearchSchema.parse(req.body);
    
    const keywords = await localAI.performKeywordResearch(topic, industry);
    
    res.json({
      success: true,
      data: {
        ...keywords,
        topic,
        industry,
        researchedAt: new Date().toISOString()
      }
    });
  })
);

// Topic Cluster Generator
router.post('/topic-cluster',
  authenticateUser,
  requireSubscriptionTier('enterprise'),
  asyncHandler(async (req, res) => {
    const { mainTopic, industry, depth } = topicClusterSchema.parse(req.body);
    
    const cluster = await localAI.generateTopicCluster(mainTopic, industry, depth || 3);
    
    res.json({
      success: true,
      data: {
        ...cluster,
        mainTopic,
        industry,
        depth: depth || 3,
        generatedAt: new Date().toISOString()
      }
    });
  })
);

// Batch content generation
router.post('/batch-generate',
  authenticateUser,
  requireSubscriptionTier('enterprise'),
  asyncHandler(async (req, res) => {
    const { prompts, platforms, tones } = z.object({
      prompts: z.array(z.string()).min(1).max(10),
      platforms: z.array(z.string()).min(1).max(6),
      tones: z.array(z.string()).optional()
    }).parse(req.body);

    const results = [];

    for (const prompt of prompts) {
      for (const platform of platforms) {
        const tone = tones ? tones[Math.floor(Math.random() * tones.length)] : 'casual';
        const content = await localAI.generateSocialContent(prompt, platform, tone);
        const hashtags = await localAI.generateHashtags(prompt, platform, 5);

        results.push({
          prompt,
          platform,
          tone,
          content,
          hashtags,
          generatedAt: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        totalGenerated: results.length,
        generatedAt: new Date().toISOString()
      }
    });
  })
);

// LocalAI health check
router.get('/health',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const isHealthy = await localAI.healthCheck();
    const models = await localAI.getAvailableModels();

    res.json({
      success: true,
      data: {
        healthy: isHealthy,
        availableModels: models.length,
        models: models.map((model: any) => ({
          id: model.id,
          name: model.name,
          type: model.type
        })),
        checkedAt: new Date().toISOString()
      }
    });
  })
);

// Get available models
router.get('/models',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const models = await localAI.getAvailableModels();

    res.json({
      success: true,
      data: {
        models: models.map((model: any) => ({
          id: model.id,
          name: model.name,
          type: model.type,
          description: model.description
        })),
        totalModels: models.length,
        fetchedAt: new Date().toISOString()
      }
    });
  })
);

// AI-powered campaign optimization
router.post('/optimize-campaign',
  authenticateUser,
  requireSubscriptionTier('enterprise'),
  asyncHandler(async (req, res) => {
    const { campaignData, performanceHistory, targetAudience } = z.object({
      campaignData: z.object({
        content: z.string(),
        platform: z.string(),
        targetAudience: z.string(),
        goals: z.array(z.string())
      }),
      performanceHistory: z.array(z.object({
        content: z.string(),
        engagement: z.number(),
        conversions: z.number(),
        platform: z.string()
      })).optional(),
      targetAudience: z.object({
        interests: z.array(z.string()),
        demographics: z.object({
          age: z.string().optional(),
          location: z.string().optional(),
          language: z.string().optional()
        }).optional()
      })
    }).parse(req.body);

    // Generate optimized content based on performance history
    const optimizedContent = await localAI.generateSocialContent(
      campaignData.content,
      campaignData.platform,
      'professional'
    );

    // Predict engagement
    const engagementPrediction = await localAI.predictEngagement(
      optimizedContent,
      campaignData.platform,
      targetAudience.interests.join(', ')
    );

    // Generate hashtags
    const hashtags = await localAI.generateHashtags(
      campaignData.content,
      campaignData.platform,
      10
    );

    // Generate product recommendations
    const recommendations = await localAI.generateProductRecommendations(
      targetAudience.interests,
      campaignData.platform
    );

    res.json({
      success: true,
      data: {
        optimizedContent,
        engagementPrediction,
        hashtags,
        productRecommendations: recommendations,
        optimizationSuggestions: [
          'Post during peak engagement hours',
          'Use trending hashtags',
          'Include call-to-action',
          'Add visual content'
        ],
        generatedAt: new Date().toISOString()
      }
    });
  })
);

export { router as aiRoutes }; 