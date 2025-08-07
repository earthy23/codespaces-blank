import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the same database as the auth system
const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "uec_launcher.db");
const db = new Database(dbPath);

// Enable foreign keys for data integrity
db.pragma("foreign_keys = ON");

// Create clients table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'eaglercraft',
    enabled BOOLEAN DEFAULT TRUE,
    downloadCount INTEGER DEFAULT 0,
    fileSize INTEGER DEFAULT 0,
    fileName TEXT,
    filePath TEXT,
    features TEXT DEFAULT '[]',
    requirements TEXT DEFAULT '',
    thumbnail TEXT,
    uploaderId TEXT,
    uploaderName TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add new columns if they don't exist (migration)
try {
  db.exec(`ALTER TABLE clients ADD COLUMN extractPath TEXT`);
} catch (e) {} // Column already exists

try {
  db.exec(`ALTER TABLE clients ADD COLUMN clientFolderPath TEXT`);
} catch (e) {} // Column already exists

try {
  db.exec(`ALTER TABLE clients ADD COLUMN metadata TEXT DEFAULT '{}'`);
} catch (e) {} // Column already exists

try {
  db.exec(`ALTER TABLE clients ADD COLUMN zipValidation TEXT DEFAULT '{}'`);
} catch (e) {} // Column already exists

// Create index for better performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_clients_enabled ON clients(enabled);
  CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
  CREATE INDEX IF NOT EXISTS idx_clients_uploader ON clients(uploaderId);
`);

// Prepared statements
const statements = {
  createClient: db.prepare(`
    INSERT INTO clients (id, name, version, description, type, enabled, fileSize, fileName, filePath, extractPath, clientFolderPath, features, requirements, uploaderId, uploaderName, metadata, zipValidation, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getClientById: db.prepare("SELECT * FROM clients WHERE id = ?"),
  getAllClients: db.prepare(`
    SELECT * FROM clients 
    ORDER BY createdAt DESC 
    LIMIT ? OFFSET ?
  `),
  getEnabledClients: db.prepare(`
    SELECT * FROM clients 
    WHERE enabled = TRUE 
    ORDER BY createdAt DESC
  `),
  updateClient: db.prepare(`
    UPDATE clients SET 
      name = COALESCE(?, name),
      version = COALESCE(?, version),
      description = COALESCE(?, description),
      type = COALESCE(?, type),
      enabled = COALESCE(?, enabled),
      features = COALESCE(?, features),
      requirements = COALESCE(?, requirements),
      updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  deleteClient: db.prepare("DELETE FROM clients WHERE id = ?"),
  incrementDownloadCount: db.prepare(`
    UPDATE clients SET 
      downloadCount = downloadCount + 1,
      updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  getClientCount: db.prepare("SELECT COUNT(*) as count FROM clients"),
  getEnabledClientCount: db.prepare(
    "SELECT COUNT(*) as count FROM clients WHERE enabled = TRUE",
  ),
  searchClients: db.prepare(`
    SELECT * FROM clients 
    WHERE name LIKE ? OR description LIKE ? OR version LIKE ?
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `),
  toggleClient: db.prepare(`
    UPDATE clients SET 
      enabled = NOT enabled,
      updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
};

export class Client {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.version = data.version;
    this.description = data.description;
    this.type = data.type || "eaglercraft";
    this.enabled = Boolean(data.enabled);
    this.downloadCount = data.downloadCount || 0;
    this.fileSize = data.fileSize || 0;
    this.fileName = data.fileName;
    this.filePath = data.filePath;
    this.features = data.features ? JSON.parse(data.features) : [];
    this.requirements = data.requirements || "";
    this.thumbnail = data.thumbnail;
    this.uploaderId = data.uploaderId;
    this.uploaderName = data.uploaderName;
    this.extractPath = data.extractPath;
    this.clientFolderPath = data.clientFolderPath;
    this.metadata = data.metadata ? JSON.parse(data.metadata) : {};
    this.zipValidation = data.zipValidation
      ? JSON.parse(data.zipValidation)
      : {};
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static create(clientData) {
    const id = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    statements.createClient.run(
      id,
      clientData.name,
      clientData.version,
      clientData.description,
      clientData.type || "eaglercraft",
      clientData.enabled !== undefined ? clientData.enabled : true,
      clientData.fileSize || 0,
      clientData.fileName,
      clientData.filePath,
      clientData.extractPath || null,
      clientData.clientFolderPath || null,
      JSON.stringify(clientData.features || []),
      clientData.requirements || "",
      clientData.uploaderId,
      clientData.uploaderName,
      clientData.metadata || "{}",
      clientData.zipValidation || "{}",
      now,
      now,
    );

    return id;
  }

  static findById(id) {
    const row = statements.getClientById.get(id);
    return row ? new Client(row) : null;
  }

  static getAll(limit = 50, offset = 0) {
    const rows = statements.getAllClients.all(limit, offset);
    return rows.map((row) => new Client(row));
  }

  static getEnabled() {
    const rows = statements.getEnabledClients.all();
    return rows.map((row) => new Client(row));
  }

  static update(id, updates) {
    const client = Client.findById(id);
    if (!client) {
      throw new Error("Client not found");
    }

    statements.updateClient.run(
      updates.name || null,
      updates.version || null,
      updates.description || null,
      updates.type || null,
      updates.enabled !== undefined ? updates.enabled : null,
      updates.features ? JSON.stringify(updates.features) : null,
      updates.requirements || null,
      id,
    );

    return Client.findById(id);
  }

  static delete(id) {
    const result = statements.deleteClient.run(id);
    return result.changes > 0;
  }

  static incrementDownloadCount(id) {
    statements.incrementDownloadCount.run(id);
  }

  static getCount() {
    return statements.getClientCount.get().count;
  }

  static getEnabledCount() {
    return statements.getEnabledClientCount.get().count;
  }

  static search(query, limit = 50, offset = 0) {
    const searchTerm = `%${query}%`;
    const rows = statements.searchClients.all(
      searchTerm,
      searchTerm,
      searchTerm,
      limit,
      offset,
    );
    return rows.map((row) => new Client(row));
  }

  static toggle(id) {
    const result = statements.toggleClient.run(id);
    if (result.changes > 0) {
      return Client.findById(id);
    }
    return null;
  }

  static getStats() {
    const total = statements.getClientCount.get().count;
    const enabled = statements.getEnabledClientCount.get().count;

    // Get top downloads
    const topDownloads = db
      .prepare(
        `
      SELECT name, downloadCount 
      FROM clients 
      ORDER BY downloadCount DESC 
      LIMIT 5
    `,
      )
      .all();

    // Get by type
    const byType = db
      .prepare(
        `
      SELECT type, COUNT(*) as count
      FROM clients 
      WHERE enabled = TRUE
      GROUP BY type
    `,
      )
      .all();

    return {
      total,
      enabled,
      disabled: total - enabled,
      topDownloads,
      byType,
    };
  }
}

export default Client;
