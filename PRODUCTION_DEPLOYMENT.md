# UEC Launcher - Production Deployment Guide

This guide will help you deploy UEC Launcher on a VPS for production use, supporting 200+ concurrent users with proper scaling, monitoring, and maintenance.

## 🏗️ System Requirements

### Minimum Requirements (50-100 users)
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Bandwidth**: 100 Mbps

### Recommended Requirements (200+ users)
- **CPU**: 4+ vCPUs
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Bandwidth**: 1 Gbps
- **OS**: Ubuntu 20.04+ or CentOS 8+

### Optimal Setup (500+ users)
- **CPU**: 8+ vCPUs
- **RAM**: 16GB+
- **Storage**: 100GB+ NVMe SSD
- **Load Balancer**: Multiple app instances
- **Database**: Dedicated database server

## 📋 Prerequisites

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git unzip htop

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Create Application User
```bash
# Create dedicated user
sudo adduser ueclauncher
sudo usermod -aG sudo ueclauncher

# Switch to app user
sudo su - ueclauncher
```

## 🚀 Application Deployment

### 1. Clone and Setup Application
```bash
# Clone repository
git clone https://github.com/yourusername/uec-launcher.git
cd uec-launcher

# Install dependencies
npm install

# Build application
npm run build
```

### 2. Create Production Environment File
```bash
# Create environment file
nano .env.production
```

Add the following configuration:
```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Domain Configuration
ALLOWED_DOMAINS=yourdomain.com,www.yourdomain.com,admin.yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database Configuration
DB_PATH=/home/ueclauncher/uec-launcher/data/uec_launcher.db
DB_BACKUP_PATH=/home/ueclauncher/backups

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here
ENCRYPTION_KEY=your-32-character-encryption-key

# Email Configuration (SMTP)
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

# File Upload Limits
MAX_FILE_SIZE=50MB
MAX_FILES_PER_USER=10

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE=0 2 * * *

# Monitoring
LOG_LEVEL=info
LOG_FILE=/home/ueclauncher/logs/app.log
```

### 3. Create Directories
```bash
# Create necessary directories
mkdir -p ~/uec-launcher/data
mkdir -p ~/uec-launcher/logs
mkdir -p ~/uec-launcher/backups
mkdir -p ~/uec-launcher/uploads

# Set permissions
chmod 755 ~/uec-launcher/data
chmod 755 ~/uec-launcher/logs
chmod 755 ~/uec-launcher/backups
chmod 755 ~/uec-launcher/uploads
```

### 4. Create Admin Account
```bash
# Create first admin account
npm run create-admin
```

### 5. PM2 Configuration
Create PM2 ecosystem file:
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'uec-launcher',
    script: 'dist/server/node-build.mjs',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Auto-restart configuration
    watch: false,
    max_memory_restart: '1G',
    
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Advanced options
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Environment variables file
    env_file: '.env.production'
  }],

  // Deployment configuration
  deploy: {
    production: {
      user: 'ueclauncher',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/uec-launcher.git',
      path: '/home/ueclauncher/uec-launcher',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

### 6. Start Application with PM2
```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions provided by the command above

# Check application status
pm2 status
pm2 logs uec-launcher
```

## 🌐 Nginx Configuration

### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/ueclauncher
```

```nginx
upstream uec_launcher {
    # Load balancing across PM2 instances
    server 127.0.0.1:3000;
    keepalive 32;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; child-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Client body size limit
    client_max_body_size 50M;

    # Proxy settings
    proxy_http_version 1.1;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Static file serving with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://uec_launcher;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://uec_launcher;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://uec_launcher;
    }

    # Main application
    location / {
        proxy_pass http://uec_launcher;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://uec_launcher;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://uec_launcher;
        access_log off;
    }
}
```

### 2. Enable Nginx Configuration
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ueclauncher /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3. Setup SSL with Certbot
```bash
# Install SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Setup auto-renewal cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 🔥 Firewall Configuration

```bash
# Install and configure UFW
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change 22 to your SSH port if different)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application port (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 3000

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status verbose
```

## 📊 Monitoring and Logging

### 1. Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/ueclauncher
```

```
/home/ueclauncher/uec-launcher/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ueclauncher ueclauncher
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 2. System Monitoring Script
```bash
nano ~/monitoring/monitor.sh
```

```bash
#!/bin/bash

# Monitor UEC Launcher
LOG_FILE="/home/ueclauncher/logs/monitor.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Check if application is running
if ! pm2 list | grep -q "online"; then
    echo "[$TIMESTAMP] ERROR: UEC Launcher is not running" >> $LOG_FILE
    pm2 restart uec-launcher
fi

# Check disk space
DISK_USAGE=$(df /home/ueclauncher | awk 'NR==2 {print $5}' | cut -d% -f1)
if [ $DISK_USAGE -gt 85 ]; then
    echo "[$TIMESTAMP] WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 85 ]; then
    echo "[$TIMESTAMP] WARNING: Memory usage is ${MEMORY_USAGE}%" >> $LOG_FILE
fi

# Check backup age
LAST_BACKUP=$(find /home/ueclauncher/backups -name "*.tar.gz" -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
if [ -n "$LAST_BACKUP" ]; then
    BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LAST_BACKUP")) / 86400 ))
    if [ $BACKUP_AGE -gt 7 ]; then
        echo "[$TIMESTAMP] WARNING: Last backup is ${BACKUP_AGE} days old" >> $LOG_FILE
    fi
fi
```

```bash
# Make executable
chmod +x ~/monitoring/monitor.sh

# Add to crontab
echo "*/5 * * * * /home/ueclauncher/monitoring/monitor.sh" | crontab -
```

### 3. Setup Automated Backups
```bash
nano ~/scripts/backup-cron.sh
```

```bash
#!/bin/bash

# Automated backup script
BACKUP_DIR="/home/ueclauncher/backups"
LOG_FILE="/home/ueclauncher/logs/backup.log"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

echo "[$TIMESTAMP] Starting automated backup..." >> $LOG_FILE

cd /home/ueclauncher/uec-launcher

# Create backup
npm run backup-data create >> $LOG_FILE 2>&1

if [ $? -eq 0 ]; then
    echo "[$TIMESTAMP] Backup completed successfully" >> $LOG_FILE
else
    echo "[$TIMESTAMP] Backup failed" >> $LOG_FILE
fi

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "[$TIMESTAMP] Backup process finished" >> $LOG_FILE
```

```bash
# Make executable
chmod +x ~/scripts/backup-cron.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /home/ueclauncher/scripts/backup-cron.sh" | crontab -
```

## 🚀 Performance Optimization

### 1. Database Optimization
```bash
# Optimize SQLite database
nano ~/scripts/optimize-db.sh
```

```bash
#!/bin/bash

DB_PATH="/home/ueclauncher/uec-launcher/data/uec_launcher.db"

# Vacuum database to reduce size and improve performance
sqlite3 $DB_PATH "VACUUM;"

# Analyze tables for query optimization
sqlite3 $DB_PATH "ANALYZE;"

# Update statistics
sqlite3 $DB_PATH "PRAGMA optimize;"

echo "Database optimization completed"
```

```bash
# Make executable and schedule weekly
chmod +x ~/scripts/optimize-db.sh
echo "0 3 * * 0 /home/ueclauncher/scripts/optimize-db.sh" | crontab -
```

### 2. Node.js Performance Settings
Add to your environment file:
```env
# Node.js optimization
NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"
UV_THREADPOOL_SIZE=16
```

### 3. PM2 Performance Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-server-monit

# Setup monitoring dashboard
pm2 web
```

## 🔧 Maintenance Tasks

### Daily Tasks
- Check application logs: `pm2 logs uec-launcher`
- Monitor system resources: `htop`
- Check disk space: `df -h`

### Weekly Tasks
- Review backup integrity
- Update system packages: `sudo apt update && sudo apt upgrade`
- Clean temporary files: `sudo apt autoremove && sudo apt autoclean`

### Monthly Tasks
- Review and rotate logs
- Update Node.js dependencies: `npm update`
- Security audit: `npm audit`
- SSL certificate renewal check: `sudo certbot certificates`

## 🚨 Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs uec-launcher

# Check if port is in use
sudo netstat -tlnp | grep :3000

# Restart application
pm2 restart uec-launcher
```

### High Memory Usage
```bash
# Check memory usage
pm2 monit

# Restart application with memory optimization
pm2 restart uec-launcher --node-args="--max-old-space-size=2048"
```

### Database Issues
```bash
# Check database integrity
sqlite3 /home/ueclauncher/uec-launcher/data/uec_launcher.db "PRAGMA integrity_check;"

# Restore from backup if needed
npm run restore-data interactive
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Test SSL configuration
openssl s_client -connect yourdomain.com:443
```

## 📈 Scaling for 200+ Users

### Load Balancing Setup
If you need to scale beyond a single server:

1. **Database Migration**: Move to PostgreSQL or MySQL for better concurrent performance
2. **Redis Session Store**: Use Redis for session management across multiple instances
3. **CDN Integration**: Use CloudFlare or AWS CloudFront for static assets
4. **Multiple App Servers**: Deploy across multiple VPS instances with a load balancer

### Example Load Balancer Configuration (HAProxy)
```
backend uec_launcher_backend
    balance roundrobin
    server app1 10.0.0.10:3000 check
    server app2 10.0.0.11:3000 check
    server app3 10.0.0.12:3000 check
```

## 🔐 Security Checklist

- [ ] SSL/TLS enabled with strong ciphers
- [ ] Firewall configured with minimal open ports
- [ ] Regular security updates applied
- [ ] Strong JWT and session secrets
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Regular backup testing
- [ ] Log monitoring for suspicious activity
- [ ] Database access restricted
- [ ] File upload restrictions in place

## 📞 Support

If you encounter issues during deployment:

1. Check the logs: `pm2 logs uec-launcher`
2. Review the troubleshooting section above
3. Ensure all prerequisites are properly installed
4. Verify your environment configuration
5. Check system resources and disk space

For additional support, create an issue in the project repository with:
- Your server specifications
- Error logs
- Steps to reproduce the issue
- Environment configuration (redact sensitive data)

---

**Congratulations!** Your UEC Launcher is now deployed and ready for production use. Remember to monitor your system regularly and keep everything updated for optimal security and performance.
