import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the same database path as the main database config
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "uec_launcher.db");
const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Create users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    banned BOOLEAN DEFAULT FALSE,
    banReason TEXT,
    banExpiry TEXT,
    lastLogin TEXT,
    loginCount INTEGER DEFAULT 0,
    settings TEXT DEFAULT '{}',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add new columns if they don't exist (migration)
try {
  db.exec(`ALTER TABLE users ADD COLUMN bio TEXT`);
} catch (e) {} // Column already exists

try {
  db.exec(`ALTER TABLE users ADD COLUMN avatar TEXT`);
} catch (e) {} // Column already exists

try {
  db.exec(`ALTER TABLE users ADD COLUMN customization TEXT DEFAULT '{}'`);
} catch (e) {} // Column already exists

try {
  db.exec(`ALTER TABLE users ADD COLUMN socialLinks TEXT DEFAULT '{}'`);
} catch (e) {} // Column already exists

try {
  db.exec(`ALTER TABLE users ADD COLUMN badges TEXT DEFAULT '[]'`);
} catch (e) {} // Column already exists

try {
  db.exec(`ALTER TABLE users ADD COLUMN achievements TEXT DEFAULT '[]'`);
} catch (e) {} // Column already exists

try {
  db.exec(`ALTER TABLE users ADD COLUMN stats TEXT DEFAULT '{}'`);
} catch (e) {} // Column already exists

try {
  db.exec(`ALTER TABLE users ADD COLUMN isOnline BOOLEAN DEFAULT FALSE`);
} catch (e) {} // Column already exists

try {
  db.exec(`ALTER TABLE users ADD COLUMN lastSeen TEXT`);
} catch (e) {} // Column already exists

try {
  db.exec(
    `ALTER TABLE users ADD COLUMN mustChangePassword BOOLEAN DEFAULT FALSE`,
  );
} catch (e) {} // Column already exists

try {
  db.exec(
    `ALTER TABLE users ADD COLUMN temporaryPassword BOOLEAN DEFAULT FALSE`,
  );
} catch (e) {} // Column already exists

const createInitialAdmin = () => {
  const existingAdmin = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get("admin");

  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync("admin123", 12);
    const adminId = `admin-${Date.now()}`;

    db.prepare(
      `INSERT INTO users (id, username, email, password, role, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    ).run(adminId, "admin", "admin@localhost", hashedPassword, "admin");
  }
};

createInitialAdmin();

// Prepared statements
const statements = {
  createUser: db.prepare(`
    INSERT INTO users (id, username, email, password, role, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getUserById: db.prepare("SELECT * FROM users WHERE id = ?"),
  getUserByUsername: db.prepare("SELECT * FROM users WHERE username = ?"),
  getUserByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  updateUser: db.prepare(`
    UPDATE users SET
      username = COALESCE(?, username),
      email = COALESCE(?, email),
      password = COALESCE(?, password),
      role = COALESCE(?, role),
      banned = COALESCE(?, banned),
      banReason = COALESCE(?, banReason),
      banExpiry = COALESCE(?, banExpiry),
      lastLogin = COALESCE(?, lastLogin),
      loginCount = COALESCE(?, loginCount),
      settings = COALESCE(?, settings),
      mustChangePassword = COALESCE(?, mustChangePassword),
      temporaryPassword = COALESCE(?, temporaryPassword),
      updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  deleteUser: db.prepare("DELETE FROM users WHERE id = ?"),
  getAllUsers: db.prepare("SELECT * FROM users ORDER BY createdAt DESC"),
  getUserCount: db.prepare("SELECT COUNT(*) as count FROM users"),
  getActiveUsers: db.prepare(`
    SELECT COUNT(*) as count FROM users 
    WHERE lastLogin > datetime('now', '-24 hours')
  `),
  getBannedUsers: db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE banned = TRUE",
  ),
  searchUsers: db.prepare(`
    SELECT * FROM users 
    WHERE username LIKE ? OR email LIKE ?
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `),
};

export class User {
  static findById(id) {
    return getUserById(id);
  }
  static findByUsername(username) {
    return getUserByUsername(username);
  }
  static findByEmail(email) {
    return getUserByEmail(email);
  }
  static createUser(userData) {
    return createUser(userData);
  }
  static updateUser(id, updates) {
    return updateUser(id, updates);
  }
  static deleteUser(id) {
    return deleteUser(id);
  }
  static getAllUsers(limit, offset) {
    return getAllUsers(limit, offset);
  }
  static getUserStats() {
    return getUserStats();
  }
  static searchUsers(query, limit, offset) {
    return searchUsers(query, limit, offset);
  }
  static getUserCount() {
    return statements.getUserCount.get().count;
  }
  static getSearchCount(query) {
    const searchTerm = `%${query}%`;
    const result = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM users
      WHERE username LIKE ? OR email LIKE ?
    `,
      )
      .get(searchTerm, searchTerm);
    return result.count;
  }
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || "user";
    this.banned = Boolean(data.banned);
    this.banReason = data.banReason;
    this.banExpiry = data.banExpiry;
    this.lastLogin = data.lastLogin;
    this.loginCount = data.loginCount || 0;
    this.settings = data.settings ? JSON.parse(data.settings) : {};
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export function createUser(userData) {
  const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  statements.createUser.run(
    id,
    userData.username,
    userData.email,
    userData.password,
    userData.role || "user",
    now,
  );

  return id;
}

export function getUserById(id) {
  const row = statements.getUserById.get(id);
  return row ? new User(row) : null;
}

export function getUserByUsername(username) {
  const row = statements.getUserByUsername.get(username);
  return row ? new User(row) : null;
}

export function getUserByEmail(email) {
  const row = statements.getUserByEmail.get(email);
  return row ? new User(row) : null;
}

export function updateUser(id, updates) {
  const user = getUserById(id);
  if (!user) {
    throw new Error("User not found");
  }

  // Prepare update data with null for unchanged fields
  const updateData = {
    username: updates.username || null,
    email: updates.email || null,
    password: updates.password || null,
    role: updates.role || null,
    banned: updates.banned !== undefined ? updates.banned : null,
    banReason: updates.banReason || null,
    banExpiry: updates.banExpiry || null,
    lastLogin: updates.lastLogin || null,
    loginCount: updates.loginCount !== undefined ? updates.loginCount : null,
    settings: updates.settings ? JSON.stringify(updates.settings) : null,
    mustChangePassword:
      updates.mustChangePassword !== undefined
        ? updates.mustChangePassword
        : null,
    temporaryPassword:
      updates.temporaryPassword !== undefined
        ? updates.temporaryPassword
        : null,
  };

  statements.updateUser.run(
    updateData.username,
    updateData.email,
    updateData.password,
    updateData.role,
    updateData.banned,
    updateData.banReason,
    updateData.banExpiry,
    updateData.lastLogin,
    updateData.loginCount,
    updateData.settings,
    updateData.mustChangePassword,
    updateData.temporaryPassword,
    id,
  );

  // Handle additional fields for ban/unban
  if (updates.status) {
    const statusUpdate = db.prepare("UPDATE users SET banned = ? WHERE id = ?");
    statusUpdate.run(updates.status === "banned", id);
  }
  if (updates.banExpiresAt !== undefined) {
    const expiryUpdate = db.prepare(
      "UPDATE users SET banExpiry = ? WHERE id = ?",
    );
    expiryUpdate.run(updates.banExpiresAt, id);
  }
  if (updates.bannedBy !== undefined) {
    const bannedByUpdate = db.prepare(
      "UPDATE users SET bannedBy = ? WHERE id = ?",
    );
    bannedByUpdate.run(updates.bannedBy, id);
  }
  if (updates.bannedAt !== undefined) {
    const bannedAtUpdate = db.prepare(
      "UPDATE users SET bannedAt = ? WHERE id = ?",
    );
    bannedAtUpdate.run(updates.bannedAt, id);
  }
  if (updates.unbannedBy !== undefined) {
    const unbannedByUpdate = db.prepare(
      "UPDATE users SET unbannedBy = ? WHERE id = ?",
    );
    unbannedByUpdate.run(updates.unbannedBy, id);
  }
  if (updates.unbannedAt !== undefined) {
    const unbannedAtUpdate = db.prepare(
      "UPDATE users SET unbannedAt = ? WHERE id = ?",
    );
    unbannedAtUpdate.run(updates.unbannedAt, id);
  }

  return getUserById(id);
}

export function deleteUser(id) {
  const result = statements.deleteUser.run(id);
  return result.changes > 0;
}

export function getAllUsers(limit = 50, offset = 0) {
  const stmt = db.prepare(`
    SELECT * FROM users
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(limit, offset);
  return rows.map((row) => new User(row));
}

export function getUserStats() {
  const total = statements.getUserCount.get().count;
  const active = statements.getActiveUsers.get().count;
  const banned = statements.getBannedUsers.get().count;

  return {
    total,
    active,
    banned,
    activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
  };
}

export function searchUsers(query, limit = 50, offset = 0) {
  const searchTerm = `%${query}%`;
  const rows = statements.searchUsers.all(
    searchTerm,
    searchTerm,
    limit,
    offset,
  );
  return rows.map((row) => new User(row));
}

// Create default admin user if none exists
export function createDefaultAdmin() {
  try {
    // Check if any admin users exist
    const adminCheck = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const adminCount = adminCheck.get().count;

    if (adminCount === 0) {
      console.log('🔐 No admin users found, creating default admin...');

      // Hash default password synchronously
      const hashedPassword = bcrypt.hashSync('admin123', 12);

      // Create admin user
      const adminId = createUser({
        username: 'admin',
        email: 'admin@localhost',
        password: hashedPassword,
        role: 'admin'
      });

      console.log('✅ Default admin user created!');
      console.log('📧 Username: admin');
      console.log('🔒 Password: admin123');
      console.log('🆔 User ID:', adminId);
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Close database connection on process exit
process.on("exit", () => db.close());
process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

export default {
  User,
  createUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserStats,
  searchUsers,
  createDefaultAdmin,
};
