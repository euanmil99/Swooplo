import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { api } from '../lib/api';

interface SEOOptimizationResult {
  optimizedContent: string;
  seoScore: number;
  improvementSuggestions: string[];
}

interface ContentCalendarResult {
  calendar: any[];
  trendingTopics: string[];
  seasonalThemes: string[];
}

interface KeywordResearchResult {
  primaryKeywords: string[];
  longTailKeywords: string[];
  relatedTerms: string[];
  searchIntentCategories: {
    informational: string[];
    navigational: string[];
    commercial: string[];
    transactional: string[];
  };
}

interface TopicClusterResult {
  pillarTopic: {
    title: string;
    description: string;
    targetKeywords: string[];
  };
  subtopics: any[];
  internalLinkingStrategy: string[];
  contentRecommendations: string[];
}

export const SEOEnhancement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('optimization');
  const [loading, setLoading] = useState(false);

  // SEO Optimization State
  const [seoContent, setSeoContent] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoIndustry, setSeoIndustry] = useState('');
  const [seoResult, setSeoResult] = useState<SEOOptimizationResult | null>(null);

  // Content Calendar State
  const [calendarIndustry, setCalendarIndustry] = useState('');
  const [calendarTimeframe, setCalendarTimeframe] = useState('monthly');
  const [calendarPlatforms, setCalendarPlatforms] = useState<string[]>([]);
  const [calendarResult, setCalendarResult] = useState<ContentCalendarResult | null>(null);

  // Keyword Research State
  const [keywordTopic, setKeywordTopic] = useState('');
  const [keywordIndustry, setKeywordIndustry] = useState('');
  const [keywordResult, setKeywordResult] = useState<KeywordResearchResult | null>(null);

  // Topic Cluster State
  const [clusterTopic, setClusterTopic] = useState('');
  const [clusterIndustry, setClusterIndustry] = useState('');
  const [clusterDepth, setClusterDepth] = useState(3);
  const [clusterResult, setClusterResult] = useState<TopicClusterResult | null>(null);

  const handleSEOOptimization = async () => {
    setLoading(true);
    try {
      const keywords = seoKeywords.split(',').map(k => k.trim()).filter(k => k);
      const response = await api.post('/ai/seo-optimize', {
        content: seoContent,
        keywords,
        industry: seoIndustry
      });
      setSeoResult(response.data.data);
    } catch (error) {
      console.error('SEO optimization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentCalendar = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ai/content-calendar', {
        industry: calendarIndustry,
        timeframe: calendarTimeframe,
        platforms: calendarPlatforms
      });
      setCalendarResult(response.data.data);
    } catch (error) {
      console.error('Content calendar error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordResearch = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ai/keyword-research', {
        topic: keywordTopic,
        industry: keywordIndustry
      });
      setKeywordResult(response.data.data);
    } catch (error) {
      console.error('Keyword research error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicCluster = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ai/topic-cluster', {
        mainTopic: clusterTopic,
        industry: clusterIndustry,
        depth: clusterDepth
      });
      setClusterResult(response.data.data);
    } catch (error) {
      console.error('Topic cluster error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SEO Enhancement Tools</h1>
        <p className="text-gray-600">
          Optimize your content for search engines and improve your social media reach with AI-powered SEO tools.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="optimization">Content Optimization</TabsTrigger>
          <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
          <TabsTrigger value="keywords">Keyword Research</TabsTrigger>
          <TabsTrigger value="cluster">Topic Clusters</TabsTrigger>
        </TabsList>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Content Optimization</CardTitle>
              <CardDescription>
                Optimize your content for better search rankings while maintaining engagement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <Textarea
                  placeholder="Enter your content to optimize..."
                  value={seoContent}
                  onChange={(e) => setSeoContent(e.target.value)}
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Keywords</label>
                  <Input
                    placeholder="keyword1, keyword2, keyword3"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Industry</label>
                  <Input
                    placeholder="e.g., Technology, Health, Finance"
                    value={seoIndustry}
                    onChange={(e) => setSeoIndustry(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSEOOptimization} disabled={loading || !seoContent}>
                {loading ? 'Optimizing...' : 'Optimize Content'}
              </Button>
            </CardContent>
          </Card>

          {seoResult && (
            <Card>
              <CardHeader>
                <CardTitle>Optimization Results</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">SEO Score:</span>
                  <Badge className={getSEOScoreColor(seoResult.seoScore)}>
                    {seoResult.seoScore}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Optimized Content</label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {seoResult.optimizedContent}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Improvement Suggestions</label>
                  <ul className="list-disc list-inside space-y-1">
                    {seoResult.improvementSuggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-700">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Calendar Planning</CardTitle>
              <CardDescription>
                Generate AI-suggested content themes based on trending topics in your industry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Industry</label>
                  <Input
                    placeholder="e.g., Technology, Health, Finance"
                    value={calendarIndustry}
                    onChange={(e) => setCalendarIndustry(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Timeframe</label>
                  <Select value={calendarTimeframe} onValueChange={setCalendarTimeframe}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook'].map((platform) => (
                    <Button
                      key={platform}
                      variant={calendarPlatforms.includes(platform) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (calendarPlatforms.includes(platform)) {
                          setCalendarPlatforms(calendarPlatforms.filter(p => p !== platform));
                        } else {
                          setCalendarPlatforms([...calendarPlatforms, platform]);
                        }
                      }}
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleContentCalendar} disabled={loading || !calendarIndustry}>
                {loading ? 'Generating...' : 'Generate Calendar'}
              </Button>
            </CardContent>
          </Card>

          {calendarResult && (
            <Card>
              <CardHeader>
                <CardTitle>Content Calendar Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Trending Topics</label>
                  <div className="flex flex-wrap gap-2">
                    {calendarResult.trendingTopics.map((topic, index) => (
                      <Badge key={index} variant="secondary">{topic}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Seasonal Themes</label>
                  <div className="flex flex-wrap gap-2">
                    {calendarResult.seasonalThemes.map((theme, index) => (
                      <Badge key={index} variant="outline">{theme}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Research</CardTitle>
              <CardDescription>
                Discover valuable keywords for your content strategy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Topic</label>
                  <Input
                    placeholder="e.g., digital marketing, fitness tips"
                    value={keywordTopic}
                    onChange={(e) => setKeywordTopic(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Industry</label>
                  <Input
                    placeholder="e.g., Technology, Health, Finance"
                    value={keywordIndustry}
                    onChange={(e) => setKeywordIndustry(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleKeywordResearch} disabled={loading || !keywordTopic}>
                {loading ? 'Researching...' : 'Research Keywords'}
              </Button>
            </CardContent>
          </Card>

          {keywordResult && (
            <Card>
              <CardHeader>
                <CardTitle>Keyword Research Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Keywords</label>
                  <div className="flex flex-wrap gap-2">
                    {keywordResult.primaryKeywords.map((keyword, index) => (
                      <Badge key={index} variant="default">{keyword}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Long-Tail Keywords</label>
                  <div className="flex flex-wrap gap-2">
                    {keywordResult.longTailKeywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Search Intent Categories</label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(keywordResult.searchIntentCategories).map(([intent, keywords]) => (
                      <div key={intent}>
                        <h4 className="text-sm font-medium capitalize mb-2">{intent}</h4>
                        <div className="flex flex-wrap gap-1">
                          {keywords.slice(0, 5).map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cluster" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Topic Cluster Generator</CardTitle>
              <CardDescription>
                Create interconnected content series for better SEO.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Main Topic</label>
                  <Input
                    placeholder="e.g., digital marketing strategies"
                    value={clusterTopic}
                    onChange={(e) => setClusterTopic(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Industry</label>
                  <Input
                    placeholder="e.g., Technology, Health, Finance"
                    value={clusterIndustry}
                    onChange={(e) => setClusterIndustry(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cluster Depth</label>
                <Select value={clusterDepth.toString()} onValueChange={(value) => setClusterDepth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Levels</SelectItem>
                    <SelectItem value="3">3 Levels</SelectItem>
                    <SelectItem value="4">4 Levels</SelectItem>
                    <SelectItem value="5">5 Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleTopicCluster} disabled={loading || !clusterTopic}>
                {loading ? 'Generating...' : 'Generate Topic Cluster'}
              </Button>
            </CardContent>
          </Card>

          {clusterResult && (
            <Card>
              <CardHeader>
                <CardTitle>Topic Cluster Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Pillar Topic</label>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold">{clusterResult.pillarTopic.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{clusterResult.pillarTopic.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {clusterResult.pillarTopic.targetKeywords.map((keyword, index) => (
                        <Badge key={index} variant="default" className="text-xs">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content Recommendations</label>
                  <ul className="list-disc list-inside space-y-1">
                    {clusterResult.contentRecommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm text-gray-700">{recommendation}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 