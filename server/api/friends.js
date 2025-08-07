import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Initialize database
const dbPath = path.join(__dirname, "../data/uec.db");
const db = new Database(dbPath);

// Create friends tables
db.exec(`
  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
    requester_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(user1_id, user2_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_status (
    user_id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'playing')),
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    playing_server TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships (user1_id);
  CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships (user2_id);
  CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships (status);
  CREATE INDEX IF NOT EXISTS idx_user_status_status ON user_status (status);
`);

// Prepared statements
const statements = {
  getUser: db.prepare(
    `SELECT id, username, email, role FROM users WHERE id = ?`,
  ),
  getUserByUsername: db.prepare(
    `SELECT id, username, email, role FROM users WHERE username = ?`,
  ),

  getUserFriends: db.prepare(`
    SELECT 
      u.id,
      u.username,
      u.email,
      f.created_at as added_at,
      us.status,
      us.last_seen,
      us.playing_server
    FROM friendships f
    JOIN users u ON (
      CASE 
        WHEN f.user1_id = ? THEN u.id = f.user2_id
        ELSE u.id = f.user1_id
      END
    )
    LEFT JOIN user_status us ON u.id = us.user_id
    WHERE (f.user1_id = ? OR f.user2_id = ?) 
    AND f.status = 'accepted'
    ORDER BY us.status DESC, u.username ASC
  `),

  getFriendRequests: db.prepare(`
    SELECT 
      f.id,
      f.requester_id as from_id,
      f.user1_id,
      f.user2_id,
      f.created_at,
      u.username as from_username
    FROM friendships f
    JOIN users u ON f.requester_id = u.id
    WHERE ((f.user1_id = ? AND f.requester_id != ?) OR (f.user2_id = ? AND f.requester_id != ?))
    AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `),

  getSentRequests: db.prepare(`
    SELECT 
      f.id,
      f.user1_id,
      f.user2_id,
      f.created_at,
      u.username as to_username
    FROM friendships f
    JOIN users u ON (
      CASE 
        WHEN f.user1_id = ? THEN u.id = f.user2_id
        ELSE u.id = f.user1_id
      END
    )
    WHERE f.requester_id = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `),

  findFriendship: db.prepare(`
    SELECT * FROM friendships 
    WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
  `),

  createFriendRequest: db.prepare(`
    INSERT INTO friendships (user1_id, user2_id, status, requester_id, created_at, updated_at)
    VALUES (?, ?, 'pending', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `),

  updateFriendshipStatus: db.prepare(`
    UPDATE friendships 
    SET status = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `),

  deleteFriendship: db.prepare(`
    DELETE FROM friendships WHERE id = ?
  `),

  deleteFriendshipByUsers: db.prepare(`
    DELETE FROM friendships 
    WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
  `),

  updateUserStatus: db.prepare(`
    INSERT OR REPLACE INTO user_status (user_id, status, last_seen, playing_server, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
  `),

  getUserStatus: db.prepare(`
    SELECT status, last_seen, playing_server FROM user_status WHERE user_id = ?
  `),

  getOnlineFriends: db.prepare(`
    SELECT 
      u.id,
      u.username,
      us.status,
      us.playing_server
    FROM friendships f
    JOIN users u ON (
      CASE 
        WHEN f.user1_id = ? THEN u.id = f.user2_id
        ELSE u.id = f.user1_id
      END
    )
    JOIN user_status us ON u.id = us.user_id
    WHERE (f.user1_id = ? OR f.user2_id = ?) 
    AND f.status = 'accepted'
    AND us.status IN ('online', 'playing')
    ORDER BY us.status DESC, u.username ASC
  `),
};

// Get user's friends
router.get("/", requireAuth, (req, res) => {
  try {
    const friends = statements.getUserFriends.all(
      req.user.id,
      req.user.id,
      req.user.id,
    );

    const processedFriends = friends.map((friend) => ({
      id: friend.id,
      username: friend.username,
      status: friend.status || "offline",
      lastSeen: friend.last_seen || friend.added_at,
      addedAt: friend.added_at,
      playingServer: friend.playing_server || null,
    }));

    res.json({ friends: processedFriends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

// Get friend requests (received)
router.get("/requests", requireAuth, (req, res) => {
  try {
    const requests = statements.getFriendRequests.all(
      req.user.id,
      req.user.id,
      req.user.id,
      req.user.id,
    );

    const processedRequests = requests.map((request) => ({
      id: request.id,
      from: request.from_id,
      fromUsername: request.from_username,
      to: req.user.id,
      status: "pending",
      createdAt: request.created_at,
    }));

    res.json({ requests: processedRequests });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).json({ error: "Failed to fetch friend requests" });
  }
});

// Get sent requests
router.get("/requests/sent", requireAuth, (req, res) => {
  try {
    const requests = statements.getSentRequests.all(req.user.id, req.user.id);

    const processedRequests = requests.map((request) => ({
      id: request.id,
      from: req.user.id,
      to:
        request.user1_id === req.user.id ? request.user2_id : request.user1_id,
      toUsername: request.to_username,
      status: "pending",
      createdAt: request.created_at,
    }));

    res.json({ requests: processedRequests });
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    res.status(500).json({ error: "Failed to fetch sent requests" });
  }
});

// Send friend request
router.post("/request", requireAuth, (req, res) => {
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
      return res
        .status(400)
        .json({ error: "Cannot send friend request to yourself" });
    }

    // Check if friendship already exists
    const existingFriendship = statements.findFriendship.get(
      req.user.id,
      targetUser.id,
      targetUser.id,
      req.user.id,
    );
    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        return res.status(400).json({ error: "Already friends" });
      } else if (existingFriendship.status === "pending") {
        return res.status(400).json({ error: "Friend request already sent" });
      } else if (existingFriendship.status === "blocked") {
        return res.status(400).json({ error: "Cannot send friend request" });
      }
    }

    // Create friendship request (always put lower ID first for consistency)
    const user1Id = req.user.id < targetUser.id ? req.user.id : targetUser.id;
    const user2Id = req.user.id < targetUser.id ? targetUser.id : req.user.id;

    statements.createFriendRequest.run(user1Id, user2Id, req.user.id);

    logActivity({
      action: "friend_request_sent",
      category: "friends",
      level: "info",
      details: { targetUserId: targetUser.id, targetUsername: username },
      userId: req.user.id,
    });

    res.json({ success: true, message: "Friend request sent" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ error: "Failed to send friend request" });
  }
});

// Accept friend request
router.post("/request/:requestId/accept", requireAuth, (req, res) => {
  try {
    const { requestId } = req.params;

    // Get the request to verify it's for this user and is pending
    const requests = statements.getFriendRequests.all(
      req.user.id,
      req.user.id,
      req.user.id,
      req.user.id,
    );
    const request = requests.find((r) => r.id == requestId);

    if (!request) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    // Update status to accepted
    statements.updateFriendshipStatus.run("accepted", requestId);

    logActivity({
      action: "friend_request_accepted",
      category: "friends",
      level: "info",
      details: { requestId, fromUserId: request.from_id },
      userId: req.user.id,
    });

    res.json({ success: true, message: "Friend request accepted" });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ error: "Failed to accept friend request" });
  }
});

// Decline friend request
router.post("/request/:requestId/decline", requireAuth, (req, res) => {
  try {
    const { requestId } = req.params;

    // Get the request to verify it's for this user
    const requests = statements.getFriendRequests.all(
      req.user.id,
      req.user.id,
      req.user.id,
      req.user.id,
    );
    const request = requests.find((r) => r.id == requestId);

    if (!request) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    // Delete the request
    statements.deleteFriendship.run(requestId);

    logActivity({
      action: "friend_request_declined",
      category: "friends",
      level: "info",
      details: { requestId, fromUserId: request.from_id },
      userId: req.user.id,
    });

    res.json({ success: true, message: "Friend request declined" });
  } catch (error) {
    console.error("Error declining friend request:", error);
    res.status(500).json({ error: "Failed to decline friend request" });
  }
});

// Remove friend
router.delete("/:friendId", requireAuth, (req, res) => {
  try {
    const { friendId } = req.params;

    // Verify they are friends
    const existingFriendship = statements.findFriendship.get(
      req.user.id,
      friendId,
      friendId,
      req.user.id,
    );
    if (!existingFriendship || existingFriendship.status !== "accepted") {
      return res.status(404).json({ error: "Friendship not found" });
    }

    // Delete the friendship
    statements.deleteFriendshipByUsers.run(
      req.user.id,
      friendId,
      friendId,
      req.user.id,
    );

    logActivity({
      action: "friend_removed",
      category: "friends",
      level: "info",
      details: { friendId },
      userId: req.user.id,
    });

    res.json({ success: true, message: "Friend removed" });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

// Update user status
router.post("/status", requireAuth, (req, res) => {
  try {
    const { status, playingServer } = req.body;

    if (!["online", "offline", "playing"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    statements.updateUserStatus.run(req.user.id, status, playingServer || null);

    res.json({ success: true, message: "Status updated" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Get user status
router.get("/status/:userId", requireAuth, (req, res) => {
  try {
    const { userId } = req.params;

    const status = statements.getUserStatus.get(userId);

    res.json({
      status: status
        ? {
            status: status.status,
            lastSeen: status.last_seen,
            playingServer: status.playing_server,
          }
        : {
            status: "offline",
            lastSeen: null,
            playingServer: null,
          },
    });
  } catch (error) {
    console.error("Error fetching user status:", error);
    res.status(500).json({ error: "Failed to fetch user status" });
  }
});

// Get online friends
router.get("/online", requireAuth, (req, res) => {
  try {
    const onlineFriends = statements.getOnlineFriends.all(
      req.user.id,
      req.user.id,
      req.user.id,
    );

    const processedFriends = onlineFriends.map((friend) => ({
      id: friend.id,
      username: friend.username,
      status: friend.status,
      playingServer: friend.playing_server,
    }));

    res.json({ friends: processedFriends });
  } catch (error) {
    console.error("Error fetching online friends:", error);
    res.status(500).json({ error: "Failed to fetch online friends" });
  }
});

// Search users (for adding friends)
router.get("/search", requireAuth, (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res
        .status(400)
        .json({ error: "Search query must be at least 2 characters" });
    }

    const searchStmt = db.prepare(`
      SELECT id, username 
      FROM users 
      WHERE username LIKE ? AND id != ?
      ORDER BY username ASC
      LIMIT 20
    `);

    const users = searchStmt.all(`%${q}%`, req.user.id);

    res.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

export default router;
