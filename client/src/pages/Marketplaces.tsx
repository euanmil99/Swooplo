import React, { useState } from 'react';
import { 
  Plus, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';

interface Marketplace {
  id: string;
  name: string;
  description: string;
  commission: string;
  minPayout: string;
  status: 'connected' | 'pending' | 'disconnected';
  logo: string;
  category: string;
  signupUrl: string;
  apiKey?: string;
  lastSync?: string;
  earnings?: string;
  clicks?: number;
  conversions?: number;
}

const Marketplaces: React.FC = () => {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([
    {
      id: '1',
      name: 'Amazon Associates',
      description: 'World\'s largest e-commerce affiliate program',
      commission: '1-10%',
      minPayout: '$10',
      status: 'connected',
      logo: '🛒',
      category: 'E-commerce',
      signupUrl: 'https://affiliate-program.amazon.com/',
      apiKey: 'amz_****_****',
      lastSync: '2 hours ago',
      earnings: '$1,234.56',
      clicks: 1234,
      conversions: 45,
    },
    {
      id: '2',
      name: 'ClickBank',
      description: 'Digital products and online courses',
      commission: '5-75%',
      minPayout: '$50',
      status: 'connected',
      logo: '💳',
      category: 'Digital Products',
      signupUrl: 'https://www.clickbank.com/',
      apiKey: 'cb_****_****',
      lastSync: '1 hour ago',
      earnings: '$567.89',
      clicks: 890,
      conversions: 23,
    },
    {
      id: '3',
      name: 'Commission Junction',
      description: 'Performance marketing network',
      commission: '3-25%',
      minPayout: '$50',
      status: 'pending',
      logo: '🔗',
      category: 'Performance Marketing',
      signupUrl: 'https://www.cj.com/',
      lastSync: 'Pending approval',
    },
    {
      id: '4',
      name: 'ShareASale',
      description: 'Affiliate marketing network',
      commission: '5-30%',
      minPayout: '$50',
      status: 'disconnected',
      logo: '💰',
      category: 'Affiliate Network',
      signupUrl: 'https://www.shareasale.com/',
    },
    {
      id: '5',
      name: 'Rakuten Marketing',
      description: 'Global affiliate marketing platform',
      commission: '1-15%',
      minPayout: '$50',
      status: 'disconnected',
      logo: '🌐',
      category: 'Global Marketing',
      signupUrl: 'https://rakutenmarketing.com/',
    },
    {
      id: '6',
      name: 'Awin',
      description: 'Global affiliate network',
      commission: '3-20%',
      minPayout: '$20',
      status: 'disconnected',
      logo: '🎯',
      category: 'Affiliate Network',
      signupUrl: 'https://www.awin.com/',
    },
  ]);

  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleConnect = (marketplace: Marketplace) => {
    setSelectedMarketplace(marketplace);
    setShowConnectModal(true);
  };

  const handleAutoSignup = async (marketplace: Marketplace) => {
    // This would integrate with browser automation or API
    window.open(marketplace.signupUrl, '_blank');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Marketplaces</h1>
          <p className="text-gray-600">Connect and manage your affiliate partnerships</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Sync All
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Marketplace
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Connected</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">$1,802</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">3.2%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Marketplaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketplaces.map((marketplace) => (
          <div key={marketplace.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{marketplace.logo}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{marketplace.name}</h3>
                  <p className="text-sm text-gray-600">{marketplace.category}</p>
                </div>
              </div>
              {getStatusIcon(marketplace.status)}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">{marketplace.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Commission</p>
                <p className="text-sm font-medium text-gray-900">{marketplace.commission}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Min Payout</p>
                <p className="text-sm font-medium text-gray-900">{marketplace.minPayout}</p>
              </div>
            </div>

            {/* Performance (if connected) */}
            {marketplace.status === 'connected' && marketplace.earnings && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Earnings</p>
                    <p className="text-sm font-medium text-green-600">{marketplace.earnings}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Clicks</p>
                    <p className="text-sm font-medium text-gray-900">{marketplace.clicks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Conversions</p>
                    <p className="text-sm font-medium text-gray-900">{marketplace.conversions}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(marketplace.status)}`}>
                {marketplace.status.charAt(0).toUpperCase() + marketplace.status.slice(1)}
              </span>
              {marketplace.lastSync && (
                <span className="text-xs text-gray-500">Last sync: {marketplace.lastSync}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {marketplace.status === 'disconnected' ? (
                <>
                  <button
                    onClick={() => handleAutoSignup(marketplace)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Auto Signup
                  </button>
                  <button
                    onClick={() => handleConnect(marketplace)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Connect
                  </button>
                </>
              ) : marketplace.status === 'connected' ? (
                <>
                  <button className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </button>
                  <button className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync
                  </button>
                </>
              ) : (
                <button className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 rounded-lg">
                  <Clock className="w-4 h-4 mr-2" />
                  Pending Approval
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Popular Marketplaces Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Marketplaces</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { name: 'eBay', logo: '🛍️', url: 'https://partnernetwork.ebay.com/' },
            { name: 'Walmart', logo: '🏪', url: 'https://affiliates.walmart.com/' },
            { name: 'Target', logo: '🎯', url: 'https://affiliate.target.com/' },
            { name: 'Best Buy', logo: '📱', url: 'https://www.bestbuy.com/site/partner-program/' },
            { name: 'Etsy', logo: '🎨', url: 'https://www.etsy.com/affiliates' },
            { name: 'Shopify', logo: '🛒', url: 'https://www.shopify.com/affiliates' },
          ].map((marketplace) => (
            <button
              key={marketplace.name}
              onClick={() => window.open(marketplace.url, '_blank')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mb-2">{marketplace.logo}</div>
              <span className="text-sm font-medium text-gray-900">{marketplace.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marketplaces; 