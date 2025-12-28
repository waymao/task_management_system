# Docker Deployment Guide

This guide covers running the agenda management backend using Docker and Docker Compose.

## Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)

## Quick Start

### 1. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
# Required: Google Calendar OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# Optional
DEFAULT_USER_ID=default-user-1
```

### 2. Start the Backend

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f backend

# Check status
docker-compose ps
```

The backend will be available at `http://localhost:3000/api`

### 3. Verify It's Running

```bash
# Health check
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","timestamp":"..."}
```

## PM2 Process Management

The backend runs with PM2 inside Docker, providing:

- **Automatic Restarts**: Process restarts on crashes
- **Cluster Mode**: Run multiple instances for better CPU utilization
- **Zero-Downtime Reloads**: Graceful process management
- **Memory Monitoring**: Auto-restart on memory threshold
- **Detailed Logs**: Better structured logging

### PM2 Commands in Docker

```bash
# View PM2 status
docker-compose exec backend pm2 status

# View real-time logs
docker-compose exec backend pm2 logs

# Monitor resources
docker-compose exec backend pm2 monit

# Restart the app
docker-compose exec backend pm2 restart agenda-backend

# Reload with zero downtime
docker-compose exec backend pm2 reload agenda-backend
```

### Enable Cluster Mode

To run multiple instances (utilize all CPU cores):

1. Update `docker-compose.yml`:
   ```yaml
   environment:
     PM2_INSTANCES: max  # or specific number like 2, 4
   ```

2. Restart:
   ```bash
   docker-compose up -d
   ```

### PM2 Configuration

Edit `packages/backend/ecosystem.config.cjs` to customize:

```javascript
module.exports = {
  apps: [{
    name: 'agenda-backend',
    instances: process.env.PM2_INSTANCES || 1,
    max_memory_restart: '512M',  // Adjust memory limit
    // ... more options
  }]
};
```

## Management Commands

### Stop the Backend

```bash
docker-compose down
```

### Restart the Backend

```bash
docker-compose restart backend
```

### View Logs

```bash
# Follow logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Rebuild After Code Changes

```bash
# Rebuild the image
docker-compose build

# Or rebuild and restart
docker-compose up -d --build
```

## Data Persistence

The SQLite database is persisted in a Docker volume named `backend-data`. This means:
- Data survives container restarts
- Data survives image rebuilds
- Data is lost only if you explicitly remove the volume

### Backup Database

```bash
# Copy database from container
docker-compose exec backend cat /app/data/prod.db > backup.db

# Or using volume
docker run --rm -v agenda_management_backend-data:/data -v $(pwd):/backup alpine cp /data/prod.db /backup/backup.db
```

### Restore Database

```bash
# Copy database to container
docker-compose cp backup.db backend:/app/data/prod.db

# Restart to apply
docker-compose restart backend
```

### Reset Database (Caution!)

```bash
# Stop containers
docker-compose down

# Remove the volume (deletes all data)
docker volume rm agenda_management_backend-data

# Start fresh
docker-compose up -d
```

## Running Prisma Commands

### Access Prisma Studio

```bash
docker-compose exec backend npx prisma studio
```

Then open `http://localhost:5555` in your browser.

### Run Database Migrations

Migrations are automatically run on container startup. To run manually:

```bash
docker-compose exec backend npx prisma migrate deploy
```

### Generate Prisma Client

```bash
docker-compose exec backend npx prisma generate
```

## Production Deployment

### Using Docker Compose in Production

1. **Update environment variables** in `.env`:
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google/callback
   NODE_ENV=production
   ```

2. **Use a reverse proxy** (nginx, Traefik, etc.) in front of the container

3. **Example nginx configuration** (add to docker-compose.yml):

```yaml
services:
  backend:
    # ... existing config
    expose:
      - "3000"
    # Don't expose ports directly in production
    # ports:
    #   - "3000:3000"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
```

### Environment-Specific Configs

Create different compose files for different environments:

```bash
# Development
docker-compose.yml

# Production
docker-compose.prod.yml
```

Run with:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Missing .env file
# - Invalid environment variables
# - Port 3000 already in use
```

### Port Already in Use

Change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use port 3001 on host
```

### Database Locked Error

```bash
# Stop all containers
docker-compose down

# Remove database lock
docker run --rm -v agenda_management_backend-data:/data alpine rm -f /data/prod.db-journal

# Restart
docker-compose up -d
```

### Prisma Migration Issues

```bash
# Reset migrations (caution: deletes data)
docker-compose exec backend npx prisma migrate reset

# Or manually fix
docker-compose exec backend sh
cd /app
npx prisma migrate resolve --applied MIGRATION_NAME
```

## Advanced Configuration

### Custom Database Location

Mount a specific directory instead of using a volume:

```yaml
volumes:
  - ./data:/app/data  # Use local ./data directory
```

### Resource Limits

Add resource constraints:

```yaml
services:
  backend:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Network Configuration

Create a custom network:

```yaml
networks:
  agenda-network:
    driver: bridge

services:
  backend:
    networks:
      - agenda-network
```

## Monitoring

### Health Checks

The container includes a health check that runs every 30 seconds:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' agenda-backend
```

### Logs

```bash
# View real-time logs
docker-compose logs -f backend

# Export logs to file
docker-compose logs backend > backend.log
```

### Resource Usage

```bash
# Monitor resource usage
docker stats agenda-backend
```

## Security Best Practices

1. **Don't commit `.env` file** - Use `.env.example` as template
2. **Use secrets for sensitive data** in production (Docker Swarm secrets, Kubernetes secrets)
3. **Run as non-root user** (already configured in Dockerfile)
4. **Keep images updated**:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```
5. **Scan for vulnerabilities**:
   ```bash
   docker scan agenda-backend
   ```

## Integration with Frontend

If deploying both frontend and backend with Docker:

```yaml
services:
  backend:
    # ... existing config

  frontend:
    build:
      context: ./packages/frontend
    ports:
      - "80:80"
    environment:
      VITE_API_URL: http://backend:3000/api
    depends_on:
      - backend
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full production deployment with nginx.
