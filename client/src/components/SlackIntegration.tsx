import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  MessageSquare, 
  Bot, 
  Settings, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';

interface SlackConfig {
  botToken: string;
  userToken: string;
  signingSecret: string;
  appToken: string;
  channelId: string;
  workspaceId: string;
  clientId: string;
  clientSecret: string;
}

interface SlackStatus {
  connected: boolean;
  channel?: string;
  workspace?: string;
  error?: string;
}

export function SlackIntegration() {
  const [config, setConfig] = useState<SlackConfig>({
    botToken: '',
    userToken: '',
    signingSecret: '',
    appToken: '',
    channelId: '',
    workspaceId: '',
    clientId: '',
    clientSecret: ''
  });
  
  const [status, setStatus] = useState<SlackStatus>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [notifications, setNotifications] = useState({
    performance: true,
    aiContent: true,
    errors: true,
    dailySummary: true,
    contentApproval: true
  });

  useEffect(() => {
    loadConfig();
    testConnection();
  }, []);

  const loadConfig = async () => {
    try {
      // In a real app, you'd load this from your backend
      const savedConfig = localStorage.getItem('slackConfig');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Failed to load Slack config:', error);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      // In a real app, you'd save this to your backend
      localStorage.setItem('slackConfig', JSON.stringify(config));
      
      // Test connection after saving
      await testConnection();
      
      // Show success message
      alert('Slack configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save Slack config:', error);
      alert('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      const response = await api.get('/slack/test');
      
      if (response.data.success) {
        setStatus({
          connected: true,
          channel: response.data.data.channel,
          workspace: response.data.data.workspace
        });
      } else {
        setStatus({
          connected: false,
          error: response.data.message
        });
      }
    } catch (error: any) {
      setStatus({
        connected: false,
        error: error.response?.data?.message || 'Connection test failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.trim()) {
      alert('Please enter a test message');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/slack/notify', {
        type: 'info',
        title: 'Test Message',
        message: testMessage,
        channel: config.channelId
      });

      if (response.data.success) {
        alert('Test message sent successfully!');
        setTestMessage('');
      } else {
        alert('Failed to send test message');
      }
    } catch (error: any) {
      alert(`Error sending test message: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookUrl = (type: 'events' | 'interactive' | 'commands') => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/api/slack/${type}`;
    navigator.clipboard.writeText(url);
    alert(`Webhook URL copied to clipboard: ${url}`);
  };

  const openSlackAppSettings = () => {
    window.open('https://api.slack.com/apps', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Slack Integration</h2>
          <p className="text-muted-foreground">
            Connect your Slack workspace to receive notifications and manage content
          </p>
        </div>
        <Badge variant={status.connected ? "default" : "secondary"}>
          {status.connected ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Disconnected
            </>
          )}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration
            </CardTitle>
            <CardDescription>
              Set up your Slack app credentials and tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botToken">Bot User OAuth Token</Label>
              <Input
                id="botToken"
                type="password"
                placeholder="xoxb-your-bot-token"
                value={config.botToken}
                onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userToken">User OAuth Token</Label>
              <Input
                id="userToken"
                type="password"
                placeholder="xoxp-your-user-token"
                value={config.userToken}
                onChange={(e) => setConfig({ ...config, userToken: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signingSecret">Signing Secret</Label>
              <Input
                id="signingSecret"
                type="password"
                placeholder="your-signing-secret"
                value={config.signingSecret}
                onChange={(e) => setConfig({ ...config, signingSecret: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appToken">App-Level Token</Label>
              <Input
                id="appToken"
                type="password"
                placeholder="xapp-your-app-token"
                value={config.appToken}
                onChange={(e) => setConfig({ ...config, appToken: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channelId">Default Channel ID</Label>
              <Input
                id="channelId"
                placeholder="C1234567890"
                value={config.channelId}
                onChange={(e) => setConfig({ ...config, channelId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspaceId">Workspace ID</Label>
              <Input
                id="workspaceId"
                placeholder="T1234567890"
                value={config.workspaceId}
                onChange={(e) => setConfig({ ...config, workspaceId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="your-client-id"
                value={config.clientId}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="your-client-secret"
                value={config.clientSecret}
                onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveConfig} disabled={loading}>
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Configuration
              </Button>
              <Button variant="outline" onClick={openSlackAppSettings}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Slack App Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Webhook URLs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Webhook URLs
            </CardTitle>
            <CardDescription>
              Configure these URLs in your Slack app settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Event Subscriptions URL</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/api/slack/events`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyWebhookUrl('events')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Interactive Components URL</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/api/slack/interactive`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyWebhookUrl('interactive')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Slash Commands URL</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/api/slack/commands`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyWebhookUrl('commands')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Connection Test</Label>
              <Button onClick={testConnection} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                Test Connection
              </Button>
            </div>

            {status.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{status.error}</AlertDescription>
              </Alert>
            )}

            {status.connected && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Connected to {status.workspace} in #{status.channel}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Choose which notifications to receive in Slack
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="performance">Performance Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications about post performance and engagement
                </p>
              </div>
              <Switch
                id="performance"
                checked={notifications.performance}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, performance: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="aiContent">AI Content Generation</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications when AI generates new content
                </p>
              </div>
              <Switch
                id="aiContent"
                checked={notifications.aiContent}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, aiContent: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="errors">Error Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications about system errors and issues
                </p>
              </div>
              <Switch
                id="errors"
                checked={notifications.errors}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, errors: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dailySummary">Daily Summaries</Label>
                <p className="text-sm text-muted-foreground">
                  Daily performance and revenue summaries
                </p>
              </div>
              <Switch
                id="dailySummary"
                checked={notifications.dailySummary}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, dailySummary: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="contentApproval">Content Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Requests for content approval before publishing
                </p>
              </div>
              <Switch
                id="contentApproval"
                checked={notifications.contentApproval}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, contentApproval: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Message */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Message</CardTitle>
          <CardDescription>
            Test your Slack integration by sending a message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testMessage">Test Message</Label>
            <Textarea
              id="testMessage"
              placeholder="Enter a test message to send to Slack..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={sendTestMessage} disabled={loading || !testMessage.trim()}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
            Send Test Message
          </Button>
        </CardContent>
      </Card>

      {/* Available Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Available Slack Commands</CardTitle>
          <CardDescription>
            Commands you can use in your Slack workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-sm font-mono">/socialpilot</code>
              <p className="text-sm text-muted-foreground mt-1">
                Main command with subcommands and help
              </p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-sm font-mono">/socialpilot-status</code>
              <p className="text-sm text-muted-foreground mt-1">
                Get current status of your social media campaigns
              </p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-sm font-mono">/socialpilot-summary</code>
              <p className="text-sm text-muted-foreground mt-1">
                Get detailed daily summary with analytics
              </p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-sm font-mono">/socialpilot-generate [platform] [topic]</code>
              <p className="text-sm text-muted-foreground mt-1">
                Generate AI content for a specific platform and topic
              </p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-sm font-mono">/socialpilot-schedule [platform] [content]</code>
              <p className="text-sm text-muted-foreground mt-1">
                Schedule a post for a specific platform
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 