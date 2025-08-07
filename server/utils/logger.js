import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
const dbPath = path.join(__dirname, '../data/uec.db');
const db = new Database(dbPath);

// Create logs table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    level TEXT NOT NULL,
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    userId TEXT,
    username TEXT,
    details TEXT DEFAULT '{}',
    ipAddress TEXT,
    userAgent TEXT
  )
`);

// Create index for better query performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
  CREATE INDEX IF NOT EXISTS idx_logs_category ON logs(category);
  CREATE INDEX IF NOT EXISTS idx_logs_userId ON logs(userId);
`);

// Prepared statements
const statements = {
  insertLog: db.prepare(`
    INSERT INTO logs (id, timestamp, level, category, action, userId, username, details, ipAddress, userAgent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getLogs: db.prepare(`
    SELECT * FROM logs 
    ORDER BY timestamp DESC 
    LIMIT ? OFFSET ?
  `),
  getLogsByCategory: db.prepare(`
    SELECT * FROM logs 
    WHERE category = ?
    ORDER BY timestamp DESC 
    LIMIT ? OFFSET ?
  `),
  getLogsByLevel: db.prepare(`
    SELECT * FROM logs 
    WHERE level = ?
    ORDER BY timestamp DESC 
    LIMIT ? OFFSET ?
  `),
  getLogsByUser: db.prepare(`
    SELECT * FROM logs 
    WHERE userId = ?
    ORDER BY timestamp DESC 
    LIMIT ? OFFSET ?
  `),
  getLogsByDateRange: db.prepare(`
    SELECT * FROM logs 
    WHERE timestamp BETWEEN ? AND ?
    ORDER BY timestamp DESC 
    LIMIT ? OFFSET ?
  `),
  searchLogs: db.prepare(`
    SELECT * FROM logs 
    WHERE action LIKE ? OR username LIKE ? OR details LIKE ?
    ORDER BY timestamp DESC 
    LIMIT ? OFFSET ?
  `),
  getLogStats: db.prepare(`
    SELECT 
      level,
      COUNT(*) as count
    FROM logs 
    WHERE timestamp > datetime('now', '-24 hours')
    GROUP BY level
  `),
  deleteLogs: db.prepare('DELETE FROM logs'),
  deleteOldLogs: db.prepare(`
    DELETE FROM logs 
    WHERE timestamp < datetime('now', '-30 days')
  `)
};

export async function logActivity({
  action,
  category = 'system',
  level = 'info',
  userId = null,
  username = null,
  details = {},
  ipAddress = null,
  userAgent = null
}) {
  try {
    const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const detailsStr = JSON.stringify(details);

    statements.insertLog.run(
      id,
      timestamp,
      level,
      category,
      action,
      userId,
      username,
      detailsStr,
      ipAddress,
      userAgent
    );

    // Console log for development
    console.log(`[${level.toUpperCase()}] ${category}:${action}`, {
      userId,
      username,
      details,
      timestamp
    });

    return id;
  } catch (error) {
    console.error('Logging error:', error);
    // Don't throw to avoid breaking the main application
  }
}

export function getLogs(filters = {}) {
  const { limit = 100, page = 1, level, category, startDate, endDate } = filters;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM logs WHERE 1=1';
  let params = [];

  if (level) {
    query += ' AND level = ?';
    params.push(level);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (startDate) {
    query += ' AND timestamp >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND timestamp <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);

  return rows.map(row => ({
    ...row,
    details: JSON.parse(row.details || '{}')
  }));
}

export function getLogsByCategory(category, limit = 100, offset = 0) {
  const rows = statements.getLogsByCategory.all(category, limit, offset);
  return rows.map(row => ({
    ...row,
    details: JSON.parse(row.details || '{}')
  }));
}

export function getLogsByLevel(level, limit = 100, offset = 0) {
  const rows = statements.getLogsByLevel.all(level, limit, offset);
  return rows.map(row => ({
    ...row,
    details: JSON.parse(row.details || '{}')
  }));
}

export function getLogsByUser(userId, limit = 100, offset = 0) {
  const rows = statements.getLogsByUser.all(userId, limit, offset);
  return rows.map(row => ({
    ...row,
    details: JSON.parse(row.details || '{}')
  }));
}

export function getLogsByDateRange(startDate, endDate, limit = 100, offset = 0) {
  const rows = statements.getLogsByDateRange.all(startDate, endDate, limit, offset);
  return rows.map(row => ({
    ...row,
    details: JSON.parse(row.details || '{}')
  }));
}

export function searchLogs(query, limit = 100, offset = 0) {
  const searchTerm = `%${query}%`;
  const rows = statements.searchLogs.all(searchTerm, searchTerm, searchTerm, limit, offset);
  return rows.map(row => ({
    ...row,
    details: JSON.parse(row.details || '{}')
  }));
}

export function getLogStats() {
  const stats = statements.getLogStats.all();
  const result = {
    info: 0,
    warning: 0,
    error: 0,
    admin: 0,
    security: 0
  };
  
  stats.forEach(stat => {
    result[stat.level] = stat.count;
  });
  
  return result;
}

export function clearLogs() {
  const result = statements.deleteLogs.run();
  logActivity({
    action: 'logs_cleared',
    category: 'admin',
    level: 'admin',
    details: { deletedCount: result.changes }
  });
  return result.changes;
}

export function cleanupOldLogs() {
  const result = statements.deleteOldLogs.run();
  if (result.changes > 0) {
    logActivity({
      action: 'old_logs_cleaned',
      category: 'system',
      level: 'info',
      details: { deletedCount: result.changes }
    });
  }
  return result.changes;
}

// Schedule cleanup of old logs every day
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);

export default {
  logActivity,
  getLogs,
  getLogsByCategory,
  getLogsByLevel,
  getLogsByUser,
  getLogsByDateRange,
  searchLogs,
  getLogStats,
  clearLogs,
  cleanupOldLogs
};
