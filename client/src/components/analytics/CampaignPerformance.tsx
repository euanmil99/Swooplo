import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TrendingUp, TrendingDown, DollarSign, Users, MousePointer, Target } from 'lucide-react';

// Simple chart components (fallback if Recharts is not available)
const SimpleBarChart = ({ data, xKey, yKey, color = "#4ECDC4" }: any) => {
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

const SimpleLineChart = ({ data, xKey, yKey, color = "#FF6B6B" }: any) => {
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

// Revenue Dashboard
const RevenueDashboard = () => {
  // Mock data - replace with actual API calls
  const revenueData = [
    { name: 'Jan', twitter: 4000, instagram: 2400, linkedin: 1800, total: 8200 },
    { name: 'Feb', twitter: 3000, instagram: 1398, linkedin: 2300, total: 6698 },
    { name: 'Mar', twitter: 2000, instagram: 9800, linkedin: 2290, total: 14090 },
    { name: 'Apr', twitter: 2780, instagram: 3908, linkedin: 2000, total: 8688 },
    { name: 'May', twitter: 1890, instagram: 4800, linkedin: 2181, total: 8871 },
    { name: 'Jun', twitter: 2390, instagram: 3800, linkedin: 2500, total: 8690 },
    { name: 'Jul', twitter: 3490, instagram: 4300, linkedin: 2100, total: 9890 },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Revenue by Platform</CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleBarChart 
          data={revenueData} 
          xKey="name" 
          yKey="total" 
          color="#4ECDC4" 
        />
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-500">
              ${revenueData.reduce((sum, d) => sum + d.twitter, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Twitter Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-pink-500">
              ${revenueData.reduce((sum, d) => sum + d.instagram, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Instagram Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              ${revenueData.reduce((sum, d) => sum + d.linkedin, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">LinkedIn Revenue</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Conversion Funnel
const ConversionFunnel = () => {
  // Mock data - replace with actual API calls
  const funnelData = [
    { name: 'Impressions', value: 10000, color: '#0088FE' },
    { name: 'Clicks', value: 5000, color: '#00C49F' },
    { name: 'Page Views', value: 3000, color: '#FFBB28' },
    { name: 'Add to Cart', value: 1500, color: '#FF8042' },
    { name: 'Purchases', value: 500, color: '#8884d8' },
  ];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelData.map((stage, index) => {
            const width = (stage.value / funnelData[0].value) * 100;
            const conversionRate = index > 0 ? (stage.value / funnelData[index - 1].value) * 100 : 100;
            
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
                    className="h-4 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${width}%`,
                      backgroundColor: stage.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-5 gap-2 mt-6 text-center text-sm">
          {funnelData.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="text-xs opacity-70">{step.name}</div>
              <div className="font-bold">{step.value.toLocaleString()}</div>
              {index < funnelData.length - 1 && (
                <div className="text-xs opacity-70">
                  {((funnelData[index + 1].value / step.value) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// A/B Test Results
const ABTestResults = () => {
  // Mock data - replace with actual API calls
  const abTestData = [
    { name: 'Version A', clicks: 1200, conversions: 120, ctr: 10.0, revenue: 2400 },
    { name: 'Version B', clicks: 1350, conversions: 148, ctr: 11.0, revenue: 2960 },
  ];
  
  const winner = abTestData.reduce((prev, current) => 
    (prev.ctr > current.ctr) ? prev : current
  );
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>A/B Test Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {abTestData.map((version, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${
                version.name === winner.name 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">{version.name}</h3>
                {version.name === winner.name && (
                  <Badge className="bg-green-100 text-green-800">
                    Winner
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Clicks:</span>
                  <span className="font-medium">{version.clicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Conversions:</span>
                  <span className="font-medium">{version.conversions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CTR:</span>
                  <span className="font-medium">{version.ctr.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Revenue:</span>
                  <span className="font-medium">${version.revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold mb-2">Statistical Analysis</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Confidence Level:</strong> 95%</p>
            <p><strong>Improvement:</strong> {((winner.ctr / abTestData[0].ctr - 1) * 100).toFixed(1)}% better than Version A</p>
            <p><strong>Recommendation:</strong> Direct more traffic to {winner.name}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Campaign Performance Overview
const PerformanceOverview = () => {
  const [timeRange, setTimeRange] = useState('30d');
  
  const performanceData = [
    { name: 'Jan 1', revenue: 125.50, clicks: 120, conversions: 8 },
    { name: 'Jan 2', revenue: 189.75, clicks: 145, conversions: 12 },
    { name: 'Jan 3', revenue: 156.25, clicks: 98, conversions: 7 },
    { name: 'Jan 4', revenue: 234.00, clicks: 167, conversions: 15 },
    { name: 'Jan 5', revenue: 298.50, clicks: 189, conversions: 19 },
    { name: 'Jan 6', revenue: 267.25, clicks: 156, conversions: 14 },
    { name: 'Jan 7', revenue: 312.75, clicks: 178, conversions: 18 }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Performance Over Time</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant={timeRange === '7d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('7d')}
            >
              7D
            </Button>
            <Button 
              variant={timeRange === '30d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('30d')}
            >
              30D
            </Button>
            <Button 
              variant={timeRange === '90d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('90d')}
            >
              90D
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <SimpleLineChart 
          data={performanceData} 
          xKey="name" 
          yKey="revenue" 
          color="#FF6B6B" 
        />
      </CardContent>
    </Card>
  );
};

export default function CampaignPerformance() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Campaign Performance</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$14,593.25</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.3%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +0.5% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$72.50</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="w-3 h-3 mr-1" />
              -2.3% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,450</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8.7% from last month
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Dashboard</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="ab">A/B Test Results</TabsTrigger>
          <TabsTrigger value="performance">Performance Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue" className="mt-4">
          <RevenueDashboard />
        </TabsContent>
        
        <TabsContent value="funnel" className="mt-4">
          <ConversionFunnel />
        </TabsContent>
        
        <TabsContent value="ab" className="mt-4">
          <ABTestResults />
        </TabsContent>
        
        <TabsContent value="performance" className="mt-4">
          <PerformanceOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
} 