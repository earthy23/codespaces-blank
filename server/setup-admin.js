import { createUser } from './models/User.js';
import bcrypt from 'bcryptjs';

async function setupAdmin() {
  try {
    console.log('🔐 Setting up default admin user...');
    
    // Hash default password with optimized salt rounds
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 8;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    // Create admin user
    const adminId = await createUser({
      username: 'admin',
      email: 'admin@localhost',
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Username: admin');
    console.log('📧 Email: admin@localhost');
    console.log('🔒 Password: admin123');
    console.log('🆔 User ID:', adminId);
    
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('ℹ���  Admin user already exists');
    } else {
      console.error('❌ Error creating admin user:', error.message);
    }
  }
}

setupAdmin();
