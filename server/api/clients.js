import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { body, validationResult } from "express-validator";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../utils/logger.js";
import { Client } from "../models/Client.js";
import {
  validateClientZip,
  extractClientZip,
  getClientMetadata,
} from "../utils/zipValidator.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads/clients");
const downloadsDir = path.join(__dirname, "../downloads");

try {
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.mkdir(downloadsDir, { recursive: true });
} catch (error) {
  console.error("Error creating directories:", error);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `client-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".zip"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only ZIP files are allowed. ZIP must contain a folder with index.html",
        ),
      );
    }
  },
});

// Get all clients (public endpoint)
router.get("/", async (req, res) => {
  try {
    const { admin } = req.query;
    let clients;

    if (admin === "true" && req.user?.role === "admin") {
      // Admin view - get all clients
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      clients = Client.getAll(limit, offset);
      const total = Client.getCount();

      return res.json({
        clients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } else {
      // Public view - only enabled clients
      clients = Client.getEnabled();
    }

    await logActivity({
      action: "clients_list_viewed",
      category: "system",
      level: "info",
      userId: req.user?.userId,
      username: req.user?.username,
      details: { clientCount: clients.length, adminView: admin === "true" },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      clients,
      total: clients.length,
    });
  } catch (error) {
    console.error("Clients list error:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// Get specific client details
router.get("/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = Client.findById(clientId);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Only show disabled clients to admins
    if (!client.enabled && req.user?.role !== "admin") {
      return res.status(404).json({ error: "Client not available" });
    }

    await logActivity({
      action: "client_details_viewed",
      category: "system",
      level: "info",
      userId: req.user?.userId,
      username: req.user?.username,
      details: { clientId, clientName: client.name },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json(client);
  } catch (error) {
    console.error("Client details error:", error);
    res.status(500).json({ error: "Failed to fetch client details" });
  }
});

// Upload new client (admin only)
router.post(
  "/upload",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  [
    body("name").notEmpty().withMessage("Client name is required"),
    body("version").notEmpty().withMessage("Version is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("type")
      .isIn(["eaglercraft", "modded", "vanilla"])
      .withMessage("Invalid client type"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded file if validation fails
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Client file is required" });
      }

      const {
        name,
        version,
        description,
        type,
        enabled,
        features,
        requirements,
      } = req.body;

      // Validate zip file structure
      console.log("🔍 Validating uploaded zip file...");
      let zipValidation;
      try {
        zipValidation = await validateClientZip(req.file.path);
        console.log("✅ Zip validation passed:", zipValidation);
      } catch (validationError) {
        console.error("❌ Zip validation failed:", validationError.message);
        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({
          error: "Invalid client zip file",
          details: validationError.message,
        });
      }

      // Extract zip to analyze client
      const extractPath = path.join(
        __dirname,
        "../extracted",
        `client-${Date.now()}`,
      );
      let extractResult;
      try {
        extractResult = await extractClientZip(req.file.path, extractPath);
        console.log("📦 Zip extracted successfully:", extractResult);
      } catch (extractError) {
        console.error("❌ Zip extraction failed:", extractError.message);
        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({
          error: "Failed to extract client zip",
          details: extractError.message,
        });
      }

      // Get client metadata from extracted files
      let clientMetadata;
      try {
        clientMetadata = await getClientMetadata(
          extractResult.clientFolderPath,
        );
        console.log("📋 Client metadata:", clientMetadata);
      } catch (metadataError) {
        console.warn(
          "⚠️ Could not extract client metadata:",
          metadataError.message,
        );
        clientMetadata = {
          title: name,
          version: version,
          description: description,
        };
      }

      // Get file stats
      const fileStats = await fs.stat(req.file.path);

      // Parse features
      const featuresList = features
        ? features
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f)
        : [];

      // Use metadata to enhance client info if not provided
      const finalName = name || clientMetadata.title || "Unnamed Client";
      const finalVersion = version || clientMetadata.version || "1.8.8";
      const finalDescription =
        description || clientMetadata.description || "Eaglercraft client";

      const clientId = Client.create({
        name: finalName,
        version: finalVersion,
        description: finalDescription,
        type,
        enabled: enabled === "true",
        fileSize: fileStats.size,
        fileName: req.file.filename,
        filePath: req.file.path,
        extractPath: extractPath,
        clientFolderPath: extractResult.clientFolderPath,
        features: featuresList,
        requirements: requirements || "",
        uploaderId: req.user.userId,
        uploaderName: req.user.username,
        metadata: JSON.stringify(clientMetadata),
        zipValidation: JSON.stringify(zipValidation),
      });

      await logActivity({
        action: "client_uploaded",
        category: "admin",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: {
          clientId,
          clientName: finalName,
          version: finalVersion,
          fileSize: fileStats.size,
          fileName: req.file.filename,
          zipValidated: true,
          extractedFiles: extractResult.extractedFiles,
          hasMetadata: !!clientMetadata.hasIndex,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      const client = Client.findById(clientId);
      res.status(201).json({
        message: "Client uploaded successfully",
        client,
      });
    } catch (error) {
      console.error("Client upload error:", error);

      // Clean up uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      res.status(500).json({ error: "Failed to upload client" });
    }
  },
);

// Update client (admin only)
router.put(
  "/:clientId",
  requireAuth,
  requireAdmin,
  [
    body("name").optional().notEmpty(),
    body("version").optional().notEmpty(),
    body("description").optional().notEmpty(),
    body("type").optional().isIn(["eaglercraft", "modded", "vanilla"]),
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

      const { clientId } = req.params;
      const client = Client.findById(clientId);

      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const updates = {
        name: req.body.name,
        version: req.body.version,
        description: req.body.description,
        type: req.body.type,
        enabled: req.body.enabled,
        features: req.body.features,
        requirements: req.body.requirements,
      };

      // Remove undefined values
      Object.keys(updates).forEach((key) => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      const updatedClient = Client.update(clientId, updates);

      await logActivity({
        action: "client_updated",
        category: "admin",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: {
          clientId,
          clientName: client.name,
          changes: updates,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        message: "Client updated successfully",
        client: updatedClient,
      });
    } catch (error) {
      console.error("Client update error:", error);
      res.status(500).json({ error: "Failed to update client" });
    }
  },
);

// Delete client (admin only)
router.delete("/:clientId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = Client.findById(clientId);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Delete the file
    if (client.filePath) {
      await fs.unlink(client.filePath).catch((error) => {
        console.warn("Could not delete client file:", error.message);
      });
    }

    const deleted = Client.delete(clientId);

    if (!deleted) {
      return res.status(404).json({ error: "Client not found" });
    }

    await logActivity({
      action: "client_deleted",
      category: "admin",
      level: "warning",
      userId: req.user.userId,
      username: req.user.username,
      details: {
        clientId,
        clientName: client.name,
        version: client.version,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Client delete error:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

// Download client (requires authentication)
router.get("/:clientId/download", requireAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = Client.findById(clientId);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    if (!client.enabled) {
      return res.status(404).json({ error: "Client not available" });
    }

    if (!client.filePath) {
      return res.status(404).json({ error: "Client file not available" });
    }

    try {
      await fs.access(client.filePath);
    } catch {
      await logActivity({
        action: "client_download_failed",
        category: "system",
        level: "warning",
        userId: req.user.userId,
        username: req.user.username,
        details: {
          clientId,
          clientName: client.name,
          reason: "file_not_found",
          expectedPath: client.filePath,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      return res.status(404).json({
        error: "Client file not available for download",
        message: "File may have been moved or deleted",
      });
    }

    // Increment download count
    Client.incrementDownloadCount(clientId);

    await logActivity({
      action: "client_downloaded",
      category: "system",
      level: "info",
      userId: req.user.userId,
      username: req.user.username,
      details: {
        clientId,
        clientName: client.name,
        fileSize: client.fileSize,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    const downloadName = `${client.name}-${client.version}${path.extname(client.fileName)}`;
    res.download(client.filePath, downloadName);
  } catch (error) {
    console.error("Client download error:", error);
    res.status(500).json({ error: "Failed to download client" });
  }
});

// Toggle client status (admin only)
router.put("/:clientId/toggle", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    const updatedClient = Client.toggle(clientId);

    if (!updatedClient) {
      return res.status(404).json({ error: "Client not found" });
    }

    await logActivity({
      action: "client_toggled",
      category: "admin",
      level: "info",
      userId: req.user.userId,
      username: req.user.username,
      details: {
        clientId,
        clientName: updatedClient.name,
        newStatus: updatedClient.enabled ? "enabled" : "disabled",
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      message: `Client ${updatedClient.enabled ? "enabled" : "disabled"} successfully`,
      client: updatedClient,
    });
  } catch (error) {
    console.error("Client toggle error:", error);
    res.status(500).json({ error: "Failed to toggle client status" });
  }
});

// Get client statistics (admin only)
router.get("/admin/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = Client.getStats();

    await logActivity({
      action: "client_stats_viewed",
      category: "admin",
      level: "info",
      userId: req.user.userId,
      username: req.user.username,
      details: stats,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ stats });
  } catch (error) {
    console.error("Client stats error:", error);
    res.status(500).json({ error: "Failed to fetch client statistics" });
  }
});

// Preview/Play client (serves the extracted client files)
router.get("/:clientId/play", requireAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = Client.findById(clientId);

    if (!client || !client.enabled) {
      return res
        .status(404)
        .json({ error: "Client not found or not available" });
    }

    if (!client.clientFolderPath) {
      return res
        .status(404)
        .json({ error: "Client files not available for preview" });
    }

    const indexPath = path.join(client.clientFolderPath, "index.html");

    try {
      await fs.access(indexPath);
    } catch {
      return res.status(404).json({ error: "Client index.html not found" });
    }

    await logActivity({
      action: "client_previewed",
      category: "system",
      level: "info",
      userId: req.user.userId,
      username: req.user.username,
      details: {
        clientId,
        clientName: client.name,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Serve the index.html file
    res.sendFile(indexPath);
  } catch (error) {
    console.error("Client preview error:", error);
    res.status(500).json({ error: "Failed to preview client" });
  }
});

// Serve client assets (CSS, JS, etc.)
router.get("/:clientId/assets/*", requireAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = Client.findById(clientId);

    if (!client || !client.enabled) {
      return res
        .status(404)
        .json({ error: "Client not found or not available" });
    }

    if (!client.clientFolderPath) {
      return res.status(404).json({ error: "Client assets not available" });
    }

    const assetPath = req.params[0]; // Everything after /assets/
    const fullAssetPath = path.join(client.clientFolderPath, assetPath);

    // Security check - make sure we're not serving files outside the client folder
    const normalizedClientPath = path.resolve(client.clientFolderPath);
    const normalizedAssetPath = path.resolve(fullAssetPath);

    if (!normalizedAssetPath.startsWith(normalizedClientPath)) {
      return res.status(403).json({ error: "Access denied" });
    }

    try {
      await fs.access(fullAssetPath);
      res.sendFile(fullAssetPath);
    } catch {
      res.status(404).json({ error: "Asset not found" });
    }
  } catch (error) {
    console.error("Client asset error:", error);
    res.status(500).json({ error: "Failed to serve client asset" });
  }
});

// Launch client (web version) - if applicable
router.post("/:clientId/launch", requireAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = Client.findById(clientId);

    if (!client || !client.enabled) {
      return res
        .status(404)
        .json({ error: "Client not found or not available" });
    }

    await logActivity({
      action: "client_launched",
      category: "system",
      level: "info",
      userId: req.user.userId,
      username: req.user.username,
      details: {
        clientId,
        clientName: client.name,
        launchType: "web",
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      message: "Client launch logged",
      clientName: client.name,
      downloadUrl: `/api/clients/${clientId}/download`,
      playUrl: `/api/clients/${clientId}/play`,
    });
  } catch (error) {
    console.error("Client launch error:", error);
    res.status(500).json({ error: "Failed to launch client" });
  }
});

export default router;
