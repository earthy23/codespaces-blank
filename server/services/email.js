import nodemailer from 'nodemailer';
import { dbHelpers } from '../database/index.js';
import { logActivity } from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeFromSettings();
  }

  async initializeFromSettings() {
    try {
      const emailEnabled = dbHelpers.getSetting.get('email_enabled')?.value === 'true';
      
      if (!emailEnabled) {
        console.log('📧 Email service disabled in settings');
        return;
      }

      const smtpHost = dbHelpers.getSetting.get('smtp_host')?.value;
      const smtpPort = parseInt(dbHelpers.getSetting.get('smtp_port')?.value || '587');
      const smtpUser = dbHelpers.getSetting.get('smtp_user')?.value;
      const smtpPassword = dbHelpers.getSetting.get('smtp_password')?.value;
      const smtpSecure = dbHelpers.getSetting.get('smtp_secure')?.value === 'true';

      if (!smtpHost || !smtpUser || !smtpPassword) {
        console.log('⚠️  Email service not configured - missing SMTP settings');
        return;
      }

      await this.configure({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword
        }
      });

      console.log('✅ Email service configured successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  async configure(config) {
    try {
      this.transporter = nodemailer.createTransporter(config);
      
      // Test the connection
      await this.transporter.verify();
      
      this.isConfigured = true;
      
      // Start processing email queue
      this.startQueueProcessor();
      
      return true;
    } catch (error) {
      console.error('❌ Email configuration failed:', error.message);
      this.isConfigured = false;
      throw error;
    }
  }

  async testConnection() {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async sendEmail(options) {
    const { to, subject, text, html, from } = options;

    try {
      if (!this.isConfigured) {
        // Add to queue if not configured for immediate sending
        return await this.addToQueue(options);
      }

      const fromEmail = from || dbHelpers.getSetting.get('from_email')?.value || 'noreply@localhost';
      
      const mailOptions = {
        from: fromEmail,
        to,
        subject,
        text,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logActivity({
        action: 'email_sent',
        category: 'system',
        level: 'info',
        details: { to, subject, messageId: result.messageId }
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      
      logActivity({
        action: 'email_failed',
        category: 'system',
        level: 'error',
        details: { to, subject, error: error.message }
      });

      // Add to queue for retry
      await this.addToQueue(options);
      
      throw error;
    }
  }

  async addToQueue(options) {
    const { to, subject, text, html, from } = options;
    const fromEmail = from || dbHelpers.getSetting.get('from_email')?.value || 'noreply@localhost';
    
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    dbHelpers.addEmailToQueue.run(
      emailId,
      to,
      fromEmail,
      subject,
      text || '',
      html || ''
    );

    return { success: true, queued: true, emailId };
  }

  async sendWelcomeEmail(user) {
    const siteName = dbHelpers.getSetting.get('site_name')?.value || 'UEC Launcher';
    
    const subject = `Welcome to ${siteName}!`;
    const text = `
Welcome to ${siteName}!

Hi ${user.username},

Thank you for registering with ${siteName}. Your account has been created successfully.

You can now:
- Launch Minecraft clients directly in your browser
- Connect with friends and chat
- Browse our store for ranks and features
- Participate in community events

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The ${siteName} Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${siteName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #333; }
        .content { line-height: 1.6; color: #555; }
        .features { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .features ul { margin: 0; padding-left: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${siteName}</div>
        </div>
        
        <div class="content">
            <h2>Welcome, ${user.username}!</h2>
            
            <p>Thank you for registering with ${siteName}. Your account has been created successfully.</p>
            
            <div class="features">
                <h3>You can now:</h3>
                <ul>
                    <li>Launch Minecraft clients directly in your browser</li>
                    <li>Connect with friends and chat</li>
                    <li>Browse our store for ranks and features</li>
                    <li>Participate in community events</li>
                </ul>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The ${siteName} Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to ${user.email} because you registered for an account.</p>
        </div>
    </div>
</body>
</html>
    `;

    return await this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const siteName = dbHelpers.getSetting.get('site_name')?.value || 'UEC Launcher';
    const adminEmail = dbHelpers.getSetting.get('admin_email')?.value;
    
    // In a real implementation, you'd have a proper domain
    const resetUrl = `http://localhost:8080/reset-password?token=${resetToken}`;
    
    const subject = `Password Reset - ${siteName}`;
    const text = `
Password Reset Request

Hi ${user.username},

You requested a password reset for your ${siteName} account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 24 hours for security reasons.

If you didn't request this password reset, please ignore this email and contact us at ${adminEmail}.

Best regards,
The ${siteName} Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - ${siteName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #333; }
        .content { line-height: 1.6; color: #555; }
        .reset-button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; color: #856404; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${siteName}</div>
        </div>
        
        <div class="content">
            <h2>Password Reset Request</h2>
            
            <p>Hi ${user.username},</p>
            
            <p>You requested a password reset for your ${siteName} account.</p>
            
            <p style="text-align: center;">
                <a href="${resetUrl}" class="reset-button">Reset Your Password</a>
            </p>
            
            <div class="warning">
                <strong>Security Notice:</strong> This link will expire in 24 hours for security reasons.
            </div>
            
            <p>If you didn't request this password reset, please ignore this email and contact us at ${adminEmail}.</p>
            
            <p>Best regards,<br>The ${siteName} Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to ${user.email} because a password reset was requested.</p>
        </div>
    </div>
</body>
</html>
    `;

    return await this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  startQueueProcessor() {
    // Process email queue every 30 seconds
    setInterval(() => {
      this.processEmailQueue();
    }, 30000);
  }

  async processEmailQueue() {
    if (!this.isConfigured) {
      return;
    }

    try {
      const pendingEmails = dbHelpers.getPendingEmails.all();
      
      for (const email of pendingEmails) {
        try {
          const mailOptions = {
            from: email.from_email,
            to: email.to_email,
            subject: email.subject,
            text: email.body,
            html: email.html_body || undefined
          };

          await this.transporter.sendMail(mailOptions);
          
          dbHelpers.markEmailAsSent.run(email.id);
          
          logActivity({
            action: 'email_sent_from_queue',
            category: 'system',
            level: 'info',
            details: { emailId: email.id, to: email.to_email }
          });
          
        } catch (error) {
          console.error(`❌ Failed to send queued email ${email.id}:`, error.message);
          
          dbHelpers.markEmailAsFailed.run(error.message, email.id);
        }
      }
      
      // Clean old emails (older than 7 days)
      dbHelpers.cleanOldEmails.run();
      
    } catch (error) {
      console.error('❌ Error processing email queue:', error.message);
    }
  }
}

export const emailService = new EmailService();
export default emailService;
