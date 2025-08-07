import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import {
  User,
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  updateUser,
} from "../models/User.js";
import { logActivity } from "../utils/logger.js";

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Middleware to check admin role
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Register endpoint
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3, max: 20 })
      .matches(/^[a-zA-Z0-9_]+$/),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
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

      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser =
        getUserByUsername(username) || getUserByEmail(email);
      if (existingUser) {
        await logActivity({
          action: "registration_failed",
          category: "auth",
          level: "warning",
          details: { username, email, reason: "user_exists" },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
        return res
          .status(409)
          .json({ error: "Username or email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const userId = createUser({
        username,
        email,
        password: hashedPassword,
        role: "user",
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId,
          username,
          email,
          role: "user",
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      await logActivity({
        action: "user_registered",
        category: "auth",
        level: "info",
        userId,
        username,
        details: { email },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: userId,
          username,
          email,
          role: "user",
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      await logActivity({
        action: "registration_error",
        category: "auth",
        level: "error",
        details: { error: error.message },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Login endpoint
router.post(
  "/login",
  [body("username").notEmpty(), body("password").notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { username, password } = req.body;

      // Get user
      const user = getUserByUsername(username);
      if (!user) {
        await logActivity({
          action: "login_failed",
          category: "auth",
          level: "warning",
          details: { username, reason: "user_not_found" },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if user is banned
      if (user.banned) {
        await logActivity({
          action: "login_failed",
          category: "auth",
          level: "warning",
          userId: user.id,
          username: user.username,
          details: { reason: "user_banned", banReason: user.banReason },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
        return res.status(403).json({
          error: "Account banned",
          reason: user.banReason,
          banExpiry: user.banExpiry,
        });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        await logActivity({
          action: "login_failed",
          category: "auth",
          level: "warning",
          userId: user.id,
          username: user.username,
          details: { reason: "invalid_password" },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Update last login
      updateUser(user.id, {
        lastLogin: new Date().toISOString(),
        loginCount: (user.loginCount || 0) + 1,
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      await logActivity({
        action: "user_login",
        category: "auth",
        level: "info",
        userId: user.id,
        username: user.username,
        details: {},
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          mustChangePassword: Boolean(user.mustChangePassword),
          temporaryPassword: Boolean(user.temporaryPassword),
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      await logActivity({
        action: "login_error",
        category: "auth",
        level: "error",
        details: { error: error.message },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      settings: user.settings || {},
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile
router.put(
  "/profile",
  authenticateToken,
  [
    body("username")
      .optional()
      .isLength({ min: 3, max: 20 })
      .matches(/^[a-zA-Z0-9_]+$/),
    body("email").optional().isEmail().normalizeEmail(),
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

      const { username, email } = req.body;
      const updates = {};

      if (username) {
        const existing = await getUserByUsername(username);
        if (existing && existing.id !== req.user.userId) {
          return res.status(409).json({ error: "Username already taken" });
        }
        updates.username = username;
      }

      if (email) {
        const existing = await getUserByEmail(email);
        if (existing && existing.id !== req.user.userId) {
          return res.status(409).json({ error: "Email already taken" });
        }
        updates.email = email;
      }

      await updateUser(req.user.userId, updates);

      await logActivity({
        action: "profile_updated",
        category: "user",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: updates,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Change password
router.put(
  "/password",
  authenticateToken,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
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

      const { currentPassword, newPassword } = req.body;

      const user = await getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!validPassword) {
        await logActivity({
          action: "password_change_failed",
          category: "auth",
          level: "warning",
          userId: req.user.userId,
          username: req.user.username,
          details: { reason: "invalid_current_password" },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
        return res.status(401).json({ error: "Invalid current password" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await updateUser(req.user.userId, {
        password: hashedPassword,
        mustChangePassword: false,
        temporaryPassword: false,
      });

      await logActivity({
        action: "password_changed",
        category: "auth",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: { wasTemporary: Boolean(user.temporaryPassword) },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Force password change for accounts with temporary passwords
router.put(
  "/force-password-change",
  authenticateToken,
  [
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }),
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

      const { newPassword } = req.body;

      const user = await getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Only allow this for users who must change password
      if (!user.mustChangePassword) {
        return res.status(400).json({ error: "Password change not required" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await updateUser(req.user.userId, {
        password: hashedPassword,
        mustChangePassword: false,
        temporaryPassword: false,
      });

      await logActivity({
        action: "forced_password_changed",
        category: "auth",
        level: "info",
        userId: req.user.userId,
        username: req.user.username,
        details: { reason: "temporary_password_changed" },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        message: "Password changed successfully",
        requiresReauth: false,
      });
    } catch (error) {
      console.error("Force password change error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Logout (primarily for logging purposes)
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    await logActivity({
      action: "user_logout",
      category: "auth",
      level: "info",
      userId: req.user.userId,
      username: req.user.username,
      details: {},
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
