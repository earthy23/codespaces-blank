import express from "express";
import { body, validationResult, query } from "express-validator";
import { authenticateToken, requireAdmin } from "./auth.js";
import { logActivity } from "../utils/logger.js";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the same database path as other modules
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "uec_launcher.db");
const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Create forum categories table
db.exec(`
  CREATE TABLE IF NOT EXISTS forum_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    color TEXT DEFAULT 'bg-blue-500/20 text-blue-600 border-blue-500/50',
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create forum topics table
db.exec(`
  CREATE TABLE IF NOT EXISTS forum_topics (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_username TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_reply_at TEXT,
    last_reply_by TEXT,
    FOREIGN KEY (category_id) REFERENCES forum_categories (id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users (id)
  )
`);

// Create forum replies table
db.exec(`
  CREATE TABLE IF NOT EXISTS forum_replies (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_username TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES forum_topics (id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users (id)
  )
`);

// Insert default categories if they don't exist
const defaultCategories = [
  {
    id: "general",
    name: "General Discussion",
    description: "General community discussions and introductions",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/50",
    order_index: 1,
  },
  {
    id: "gameplay",
    name: "Gameplay & Tips",
    description: "Share strategies, tips, and gameplay discussions",
    color: "bg-green-500/20 text-green-600 border-green-500/50",
    order_index: 2,
  },
  {
    id: "technical",
    name: "Technical Support",
    description: "Get help with technical issues and bugs",
    color: "bg-orange-500/20 text-orange-600 border-orange-500/50",
    order_index: 3,
  },
  {
    id: "suggestions",
    name: "Suggestions & Feedback",
    description: "Suggest new features and provide feedback",
    color: "bg-purple-500/20 text-purple-600 border-purple-500/50",
    order_index: 4,
  },
];

// Check if categories exist, if not create them
const existingCategoriesCount = db
  .prepare("SELECT COUNT(*) as count FROM forum_categories")
  .get().count;
if (existingCategoriesCount === 0) {
  const insertCategory = db.prepare(`
    INSERT INTO forum_categories (id, name, description, color, order_index)
    VALUES (?, ?, ?, ?, ?)
  `);

  defaultCategories.forEach((category) => {
    insertCategory.run(
      category.id,
      category.name,
      category.description,
      category.color,
      category.order_index,
    );
  });

  console.log("✅ Default forum categories created");
}

const router = express.Router();

// Prepared statements
const statements = {
  // Categories
  getCategories: db.prepare(`
    SELECT c.*, 
           COUNT(t.id) as topic_count,
           (SELECT COUNT(*) FROM forum_replies r 
            JOIN forum_topics t2 ON r.topic_id = t2.id 
            WHERE t2.category_id = c.id) as post_count,
           (SELECT t3.title FROM forum_topics t3 
            WHERE t3.category_id = c.id 
            ORDER BY t3.updated_at DESC LIMIT 1) as last_topic_title,
           (SELECT t3.author_username FROM forum_topics t3 
            WHERE t3.category_id = c.id 
            ORDER BY t3.updated_at DESC LIMIT 1) as last_topic_author,
           (SELECT t3.updated_at FROM forum_topics t3 
            WHERE t3.category_id = c.id 
            ORDER BY t3.updated_at DESC LIMIT 1) as last_topic_time
    FROM forum_categories c
    LEFT JOIN forum_topics t ON c.id = t.category_id
    WHERE c.is_active = TRUE
    GROUP BY c.id
    ORDER BY c.order_index
  `),

  // Topics
  createTopic: db.prepare(`
    INSERT INTO forum_topics (id, category_id, title, content, author_id, author_username)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getTopics: db.prepare(`
    SELECT * FROM forum_topics 
    WHERE category_id = ? 
    ORDER BY is_pinned DESC, updated_at DESC 
    LIMIT ? OFFSET ?
  `),
  getAllTopics: db.prepare(`
    SELECT t.*, c.name as category_name 
    FROM forum_topics t
    JOIN forum_categories c ON t.category_id = c.id
    ORDER BY t.is_pinned DESC, t.updated_at DESC 
    LIMIT ? OFFSET ?
  `),
  searchTopics: db.prepare(`
    SELECT t.*, c.name as category_name 
    FROM forum_topics t
    JOIN forum_categories c ON t.category_id = c.id
    WHERE t.title LIKE ? OR t.content LIKE ?
    ORDER BY t.updated_at DESC 
    LIMIT ? OFFSET ?
  `),
  getTopicById: db.prepare("SELECT * FROM forum_topics WHERE id = ?"),
  incrementTopicViews: db.prepare(
    "UPDATE forum_topics SET view_count = view_count + 1 WHERE id = ?",
  ),
  updateTopicReplyCount: db.prepare(`
    UPDATE forum_topics 
    SET reply_count = reply_count + 1, 
        updated_at = CURRENT_TIMESTAMP,
        last_reply_at = CURRENT_TIMESTAMP,
        last_reply_by = ?
    WHERE id = ?
  `),

  // Replies
  createReply: db.prepare(`
    INSERT INTO forum_replies (id, topic_id, content, author_id, author_username)
    VALUES (?, ?, ?, ?, ?)
  `),
  getTopicReplies: db.prepare(`
    SELECT * FROM forum_replies 
    WHERE topic_id = ? 
    ORDER BY created_at ASC
  `),
  getReplyById: db.prepare("SELECT * FROM forum_replies WHERE id = ?"),
  updateReply: db.prepare(`
    UPDATE forum_replies 
    SET content = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND author_id = ?
  `),
  deleteReply: db.prepare(
    "DELETE FROM forum_replies WHERE id = ? AND author_id = ?",
  ),

  // Admin functions
  pinTopic: db.prepare("UPDATE forum_topics SET is_pinned = ? WHERE id = ?"),
  lockTopic: db.prepare("UPDATE forum_topics SET is_locked = ? WHERE id = ?"),
  deleteTopic: db.prepare("DELETE FROM forum_topics WHERE id = ?"),
};

// Get all categories with stats
router.get("/categories", async (req, res) => {
  try {
    const categories = statements.getCategories.all();
    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get topics for a category or all topics
router.get("/topics", async (req, res) => {
  try {
    const { category, search, limit = 20, offset = 0 } = req.query;
    let topics;

    if (search) {
      const searchTerm = `%${search}%`;
      topics = statements.searchTopics.all(
        searchTerm,
        searchTerm,
        parseInt(limit),
        parseInt(offset),
      );
    } else if (category && category !== "all") {
      topics = statements.getTopics.all(
        category,
        parseInt(limit),
        parseInt(offset),
      );
    } else {
      topics = statements.getAllTopics.all(parseInt(limit), parseInt(offset));
    }

    res.json({ topics });
  } catch (error) {
    console.error("Get topics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new topic
router.post(
  "/topics",
  authenticateToken,
  [
    body("title")
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Title must be 5-200 characters"),
    body("content")
      .trim()
      .isLength({ min: 10, max: 10000 })
      .withMessage("Content must be 10-10000 characters"),
    body("category").isString().notEmpty().withMessage("Category is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { title, content, category } = req.body;
      const topicId = `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      statements.createTopic.run(
        topicId,
        category,
        title,
        content,
        req.user.userId,
        req.user.username,
      );

      await logActivity({
        action: "forum_topic_created",
        category: "forum",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: { topicId, category, title },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(201).json({
        message: "Topic created successfully",
        topicId,
      });
    } catch (error) {
      console.error("Create topic error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get specific topic with replies
router.get("/topics/:topicId", async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = statements.getTopicById.get(topicId);

    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    // Increment view count
    statements.incrementTopicViews.run(topicId);

    const replies = statements.getTopicReplies.all(topicId);

    res.json({
      topic: {
        ...topic,
        view_count: topic.view_count + 1,
      },
      replies,
    });
  } catch (error) {
    console.error("Get topic error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add reply to topic
router.post(
  "/topics/:topicId/replies",
  authenticateToken,
  [
    body("content")
      .trim()
      .isLength({ min: 1, max: 10000 })
      .withMessage("Content must be 1-10000 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { topicId } = req.params;
      const { content } = req.body;

      const topic = statements.getTopicById.get(topicId);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      if (topic.is_locked) {
        return res.status(403).json({ error: "Topic is locked" });
      }

      const replyId = `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      statements.createReply.run(
        replyId,
        topicId,
        content,
        req.user.userId,
        req.user.username,
      );

      // Update topic reply count and last reply info
      statements.updateTopicReplyCount.run(req.user.username, topicId);

      await logActivity({
        action: "forum_reply_created",
        category: "forum",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: { topicId, replyId },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(201).json({
        message: "Reply added successfully",
        replyId,
      });
    } catch (error) {
      console.error("Create reply error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Update reply (only by author)
router.put(
  "/replies/:replyId",
  authenticateToken,
  [
    body("content")
      .trim()
      .isLength({ min: 1, max: 10000 })
      .withMessage("Content must be 1-10000 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { replyId } = req.params;
      const { content } = req.body;

      const result = statements.updateReply.run(
        content,
        replyId,
        req.user.userId,
      );

      if (result.changes === 0) {
        return res
          .status(404)
          .json({ error: "Reply not found or access denied" });
      }

      await logActivity({
        action: "forum_reply_updated",
        category: "forum",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: { replyId },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ message: "Reply updated successfully" });
    } catch (error) {
      console.error("Update reply error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Delete reply (only by author or admin)
router.delete("/replies/:replyId", authenticateToken, async (req, res) => {
  try {
    const { replyId } = req.params;
    const reply = statements.getReplyById.get(replyId);

    if (!reply) {
      return res.status(404).json({ error: "Reply not found" });
    }

    // Check if user owns reply or is admin
    if (reply.author_id !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = statements.deleteReply.run(replyId, reply.author_id);

    await logActivity({
      action: "forum_reply_deleted",
      category: "forum",
      level: "info",
      userId: req.user.userId,
      username: req.user.username,
      details: { replyId, topicId: reply.topic_id },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ message: "Reply deleted successfully" });
  } catch (error) {
    console.error("Delete reply error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: Pin/Unpin topic
router.put(
  "/admin/topics/:topicId/pin",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { topicId } = req.params;
      const { pinned } = req.body;

      const topic = statements.getTopicById.get(topicId);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      statements.pinTopic.run(pinned, topicId);

      await logActivity({
        action: pinned ? "forum_topic_pinned" : "forum_topic_unpinned",
        category: "forum",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: { topicId },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        message: `Topic ${pinned ? "pinned" : "unpinned"} successfully`,
      });
    } catch (error) {
      console.error("Pin topic error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Admin: Lock/Unlock topic
router.put(
  "/admin/topics/:topicId/lock",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { topicId } = req.params;
      const { locked } = req.body;

      const topic = statements.getTopicById.get(topicId);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      statements.lockTopic.run(locked, topicId);

      await logActivity({
        action: locked ? "forum_topic_locked" : "forum_topic_unlocked",
        category: "forum",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: { topicId },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        message: `Topic ${locked ? "locked" : "unlocked"} successfully`,
      });
    } catch (error) {
      console.error("Lock topic error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Admin: Delete topic
router.delete(
  "/admin/topics/:topicId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { topicId } = req.params;

      const topic = statements.getTopicById.get(topicId);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      statements.deleteTopic.run(topicId);

      await logActivity({
        action: "forum_topic_deleted",
        category: "forum",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: { topicId, title: topic.title },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ message: "Topic deleted successfully" });
    } catch (error) {
      console.error("Delete topic error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
