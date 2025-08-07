import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from './auth.js';
import { getUserById, updateUser } from '../models/User.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Default settings structure
const DEFAULT_SETTINGS = {
  notifications: {
    email: true,
    chat: true,
    friends: true,
    news: true,
    security: true
  },
  privacy: {
    showOnlineStatus: true,
    allowFriendRequests: true,
    showActivity: true
  },
  gameplay: {
    autoSaveEnabled: true,
    chatSounds: true,
    showFPS: false,
    renderDistance: 'normal'
  },
  display: {
    theme: 'dark',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'auto'
  }
};

// Get user settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Merge user settings with defaults
    const settings = { ...DEFAULT_SETTINGS, ...user.settings };

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/', authenticateToken, [
  body('notifications').optional().isObject(),
  body('privacy').optional().isObject(),
  body('gameplay').optional().isObject(),
  body('display').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current settings and merge with updates
    const currentSettings = { ...DEFAULT_SETTINGS, ...user.settings };
    const updates = req.body;

    // Validate specific settings
    if (updates.notifications) {
      const validNotificationKeys = ['email', 'chat', 'friends', 'news', 'security'];
      for (const key in updates.notifications) {
        if (!validNotificationKeys.includes(key) || typeof updates.notifications[key] !== 'boolean') {
          return res.status(400).json({ error: `Invalid notification setting: ${key}` });
        }
      }
      currentSettings.notifications = { ...currentSettings.notifications, ...updates.notifications };
    }

    if (updates.privacy) {
      const validPrivacyKeys = ['showOnlineStatus', 'allowFriendRequests', 'showActivity'];
      for (const key in updates.privacy) {
        if (!validPrivacyKeys.includes(key) || typeof updates.privacy[key] !== 'boolean') {
          return res.status(400).json({ error: `Invalid privacy setting: ${key}` });
        }
      }
      currentSettings.privacy = { ...currentSettings.privacy, ...updates.privacy };
    }

    if (updates.gameplay) {
      const validGameplayKeys = ['autoSaveEnabled', 'chatSounds', 'showFPS', 'renderDistance'];
      for (const key in updates.gameplay) {
        if (!validGameplayKeys.includes(key)) {
          return res.status(400).json({ error: `Invalid gameplay setting: ${key}` });
        }
      }
      currentSettings.gameplay = { ...currentSettings.gameplay, ...updates.gameplay };
    }

    if (updates.display) {
      const validDisplayKeys = ['theme', 'language', 'dateFormat', 'timezone'];
      for (const key in updates.display) {
        if (!validDisplayKeys.includes(key)) {
          return res.status(400).json({ error: `Invalid display setting: ${key}` });
        }
      }
      currentSettings.display = { ...currentSettings.display, ...updates.display };
    }

    // Update user settings in database
    await updateUser(req.user.userId, { settings: currentSettings });

    await logActivity({
      action: 'settings_updated',
      category: 'user',
      level: 'info',
      userId: req.user.userId,
      username: req.user.username,
      details: { updatedSettings: Object.keys(updates) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Settings updated successfully',
      settings: currentSettings
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Reset settings to defaults
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    await updateUser(req.user.userId, { settings: DEFAULT_SETTINGS });

    await logActivity({
      action: 'settings_reset',
      category: 'user',
      level: 'info',
      userId: req.user.userId,
      username: req.user.username,
      details: {},
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Settings reset to defaults',
      settings: DEFAULT_SETTINGS
    });

  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

// Get specific setting category
router.get('/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!DEFAULT_SETTINGS[category]) {
      return res.status(404).json({ error: 'Settings category not found' });
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const settings = { ...DEFAULT_SETTINGS, ...user.settings };
    
    res.json(settings[category]);
  } catch (error) {
    console.error('Get category settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings category' });
  }
});

// Update specific setting category
router.put('/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!DEFAULT_SETTINGS[category]) {
      return res.status(404).json({ error: 'Settings category not found' });
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentSettings = { ...DEFAULT_SETTINGS, ...user.settings };
    currentSettings[category] = { ...currentSettings[category], ...req.body };

    await updateUser(req.user.userId, { settings: currentSettings });

    await logActivity({
      action: 'settings_category_updated',
      category: 'user',
      level: 'info',
      userId: req.user.userId,
      username: req.user.username,
      details: { category, updates: req.body },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: `${category} settings updated successfully`,
      settings: currentSettings[category]
    });

  } catch (error) {
    console.error('Update category settings error:', error);
    res.status(500).json({ error: 'Failed to update settings category' });
  }
});

export default router;
