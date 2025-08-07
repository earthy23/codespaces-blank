import express from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Community data store
let communityServers = [];

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// Get all public servers
router.get('/servers', requireAuth, async (req, res) => {
  try {
    // Filter to only return public servers or servers the user is a member of
    const userServers = communityServers.filter(server => 
      server.isPublic || server.members.some(member => member.userId === req.user.userId)
    );

    await logActivity({
      userId: req.user.userId,
      username: req.user.username,
      action: 'community_servers_viewed',
      category: 'community',
      level: 'info',
      details: { serverCount: userServers.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ servers: userServers });
  } catch (error) {
    console.error('Error fetching community servers:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// Get specific server details
router.get('/servers/:serverId', requireAuth, async (req, res) => {
  try {
    const server = communityServers.find(s => s.id === req.params.serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check if user has access to this server
    const isMember = server.members.some(member => member.userId === req.user.userId);
    if (!server.isPublic && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ server });
  } catch (error) {
    console.error('Error fetching server details:', error);
    res.status(500).json({ error: 'Failed to fetch server details' });
  }
});

// Create new server
router.post('/servers', requireAuth, [
  body('name').notEmpty().withMessage('Server name is required'),
  body('description').optional().isString(),
  body('category').isIn(['gaming', 'community', 'education', 'entertainment', 'technology']).withMessage('Invalid category'),
  body('isPublic').isBoolean().withMessage('isPublic must be a boolean'),
], handleValidation, async (req, res) => {
  try {
    const { name, description, category, isPublic } = req.body;
    
    const timestamp = Date.now();
    const serverId = `server-${timestamp}`;
    const ownerRoleId = `role-${timestamp}-1`;
    const memberRoleId = `role-${timestamp}-2`;

    const newServer = {
      id: serverId,
      name,
      description: description || '',
      icon: null,
      memberCount: 1,
      onlineCount: 1,
      category,
      isPublic,
      ownerId: req.user.userId,
      ownerName: req.user.username,
      createdAt: new Date().toISOString(),
      channels: [
        {
          id: `channel-${timestamp}-1`,
          name: 'general',
          type: 'text',
          serverId,
          position: 0
        },
        {
          id: `channel-${timestamp}-2`,
          name: 'General Voice',
          type: 'voice',
          serverId,
          position: 1
        }
      ],
      roles: [
        {
          id: ownerRoleId,
          name: 'Owner',
          color: '#ff0000',
          permissions: ['admin', 'manage_server', 'manage_channels', 'manage_roles'],
          position: 100,
          serverId
        },
        {
          id: memberRoleId,
          name: 'Member',
          color: '#99aab5',
          permissions: ['send_messages', 'connect_voice'],
          position: 1,
          serverId
        }
      ],
      members: [
        {
          id: `member-${timestamp}`,
          userId: req.user.userId,
          username: req.user.username,
          avatar: null,
          roles: [ownerRoleId],
          status: 'online',
          joinedAt: new Date().toISOString()
        }
      ]
    };

    communityServers.push(newServer);

    await logActivity({
      userId: req.user.userId,
      username: req.user.username,
      action: 'community_server_created',
      category: 'community',
      level: 'info',
      details: { serverId: newServer.id, serverName: name, category, isPublic },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({ server: newServer });
  } catch (error) {
    console.error('Error creating server:', error);
    res.status(500).json({ error: 'Failed to create server' });
  }
});

// Join server
router.post('/servers/:serverId/join', requireAuth, async (req, res) => {
  try {
    const server = communityServers.find(s => s.id === req.params.serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (!server.isPublic) {
      return res.status(403).json({ error: 'Server is private' });
    }

    // Check if user is already a member
    const existingMember = server.members.find(member => member.userId === req.user.userId);
    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this server' });
    }

    // Add user as member
    const memberRole = server.roles.find(role => role.name === 'Member');
    const newMember = {
      id: `member-${Date.now()}`,
      userId: req.user.userId,
      username: req.user.username,
      avatar: null,
      roles: memberRole ? [memberRole.id] : [],
      status: 'online',
      joinedAt: new Date().toISOString()
    };

    server.members.push(newMember);
    server.memberCount++;
    server.onlineCount++;

    await logActivity({
      userId: req.user.userId,
      username: req.user.username,
      action: 'community_server_joined',
      category: 'community',
      level: 'info',
      details: { serverId: server.id, serverName: server.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Successfully joined server', member: newMember });
  } catch (error) {
    console.error('Error joining server:', error);
    res.status(500).json({ error: 'Failed to join server' });
  }
});

// Leave server
router.post('/servers/:serverId/leave', requireAuth, async (req, res) => {
  try {
    const server = communityServers.find(s => s.id === req.params.serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check if user is the owner
    if (server.ownerId === req.user.userId) {
      return res.status(400).json({ error: 'Server owner cannot leave. Transfer ownership or delete the server.' });
    }

    // Remove user from members
    const memberIndex = server.members.findIndex(member => member.userId === req.user.userId);
    if (memberIndex === -1) {
      return res.status(400).json({ error: 'Not a member of this server' });
    }

    server.members.splice(memberIndex, 1);
    server.memberCount--;
    server.onlineCount--;

    await logActivity({
      userId: req.user.userId,
      username: req.user.username,
      action: 'community_server_left',
      category: 'community',
      level: 'info',
      details: { serverId: server.id, serverName: server.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Successfully left server' });
  } catch (error) {
    console.error('Error leaving server:', error);
    res.status(500).json({ error: 'Failed to leave server' });
  }
});

// Create channel
router.post('/servers/:serverId/channels', requireAuth, [
  body('name').notEmpty().withMessage('Channel name is required'),
  body('type').isIn(['text', 'voice']).withMessage('Invalid channel type'),
], handleValidation, async (req, res) => {
  try {
    const server = communityServers.find(s => s.id === req.params.serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check if user has permission to manage channels
    const member = server.members.find(m => m.userId === req.user.userId);
    if (!member) {
      return res.status(403).json({ error: 'Not a member of this server' });
    }

    const userRoles = server.roles.filter(role => member.roles.includes(role.id));
    const hasPermission = userRoles.some(role => 
      role.permissions.includes('manage_channels') || role.permissions.includes('admin')
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { name, type } = req.body;
    const newChannel = {
      id: `channel-${Date.now()}`,
      name,
      type,
      serverId: server.id,
      position: server.channels.length
    };

    server.channels.push(newChannel);

    await logActivity({
      userId: req.user.userId,
      username: req.user.username,
      action: 'community_channel_created',
      category: 'community',
      level: 'info',
      details: { serverId: server.id, channelId: newChannel.id, channelName: name, channelType: type },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({ channel: newChannel });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// Create role
router.post('/servers/:serverId/roles', requireAuth, [
  body('name').notEmpty().withMessage('Role name is required'),
  body('color').optional().isHexColor().withMessage('Invalid color format'),
  body('permissions').isArray().withMessage('Permissions must be an array'),
], handleValidation, async (req, res) => {
  try {
    const server = communityServers.find(s => s.id === req.params.serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check if user has permission to manage roles
    const member = server.members.find(m => m.userId === req.user.userId);
    if (!member) {
      return res.status(403).json({ error: 'Not a member of this server' });
    }

    const userRoles = server.roles.filter(role => member.roles.includes(role.id));
    const hasPermission = userRoles.some(role => 
      role.permissions.includes('manage_roles') || role.permissions.includes('admin')
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { name, color, permissions } = req.body;
    const newRole = {
      id: `role-${Date.now()}`,
      name,
      color: color || '#99aab5',
      permissions,
      position: server.roles.length,
      serverId: server.id
    };

    server.roles.push(newRole);

    await logActivity({
      userId: req.user.userId,
      username: req.user.username,
      action: 'community_role_created',
      category: 'community',
      level: 'info',
      details: { serverId: server.id, roleId: newRole.id, roleName: name, permissions },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({ role: newRole });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

export default router;
