import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// Get all users (admin only)
router.get('/', requireAuth, requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], handleValidation, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const users = User.getAllUsers(limit, offset);
    const total = User.getUserCount();

    logActivity({
      userId: req.user.id,
      action: 'users_list_viewed',
      category: 'admin',
      level: 'info',
      details: { page, limit, total },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID (admin only)
router.get('/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't send password
    const { password, ...userData } = user;

    logActivity({
      userId: req.user.id,
      action: 'user_viewed',
      category: 'admin',
      level: 'info',
      details: { viewedUserId: req.params.userId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ user: userData });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (admin only)
router.put('/:userId', requireAuth, requireAdmin, [
  body('username').optional().isLength({ min: 3, max: 30 }),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['user', 'admin']),
  body('status').optional().isIn(['active', 'suspended', 'banned']),
], handleValidation, async (req, res) => {
  try {
    const { username, email, role, status } = req.body;
    const user = User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;

    const updatedUser = User.updateUser(req.params.userId, updates);

    logActivity({
      userId: req.user.id,
      action: 'user_updated',
      category: 'admin',
      level: 'info',
      details: { updatedUserId: req.params.userId, changes: updates },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Don't send password
    const { password, ...userData } = updatedUser;
    res.json({ user: userData });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    User.deleteUser(req.params.userId);

    logActivity({
      userId: req.user.id,
      action: 'user_deleted',
      category: 'admin',
      level: 'warning',
      details: { deletedUserId: req.params.userId, deletedUsername: user.username },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Ban user (admin only)
router.post('/:userId/ban', requireAuth, requireAdmin, [
  body('reason').notEmpty().withMessage('Ban reason is required'),
  body('duration').optional().isIn(['1d', '3d', '7d', '30d', 'permanent']),
], handleValidation, async (req, res) => {
  try {
    const { reason, duration = 'permanent' } = req.body;
    const user = User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent banning yourself
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot ban your own account' });
    }

    let expiresAt = null;
    if (duration !== 'permanent') {
      const durationMs = {
        '1d': 24 * 60 * 60 * 1000,
        '3d': 3 * 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      expiresAt = new Date(Date.now() + durationMs[duration]).toISOString();
    }

    const updatedUser = User.updateUser(req.params.userId, {
      status: 'banned',
      banReason: reason,
      banExpiresAt: expiresAt,
      bannedBy: req.user.id,
      bannedAt: new Date().toISOString()
    });

    logActivity({
      userId: req.user.id,
      action: 'user_banned',
      category: 'admin',
      level: 'warning',
      details: { 
        bannedUserId: req.params.userId, 
        bannedUsername: user.username,
        reason, 
        duration,
        expiresAt 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Don't send password
    const { password, ...userData } = updatedUser;
    res.json({ user: userData });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Unban user (admin only)
router.post('/:userId/unban', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = User.updateUser(req.params.userId, {
      status: 'active',
      banReason: null,
      banExpiresAt: null,
      bannedBy: null,
      bannedAt: null,
      unbannedBy: req.user.id,
      unbannedAt: new Date().toISOString()
    });

    logActivity({
      userId: req.user.id,
      action: 'user_unbanned',
      category: 'admin',
      level: 'info',
      details: { 
        unbannedUserId: req.params.userId, 
        unbannedUsername: user.username 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Don't send password
    const { password, ...userData } = updatedUser;
    res.json({ user: userData });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// Search users (admin only)
router.get('/search', requireAuth, requireAdmin, [
  query('q').notEmpty().withMessage('Search query is required'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], handleValidation, async (req, res) => {
  try {
    const { q: query, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const users = User.searchUsers(query, limit, offset);
    const total = User.getSearchCount(query);

    logActivity({
      userId: req.user.id,
      action: 'users_searched',
      category: 'admin',
      level: 'info',
      details: { query, page, limit, total },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user statistics (admin only)
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = User.getUserStats();

    logActivity({
      userId: req.user.id,
      action: 'user_stats_viewed',
      category: 'admin',
      level: 'info',
      details: stats,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

export default router;
