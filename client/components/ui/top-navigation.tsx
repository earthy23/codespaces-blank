import { Link, useNavigate } from "react-router-dom";
import { UECLogo } from "@/components/ui/uec-logo";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/chat";
import { useFriends } from "@/lib/friends";
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
  type: "ping" | "message" | "follow" | "like";
  from: string;
  content: string;
  timestamp: string;
  read: boolean;
}

// Simple shield SVG component
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.4 7 14.8 8.6 14.8 10V11.5C15.4 11.9 16 12.4 16 13V17C16 18.1 15.1 19 14 19H10C8.9 19 8 18.1 8 17V13C8 12.4 8.4 11.9 9 11.5V10C9 8.6 10.6 7 12 7ZM12 8.2C11.2 8.2 10.2 8.7 10.2 10V11.5H13.8V10C13.8 8.7 12.8 8.2 12 8.2Z"/>
    </svg>
  );
}

export function TopNavigation() {
  const { user } = useAuth();
  const { unreadTotal, chats } = useChat();
  const { friendRequests } = useFriends();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate real notifications from chat and friends data
  useEffect(() => {
    if (user) {
      const realNotifications: Notification[] = [];

      // Add friend request notifications
      friendRequests.forEach((request) => {
        realNotifications.push({
          id: `friend_${request.id}`,
          type: "follow",
          from: request.requesterUsername || "Unknown",
          content: "sent you a friend request",
          timestamp: request.createdAt,
          read: false,
        });
      });

      // Add unread message notifications
      chats.forEach((chat) => {
        if (chat.unread_count > 0 && chat.last_message) {
          realNotifications.push({
            id: `message_${chat.id}`,
            type: "message",
            from: chat.last_message.sender_username || "Unknown",
            content: `sent ${chat.unread_count} new message${chat.unread_count > 1 ? "s" : ""}`,
            timestamp: chat.last_message.created_at || new Date().toISOString(),
            read: false,
          });
        }
      });

      // Sort by timestamp (newest first)
      realNotifications.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      setNotifications(realNotifications);
    }
  }, [user, friendRequests, chats, unreadTotal]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    // Mark all notifications as read when opened
    if (!showNotifications) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  };

  const clearNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const handleNotificationItemClick = (notification: Notification) => {
    markAsRead(notification.id);
    setShowNotifications(false);

    // Navigate based on notification type
    if (notification.type === "message") {
      const chatId = notification.id.replace("message_", "");
      navigate(`/chat/${chatId}`);
    } else if (notification.type === "follow") {
      navigate("/friends");
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ping":
        return "Bell";
      case "message":
        return "Message";
      case "follow":
        return "User";
      case "like":
        return "Heart";
      default:
        return "Bell";
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
            <DropdownMenu
              open={showNotifications}
              onOpenChange={setShowNotifications}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 hover:bg-primary/10"
                  onClick={handleNotificationClick}
                >
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F595a5390b6e641358fa1c0bbbed72804%2F5fb4309422964587854cb14b9b131597?format=webp&width=800"
                    alt="Notifications"
                    className="w-5 h-5"
                  />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 max-h-96 overflow-y-auto"
              >
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
                      <span className="text-2xl block mb-2">No notifications</span>
                      <p className="text-sm">All caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            notification.read
                              ? "bg-muted/50 border-border/50"
                              : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                          }`}
                          onClick={() =>
                            handleNotificationItemClick(notification)
                          }
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

            {/* Admin button for admin users */}
            {user.role === 'admin' && (
              <Link to="/admin">
                <Button
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
                >
                  <ShieldIcon />
                  <span>Admin</span>
                </Button>
              </Link>
            )}

            {/* Profile section - moved to the right */}
            <Link to="/profile">
              <Button
                variant="ghost"
                className="flex items-center space-x-3 hover:bg-primary/10 rounded-full px-4 py-2"
              >
                <span className="text-sm font-medium text-foreground">
                  {user.username}
                </span>
                {/* Circular profile avatar - on the right */}
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30">
                  <span className="text-sm font-semibold text-primary">
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
