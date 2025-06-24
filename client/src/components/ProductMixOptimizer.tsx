import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Loader2, CheckCircle, XCircle, TrendingUp, BarChart3, Target, Zap, Star } from 'lucide-react';

interface ProductMixOptions {
  strategy: 'balanced' | 'high_commission' | 'high_conversion';
  productCount: number;
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  minCommissionRate?: number;
  maxCommissionRate?: number;
}

interface ProductMixResult {
  recommendationId: string;
  strategy: string;
  products: ProductWithMetrics[];
  totalEstimatedRevenue: number;
  averageCommissionRate: number;
  averageConversionRate: number;
  riskScore: number;
}

interface ProductWithMetrics {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  commissionRate: number;
  conversionRate: number;
  gravity?: number;
  imageUrl?: string;
  productUrl: string;
  estimatedEPC: number;
  riskAdjustedValue: number;
  performanceScore: number;
}

interface ProductPerformanceAnalysis {
  product: any;
  metrics: {
    clicks: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
    averageOrderValue: number;
    epc: number;
    roi: number;
  };
  recommendations: string[];
  performanceTier: 'excellent' | 'good' | 'average' | 'poor';
}

interface Category {
  id: string;
  name: string;
  productCount: number;
}

export function ProductMixOptimizer() {
  const [options, setOptions] = useState<ProductMixOptions>({
    strategy: 'balanced',
    productCount: 10,
    categories: [],
    minPrice: undefined,
    maxPrice: undefined,
    minCommissionRate: undefined,
    maxCommissionRate: undefined
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [performance, setPerformance] = useState<ProductPerformanceAnalysis[]>([]);
  const [recommendation, setRecommendation] = useState<ProductMixResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadPerformance();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/affiliate/categories', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/diversification/product-strategy/analysis', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPerformance(data.data || []);
      }
    } catch (error) {
      console.error('Error loading performance:', error);
      setError('Failed to load product performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMix = async () => {
    try {
      setGenerating(true);
      setError('');

      const response = await fetch('/api/diversification/product-strategy/mix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(options)
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendation(data.data);
        setSuccess('Product mix generated successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to generate product mix');
      }
    } catch (error) {
      console.error('Error generating product mix:', error);
      setError('Failed to generate product mix');
    } finally {
      setGenerating(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setOptions(prev => ({
      ...prev,
      categories: prev.categories?.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...(prev.categories || []), categoryId]
    }));
  };

  const getPerformanceTierColor = (tier: string) => {
    switch (tier) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'average':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 25) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    if (score <= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Mix Optimization</h2>
          <p className="text-gray-600">Optimize your product portfolio for maximum revenue</p>
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

      <Tabs defaultValue="optimizer" className="space-y-4">
        <TabsList>
          <TabsTrigger value="optimizer">Mix Optimizer</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="optimizer" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Settings</CardTitle>
                <CardDescription>
                  Configure your product mix strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Optimization Strategy</label>
                  <Select value={options.strategy} onValueChange={(value) => setOptions(prev => ({ ...prev, strategy: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4" />
                          <span>Balanced (Recommended)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high_commission">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>High Commission</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high_conversion">
                        <div className="flex items-center space-x-2">
                          <Zap className="w-4 h-4" />
                          <span>High Conversion</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Number of Products: {options.productCount}
                  </label>
                  <Slider
                    value={[options.productCount]}
                    onValueChange={([value]) => setOptions(prev => ({ ...prev, productCount: value }))}
                    max={50}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Categories (Optional)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.id}
                          checked={options.categories?.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <label htmlFor={category.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {category.name} ({category.productCount})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min Price</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={options.minPrice || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, minPrice: e.target.value ? Number(e.target.value) : undefined }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Price</label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={options.maxPrice || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, maxPrice: e.target.value ? Number(e.target.value) : undefined }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min Commission (%)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={options.minCommissionRate || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, minCommissionRate: e.target.value ? Number(e.target.value) : undefined }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Commission (%)</label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={options.maxCommissionRate || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, maxCommissionRate: e.target.value ? Number(e.target.value) : undefined }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateMix} 
                  disabled={generating}
                  className="w-full"
                >
                  {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Generate Optimized Product Mix
                </Button>
              </CardContent>
            </Card>

            {recommendation && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Product Mix</CardTitle>
                  <CardDescription>
                    Strategy: {recommendation.strategy === 'balanced' ? 'Balanced' : 
                              recommendation.strategy === 'high_commission' ? 'High Commission' : 'High Conversion'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ${recommendation.totalEstimatedRevenue.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-600">Est. Revenue</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {recommendation.averageCommissionRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-600">Avg Commission</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {(recommendation.averageConversionRate * 100).toFixed(2)}%
                      </div>
                      <div className="text-sm text-purple-600">Avg Conversion</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className={`text-2xl font-bold ${getRiskScoreColor(recommendation.riskScore)}`}>
                        {recommendation.riskScore}
                      </div>
                      <div className="text-sm text-orange-600">Risk Score</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Products</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recommendation.products.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-gray-500">
                              ${product.price} • {product.commissionRate}% • Est. EPC: ${product.estimatedEPC.toFixed(2)}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {product.performanceScore}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : performance.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No performance data available</p>
                  <p className="text-sm text-gray-400">Start promoting products to see performance analytics</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {performance.map((item) => (
                <Card key={item.product.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.product.name}</CardTitle>
                      <Badge className={getPerformanceTierColor(item.performanceTier)}>
                        {item.performanceTier.charAt(0).toUpperCase() + item.performanceTier.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>{item.product.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{item.metrics.clicks}</div>
                        <div className="text-sm text-gray-500">Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{item.metrics.conversions}</div>
                        <div className="text-sm text-gray-500">Conversions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">${item.metrics.revenue.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">${item.metrics.epc.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">EPC</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{(item.metrics.conversionRate * 100).toFixed(2)}%</div>
                        <div className="text-sm text-gray-500">Conversion Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">${item.metrics.averageOrderValue.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">Avg Order Value</div>
                      </div>
                    </div>

                    {item.recommendations.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Recommendations:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {item.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start">
                              <Star className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Tips</CardTitle>
              <CardDescription>
                Best practices for product mix optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Balanced Strategy</h4>
                    <p className="text-sm text-gray-600">
                      Mix high-commission products with high-conversion products for optimal revenue.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">High Commission Strategy</h4>
                    <p className="text-sm text-gray-600">
                      Focus on products with 20%+ commission rates for maximum earnings per sale.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">High Conversion Strategy</h4>
                    <p className="text-sm text-gray-600">
                      Prioritize products with proven conversion rates for consistent revenue.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <BarChart3 className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Performance Monitoring</h4>
                    <p className="text-sm text-gray-600">
                      Regularly analyze product performance and adjust your mix accordingly.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 