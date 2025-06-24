import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  RotateCw, 
  Share2, 
  Download,
  Eye,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface DeviceConfig {
  name: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  scale: number;
}

interface ContentPreview {
  id: string;
  platform: string;
  content: string;
  image?: string;
  hashtags?: string[];
  engagement?: number;
}

const deviceConfigs: DeviceConfig[] = [
  {
    name: 'iPhone 14',
    width: 390,
    height: 844,
    icon: <Smartphone className="h-5 w-5" />,
    scale: 0.8
  },
  {
    name: 'iPhone 14 Plus',
    width: 428,
    height: 926,
    icon: <Smartphone className="h-5 w-5" />,
    scale: 0.75
  },
  {
    name: 'iPad',
    width: 768,
    height: 1024,
    icon: <Tablet className="h-5 w-5" />,
    scale: 0.6
  },
  {
    name: 'Desktop',
    width: 1200,
    height: 800,
    icon: <Monitor className="h-5 w-5" />,
    scale: 0.4
  }
];

const ContentPreviewFrame = ({ 
  content, 
  device, 
  orientation = 'portrait',
  showEngagement = true 
}: {
  content: ContentPreview;
  device: DeviceConfig;
  orientation?: 'portrait' | 'landscape';
  showEngagement?: boolean;
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const frameWidth = orientation === 'landscape' ? device.height : device.width;
  const frameHeight = orientation === 'landscape' ? device.width : device.height;
  const scaledWidth = frameWidth * device.scale;
  const scaledHeight = frameHeight * device.scale;

  const getPlatformStyles = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return {
          background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
          color: 'white'
        };
      case 'twitter':
        return {
          backgroundColor: '#1DA1F2',
          color: 'white'
        };
      case 'linkedin':
        return {
          backgroundColor: '#0A66C2',
          color: 'white'
        };
      case 'facebook':
        return {
          backgroundColor: '#1877F2',
          color: 'white'
        };
      default:
        return {
          backgroundColor: '#f8f9fa',
          color: '#333'
        };
    }
  };

  const platformStyles = getPlatformStyles(content.platform);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    // Create a canvas and download the preview as image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      
      // Draw background
      ctx.fillStyle = platformStyles.backgroundColor as string;
      ctx.fillRect(0, 0, frameWidth, frameHeight);
      
      // Draw content
      ctx.fillStyle = platformStyles.color as string;
      ctx.font = '16px Arial';
      ctx.fillText(content.content, 20, 40);
      
      // Download
      const link = document.createElement('a');
      link.download = `${content.platform}-preview.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const previewContent = (
    <div
      className="relative border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg"
      style={{
        width: isFullscreen ? '100vw' : scaledWidth,
        height: isFullscreen ? '100vh' : scaledHeight,
        maxWidth: isFullscreen ? 'none' : '100%',
        maxHeight: isFullscreen ? 'none' : '80vh'
      }}
    >
      {/* Device frame */}
      <div
        className="w-full h-full flex flex-col"
        style={platformStyles}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/20">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div className="text-sm font-medium">{content.platform}</div>
          <div className="w-6 h-6"></div>
        </div>

        {/* Content area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {content.image && (
            <div className="mb-4">
              <div 
                className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center"
                style={{ backgroundImage: `url(${content.image})`, backgroundSize: 'cover' }}
              >
                {!content.image.startsWith('http') && (
                  <span className="text-gray-500">Image Preview</span>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{content.content}</p>
            
            {content.hashtags && content.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {content.hashtags.map((tag, index) => (
                  <span key={index} className="text-xs opacity-80">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer with engagement */}
        {showEngagement && content.engagement && (
          <div className="p-3 border-t border-white/20">
            <div className="flex items-center justify-between text-sm">
              <span>Estimated Engagement</span>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {content.engagement}%
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Controls overlay */}
      <div className="absolute top-2 right-2 flex space-x-1">
        <Button
          size="sm"
          variant="secondary"
          className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
          onClick={handleFullscreen}
        >
          {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
          onClick={handleDownload}
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
        <div className="relative">
          {previewContent}
          <Button
            className="absolute top-4 left-4"
            variant="secondary"
            onClick={handleFullscreen}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return previewContent;
};

export default function MobilePreviewTool() {
  const [selectedDevice, setSelectedDevice] = useState<DeviceConfig>(deviceConfigs[0]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showEngagement, setShowEngagement] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentPreview | null>(null);

  // Mock content data
  const mockContents: ContentPreview[] = [
    {
      id: '1',
      platform: 'Instagram',
      content: '🚀 Ready to boost your marketing game? Here are 5 proven strategies that actually work! From content optimization to audience targeting, these tactics will transform your results.',
      hashtags: ['marketing', 'growthhacking', 'strategy', 'business'],
      engagement: 85
    },
    {
      id: '2',
      platform: 'Twitter',
      content: 'Grow your business with these 7 affiliate marketing strategies that are working in 2023. From niche selection to conversion optimization, discover what\'s driving real results.',
      hashtags: ['affiliatemarketing', 'growthhacking', 'digitalmarketing'],
      engagement: 72
    },
    {
      id: '3',
      platform: 'LinkedIn',
      content: 'Is your content strategy driving results? Learn how to optimize your approach with data-driven insights. Understanding your audience and measuring performance is key to sustainable growth.',
      engagement: 65
    },
    {
      id: '4',
      platform: 'Facebook',
      content: 'Double your conversion rate with these proven optimization techniques. From landing page design to email sequences, every detail matters.',
      hashtags: ['marketing', 'optimization', 'results', 'conversion'],
      engagement: 91
    }
  ];

  const handleDeviceChange = (device: DeviceConfig) => {
    setSelectedDevice(device);
  };

  const handleOrientationChange = () => {
    setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait');
  };

  const handleContentSelect = (content: ContentPreview) => {
    setSelectedContent(content);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Mobile Preview Tool</h2>
          <p className="text-gray-600">Preview your content across different devices and orientations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOrientationChange}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
          </Button>
          <Button
            variant={showEngagement ? "default" : "outline"}
            size="sm"
            onClick={() => setShowEngagement(!showEngagement)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Engagement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deviceConfigs.map((device) => (
                  <Button
                    key={device.name}
                    variant={selectedDevice.name === device.name ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleDeviceChange(device)}
                  >
                    {device.icon}
                    <span className="ml-2">{device.name}</span>
                    <span className="ml-auto text-xs opacity-70">
                      {device.width}×{device.height}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockContents.map((content) => (
                  <div
                    key={content.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedContent?.id === content.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleContentSelect(content)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{content.platform}</span>
                      {content.engagement && (
                        <Badge variant="secondary" className="text-xs">
                          {content.engagement}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {content.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Preview: {selectedDevice.name} ({orientation})
                </CardTitle>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{selectedDevice.width}×{selectedDevice.height}</span>
                  <span>•</span>
                  <span>{Math.round(selectedDevice.scale * 100)}% scale</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                {selectedContent ? (
                  <ContentPreviewFrame
                    content={selectedContent}
                    device={selectedDevice}
                    orientation={orientation}
                    showEngagement={showEngagement}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select content to preview</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 