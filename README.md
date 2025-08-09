# UEC Launcher

Eaglercraft launcher that doesn't suck. Built because we got tired of broken client sites and sketchy downloads.

## What's included

### Core stuff
- **Landing page** that doesn't look like garbage
- **User accounts** with email verification that actually works
- **Client launcher** with all the good clients in one place
- **Store system** if you want to sell ranks or whatever
- **Admin panel** with tools that don't suck
- **Multi-domain** support for running multiple sites
- **Email system** that doesn't end up in spam folders
- **Backup system** for when you inevitably break something

### Design
- **Dark theme** because light mode is for psychopaths
- **Actually responsive** - works on phones without breaking
- **Handles load** - tested with 200+ people online

## 🚀 Quick Start (Development)

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/uec-launcher.git
   cd uec-launcher
   npm install
   ```

2. **Create Admin Account**
   ```bash
   npm run create-admin
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Platform**
   - Open browser to http://localhost:8080
   - Login with the admin credentials you created
   - Configure settings in the admin panel

## 🏭 Production Deployment

For production deployment on a VPS with support for 200+ users, see our comprehensive guide:

**📖 [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)**

This guide covers:
- VPS setup and system requirements
- PM2 process management with clustering
- Nginx configuration with SSL
- Database optimization for high load
- Monitoring and maintenance
- Backup/restore procedures
- Security hardening
- Troubleshooting

### Quick Production Setup
```bash
# 1. Setup VPS (Ubuntu 20.04+)
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx
sudo npm install -g pm2

# 2. Deploy Application
git clone https://github.com/yourusername/uec-launcher.git
cd uec-launcher
npm install
npm run build

# 3. Create Admin Account
npm run create-admin

# 4. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 5. Configure Nginx and SSL
# See PRODUCTION_DEPLOYMENT.md for detailed configuration
```

## 🔧 Admin Panel Features

### Store Management
- Add/Edit/Delete store items
- Configure Tebex integration
- Set prices, descriptions, and features
- Category organization (Ranks, Cosmetics, Features)
- Active/Inactive item control

### User Management
- View all registered users
- Ban/unban users with duration and reason
- Search and filter users
- User activity monitoring

### Domain Management
- Configure allowed domains for multi-domain deployment
- Domain verification and SSL status
- Security settings and access control

### Email System
- SMTP configuration through admin panel
- Email templates for user registration, password reset
- Email queue management and delivery tracking
- Test email functionality

### System Monitoring
- Real-time analytics dashboard
- Server logs and activity monitoring
- Backup management and restoration
- Performance metrics

## 📱 User Flow

### New Users
1. Land on homepage → Register account
2. Email verification (if enabled)
3. Redirected to dashboard
4. Select client from dropdown → Launch game
5. Access store, friends, chat features

### Admin Users  
1. Login with admin credentials
2. Access admin panel from dashboard
3. Manage store items, users, and settings
4. Monitor platform activity and performance

## 🛒 Store Configuration

### Adding Store Items
1. Access Admin Panel → Store Management
2. Click "Add Item" button
3. Fill in details:
   - Name, description, price
   - Category (rank/cosmetic/feature)
   - Features list
   - Tebex package ID (optional)
4. Save and activate

### Tebex Integration
1. Configure store URL in admin panel
2. Set webhook secret for payment verification
3. Link items to Tebex package IDs
4. Test purchase flow

## 🎯 Architecture

### Frontend (React + TypeScript)
- Vite build system with hot reload
- TailwindCSS styling with custom theme
- React Router navigation
- Context-based state management
- Production-optimized builds

### Backend (Node.js + Express)
- SQLite database with performance optimization
- JWT authentication with session management
- Email service with SMTP support
- File upload handling with validation
- Rate limiting and security middleware

### Database Schema
- Users, sessions, and authentication
- Friends and chat messaging
- Store items and purchase tracking
- News posts and content management
- System logs and analytics
- Email queue and delivery tracking

## 🔧 Development

### Available Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run create-admin     # Create admin account
npm run backup-data      # Create data backup
npm run restore-data     # Restore from backup
npm test                 # Run tests
npm run typecheck        # TypeScript validation
```

### Adding Features
- All pages ready for expansion
- Modular component structure
- Consistent styling system
- Database-backed data persistence

### Customization
- Theme colors in `client/global.css`
- Store items via admin panel
- Email templates in admin settings
- Domain configuration for multi-site

## 📊 Performance & Scaling

### Single Server (Recommended Specs)
- **CPU**: 4+ vCPUs
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Users**: 200+ concurrent

### Load Balancing (Enterprise)
- Multiple app server instances
- Redis session store
- Database clustering
- CDN integration

## 🔐 Security Features

- JWT token authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection headers
- CSRF protection
- File upload restrictions
- Domain whitelist security

## 🗄️ Data Management

### Backup System
```bash
# Create backup
npm run backup-data create

# List backups
npm run backup-data list

# Restore from backup
npm run restore-data interactive
```

### Database Migration
- Automated backup before VPS migration
- Data integrity verification
- Zero-downtime migration support

## 📧 Email Configuration

Configure SMTP through the admin panel:
1. Admin Panel → Email Settings
2. Enter SMTP credentials
3. Test connection
4. Enable email service

Supported providers:
- Gmail (with app passwords)
- SendGrid
- Mailgun
- Custom SMTP servers

## 🌐 Multi-Domain Deployment

1. **Add Domains**: Admin Panel → Domain Management
2. **DNS Configuration**: Point domains to your VPS
3. **SSL Setup**: Automated with Certbot
4. **Environment Variables**: Configure allowed domains

## 📋 Production Deployment Checklist

- [ ] VPS setup with recommended specifications
- [ ] Node.js 18+ and PM2 installed
- [ ] Database initialized and optimized
- [ ] Admin account created
- [ ] Nginx configured with SSL
- [ ] Firewall rules configured
- [ ] Monitoring and logging setup
- [ ] Backup system configured
- [ ] Email service configured
- [ ] Domain management configured
- [ ] Performance testing completed

## 🛠️ Troubleshooting

### Common Issues
1. **Application won't start**: Check PM2 logs and port availability
2. **Database errors**: Verify permissions and disk space
3. **Email not sending**: Check SMTP configuration and credentials
4. **High memory usage**: Restart PM2 with memory limits
5. **SSL certificate issues**: Renew with Certbot

### Getting Help
1. Check logs: `pm2 logs uec-launcher`
2. Review [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
3. Verify system requirements and configuration
4. Create issue with error logs and steps to reproduce

## 📞 Support

- **Documentation**: [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
- **Issues**: GitHub Issues for bugs and feature requests
- **Security**: Email security issues privately
- **Performance**: Monitor dashboard and logs

## 🎨 Theme

The platform uses a **modern dark design** with:
- Clean typography and spacing
- Smooth animations and transitions
- Consistent component design
- Mobile-responsive layouts
- Professional color scheme

---

**UEC Launcher** - The ultimate platform for Eaglercraft web clients with complete administration, multi-domain support, and enterprise-grade scalability.
