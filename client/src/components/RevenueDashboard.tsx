import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  MousePointer, 
  Target,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

export interface RevenueData {
  platforms: {
    name: string;
    revenue: number;
    growth: number;
    conversions: number;
    clicks: number;
    ctr: number;
  }[];
  daily: {
    date: string;
    revenue: number;
    clicks: number;
    conversions: number;
  }[];
  campaigns: {
    name: string;
    revenue: number;
    roi: number;
    clicks: number;
    conversions: number;
    status: 'active' | 'paused' | 'completed';
  }[];
  funnel: {
    stage: string;
    value: number;
    conversionRate: number;
  }[];
  abTests: {
    name: string;
    variants: {
      name: string;
      clicks: number;
      conversions: number;
      revenue: number;
      conversionRate: number;
    }[];
  }[];
}

interface RevenueDashboardProps {
  data: RevenueData;
  onRefresh?: () => void;
  onExport?: () => void;
}

// Simple chart components (you can replace with a proper charting library)
const LineChart = ({ data, xKey, yKey, color = "#4ECDC4" }: any) => {
  const maxValue = Math.max(...data.map((d: any) => d[yKey]));
  const minValue = Math.min(...data.map((d: any) => d[yKey]));
  const range = maxValue - minValue;

  return (
    <div className="w-full h-64 flex items-end justify-between space-x-1">
      {data.map((item: any, index: number) => {
        const height = range > 0 ? ((item[yKey] - minValue) / range) * 100 : 0;
        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t"
              style={{
                height: `${Math.max(height, 2)}%`,
                backgroundColor: color,
                minHeight: '2px'
              }}
            />
            <div className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
              {new Date(item[xKey]).toLocaleDateString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BarChart = ({ data, xKey, yKey, color = "#FF6B6B" }: any) => {
  const maxValue = Math.max(...data.map((d: any) => d[yKey]));

  return (
    <div className="w-full h-64 flex items-end justify-between space-x-2">
      {data.map((item: any, index: number) => {
        const height = maxValue > 0 ? (item[yKey] / maxValue) * 100 : 0;
        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t"
              style={{
                height: `${Math.max(height, 2)}%`,
                backgroundColor: color,
                minHeight: '2px'
              }}
            />
            <div className="text-xs text-gray-500 mt-1 text-center">
              {item[xKey].length > 10 ? item[xKey].substring(0, 10) + '...' : item[xKey]}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ConversionFunnel = ({ stages }: { stages: { name: string; value: number }[] }) => {
  const maxValue = Math.max(...stages.map(s => s.value));

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
        const conversionRate = index > 0 ? (stage.value / stages[index - 1].value) * 100 : 100;
        
        return (
          <div key={stage.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{stage.name}</span>
              <span className="text-sm text-gray-500">
                {stage.value.toLocaleString()} 
                {index > 0 && (
                  <span className="ml-2 text-xs">
                    ({conversionRate.toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ABTestComparison = ({ tests }: { tests: any[] }) => {
  return (
    <div className="space-y-6">
      {tests.map((test, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg">{test.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {test.variants.map((variant: any, vIndex: number) => (
                <div key={vIndex} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Variant {variant.name}</h4>
                    <Badge variant={vIndex === 0 ? "default" : "secondary"}>
                      {vIndex === 0 ? "Control" : "Test"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Clicks:</span>
                      <span className="ml-2 font-medium">{variant.clicks}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Conversions:</span>
                      <span className="ml-2 font-medium">{variant.conversions}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Revenue:</span>
                      <span className="ml-2 font-medium">${variant.revenue}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Conv. Rate:</span>
                      <span className="ml-2 font-medium">{(variant.conversionRate * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export function RevenueDashboard({ data, onRefresh, onExport }: RevenueDashboardProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const totalRevenue = data.platforms.reduce((sum, p) => sum + p.revenue, 0);
  const totalConversions = data.platforms.reduce((sum, p) => sum + p.conversions, 0);
  const totalClicks = data.platforms.reduce((sum, p) => sum + p.clicks, 0);
  const averageROI = data.campaigns.reduce((sum, c) => sum + c.roi, 0) / data.campaigns.length;

  const filteredPlatforms = selectedPlatform 
    ? data.platforms.filter(p => p.name === selectedPlatform)
    : data.platforms;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Revenue Dashboard</h2>
          <p className="text-gray-600">Track your affiliate marketing performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              {((totalConversions / totalClicks) * 100).toFixed(2)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageROI.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlatforms.map((platform) => (
          <Card key={platform.name}>
            <CardHeader>
              <CardTitle className="text-lg">{platform.name}</CardTitle>
              <CardDescription>
                Revenue: ${platform.revenue.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Growth:</span>
                <span className={`flex items-center ${platform.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {platform.growth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(platform.growth)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Conversions:</span>
                <span>{platform.conversions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>CTR:</span>
                <span>{(platform.ctr * 100).toFixed(2)}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">
            <BarChart3 className="w-4 h-4 mr-2" />
            Revenue Over Time
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Activity className="w-4 h-4 mr-2" />
            Campaign Performance
          </TabsTrigger>
          <TabsTrigger value="funnel">
            <PieChart className="w-4 h-4 mr-2" />
            Conversion Funnel
          </TabsTrigger>
          <TabsTrigger value="ab">
            <Target className="w-4 h-4 mr-2" />
            A/B Test Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>
                Daily revenue trends for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart 
                data={data.daily} 
                xKey="date" 
                yKey="revenue" 
                color="#4ECDC4" 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Revenue and ROI by campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart 
                data={data.campaigns} 
                xKey="name" 
                yKey="revenue" 
                color="#FF6B6B" 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                Track user journey from impression to purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConversionFunnel 
                stages={[
                  { name: "Impressions", value: 10000 },
                  { name: "Clicks", value: 1500 },
                  { name: "Page Views", value: 1200 },
                  { name: "Add to Cart", value: 400 },
                  { name: "Purchase", value: 120 }
                ]} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ab">
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Results</CardTitle>
              <CardDescription>
                Compare variant performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ABTestComparison 
                tests={data.abTests}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 