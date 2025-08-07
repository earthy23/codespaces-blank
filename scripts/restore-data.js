#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';

const execAsync = promisify(exec);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DATA_DIR = path.join(process.cwd(), 'data');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function listAvailableBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('📂 No backups directory found');
    return [];
  }
  
  const backupFiles = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('uec-backup-') && file.endsWith('.tar.gz'))
    .map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        created: stats.mtime,
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB'
      };
    })
    .sort((a, b) => b.created - a.created);
  
  return backupFiles;
}

async function restoreFromBackup(backupPath) {
  try {
    console.log('🔄 Starting data restore...');
    
    // Verify backup file exists
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    // Create backup of current data if it exists
    if (fs.existsSync(DATA_DIR)) {
      console.log('💾 Creating backup of current data...');
      const currentBackupName = `current-data-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.tar.gz`;
      const currentBackupPath = path.join(BACKUP_DIR, currentBackupName);
      
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }
      
      const backupCommand = `tar -czf "${currentBackupPath}" -C "${process.cwd()}" data/`;
      await execAsync(backupCommand);
      console.log(`✅ Current data backed up to: ${currentBackupName}`);
    }
    
    // Remove current data directory
    if (fs.existsSync(DATA_DIR)) {
      console.log('🗑️  Removing current data...');
      fs.rmSync(DATA_DIR, { recursive: true, force: true });
    }
    
    // Extract backup
    console.log('📦 Extracting backup...');
    const extractCommand = `tar -xzf "${backupPath}" -C "${process.cwd()}"`;
    await execAsync(extractCommand);
    
    console.log('✅ Data restored successfully!');
    console.log('🚀 You may need to restart the application to apply changes.');
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    
    // Try to restore from current backup if available
    const currentBackups = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('current-data-backup-'))
      .sort()
      .reverse();
    
    if (currentBackups.length > 0) {
      console.log('🔧 Attempting to restore from current data backup...');
      try {
        const restoreCommand = `tar -xzf "${path.join(BACKUP_DIR, currentBackups[0])}" -C "${process.cwd()}"`;
        await execAsync(restoreCommand);
        console.log('✅ Current data restored successfully');
      } catch (restoreError) {
        console.error('❌ Failed to restore current data:', restoreError.message);
      }
    }
    
    process.exit(1);
  }
}

async function interactiveRestore() {
  try {
    console.log('🔄 UEC Launcher - Data Restore Tool\n');
    
    const backups = await listAvailableBackups();
    
    if (backups.length === 0) {
      console.log('❌ No backups found in the backups directory');
      console.log('💡 Create a backup first using: npm run backup-data create');
      process.exit(1);
    }
    
    console.log('📋 Available backups:');
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.name}`);
      console.log(`   Created: ${backup.created.toISOString()}`);
      console.log(`   Size: ${backup.size}`);
      console.log('');
    });
    
    const choice = await question('Enter backup number to restore (or "q" to quit): ');
    
    if (choice.toLowerCase() === 'q') {
      console.log('👋 Restore cancelled');
      process.exit(0);
    }
    
    const backupIndex = parseInt(choice) - 1;
    
    if (isNaN(backupIndex) || backupIndex < 0 || backupIndex >= backups.length) {
      console.log('❌ Invalid backup number');
      process.exit(1);
    }
    
    const selectedBackup = backups[backupIndex];
    
    console.log(`\n⚠️  You are about to restore from: ${selectedBackup.name}`);
    console.log('⚠️  This will REPLACE all current data!');
    console.log('⚠️  Current data will be backed up before restoration.');
    
    const confirm = await question('\nType "CONFIRM" to proceed: ');
    
    if (confirm !== 'CONFIRM') {
      console.log('👋 Restore cancelled');
      process.exit(0);
    }
    
    await restoreFromBackup(selectedBackup.path);
    
  } catch (error) {
    console.error('❌ Restore process failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function restoreFromFile(backupFile) {
  try {
    let backupPath;
    
    // Check if it's a full path or just filename
    if (path.isAbsolute(backupFile)) {
      backupPath = backupFile;
    } else {
      backupPath = path.join(BACKUP_DIR, backupFile);
    }
    
    await restoreFromBackup(backupPath);
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }
}

// CLI handling
const command = process.argv[2];
const backupFile = process.argv[3];

switch (command) {
  case 'interactive':
    interactiveRestore();
    break;
  case 'file':
    if (!backupFile) {
      console.log('❌ Please specify a backup file');
      console.log('Usage: npm run restore-data file <backup-filename>');
      process.exit(1);
    }
    restoreFromFile(backupFile);
    break;
  default:
    console.log('📚 UEC Launcher - Data Restore Tool');
    console.log('');
    console.log('Usage:');
    console.log('  npm run restore-data interactive    - Interactive restore with backup selection');
    console.log('  npm run restore-data file <backup>  - Restore from specific backup file');
    console.log('');
    console.log('Examples:');
    console.log('  npm run restore-data interactive');
    console.log('  npm run restore-data file uec-backup-2024-01-15T10-30-00-000Z.tar.gz');
    console.log('');
    console.log('⚠️  WARNING: Restore will replace ALL current data!');
    break;
}
