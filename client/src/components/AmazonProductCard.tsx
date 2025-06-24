import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  TrendingUp, 
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface AmazonProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    productUrl: string;
    affiliateUrl?: string;
    commission: number;
    commissionRate: number;
    category: string;
    rating?: number;
    reviewCount?: number;
    isPrime?: boolean;
  };
  onGenerateLink?: (productId: string) => Promise<string>;
  onCopyLink?: (url: string) => void;
  showAffiliateInfo?: boolean;
}

export const AmazonProductCard: React.FC<AmazonProductCardProps> = ({
  product,
  onGenerateLink,
  onCopyLink,
  showAffiliateInfo = true,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [affiliateUrl, setAffiliateUrl] = useState(product.affiliateUrl);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    if (!onGenerateLink) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const url = await onGenerateLink(product.id);
      setAffiliateUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate affiliate link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (!affiliateUrl) return;
    
    navigator.clipboard.writeText(affiliateUrl);
    setIsCopied(true);
    onCopyLink?.(affiliateUrl);
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatCommission = (commission: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(commission);
  };

  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {product.name}
          </CardTitle>
          {product.isPrime && (
            <Badge variant="secondary" className="text-xs">
              Prime
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/300x300?text=Product+Image';
            }}
          />
          {product.originalPrice && product.originalPrice > product.price && (
            <Badge className="absolute top-2 left-2 bg-red-500">
              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
            </Badge>
          )}
        </div>

        {/* Price and Rating */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {product.rating && (
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{product.rating}</span>
                <span className="text-yellow-400">★</span>
                {product.reviewCount && (
                  <span className="text-xs text-gray-500">
                    ({product.reviewCount.toLocaleString()})
                  </span>
                )}
              </div>
            )}
          </div>
          
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
        </div>

        {/* Affiliate Information */}
        {showAffiliateInfo && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Commission</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">
                  {formatCommission(product.commission)}
                </div>
                <div className="text-xs text-gray-500">
                  {product.commissionRate}% rate
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">
                Potential earnings per sale
              </span>
            </div>
          </div>
        )}

        {/* Affiliate Link Section */}
        <div className="space-y-3">
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {!affiliateUrl ? (
            <Button
              onClick={handleGenerateLink}
              disabled={isGenerating || !onGenerateLink}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating Link...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Generate Affiliate Link
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <label htmlFor="affiliate-url" className="text-sm font-medium">
                Affiliate Link
              </label>
              <div className="flex gap-2">
                <Input
                  id="affiliate-url"
                  value={affiliateUrl}
                  readOnly
                  className="text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {isCopied ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {isCopied && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Link copied to clipboard!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(product.productUrl, '_blank')}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Product
          </Button>
          
          {affiliateUrl && (
            <Button
              onClick={() => window.open(affiliateUrl, '_blank')}
              className="flex-1"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Use Link
            </Button>
          )}
        </div>

        {/* Compliance Notice */}
        <div className="text-xs text-gray-500 text-center">
          * Affiliate links help support our content. We may earn a commission from qualifying purchases.
        </div>
      </CardContent>
    </Card>
  );
}; 