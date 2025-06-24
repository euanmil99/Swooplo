import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { api } from '../lib/api';

interface EmailScrapingResult {
  emails: string[];
  totalFound: number;
  validEmails: number;
  invalidEmails: number;
  source: string;
  timestamp: Date;
}

interface EmailSubscriber {
  id: string;
  email: string;
  source: string;
  platform: string;
  isActive: boolean;
  subscribedAt: string;
}

interface ScrapingStats {
  totalEmails: number;
  validEmails: number;
  invalidEmails: number;
  sources: Record<string, number>;
  platforms: Record<string, number>;
  recentActivity: any[];
}

export default function EmailScraper() {
  const [activeTab, setActiveTab] = useState('website');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<EmailScrapingResult[]>([]);
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [stats, setStats] = useState<ScrapingStats | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // Website scraping form
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [maxEmails, setMaxEmails] = useState(100);
  const [respectRobotsTxt, setRespectRobotsTxt] = useState(true);

  // Social media scraping form
  const [platform, setPlatform] = useState('linkedin');
  const [profileUrl, setProfileUrl] = useState('');
  const [includeBio, setIncludeBio] = useState(true);
  const [includePosts, setIncludePosts] = useState(false);

  // Bulk scraping form
  const [bulkSources, setBulkSources] = useState([
    { type: 'website', url: '', maxEmails: 100, respectRobotsTxt: true }
  ]);

  useEffect(() => {
    loadCampaigns();
    loadStats();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/email-scraper/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const scrapeWebsite = async () => {
    if (!websiteUrl) return;

    setIsLoading(true);
    try {
      const response = await api.post('/email-scraper/website', {
        url: websiteUrl,
        maxEmails,
        respectRobotsTxt,
      });

      setResults(prev => [response.data.data, ...prev]);
      loadStats();
    } catch (error) {
      console.error('Failed to scrape website:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrapeSocialMedia = async () => {
    if (!profileUrl) return;

    setIsLoading(true);
    try {
      const response = await api.post('/email-scraper/social-media', {
        platform,
        profileUrl,
        maxEmails,
        includeBio,
        includePosts,
      });

      setResults(prev => [response.data.data, ...prev]);
      loadStats();
    } catch (error) {
      console.error('Failed to scrape social media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const bulkScrape = async () => {
    if (bulkSources.length === 0) return;

    setIsLoading(true);
    try {
      const response = await api.post('/email-scraper/bulk-scrape', {
        sources: bulkSources,
      });

      setResults(prev => [...response.data.data.results, ...prev]);
      loadStats();
    } catch (error) {
      console.error('Failed to bulk scrape:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const storeEmails = async (result: EmailScrapingResult) => {
    if (!selectedCampaign) {
      alert('Please select a campaign first');
      return;
    }

    try {
      const response = await api.post('/email-scraper/store', {
        campaignId: selectedCampaign,
        emails: result.emails,
        source: result.source,
        platform: result.platform || 'website',
      });

      alert(`Stored ${response.data.data.stored} emails successfully`);
      loadSubscribers();
    } catch (error) {
      console.error('Failed to store emails:', error);
    }
  };

  const loadSubscribers = async () => {
    if (!selectedCampaign) return;

    try {
      const response = await api.get(`/email-scraper/subscribers/${selectedCampaign}`);
      setSubscribers(response.data.data.subscribers || []);
    } catch (error) {
      console.error('Failed to load subscribers:', error);
    }
  };

  const addBulkSource = () => {
    setBulkSources(prev => [...prev, { type: 'website', url: '', maxEmails: 100, respectRobotsTxt: true }]);
  };

  const removeBulkSource = (index: number) => {
    setBulkSources(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulkSource = (index: number, field: string, value: any) => {
    setBulkSources(prev => prev.map((source, i) => 
      i === index ? { ...source, [field]: value } : source
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Scraper</h1>
          <p className="text-muted-foreground">
            Collect email addresses for your affiliate marketing campaigns
          </p>
        </div>
        {stats && (
          <div className="flex gap-4">
            <Badge variant="secondary">
              Total: {stats.totalEmails}
            </Badge>
            <Badge variant="outline">
              Valid: {stats.validEmails}
            </Badge>
            <Badge variant="destructive">
              Invalid: {stats.invalidEmails}
            </Badge>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Scrape</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>

        <TabsContent value="website" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scrape Emails from Website</CardTitle>
              <CardDescription>
                Extract email addresses from any website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Website URL</label>
                  <Input
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Emails</label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={maxEmails}
                    onChange={(e) => setMaxEmails(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="respectRobotsTxt"
                  checked={respectRobotsTxt}
                  onChange={(e) => setRespectRobotsTxt(e.target.checked)}
                />
                <label htmlFor="respectRobotsTxt" className="text-sm">
                  Respect robots.txt
                </label>
              </div>
              <Button onClick={scrapeWebsite} disabled={isLoading || !websiteUrl}>
                {isLoading ? 'Scraping...' : 'Scrape Emails'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scrape Emails from Social Media</CardTitle>
              <CardDescription>
                Extract email addresses from social media profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Platform</label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Profile URL</label>
                  <Input
                    placeholder="https://linkedin.com/in/username"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Emails</label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={maxEmails}
                    onChange={(e) => setMaxEmails(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeBio"
                      checked={includeBio}
                      onChange={(e) => setIncludeBio(e.target.checked)}
                    />
                    <label htmlFor="includeBio" className="text-sm">
                      Include bio
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includePosts"
                      checked={includePosts}
                      onChange={(e) => setIncludePosts(e.target.checked)}
                    />
                    <label htmlFor="includePosts" className="text-sm">
                      Include posts
                    </label>
                  </div>
                </div>
              </div>
              <Button onClick={scrapeSocialMedia} disabled={isLoading || !profileUrl}>
                {isLoading ? 'Scraping...' : 'Scrape Emails'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Email Scraping</CardTitle>
              <CardDescription>
                Scrape emails from multiple sources at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bulkSources.map((source, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Source {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeBulkSource(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select
                        value={source.type}
                        onValueChange={(value) => updateBulkSource(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="social-media">Social Media</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">URL</label>
                      <Input
                        placeholder="https://example.com"
                        value={source.url}
                        onChange={(e) => updateBulkSource(index, 'url', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Max Emails</label>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        value={source.maxEmails}
                        onChange={(e) => updateBulkSource(index, 'maxEmails', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`respectRobotsTxt-${index}`}
                        checked={source.respectRobotsTxt}
                        onChange={(e) => updateBulkSource(index, 'respectRobotsTxt', e.target.checked)}
                      />
                      <label htmlFor={`respectRobotsTxt-${index}`} className="text-sm">
                        Respect robots.txt
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Button onClick={addBulkSource} variant="outline">
                  Add Source
                </Button>
                <Button onClick={bulkScrape} disabled={isLoading || bulkSources.length === 0}>
                  {isLoading ? 'Scraping...' : 'Bulk Scrape'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Subscribers</CardTitle>
              <CardDescription>
                Manage your email subscribers and campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Select Campaign</label>
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={loadSubscribers} disabled={!selectedCampaign}>
                    Load Subscribers
                  </Button>
                </div>
              </div>

              {subscribers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Subscribers ({subscribers.length})</h4>
                  <div className="border rounded-lg">
                    {subscribers.map((subscriber) => (
                      <div
                        key={subscriber.id}
                        className="flex items-center justify-between p-3 border-b last:border-b-0"
                      >
                        <div>
                          <p className="font-medium">{subscriber.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {subscriber.source} • {subscriber.platform}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={subscriber.isActive ? "default" : "secondary"}>
                            {subscriber.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(subscriber.subscribedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Section */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scraping Results</CardTitle>
            <CardDescription>
              Recent email scraping results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{result.source}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {result.totalFound} found
                      </Badge>
                      <Badge variant="default">
                        {result.validEmails} valid
                      </Badge>
                      <Badge variant="destructive">
                        {result.invalidEmails} invalid
                      </Badge>
                    </div>
                  </div>
                  {result.emails.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Emails:</p>
                        <Button
                          size="sm"
                          onClick={() => storeEmails(result)}
                          disabled={!selectedCampaign}
                        >
                          Store in Campaign
                        </Button>
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        {result.emails.map((email, emailIndex) => (
                          <div key={emailIndex} className="text-sm text-muted-foreground">
                            {email}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 