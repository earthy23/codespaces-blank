import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'uec_launcher.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 1000000');
db.pragma('temp_store = memory');

// Initialize database tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      email_verified BOOLEAN DEFAULT 0,
      must_change_password BOOLEAN DEFAULT 0,
      profile_data TEXT DEFAULT '{}',
      preferences TEXT DEFAULT '{}'
    )
  `);

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      description TEXT,
      category TEXT,
      features TEXT DEFAULT '[]',
      requirements TEXT DEFAULT '[]',
      download_url TEXT,
      web_url TEXT,
      file_size INTEGER,
      active BOOLEAN DEFAULT 1,
      featured BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Friends table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, friend_id)
    )
  `);

  // Chats table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT,
      participants TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      edited_at DATETIME,
      deleted_at DATETIME,
      FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Store items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS store_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      category TEXT NOT NULL,
      features TEXT DEFAULT '[]',
      tebex_id TEXT,
      active BOOLEAN DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // News posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS news_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      author_id TEXT NOT NULL,
      published BOOLEAN DEFAULT 0,
      category TEXT DEFAULT 'announcement',
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME,
      FOREIGN KEY (author_id) REFERENCES users (id)
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string',
      category TEXT DEFAULT 'general',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT,
      FOREIGN KEY (updated_by) REFERENCES users (id)
    )
  `);

  // Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      level TEXT NOT NULL,
      category TEXT NOT NULL,
      action TEXT NOT NULL,
      user_id TEXT,
      username TEXT,
      details TEXT DEFAULT '{}',
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Email queue table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_queue (
      id TEXT PRIMARY KEY,
      to_email TEXT NOT NULL,
      from_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      html_body TEXT,
      status TEXT DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sent_at DATETIME,
      error_message TEXT
    )
  `);

  // Initialize default settings
  initializeDefaultSettings();
  
  console.log('✅ Database initialized successfully');
}

function initializeDefaultSettings() {
  const defaultSettings = [
    { key: 'site_name', value: 'UEC Launcher', category: 'general' },
    { key: 'site_description', value: 'Ultimate Eaglercraft Client Platform', category: 'general' },
    { key: 'admin_email', value: 'admin@localhost', category: 'general' },
    { key: 'allowed_domains', value: JSON.stringify(['localhost', '127.0.0.1']), category: 'security' },
    { key: 'max_users', value: '1000', category: 'limits' },
    { key: 'registration_enabled', value: 'true', category: 'features' },
    { key: 'email_enabled', value: 'false', category: 'email' },
    { key: 'smtp_host', value: '', category: 'email' },
    { key: 'smtp_port', value: '587', category: 'email' },
    { key: 'smtp_user', value: '', category: 'email' },
    { key: 'smtp_password', value: '', category: 'email' },
    { key: 'smtp_secure', value: 'false', category: 'email' },
    { key: 'from_email', value: 'noreply@localhost', category: 'email' },
    { key: 'backup_enabled', value: 'true', category: 'maintenance' },
    { key: 'backup_retention_days', value: '30', category: 'maintenance' }
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, category) 
    VALUES (?, ?, ?)
  `);

  defaultSettings.forEach(setting => {
    insertSetting.run(setting.key, setting.value, setting.category);
  });
}

// Database helper functions
export const dbHelpers = {
  // Generic helpers
  get: db.prepare.bind(db),
  run: db.prepare.bind(db),
  transaction: db.transaction.bind(db),
  
  // User helpers
  getUser: db.prepare('SELECT * FROM users WHERE id = ?'),
  getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  createUser: db.prepare(`
    INSERT INTO users (id, username, email, password, role, status, email_verified, must_change_password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateUser: db.prepare(`
    UPDATE users SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  updateUserPassword: db.prepare(`
    UPDATE users SET password = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  updateUserLastLogin: db.prepare(`
    UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
  `),
  getAllUsers: db.prepare('SELECT * FROM users ORDER BY created_at DESC'),
  getUserCount: db.prepare('SELECT COUNT(*) as count FROM users'),
  
  // Session helpers
  createSession: db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getSession: db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > CURRENT_TIMESTAMP'),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
  cleanExpiredSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP'),
  
  // Settings helpers
  getSetting: db.prepare('SELECT value FROM settings WHERE key = ?'),
  setSetting: db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, updated_at, updated_by)
    VALUES (?, ?, CURRENT_TIMESTAMP, ?)
  `),
  getSettingsByCategory: db.prepare('SELECT * FROM settings WHERE category = ? ORDER BY key'),
  getAllSettings: db.prepare('SELECT * FROM settings ORDER BY category, key'),
  
  // Logging helpers
  addLog: db.prepare(`
    INSERT INTO logs (id, level, category, action, user_id, username, details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
  clearOldLogs: db.prepare('DELETE FROM logs WHERE timestamp < datetime("now", "-30 days")'),
  
  // Email queue helpers
  addEmailToQueue: db.prepare(`
    INSERT INTO email_queue (id, to_email, from_email, subject, body, html_body)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getPendingEmails: db.prepare(`
    SELECT * FROM email_queue 
    WHERE status = 'pending' AND attempts < max_attempts
    ORDER BY created_at ASC
    LIMIT 10
  `),
  markEmailAsSent: db.prepare(`
    UPDATE email_queue 
    SET status = 'sent', sent_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `),
  markEmailAsFailed: db.prepare(`
    UPDATE email_queue 
    SET status = 'failed', attempts = attempts + 1, error_message = ?
    WHERE id = ?
  `),
  cleanOldEmails: db.prepare(`
    DELETE FROM email_queue 
    WHERE created_at < datetime("now", "-7 days")
  `)
};

// Initialize database on startup
initializeDatabase();

export default db;
