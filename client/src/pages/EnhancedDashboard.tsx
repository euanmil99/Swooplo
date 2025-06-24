import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  MousePointer, 
  Target,
  Download,
  RefreshCw,
  Settings,
  BarChart3,
  Bell,
  Smartphone,
  MessageSquare,
  Zap
} from 'lucide-react';

// Import all the enhanced components
import ContentEnhancementDashboard from '../components/ContentEnhancementDashboard';
import TopicClusterGraph from '../components/seo/TopicClusterGraph';
import CampaignPerformance from '../components/analytics/CampaignPerformance';
import NotificationCenter from '../components/notifications/NotificationCenter';
import MobilePreviewTool from '../components/MobilePreviewTool';

// Import existing components
import ContentPreviewCard from '../components/ContentPreviewCard';
import RevenueDashboard from '../components/RevenueDashboard';
import NotificationHub from '../components/NotificationHub';

export default function EnhancedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for overview metrics
  const overviewMetrics = [
    {
      title: 'Total Revenue',
      value: '$14,593.25',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Conversion Rate',
      value: '4.3%',
      change: '+0.5%',
      trend: 'up',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      title: 'Total Clicks',
      value: '12,450',
      change: '+8.7%',
      trend: 'up',
      icon: MousePointer,
      color: 'text-purple-600'
    },
    {
      title: 'Active Campaigns',
      value: '8',
      change: '+2',
      trend: 'up',
      icon: BarChart3,
      color: 'text-orange-600'
    }
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    // Export functionality
    console.log('Exporting dashboard data...');
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className={`flex items-center text-xs ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {metric.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Zap className="h-6 w-6 mb-2" />
              <span className="text-sm">Generate Content</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="text-sm">View Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Bell className="h-6 w-6 mb-2" />
              <span className="text-sm">Notifications</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Smartphone className="h-6 w-6 mb-2" />
              <span className="text-sm">Preview Content</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ContentPreviewCard
                content="🚀 Ready to boost your marketing game? Here are 5 proven strategies that actually work!"
                platform="Twitter"
                engagementScore={85}
              />
              <ContentPreviewCard
                content="Grow your business with these 7 affiliate marketing strategies that are working in 2023."
                platform="Instagram"
                engagementScore={72}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Revenue milestone reached!</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Content needs approval</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Low engagement alert</p>
                  <p className="text-xs text-gray-500">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
      <ContentEnhancementDashboard />
    </div>
  );

  const renderSEOTab = () => (
    <div className="space-y-6">
      <TopicClusterGraph />
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <CampaignPerformance />
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <NotificationCenter />
    </div>
  );

  const renderPreviewTab = () => (
    <div className="space-y-6">
      <MobilePreviewTool />
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Dashboard</h1>
          <p className="text-gray-600">Comprehensive overview of your affiliate marketing performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            {renderOverviewTab()}
          </TabsContent>
          
          <TabsContent value="content">
            {renderContentTab()}
          </TabsContent>
          
          <TabsContent value="seo">
            {renderSEOTab()}
          </TabsContent>
          
          <TabsContent value="analytics">
            {renderAnalyticsTab()}
          </TabsContent>
          
          <TabsContent value="notifications">
            {renderNotificationsTab()}
          </TabsContent>
          
          <TabsContent value="preview">
            {renderPreviewTab()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 