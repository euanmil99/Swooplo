import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Twitter, 
  Instagram, 
  Linkedin, 
  Facebook, 
  Youtube,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  TrendingUp,
  Copy,
  Edit
} from 'lucide-react';

export interface Platform {
  id: string;
  name: 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'tiktok' | 'youtube';
  displayName: string;
  color: string;
  bgColor: string;
}

export interface ContentPreviewProps {
  id: string;
  content: string;
  platform: Platform;
  estimatedEngagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  aiGenerated?: boolean;
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledTime?: string;
  onEdit?: (id: string) => void;
  onCopy?: (content: string) => void;
  onPublish?: (id: string) => void;
}

const PLATFORMS: Record<string, Platform> = {
  twitter: {
    id: 'twitter',
    name: 'twitter',
    displayName: 'Twitter',
    color: '#1DA1F2',
    bgColor: 'bg-blue-50'
  },
  instagram: {
    id: 'instagram',
    name: 'instagram',
    displayName: 'Instagram',
    color: '#E4405F',
    bgColor: 'bg-pink-50'
  },
  linkedin: {
    id: 'linkedin',
    name: 'linkedin',
    displayName: 'LinkedIn',
    color: '#0A66C2',
    bgColor: 'bg-blue-50'
  },
  facebook: {
    id: 'facebook',
    name: 'facebook',
    displayName: 'Facebook',
    color: '#1877F2',
    bgColor: 'bg-blue-50'
  },
  tiktok: {
    id: 'tiktok',
    name: 'tiktok',
    displayName: 'TikTok',
    color: '#000000',
    bgColor: 'bg-gray-50'
  },
  youtube: {
    id: 'youtube',
    name: 'youtube',
    displayName: 'YouTube',
    color: '#FF0000',
    bgColor: 'bg-red-50'
  }
};

const getPlatformIcon = (platformName: string) => {
  switch (platformName) {
    case 'twitter':
      return <Twitter className="w-4 h-4" />;
    case 'instagram':
      return <Instagram className="w-4 h-4" />;
    case 'linkedin':
      return <Linkedin className="w-4 h-4" />;
    case 'facebook':
      return <Facebook className="w-4 h-4" />;
    case 'youtube':
      return <Youtube className="w-4 h-4" />;
    default:
      return <Twitter className="w-4 h-4" />;
  }
};

const getStatusBadge = (status?: string) => {
  switch (status) {
    case 'published':
      return <Badge variant="default" className="bg-green-100 text-green-800">Published</Badge>;
    case 'scheduled':
      return <Badge variant="secondary">Scheduled</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
};

export function ContentPreviewCard({ 
  id,
  content, 
  platform, 
  estimatedEngagement, 
  aiGenerated = false,
  status = 'draft',
  scheduledTime,
  onEdit,
  onCopy,
  onPublish
}: ContentPreviewProps) {
  // Calculate engagement score (1-10)
  const engagementScore = Math.min(10, Math.ceil(
    (estimatedEngagement.likes + 
     estimatedEngagement.comments * 2 + 
     estimatedEngagement.shares * 3) / 10
  ));

  const getEngagementColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    if (score >= 4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(content);
    } else {
      navigator.clipboard.writeText(content);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(id);
    }
  };

  const handlePublish = () => {
    if (onPublish) {
      onPublish(id);
    }
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Platform Header */}
      <div 
        className="p-3 flex items-center justify-between"
        style={{ backgroundColor: platform.bgColor }}
      >
        <div className="flex items-center space-x-2">
          <div 
            className="p-1 rounded-full"
            style={{ backgroundColor: platform.color }}
          >
            {getPlatformIcon(platform.name)}
          </div>
          <span className="font-medium text-sm">{platform.displayName}</span>
          {aiGenerated && (
            <Badge variant="outline" className="text-xs">
              AI Generated
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusBadge(status)}
          <Badge className={getEngagementColor(engagementScore)}>
            {engagementScore}/10
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="space-y-3">
          <p className="text-sm leading-relaxed line-clamp-4">
            {content}
          </p>

          {/* Engagement Metrics */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>{estimatedEngagement.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-3 h-3" />
                <span>{estimatedEngagement.comments}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Share2 className="w-3 h-3" />
                <span>{estimatedEngagement.shares}</span>
              </div>
              {estimatedEngagement.views && (
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{estimatedEngagement.views}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Est. Reach</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEdit}
                className="h-8 px-2"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopy}
                className="h-8 px-2"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
            
            {status === 'draft' && (
              <Button 
                size="sm"
                onClick={handlePublish}
                className="h-8 px-3"
              >
                Publish
              </Button>
            )}
          </div>

          {/* Scheduled Time */}
          {scheduledTime && status === 'scheduled' && (
            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              Scheduled for {new Date(scheduledTime).toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 