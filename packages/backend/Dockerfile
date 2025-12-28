# Multi-stage build for smaller final image
FROM node:20-alpine AS builder

# Install build dependencies
WORKDIR /app

# Copy root package files (workspace)
COPY package*.json ./

# Copy backend package files
COPY packages/backend/package*.json ./packages/backend/

# Copy prisma schema
COPY packages/backend/prisma ./packages/backend/prisma/

# Install all workspace dependencies
RUN npm ci

# Copy backend source code
COPY packages/backend ./packages/backend/

# Generate Prisma client
WORKDIR /app/packages/backend
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Compile the seed script separately
RUN npx tsc prisma/seed.ts --outDir dist --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy root package files (workspace)
COPY package*.json ./

# Copy backend package files
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma/

# Install production dependencies only
RUN npm ci --production --workspace=@agenda-management/backend

# Copy Prisma client from builder (workspace dependencies are at root)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

# Copy PM2 ecosystem file
COPY packages/backend/ecosystem.config.cjs ./packages/backend/

# Copy compiled seed script
COPY --from=builder /app/packages/backend/dist/prisma/seed.js ./packages/backend/dist/

# Create directory for SQLite database
RUN mkdir -p /app/data

# Set working directory to backend
WORKDIR /app/packages/backend

# Expose the application port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/prod.db"

# Run migrations, seed database, and start the application with PM2
CMD ["sh", "-c", "npx prisma migrate deploy && pm2-runtime start ecosystem.config.cjs"]
