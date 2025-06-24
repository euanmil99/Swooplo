import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  Bell, 
  Check, 
  AlertTriangle, 
  DollarSign, 
  Filter,
  X,
  Clock,
  ExternalLink,
  Settings,
  Archive,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export interface Notification {
  id: string;
  type: 'revenue' | 'error' | 'approval' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  metadata?: {
    amount?: number;
    platform?: string;
    campaignId?: string;
    link?: string;
  };
}

interface NotificationHubProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onAction?: (notification: Notification) => void;
  onRefresh?: () => void;
}

export function NotificationHub({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDelete, 
  onAction,
  onRefresh 
}: NotificationHubProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const notificationTypeIcons = {
    revenue: <DollarSign className="h-4 w-4 text-green-500" />,
    error: <AlertTriangle className="h-4 w-4 text-red-500" />,
    approval: <Check className="h-4 w-4 text-blue-500" />,
    info: <Bell className="h-4 w-4 text-gray-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    success: <Check className="h-4 w-4 text-green-500" />
  };

  const notificationTypeColors = {
    revenue: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    approval: 'bg-blue-50 border-blue-200',
    info: 'bg-gray-50 border-gray-200',
    warning: 'bg-yellow-50 border-yellow-200',
    success: 'bg-green-50 border-green-200'
  };

  const priorityColors = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500'
  };

  const filteredNotifications = notifications
    .filter(n => !activeFilter || n.type === activeFilter)
    .filter(n => !showUnreadOnly || !n.read)
    .filter(n => !priorityFilter || n.priority === priorityFilter)
    .filter(n => 
      !searchQuery || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.read).length;

  const handleMarkAsRead = (id: string) => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleAction = (notification: Notification) => {
    if (onAction) {
      onAction(notification);
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

  const getNotificationTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-xl">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
            {urgentCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {urgentCount} Urgent
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={showUnreadOnly ? 'bg-gray-100' : ''}
            >
              Unread Only
            </Button>
            {onMarkAllAsRead && unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onMarkAllAsRead}
              >
                Mark All Read
              </Button>
            )}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap gap-2">
            {['revenue', 'error', 'approval', 'info', 'warning', 'success'].map(type => (
              <Button
                key={type}
                variant={activeFilter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(activeFilter === type ? null : type)}
                className="capitalize text-xs"
              >
                {notificationTypeIcons[type as keyof typeof notificationTypeIcons]}
                <span className="ml-1">{getNotificationTypeLabel(type)}</span>
              </Button>
            ))}
          </div>

          {/* Priority Filters */}
          <div className="flex flex-wrap gap-2">
            {['urgent', 'high', 'medium', 'low'].map(priority => (
              <Button
                key={priority}
                variant={priorityFilter === priority ? "default" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter(priorityFilter === priority ? null : priority)}
                className={`capitalize text-xs ${priorityColors[priority as keyof typeof priorityColors]}`}
              >
                {priority}
              </Button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-4 border rounded-lg transition-all duration-200 ${
                    notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                  } ${notificationTypeColors[notification.type]}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {notificationTypeIcons[notification.type]}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-medium text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${priorityColors[notification.priority]}`}
                          >
                            {notification.priority}
                          </Badge>
                          {notification.category && (
                            <Badge variant="secondary" className="text-xs">
                              {notification.category}
                            </Badge>
                          )}
                        </div>
                        
                        <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        
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
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          
                          {notification.actionable && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAction(notification)}
                              className="h-6 px-2 text-xs"
                            >
                              Take Action
                            </Button>
                          )}
                          
                          {notification.metadata?.link && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => window.open(notification.metadata.link, '_blank')}
                              className="h-6 px-2 text-xs"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.read && (
                            <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                              <Check className="h-4 w-4 mr-2" />
                              Mark as read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(notification.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </span>
            <span>
              {unreadCount} unread
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 