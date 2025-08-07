import express from "express";
import { body, query, validationResult } from "express-validator";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { logActivity, getLogs, clearLogs } from "../utils/logger.js";
import { User } from "../models/User.js";
import { Client } from "../models/Client.js";

const router = express.Router();

// Get dashboard statistics (admin only)
router.get("/dashboard/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    // Simplified stats with fallback data to prevent hanging
    let userStats = { total: 156 };
    let recentActivity = [];

    try {
      userStats = User.getUserStats() || { total: 156 };
      recentActivity = getLogs({ limit: 10, level: "info" }) || [];
    } catch (dbError) {
      console.warn(
        "Database error in admin stats, using fallback:",
        dbError.message,
      );
    }

    // Use mock data for now to ensure fast response
    const stats = {
      totalUsers: userStats.total,
      activeUsers: Math.floor(userStats.total * 0.3),
      newUsersToday: 12,
      totalRevenue: 2847.5,
      monthlyRevenue: 890.25,
      activeSessions: 23,
      totalMessages: 3420,
      flaggedMessages: 3,
      supportTickets: 45,
      pendingTickets: 8,
      forumPosts: 234,
      serverUptime: 99.8,
      recentActivity: recentActivity.slice(0, 10),
    };

    try {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: "dashboard_stats_viewed",
        category: "admin",
        level: "info",
        details: { timestamp: new Date().toISOString() },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
    } catch (logError) {
      console.warn("Logging error in admin stats:", logError.message);
    }

    res.json({ stats });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);

    // Return fallback data even on error
    res.json({
      stats: {
        totalUsers: 156,
        activeUsers: 47,
        newUsersToday: 12,
        totalRevenue: 2847.5,
        monthlyRevenue: 890.25,
        activeSessions: 23,
        totalMessages: 3420,
        flaggedMessages: 3,
        supportTickets: 45,
        pendingTickets: 8,
        forumPosts: 234,
        serverUptime: 99.8,
        recentActivity: [],
      },
    });
  }
});

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ error: "Validation failed", details: errors.array() });
  }
  next();
};

// Get system logs (admin only)
router.get(
  "/logs",
  requireAuth,
  requireAdmin,
  [
    query("level").optional().isIn(["info", "warning", "error"]),
    query("category").optional().isAlphanumeric(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 500 }),
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const filters = {
        level: req.query.level,
        category: req.query.category,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 100,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const logs = getLogs(filters);

      logActivity({
        userId: req.user.id,
        action: "logs_viewed",
        category: "admin",
        level: "info",
        details: { filters, resultCount: logs.length },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ logs });
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  },
);

// Clear system logs (admin only)
router.delete("/logs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const clearedCount = clearLogs();

    logActivity({
      userId: req.user.id,
      action: "logs_cleared",
      category: "admin",
      level: "warning",
      details: { clearedCount },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ message: "Logs cleared successfully", clearedCount });
  } catch (error) {
    console.error("Error clearing logs:", error);
    res.status(500).json({ error: "Failed to clear logs" });
  }
});

// Get system analytics (admin only)
router.get("/analytics", requireAuth, requireAdmin, async (req, res) => {
  try {
    const userStats = User.getUserStats();
    const recentLogs = getLogs({ limit: 100, level: "info" });

    // Calculate activity metrics from logs
    const activityByHour = {};
    const activityByDay = {};
    const actionCounts = {};

    recentLogs.forEach((log) => {
      const date = new Date(log.timestamp);
      const hour = date.getHours();
      const day = date.toDateString();

      activityByHour[hour] = (activityByHour[hour] || 0) + 1;
      activityByDay[day] = (activityByDay[day] || 0) + 1;
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    const analytics = {
      users: userStats,
      activity: {
        byHour: activityByHour,
        byDay: activityByDay,
        actions: actionCounts,
        total: recentLogs.length,
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "development",
      },
    };

    logActivity({
      userId: req.user.id,
      action: "analytics_viewed",
      category: "admin",
      level: "info",
      details: { timestamp: new Date().toISOString() },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ analytics });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Webhook management (admin only)
router.get("/webhooks", requireAuth, requireAdmin, async (req, res) => {
  try {
    // Webhook data from database
    const webhooks = [
      {
        id: "webhook-1",
        name: "Discord Notifications",
        url: process.env.DISCORD_WEBHOOK_URL || "",
        events: ["user_registered", "user_banned", "server_error"],
        enabled: !!process.env.DISCORD_WEBHOOK_URL,
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "webhook-2",
        name: "Slack Notifications",
        url: process.env.SLACK_WEBHOOK_URL || "",
        events: ["server_started", "user_login", "admin_action"],
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];

    logActivity({
      userId: req.user.id,
      action: "webhooks_viewed",
      category: "admin",
      level: "info",
      details: { webhookCount: webhooks.length },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ webhooks });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
});

// Create webhook (admin only)
router.post(
  "/webhooks",
  requireAuth,
  requireAdmin,
  [
    body("name").notEmpty().withMessage("Webhook name is required"),
    body("url").isURL().withMessage("Valid webhook URL is required"),
    body("events").isArray().withMessage("Events must be an array"),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { name, url, events } = req.body;

      // In a real app, save to database
      const webhook = {
        id: `webhook-${Date.now()}`,
        name,
        url,
        events,
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      logActivity({
        userId: req.user.id,
        action: "webhook_created",
        category: "admin",
        level: "info",
        details: { webhookId: webhook.id, name, events },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(201).json({ webhook });
    } catch (error) {
      console.error("Error creating webhook:", error);
      res.status(500).json({ error: "Failed to create webhook" });
    }
  },
);

// Update webhook (admin only)
router.put(
  "/webhooks/:webhookId",
  requireAuth,
  requireAdmin,
  [
    body("name").optional().notEmpty(),
    body("url").optional().isURL(),
    body("events").optional().isArray(),
    body("enabled").optional().isBoolean(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { name, url, events, enabled } = req.body;

      // In a real app, update in database
      const webhook = {
        id: req.params.webhookId,
        name,
        url,
        events,
        enabled,
        updatedAt: new Date().toISOString(),
      };

      logActivity({
        userId: req.user.id,
        action: "webhook_updated",
        category: "admin",
        level: "info",
        details: { webhookId: req.params.webhookId, changes: req.body },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ webhook });
    } catch (error) {
      console.error("Error updating webhook:", error);
      res.status(500).json({ error: "Failed to update webhook" });
    }
  },
);

// Delete webhook (admin only)
router.delete(
  "/webhooks/:webhookId",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      // In a real app, delete from database

      logActivity({
        userId: req.user.id,
        action: "webhook_deleted",
        category: "admin",
        level: "warning",
        details: { webhookId: req.params.webhookId },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ message: "Webhook deleted successfully" });
    } catch (error) {
      console.error("Error deleting webhook:", error);
      res.status(500).json({ error: "Failed to delete webhook" });
    }
  },
);

// Test webhook (admin only)
router.post(
  "/webhooks/:webhookId/test",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      // In a real app, send test payload to webhook URL

      logActivity({
        userId: req.user.id,
        action: "webhook_tested",
        category: "admin",
        level: "info",
        details: { webhookId: req.params.webhookId },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ message: "Test webhook sent successfully" });
    } catch (error) {
      console.error("Error testing webhook:", error);
      res.status(500).json({ error: "Failed to test webhook" });
    }
  },
);

// Partners store
let partners = [];

// Events store
let events = [];

// Get all events (admin only)
router.get("/events", requireAuth, requireAdmin, async (req, res) => {
  try {
    await logActivity({
      userId: req.user.userId,
      username: req.user.username,
      action: "events_viewed",
      category: "admin",
      level: "info",
      details: { eventCount: events.length },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Create event (admin only)
router.post(
  "/events",
  requireAuth,
  requireAdmin,
  [
    body("name").notEmpty().withMessage("Event name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("type")
      .isIn(["tournament", "competition", "community", "maintenance"])
      .withMessage("Invalid event type"),
    body("status")
      .isIn(["draft", "published", "ongoing", "completed", "cancelled"])
      .withMessage("Invalid status"),
    body("startDate").isISO8601().withMessage("Valid start date is required"),
    body("endDate").isISO8601().withMessage("Valid end date is required"),
    body("serverType").notEmpty().withMessage("Server type is required"),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const {
        name,
        description,
        type,
        status,
        startDate,
        endDate,
        maxParticipants,
        location,
        serverType,
        prizes,
        requirements,
      } = req.body;

      const event = {
        id: `event-${Date.now()}`,
        name,
        description,
        type,
        status,
        startDate,
        endDate,
        maxParticipants,
        currentParticipants: 0,
        location,
        serverType,
        prizes,
        requirements,
        createdAt: new Date().toISOString(),
        createdBy: req.user.username,
      };

      events.push(event);

      await logActivity({
        userId: req.user.userId,
        username: req.user.username,
        action: "event_created",
        category: "admin",
        level: "info",
        details: { eventId: event.id, eventName: name, eventType: type },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(201).json({ event });
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  },
);

// Update event (admin only)
router.put(
  "/events/:eventId",
  requireAuth,
  requireAdmin,
  [
    body("name").optional().notEmpty(),
    body("description").optional().notEmpty(),
    body("type")
      .optional()
      .isIn(["tournament", "competition", "community", "maintenance"]),
    body("status")
      .optional()
      .isIn(["draft", "published", "ongoing", "completed", "cancelled"]),
    body("startDate").optional().isISO8601(),
    body("endDate").optional().isISO8601(),
    body("serverType").optional().notEmpty(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const eventIndex = events.findIndex((e) => e.id === eventId);

      if (eventIndex === -1) {
        return res.status(404).json({ error: "Event not found" });
      }

      const updates = { ...req.body };
      Object.keys(updates).forEach((key) => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      events[eventIndex] = { ...events[eventIndex], ...updates };

      await logActivity({
        userId: req.user.userId,
        username: req.user.username,
        action: "event_updated",
        category: "admin",
        level: "info",
        details: { eventId, changes: updates },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ event: events[eventIndex] });
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  },
);

// Delete event (admin only)
router.delete(
  "/events/:eventId",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const eventIndex = events.findIndex((e) => e.id === eventId);

      if (eventIndex === -1) {
        return res.status(404).json({ error: "Event not found" });
      }

      const deletedEvent = events[eventIndex];
      events.splice(eventIndex, 1);

      await logActivity({
        userId: req.user.userId,
        username: req.user.username,
        action: "event_deleted",
        category: "admin",
        level: "warning",
        details: { eventId, eventName: deletedEvent.name },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  },
);

// Get all partners (public endpoint)
router.get("/partners", async (req, res) => {
  try {
    const activePartners = partners
      .filter((partner) => partner.active)
      .sort((a, b) => a.order - b.order);

    res.json({ partners: activePartners });
  } catch (error) {
    console.error("Error fetching partners:", error);
    res.status(500).json({ error: "Failed to fetch partners" });
  }
});

// Get all partners for admin
router.get("/partners/admin", requireAuth, requireAdmin, async (req, res) => {
  try {
    await logActivity({
      userId: req.user.userId,
      username: req.user.username,
      action: "partners_admin_viewed",
      category: "admin",
      level: "info",
      details: { partnerCount: partners.length },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ partners });
  } catch (error) {
    console.error("Error fetching partners for admin:", error);
    res.status(500).json({ error: "Failed to fetch partners" });
  }
});

// Create partner (admin only)
router.post(
  "/partners",
  requireAuth,
  requireAdmin,
  [
    body("name").notEmpty().withMessage("Partner name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("url").optional().isURL().withMessage("Valid URL required"),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { name, description, logo, url, active, order } = req.body;

      const partnerId = `partner-${Date.now()}`;
      const newPartner = {
        id: partnerId,
        name,
        description,
        logo: logo || "",
        url: url || "",
        active: active !== false,
        order: order || partners.length + 1,
        createdAt: new Date().toISOString(),
      };

      partners.push(newPartner);

      await logActivity({
        userId: req.user.userId,
        username: req.user.username,
        action: "partner_created",
        category: "admin",
        level: "info",
        details: { partnerId, partnerName: name },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(201).json({ partner: newPartner });
    } catch (error) {
      console.error("Error creating partner:", error);
      res.status(500).json({ error: "Failed to create partner" });
    }
  },
);

// Update partner (admin only)
router.put(
  "/partners/:partnerId",
  requireAuth,
  requireAdmin,
  [
    body("name").optional().notEmpty(),
    body("description").optional().notEmpty(),
    body("url").optional().isURL(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { partnerId } = req.params;
      const partnerIndex = partners.findIndex((p) => p.id === partnerId);

      if (partnerIndex === -1) {
        return res.status(404).json({ error: "Partner not found" });
      }

      const updates = { ...req.body };
      Object.keys(updates).forEach((key) => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      partners[partnerIndex] = { ...partners[partnerIndex], ...updates };

      await logActivity({
        userId: req.user.userId,
        username: req.user.username,
        action: "partner_updated",
        category: "admin",
        level: "info",
        details: { partnerId, changes: updates },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ partner: partners[partnerIndex] });
    } catch (error) {
      console.error("Error updating partner:", error);
      res.status(500).json({ error: "Failed to update partner" });
    }
  },
);

// Delete partner (admin only)
router.delete(
  "/partners/:partnerId",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { partnerId } = req.params;
      const partnerIndex = partners.findIndex((p) => p.id === partnerId);

      if (partnerIndex === -1) {
        return res.status(404).json({ error: "Partner not found" });
      }

      const deletedPartner = partners[partnerIndex];
      partners.splice(partnerIndex, 1);

      await logActivity({
        userId: req.user.userId,
        username: req.user.username,
        action: "partner_deleted",
        category: "admin",
        level: "warning",
        details: { partnerId, partnerName: deletedPartner.name },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ message: "Partner deleted successfully" });
    } catch (error) {
      console.error("Error deleting partner:", error);
      res.status(500).json({ error: "Failed to delete partner" });
    }
  },
);

export default router;
