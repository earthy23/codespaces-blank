import express from "express";
import multer from "multer";
import { body, validationResult } from "express-validator";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { logActivity } from "../utils/logger.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import WebSocket from "ws";
import net from "net";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory for banners
const bannersDir = path.join(__dirname, "../uploads/banners");
try {
  await fs.mkdir(bannersDir, { recursive: true });
} catch (error) {
  console.error("Error creating banners directory:", error);
}

// Configure multer for banner uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, bannersDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `banner-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Servers data store
let servers = [];

// Likes data store
let serverLikes = {};

// Export data for public API access
export const getServersData = () => ({ servers, serverLikes });
export const updateServerData = (serverData, likesData) => {
  if (serverData) servers = serverData;
  if (likesData) serverLikes = likesData;
};

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

// Check if server is online via multiple methods
const checkServerOnline = async (ip, port = 25565) => {
  // Method 1: TCP socket connection test
  const tcpTest = () => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 5000);

      socket.on("connect", () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve(true);
      });

      socket.on("error", () => {
        clearTimeout(timeout);
        resolve(false);
      });

      socket.on("timeout", () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve(false);
      });

      try {
        socket.connect(port, ip);
      } catch (error) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  };

  // Method 2: WebSocket test (for Eaglercraft servers)
  const websocketTest = () => {
    return new Promise((resolve) => {
      try {
        const wsUrl = `wss://${ip}:${port}`;
        const ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          ws.terminate();
          resolve(false);
        }, 5000);

        ws.on("open", () => {
          clearTimeout(timeout);
          ws.terminate();
          resolve(true);
        });

        ws.on("error", () => {
          clearTimeout(timeout);
          resolve(false);
        });

        ws.on("close", () => {
          clearTimeout(timeout);
          resolve(false);
        });
      } catch (error) {
        resolve(false);
      }
    });
  };

  // Try both methods, return true if either succeeds
  const [tcpResult, wsResult] = await Promise.all([tcpTest(), websocketTest()]);
  return tcpResult || wsResult;
};

// Validate IP address format
const isValidIP = (ip) => {
  // Allow hostnames and IP addresses
  if (!ip || typeof ip !== "string") return false;

  // Check for valid hostname/domain
  const hostnameRegex =
    /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*(([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?))$/;

  // Check for valid IPv4
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  return hostnameRegex.test(ip) || ipv4Regex.test(ip);
};

// Validate banner image dimensions
const validateBannerDimensions = async (filePath) => {
  try {
    const sharp = require("sharp");
    const metadata = await sharp(filePath).metadata();

    const minWidth = 400;
    const minHeight = 100;
    const maxWidth = 1920;
    const maxHeight = 600;

    if (metadata.width < minWidth || metadata.height < minHeight) {
      throw new Error(
        `Banner image must be at least ${minWidth}x${minHeight}px`,
      );
    }

    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      throw new Error(
        `Banner image must not exceed ${maxWidth}x${maxHeight}px`,
      );
    }

    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    // If sharp is not available, skip dimension validation
    console.warn("Sharp not available for image validation:", error.message);
    return { width: 0, height: 0 };
  }
};

// Get all servers
router.get("/", optionalAuth, async (req, res) => {
  try {
    // Add user-specific like status
    const userId = req.user?.userId;
    const serversWithLikes = servers.map((server) => ({
      ...server,
      hasLiked: userId
        ? (serverLikes[server.id] || []).includes(userId)
        : false,
    }));

    await logActivity({
      userId: req.user?.userId,
      username: req.user?.username,
      action: "servers_viewed",
      category: "servers",
      level: "info",
      details: { serverCount: servers.length },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ servers: serversWithLikes });
  } catch (error) {
    console.error("Error fetching servers:", error);
    res.status(500).json({ error: "Failed to fetch servers" });
  }
});

// Get top servers (for dashboard)
router.get("/top", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const topServers = servers
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit)
      .map((server) => ({
        ...server,
        hasLiked: req.user?.userId
          ? (serverLikes[server.id] || []).includes(req.user.id)
          : false,
      }));

    res.json({ servers: topServers });
  } catch (error) {
    console.error("Error fetching top servers:", error);
    res.status(500).json({ error: "Failed to fetch top servers" });
  }
});

// Add new server
router.post(
  "/",
  requireAuth,
  upload.single("banner"),
  [
    body("name")
      .notEmpty()
      .withMessage("Server name is required")
      .isLength({ min: 3, max: 50 })
      .withMessage("Server name must be 3-50 characters"),
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 10, max: 500 })
      .withMessage("Description must be 10-500 characters"),
    body("ip")
      .notEmpty()
      .withMessage("Server IP is required")
      .custom((value) => {
        if (!isValidIP(value)) {
          throw new Error("Invalid IP address or hostname format");
        }
        return true;
      }),
    body("category")
      .isIn(["survival", "creative", "pvp", "minigames", "roleplay", "modded"])
      .withMessage("Invalid category"),
    body("version").notEmpty().withMessage("Version is required"),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { name, description, ip, category, version } = req.body;
      const port = 25565; // Default Minecraft port

      if (!req.file) {
        return res.status(400).json({ error: "Banner image is required" });
      }

      // Validate banner dimensions
      try {
        await validateBannerDimensions(req.file.path);
      } catch (dimensionError) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ error: dimensionError.message });
      }

      // Check if server with same IP already exists
      const existingServer = servers.find(
        (s) => s.ip.toLowerCase() === ip.toLowerCase(),
      );
      if (existingServer) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({
          error: "A server with this IP address already exists",
        });
      }

      // Check if server is online
      console.log(`🔍 Testing connectivity to ${ip}:${port}...`);
      const isOnline = await checkServerOnline(ip, port);
      if (!isOnline) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({
          error:
            "Server must be online and accessible to be added to the list. Please ensure your server is running and ports are open.",
        });
      }

      console.log(`✅ Server ${ip}:${port} is online and accessible`);

      const serverId = `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const websocketUrl = `wss://${ip}:${port}`;

      const newServer = {
        id: serverId,
        name: name.trim(),
        description: description.trim(),
        ip: ip.trim(),
        port,
        websocketUrl,
        banner: `/api/servers/banners/${req.file.filename}`,
        category,
        isOnline: true,
        playerCount: Math.floor(Math.random() * 50),
        maxPlayers: 100,
        version: version.trim(),
        likes: 0,
        ownerId: req.user.id,
        ownerName: req.user.username,
        createdAt: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        features: [],
        voters: [],
      };

      servers.push(newServer);
      serverLikes[serverId] = [];

      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: "server_added",
        category: "servers",
        level: "info",
        details: {
          serverId,
          serverName: name,
          category,
          ip,
          port,
          bannerFile: req.file.filename,
          connectivityTest: "passed",
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(201).json({
        message: "Server added successfully",
        server: newServer,
      });
    } catch (error) {
      console.error("Error adding server:", error);

      // Clean up uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      res
        .status(500)
        .json({ error: "Failed to add server. Please try again." });
    }
  },
);

// Like/unlike server
router.post("/:serverId/like", requireAuth, async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;

    const server = servers.find((s) => s.id === serverId);
    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (!serverLikes[serverId]) {
      serverLikes[serverId] = [];
    }

    const hasLiked = serverLikes[serverId].includes(userId);

    if (hasLiked) {
      // Unlike
      serverLikes[serverId] = serverLikes[serverId].filter(
        (id) => id !== userId,
      );
      server.likes = Math.max(0, server.likes - 1);
    } else {
      // Like
      serverLikes[serverId].push(userId);
      server.likes += 1;
    }

    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: hasLiked ? "server_unliked" : "server_liked",
      category: "servers",
      level: "info",
      details: { serverId, serverName: server.name, newLikes: server.likes },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      likes: server.likes,
      hasLiked: !hasLiked,
    });
  } catch (error) {
    console.error("Error liking server:", error);
    res.status(500).json({ error: "Failed to like server" });
  }
});

// Get servers owned by current user
router.get("/my-servers", requireAuth, async (req, res) => {
  try {
    console.log("🔍 /my-servers route: req.user contents:", {
      hasUser: !!req.user,
      userKeys: req.user ? Object.keys(req.user) : "NO_USER",
      userId: req.user?.userId,
      username: req.user?.username,
      fullUser: req.user,
    });

    if (!req.user || !req.user.id) {
      console.error("❌ /my-servers route: Authentication check failed:", {
        hasUser: !!req.user,
        hasUserId: req.user?.id,
        userObject: req.user,
      });
      return res.status(401).json({ error: "User authentication required" });
    }

    const userServers = servers.filter((s) => s.ownerId === req.user.id);

    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: "my_servers_viewed",
      category: "servers",
      level: "info",
      details: { serverCount: userServers.length },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      servers: userServers,
      total: userServers.length,
    });
  } catch (error) {
    console.error("Error fetching user servers:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch your servers", details: error.message });
  }
});

// Get server details (must come after specific routes)
router.get("/:serverId", async (req, res) => {
  try {
    const { serverId } = req.params;
    const server = servers.find((s) => s.id === serverId);

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    const serverWithLikes = {
      ...server,
      hasLiked: req.user?.userId
        ? (serverLikes[serverId] || []).includes(req.user.id)
        : false,
    };

    res.json({ server: serverWithLikes });
  } catch (error) {
    console.error("Error fetching server details:", error);
    res.status(500).json({ error: "Failed to fetch server details" });
  }
});

// Delete server (admin only or owner)
router.delete("/:serverId", requireAuth, async (req, res) => {
  try {
    const { serverId } = req.params;
    const serverIndex = servers.findIndex((s) => s.id === serverId);

    if (serverIndex === -1) {
      return res.status(404).json({ error: "Server not found" });
    }

    const server = servers[serverIndex];

    // Check if user is admin or server owner
    if (req.user.role !== "admin" && req.user.id !== server.ownerId) {
      console.log("🔐 Server deletion authorization check:", {
        userRole: req.user.role,
        userId: req.user.id,
        serverOwnerId: server.ownerId,
        isAdmin: req.user.role === "admin",
        isOwner: req.user.id === server.ownerId,
      });
      return res
        .status(403)
        .json({ error: "You can only delete servers you own" });
    }

    // Delete banner file
    if (server.banner && server.banner.startsWith("/api/banners/")) {
      const bannerPath = path.join(bannersDir, path.basename(server.banner));
      await fs.unlink(bannerPath).catch(() => {});
    }

    servers.splice(serverIndex, 1);
    delete serverLikes[serverId];

    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: "server_deleted",
      category: "servers",
      level: "warning",
      details: {
        serverId,
        serverName: server.name,
        deletedBy: req.user.username,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ message: "Server deleted successfully" });
  } catch (error) {
    console.error("Error deleting server:", error);
    res.status(500).json({ error: "Failed to delete server" });
  }
});

// Serve banner images
router.get("/banners/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(bannersDir, filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: "Banner not found" });
    }
  });
});

// Update server status (background job would call this)
router.put("/:serverId/status", async (req, res) => {
  try {
    const { serverId } = req.params;
    const server = servers.find((s) => s.id === serverId);

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    console.log(`🔍 Checking status for server: ${server.name} (${server.ip})`);
    const isOnline = await checkServerOnline(server.ip, server.port);
    server.isOnline = isOnline;
    server.lastChecked = new Date().toISOString();

    // Update player count with random value
    if (isOnline) {
      server.playerCount = Math.floor(Math.random() * server.maxPlayers);
    } else {
      server.playerCount = 0;
    }

    // Log status change
    const wasOnline = server.isOnline;
    if (wasOnline !== isOnline) {
      await logActivity({
        userId: "system",
        username: "System",
        action: isOnline ? "server_online" : "server_offline",
        category: "servers",
        level: "info",
        details: {
          serverId,
          serverName: server.name,
          ip: server.ip,
          statusChange: `${wasOnline ? "online" : "offline"} -> ${isOnline ? "online" : "offline"}`,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
    }

    console.log(
      `${isOnline ? "✅" : "❌"} Server ${server.name} is ${isOnline ? "online" : "offline"}`,
    );

    res.json({
      message: "Server status updated",
      server,
      statusChanged: wasOnline !== isOnline,
    });
  } catch (error) {
    console.error("Error updating server status:", error);
    res.status(500).json({ error: "Failed to update server status" });
  }
});

// Update server details (owner only)
router.put(
  "/:serverId",
  requireAuth,
  upload.single("banner"),
  [
    body("name")
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage("Server name must be 3-50 characters"),
    body("description")
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage("Description must be 10-500 characters"),
    body("ip")
      .optional()
      .custom((value) => {
        if (value && !isValidIP(value)) {
          throw new Error("Invalid IP address or hostname format");
        }
        return true;
      }),
    body("category")
      .optional()
      .isIn(["survival", "creative", "pvp", "minigames", "roleplay", "modded"])
      .withMessage("Invalid category"),
    body("version")
      .optional()
      .notEmpty()
      .withMessage("Version cannot be empty"),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { serverId } = req.params;
      const server = servers.find((s) => s.id === serverId);

      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      // Check if user is owner or admin
      if (req.user.id !== server.ownerId && req.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "You can only edit your own servers" });
      }

      const { name, description, ip, category, version } = req.body;
      const updates = {};

      // Validate and update fields
      if (name) updates.name = name.trim();
      if (description) updates.description = description.trim();
      if (category) updates.category = category;
      if (version) updates.version = version.trim();

      // Handle IP change
      if (ip && ip !== server.ip) {
        // Check if new IP already exists
        const existingServer = servers.find(
          (s) => s.ip.toLowerCase() === ip.toLowerCase() && s.id !== serverId,
        );
        if (existingServer) {
          if (req.file) await fs.unlink(req.file.path).catch(() => {});
          return res.status(400).json({
            error: "A server with this IP address already exists",
          });
        }

        // Test connectivity to new IP
        const isOnline = await checkServerOnline(ip, 25565);
        if (!isOnline) {
          if (req.file) await fs.unlink(req.file.path).catch(() => {});
          return res.status(400).json({
            error:
              "New IP address is not accessible. Please ensure the server is running.",
          });
        }

        updates.ip = ip.trim();
        updates.websocketUrl = `wss://${ip}:25565`;
        updates.isOnline = true;
        updates.lastChecked = new Date().toISOString();
      }

      // Handle banner update
      if (req.file) {
        try {
          await validateBannerDimensions(req.file.path);

          // Delete old banner
          if (
            server.banner &&
            server.banner.startsWith("/api/servers/banners/")
          ) {
            const oldBannerPath = path.join(
              bannersDir,
              path.basename(server.banner),
            );
            await fs.unlink(oldBannerPath).catch(() => {});
          }

          updates.banner = `/api/servers/banners/${req.file.filename}`;
        } catch (dimensionError) {
          await fs.unlink(req.file.path).catch(() => {});
          return res.status(400).json({ error: dimensionError.message });
        }
      }

      // Apply updates
      Object.assign(server, updates);

      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: "server_updated",
        category: "servers",
        level: "info",
        details: {
          serverId,
          serverName: server.name,
          updates: Object.keys(updates),
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        message: "Server updated successfully",
        server,
      });
    } catch (error) {
      console.error("Error updating server:", error);

      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      res.status(500).json({ error: "Failed to update server" });
    }
  },
);

// Error handling wrapper for all routes
router.use((error, req, res, next) => {
  console.error("❌ Servers API Error:", error);
  console.error("📍 Error stack:", error.stack);
  console.error("🔗 Request details:", {
    method: req.method,
    path: req.path,
    headers: req.headers,
    user: req.user?.username || "anonymous",
  });

  res.status(500).json({
    error: "Internal server error in servers API",
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

export default router;
