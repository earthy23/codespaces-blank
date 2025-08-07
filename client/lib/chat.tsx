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
        if (process.env.NODE_ENV === 'development') {
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
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        if (process.env.NODE_ENV === 'development') {
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

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
    }
  }, [user, token]);

  const handleWebSocketMessage = (message: any) => {
    const { type, data } = message;

    switch (type) {
      case "authenticated":
        if (process.env.NODE_ENV === 'development') {
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
        console.error("WebSocket error:", message.message);
        break;
    }
  };

  // Load chats from API
  const loadChats = async () => {
    if (!user || !token) return;

    try {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      try {
        const response = await fetch("/api/chat", {
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
        throw fetchError;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn("Chat loading timed out, keeping existing data");
      } else if (error.message?.includes('Failed to fetch')) {
        console.warn("Network issue loading chats, keeping existing data");
      } else {
        console.error("Error loading chats:", error);
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
      const response = await fetch(
        `/api/chat/${chatId}/messages?limit=50&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      }
    } catch (error) {
      console.error("Error loading messages:", error);
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
      const response = await fetch("/api/chat/dm", {
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
      const response = await fetch(`/api/chat/${chatId}/messages`, {
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
      const response = await fetch(
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
      const response = await fetch(
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
      await fetch(`/api/chat/${chatId}/read`, {
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
