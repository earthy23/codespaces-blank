import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./auth";

interface WebSocketEvents {
  // Store events
  "store:subscription_updated": {
    userId: string;
    tier: string;
    subscription: any;
  };
  "store:purchase_completed": {
    userId: string;
    productId: string;
    tier: string;
  };
  "store:customization_updated": {
    userId: string;
    settingType: string;
    settingValue: string;
  };

  // Admin events
  "admin:stats_updated": { stats: any };
  "admin:user_action": { action: string; userId: string; details: any };

  // Friend events
  "friends:status_updated": {
    userId: string;
    status: "online" | "offline" | "away";
  };
  "friends:request_received": { from: string; username: string };
  "friends:request_accepted": { userId: string; username: string };

  // Chat events
  "chat:new_message": { chatId: string; message: any };
  "chat:message_edited": { chatId: string; messageId: string; content: string };
  "chat:message_deleted": { chatId: string; messageId: string };
  "chat:typing_start": { chatId: string; userId: string; username: string };
  "chat:typing_stop": { chatId: string; userId: string; username: string };

  // System events
  "system:notification": {
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
  };
  "system:maintenance": {
    message: string;
    startTime: string;
    duration: number;
  };
}

type EventListener<T = any> = (data: T) => void;

interface WebSocketManagerContextType {
  isConnected: boolean;
  send: (type: string, data?: any) => void;
  subscribe: <K extends keyof WebSocketEvents>(
    event: K,
    listener: EventListener<WebSocketEvents[K]>,
  ) => () => void;
  broadcast: (event: keyof WebSocketEvents, data: any) => void;
  getUserStatus: (userId: string) => "online" | "offline" | "away";
  getOnlineUsers: () => string[];
}

// Default context value to prevent undefined errors
const defaultContextValue: WebSocketManagerContextType = {
  isConnected: false,
  send: () => console.warn("WebSocket not initialized"),
  subscribe: () => () => {}, // Return empty unsubscribe function
  broadcast: () => console.warn("WebSocket not initialized"),
  getUserStatus: () => "offline",
  getOnlineUsers: () => [],
};

const WebSocketManagerContext =
  createContext<WebSocketManagerContextType>(defaultContextValue);

export const WebSocketManagerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [userStatuses, setUserStatuses] = useState<
    Map<string, "online" | "offline" | "away">
  >(new Map());

  const { user, token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const eventListeners = useRef<Map<string, EventListener[]>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!user || !token || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      if (process.env.NODE_ENV === "development") {
        console.log("🔌 Connecting to WebSocket:", wsUrl);
      }

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        if (process.env.NODE_ENV === "development") {
          console.log("✅ WebSocket connected");
        }
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Authenticate immediately
        send("authenticate", { token });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error("❌ WebSocket message parse error:", {
            error: error.message,
            rawData:
              event.data?.substring(0, 100) +
              (event.data?.length > 100 ? "..." : ""),
            timestamp: new Date().toISOString(),
          });
        }
      };

      wsRef.current.onclose = (event) => {
        const closeCodeNames = {
          1000: "Normal Closure",
          1001: "Going Away",
          1002: "Protocol Error",
          1003: "Unsupported Data",
          1006: "Abnormal Closure",
          1011: "Server Error",
          1012: "Service Restart",
        };

        const closeReason =
          closeCodeNames[event.code] || `Unknown (${event.code})`;

        if (process.env.NODE_ENV === "development") {
          console.log(
            `🔌 WebSocket disconnected: ${closeReason}`,
            event.reason || "No reason provided",
          );
        }
        setIsConnected(false);

        // Don't auto-reconnect for normal closure (1000) or when going away (1001)
        if (
          event.code !== 1000 &&
          event.code !== 1001 &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s, 8s, 16s
          if (process.env.NODE_ENV === "development") {
            console.log(
              `🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`,
            );
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (event.code === 1000 || event.code === 1001) {
          if (process.env.NODE_ENV === "development") {
            console.log("🔌 WebSocket closed normally, not reconnecting");
          }
        } else {
          console.warn("🔌 WebSocket max reconnection attempts reached");
        }
      };

      wsRef.current.onerror = (event) => {
        // Extract meaningful error information
        const errorInfo = {
          type: event.type,
          target: event.target?.readyState
            ? `readyState: ${event.target.readyState}`
            : "unknown",
          timestamp: new Date().toISOString(),
        };

        if (process.env.NODE_ENV === "development") {
          console.error("❌ WebSocket error:", JSON.stringify(errorInfo));
        } else {
          console.error("❌ WebSocket connection error occurred");
        }
      };
    } catch (error) {
      console.error("❌ WebSocket connection setup error:", {
        message: error.message,
        type: error.name,
        timestamp: new Date().toISOString(),
      });
      setIsConnected(false);
    }
  }, [user, token]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message: any) => {
    const { type, data } = message;

    // Handle system messages
    switch (type) {
      case "authenticated":
        if (process.env.NODE_ENV === "development") {
          console.log("🔐 WebSocket authenticated:", data.user?.username);
        }
        break;

      case "auth_error":
        console.error("❌ WebSocket auth error:", JSON.stringify({
          message: data?.message || "Unknown auth error",
          data: data,
          timestamp: new Date().toISOString(),
        }));
        break;

      case "user_online":
        setOnlineUsers((prev) => new Set([...prev, data.userId]));
        setUserStatuses((prev) => new Map(prev.set(data.userId, "online")));
        break;

      case "user_offline":
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
        setUserStatuses((prev) => new Map(prev.set(data.userId, "offline")));
        break;

      case "user_away":
        setUserStatuses((prev) => new Map(prev.set(data.userId, "away")));
        break;

      case "online_users":
        setOnlineUsers(new Set(data.userIds));
        break;
    }

    // Emit to subscribers
    const listeners = eventListeners.current.get(type) || [];
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error("❌ Event listener error:", {
          message: error?.message || "Unknown error",
          type: error?.name || "Unknown",
          listenerType: type,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }, []);

  // Send message to WebSocket
  const send = useCallback((type: string, data?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    } else {
      console.warn("⚠️ WebSocket not connected, cannot send:", type);
    }
  }, []);

  // Subscribe to events
  const subscribe = useCallback(
    <K extends keyof WebSocketEvents>(
      event: K,
      listener: EventListener<WebSocketEvents[K]>,
    ) => {
      const currentListeners = eventListeners.current.get(event) || [];
      eventListeners.current.set(event, [...currentListeners, listener]);

      // Return unsubscribe function
      return () => {
        const listeners = eventListeners.current.get(event) || [];
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
          eventListeners.current.set(event, listeners);
        }
      };
    },
    [],
  );

  // Broadcast event (for admin users)
  const broadcast = useCallback(
    (event: keyof WebSocketEvents, data: any) => {
      send("broadcast", { event, data });
    },
    [send],
  );

  // Get user status
  const getUserStatus = useCallback(
    (userId: string) => {
      return userStatuses.get(userId) || "offline";
    },
    [userStatuses],
  );

  // Get online users list
  const getOnlineUsers = useCallback(() => {
    return Array.from(onlineUsers);
  }, [onlineUsers]);

  // Connect when user and token are available
  useEffect(() => {
    if (user && token) {
      try {
        connect();
      } catch (error) {
        console.error("❌ WebSocket connection initiation error:", {
          message: error?.message || "Unknown error",
          type: error?.name || "Unknown",
          timestamp: new Date().toISOString(),
        });
      }
    }

    return () => {
      try {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
          wsRef.current.close();
        }
      } catch (error) {
        // Silently handle cleanup errors
        if (process.env.NODE_ENV === "development") {
          console.warn("WebSocket cleanup error:", error?.message);
        }
      }
    };
  }, [user, token, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const value = {
    isConnected,
    send,
    subscribe,
    broadcast,
    getUserStatus,
    getOnlineUsers,
  };

  return (
    <WebSocketManagerContext.Provider value={value}>
      {children}
    </WebSocketManagerContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketManagerContext);
  return context;
};

// Utility hook for subscribing to specific events
export const useWebSocketEvent = <K extends keyof WebSocketEvents>(
  event: K,
  listener: EventListener<WebSocketEvents[K]>,
  deps: React.DependencyList = [],
) => {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe(event, listener);
    return unsubscribe;
  }, [subscribe, event, ...deps]);
};
