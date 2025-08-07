import express from "express";
import cors from "cors";

const router = express.Router();

// Enable CORS for all public API routes
router.use(cors({
  origin: true, // Allow all origins for public API
  credentials: false,
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));

// In-memory server data (this would typically come from a database)
// For now, we'll import from the main servers API
let servers = [];
let serverLikes = {};

// Import server data from main API (this is a simplified approach)
// In production, you'd want to use a shared database
const getServersData = async () => {
  try {
    // This would typically be a database query
    // For now, we'll use the same in-memory storage pattern
    return { servers, serverLikes };
  } catch (error) {
    console.error('Error fetching servers data:', error);
    return { servers: [], serverLikes: {} };
  }
};

// Update servers data (to be called from main servers API)
export const updatePublicServersData = (serversData, likesData) => {
  servers = serversData || [];
  serverLikes = likesData || {};
};

/**
 * Public API: Get all servers
 * GET /api/public/servers
 * 
 * Returns a list of all public servers for external integrations
 * No authentication required
 */
router.get('/servers', async (req, res) => {
  try {
    const { limit, category, sort, status } = req.query;
    
    // Get servers data
    const { servers: allServers } = await getServersData();
    
    // Filter servers
    let filteredServers = [...allServers];
    
    // Filter by category
    if (category && category !== 'all') {
      filteredServers = filteredServers.filter(server => 
        server.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filter by status
    if (status === 'online') {
      filteredServers = filteredServers.filter(server => server.isOnline);
    } else if (status === 'offline') {
      filteredServers = filteredServers.filter(server => !server.isOnline);
    }
    
    // Sort servers
    if (sort === 'likes') {
      filteredServers.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sort === 'name') {
      filteredServers.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'newest') {
      filteredServers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'players') {
      filteredServers.sort((a, b) => (b.playerCount || 0) - (a.playerCount || 0));
    }
    
    // Apply limit
    if (limit && !isNaN(parseInt(limit))) {
      filteredServers = filteredServers.slice(0, parseInt(limit));
    }
    
    // Remove sensitive information for public API
    const publicServers = filteredServers.map(server => ({
      id: server.id,
      name: server.name,
      description: server.description,
      ip: server.ip,
      port: server.port || 25565,
      category: server.category,
      version: server.version,
      isOnline: server.isOnline,
      playerCount: server.playerCount || 0,
      maxPlayers: server.maxPlayers || 100,
      likes: server.likes || 0,
      createdAt: server.createdAt,
      lastChecked: server.lastChecked,
      features: server.features || [],
      banner: server.banner ? `${req.protocol}://${req.get('host')}${server.banner}` : null,
      // Owner info for transparency, but limited
      ownerName: server.ownerName
    }));
    
    res.json({
      success: true,
      data: {
        servers: publicServers,
        total: publicServers.length,
        filters: {
          category: category || 'all',
          status: status || 'all',
          sort: sort || 'likes',
          limit: limit ? parseInt(limit) : publicServers.length
        }
      },
      meta: {
        endpoint: 'public/servers',
        version: '1.0',
        documentation: `${req.protocol}://${req.get('host')}/api/public/docs`
      }
    });
    
  } catch (error) {
    console.error('Public API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch servers',
      message: 'An internal error occurred while fetching server data'
    });
  }
});

/**
 * Public API: Get server by ID
 * GET /api/public/servers/:id
 * 
 * Returns detailed information about a specific server
 * No authentication required
 */
router.get('/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { servers: allServers } = await getServersData();
    
    const server = allServers.find(s => s.id === id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
        message: `No server found with ID: ${id}`
      });
    }
    
    // Public server details
    const publicServer = {
      id: server.id,
      name: server.name,
      description: server.description,
      ip: server.ip,
      port: server.port || 25565,
      websocketUrl: server.websocketUrl,
      category: server.category,
      version: server.version,
      isOnline: server.isOnline,
      playerCount: server.playerCount || 0,
      maxPlayers: server.maxPlayers || 100,
      likes: server.likes || 0,
      createdAt: server.createdAt,
      lastChecked: server.lastChecked,
      features: server.features || [],
      banner: server.banner ? `${req.protocol}://${req.get('host')}${server.banner}` : null,
      ownerName: server.ownerName
    };
    
    res.json({
      success: true,
      data: {
        server: publicServer
      },
      meta: {
        endpoint: 'public/servers/:id',
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Public API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch server details',
      message: 'An internal error occurred while fetching server details'
    });
  }
});

/**
 * Public API: Get server categories
 * GET /api/public/categories
 * 
 * Returns available server categories
 * No authentication required
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'survival', name: 'Survival', description: 'Classic Minecraft survival mode' },
      { id: 'creative', name: 'Creative', description: 'Creative building mode' },
      { id: 'pvp', name: 'PvP', description: 'Player vs Player combat' },
      { id: 'minigames', name: 'Minigames', description: 'Fun mini-games and activities' },
      { id: 'roleplay', name: 'Roleplay', description: 'Role-playing and storytelling' },
      { id: 'modded', name: 'Modded', description: 'Servers with mods and plugins' }
    ];
    
    res.json({
      success: true,
      data: {
        categories
      },
      meta: {
        endpoint: 'public/categories',
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Public API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: 'An internal error occurred while fetching categories'
    });
  }
});

/**
 * Public API: Get server statistics
 * GET /api/public/stats
 * 
 * Returns general statistics about the server list
 * No authentication required
 */
router.get('/stats', async (req, res) => {
  try {
    const { servers: allServers } = await getServersData();
    
    const stats = {
      totalServers: allServers.length,
      onlineServers: allServers.filter(s => s.isOnline).length,
      offlineServers: allServers.filter(s => !s.isOnline).length,
      totalPlayers: allServers.reduce((sum, s) => sum + (s.playerCount || 0), 0),
      totalLikes: allServers.reduce((sum, s) => sum + (s.likes || 0), 0),
      categories: {}
    };
    
    // Count servers by category
    allServers.forEach(server => {
      if (!stats.categories[server.category]) {
        stats.categories[server.category] = 0;
      }
      stats.categories[server.category]++;
    });
    
    res.json({
      success: true,
      data: {
        statistics: stats,
        lastUpdated: new Date().toISOString()
      },
      meta: {
        endpoint: 'public/stats',
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Public API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: 'An internal error occurred while fetching statistics'
    });
  }
});

/**
 * Public API: Documentation endpoint
 * GET /api/public/docs
 * 
 * Returns API documentation
 * No authentication required
 */
router.get('/docs', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}/api/public`;
  
  res.json({
    title: 'UEC Server List Public API',
    version: '1.0',
    description: 'Public API for integrating UEC server list data into external applications',
    baseUrl,
    endpoints: {
      servers: {
        url: `${baseUrl}/servers`,
        method: 'GET',
        description: 'Get all servers with optional filtering and sorting',
        parameters: {
          limit: 'Number of servers to return (optional)',
          category: 'Filter by category: survival, creative, pvp, minigames, roleplay, modded (optional)',
          sort: 'Sort by: likes, name, newest, players (optional, default: likes)',
          status: 'Filter by status: online, offline (optional)'
        },
        example: `${baseUrl}/servers?limit=10&category=survival&sort=players&status=online`
      },
      serverById: {
        url: `${baseUrl}/servers/{id}`,
        method: 'GET',
        description: 'Get detailed information about a specific server',
        parameters: {
          id: 'Server ID (required)'
        },
        example: `${baseUrl}/servers/server-1234567890-abcdefghi`
      },
      categories: {
        url: `${baseUrl}/categories`,
        method: 'GET',
        description: 'Get available server categories',
        parameters: {},
        example: `${baseUrl}/categories`
      },
      stats: {
        url: `${baseUrl}/stats`,
        method: 'GET',
        description: 'Get server list statistics',
        parameters: {},
        example: `${baseUrl}/stats`
      }
    },
    usage: {
      authentication: 'None required for public endpoints',
      rateLimit: 'Currently no rate limiting (may be added in the future)',
      cors: 'CORS enabled for all origins',
      responseFormat: 'JSON with success/error indicators and meta information'
    },
    examples: {
      javascript: `
// Fetch all online survival servers
fetch('${baseUrl}/servers?category=survival&status=online')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Servers:', data.data.servers);
    }
  });
`,
      curl: `
# Get top 5 most liked servers
curl "${baseUrl}/servers?limit=5&sort=likes"

# Get specific server details  
curl "${baseUrl}/servers/server-1234567890-abcdefghi"

# Get statistics
curl "${baseUrl}/stats"
`
    },
    support: {
      contact: 'For support, please contact the UEC team',
      documentation: `${baseUrl}/docs`,
      version: '1.0'
    }
  });
});

export default router;
