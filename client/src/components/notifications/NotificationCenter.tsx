import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  CheckIcon, 
  XIcon, 
  BellIcon, 
  DollarSignIcon, 
  AlertTriangleIcon, 
  LineChartIcon, 
  MessageSquareIcon,
  Filter,
  Search,
  Archive,
  Trash2,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface Notification {
  id: string;
  type: 'revenue' | 'error' | 'approval' | 'summary';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionRequired?: boolean;
  category?: string;
  metadata?: {
    amount?: number;
    platform?: string;
    campaignId?: string;
  };
}

const NotificationItem = ({ notification, onAction }: { 
  notification: Notification; 
  onAction: (id: string, action: string) => void;
}) => {
  // Icon based on notification type
  const getIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <DollarSignIcon className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'approval': return <MessageSquareIcon className="h-5 w-5 text-blue-500" />;
      case 'summary': return <LineChartIcon className="h-5 w-5 text-purple-500" />;
      default: return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`mb-4 p-4 border rounded-lg transition-all duration-200 ${
      notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start">
        <div className="mr-3 mt-1">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">{notification.title}</h4>
              <Badge className={getPriorityColor(notification.priority)}>
                {notification.priority}
              </Badge>
              {notification.category && (
                <Badge variant="outline" className="text-xs">
                  {notification.category}
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAction(notification.id, 'mark-read')}>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Mark as read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction(notification.id, 'archive')}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onAction(notification.id, 'delete')}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          
          {notification.metadata && (
            <div className="mt-2 space-y-1">
              {notification.metadata.amount && (
                <div className="text-sm font-medium text-green-600">
                  ${notification.metadata.amount.toFixed(2)}
                </div>
              )}
              {notification.metadata.platform && (
                <div className="text-xs text-gray-500">
                  Platform: {notification.metadata.platform}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-3 flex justify-between items-center">
            <span className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</span>
            
            {notification.actionRequired && (
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center h-7" 
                  onClick={() => onAction(notification.id, 'approve')}
                >
                  <CheckIcon className="h-3 w-3 mr-1" /> Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center h-7"
                  onClick={() => onAction(notification.id, 'reject')}
                >
                  <XIcon className="h-3 w-3 mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NotificationCenter() {
  // Mock notifications - replace with API data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'revenue',
      title: 'Revenue milestone reached!',
      message: 'Your campaign "Summer Sale" has reached $1,000 in revenue.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
      priority: 'high',
      category: 'Achievement',
      metadata: { amount: 1000, platform: 'All Platforms' }
    },
    {
      id: '2',
      type: 'error',
      title: 'Instagram API connection failed',
      message: 'We encountered an error connecting to Instagram. Please check your credentials.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: false,
      priority: 'high',
      category: 'Technical',
      actionRequired: true,
      metadata: { platform: 'Instagram' }
    },
    {
      id: '3',
      type: 'approval',
      title: 'Content needs approval',
      message: 'New post for Twitter campaign "Product Launch" requires your approval before scheduling.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      read: true,
      priority: 'medium',
      category: 'Campaign',
      actionRequired: true,
      metadata: { platform: 'Twitter', campaignId: 'camp_123' }
    },
    {
      id: '4',
      type: 'summary',
      title: 'Daily performance summary',
      message: 'Your accounts generated 256 clicks, 15 conversions, and $342.50 in revenue today.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      read: true,
      priority: 'low',
      category: 'Report',
      metadata: { amount: 342.50 }
    },
    {
      id: '5',
      type: 'revenue',
      title: 'New affiliate commission earned',
      message: 'You earned $45.20 from the "Tech Gadgets" campaign.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      read: false,
      priority: 'medium',
      category: 'Commission',
      metadata: { amount: 45.20, platform: 'Amazon Associates' }
    },
    {
      id: '6',
      type: 'error',
      title: 'Low engagement alert',
      message: 'Your recent LinkedIn posts are showing below-average engagement rates.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      read: true,
      priority: 'medium',
      category: 'Performance',
      metadata: { platform: 'LinkedIn' }
    }
  ]);

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const handleAction = (id: string, action: string) => {
    console.log(`Action: ${action} on notification ${id}`);
    
    switch (action) {
      case 'mark-read':
        setNotifications(notifications.map(note => 
          note.id === id ? {...note, read: true} : note
        ));
        break;
      case 'approve':
        setNotifications(notifications.map(note => 
          note.id === id ? {...note, read: true, actionRequired: false} : note
        ));
        break;
      case 'reject':
        setNotifications(notifications.map(note => 
          note.id === id ? {...note, read: true, actionRequired: false} : note
        ));
        break;
      case 'archive':
        setNotifications(notifications.filter(note => note.id !== id));
        break;
      case 'delete':
        setNotifications(notifications.filter(note => note.id !== id));
        break;
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(note => ({ ...note, read: true })));
  };

  const handleRefresh = () => {
    // Simulate API refresh
    console.log('Refreshing notifications...');
  };

  const filteredNotifications = notifications
    .filter(note => activeFilter === 'all' || note.type === activeFilter)
    .filter(note => priorityFilter === 'all' || note.priority === priorityFilter)
    .filter(note => !showUnreadOnly || !note.read)
    .filter(note => 
      !searchQuery || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const unreadCount = notifications.filter(note => !note.read).length;
  const urgentCount = notifications.filter(note => note.priority === 'high' && !note.read).length;
  const actionRequiredCount = notifications.filter(note => note.actionRequired && !note.read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Notification Center</h2>
          <p className="text-gray-600">Stay updated with your campaign performance</p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              Mark All Read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BellIcon className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSignIcon className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold">{urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquareIcon className="h-6 w-6 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Action Required</p>
                <p className="text-2xl font-bold">{actionRequiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button 
            variant={showUnreadOnly ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            Unread Only
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="error">Errors</TabsTrigger>
            <TabsTrigger value="approval">Approvals</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm font-medium">Priority:</span>
              <Button 
                variant={priorityFilter === 'all' ? "default" : "outline"} 
                size="sm"
                onClick={() => setPriorityFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={priorityFilter === 'high' ? "default" : "outline"} 
                size="sm"
                onClick={() => setPriorityFilter('high')}
                className="text-red-600"
              >
                High
              </Button>
              <Button 
                variant={priorityFilter === 'medium' ? "default" : "outline"} 
                size="sm"
                onClick={() => setPriorityFilter('medium')}
                className="text-yellow-600"
              >
                Medium
              </Button>
              <Button 
                variant={priorityFilter === 'low' ? "default" : "outline"} 
                size="sm"
                onClick={() => setPriorityFilter('low')}
                className="text-green-600"
              >
                Low
              </Button>
            </div>

            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BellIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id}
                    notification={notification}
                    onAction={handleAction}
                  />
                ))
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
} 