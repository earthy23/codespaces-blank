import { getServersData } from '../api/servers.js';
import net from 'net';
import WebSocket from 'ws';

/**
 * Utility to check server status and update server list
 */

// Check if server is online via multiple methods
export const checkServerOnline = async (ip, port = 25565) => {
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

/**
 * Update all server statuses
 * This can be called periodically to keep server statuses up to date
 */
export const updateAllServerStatuses = async () => {
  try {
    const { servers } = getServersData();
    console.log(`🔄 Updating status for ${servers.length} servers...`);
    
    const updatePromises = servers.map(async (server) => {
      try {
        const isOnline = await checkServerOnline(server.ip, server.port || 25565);
        const wasOnline = server.isOnline;
        
        server.isOnline = isOnline;
        server.lastChecked = new Date().toISOString();
        
        // Update player count with random value if online
        if (isOnline) {
          server.playerCount = Math.floor(Math.random() * (server.maxPlayers || 100));
        } else {
          server.playerCount = 0;
        }
        
        // Log status changes
        if (wasOnline !== isOnline) {
          console.log(`📊 Server "${server.name}" status changed: ${wasOnline ? 'online' : 'offline'} -> ${isOnline ? 'online' : 'offline'}`);
        }
        
        return {
          id: server.id,
          name: server.name,
          ip: server.ip,
          wasOnline,
          isOnline,
          statusChanged: wasOnline !== isOnline
        };
      } catch (error) {
        console.error(`❌ Error checking server ${server.name} (${server.ip}):`, error.message);
        return {
          id: server.id,
          name: server.name,
          ip: server.ip,
          error: error.message
        };
      }
    });
    
    const results = await Promise.all(updatePromises);
    
    const onlineCount = results.filter(r => r.isOnline).length;
    const offlineCount = results.filter(r => !r.isOnline).length;
    const changedCount = results.filter(r => r.statusChanged).length;
    
    console.log(`✅ Server status update complete: ${onlineCount} online, ${offlineCount} offline, ${changedCount} status changes`);
    
    return {
      total: results.length,
      online: onlineCount,
      offline: offlineCount,
      changed: changedCount,
      results
    };
  } catch (error) {
    console.error('❌ Error updating server statuses:', error);
    throw error;
  }
};

/**
 * Start periodic status checks
 * @param {number} intervalMinutes - How often to check (in minutes)
 */
export const startPeriodicStatusChecks = (intervalMinutes = 15) => {
  console.log(`🕒 Starting periodic server status checks every ${intervalMinutes} minutes`);
  
  // Run initial check
  updateAllServerStatuses().catch(error => {
    console.error('❌ Initial server status check failed:', error);
  });
  
  // Set up interval
  const interval = setInterval(() => {
    updateAllServerStatuses().catch(error => {
      console.error('❌ Periodic server status check failed:', error);
    });
  }, intervalMinutes * 60 * 1000);
  
  return interval;
};
