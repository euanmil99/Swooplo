import axios from 'axios';
import { z } from 'zod';

// LocalAI API client
export class LocalAIService {
  private baseURL: string;
  private apiKey?: string;

  constructor(baseURL: string = 'http://localhost:8080', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  // Text generation for social media content
  async generateSocialContent(prompt: string, platform: string, tone: string = 'casual') {
    const platformPrompts = {
      twitter: `Generate a Twitter post (max 280 characters) about: ${prompt}. Tone: ${tone}. Include relevant hashtags.`,
      instagram: `Generate an Instagram caption about: ${prompt}. Tone: ${tone}. Include emojis and hashtags.`,
      linkedin: `Generate a professional LinkedIn post about: ${prompt}. Tone: ${tone}. Keep it business-focused.`,
      tiktok: `Generate a TikTok video description about: ${prompt}. Tone: ${tone}. Include trending hashtags.`,
      snapchat: `Generate a Snapchat story caption about: ${prompt}. Tone: ${tone}. Keep it short and fun.`
    };

    const systemPrompt = platformPrompts[platform as keyof typeof platformPrompts] || platformPrompts.twitter;

    try {
      const response = await axios.post(`${this.baseURL}/v1/chat/completions`, {
        model: 'llama-3.2-1b-instruct:q4_k_m', // Default model, can be configured
        messages: [
          {
            role: 'system',
            content: 'You are an expert social media content creator specializing in affiliate marketing. Create engaging, authentic content that drives engagement and conversions.'
          },
          {
            role: 'user',
            content: systemPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: false
      }, {
        headers: {
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : undefined,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LocalAI text generation error:', error);
      throw new Error('Failed to generate content with LocalAI');
    }
  }

  // Generate multiple content variations for A/B testing
  async generateContentVariations(prompt: string, platform: string, count: number = 3) {
    const variations = [];
    
    for (let i = 0; i < count; i++) {
      const variation = await this.generateSocialContent(prompt, platform, this.getRandomTone());
      variations.push({
        id: i + 1,
        content: variation,
        tone: this.getRandomTone(),
        generatedAt: new Date().toISOString()
      });
    }

    return variations;
  }

  // Generate hashtag suggestions
  async generateHashtags(topic: string, platform: string, count: number = 10) {
    const platformSpecific = {
      instagram: 'Instagram',
      twitter: 'Twitter',
      tiktok: 'TikTok',
      linkedin: 'LinkedIn'
    };

    const prompt = `Generate ${count} relevant hashtags for ${topic} on ${platformSpecific[platform as keyof typeof platformSpecific] || 'social media'}. Return only the hashtags separated by spaces.`;

    try {
      const response = await axios.post(`${this.baseURL}/v1/chat/completions`, {
        model: 'llama-3.2-1b-instruct:q4_k_m',
        messages: [
          {
            role: 'system',
            content: 'You are a hashtag expert. Generate relevant, trending hashtags that will increase reach and engagement.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
        stream: false
      });

      const hashtags = response.data.choices[0].message.content
        .split(' ')
        .filter((tag: string) => tag.startsWith('#'))
        .slice(0, count);

      return hashtags;
    } catch (error) {
      console.error('LocalAI hashtag generation error:', error);
      return [];
    }
  }

  // Generate image descriptions for social media
  async generateImageDescription(imageUrl: string, platform: string) {
    try {
      // First, analyze the image using vision capabilities
      const visionResponse = await axios.post(`${this.baseURL}/v1/chat/completions`, {
        model: 'llava-v1.5-7b:q4_k_m', // Vision model
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Describe this image in detail for a ${platform} post. Focus on what would be engaging for ${platform} users.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const imageDescription = visionResponse.data.choices[0].message.content;

      // Then generate an optimized caption
      const captionResponse = await axios.post(`${this.baseURL}/v1/chat/completions`, {
        model: 'llama-3.2-1b-instruct:q4_k_m',
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert. Create engaging captions based on image descriptions.'
          },
          {
            role: 'user',
            content: `Create a ${platform} caption for this image: ${imageDescription}`
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      });

      return {
        description: imageDescription,
        caption: captionResponse.data.choices[0].message.content
      };
    } catch (error) {
      console.error('LocalAI image description error:', error);
      throw new Error('Failed to generate image description');
    }
  }

  // Generate images for social media posts
  async generateImage(prompt: string, style: string = 'realistic') {
    try {
      const response = await axios.post(`${this.baseURL}/v1/images/generations`, {
        model: 'stablediffusion',
        prompt: `${prompt}, ${style} style, high quality, social media ready`,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      });

      return response.data.data[0].url;
    } catch (error) {
      console.error('LocalAI image generation error:', error);
      throw new Error('Failed to generate image');
    }
  }

  // Audio transcription for voice content
  async transcribeAudio(audioFile: Buffer, language: string = 'en') {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([audioFile]), 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', language);

      const response = await axios.post(`${this.baseURL}/v1/audio/transcriptions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.text;
    } catch (error) {
      console.error('LocalAI audio transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  // Generate text-to-speech for audio content
  async generateSpeech(text: string, voice: string = 'alloy') {
    try {
      const response = await axios.post(`${this.baseURL}/v1/audio/speech`, {
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3'
      }, {
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('LocalAI speech generation error:', error);
      throw new Error('Failed to generate speech');
    }
  }

  // Sentiment analysis for social media posts
  async analyzeSentiment(text: string) {
    try {
      const response = await axios.post(`${this.baseURL}/v1/chat/completions`, {
        model: 'llama-3.2-1b-instruct:q4_k_m',
        messages: [
          {
            role: 'system',
            content: 'Analyze the sentiment of the given text. Return only: positive, negative, or neutral.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      return response.data.choices[0].message.content.trim().toLowerCase();
    } catch (error) {
      console.error('LocalAI sentiment analysis error:', error);
      return 'neutral';
    }
  }

  // Generate engagement predictions
  async predictEngagement(content: string, platform: string, audience: string) {
    try {
      const response = await axios.post(`${this.baseURL}/v1/chat/completions`, {
        model: 'llama-3.2-1b-instruct:q4_k_m',
        messages: [
          {
            role: 'system',
            content: 'You are a social media analytics expert. Predict engagement metrics for the given content.'
          },
          {
            role: 'user',
            content: `Predict engagement for this ${platform} content targeting ${audience}: "${content}". Return a JSON with: likes, comments, shares, reach_estimate`
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      const prediction = response.data.choices[0].message.content;
      return JSON.parse(prediction);
    } catch (error) {
      console.error('LocalAI engagement prediction error:', error);
      return {
        likes: 0,
        comments: 0,
        shares: 0,
        reach_estimate: 0
      };
    }
  }

  // Generate conversation responses for social media engagement
  async generateResponse(context: string, userMessage: string, brandVoice: string = 'friendly') {
    try {
      const response = await axios.post(`${this.baseURL}/v1/chat/completions`, {
        model: 'llama-3.2-1b-instruct:q4_k_m',
        messages: [
          {
            role: 'system',
            content: `You are a social media manager for an affiliate marketing brand. Respond in a ${brandVoice} tone. Context: ${context}`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LocalAI response generation error:', error);
      throw new Error('Failed to generate response');
    }
  }

  // Generate product recommendations based on user behavior
  async generateProductRecommendations(userInterests: string[], platform: string) {
    try {
      const response = await axios.post(`${this.baseURL}/v1/chat/completions`, {
        model: 'llama-3.2-1b-instruct:q4_k_m',
        messages: [
          {
            role: 'system',
            content: 'You are an affiliate marketing expert. Recommend products based on user interests.'
          },
          {
            role: 'user',
            content: `Recommend 3 affiliate products for someone interested in: ${userInterests.join(', ')}. Platform: ${platform}. Return JSON with: product_name, description, affiliate_link, commission_rate`
          }
        ],
        max_tokens: 400,
        temperature: 0.6
      });

      const recommendations = response.data.choices[0].message.content;
      return JSON.parse(recommendations);
    } catch (error) {
      console.error('LocalAI product recommendations error:', error);
      return [];
    }
  }

  // Generate trending topic analysis
  async analyzeTrendingTopics(platform: string, industry: string) {
    try {
      const response = await axios.post(`${this.baseURL}/v1/chat/completions`, {
        model: 'llama-3.2-1b-instruct:q4_k_m',
        messages: [
          {
            role: 'system',
            content: 'You are a social media trend analyst. Identify trending topics and hashtags.'
          },
          {
            role: 'user',
            content: `Analyze trending topics in ${industry} for ${platform}. Return JSON with: topics, hashtags, engagement_potential, content_ideas`
          }
        ],
        max_tokens: 500,
        temperature: 0.8
      });

      const analysis = response.data.choices[0].message.content;
      return JSON.parse(analysis);
    } catch (error) {
      console.error('LocalAI trending analysis error:', error);
      return {
        topics: [],
        hashtags: [],
        engagement_potential: 'low',
        content_ideas: []
      };
    }
  }

  // Helper methods
  private getRandomTone(): string {
    const tones = ['casual', 'professional', 'excited', 'friendly', 'authoritative'];
    return tones[Math.floor(Math.random() * tones.length)];
  }

  // Health check
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Get available models
  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseURL}/models`);
      return response.data;
    } catch (error) {
      console.error('LocalAI models fetch error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const localAI = new LocalAIService(
  process.env.LOCALAI_URL || 'http://localhost:8080',
  process.env.LOCALAI_API_KEY
); 