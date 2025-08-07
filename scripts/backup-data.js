#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DATA_DIR = path.join(process.cwd(), 'data');

async function createBackup() {
  try {
    console.log('🗄️  Starting data backup...');
    
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    // Create timestamp for backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `uec-backup-${timestamp}`;
    const backupPath = path.join(BACKUP_DIR, `${backupName}.tar.gz`);
    
    // Check if data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      console.log('⚠️  No data directory found, creating empty backup');
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Create tar.gz backup of data directory
    console.log('📦 Creating compressed backup...');
    const command = `tar -czf "${backupPath}" -C "${process.cwd()}" data/`;
    await execAsync(command);
    
    // Get backup file size
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Backup created successfully!`);
    console.log(`📁 File: ${backupPath}`);
    console.log(`📊 Size: ${fileSizeInMB} MB`);
    
    // Clean old backups (keep last 10)
    await cleanOldBackups();
    
    return backupPath;
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

async function cleanOldBackups() {
  try {
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('uec-backup-') && file.endsWith('.tar.gz'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        created: fs.statSync(path.join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => b.created - a.created);
    
    // Keep only the 10 most recent backups
    const backupsToDelete = backupFiles.slice(10);
    
    if (backupsToDelete.length > 0) {
      console.log(`🧹 Cleaning ${backupsToDelete.length} old backup(s)...`);
      backupsToDelete.forEach(backup => {
        fs.unlinkSync(backup.path);
        console.log(`🗑️  Deleted: ${backup.name}`);
      });
    }
    
  } catch (error) {
    console.warn('⚠️  Could not clean old backups:', error.message);
  }
}

async function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('📂 No backups directory found');
      return;
    }
    
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('uec-backup-') && file.endsWith('.tar.gz'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          created: stats.mtime,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB'
        };
      })
      .sort((a, b) => b.created - a.created);
    
    if (backupFiles.length === 0) {
      console.log('📂 No backups found');
      return;
    }
    
    console.log('📋 Available backups:');
    backupFiles.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.name}`);
      console.log(`   Created: ${backup.created.toISOString()}`);
      console.log(`   Size: ${backup.size}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing backups:', error.message);
  }
}

// CLI handling
const command = process.argv[2];

switch (command) {
  case 'create':
    createBackup();
    break;
  case 'list':
    listBackups();
    break;
  default:
    console.log('📚 UEC Launcher - Data Backup Tool');
    console.log('');
    console.log('Usage:');
    console.log('  npm run backup-data create  - Create a new backup');
    console.log('  npm run backup-data list    - List available backups');
    console.log('');
    console.log('Examples:');
    console.log('  npm run backup-data create');
    console.log('  npm run backup-data list');
    break;
}
