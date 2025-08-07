import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { logActivity } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the same database as the auth system
const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "uec_launcher.db");
const db = new Database(dbPath);

// Enable foreign keys for data integrity
db.pragma("foreign_keys = ON");

class ChatWebSocketServer {
  constructor() {
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.userChatRooms = new Map(); // userId -> Set of chatIds user is in
  }

  initialize(server) {
    // Main WebSocket for all real-time updates
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
    });

    // Legacy chat WebSocket for backward compatibility
    this.chatWss = new WebSocketServer({
      server,
      path: "/chat-ws",
    });

    this.wss.on("connection", (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.chatWss.on("connection", (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Store reference for access from Express routes
    return this;
  }

  handleConnection(ws, req) {
    ws.isAlive = true;
    ws.userId = null;
    ws.authenticated = false;

    // Heartbeat
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error("WebSocket message parsing error:", error.message || error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid message format",
          }),
        );
      }
    });

    ws.on("close", () => {
      this.handleDisconnection(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error.message || error.toString() || error);
      this.handleDisconnection(ws);
    });

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "welcome",
        message: "Connected to UEC Chat WebSocket",
      }),
    );
  }

  handleMessage(ws, message) {
    const { type, data } = message;

    switch (type) {
      case "authenticate":
        this.authenticateConnection(ws, data);
        break;

      case "join_chat":
        this.joinChatRoom(ws, data);
        break;

      case "leave_chat":
        this.leaveChatRoom(ws, data);
        break;

      case "typing_start":
        this.handleTypingStart(ws, data);
        break;

      case "typing_stop":
        this.handleTypingStop(ws, data);
        break;

      case "subscribe_store_updates":
        this.subscribeToStoreUpdates(ws, data);
        break;

      case "subscribe_admin_updates":
        this.subscribeToAdminUpdates(ws, data);
        break;

      case "request_online_users":
        this.sendOnlineUsers(ws);
        break;

      case "set_status":
        this.setUserStatus(ws, data);
        break;

      case "broadcast":
        this.handleBroadcast(ws, data);
        break;

      default:
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Unknown message type",
          }),
        );
    }
  }

  authenticateConnection(ws, data) {
    try {
      const { token } = data;

      if (!token) {
        ws.send(
          JSON.stringify({
            type: "auth_error",
            message: "Token required",
          }),
        );
        return;
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          "your-super-secret-jwt-key-change-this-in-production",
      );
      const userStmt = db.prepare(
        "SELECT id, username, email, role FROM users WHERE id = ?",
      );
      const user = userStmt.get(decoded.userId);

      if (!user) {
        ws.send(
          JSON.stringify({
            type: "auth_error",
            message: "User not found",
          }),
        );
        return;
      }

      ws.userId = user.id;
      ws.user = user;
      ws.authenticated = true;

      // Add to clients map
      if (!this.clients.has(user.id)) {
        this.clients.set(user.id, new Set());
      }
      this.clients.get(user.id).add(ws);

      // Load user's chat rooms
      this.loadUserChatRooms(user.id);

      ws.send(
        JSON.stringify({
          type: "authenticated",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        }),
      );

      // Send current online users list
      this.sendOnlineUsers(ws);

      // Notify others that user came online
      this.broadcast("user_online", {
        userId: user.id,
        username: user.username,
      });

      logActivity({
        action: "websocket_authenticated",
        category: "websocket",
        level: "info",
        details: { userId: user.id, username: user.username },
        userId: user.id,
      });
    } catch (error) {
      console.error("WebSocket authentication error:", error);
      ws.send(
        JSON.stringify({
          type: "auth_error",
          message: "Invalid token",
        }),
      );
    }
  }

  loadUserChatRooms(userId) {
    try {
      const chatStmt = db.prepare(`
        SELECT chat_id FROM chat_participants WHERE user_id = ?
      `);
      const chats = chatStmt.all(userId);

      const chatIds = new Set(chats.map((c) => c.chat_id));
      this.userChatRooms.set(userId, chatIds);
    } catch (error) {
      console.error("Error loading user chat rooms:", error);
    }
  }

  joinChatRoom(ws, data) {
    if (!ws.authenticated) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Not authenticated",
        }),
      );
      return;
    }

    const { chatId } = data;

    if (!chatId) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Chat ID required",
        }),
      );
      return;
    }

    // Verify user has access to this chat
    const userChats = this.userChatRooms.get(ws.userId);
    if (!userChats || !userChats.has(chatId)) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Access denied to chat",
        }),
      );
      return;
    }

    ws.currentChatId = chatId;

    ws.send(
      JSON.stringify({
        type: "joined_chat",
        chatId,
      }),
    );
  }

  leaveChatRoom(ws, data) {
    if (!ws.authenticated) return;

    const { chatId } = data;

    if (ws.currentChatId === chatId) {
      ws.currentChatId = null;
    }

    ws.send(
      JSON.stringify({
        type: "left_chat",
        chatId,
      }),
    );
  }

  handleTypingStart(ws, data) {
    if (!ws.authenticated || !ws.currentChatId) return;

    const { chatId } = data;
    if (chatId !== ws.currentChatId) return;

    // Broadcast typing indicator to other users in the chat
    this.broadcastToChat(
      chatId,
      {
        type: "user_typing_start",
        chatId,
        userId: ws.userId,
        username: ws.user.username,
      },
      ws.userId,
    );
  }

  handleTypingStop(ws, data) {
    if (!ws.authenticated || !ws.currentChatId) return;

    const { chatId } = data;
    if (chatId !== ws.currentChatId) return;

    // Broadcast typing stop to other users in the chat
    this.broadcastToChat(
      chatId,
      {
        type: "user_typing_stop",
        chatId,
        userId: ws.userId,
        username: ws.user.username,
      },
      ws.userId,
    );
  }

  handleDisconnection(ws) {
    if (ws.userId && this.clients.has(ws.userId)) {
      const userConnections = this.clients.get(ws.userId);
      userConnections.delete(ws);

      if (userConnections.size === 0) {
        this.clients.delete(ws.userId);
        this.userChatRooms.delete(ws.userId);

        // Notify others that user went offline
        this.broadcast("user_offline", {
          userId: ws.userId,
          username: ws.user?.username,
        });
      }
    }
  }

  // Broadcast to all users in a specific chat
  broadcastToChat(chatId, message, excludeUserId = null) {
    try {
      const participantsStmt = db.prepare(`
        SELECT user_id FROM chat_participants WHERE chat_id = ?
      `);
      const participants = participantsStmt.all(chatId);

      participants.forEach(({ user_id }) => {
        if (excludeUserId && user_id === excludeUserId) return;

        const userConnections = this.clients.get(user_id);
        if (userConnections) {
          userConnections.forEach((ws) => {
            if (ws.readyState === 1) {
              // WebSocket.OPEN
              ws.send(JSON.stringify(message));
            }
          });
        }
      });
    } catch (error) {
      console.error("Error broadcasting to chat:", error);
    }
  }

  // Broadcast to all connected clients
  broadcast(type, data) {
    const message = JSON.stringify({ type, data });

    this.clients.forEach((connections) => {
      connections.forEach((ws) => {
        if (ws.readyState === 1) {
          // WebSocket.OPEN
          ws.send(message);
        }
      });
    });
  }

  // Send message to specific user
  sendToUser(userId, message) {
    const userConnections = this.clients.get(userId);
    if (userConnections) {
      userConnections.forEach((ws) => {
        if (ws.readyState === 1) {
          // WebSocket.OPEN
          ws.send(JSON.stringify(message));
        }
      });
    }
  }

  // Health check - remove dead connections
  heartbeat() {
    this.wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        this.handleDisconnection(ws);
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }

  // Start heartbeat interval
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat();
    }, 30000); // 30 seconds
  }

  // Stop heartbeat interval
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.clients.size;
  }

  // Get users online in specific chat
  getOnlineUsersInChat(chatId) {
    const onlineUsers = [];

    try {
      const participantsStmt = db.prepare(`
        SELECT user_id FROM chat_participants WHERE chat_id = ?
      `);
      const participants = participantsStmt.all(chatId);

      participants.forEach(({ user_id }) => {
        if (this.clients.has(user_id)) {
          const userStmt = db.prepare(
            "SELECT id, username FROM users WHERE id = ?",
          );
          const user = userStmt.get(user_id);
          if (user) {
            onlineUsers.push(user);
          }
        }
      });
    } catch (error) {
      console.error("Error getting online users in chat:", error);
    }

    return onlineUsers;
  }

  // Send online users list to a specific client
  sendOnlineUsers(ws) {
    if (!ws.authenticated) return;

    const onlineUserIds = Array.from(this.clients.keys());
    ws.send(
      JSON.stringify({
        type: "online_users",
        data: { userIds: onlineUserIds },
      }),
    );
  }

  // Subscribe to store updates
  subscribeToStoreUpdates(ws, data) {
    if (!ws.authenticated) return;

    ws.subscriptions = ws.subscriptions || new Set();
    ws.subscriptions.add("store_updates");

    ws.send(
      JSON.stringify({
        type: "subscribed",
        data: { subscription: "store_updates" },
      }),
    );
  }

  // Subscribe to admin updates (admin only)
  subscribeToAdminUpdates(ws, data) {
    if (!ws.authenticated || ws.user.role !== "admin") return;

    ws.subscriptions = ws.subscriptions || new Set();
    ws.subscriptions.add("admin_updates");

    ws.send(
      JSON.stringify({
        type: "subscribed",
        data: { subscription: "admin_updates" },
      }),
    );
  }

  // Set user status
  setUserStatus(ws, data) {
    if (!ws.authenticated) return;

    const { status } = data; // 'online', 'away', 'busy'
    ws.userStatus = status;

    this.broadcast(`user_${status}`, {
      userId: ws.userId,
      username: ws.user?.username,
      status,
    });
  }

  // Handle broadcast requests (admin only)
  handleBroadcast(ws, data) {
    if (!ws.authenticated || ws.user.role !== "admin") return;

    const { event, data: eventData } = data;
    this.broadcast(event, eventData);
  }

  // Broadcast to users with specific subscription
  broadcastToSubscription(subscription, type, data) {
    this.clients.forEach((connections) => {
      connections.forEach((ws) => {
        if (ws.subscriptions && ws.subscriptions.has(subscription)) {
          if (ws.readyState === 1) {
            // WebSocket.OPEN
            ws.send(JSON.stringify({ type, data }));
          }
        }
      });
    });
  }

  // Store-specific broadcasts
  broadcastStoreUpdate(type, data) {
    this.broadcastToSubscription("store_updates", type, data);
  }

  // Admin-specific broadcasts
  broadcastAdminUpdate(type, data) {
    this.broadcastToSubscription("admin_updates", type, data);
  }

  // Get all online users
  getAllOnlineUsers() {
    const users = [];
    this.clients.forEach((connections, userId) => {
      try {
        const userStmt = db.prepare(
          "SELECT id, username, role FROM users WHERE id = ?",
        );
        const user = userStmt.get(userId);
        if (user) {
          users.push({
            ...user,
            status: Array.from(connections)[0]?.userStatus || "online",
          });
        }
      } catch (error) {
        console.error("Error getting user info:", error);
      }
    });
    return users;
  }
}

export default ChatWebSocketServer;
