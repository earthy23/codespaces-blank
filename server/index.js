import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";

// Import API routes
import authRoutes from "./api/auth.js";
import userRoutes from "./api/users.js";
import adminRoutes from "./api/admin.js";
import clientRoutes from "./api/clients.js";
import settingsRoutes from "./api/settings.js";
import communityRoutes from "./api/community.js";
import serversRoutes from "./api/servers.js";
import supportRoutes from "./api/support.js";
import forumsRoutes from "./api/forums.js";
import chatRoutes from "./api/chat.js";
import friendsRoutes from "./api/friends.js";
import storeRoutes from "./api/store.js";
import publicRoutes from "./api/public.js";

// Import utilities
import { logActivity } from "./utils/logger.js";
import ChatWebSocketServer from "./websocket.js";
import { createServer as createHTTPServer } from "http";
import { createDefaultAdmin } from "./models/User.js";
import { startPeriodicStatusChecks } from "./utils/server-status.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;


// Dynamic domain detection middleware
app.use((req, res, next) => {
  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  const currentDomain = `${protocol}://${host}`;

  // Add current domain to allowed origins if it matches pattern
  if (host && (host.includes('ueclub.com') || host.includes('localhost') || host.includes('fly.dev'))) {
    req.currentDomain = currentDomain;
    req.isAllowedDomain = true;
  }

  next();
});

// Security middleware with dynamic CSP
app.use((req, res, next) => {
  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';

  // Build dynamic CSP based on current domain
  const cspDirectives = {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    scriptSrc: ["'self'"],
    connectSrc: ["'self'", "ws:", "wss:"],
  };

  // Add current domain to connect sources for websockets
  if (host) {
    cspDirectives.connectSrc.push(`ws://${host}`, `wss://${host}`);
    if (host.includes('ueclub.com')) {
      cspDirectives.connectSrc.push('wss://*.ueclub.com', 'ws://*.ueclub.com');
    }
  }

  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
  })(req, res, next);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // More lenient in development
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development mode completely
  skip: (req) => {
    return process.env.NODE_ENV !== "production";
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 10 : 99999, // Effectively unlimited in development
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting completely in development
  skip: (req) => {
    return process.env.NODE_ENV !== "production";
  },
});

app.use(limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Compression
app.use(compression());

// Dynamic CORS configuration for multiple domains
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Build allowed origins dynamically
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "https://localhost:3000",
        "https://localhost:5173",
        "https://localhost:8080",
        "https://ueclub.com",
        "https://www.ueclub.com",
        "https://play.ueclub.com",
        "https://api.ueclub.com",
        "https://admin.ueclub.com",
        "http://ueclub.com",
        "http://www.ueclub.com",
        "http://play.ueclub.com",
        "http://api.ueclub.com",
        "http://admin.ueclub.com",
        "https://7b10610db8d44756a9e9dc629f6481f1-30e9842434a9496282981b9c3.fly.dev",
      ];

      // Add environment-specific origin if provided
      if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
      }

      // Check if origin is allowed or matches domain patterns
      const isAllowed = allowedOrigins.includes(origin) ||
                       origin.includes('ueclub.com') ||
                       origin.includes('localhost') ||
                       origin.includes('fly.dev');

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log(`CORS: Rejected origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  }),
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "warning" : "info";

    logActivity({
      action: "api_request",
      category: "system",
      level: logLevel,
      details: {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get("User-Agent"),
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
  });

  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/servers", serversRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/forums", forumsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/public", publicRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Static files for client downloads
app.use(
  "/downloads",
  express.static(path.join(__dirname, "../public/downloads")),
);

// Serve Eaglercraft clients
app.use("/client", express.static(path.join(__dirname, "../public/client")));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  logActivity({
    action: "server_error",
    category: "system",
    level: "error",
    details: {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    },
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(err.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Create server function for production builds
export function createServer() {
  return app;
}

// Start server only if this file is run directly
if (process.env.NODE_ENV !== "test") {
  const server = createHTTPServer(app);

  // Initialize WebSocket server
  const chatWS = new ChatWebSocketServer();
  const wss = chatWS.initialize(server);
  chatWS.startHeartbeat();

  // Store WebSocket server reference for use in routes
  app.set("wss", wss);

  server.listen(PORT, () => {
    console.log(`🚀 UEC Launcher API server running on port ${PORT}`);
    console.log(
      `💬 WebSocket chat server running on ws://localhost:${PORT}/chat-ws`,
    );
    console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);

    // Create default admin user if none exists
    createDefaultAdmin();

    // Start periodic server status checks (every 15 minutes)
    startPeriodicStatusChecks(15);

    logActivity({
      action: "server_started",
      category: "system",
      level: "info",
      details: {
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
        websocket: true,
        serverStatusChecks: true,
      },
    });
  });

  // Graceful shutdown for WebSocket
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    chatWS.stopHeartbeat();
    server.close(() => {
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully");
    chatWS.stopHeartbeat();
    server.close(() => {
      process.exit(0);
    });
  });
}

export default app;
