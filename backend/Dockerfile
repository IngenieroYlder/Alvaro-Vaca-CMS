# Build Stage
FROM node:20-bookworm-slim AS builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Install all dependencies (including dev for building)
RUN npm ci

COPY . .

# Build the application
RUN npm run build

# Prune dev dependencies to keep the image small
RUN npm prune --production

# Production Stage
FROM node:20-bookworm-slim

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/views ./views
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
