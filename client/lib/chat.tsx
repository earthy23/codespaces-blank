import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "./auth";

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_username: string;
  content: string;
  type: "text" | "system" | "file";
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
}

export interface Chat {
  id: string;
  type: "dm" | "group";
  name?: string;
  participants?: string[];
  participant_usernames?: string[];
  last_message?: Message | null;
  unread_count: number;
  created_at: string;
}

interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

interface ChatContextType {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  unreadTotal: number;
  typingUsers: { [chatId: string]: TypingUser[] };
  isConnected: boolean;
  isLoading: boolean;
  createDirectMessage: (username: string) => Promise<string | null>;
  createGroupChat: (name: string, usernames: string[]) => Promise<string | null>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  editMessage: (
    chatId: string,
    messageId: string,
    content: string,
  ) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
  markAsRead: (chatId: string) => void;
  getChatMessages: (chatId: string) => Message[];
  getChatById: (chatId: string) => Chat | undefined;
  loadMoreMessages: (chatId: string) => Promise<void>;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  refreshChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// FullStory detection utility
const isFullStoryBlocking = () => {
  try {
    return (
      window.fetch !== fetch ||
      window.fetch.toString().includes("fullstory") ||
      document.querySelector('script[src*="fullstory"]') !== null
    );
  } catch {
    return false;
  }
};

// XMLHttpRequest fallback for fetch
const makeRequest = async (url: string, options: any = {}) => {
  if (isFullStoryBlocking()) {
    return new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || "GET", url);

      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value as string);
        });
      }

      xhr.onload = () => {
        const response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          json: () => Promise.resolve(JSON.parse(xhr.responseText)),
          text: () => Promise.resolve(xhr.responseText),
        } as Response;
        resolve(response);
      };

      xhr.onerror = () => {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Chat XMLHttpRequest network error, returning empty response",
          );
        }
        resolve({ ok: false, status: 0, json: () => Promise.resolve({}) });
      };
      xhr.ontimeout = () => {
        if (process.env.NODE_ENV === "development") {
          console.warn("Chat XMLHttpRequest timeout, returning empty response");
        }
        resolve({ ok: false, status: 408, json: () => Promise.resolve({}) });
      };

      if (options.signal) {
        options.signal.addEventListener("abort", () => {
          xhr.abort();
          // Don't reject, just resolve with ok: false to handle gracefully
          resolve({ ok: false, status: 0, json: () => Promise.resolve({}) });
        });
      }

      xhr.send(options.body || null);
    });
  }
  return fetch(url, options);
};

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>({});
  const [typingUsers, setTypingUsers] = useState<{
    [chatId: string]: TypingUser[];
  }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!user || !token) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/chat-ws`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        if (process.env.NODE_ENV === "development") {
          console.log("Connected to chat WebSocket");
        }
        setIsConnected(true);

        // Authenticate
        wsRef.current?.send(
          JSON.stringify({
            type: "authenticate",
            data: { token },
          }),
        );
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("❌ Chat WebSocket message parse error:", {
              error: error?.message || "Unknown parse error",
              rawData:
                event.data?.substring(0, 100) +
                (event.data?.length > 100 ? "..." : ""),
              timestamp: new Date().toISOString(),
            });
          }
        }
      };

      wsRef.current.onclose = () => {
        if (process.env.NODE_ENV === "development") {
          console.log("WebSocket connection closed");
        }
        setIsConnected(false);

        // Attempt to reconnect after 3 seconds
        if (user && token) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current.onerror = (event) => {
        // Extract meaningful error information instead of logging raw event
        const errorInfo = {
          type: event.type,
          target: event.target?.readyState
            ? `readyState: ${event.target.readyState}`
            : "unknown",
          timestamp: new Date().toISOString(),
        };

        if (process.env.NODE_ENV === "development") {
          console.warn(
            "⚠️ Chat WebSocket error (will attempt reconnect):",
            JSON.stringify(errorInfo),
          );
        } else {
          console.warn(
            "⚠️ Chat WebSocket connection error, attempting reconnect...",
          );
        }

        setIsConnected(false);
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❌ Chat WebSocket connection setup error:", {
          message: error?.message || "Unknown error",
          type: error?.name || "Unknown",
          timestamp: new Date().toISOString(),
        });
      } else {
        console.warn("❌ Chat WebSocket connection failed, will retry");
      }
      setIsConnected(false);
    }
  }, [user, token]);

  const handleWebSocketMessage = (message: any) => {
    const { type, data } = message;

    switch (type) {
      case "authenticated":
        if (process.env.NODE_ENV === "development") {
          console.log("WebSocket authenticated");
        }
        break;

      case "message":
        // New message received
        const { chatId, message: newMessage } = data;
        setMessages((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), newMessage],
        }));

        // Update chat's last message and timestamp
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  last_message: newMessage,
                  unread_count:
                    newMessage.sender_id === user?.id
                      ? 0
                      : chat.unread_count + 1,
                }
              : chat,
          ),
        );
        break;

      case "message_edited":
        const { chatId: editChatId, messageId, newContent } = data;
        setMessages((prev) => ({
          ...prev,
          [editChatId]: (prev[editChatId] || []).map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: newContent,
                  edited_at: new Date().toISOString(),
                }
              : msg,
          ),
        }));
        break;

      case "message_deleted":
        const { chatId: delChatId, messageId: delMessageId } = data;
        setMessages((prev) => ({
          ...prev,
          [delChatId]: (prev[delChatId] || []).map((msg) =>
            msg.id === delMessageId
              ? { ...msg, deleted_at: new Date().toISOString() }
              : msg,
          ),
        }));
        break;

      case "user_typing_start":
        const { chatId: typingChatId, userId, username } = data;
        if (userId !== user?.id) {
          setTypingUsers((prev) => {
            const chatTyping = prev[typingChatId] || [];
            const existingUser = chatTyping.find((u) => u.userId === userId);

            if (!existingUser) {
              return {
                ...prev,
                [typingChatId]: [
                  ...chatTyping,
                  { userId, username, timestamp: Date.now() },
                ],
              };
            }
            return prev;
          });
        }
        break;

      case "user_typing_stop":
        const { chatId: stopChatId, userId: stopUserId } = data;
        setTypingUsers((prev) => ({
          ...prev,
          [stopChatId]: (prev[stopChatId] || []).filter(
            (u) => u.userId !== stopUserId,
          ),
        }));
        break;

      case "error":
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️ Chat WebSocket server error:", {
            message: message.message || "Unknown server error",
            timestamp: new Date().toISOString(),
          });
        }
        break;
    }
  };

  // Load chats from API
  const loadChats = async () => {
    if (!user || !token) return;

    try {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10 second timeout

      try {
        const response = await makeRequest("/api/chat", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setChats(data.chats || []);
        } else {
          console.warn("Failed to load chats, keeping existing data");
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Handle different types of errors gracefully
        if (
          fetchError.name === "AbortError" ||
          fetchError.message?.includes("aborted")
        ) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "Chat loading aborted/timed out, keeping existing data",
            );
          }
          return; // Exit gracefully without throwing
        }
        throw fetchError;
      }
    } catch (error) {
      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Chat loading aborted, keeping existing data");
        }
      } else if (error.message?.includes("Failed to fetch")) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Network issue loading chats, keeping existing data");
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn("Error loading chats:", error.message || error);
        }
      }
      // Don't clear existing chats on error, keep current state
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages for a specific chat
  const loadChatMessages = async (chatId: string, offset = 0) => {
    if (!user || !token) return [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased to 8 second timeout

      try {
        const response = await makeRequest(
          `/api/chat/${chatId}/messages?limit=50&offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return data.messages || [];
        } else {
          if (process.env.NODE_ENV === "development") {
            console.warn(`Failed to load messages for chat ${chatId}`);
          }
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Handle abort errors gracefully
        if (
          fetchError.name === "AbortError" ||
          fetchError.message?.includes("aborted")
        ) {
          if (process.env.NODE_ENV === "development") {
            console.warn(`Chat messages loading aborted for chat ${chatId}`);
          }
          return []; // Return empty array instead of throwing
        }
        throw fetchError;
      }
    } catch (error) {
      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`Chat messages loading aborted for chat ${chatId}`);
        }
      } else if (error.message?.includes("Failed to fetch")) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`Network issue loading messages for chat ${chatId}`);
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn("Error loading messages:", error.message || error);
        }
      }
    }
    return [];
  };

  // Initialize when user logs in
  useEffect(() => {
    if (user && token) {
      loadChats();
      connectWebSocket();
    } else {
      // Cleanup when user logs out
      setChats([]);
      setMessages({});
      setTypingUsers({});
      setIsConnected(false);
      setIsLoading(false);

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, token, connectWebSocket]);

  // Cleanup typing users periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach((chatId) => {
          const filtered = updated[chatId].filter(
            (user) => now - user.timestamp < 5000,
          ); // 5 seconds
          if (filtered.length !== updated[chatId].length) {
            updated[chatId] = filtered;
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const createDirectMessage = async (
    username: string,
  ): Promise<string | null> => {
    if (!user || !token) return null;

    try {
      const response = await makeRequest("/api/chat/dm", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        const data = await response.json();
        await refreshChats(); // Refresh to get the new chat
        return data.chatId;
      }
    } catch (error) {
      console.error("Error creating DM:", error);
    }
    return null;
  };

  const sendMessage = async (
    chatId: string,
    content: string,
  ): Promise<void> => {
    if (!user || !token || !content.trim()) return;

    try {
      const response = await makeRequest(`/api/chat/${chatId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Stop typing indicator
      stopTyping(chatId);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const editMessage = async (
    chatId: string,
    messageId: string,
    content: string,
  ): Promise<void> => {
    if (!user || !token) return;

    try {
      const response = await makeRequest(
        `/api/chat/${chatId}/messages/${messageId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to edit message");
      }
    } catch (error) {
      console.error("Error editing message:", error);
      throw error;
    }
  };

  const deleteMessage = async (
    chatId: string,
    messageId: string,
  ): Promise<void> => {
    if (!user || !token) return;

    try {
      const response = await makeRequest(
        `/api/chat/${chatId}/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  };

  const markAsRead = async (chatId: string) => {
    if (!user || !token) return;

    try {
      await makeRequest(`/api/chat/${chatId}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Update local state
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, unread_count: 0 } : chat,
        ),
      );
    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  };

  const getChatMessages = (chatId: string): Message[] => {
    const chatMessages = messages[chatId] || [];
    return chatMessages.filter((msg) => !msg.deleted_at);
  };

  const getChatById = (chatId: string): Chat | undefined => {
    return chats.find((c) => c.id === chatId);
  };

  const loadMoreMessages = async (chatId: string): Promise<void> => {
    const currentMessages = messages[chatId] || [];
    const olderMessages = await loadChatMessages(
      chatId,
      currentMessages.length,
    );

    if (olderMessages.length > 0) {
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...olderMessages, ...currentMessages],
      }));
    }
  };

  const startTyping = (chatId: string) => {
    if (!isConnected || !wsRef.current) return;

    wsRef.current.send(
      JSON.stringify({
        type: "typing_start",
        data: { chatId },
      }),
    );
  };

  const stopTyping = (chatId: string) => {
    if (!isConnected || !wsRef.current) return;

    wsRef.current.send(
      JSON.stringify({
        type: "typing_stop",
        data: { chatId },
      }),
    );
  };

  const refreshChats = async (): Promise<void> => {
    await loadChats();
  };

  // Load messages when selecting a chat
  useEffect(() => {
    const loadedChats = new Set<string>();

    const loadMessagesForChat = async (chatId: string) => {
      if (loadedChats.has(chatId) || messages[chatId]) return;

      loadedChats.add(chatId);
      const chatMessages = await loadChatMessages(chatId);

      setMessages((prev) => ({
        ...prev,
        [chatId]: chatMessages,
      }));
    };

    // Load messages for all chats that don't have messages loaded yet
    chats.forEach((chat) => {
      loadMessagesForChat(chat.id);
    });
  }, [chats]);

  const unreadTotal = chats.reduce(
    (total, chat) => total + chat.unread_count,
    0,
  );

  return (
    <ChatContext.Provider
      value={{
        chats,
        messages,
        unreadTotal,
        typingUsers,
        isConnected,
        isLoading,
        createDirectMessage,
        sendMessage,
        editMessage,
        deleteMessage,
        markAsRead,
        getChatMessages,
        getChatById,
        loadMoreMessages,
        startTyping,
        stopTyping,
        refreshChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
