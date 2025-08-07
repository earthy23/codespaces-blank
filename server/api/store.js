import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Initialize database - use the same database as the auth system
const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "uec_launcher.db");
const db = new Database(dbPath);

// Enable foreign keys for data integrity
db.pragma("foreign_keys = ON");

// Create store tables
db.exec(`
  CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    subscription_type TEXT NOT NULL CHECK (subscription_type IN ('vip', 'vip_plus', 'legend')),
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS store_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    transaction_id TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_customizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    setting_type TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(user_id, setting_type)
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions (user_id);
  CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON user_subscriptions (is_active);
  CREATE INDEX IF NOT EXISTS idx_store_purchases_user_id ON store_purchases (user_id);
  CREATE INDEX IF NOT EXISTS idx_user_customizations_user_id ON user_customizations (user_id);
`);

// Store products configuration
const STORE_PRODUCTS = {
  vip: {
    id: "vip",
    name: "VIP",
    description: "Enhanced features for power users",
    price: 9.99,
    duration_days: 30,
    features: [
      "File uploads up to 50MB",
      "Custom website colors and background",
      "Priority support",
      "VIP badge in chat and forums",
      "Access to VIP-only channels",
    ],
    limits: {
      file_upload_size: 50 * 1024 * 1024, // 50MB in bytes
      group_chat_members: 10,
      owned_servers: 3,
    },
  },
  vip_plus: {
    id: "vip_plus",
    name: "VIP++",
    description: "All VIP features plus premium voice and early access",
    price: 19.99,
    duration_days: 30,
    features: [
      "All VIP features included",
      "Better quality voice calls",
      "Early access to new features",
      "VIP++ exclusive badge",
      "Advanced voice controls",
      "Priority in voice channels",
    ],
    limits: {
      file_upload_size: 50 * 1024 * 1024, // 50MB in bytes
      group_chat_members: 10,
      owned_servers: 3,
    },
  },
  legend: {
    id: "legend",
    name: "Legend",
    description: "Ultimate experience with maximum features",
    price: 39.99,
    duration_days: 30,
    features: [
      "All VIP and VIP++ features",
      "Custom website tab name and favicon",
      "Group chats with up to 30 people",
      "Can own up to 5 servers on server list",
      "Legend exclusive badge and perks",
      "Custom profile themes",
      "Priority in all features",
    ],
    limits: {
      file_upload_size: 50 * 1024 * 1024, // 50MB in bytes
      group_chat_members: 30,
      owned_servers: 5,
    },
  },
};

// Prepared statements
const statements = {
  getUser: db.prepare(
    "SELECT id, username, email, role FROM users WHERE id = ?",
  ),

  getUserSubscription: db.prepare(`
    SELECT * FROM user_subscriptions
    WHERE user_id = ? AND is_active = 1
    ORDER BY end_date DESC LIMIT 1
  `),

  createSubscription: db.prepare(`
    INSERT INTO user_subscriptions (user_id, subscription_type, end_date, is_active)
    VALUES (?, ?, datetime('now', '+' || ? || ' days'), 1)
  `),

  deactivateOldSubscriptions: db.prepare(`
    UPDATE user_subscriptions 
    SET is_active = 0 
    WHERE user_id = ? AND is_active = 1
  `),

  createPurchase: db.prepare(`
    INSERT INTO store_purchases (user_id, product_id, product_name, price, transaction_id, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  updatePurchaseStatus: db.prepare(`
    UPDATE store_purchases 
    SET status = ?, completed_at = CURRENT_TIMESTAMP 
    WHERE transaction_id = ?
  `),

  getUserPurchases: db.prepare(`
    SELECT * FROM store_purchases 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `),

  getUserCustomization: db.prepare(`
    SELECT * FROM user_customizations 
    WHERE user_id = ? AND setting_type = ?
  `),

  setUserCustomization: db.prepare(`
    INSERT OR REPLACE INTO user_customizations (user_id, setting_type, setting_value, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `),

  getUserCustomizations: db.prepare(`
    SELECT * FROM user_customizations
    WHERE user_id = ?
  `),
};

// Helper function to get user's current subscription tier - optimized for speed
function getUserTier(userId) {
  // Use cached fallback data for quick response
  const fallbackFreeTier = {
    tier: "free",
    limits: {
      file_upload_size: 10 * 1024 * 1024,
      group_chat_members: 10,
      owned_servers: 3,
    },
  };

  const fallbackStaffTier = {
    tier: "legend",
    isStaff: true,
    limits: {
      file_upload_size: 50 * 1024 * 1024,
      group_chat_members: 30,
      owned_servers: 5,
    },
  };

  try {
    // Fast user role check with timeout protection
    let user = null;
    try {
      const userStmt =
        statements.getUser ||
        db.prepare("SELECT id, username, email, role FROM users WHERE id = ?");
      user = userStmt.get(userId);
    } catch (userError) {
      console.warn(
        "Error fetching user for tier check, using fallback:",
        userError.message,
      );
      return fallbackFreeTier;
    }

    // Admin and mod users get Legend-level features immediately
    if (user && (user.role === "admin" || user.role === "mod")) {
      return fallbackStaffTier;
    }

    // Fast subscription check
    let subscription = null;
    try {
      subscription = statements.getUserSubscription.get(userId);
    } catch (subError) {
      console.warn(
        "Error fetching subscription, using free tier:",
        subError.message,
      );
      return fallbackFreeTier;
    }

    if (!subscription) {
      return fallbackFreeTier;
    }

    // Quick date validation
    try {
      const endDate = new Date(subscription.end_date);
      const now = new Date();

      if (endDate < now) {
        // Subscription expired - deactivate asynchronously to not block response
        setTimeout(() => {
          try {
            statements.deactivateOldSubscriptions.run(userId);
          } catch (deactivateError) {
            console.warn(
              "Error deactivating old subscription:",
              deactivateError.message,
            );
          }
        }, 0);

        return fallbackFreeTier;
      }

      const product = STORE_PRODUCTS[subscription.subscription_type];
      return {
        tier: subscription.subscription_type,
        subscription,
        limits: product ? product.limits : fallbackFreeTier.limits,
      };
    } catch (dateError) {
      console.warn(
        "Error processing subscription dates, using free tier:",
        dateError.message,
      );
      return fallbackFreeTier;
    }
  } catch (error) {
    console.error("Error in getUserTier, using fallback:", error);
    return fallbackFreeTier;
  }
}

// Get store products - optimized for speed
router.get("/products", requireAuth, (req, res) => {
  try {
    // Use fast response with cached data
    const userTier = getUserTier(req.user.id);

    // Respond immediately with products
    res.json({
      products: Object.values(STORE_PRODUCTS),
      currentTier: userTier,
    });
  } catch (error) {
    console.error("Error fetching store products:", error);
    // Return fallback data even on error
    res.json({
      products: Object.values(STORE_PRODUCTS),
      currentTier: {
        tier: "free",
        limits: {
          file_upload_size: 10 * 1024 * 1024,
          group_chat_members: 10,
          owned_servers: 3,
        },
      },
    });
  }
});

// Get user's current subscription - fast response
router.get("/subscription", requireAuth, (req, res) => {
  try {
    const userTier = getUserTier(req.user.id);
    res.json(userTier);
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    // Return fallback free tier
    res.json({
      tier: "free",
      limits: {
        file_upload_size: 10 * 1024 * 1024,
        group_chat_members: 10,
        owned_servers: 3,
      },
    });
  }
});

// Purchase a product (mock implementation)
router.post("/purchase", requireAuth, (req, res) => {
  try {
    const { productId, paymentMethod = "mock" } = req.body;

    if (!STORE_PRODUCTS[productId]) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = STORE_PRODUCTS[productId];
    const transactionId = `txn_${Date.now()}_${req.user.id}`;

    // Create purchase record
    statements.createPurchase.run(
      req.user.id,
      productId,
      product.name,
      product.price,
      transactionId,
      "pending",
    );

    // For demo purposes, immediately complete the purchase
    // In a real implementation, this would integrate with a payment processor
    try {
      // Deactivate old subscriptions
      statements.deactivateOldSubscriptions.run(req.user.id);

      // Create new subscription
      statements.createSubscription.run(
        req.user.id,
        productId,
        product.duration_days,
      );

      // Update purchase status
      statements.updatePurchaseStatus.run("completed", transactionId);

      logActivity({
        action: "product_purchased",
        category: "store",
        level: "info",
        details: { productId, transactionId, price: product.price },
        userId: req.user.id,
      });

      // Broadcast WebSocket event for real-time updates
      const wss = req.app.get("wss");
      if (wss) {
        const userTier = getUserTier(req.user.id);
        wss.sendToUser(req.user.id, {
          type: "store:purchase_completed",
          data: {
            userId: req.user.id,
            productId,
            tier: userTier.tier,
            subscription: userTier.subscription,
          },
        });

        wss.sendToUser(req.user.id, {
          type: "store:subscription_updated",
          data: {
            userId: req.user.id,
            tier: userTier.tier,
            subscription: userTier,
          },
        });
      }
    } catch (error) {
      console.error("Error completing purchase:", error);
      statements.updatePurchaseStatus.run("failed", transactionId);

      return res.status(500).json({
        success: false,
        error: "Failed to complete purchase",
      });
    }

    res.json({
      success: true,
      transactionId,
      message: "Purchase initiated successfully",
    });
  } catch (error) {
    console.error("Error processing purchase:", error);
    res.status(500).json({ error: "Failed to process purchase" });
  }
});

// Get user's purchase history - fast response
router.get("/purchases", requireAuth, (req, res) => {
  try {
    const purchases = statements.getUserPurchases.all(req.user.id);
    res.json({ purchases });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    // Return empty purchases array on error
    res.json({ purchases: [] });
  }
});

// Get user customizations - fast response
router.get("/customizations", requireAuth, (req, res) => {
  try {
    const customizations = statements.getUserCustomizations.all(req.user.id);
    const userTier = getUserTier(req.user.id);

    // Convert to key-value format
    const settings = {};
    customizations.forEach((c) => {
      settings[c.setting_type] = c.setting_value;
    });

    const canCustomize =
      ["vip", "vip_plus", "legend"].includes(userTier.tier) || userTier.isStaff;

    res.json({
      customizations: settings,
      tier: userTier.tier,
      isStaff: userTier.isStaff || false,
      canCustomize,
    });
  } catch (error) {
    console.error("Error fetching customizations:", error);
    // Return empty customizations on error
    res.json({
      customizations: {},
      tier: "free",
      isStaff: false,
      canCustomize: false,
    });
  }
});

// Update user customizations
router.post("/customizations", requireAuth, (req, res) => {
  try {
    const { settingType, settingValue } = req.body;
    const userTier = getUserTier(req.user.id);

    // Check if user has permission to customize (VIP subscribers or staff)
    const canCustomize =
      ["vip", "vip_plus", "legend"].includes(userTier.tier) || userTier.isStaff;
    if (!canCustomize) {
      return res
        .status(403)
        .json({ error: "VIP subscription required for customizations" });
    }

    // Validate setting type
    const allowedSettings = [
      "website_color",
      "website_background",
      "website_tab_title",
      "website_favicon",
    ];
    if (!allowedSettings.includes(settingType)) {
      return res.status(400).json({ error: "Invalid setting type" });
    }

    // Legend-only features (or staff)
    const canUseLegendFeatures = userTier.tier === "legend" || userTier.isStaff;
    if (
      ["website_tab_title", "website_favicon"].includes(settingType) &&
      !canUseLegendFeatures
    ) {
      return res
        .status(403)
        .json({ error: "Legend subscription required for this customization" });
    }

    statements.setUserCustomization.run(req.user.id, settingType, settingValue);

    logActivity({
      action: "customization_updated",
      category: "store",
      level: "info",
      details: {
        settingType,
        userTier: userTier.tier,
        isStaff: userTier.isStaff,
      },
      userId: req.user.id,
    });

    // Broadcast WebSocket event for real-time customization updates
    const wss = req.app.get("wss");
    if (wss) {
      wss.sendToUser(req.user.id, {
        type: "store:customization_updated",
        data: {
          userId: req.user.id,
          settingType,
          settingValue,
        },
      });
    }

    res.json({ success: true, message: "Customization updated" });
  } catch (error) {
    console.error("Error updating customization:", error);
    res.status(500).json({ error: "Failed to update customization" });
  }
});

// Get user tier limits (for other APIs to use)
router.get("/limits", requireAuth, (req, res) => {
  try {
    const userTier = getUserTier(req.user.id);
    res.json(userTier.limits);
  } catch (error) {
    console.error("Error fetching user limits:", error);
    res.status(500).json({ error: "Failed to fetch user limits" });
  }
});

export default router;
export { getUserTier };
