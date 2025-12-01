# VPS Deployment Checklist

Before deploying to your VPS, use this checklist to ensure everything is ready.

## Pre-Deployment Phase

### Repository & Code Quality

- [ ] Repository is cloned and all files are present
- [ ] `.gitignore` includes `.env`, `.env.local`, and sensitive files
- [ ] No `.env` files are tracked in git history (`git log --all --full-history -- '.env'`)
- [ ] No hardcoded credentials in source code
- [ ] All tests pass: `pnpm test`
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] No linting errors: `pnpm lint` (if available)

### Environment Configuration

- [ ] `.env.example` is complete and accurate
- [ ] All required environment variables are documented
- [ ] Firebase credentials have been obtained:
  - [ ] Firebase API Key (`VITE_FIREBASE_API_KEY`)
  - [ ] Firebase Project ID (`VITE_FIREBASE_PROJECT_ID`)
  - [ ] Firebase Auth Domain (`VITE_FIREBASE_AUTH_DOMAIN`)
  - [ ] Firebase App ID (`VITE_FIREBASE_APP_ID`)
  - [ ] Firebase Messaging Sender ID (`VITE_FIREBASE_MESSAGING_SENDER_ID`)
  - [ ] Firebase Storage Bucket (`VITE_FIREBASE_STORAGE_BUCKET`)
  - [ ] Firebase Admin Credentials (Service Account JSON)
- [ ] R2 credentials have been obtained:
  - [ ] R2 Access Key ID (`R2_ACCESS_KEY_ID`)
  - [ ] R2 Secret Key (`R2_SECRET_ACCESS_KEY`)
  - [ ] R2 Account ID (`R2_ACCOUNT_ID`)
  - [ ] R2 Bucket Name (`R2_BUCKET_NAME`)
- [ ] Authorized emails are configured (`VITE_AUTHORIZED_EMAILS`)

### Local Testing

- [ ] Development environment works: `pnpm dev`
- [ ] Application starts without errors
- [ ] Firebase authentication can be tested locally
- [ ] File upload functionality works with R2
- [ ] Health check endpoint responds: `/api/health`
- [ ] All API endpoints are accessible

## VPS Preparation Phase

### VPS Infrastructure

- [ ] VPS is created with sufficient resources (2GB+ RAM, 2+ CPU cores)
- [ ] SSH access is configured and working
- [ ] Public IP address is noted
- [ ] Domain name is purchased (if applicable)
- [ ] Domain DNS is configured to point to VPS IP

### System Setup

- [ ] Ubuntu/Debian OS is installed and updated
- [ ] Node.js 18+ is installed
- [ ] npm or pnpm is installed
- [ ] Git is installed
- [ ] SSH keys are configured for git access
- [ ] `sudo` access is configured

### File System

- [ ] Application directory is created: `/var/www/doxing-dot-life`
- [ ] Directory permissions are set correctly
- [ ] Sufficient disk space is available (10GB+)
- [ ] Backup strategy is planned

## Deployment Phase

### Code Deployment

- [ ] Repository is cloned to `/var/www/doxing-dot-life`
- [ ] `.env` file is created with all credentials
- [ ] `.env` file permissions are set to 600 (`chmod 600 .env`)
- [ ] `.env` file is owned by `www-data` user
- [ ] Dependencies are installed: `pnpm install`
- [ ] Application builds successfully: `pnpm build`
- [ ] Build artifacts exist:
  - [ ] `dist/spa/` directory with frontend files
  - [ ] `dist/server/node-build.mjs` executable

### Service Configuration

- [ ] Systemd service file is created
- [ ] Service is enabled: `sudo systemctl enable doxing-dot-life`
- [ ] Service starts successfully: `sudo systemctl start doxing-dot-life`
- [ ] Service status is running: `sudo systemctl status doxing-dot-life`
- [ ] Logs show no errors: `sudo journalctl -u doxing-dot-life -n 50`

### Nginx Configuration

- [ ] Nginx is installed
- [ ] Nginx configuration file is created
- [ ] Nginx configuration is valid: `sudo nginx -t`
- [ ] Nginx is restarted: `sudo systemctl restart nginx`
- [ ] Nginx service is enabled: `sudo systemctl enable nginx`

### SSL Certificate (HTTPS)

- [ ] Certbot is installed (optional but recommended)
- [ ] SSL certificate is obtained for your domain
- [ ] Certificate auto-renewal is configured
- [ ] HTTPS redirects HTTP traffic

### Firewall

- [ ] UFW firewall is enabled (if used)
- [ ] SSH port is allowed
- [ ] HTTP port (80) is allowed
- [ ] HTTPS port (443) is allowed
- [ ] Other ports are blocked

## Post-Deployment Verification

### Connectivity Tests

- [ ] VPS is accessible via SSH: `ssh user@your-vps-ip`
- [ ] Application is running: `curl http://localhost:3000`
- [ ] Nginx reverse proxy is working: `curl http://your-domain.com`
- [ ] HTTPS is working (if configured): `curl https://your-domain.com`

### Functionality Tests

- [ ] Home page loads correctly
- [ ] Search functionality works
- [ ] Firebase login is accessible
- [ ] Authorized user can login
- [ ] Unauthorized user gets error message
- [ ] File upload works for authorized users
- [ ] Files are stored in R2 bucket
- [ ] Pagination and filtering work
- [ ] Admin panel is accessible
- [ ] Post creation works
- [ ] Post deletion works

### Health Checks

- [ ] Health endpoint responds: `curl https://your-domain.com/api/health`
- [ ] Response shows all components as configured:
  ```json
  {
    "status": "ok",
    "firebaseConfigured": true,
    "authorizedEmailsConfigured": true,
    "r2": {
      "configured": true,
      "message": "R2 configuration is valid"
    }
  }
  ```

### Performance Tests

- [ ] Page load time is acceptable (< 3 seconds)
- [ ] API responses are fast (< 500ms)
- [ ] File uploads are stable
- [ ] No 404 or 500 errors in logs

### Security Tests

- [ ] `.env` file is not accessible from web
- [ ] Git history is not accessible from web
- [ ] API authentication is working
- [ ] Unauthorized endpoints return 401/403
- [ ] CORS headers are correct
- [ ] No sensitive data in logs
- [ ] Database credentials are not exposed

## Post-Deployment Hardening

### Monitoring

- [ ] Log monitoring is configured
- [ ] Error alerts are set up
- [ ] Disk space monitoring is enabled
- [ ] Process monitoring is configured (e.g., PM2, monit)

### Backup & Recovery

- [ ] Regular backups are scheduled
- [ ] Backup restoration is tested
- [ ] Disaster recovery plan is documented
- [ ] Database dumps are included in backups

### Updates & Maintenance

- [ ] OS updates are scheduled
- [ ] Node.js updates are planned
- [ ] Dependency updates are planned
- [ ] Security patches are applied promptly

## Ongoing Operations

### Weekly

- [ ] Check application health: `curl https://your-domain.com/api/health`
- [ ] Review error logs: `sudo journalctl -u doxing-dot-life --since "7 days ago" | grep -i error`
- [ ] Verify disk space: `df -h`

### Monthly

- [ ] Update dependencies: `pnpm update && pnpm audit`
- [ ] Review user accounts and permissions
- [ ] Test backup restoration
- [ ] Performance analysis

### Quarterly

- [ ] Rotate API credentials:
  - [ ] Generate new Firebase Admin SDK key
  - [ ] Generate new R2 API token
  - [ ] Update `.env` file
  - [ ] Restart application
- [ ] Security audit
- [ ] Review and update firewall rules

### Annually

- [ ] Full security assessment
- [ ] Update SSL certificates (if using Let's Encrypt, auto-renewal handles this)
- [ ] Review and update documentation
- [ ] Plan capacity upgrades if needed

## Troubleshooting Guide

### Application Won't Start

```bash
# Check systemd logs
sudo journalctl -u doxing-dot-life.service -n 100 -e

# Check if port is in use
sudo lsof -i :3000

# Verify environment variables
sudo systemctl show-environment

# Check .env file exists and is readable
ls -la /var/www/doxing-dot-life/.env
```

### Nginx Returns 502 Bad Gateway

```bash
# Check if application is running
sudo systemctl status doxing-dot-life.service

# Check application logs
sudo journalctl -u doxing-dot-life.service -f

# Test local connection
curl http://localhost:3000

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Firebase Authentication Issues

```bash
# Verify Firebase environment variables
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL

# Test Firebase connectivity
curl https://identitytoolkit.googleapis.com/

# Check application logs for auth errors
sudo journalctl -u doxing-dot-life.service | grep -i "firebase\|auth"
```

### R2 Upload Failures

```bash
# Verify R2 credentials
echo $R2_BUCKET_NAME
echo $R2_ACCOUNT_ID

# Test R2 connectivity
curl -I https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/

# Check application logs for R2 errors
sudo journalctl -u doxing-dot-life.service | grep -i "r2\|s3"
```

### High Memory Usage

```bash
# Check memory usage
free -h
top -b -n 1 | head -20

# Increase Node.js memory limit
# Edit systemd service: sudo systemctl edit doxing-dot-life.service
# Add: Environment="NODE_OPTIONS=--max-old-space-size=2048"
```

## Documentation

- [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md) - Complete deployment guide
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) - Security considerations
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase configuration
- [.env.example](./.env.example) - Environment variable reference
- [.env.local.example](./.env.local.example) - Local development template

## Support

If you encounter issues:

1. Check the troubleshooting guide above
2. Review relevant documentation
3. Check application and system logs
4. Verify environment variables are set correctly
5. Ensure all credentials are valid and have appropriate permissions

## Sign-Off Checklist

Before considering deployment complete:

- [ ] All checklist items above are completed
- [ ] Application is stable and responsive
- [ ] Monitoring is in place
- [ ] Backups are working
- [ ] Team is trained on operations
- [ ] Documentation is accessible
- [ ] Incident response plan is in place

