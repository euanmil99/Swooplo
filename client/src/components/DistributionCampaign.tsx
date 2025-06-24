import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Loader2, CheckCircle, XCircle, Calendar, Globe, BarChart3, Play, Pause, Trash2 } from 'lucide-react';

interface DistributionPlatform {
  id: string;
  name: string;
  type: 'social' | 'forum' | 'qa' | 'review' | 'blog' | 'video';
  url: string;
  contentRequirements: {
    maxLength?: number;
    minLength?: number;
    allowedMedia?: string[];
    hashtagLimit?: number;
    mentionLimit?: number;
  };
  rateLimits: {
    postsPerHour: number;
    postsPerDay: number;
    cooldownMinutes: number;
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  commissionRate: number;
  imageUrl?: string;
  category: string;
}

interface DistributionCampaign {
  id: string;
  name: string;
  productId: string;
  content: string;
  platforms: string[];
  schedule: 'immediate' | 'scheduled';
  scheduledTime?: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  createdAt: string;
  publishedPosts?: number;
  totalViews?: number;
  totalEngagement?: number;
}

const DISTRIBUTION_PLATFORMS: DistributionPlatform[] = [
  {
    id: 'reddit',
    name: 'Reddit',
    type: 'forum',
    url: 'https://reddit.com',
    contentRequirements: {
      maxLength: 40000,
      minLength: 10,
      allowedMedia: ['image', 'video', 'link'],
      hashtagLimit: 0,
      mentionLimit: 3
    },
    rateLimits: {
      postsPerHour: 5,
      postsPerDay: 50,
      cooldownMinutes: 10
    }
  },
  {
    id: 'quora',
    name: 'Quora',
    type: 'qa',
    url: 'https://quora.com',
    contentRequirements: {
      maxLength: 100000,
      minLength: 50,
      allowedMedia: ['image', 'link'],
      hashtagLimit: 0,
      mentionLimit: 5
    },
    rateLimits: {
      postsPerHour: 3,
      postsPerDay: 20,
      cooldownMinutes: 15
    }
  },
  {
    id: 'medium',
    name: 'Medium',
    type: 'blog',
    url: 'https://medium.com',
    contentRequirements: {
      maxLength: 1000000,
      minLength: 100,
      allowedMedia: ['image', 'video', 'link'],
      hashtagLimit: 5,
      mentionLimit: 10
    },
    rateLimits: {
      postsPerHour: 2,
      postsPerDay: 10,
      cooldownMinutes: 30
    }
  },
  {
    id: 'trustpilot',
    name: 'Trustpilot',
    type: 'review',
    url: 'https://trustpilot.com',
    contentRequirements: {
      maxLength: 5000,
      minLength: 20,
      allowedMedia: ['image'],
      hashtagLimit: 0,
      mentionLimit: 0
    },
    rateLimits: {
      postsPerHour: 1,
      postsPerDay: 5,
      cooldownMinutes: 60
    }
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    type: 'qa',
    url: 'https://stackoverflow.com',
    contentRequirements: {
      maxLength: 30000,
      minLength: 30,
      allowedMedia: ['image', 'link'],
      hashtagLimit: 0,
      mentionLimit: 2
    },
    rateLimits: {
      postsPerHour: 2,
      postsPerDay: 15,
      cooldownMinutes: 20
    }
  },
  {
    id: 'youtube',
    name: 'YouTube',
    type: 'video',
    url: 'https://youtube.com',
    contentRequirements: {
      maxLength: 5000,
      minLength: 10,
      allowedMedia: ['video', 'image'],
      hashtagLimit: 15,
      mentionLimit: 5
    },
    rateLimits: {
      postsPerHour: 1,
      postsPerDay: 5,
      cooldownMinutes: 120
    }
  }
];

export function DistributionCampaign() {
  const [campaigns, setCampaigns] = useState<DistributionCampaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [platforms, setPlatforms] = useState<DistributionPlatform[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    productId: '',
    content: '',
    platforms: [] as string[],
    schedule: 'immediate' as 'immediate' | 'scheduled',
    scheduledTime: new Date().toISOString().slice(0, 16)
  });

  // Load initial data
  useEffect(() => {
    loadCampaigns();
    loadProducts();
    loadPlatforms();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/diversification/distribution/campaigns', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.data || []);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setError('Failed to load distribution campaigns');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/affiliate/products', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadPlatforms = async () => {
    try {
      const response = await fetch('/api/diversification/distribution/platforms', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlatforms(data.data || DISTRIBUTION_PLATFORMS);
      } else {
        // Fallback to static data
        setPlatforms(DISTRIBUTION_PLATFORMS);
      }
    } catch (error) {
      console.error('Error loading platforms:', error);
      setPlatforms(DISTRIBUTION_PLATFORMS);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.productId || !newCampaign.content || newCampaign.platforms.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const campaignData = {
        ...newCampaign,
        scheduledTime: newCampaign.schedule === 'scheduled' ? new Date(newCampaign.scheduledTime) : undefined
      };

      const response = await fetch('/api/diversification/distribution/campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(campaignData)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.data.message);
        resetForm();
        loadCampaigns();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError('Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setNewCampaign({
      name: '',
      productId: '',
      content: '',
      platforms: [],
      schedule: 'immediate',
      scheduledTime: new Date().toISOString().slice(0, 16)
    });
  };

  const handlePlatformToggle = (platformId: string) => {
    setNewCampaign(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(id => id !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const getPlatformInfo = (platformId: string) => {
    return platforms.find(p => p.id === platformId);
  };

  const getProductInfo = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      active: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const;

    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Pause className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Distribution Campaigns</h2>
          <p className="text-gray-600">Create and manage cross-platform content distribution</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          <TabsTrigger value="create">Create Campaign</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="text-center">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No distribution campaigns yet</p>
                  <p className="text-sm text-gray-400">Create your first campaign to start distributing content across platforms</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => {
                const product = getProductInfo(campaign.productId);
                return (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        {getStatusIcon(campaign.status)}
                      </div>
                      <CardDescription>
                        {product?.name || 'Unknown Product'}
                      </CardDescription>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(campaign.status)}
                        <span className="text-xs text-gray-500">
                          {formatDate(campaign.createdAt)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Platforms:</span>
                          <span className="font-medium">{campaign.platforms.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Published Posts:</span>
                          <span className="font-medium">{campaign.publishedPosts || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Views:</span>
                          <span className="font-medium">{campaign.totalViews || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Engagement:</span>
                          <span className="font-medium">{campaign.totalEngagement || 0}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {campaign.platforms.map(platformId => {
                          const platform = getPlatformInfo(platformId);
                          return (
                            <Badge key={platformId} variant="outline" className="text-xs">
                              {platform?.name || platformId}
                            </Badge>
                          );
                        })}
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          View Stats
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Distribution Campaign</CardTitle>
              <CardDescription>
                Distribute your content across multiple platforms simultaneously
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Name</label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter campaign name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Product</label>
                <Select value={newCampaign.productId} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, productId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product to promote" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center space-x-2">
                          <span>{product.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {product.commissionRate}%
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Content</label>
                <Textarea
                  value={newCampaign.content}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your campaign content here..."
                  rows={6}
                />
                <p className="text-xs text-gray-500">
                  {newCampaign.content.length} characters
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Distribution Platforms</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {platforms.map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform.id}
                        checked={newCampaign.platforms.includes(platform.id)}
                        onCheckedChange={() => handlePlatformToggle(platform.id)}
                      />
                      <label htmlFor={platform.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {platform.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Schedule</label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="immediate"
                      name="schedule"
                      value="immediate"
                      checked={newCampaign.schedule === 'immediate'}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, schedule: e.target.value as 'immediate' | 'scheduled' }))}
                    />
                    <label htmlFor="immediate" className="text-sm">Publish Immediately</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="scheduled"
                      name="schedule"
                      value="scheduled"
                      checked={newCampaign.schedule === 'scheduled'}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, schedule: e.target.value as 'immediate' | 'scheduled' }))}
                    />
                    <label htmlFor="scheduled" className="text-sm">Schedule for Later</label>
                  </div>
                </div>

                {newCampaign.schedule === 'scheduled' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Schedule Time</label>
                    <Input
                      type="datetime-local"
                      value={newCampaign.scheduledTime}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <Button 
                onClick={handleCreateCampaign} 
                disabled={creating}
                className="w-full"
              >
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Distribution Campaign
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 