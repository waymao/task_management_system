# Deployment Guide - Agenda Management App

This guide covers deploying the app using nginx as a reverse proxy on a Linux server.

## Prerequisites

- Linux server (Ubuntu/Debian recommended)
- Node.js 18+ installed
- nginx installed
- PM2 (for process management)
- Domain name (optional, but recommended)

## Step 1: Prepare the Application

### 1.1 Clone and Install Dependencies

```bash
cd /var/www
git clone <your-repo-url> agenda_management
cd agenda_management
npm install
```

### 1.2 Build the Frontend

```bash
cd packages/frontend
npm run build
# This creates a dist/ folder with static files
```

### 1.3 Build the Backend

```bash
cd packages/backend
npm run build
# This compiles TypeScript to JavaScript in dist/
```

### 1.4 Set Up Environment Variables

Create `.env` file in `packages/backend/`:

```bash
cd packages/backend
cat > .env << 'EOF'
DATABASE_URL="file:./prod.db"
PORT=3000
NODE_ENV=production

# Google Calendar OAuth (if using)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google/callback

# Default user (adjust as needed)
DEFAULT_USER_ID=default-user-1
EOF
```

### 1.5 Run Database Migrations

```bash
cd packages/backend
npx prisma migrate deploy
npx prisma generate
```

## Step 2: Install PM2 for Process Management

```bash
npm install -g pm2

# Start the backend
cd /var/www/agenda_management/packages/backend
pm2 start dist/index.js --name agenda-backend

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
# Follow the command it outputs
```

## Step 3: Configure nginx

### 3.1 Create nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/agenda-management
```

Add this configuration:

```nginx
# HTTP server - redirects to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use certbot to generate these)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root directory for frontend static files
    root /var/www/agenda_management/packages/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend - serve static files
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 3.2 Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/agenda-management /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Step 4: Set Up SSL with Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically update nginx config
# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 5: Configure Frontend API URL

Update the frontend to use the correct API URL:

```bash
# Edit the frontend API client configuration
nano /var/www/agenda_management/packages/frontend/src/api/client.ts
```

Make sure the baseURL is set to `/api` (relative path):

```typescript
const apiClient = axios.create({
  baseURL: '/api',  // nginx will proxy to backend
  // ... rest of config
});
```

Then rebuild the frontend:

```bash
cd /var/www/agenda_management/packages/frontend
npm run build
```

## Step 6: Without SSL (Development/Testing Only)

If you don't have a domain or don't need SSL:

```nginx
server {
    listen 80;
    server_name your_server_ip;

    root /var/www/agenda_management/packages/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Managing the Application

### Check Backend Status
```bash
pm2 status
pm2 logs agenda-backend
pm2 restart agenda-backend
```

### Update the Application
```bash
cd /var/www/agenda_management
git pull

# Rebuild frontend
cd packages/frontend
npm install
npm run build

# Rebuild backend
cd ../backend
npm install
npm run build
npx prisma migrate deploy

# Restart backend
pm2 restart agenda-backend
```

### Check nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
sudo systemctl reload nginx  # Reload without downtime
```

### View Logs
```bash
# Backend logs
pm2 logs agenda-backend

# nginx access logs
sudo tail -f /var/log/nginx/access.log

# nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs agenda-backend

# Check if port 3000 is in use
sudo netstat -tlnp | grep 3000

# Manually test the backend
cd /var/www/agenda_management/packages/backend
node dist/index.js
```

### nginx 502 Bad Gateway
- Backend is not running → Check `pm2 status`
- Wrong backend port in nginx config → Verify backend PORT in .env
- Firewall blocking connections → Check firewall rules

### Frontend not loading
- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify frontend build exists: `ls /var/www/agenda_management/packages/frontend/dist/`
- Check nginx permissions: `sudo chown -R www-data:www-data /var/www/agenda_management`

### Database issues
```bash
cd /var/www/agenda_management/packages/backend
npx prisma studio  # Open database GUI
npx prisma migrate status  # Check migration status
```

## Security Recommendations

1. **Use SSL/HTTPS** - Required for Google Calendar OAuth
2. **Set up a firewall**:
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

3. **Regular backups** of the database:
   ```bash
   # Backup SQLite database
   cp /var/www/agenda_management/packages/backend/prod.db /backup/prod.db.$(date +%Y%m%d)
   ```

4. **Keep dependencies updated**:
   ```bash
   npm audit
   npm audit fix
   ```

## Performance Optimization

### Enable nginx caching
```nginx
# Add to http block in /etc/nginx/nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

# In location /api/ block
proxy_cache api_cache;
proxy_cache_valid 200 5m;
proxy_cache_key "$scheme$request_method$host$request_uri";
```

### PM2 Cluster Mode (for multiple CPU cores)
```bash
pm2 delete agenda-backend
pm2 start dist/index.js --name agenda-backend -i max
```

## Access Your Application

- Frontend: `https://yourdomain.com`
- Backend API: `https://yourdomain.com/api/`
- Health check: `https://yourdomain.com/api/health`

Your agenda management app is now deployed! 🚀
