# Multi-stage TypeScript build adhering to non-root container security principles
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies for TypeScript compilation
COPY package*.json tsconfig.json ./
RUN npm ci --ignore-scripts

# Copy TypeScript source
COPY src/ ./src/

# Compile TypeScript to JavaScript in /app/dist
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

# Install curl for container health check probe and ffmpeg for media transcoding
RUN apk add --no-cache curl ffmpeg

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled JavaScript output and frontend dashboard assets
COPY --from=builder /app/dist ./dist
COPY public/ ./public/

# Configure non-root user and persistent storage directory with separated subfolders
RUN mkdir -p /app/uploads/originals /app/uploads/processed /app/uploads/thumbnails && \
    addgroup -g 10001 appgroup && \
    adduser -u 10001 -G appgroup -s /bin/sh -D appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

ENV PORT=5000 \
    NODE_ENV=production \
    STORAGE_DIR=/app/uploads

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/healthz || exit 1

CMD ["node", "dist/server.js"]
