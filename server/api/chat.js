import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../utils/logger.js";
import { getUserTier } from "./store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Initialize database - use the same database as the auth system
const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "uec_launcher.db");
const db = new Database(dbPath);

// Enable foreign keys for data integrity
db.pragma("foreign_keys = ON");

// Create chat tables
db.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('dm', 'group')),
    name TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(chat_id, user_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'system', 'file')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    edited_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id);
  CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);
  CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants (user_id);
`);

// Prepared statements
const statements = {
  getUser: db.prepare(
    `SELECT id, username, email, role FROM users WHERE id = ?`,
  ),
  getUserByUsername: db.prepare(
    `SELECT id, username, email, role FROM users WHERE username = ?`,
  ),

  getUserChats: db.prepare(`
    SELECT 
      c.*,
      (
        SELECT COUNT(*) 
        FROM messages m 
        WHERE m.chat_id = c.id 
        AND m.created_at > cp.last_read_at 
        AND m.sender_id != ?
        AND m.deleted_at IS NULL
      ) as unread_count,
      (
        SELECT json_object(
          'id', m.id,
          'content', m.content,
          'sender_id', m.sender_id,
          'sender_username', u.username,
          'created_at', m.created_at,
          'type', m.type
        )
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = c.id AND m.deleted_at IS NULL
        ORDER BY m.created_at DESC
        LIMIT 1
      ) as last_message
    FROM chats c
    JOIN chat_participants cp ON c.id = cp.chat_id
    WHERE cp.user_id = ?
    ORDER BY c.updated_at DESC
  `),

  getChatById: db.prepare(`
    SELECT c.*, 
    GROUP_CONCAT(u.username) as participant_usernames,
    GROUP_CONCAT(cp.user_id) as participant_ids
    FROM chats c
    JOIN chat_participants cp ON c.id = cp.chat_id
    JOIN users u ON cp.user_id = u.id
    WHERE c.id = ? AND cp.user_id = ?
    GROUP BY c.id
  `),

  getChatMessages: db.prepare(`
    SELECT 
      m.*,
      u.username as sender_username
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    JOIN chat_participants cp ON m.chat_id = cp.chat_id
    WHERE m.chat_id = ? AND cp.user_id = ? AND m.deleted_at IS NULL
    ORDER BY m.created_at ASC
    LIMIT ? OFFSET ?
  `),

  createChat: db.prepare(`
    INSERT INTO chats (id, type, name, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `),

  addParticipant: db.prepare(`
    INSERT INTO chat_participants (chat_id, user_id, joined_at, last_read_at)
    VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `),

  createMessage: db.prepare(`
    INSERT INTO messages (id, chat_id, sender_id, content, type, created_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `),

  updateChatTimestamp: db.prepare(`
    UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `),

  updateLastRead: db.prepare(`
    UPDATE chat_participants 
    SET last_read_at = CURRENT_TIMESTAMP 
    WHERE chat_id = ? AND user_id = ?
  `),

  findDirectMessage: db.prepare(`
    SELECT c.id FROM chats c
    JOIN chat_participants cp1 ON c.id = cp1.chat_id
    JOIN chat_participants cp2 ON c.id = cp2.chat_id
    WHERE c.type = 'dm' 
    AND cp1.user_id = ? 
    AND cp2.user_id = ?
    AND cp1.user_id != cp2.user_id
  `),

  deleteMessage: db.prepare(`
    UPDATE messages SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND sender_id = ?
  `),

  editMessage: db.prepare(`
    UPDATE messages SET content = ?, edited_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND sender_id = ? AND deleted_at IS NULL
  `),
};

// Get user's chats
router.get("/", requireAuth, (req, res) => {
  try {
    const chats = statements.getUserChats.all(req.user.id, req.user.id);

    const processedChats = chats.map((chat) => ({
      ...chat,
      last_message: chat.last_message ? JSON.parse(chat.last_message) : null,
      unread_count: chat.unread_count || 0,
    }));

    res.json({ chats: processedChats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// Get specific chat details
router.get("/:chatId", requireAuth, (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = statements.getChatById.get(chatId, req.user.id);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const participants = chat.participant_ids.split(",");
    const participantUsernames = chat.participant_usernames.split(",");

    res.json({
      chat: {
        ...chat,
        participants,
        participant_usernames: participantUsernames,
      },
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

// Get messages for a chat
router.get("/:chatId/messages", requireAuth, (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = statements.getChatMessages.all(
      chatId,
      req.user.id,
      limit,
      offset,
    );

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Create a new group chat
router.post("/group", requireAuth, (req, res) => {
  try {
    const { name, participants } = req.body;

    if (!name || !participants || !Array.isArray(participants)) {
      return res
        .status(400)
        .json({ error: "Group name and participants are required" });
    }

    const userTier = getUserTier(req.user.id);
    const maxMembers = userTier.limits.group_chat_members;

    // Include the creator in the participant count
    const totalMembers = participants.length + 1;

    if (totalMembers > maxMembers) {
      return res.status(403).json({
        error: `Group chat limit exceeded. Your tier allows ${maxMembers} members maximum.`,
      });
    }

    // Validate all participants exist
    const participantUsers = [];
    for (const username of participants) {
      const user = statements.getUserByUsername.get(username);
      if (!user) {
        return res.status(400).json({ error: `User ${username} not found` });
      }
      if (user.id === req.user.id) {
        return res
          .status(400)
          .json({ error: "Cannot add yourself to the group" });
      }
      participantUsers.push(user);
    }

    // Create new group chat
    const chatId = `group-${Date.now()}-${req.user.id}`;

    statements.createChat.run(chatId, "group", name, req.user.id);

    // Add creator as participant
    statements.addParticipant.run(chatId, req.user.id);

    // Add all other participants
    participantUsers.forEach((user) => {
      statements.addParticipant.run(chatId, user.id);
    });

    logActivity({
      action: "group_chat_created",
      category: "chat",
      level: "info",
      details: {
        chatId,
        participantCount: totalMembers,
        userTier: userTier.tier,
      },
      userId: req.user.id,
    });

    res.json({ chatId, message: "Group chat created successfully" });
  } catch (error) {
    console.error("Error creating group chat:", error);
    res.status(500).json({ error: "Failed to create group chat" });
  }
});

// Create a new direct message chat
router.post("/dm", requireAuth, (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const targetUser = statements.getUserByUsername.get(username);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: "Cannot create DM with yourself" });
    }

    // Check if DM already exists
    const existingDM = statements.findDirectMessage.get(
      req.user.id,
      targetUser.id,
    );
    if (existingDM) {
      return res.json({ chatId: existingDM.id });
    }

    // Create new DM
    const chatId = `dm-${Date.now()}-${req.user.id}-${targetUser.id}`;

    statements.createChat.run(chatId, "dm", null, req.user.id);
    statements.addParticipant.run(chatId, req.user.id);
    statements.addParticipant.run(chatId, targetUser.id);

    logActivity({
      action: "chat_created",
      category: "chat",
      level: "info",
      details: {
        chatId,
        type: "dm",
        participants: [req.user.id, targetUser.id],
      },
      userId: req.user.id,
    });

    res.json({ chatId });
  } catch (error) {
    console.error("Error creating DM:", error);
    res.status(500).json({ error: "Failed to create direct message" });
  }
});

// Send a message
router.post("/:chatId/messages", requireAuth, (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = "text" } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Verify user is participant in chat
    const chat = statements.getChatById.get(chatId, req.user.id);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found or access denied" });
    }

    const messageId = `msg-${Date.now()}-${req.user.id}`;

    statements.createMessage.run(
      messageId,
      chatId,
      req.user.id,
      content.trim(),
      type,
    );
    statements.updateChatTimestamp.run(chatId);

    const message = {
      id: messageId,
      chat_id: chatId,
      sender_id: req.user.id,
      sender_username: req.user.username,
      content: content.trim(),
      type,
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
    };

    // Emit to WebSocket clients if available
    if (req.app.get("wss")) {
      req.app.get("wss").broadcast("message", {
        chatId,
        message,
      });
    }

    logActivity({
      action: "message_sent",
      category: "chat",
      level: "info",
      details: { chatId, messageId, type },
      userId: req.user.id,
    });

    res.json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Mark chat as read
router.post("/:chatId/read", requireAuth, (req, res) => {
  try {
    const { chatId } = req.params;

    statements.updateLastRead.run(chatId, req.user.id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking chat as read:", error);
    res.status(500).json({ error: "Failed to mark chat as read" });
  }
});

// Delete a message
router.delete("/:chatId/messages/:messageId", requireAuth, (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    const result = statements.deleteMessage.run(messageId, req.user.id);

    if (result.changes === 0) {
      return res
        .status(404)
        .json({ error: "Message not found or access denied" });
    }

    // Emit to WebSocket clients if available
    if (req.app.get("wss")) {
      req.app.get("wss").broadcast("message_deleted", {
        chatId,
        messageId,
      });
    }

    logActivity({
      action: "message_deleted",
      category: "chat",
      level: "info",
      details: { chatId, messageId },
      userId: req.user.id,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Edit a message
router.put("/:chatId/messages/:messageId", requireAuth, (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const result = statements.editMessage.run(
      content.trim(),
      messageId,
      req.user.id,
    );

    if (result.changes === 0) {
      return res
        .status(404)
        .json({ error: "Message not found or access denied" });
    }

    // Emit to WebSocket clients if available
    if (req.app.get("wss")) {
      req.app.get("wss").broadcast("message_edited", {
        chatId,
        messageId,
        newContent: content.trim(),
      });
    }

    logActivity({
      action: "message_edited",
      category: "chat",
      level: "info",
      details: { chatId, messageId },
      userId: req.user.id,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({ error: "Failed to edit message" });
  }
});

export default router;
