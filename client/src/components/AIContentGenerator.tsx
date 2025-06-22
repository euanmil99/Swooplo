import React, { useState, useCallback } from 'react';
import { api } from '../lib/api';

interface GeneratedContent {
  content: string;
  hashtags: string[];
  platform: string;
  tone: string;
  characterCount: number;
  generatedAt: string;
}

interface ContentVariation {
  id: number;
  content: string;
  tone: string;
  generatedAt: string;
}

interface GeneratedImage {
  imageUrl: string;
  prompt: string;
  style: string;
  size: string;
  generatedAt: string;
}

interface EngagementPrediction {
  likes: number;
  comments: number;
  shares: number;
  reach_estimate: number;
}

interface ProductRecommendation {
  product_name: string;
  description: string;
  affiliate_link: string;
  commission_rate: string;
}

const AIContentGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'content' | 'images' | 'hashtags' | 'analysis' | 'campaign'>('content');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Content generation state
  const [contentPrompt, setContentPrompt] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [selectedTone, setSelectedTone] = useState('casual');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [contentVariations, setContentVariations] = useState<ContentVariation[]>([]);

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('realistic');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);

  // Hashtag generation state
  const [hashtagTopic, setHashtagTopic] = useState('');
  const [hashtagCount, setHashtagCount] = useState(10);
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);

  // Analysis state
  const [analysisText, setAnalysisText] = useState('');
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [engagementPrediction, setEngagementPrediction] = useState<EngagementPrediction | null>(null);

  // Campaign optimization state
  const [campaignData, setCampaignData] = useState({
    content: '',
    targetAudience: '',
    goals: ['engagement', 'conversions']
  });
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  const platforms = [
    { value: 'instagram', label: 'Instagram', icon: '📷' },
    { value: 'twitter', label: 'Twitter', icon: '🐦' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
    { value: 'facebook', label: 'Facebook', icon: '📘' },
    { value: 'snapchat', label: 'Snapchat', icon: '👻' }
  ];

  const tones = [
    { value: 'casual', label: 'Casual', description: 'Friendly and relaxed' },
    { value: 'professional', label: 'Professional', description: 'Business-focused' },
    { value: 'excited', label: 'Excited', description: 'Enthusiastic and energetic' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
    { value: 'authoritative', label: 'Authoritative', description: 'Confident and expert' }
  ];

  const imageStyles = [
    { value: 'realistic', label: 'Realistic' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'modern', label: 'Modern' }
  ];

  const generateContent = useCallback(async () => {
    if (!contentPrompt.trim()) {
      setError('Please enter a prompt for content generation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/generate-content', {
        prompt: contentPrompt,
        platform: selectedPlatform,
        tone: selectedTone,
        includeHashtags
      });

      setGeneratedContent(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  }, [contentPrompt, selectedPlatform, selectedTone, includeHashtags]);

  const generateVariations = useCallback(async () => {
    if (!contentPrompt.trim()) {
      setError('Please enter a prompt for content generation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/generate-variations', {
        prompt: contentPrompt,
        platform: selectedPlatform,
        count: 3
      });

      setContentVariations(response.data.data.variations);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate variations');
    } finally {
      setLoading(false);
    }
  }, [contentPrompt, selectedPlatform]);

  const generateImage = useCallback(async () => {
    if (!imagePrompt.trim()) {
      setError('Please enter a prompt for image generation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/generate-image', {
        prompt: imagePrompt,
        style: imageStyle,
        size: imageSize
      });

      setGeneratedImage(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  }, [imagePrompt, imageStyle, imageSize]);

  const generateHashtags = useCallback(async () => {
    if (!hashtagTopic.trim()) {
      setError('Please enter a topic for hashtag generation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/generate-hashtags', {
        topic: hashtagTopic,
        platform: selectedPlatform,
        count: hashtagCount
      });

      setGeneratedHashtags(response.data.data.hashtags);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate hashtags');
    } finally {
      setLoading(false);
    }
  }, [hashtagTopic, selectedPlatform, hashtagCount]);

  const analyzeSentiment = useCallback(async () => {
    if (!analysisText.trim()) {
      setError('Please enter text for sentiment analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/analyze-sentiment', {
        text: analysisText
      });

      setSentiment(response.data.data.sentiment);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to analyze sentiment');
    } finally {
      setLoading(false);
    }
  }, [analysisText]);

  const predictEngagement = useCallback(async () => {
    if (!analysisText.trim()) {
      setError('Please enter content for engagement prediction');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/predict-engagement', {
        content: analysisText,
        platform: selectedPlatform,
        audience: 'general'
      });

      setEngagementPrediction(response.data.data.prediction);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to predict engagement');
    } finally {
      setLoading(false);
    }
  }, [analysisText, selectedPlatform]);

  const optimizeCampaign = useCallback(async () => {
    if (!campaignData.content.trim()) {
      setError('Please enter campaign content');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/optimize-campaign', {
        campaignData: {
          content: campaignData.content,
          platform: selectedPlatform,
          targetAudience: campaignData.targetAudience,
          goals: campaignData.goals
        },
        targetAudience: {
          interests: ['technology', 'business', 'marketing']
        }
      });

      setOptimizationResults(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to optimize campaign');
    } finally {
      setLoading(false);
    }
  }, [campaignData, selectedPlatform]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 AI Content Generator</h1>
        <p className="text-gray-600">Powered by LocalAI - Generate engaging social media content with advanced AI</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {[
          { id: 'content', label: 'Content Generation', icon: '✍️' },
          { id: 'images', label: 'Image Generation', icon: '🎨' },
          { id: 'hashtags', label: 'Hashtag Suggestions', icon: '#' },
          { id: 'analysis', label: 'Content Analysis', icon: '📊' },
          { id: 'campaign', label: 'Campaign Optimization', icon: '🚀' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Content Generation Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Generate Social Media Content</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Prompt
                </label>
                <textarea
                  value={contentPrompt}
                  onChange={(e) => setContentPrompt(e.target.value)}
                  placeholder="Describe what you want to post about..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {platforms.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.icon} {platform.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {tones.map((tone) => (
                      <option key={tone.value} value={tone.value}>
                        {tone.label} - {tone.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeHashtags"
                    checked={includeHashtags}
                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeHashtags" className="ml-2 text-sm text-gray-700">
                    Include hashtags
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={generateContent}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Content'}
              </button>
              <button
                onClick={generateVariations}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Variations'}
              </button>
            </div>
          </div>

          {/* Generated Content Display */}
          {generatedContent && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Generated Content</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900">{generatedContent.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Character count: {generatedContent.characterCount}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedContent.content)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Copy to clipboard
                  </button>
                </div>

                {generatedContent.hashtags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.hashtags.map((hashtag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>Platform: {generatedContent.platform}</div>
                  <div>Tone: {generatedContent.tone}</div>
                </div>
              </div>
            </div>
          )}

          {/* Content Variations Display */}
          {contentVariations.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Content Variations</h3>
              <div className="space-y-4">
                {contentVariations.map((variation) => (
                  <div key={variation.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Variation {variation.id} ({variation.tone})
                      </span>
                      <button
                        onClick={() => copyToClipboard(variation.content)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-gray-900">{variation.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Generation Tab */}
      {activeTab === 'images' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Generate Images</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Prompt
                </label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style
                  </label>
                  <select
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {imageStyles.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="256x256">256x256</option>
                    <option value="512x512">512x512</option>
                    <option value="1024x1024">1024x1024</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={generateImage}
              disabled={loading}
              className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating Image...' : 'Generate Image'}
            </button>
          </div>

          {/* Generated Image Display */}
          {generatedImage && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Generated Image</h3>
              <div className="space-y-4">
                <img
                  src={generatedImage.imageUrl}
                  alt="Generated"
                  className="w-full max-w-md rounded-lg shadow-sm"
                />
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>Style: {generatedImage.style}</div>
                  <div>Size: {generatedImage.size}</div>
                </div>
                <button
                  onClick={() => window.open(generatedImage.imageUrl, '_blank')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Open in new tab
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hashtag Generation Tab */}
      {activeTab === 'hashtags' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Generate Hashtags</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic
                </label>
                <input
                  type="text"
                  value={hashtagTopic}
                  onChange={(e) => setHashtagTopic(e.target.value)}
                  placeholder="Enter your topic or keyword..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {platforms.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.icon} {platform.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Hashtags
                  </label>
                  <input
                    type="number"
                    value={hashtagCount}
                    onChange={(e) => setHashtagCount(Number(e.target.value))}
                    min="1"
                    max="20"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={generateHashtags}
              disabled={loading}
              className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating Hashtags...' : 'Generate Hashtags'}
            </button>
          </div>

          {/* Generated Hashtags Display */}
          {generatedHashtags.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Generated Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {generatedHashtags.map((hashtag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm cursor-pointer hover:bg-green-200"
                    onClick={() => copyToClipboard(hashtag)}
                  >
                    {hashtag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => copyToClipboard(generatedHashtags.join(' '))}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Copy all hashtags
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Content Analysis</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content to Analyze
                </label>
                <textarea
                  value={analysisText}
                  onChange={(e) => setAnalysisText(e.target.value)}
                  placeholder="Enter content to analyze..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {platforms.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.icon} {platform.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={analyzeSentiment}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Analyze Sentiment'}
              </button>
              <button
                onClick={predictEngagement}
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Predicting...' : 'Predict Engagement'}
              </button>
            </div>
          </div>

          {/* Analysis Results */}
          {(sentiment || engagementPrediction) && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
              
              {sentiment && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Sentiment Analysis</h4>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                    sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                  </div>
                </div>
              )}

              {engagementPrediction && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Engagement Prediction</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{engagementPrediction.likes}</div>
                      <div className="text-sm text-gray-600">Likes</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{engagementPrediction.comments}</div>
                      <div className="text-sm text-gray-600">Comments</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{engagementPrediction.shares}</div>
                      <div className="text-sm text-gray-600">Shares</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{engagementPrediction.reach_estimate}</div>
                      <div className="text-sm text-gray-600">Reach</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Campaign Optimization Tab */}
      {activeTab === 'campaign' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Campaign Optimization</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Content
                </label>
                <textarea
                  value={campaignData.content}
                  onChange={(e) => setCampaignData({ ...campaignData, content: e.target.value })}
                  placeholder="Enter your campaign content..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={campaignData.targetAudience}
                  onChange={(e) => setCampaignData({ ...campaignData, targetAudience: e.target.value })}
                  placeholder="Describe your target audience..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {platforms.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.icon} {platform.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={optimizeCampaign}
              disabled={loading}
              className="mt-6 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Optimizing...' : 'Optimize Campaign'}
            </button>
          </div>

          {/* Optimization Results */}
          {optimizationResults && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Optimization Results</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Optimized Content</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900">{optimizationResults.optimizedContent}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(optimizationResults.optimizedContent)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Copy optimized content
                  </button>
                </div>

                {optimizationResults.hashtags && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Recommended Hashtags</h4>
                    <div className="flex flex-wrap gap-2">
                      {optimizationResults.hashtags.map((hashtag: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {optimizationResults.optimizationSuggestions && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Optimization Suggestions</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {optimizationResults.optimizationSuggestions.map((suggestion: string, index: number) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIContentGenerator; 