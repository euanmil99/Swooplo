import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Twitter, Instagram, Linkedin, AlertCircle, Edit, Copy, Share2, TrendingUp } from 'lucide-react';

// Platform icon mapping
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case 'twitter': return <Twitter className="h-5 w-5 text-blue-400" />;
    case 'instagram': return <Instagram className="h-5 w-5 text-pink-500" />;
    case 'linkedin': return <Linkedin className="h-5 w-5 text-blue-600" />;
    default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
};

// Engagement prediction component
const EngagementPrediction = ({ score }: { score: number }) => {
  let color = 'bg-red-500';
  let textColor = 'text-red-600';
  if (score > 70) {
    color = 'bg-green-500';
    textColor = 'text-green-600';
  } else if (score > 40) {
    color = 'bg-yellow-500';
    textColor = 'text-yellow-600';
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${color}`}></div>
      <span className={`text-sm font-medium ${textColor}`}>Est. Engagement: {score}%</span>
    </div>
  );
};

// Content Preview Card
const ContentPreviewCard = ({ content, platform, engagementScore, aiGenerated = false }: {
  content: string;
  platform: string;
  engagementScore: number;
  aiGenerated?: boolean;
}) => {
  const handleEdit = () => {
    console.log('Edit content for', platform);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    // Show success toast
  };

  const handleShare = () => {
    console.log('Share content for', platform);
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <PlatformIcon platform={platform} />
          <CardTitle className="text-sm font-medium">{platform}</CardTitle>
          {aiGenerated && (
            <Badge variant="outline" className="text-xs">
              AI Generated
            </Badge>
          )}
        </div>
        <EngagementPrediction score={engagementScore} />
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed mb-3">{content}</p>
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {platform.toLowerCase() === 'twitter' && (
              <>
                <Badge variant="secondary" className="text-xs">#marketing</Badge>
                <Badge variant="secondary" className="text-xs">#growth</Badge>
                <Badge variant="secondary" className="text-xs">#strategy</Badge>
              </>
            )}
            {platform.toLowerCase() === 'instagram' && (
              <>
                <Badge variant="secondary" className="text-xs">#business</Badge>
                <Badge variant="secondary" className="text-xs">#success</Badge>
                <Badge variant="secondary" className="text-xs">#entrepreneur</Badge>
              </>
            )}
            {platform.toLowerCase() === 'linkedin' && (
              <>
                <Badge variant="secondary" className="text-xs">#professional</Badge>
                <Badge variant="secondary" className="text-xs">#networking</Badge>
                <Badge variant="secondary" className="text-xs">#career</Badge>
              </>
            )}
          </div>
          <div className="flex space-x-1">
            <Button size="sm" variant="ghost" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ContentEnhancementDashboard() {
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Replace with actual API call to get AI-generated content
    const fetchContents = async () => {
      try {
        setIsLoading(true);
        // For demonstration, using mock data
        const mockData = [
          { 
            id: 1, 
            content: "🚀 Ready to boost your marketing game? Here are 5 proven strategies that actually work! From content optimization to audience targeting, these tactics will transform your results. #marketing #growthhacking #strategy", 
            platform: "Twitter", 
            engagementScore: 85,
            aiGenerated: true
          },
          { 
            id: 2, 
            content: "Grow your business with these 7 affiliate marketing strategies that are working in 2023. From niche selection to conversion optimization, discover what's driving real results. #affiliatemarketing #growthhacking #digitalmarketing", 
            platform: "Twitter", 
            engagementScore: 72,
            aiGenerated: true
          },
          { 
            id: 3, 
            content: "Is your content strategy driving results? Learn how to optimize your approach with data-driven insights. Understanding your audience and measuring performance is key to sustainable growth.", 
            platform: "LinkedIn", 
            engagementScore: 65,
            aiGenerated: false
          },
          { 
            id: 4, 
            content: "Double your conversion rate with these proven optimization techniques. Swipe up to learn more! From landing page design to email sequences, every detail matters. #marketing #optimization #results #conversion", 
            platform: "Instagram", 
            engagementScore: 91,
            aiGenerated: true
          },
          { 
            id: 5, 
            content: "The future of affiliate marketing is here. AI-powered tools are revolutionizing how we create content, analyze performance, and optimize campaigns. Stay ahead of the curve!", 
            platform: "LinkedIn", 
            engagementScore: 78,
            aiGenerated: true
          },
          { 
            id: 6, 
            content: "Building a successful affiliate business starts with the right mindset. Focus on value creation, relationship building, and consistent execution. Your success story starts today! 💪", 
            platform: "Instagram", 
            engagementScore: 88,
            aiGenerated: false
          }
        ];
        setContents(mockData);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContents();
  }, []);
  
  const getAverageEngagement = () => {
    if (contents.length === 0) return 0;
    const total = contents.reduce((sum, item) => sum + item.engagementScore, 0);
    return Math.round(total / contents.length);
  };

  const getAIGeneratedCount = () => {
    return contents.filter(item => item.aiGenerated).length;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">AI Content Enhancement</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading content...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Content Enhancement</h2>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{getAverageEngagement()}%</div>
            <div className="text-sm text-gray-500">Avg. Engagement</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{getAIGeneratedCount()}</div>
            <div className="text-sm text-gray-500">AI Generated</div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Platforms</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          {contents.map((item) => (
            <ContentPreviewCard 
              key={item.id}
              content={item.content}
              platform={item.platform}
              engagementScore={item.engagementScore}
              aiGenerated={item.aiGenerated}
            />
          ))}
        </TabsContent>
        
        {['twitter', 'instagram', 'linkedin'].map(platform => (
          <TabsContent key={platform} value={platform} className="space-y-4 mt-4">
            {contents
              .filter(item => item.platform.toLowerCase() === platform)
              .map(item => (
                <ContentPreviewCard 
                  key={item.id}
                  content={item.content}
                  platform={item.platform}
                  engagementScore={item.engagementScore}
                  aiGenerated={item.aiGenerated}
                />
              ))
            }
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 