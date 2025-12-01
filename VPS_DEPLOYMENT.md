# VPS Deployment Guide

This guide walks you through deploying the Doxing Dot Life application to your VPS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Cloning the Repository](#cloning-the-repository)
4. [Configuration](#configuration)
5. [Building the Application](#building-the-application)
6. [Running the Application](#running-the-application)
7. [Using Systemd (Persistent Service)](#using-systemd-persistent-service)
8. [Nginx Setup (Reverse Proxy)](#nginx-setup-reverse-proxy)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

You'll need the following on your VPS:

- **Node.js** (v18 or higher) - [Installation guide](https://nodejs.org/en/download/package-manager/)
- **npm** or **pnpm** (v8+)
- **Git** - for cloning the repository
- **Nginx** (optional, for reverse proxy)
- **UFW** or equivalent firewall

### Recommended System Requirements

- **CPU**: 2+ cores
- **RAM**: 2GB+ (4GB recommended)
- **Storage**: 10GB+ (for application, logs, and media)
- **OS**: Ubuntu 20.04 LTS or later (Debian 11+, CentOS 8+)

### Install Node.js (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Verify installation
npm --version   # Verify npm is installed
```

### Install pnpm (Optional but Recommended)

```bash
npm install -g pnpm
pnpm --version
```

## Environment Setup

### 1. Create Application Directory

```bash
# Create directory for the application
sudo mkdir -p /var/www/doxing-dot-life
cd /var/www/doxing-dot-life

# Set proper permissions
sudo chown $USER:$USER /var/www/doxing-dot-life
chmod 755 /var/www/doxing-dot-life
```

### 2. Create .env File

Create a `.env` file in the application root with all required credentials:

```bash
cat > .env << 'EOF'
# FIREBASE CONFIGURATION
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# FIREBASE ADMIN SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nKey\nHere\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com

# AUTHORIZED EMAILS
VITE_AUTHORIZED_EMAILS=admin@gmail.com,moderator@gmail.com

# CLOUDFLARE R2 STORAGE
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_ACCOUNT_ID=your_account_id
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-domain.com

# APPLICATION CONFIG
NODE_ENV=production
PORT=3000
EOF
```

**IMPORTANT**: 
- Keep the `.env` file secret - never commit it to git
- Set proper file permissions: `chmod 600 .env`
- Make sure the private key includes proper newlines (`\n`)

## Cloning the Repository

```bash
# Navigate to your application directory
cd /var/www/doxing-dot-life

# Clone the repository
git clone https://github.com/your-username/doxing-dot-life.git .

# Or if you already have git initialized:
git clone https://github.com/your-username/doxing-dot-life.git .

# Verify the clone
ls -la
```

## Configuration

### 1. Install Dependencies

```bash
cd /var/www/doxing-dot-life

# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 2. Verify Environment Variables

Before building, verify that your `.env` file is properly set:

```bash
# Test if environment variables are loaded
node -e "console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME)"
```

### 3. Type Check

```bash
pnpm typecheck
# or
npm run typecheck
```

## Building the Application

### Production Build

```bash
cd /var/www/doxing-dot-life

# Run the production build
pnpm build
# or
npm run build

# This creates:
# - dist/spa/      (frontend files)
# - dist/server/   (backend files)
```

### Verify Build

```bash
# Check that build artifacts exist
ls -la dist/spa/
ls -la dist/server/
```

## Running the Application

### Direct Command (Development)

```bash
# From /var/www/doxing-dot-life directory
source .env
pnpm start
# or
npm start
```

The app will start on `http://localhost:3000`

### Using Node Directly

```bash
cd /var/www/doxing-dot-life

# Load env and start
NODE_ENV=production PORT=3000 node dist/server/node-build.mjs
```

## Using Systemd (Persistent Service)

For production, use systemd to manage the application as a service.

### 1. Create Systemd Service File

```bash
sudo cat > /etc/systemd/system/doxing-dot-life.service << 'EOF'
[Unit]
Description=Doxing Dot Life Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/doxing-dot-life
EnvironmentFile=/var/www/doxing-dot-life/.env
ExecStart=/usr/bin/node /var/www/doxing-dot-life/dist/server/node-build.mjs
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

### 2. Update File Permissions

```bash
# Ensure www-data can access the application
sudo chown -R www-data:www-data /var/www/doxing-dot-life

# Make .env readable by www-data only
sudo chmod 600 /var/www/doxing-dot-life/.env
sudo chown www-data:www-data /var/www/doxing-dot-life/.env
```

### 3. Enable and Start Service

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable doxing-dot-life.service

# Start the service
sudo systemctl start doxing-dot-life.service

# Check status
sudo systemctl status doxing-dot-life.service

# View logs
sudo journalctl -u doxing-dot-life.service -f
```

### Service Management Commands

```bash
# Start the service
sudo systemctl start doxing-dot-life.service

# Stop the service
sudo systemctl stop doxing-dot-life.service

# Restart the service
sudo systemctl restart doxing-dot-life.service

# View logs (last 50 lines, follow new entries)
sudo journalctl -u doxing-dot-life.service -n 50 -f

# View all logs for today
sudo journalctl -u doxing-dot-life.service --since today
```

## Nginx Setup (Reverse Proxy)

### 1. Install Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

### 2. Create Nginx Configuration

```bash
sudo cat > /etc/nginx/sites-available/doxing-dot-life << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS (optional, requires SSL certificate)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for file uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Allow larger file uploads
    client_max_body_size 500M;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss;
}
EOF
```

### 3. Enable the Configuration

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/doxing-dot-life /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 4. Enable HTTPS with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

## Firewall Configuration

### UFW (Ubuntu Firewall)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Check status
sudo ufw status numbered
```

## Troubleshooting

### Application Won't Start

```bash
# Check if port 3000 is in use
sudo lsof -i :3000

# Check systemd logs
sudo journalctl -u doxing-dot-life.service -n 100

# Check if .env file is readable
ls -la /var/www/doxing-dot-life/.env
```

### Nginx Returns 502 Bad Gateway

```bash
# Check if application is running
sudo systemctl status doxing-dot-life.service

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify proxy configuration
curl http://localhost:3000/api/health
```

### Firebase Authentication Issues

```bash
# Test Firebase connectivity
curl http://localhost:3000/api/health

# Check environment variables are loaded
sudo systemctl show-environment doxing-dot-life.service
```

### File Upload Failures

```bash
# Verify R2 configuration
# Check .env file has correct R2 credentials
cat /var/www/doxing-dot-life/.env | grep R2_

# Test R2 connectivity
curl -I https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
```

### Out of Memory Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=2048" node dist/server/node-build.mjs

# Add to systemd service:
Environment="NODE_OPTIONS=--max-old-space-size=2048"
```

## Performance Optimization

### 1. Enable Caching

Update your Nginx configuration to cache static assets:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Gzip Compression

Already configured in the Nginx setup above. Verify it's working:

```bash
curl -I -H "Accept-Encoding: gzip" http://localhost/
```

### 3. Database Connection Pooling

Ensure your R2 bucket is in the same region as your VPS for optimal performance.

## Security Checklist

- [ ] `.env` file has restrictive permissions (600)
- [ ] `.env` is in `.gitignore` and never committed
- [ ] SSH keys are configured for git authentication
- [ ] Firewall allows only necessary ports (22, 80, 443)
- [ ] HTTPS is enabled with valid SSL certificate
- [ ] Regular backups are configured
- [ ] Log rotation is set up
- [ ] Fail2ban or similar is installed for DDoS protection

## Monitoring

### Check Application Health

```bash
# Health check endpoint
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "ok",
#   "environment": "production",
#   "firebaseConfigured": true,
#   "authorizedEmailsConfigured": true,
#   "r2": {
#     "configured": true,
#     "message": "R2 configuration is valid"
#   }
# }
```

### Log Monitoring

```bash
# Monitor application logs in real-time
sudo journalctl -u doxing-dot-life.service -f

# View system resource usage
top
htop  # if installed
```

## Updating the Application

```bash
# Navigate to application directory
cd /var/www/doxing-dot-life

# Pull latest changes
git pull origin main

# Install any new dependencies
pnpm install

# Rebuild
pnpm build

# Restart service
sudo systemctl restart doxing-dot-life.service

# Verify it's running
sudo systemctl status doxing-dot-life.service
```

## Support & Additional Resources

- [Node.js Official Docs](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Let's Encrypt](https://letsencrypt.org/getting-started/)

