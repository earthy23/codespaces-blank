// Performance optimization configuration for 200+ concurrent users

export const performanceConfig = {
  // Database optimization
  database: {
    // WAL mode for better concurrent performance
    journalMode: 'WAL',
    synchronous: 'NORMAL',
    cacheSize: 1000000, // 1GB cache
    tempStore: 'memory',
    busyTimeout: 30000,
    // Connection pooling
    maxConnections: 10,
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 600000
  },

  // Rate limiting configuration
  rateLimiting: {
    // General API rate limiting
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    
    // Authentication rate limiting
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // login attempts per window per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many authentication attempts, please try again later.'
    },
    
    // API endpoints rate limiting
    api: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // requests per minute per IP
      standardHeaders: true,
      legacyHeaders: false
    },
    
    // File upload rate limiting
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // uploads per hour per IP
      standardHeaders: true,
      legacyHeaders: false
    }
  },

  // Caching configuration
  caching: {
    // Static file caching
    staticFiles: {
      maxAge: 31536000, // 1 year for static assets
      etag: true,
      lastModified: true
    },
    
    // API response caching
    apiCache: {
      maxAge: 300, // 5 minutes for API responses
      staleWhileRevalidate: 86400 // 24 hours
    },
    
    // Database query caching
    queryCache: {
      maxSize: 1000, // max cached queries
      ttl: 300000 // 5 minutes TTL
    }
  },

  // Compression settings
  compression: {
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      // Don't compress if client doesn't support it
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use compression filter from compression module
      return true;
    }
  },

  // Session configuration
  session: {
    // Cookie settings
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    },
    
    // Session cleanup
    cleanup: {
      interval: 60 * 60 * 1000, // cleanup every hour
      maxAge: 7 * 24 * 60 * 60 * 1000 // delete sessions older than 7 days
    }
  },

  // File upload limits
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/zip',
      'application/x-zip-compressed'
    ]
  },

  // Security headers
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", "ws:", "wss:"],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          childSrc: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }
  },

  // Request timeout and limits
  requestLimits: {
    timeout: 30000, // 30 seconds
    bodyParser: {
      json: { limit: '10mb' },
      urlencoded: { limit: '10mb', extended: true }
    },
    maxRequestSize: 50 * 1024 * 1024 // 50MB
  },

  // Monitoring and health checks
  monitoring: {
    healthCheck: {
      path: '/health',
      checks: [
        'database',
        'disk_space',
        'memory_usage',
        'cpu_usage'
      ]
    },
    
    metrics: {
      enabled: true,
      collectInterval: 30000, // 30 seconds
      retention: 24 * 60 * 60 * 1000 // 24 hours
    }
  },

  // Clustering and process management
  clustering: {
    // PM2 configuration
    instances: 'max', // Use all CPU cores
    execMode: 'cluster',
    maxMemoryRestart: '1G',
    killTimeout: 5000,
    listenTimeout: 8000,
    
    // Load balancing
    loadBalancing: {
      algorithm: 'round_robin',
      healthCheck: true,
      healthCheckInterval: 30000
    }
  },

  // Database connection pooling
  connectionPool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 600000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
    createTimeoutMillis: 20000,
    destroyTimeoutMillis: 5000
  }
};

// Helper functions for performance optimization
export const performanceHelpers = {
  // Database optimization
  optimizeDatabase: async (db) => {
    // Set SQLite pragmas for performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 1000000');
    db.pragma('temp_store = memory');
    db.pragma('mmap_size = 268435456'); // 256MB
    
    // Create indexes for frequently queried columns
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)',
      'CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_logs_category ON logs(category)'
    ];
    
    indexes.forEach(index => {
      try {
        db.exec(index);
      } catch (error) {
        console.warn('Index creation warning:', error.message);
      }
    });
  },

  // Memory monitoring
  monitorMemory: () => {
    const used = process.memoryUsage();
    return {
      rss: Math.round(used.rss / 1024 / 1024), // MB
      heapTotal: Math.round(used.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(used.heapUsed / 1024 / 1024), // MB
      external: Math.round(used.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(used.arrayBuffers / 1024 / 1024) // MB
    };
  },

  // CPU monitoring
  monitorCPU: () => {
    const cpus = require('os').cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return {
      usage: Math.round(100 - (totalIdle / totalTick) * 100),
      cores: cpus.length
    };
  },

  // Disk space monitoring
  monitorDisk: () => {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const stats = fs.statSync(path.join(process.cwd(), 'data'));
      const free = fs.statSync('.').free || 0;
      const total = fs.statSync('.').size || 0;
      
      return {
        free: Math.round(free / 1024 / 1024 / 1024), // GB
        total: Math.round(total / 1024 / 1024 / 1024), // GB
        used: Math.round((total - free) / 1024 / 1024 / 1024), // GB
        percentage: Math.round(((total - free) / total) * 100)
      };
    } catch (error) {
      return { error: 'Unable to get disk stats' };
    }
  },

  // Request queue monitoring
  monitorRequestQueue: () => {
    return {
      pending: process._getActiveRequests().length,
      handles: process._getActiveHandles().length
    };
  },

  // Performance recommendations
  getPerformanceRecommendations: (metrics) => {
    const recommendations = [];
    
    if (metrics.memory.heapUsed > 512) {
      recommendations.push({
        type: 'memory',
        level: 'warning',
        message: 'High memory usage detected. Consider restarting the application.',
        action: 'restart'
      });
    }
    
    if (metrics.cpu.usage > 80) {
      recommendations.push({
        type: 'cpu',
        level: 'warning',
        message: 'High CPU usage detected. Consider scaling horizontally.',
        action: 'scale'
      });
    }
    
    if (metrics.disk.percentage > 85) {
      recommendations.push({
        type: 'disk',
        level: 'critical',
        message: 'Low disk space. Clean up old files or expand storage.',
        action: 'cleanup'
      });
    }
    
    return recommendations;
  }
};

export default performanceConfig;
