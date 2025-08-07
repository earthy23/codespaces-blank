import express from "express";
import { body, validationResult, query } from "express-validator";
import { authenticateToken } from "./auth.js";
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

// Create support tickets table
db.exec(`
  CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'normal',
    assigned_to TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`);

// Create support responses table
db.exec(`
  CREATE TABLE IF NOT EXISTS support_responses (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    is_staff BOOLEAN DEFAULT FALSE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`);

const router = express.Router();

// Prepared statements
const statements = {
  createTicket: db.prepare(`
    INSERT INTO support_tickets (id, user_id, username, email, category, subject, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  getTicketById: db.prepare("SELECT * FROM support_tickets WHERE id = ?"),
  getUserTickets: db.prepare(`
    SELECT * FROM support_tickets 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `),
  getAllTickets: db.prepare(`
    SELECT * FROM support_tickets 
    ORDER BY 
      CASE status 
        WHEN 'open' THEN 1 
        WHEN 'in_progress' THEN 2 
        WHEN 'pending' THEN 3 
        WHEN 'closed' THEN 4 
      END, 
      created_at DESC
  `),
  updateTicketStatus: db.prepare(`
    UPDATE support_tickets 
    SET status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `),
  createResponse: db.prepare(`
    INSERT INTO support_responses (id, ticket_id, user_id, username, message, is_staff)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getTicketResponses: db.prepare(`
    SELECT * FROM support_responses 
    WHERE ticket_id = ? 
    ORDER BY created_at ASC
  `),
  getTicketStats: db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
    FROM support_tickets
  `),
};

// Create support ticket
router.post(
  "/tickets",
  authenticateToken,
  [
    body("category")
      .isIn(["technical", "account", "billing", "bug", "feature", "other"])
      .withMessage("Invalid category"),
    body("subject")
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Subject must be 5-200 characters"),
    body("message")
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage("Message must be 10-5000 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
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

      const { category, subject, message, email } = req.body;
      const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      statements.createTicket.run(
        ticketId,
        req.user.userId,
        req.user.username,
        email,
        category,
        subject,
        message,
      );

      await logActivity({
        action: "support_ticket_created",
        category: "support",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: { ticketId, category, subject },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(201).json({
        message: "Support ticket created successfully",
        ticketId,
      });
    } catch (error) {
      console.error("Create ticket error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get user's tickets
router.get("/tickets", authenticateToken, async (req, res) => {
  try {
    const tickets = statements.getUserTickets.all(req.user.userId);

    // Get response count for each ticket
    const ticketsWithCounts = tickets.map((ticket) => {
      const responses = statements.getTicketResponses.all(ticket.id);
      return {
        ...ticket,
        responseCount: responses.length,
        lastResponse:
          responses.length > 0 ? responses[responses.length - 1] : null,
      };
    });

    res.json({ tickets: ticketsWithCounts });
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get specific ticket with responses
router.get("/tickets/:ticketId", authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = statements.getTicketById.get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check if user owns ticket or is admin
    if (ticket.user_id !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const responses = statements.getTicketResponses.all(ticketId);

    res.json({
      ticket: {
        ...ticket,
        responses,
      },
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add response to ticket
router.post(
  "/tickets/:ticketId/responses",
  authenticateToken,
  [
    body("message")
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage("Message must be 1-5000 characters"),
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

      const { ticketId } = req.params;
      const { message } = req.body;

      const ticket = statements.getTicketById.get(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Check if user owns ticket or is admin
      if (ticket.user_id !== req.user.userId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const responseId = `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const isStaff = req.user.role === "admin";

      statements.createResponse.run(
        responseId,
        ticketId,
        req.user.userId,
        req.user.username,
        message,
        isStaff,
      );

      // Update ticket status if needed
      if (ticket.status === "closed" && !isStaff) {
        statements.updateTicketStatus.run("open", null, ticketId);
      } else if (isStaff && ticket.status === "open") {
        statements.updateTicketStatus.run(
          "in_progress",
          req.user.userId,
          ticketId,
        );
      }

      await logActivity({
        action: "support_response_added",
        category: "support",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: { ticketId, responseId, isStaff },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(201).json({
        message: "Response added successfully",
        responseId,
      });
    } catch (error) {
      console.error("Add response error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Admin: Get all tickets
router.get("/admin/tickets", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { status, category, limit = 50, offset = 0 } = req.query;

    let query = "SELECT * FROM support_tickets WHERE 1=1";
    const params = [];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    query += ` ORDER BY 
      CASE status 
        WHEN 'open' THEN 1 
        WHEN 'in_progress' THEN 2 
        WHEN 'pending' THEN 3 
        WHEN 'closed' THEN 4 
      END, 
      created_at DESC 
      LIMIT ? OFFSET ?`;

    params.push(parseInt(limit), parseInt(offset));

    const tickets = db.prepare(query).all(...params);

    // Get response counts
    const ticketsWithCounts = tickets.map((ticket) => {
      const responses = statements.getTicketResponses.all(ticket.id);
      return {
        ...ticket,
        responseCount: responses.length,
        lastResponse:
          responses.length > 0 ? responses[responses.length - 1] : null,
      };
    });

    const stats = statements.getTicketStats.get();

    res.json({
      tickets: ticketsWithCounts,
      stats,
    });
  } catch (error) {
    console.error("Admin get tickets error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: Update ticket status
router.put(
  "/admin/tickets/:ticketId/status",
  authenticateToken,
  [
    body("status")
      .isIn(["open", "in_progress", "pending", "closed"])
      .withMessage("Invalid status"),
    body("assignedTo").optional().isString(),
  ],
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { ticketId } = req.params;
      const { status, assignedTo } = req.body;

      const ticket = statements.getTicketById.get(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      statements.updateTicketStatus.run(status, assignedTo || null, ticketId);

      await logActivity({
        action: "support_ticket_updated",
        category: "support",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: {
          ticketId,
          oldStatus: ticket.status,
          newStatus: status,
          assignedTo,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ message: "Ticket status updated successfully" });
    } catch (error) {
      console.error("Update ticket status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
