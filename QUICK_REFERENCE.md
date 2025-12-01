# Quick Reference Card

Print this page or keep it handy during VPS deployment.

## Pre-Deployment Checklist (5 min)

```bash
# ✅ Verify code is ready
git log --all --full-history -- '.env'  # Should show nothing or old history
pnpm typecheck                           # Must pass
pnpm build                               # Must succeed

# ✅ Verify environment variables are documented
cat .env.example | grep "VITE_FIREBASE"
cat .env.example | grep "R2_"
```

## VPS Deployment (1 hour total)

### Prerequisites
- VPS with Ubuntu 20.04+ or Debian 11+
- SSH access configured
- Domain name pointing to VPS IP (optional but recommended)

### Installation (30 min)

```bash
# 1. Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Create application directory
sudo mkdir -p /var/www/doxing-dot-life
cd /var/www/doxing-dot-life

# 3. Clone repository
git clone https://github.com/YOUR_USERNAME/doxing-dot-life.git .

# 4. Create .env file with your credentials
sudo nano .env
# Copy from .env.example and fill in:
# - VITE_FIREBASE_* (from Firebase Console)
# - FIREBASE_* (from Firebase Service Account)
# - R2_* (from Cloudflare R2)
# - VITE_AUTHORIZED_EMAILS (your Gmail addresses)

# 5. Set permissions
sudo chmod 600 .env
sudo chown www-data:www-data /var/www/doxing-dot-life -R

# 6. Install dependencies and build
pnpm install
pnpm build
```

### Service Setup (15 min)

```bash
# 1. Create systemd service
sudo tee /etc/systemd/system/doxing-dot-life.service > /dev/null <<'EOF'
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

[Install]
WantedBy=multi-user.target
EOF

# 2. Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable doxing-dot-life.service
sudo systemctl start doxing-dot-life.service

# 3. Verify status
sudo systemctl status doxing-dot-life.service
```

### Nginx Setup (15 min)

```bash
# 1. Install Nginx
sudo apt-get install -y nginx

# 2. Create Nginx config
sudo tee /etc/nginx/sites-available/doxing-dot-life > /dev/null <<'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 500M;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

# 3. Enable site and test
sudo ln -s /etc/nginx/sites-available/doxing-dot-life /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### SSL Certificate (Optional - 10 min)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate (replaces HTTP with HTTPS)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Post-Deployment Verification (5 min)

```bash
# Test application
curl http://localhost:3000

# Test health endpoint
curl https://your-domain.com/api/health
# Should return: { "status": "ok", "firebaseConfigured": true, "r2": { "configured": true } }

# Check logs
sudo journalctl -u doxing-dot-life.service -n 50

# Monitor in real-time
sudo journalctl -u doxing-dot-life.service -f
```

## Credentials Checklist

Gather these BEFORE deployment:

### Firebase (Get from console.firebase.google.com)
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` (format: yourproject.firebaseapp.com)
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` (format: yourproject.appspot.com)
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `FIREBASE_PROJECT_ID` (from service account)
- [ ] `FIREBASE_PRIVATE_KEY` (from service account JSON)
- [ ] `FIREBASE_CLIENT_EMAIL` (from service account)

### Cloudflare R2 (Get from dash.cloudflare.com)
- [ ] `R2_ACCESS_KEY_ID`
- [ ] `R2_SECRET_ACCESS_KEY`
- [ ] `R2_ACCOUNT_ID`
- [ ] `R2_BUCKET_NAME`

### Application Settings
- [ ] `VITE_AUTHORIZED_EMAILS` (comma-separated Gmail addresses)

## Troubleshooting Commands

```bash
# Application won't start
sudo journalctl -u doxing-dot-life.service -n 100 -e

# Port 3000 already in use
sudo lsof -i :3000

# Check environment variables loaded
sudo systemctl show-environment | grep FIREBASE

# Nginx not connecting to app
curl http://localhost:3000

# Verify .env file
sudo cat /var/www/doxing-dot-life/.env | head -20

# Restart everything
sudo systemctl restart doxing-dot-life.service
sudo systemctl restart nginx
```

## Service Commands

```bash
# Start/Stop/Restart
sudo systemctl start doxing-dot-life.service
sudo systemctl stop doxing-dot-life.service
sudo systemctl restart doxing-dot-life.service

# View logs
sudo journalctl -u doxing-dot-life.service -f

# View status
sudo systemctl status doxing-dot-life.service

# Enable on boot
sudo systemctl enable doxing-dot-life.service
```

## Firewall Setup (UFW)

```bash
# Enable firewall
sudo ufw enable

# Allow necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Check rules
sudo ufw status numbered
```

## Updating After Deployment

```bash
cd /var/www/doxing-dot-life

# Pull latest code
git pull origin main

# Rebuild
pnpm install
pnpm build

# Restart service
sudo systemctl restart doxing-dot-life.service

# Monitor
sudo journalctl -u doxing-dot-life.service -f
```

## Credential Rotation (Quarterly)

```bash
# 1. Get new credentials from Firebase/Cloudflare
# 2. Update .env file
sudo nano /var/www/doxing-dot-life/.env

# 3. Restart application
sudo systemctl restart doxing-dot-life.service

# 4. Delete old credentials from Firebase/Cloudflare console
# 5. Monitor logs for errors
sudo journalctl -u doxing-dot-life.service -f
```

## Documentation Links

- **Full Deployment Guide**: [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md)
- **Security Checklist**: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
- **Verification Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Firebase Setup**: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **Environment Variables**: [.env.example](./.env.example)
- **Setup Summary**: [SETUP_SUMMARY.md](./SETUP_SUMMARY.md)

## Emergency Contacts

- **Firebase Support**: https://firebase.google.com/support
- **Cloudflare Support**: https://support.cloudflare.com
- **Let's Encrypt**: https://letsencrypt.org/support/
- **Node.js Docs**: https://nodejs.org/docs/

---

**Deployment Time**: ~1 hour for complete setup  
**Difficulty**: Intermediate (requires Linux command line knowledge)  
**Tested on**: Ubuntu 20.04 LTS, Debian 11, CentOS 8+

