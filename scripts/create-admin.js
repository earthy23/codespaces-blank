#!/usr/bin/env node

import readline from 'readline';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let input = '';
    
    const onData = (char) => {
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(input);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007F': // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          input += char;
          process.stdout.write('*');
          break;
      }
    };
    
    process.stdin.on('data', onData);
  });
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.length >= 8;
}

async function createAdminAccount() {
  console.log('🔐 UEC Launcher - Admin Account Creation\n');
  
  try {
    // Get username
    let username;
    while (true) {
      username = await question('Enter admin username: ');
      if (username.trim().length >= 3) {
        break;
      }
      console.log('❌ Username must be at least 3 characters long.');
    }
    
    // Get email
    let email;
    while (true) {
      email = await question('Enter admin email: ');
      if (validateEmail(email)) {
        break;
      }
      console.log('❌ Please enter a valid email address.');
    }
    
    // Get password
    let password;
    while (true) {
      password = await questionHidden('Enter admin password (min 8 chars): ');
      if (validatePassword(password)) {
        break;
      }
      console.log('❌ Password must be at least 8 characters long.');
    }
    
    // Confirm password
    let confirmPassword;
    while (true) {
      confirmPassword = await questionHidden('Confirm admin password: ');
      if (password === confirmPassword) {
        break;
      }
      console.log('❌ Passwords do not match. Please try again.');
    }
    
    console.log('\n🔄 Creating admin account...');
    
    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);
    
    // Create admin user object
    const adminUser = {
      id: 'admin_' + Date.now(),
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      emailVerified: true,
      mustChangePassword: false
    };
    
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Load existing users or create new array
    const usersFile = path.join(dataDir, 'users.json');
    let users = [];
    
    if (fs.existsSync(usersFile)) {
      try {
        const usersData = fs.readFileSync(usersFile, 'utf8');
        users = JSON.parse(usersData);
      } catch (error) {
        console.log('⚠️  Error reading existing users file, creating new one.');
        users = [];
      }
    }
    
    // Check if admin already exists
    const existingAdmin = users.find(user => user.username === username || user.email === email);
    if (existingAdmin) {
      console.log('❌ An account with this username or email already exists.');
      process.exit(1);
    }
    
    // Add admin user
    users.push(adminUser);
    
    // Save users file
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    
    console.log('✅ Admin account created successfully!');
    console.log(`📧 Username: ${username}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔒 Password: [Hidden]`);
    console.log('\n🚀 You can now log in to the admin panel.');
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
createAdminAccount();
