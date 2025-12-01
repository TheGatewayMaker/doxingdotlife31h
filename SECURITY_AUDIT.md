# Security Audit & Credential Management

This document covers security considerations for deploying the Doxing Dot Life application to a VPS.

## Critical Security Issues

### ⚠️ IMPORTANT: Remove Committed Credentials

Before deploying to a VPS, check your git history for any committed `.env` files or credentials:

```bash
# Search for .env files in git history
git log --all --full-history -- '.env'
git log --all --full-history -- '.env.local'
git log --all --full-history -- 'serviceAccountKey.json'

# Search for common secret patterns
git log -S "FIREBASE_PRIVATE_KEY" --all
git log -S "R2_SECRET_ACCESS_KEY" --all

# If found, remove them from history (CAUTION: rewrites history)
git filter-branch --tree-filter 'rm -f .env .env.local serviceAccountKey.json' HEAD
git push origin --force-with-lease
```

### ✅ Credentials Are Now Environment-Based

The application has been updated to **require** all secrets via environment variables:

- ✅ Firebase API keys → `VITE_FIREBASE_*` env vars
- ✅ Firebase Admin credentials → `FIREBASE_*` env vars  
- ✅ Cloudflare R2 credentials → `R2_*` env vars
- ✅ Authorized emails → `VITE_AUTHORIZED_EMAILS` env var

## Pre-Deployment Checklist

### 1. Clean Up Repository

```bash
# Ensure .env files are in .gitignore
cat .gitignore | grep "^\.env"

# Remove any tracked .env files
git rm --cached .env .env.local .env.production 2>/dev/null || true
git commit -m "Remove environment files from tracking"

# Verify they won't be committed
git status | grep ".env"  # Should show nothing
```

### 2. Verify No Hardcoded Secrets

Search your codebase for any hardcoded credentials:

```bash
# Search for common patterns (false positives expected)
grep -r "api_key\|apiKey" --include="*.ts" --include="*.tsx" --include="*.js" client/
grep -r "secret\|SECRET" --include="*.ts" --include="*.tsx" --include="*.js" server/

# These should only find environment variable references like:
# import.meta.env.VITE_FIREBASE_API_KEY
# process.env.R2_SECRET_ACCESS_KEY

# Make sure no actual values are hardcoded
grep -r "-----BEGIN PRIVATE KEY-----" --include="*.ts" --include="*.tsx" --include="*.js"
grep -r "AKIA" --include="*.ts" --include="*.tsx" --include="*.js"  # AWS key pattern
grep -r "v1.2.3" --include="*.ts" --include="*.tsx" --include="*.js"  # Placeholder patterns
```

### 3. Verify Environment Variable Usage

Check that all sensitive values are loaded from environment:

```bash
# Frontend (Vite)
grep -r "import.meta.env.VITE_" client/ | grep -i "firebase\|auth\|secret\|key\|password"

# Backend (Node.js)
grep -r "process.env\." server/ | grep -i "firebase\|auth\|secret\|key\|r2"
```

Expected patterns:
- ✅ `import.meta.env.VITE_FIREBASE_API_KEY` (frontend)
- ✅ `process.env.FIREBASE_PRIVATE_KEY` (backend)
- ✅ `process.env.R2_ACCESS_KEY_ID` (backend)

Unexpected patterns:
- ❌ Actual credential values in code
- ❌ Hardcoded auth tokens
- ❌ Exposed API keys

### 4. Validate Environment Configuration

Before deployment, ensure all required variables are set:

```bash
# Create a validation script
cat > validate-env.sh << 'EOF'
#!/bin/bash

required_vars=(
  "VITE_FIREBASE_API_KEY"
  "VITE_FIREBASE_AUTH_DOMAIN"
  "VITE_FIREBASE_PROJECT_ID"
  "VITE_FIREBASE_STORAGE_BUCKET"
  "VITE_FIREBASE_MESSAGING_SENDER_ID"
  "VITE_FIREBASE_APP_ID"
  "FIREBASE_PROJECT_ID"
  "FIREBASE_PRIVATE_KEY"
  "FIREBASE_CLIENT_EMAIL"
  "VITE_AUTHORIZED_EMAILS"
  "R2_ACCESS_KEY_ID"
  "R2_SECRET_ACCESS_KEY"
  "R2_ACCOUNT_ID"
  "R2_BUCKET_NAME"
)

missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
  echo "✅ All required environment variables are set"
  exit 0
else
  echo "❌ Missing environment variables:"
  for var in "${missing_vars[@]}"; do
    echo "   - $var"
  done
  exit 1
fi
EOF

chmod +x validate-env.sh
./validate-env.sh
```

## VPS Security Setup

### 1. File Permissions

After deploying to VPS, ensure proper file permissions:

```bash
# Set application owner
sudo chown -R www-data:www-data /var/www/doxing-dot-life

# Restrict .env file access
sudo chmod 600 /var/www/doxing-dot-life/.env

# Allow www-data to read/execute
sudo chmod 750 /var/www/doxing-dot-life

# Verify permissions
ls -la /var/www/doxing-dot-life/.env
# Should show: -rw------- 1 www-data www-data
```

### 2. Git Credentials

Set up git authentication without storing passwords in .env:

```bash
# Use SSH keys for git
ssh-keygen -t ed25519 -f ~/.ssh/github
# Add public key to GitHub Settings → Deploy keys

# Configure git SSH
cat > ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github
  IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config

# Clone using SSH
git clone git@github.com:your-username/doxing-dot-life.git
```

### 3. Secret Management

#### Option A: Environment Files (Recommended for VPS)

```bash
# Keep secrets in .env file on VPS only
sudo nano /var/www/doxing-dot-life/.env

# Set strict permissions
sudo chmod 600 /var/www/doxing-dot-life/.env
```

#### Option B: Systemd EnvironmentFile

Secrets in a dedicated systemd environment file:

```bash
# Create secrets file
sudo touch /etc/doxing-dot-life/secrets.env
sudo chmod 600 /etc/doxing-dot-life/secrets.env
sudo nano /etc/doxing-dot-life/secrets.env

# Add to systemd service:
# EnvironmentFile=/etc/doxing-dot-life/secrets.env
```

#### Option C: Secret Manager (Advanced)

For sensitive deployments, consider:
- HashiCorp Vault
- AWS Secrets Manager
- Doppler (integrates with Node.js)
- 1Password CLI

### 4. Audit Trail

Enable logging to track configuration changes:

```bash
# Create audit log directory
sudo mkdir -p /var/log/doxing-dot-life
sudo chown www-data:www-data /var/log/doxing-dot-life

# Configure app to log configuration changes
# In your application startup code, log when env vars are loaded
```

## Monitoring & Alerts

### 1. Failed Authentication Attempts

```bash
# Monitor login failures in Firebase
# Firebase Console → Analytics → Events → Exceptions

# Set up alerts for suspicious activity
```

### 2. Credential Rotation

Set up a schedule for rotating credentials:

```bash
# Rotate Firebase Admin SDK key annually
# 1. Generate new key in Firebase Console
# 2. Update FIREBASE_PRIVATE_KEY in .env
# 3. Delete old key from Firebase Console

# Rotate R2 API tokens annually
# 1. Generate new token in Cloudflare dashboard
# 2. Update R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY
# 3. Wait 24 hours, then delete old token
```

### 3. Log Monitoring

```bash
# Monitor application logs for errors
sudo journalctl -u doxing-dot-life.service -f | grep -i "error\|failed\|unauthorized"

# Monitor system logs for suspicious activity
sudo tail -f /var/log/auth.log | grep -i "ssh\|sudo"
```

## Testing Deployment

### Pre-Deployment Tests

```bash
# Test environment loading
node -e "
require('dotenv').config();
const vars = [
  'VITE_FIREBASE_API_KEY',
  'FIREBASE_PROJECT_ID',
  'R2_BUCKET_NAME'
];
vars.forEach(v => {
  const value = process.env[v];
  console.log(v + ':', value ? '✅ SET' : '❌ MISSING');
});
"

# Test Firebase connectivity
curl http://localhost:3000/api/health

# Test R2 connectivity
curl -I https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
```

### Post-Deployment Tests

```bash
# Test sign-in flow
# 1. Open https://your-domain.com
# 2. Click "Sign in with Google"
# 3. Verify authorized email can login
# 4. Verify unauthorized email gets error message

# Test file upload
# 1. Login with authorized email
# 2. Try uploading a file
# 3. Verify file appears in R2 bucket
# 4. Verify metadata is stored

# Test API endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/api/posts
curl https://your-domain.com/api/servers
```

## Incident Response

### Compromised Credentials

If a credential is compromised:

```bash
# 1. Immediately rotate the compromised credential
# - For Firebase: Delete key, generate new one
# - For R2: Delete token, create new token

# 2. Update .env on VPS
sudo nano /var/www/doxing-dot-life/.env
# Update the compromised variables

# 3. Restart application
sudo systemctl restart doxing-dot-life.service

# 4. Review logs for unauthorized access
sudo journalctl -u doxing-dot-life.service --since "1 hour ago"

# 5. Audit R2 bucket for suspicious uploads
# Check R2 bucket for new/modified files

# 6. Audit Firebase logs for suspicious login attempts
# Firebase Console → Audit Logs

# 7. Force re-authentication for all users
# Restart the application (step 3)
```

### Unauthorized Access

```bash
# 1. Check firewall logs
sudo ufw status numbered

# 2. Review application logs
sudo journalctl -u doxing-dot-life.service --since "24 hours ago" | grep -i "error\|failed\|unauthorized"

# 3. Check system logs
sudo tail -100 /var/log/auth.log

# 4. Look for suspicious IP addresses
sudo fail2ban-client status sshd
```

## Regular Maintenance

### Weekly

- [ ] Review application logs for errors
- [ ] Check disk space: `df -h`
- [ ] Verify backups are working

### Monthly

- [ ] Review and update dependencies: `pnpm audit`
- [ ] Check for security updates: `npm audit fix`
- [ ] Audit user access and permissions

### Quarterly

- [ ] Rotate API tokens
- [ ] Review security group/firewall rules
- [ ] Test disaster recovery procedures

### Annually

- [ ] Rotate Firebase Admin SDK key
- [ ] Rotate R2 API tokens
- [ ] Security audit of entire deployment
- [ ] Update OS and system packages

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Cloudflare R2 Security](https://developers.cloudflare.com/r2/security/)
- [Ubuntu Security Guide](https://wiki.ubuntu.com/SecurityTeam)

## Questions?

If you have security concerns:
1. Review the [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md) guide
2. Check [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for authentication setup
3. Review [.env.example](./.env.example) for all required variables

