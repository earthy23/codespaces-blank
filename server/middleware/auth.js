import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";

// Simplified middleware to verify JWT token
export const requireAuth = (req, res, next) => {
  console.log("🔐 requireAuth: START - Processing request to:", req.path);

  try {
    const authHeader = req.headers.authorization;
    console.log(
      "🔐 requireAuth: Auth header:",
      authHeader ? "EXISTS" : "MISSING",
    );

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ requireAuth: No valid auth header");
      return res.status(401).json({ error: "Authentication token required" });
    }

    const token = authHeader.substring(7);
    console.log("🔑 requireAuth: Token extracted, length:", token.length);

    if (!token) {
      console.log("❌ requireAuth: Empty token");
      return res.status(401).json({ error: "Authentication token required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("✅ requireAuth: Token verified for userId:", decoded.userId);

    const user = User.findById(decoded.userId);
    console.log(
      "👤 requireAuth: User lookup result:",
      user ? "FOUND" : "NOT_FOUND",
    );

    if (!user) {
      console.log("❌ requireAuth: User not found");
      return res.status(401).json({ error: "User not found" });
    }

    // Set minimal user object
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    console.log("✅ requireAuth: req.user set, calling next()");
    next();
  } catch (error) {
    console.error("❌ requireAuth: Error:", error.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

// Middleware to require admin role
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// Middleware to require specific role
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // No token, continue without user
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next(); // No token, continue without user
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = User.findById(decoded.userId);

      if (user && user.status === "active") {
        const { password, ...userInfo } = user;
        req.user = userInfo;
      }
    } catch (jwtError) {
      // Invalid token, but don't fail - just continue without user
    }

    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    next(); // Continue without user on error
  }
};
