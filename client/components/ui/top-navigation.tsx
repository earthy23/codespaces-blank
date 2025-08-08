import { Link } from "react-router-dom";
import { UECLogo } from "@/components/ui/uec-logo";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";

interface Notification {
  id: string;
  type: 'ping' | 'message' | 'follow' | 'like';
  from: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export function TopNavigation() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Simulate some notifications for demo
  useEffect(() => {
    if (user) {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'ping',
          from: 'GameMaster',
          content: 'mentioned you in general chat',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          read: false
        },
        {
          id: '2',
          type: 'message',
          from: 'Builder123',
          content: 'sent you a direct message',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          read: false
        },
        {
          id: '3',
          type: 'follow',
          from: 'CrafterPro',
          content: 'started following you',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          read: true
        }
      ];
      setNotifications(mockNotifications);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    // Mark all notifications as read when opened
    if (!showNotifications) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ping': return '🔔';
      case 'message': return '💬';
      case 'follow': return '👤';
      case 'like': return '❤️';
      default: return '🔔';
    }
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm font-extralight pb-1.5 mt-auto px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo on the left */}
        <Link to="/" className="flex items-center">
          <UECLogo size="md" />
        </Link>

        {/* Right side with notifications and profile */}
        {user && (
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 hover:bg-primary/10"
                  onClick={handleNotificationClick}
                >
                  <span className="text-lg">🔔</span>
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Notifications</h3>
                    {notifications.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={() => setNotifications([])}
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <span className="text-2xl block mb-2">📭</span>
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            notification.read 
                              ? 'bg-muted/50 border-border/50' 
                              : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-lg flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">
                                  {notification.from}
                                </span>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(notification.timestamp)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile section */}
            <Link to="/profile">
              <Button variant="ghost" className="flex items-center space-x-3 hover:bg-primary/10 rounded-full px-4 py-2">
                {/* Circular profile avatar */}
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30">
                  <span className="text-sm font-semibold text-primary">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                {/* Username */}
                <span className="text-sm font-medium text-foreground">
                  {user.username}
                </span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
