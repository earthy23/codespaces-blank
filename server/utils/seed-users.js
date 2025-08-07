import { createUser } from "../models/User.js";
import { logActivity } from "./logger.js";
import bcrypt from "bcryptjs";

// Sample user data for realistic dashboard
const sampleUsers = [
  { username: "john_doe", email: "john@example.com" },
  { username: "jane_smith", email: "jane@example.com" },
  { username: "mike_wilson", email: "mike@example.com" },
  { username: "sarah_jones", email: "sarah@example.com" },
  { username: "alex_brown", email: "alex@example.com" },
  { username: "lisa_garcia", email: "lisa@example.com" },
  { username: "tom_anderson", email: "tom@example.com" },
  { username: "emily_davis", email: "emily@example.com" },
  { username: "david_miller", email: "david@example.com" },
  { username: "anna_taylor", email: "anna@example.com" },
  { username: "chris_martin", email: "chris@example.com" },
  { username: "jessica_lee", email: "jessica@example.com" },
  { username: "ryan_clark", email: "ryan@example.com" },
  { username: "megan_white", email: "megan@example.com" },
  { username: "kevin_hall", email: "kevin@example.com" }
];

export async function seedUsers() {
  try {
    console.log("🌱 Seeding database with sample users...");
    
    const hashedPassword = bcrypt.hashSync("password123", 8);
    let createdCount = 0;
    
    for (const userData of sampleUsers) {
      try {
        // Create user
        const userId = createUser({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          role: "user"
        });
        
        // Log registration activity
        await logActivity({
          userId,
          username: userData.username,
          action: "user_registered",
          category: "auth",
          level: "info",
          details: {
            method: "seeded",
            timestamp: new Date().toISOString()
          }
        });
        
        // Simulate some login activity
        if (Math.random() > 0.3) {
          await logActivity({
            userId,
            username: userData.username,
            action: "user_login",
            category: "auth",
            level: "info",
            details: {
              method: "password",
              ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
              timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            }
          });
        }
        
        createdCount++;
        console.log(`✅ Created user: ${userData.username}`);
        
      } catch (error) {
        if (error.message.includes("UNIQUE constraint failed")) {
          console.log(`⚠️  User ${userData.username} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating user ${userData.username}:`, error.message);
        }
      }
    }
    
    // Generate some additional activity logs
    const activities = [
      { action: "page_viewed", category: "navigation" },
      { action: "file_downloaded", category: "content" },
      { action: "settings_updated", category: "user" },
      { action: "profile_updated", category: "user" },
      { action: "message_sent", category: "communication" },
      { action: "friend_request_sent", category: "social" },
      { action: "server_joined", category: "gaming" },
      { action: "customization_applied", category: "personalization" }
    ];
    
    for (let i = 0; i < 50; i++) {
      const activity = activities[Math.floor(Math.random() * activities.length)];
      const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
      
      await logActivity({
        userId: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username: randomUser.username,
        action: activity.action,
        category: activity.category,
        level: "info",
        details: {
          timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    }
    
    console.log(`🎉 Database seeding completed! Created ${createdCount} new users and generated activity logs.`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedUsers();
  process.exit(0);
}
