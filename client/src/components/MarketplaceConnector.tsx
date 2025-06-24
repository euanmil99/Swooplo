import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle, XCircle, RefreshCw, Plus, Trash2 } from 'lucide-react';

interface Marketplace {
  id: string;
  name: string;
  type: string;
  url: string;
  commissionRange: string;
  minPayout: string;
  features: string[];
  requiredFields: {
    name: string;
    type: string;
    label: string;
    required: boolean;
  }[];
}

interface MarketplaceConnection {
  id: string;
  network: string;
  networkId?: string;
  isActive: boolean;
  commissionRate: number;
  totalEarnings: number;
  lastSyncAt?: string;
  metadata?: any;
}

interface MarketplaceStats {
  totalConnected: number;
  activeConnections: number;
  totalEarnings: number;
  averageCommissionRate: number;
  lastSync?: string;
}

const MARKETPLACES: Marketplace[] = [
  {
    id: 'amazon',
    name: 'Amazon Associates',
    type: 'ecommerce',
    url: 'https://affiliate-program.amazon.com/',
    commissionRange: '1-10%',
    minPayout: '$10',
    features: ['Product linking', 'SiteStripe toolbar', 'Performance reports', 'API integration'],
    requiredFields: [
      { name: 'accessToken', type: 'text', label: 'Access Token', required: true },
      { name: 'trackingId', type: 'text', label: 'Tracking ID', required: true }
    ]
  },
  {
    id: 'clickbank',
    name: 'ClickBank',
    type: 'digital',
    url: 'https://www.clickbank.com/',
    commissionRange: '5-75%',
    minPayout: '$50',
    features: ['Digital products', 'Online courses', 'High commission rates', 'Real-time tracking'],
    requiredFields: [
      { name: 'apiKey', type: 'text', label: 'API Key', required: true },
      { name: 'apiSecret', type: 'password', label: 'API Secret', required: true }
    ]
  },
  {
    id: 'shareasale',
    name: 'ShareASale',
    type: 'network',
    url: 'https://www.shareasale.com/',
    commissionRange: '5-30%',
    minPayout: '$50',
    features: ['Affiliate network', 'Multiple merchants', 'Creative assets'],
    requiredFields: [
      { name: 'apiKey', type: 'text', label: 'API Key', required: true },
      { name: 'token', type: 'text', label: 'Token', required: true }
    ]
  },
  {
    id: 'commissionjunction',
    name: 'Commission Junction (CJ)',
    type: 'network',
    url: 'https://www.cj.com/',
    commissionRange: '3-25%',
    minPayout: '$50',
    features: ['Performance marketing', 'Brand partnerships', 'Advanced reporting'],
    requiredFields: [
      { name: 'apiKey', type: 'text', label: 'API Key', required: true },
      { name: 'websiteId', type: 'text', label: 'Website ID', required: true }
    ]
  },
  {
    id: 'rakuten',
    name: 'Rakuten Marketing',
    type: 'network',
    url: 'https://rakutenmarketing.com/',
    commissionRange: '1-15%',
    minPayout: '$50',
    features: ['Global platform', 'Brand partnerships', 'Performance tracking'],
    requiredFields: [
      { name: 'apiKey', type: 'text', label: 'API Key', required: true },
      { name: 'networkId', type: 'text', label: 'Network ID', required: true }
    ]
  },
  {
    id: 'awin',
    name: 'Awin',
    type: 'network',
    url: 'https://www.awin.com/',
    commissionRange: '3-20%',
    minPayout: '$20',
    features: ['Global network', 'Multiple currencies', 'Advanced analytics'],
    requiredFields: [
      { name: 'apiKey', type: 'text', label: 'API Key', required: true },
      { name: 'publisherId', type: 'text', label: 'Publisher ID', required: true }
    ]
  }
];

export function MarketplaceConnector() {
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [connections, setConnections] = useState<MarketplaceConnection[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load initial data
  useEffect(() => {
    loadConnections();
    loadStats();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/diversification/marketplace/connections', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConnections(data.data || []);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      setError('Failed to load marketplace connections');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/diversification/marketplace/stats', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleConnect = async () => {
    if (!selectedMarketplace) {
      setError('Please select a marketplace');
      return;
    }

    const marketplace = MARKETPLACES.find(m => m.id === selectedMarketplace);
    if (!marketplace) {
      setError('Invalid marketplace selected');
      return;
    }

    // Validate required fields
    const missingFields = marketplace.requiredFields
      .filter(field => field.required && !credentials[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/diversification/marketplace/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          network: selectedMarketplace,
          credentials
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.data.message);
        setSelectedMarketplace('');
        setCredentials({});
        loadConnections();
        loadStats();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to connect marketplace');
      }
    } catch (error) {
      console.error('Error connecting marketplace:', error);
      setError('Failed to connect marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (network: string) => {
    try {
      setSyncing(prev => ({ ...prev, [network]: true }));
      setError('');

      const response = await fetch('/api/diversification/marketplace/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ network })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        loadConnections();
        loadStats();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to sync marketplace');
      }
    } catch (error) {
      console.error('Error syncing marketplace:', error);
      setError('Failed to sync marketplace');
    } finally {
      setSyncing(prev => ({ ...prev, [network]: false }));
    }
  };

  const handleDisconnect = async (network: string) => {
    if (!confirm(`Are you sure you want to disconnect from ${network}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/diversification/marketplace/disconnect/${network}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess(`Disconnected from ${network}`);
        loadConnections();
        loadStats();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to disconnect marketplace');
      }
    } catch (error) {
      console.error('Error disconnecting marketplace:', error);
      setError('Failed to disconnect marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const getMarketplaceInfo = (networkId: string) => {
    return MARKETPLACES.find(m => m.id === networkId);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketplace Connections</h2>
          <p className="text-gray-600">Connect and manage your affiliate marketplace accounts</p>
        </div>
        <Button onClick={() => setSelectedMarketplace('')} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Marketplace
        </Button>
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connect">Connect New</TabsTrigger>
          <TabsTrigger value="manage">Manage Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Connected</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalConnected}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeConnections} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <span className="text-green-600">$</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg commission: {stats.averageCommissionRate.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.lastSync ? formatDate(stats.lastSync) : 'Never'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Products synced
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <Badge variant={stats.activeConnections > 0 ? "default" : "secondary"}>
                    {stats.activeConnections > 0 ? 'Active' : 'Inactive'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeConnections}</div>
                  <p className="text-xs text-muted-foreground">
                    Active connections
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="connect" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connect New Marketplace</CardTitle>
              <CardDescription>
                Add a new affiliate marketplace to expand your income sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Marketplace</label>
                <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a marketplace" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETPLACES.map((marketplace) => (
                      <SelectItem key={marketplace.id} value={marketplace.id}>
                        <div className="flex items-center space-x-2">
                          <span>{marketplace.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {marketplace.commissionRange}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMarketplace && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">
                      {getMarketplaceInfo(selectedMarketplace)?.name}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Commission: {getMarketplaceInfo(selectedMarketplace)?.commissionRange}</p>
                      <p>Min Payout: {getMarketplaceInfo(selectedMarketplace)?.minPayout}</p>
                      <p>Features: {getMarketplaceInfo(selectedMarketplace)?.features.join(', ')}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {getMarketplaceInfo(selectedMarketplace)?.requiredFields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <label className="text-sm font-medium">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <Input
                          type={field.type}
                          value={credentials[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          placeholder={`Enter your ${field.label.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handleConnect} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Connect Marketplace
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : connections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">No marketplace connections yet</p>
                  <Button onClick={() => setSelectedMarketplace('')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Your First Marketplace
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((connection) => {
                const marketplaceInfo = getMarketplaceInfo(connection.network);
                return (
                  <Card key={connection.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{marketplaceInfo?.name || connection.network}</CardTitle>
                        <Badge variant={connection.isActive ? "default" : "secondary"}>
                          {connection.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <CardDescription>
                        Commission: {connection.commissionRate.toFixed(1)}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Earnings:</span>
                          <span className="font-medium">${connection.totalEarnings.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Last Sync:</span>
                          <span>{formatDate(connection.lastSyncAt)}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(connection.network)}
                          disabled={syncing[connection.network]}
                          className="flex-1"
                        >
                          {syncing[connection.network] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(connection.network)}
                          disabled={loading}
                        >
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
      </Tabs>
    </div>
  );
} 