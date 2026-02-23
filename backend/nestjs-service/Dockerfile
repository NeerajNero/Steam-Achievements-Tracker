# Build stage (Debian-based for better npm/native module compatibility)
FROM node:20-slim AS builder

WORKDIR /app

# Copy only package.json so lockfile doesn't conflict with current deps
COPY package.json ./
RUN npm install --legacy-peer-deps

# Prisma schema and generate client
COPY src/api/db/prisma/schema.prisma ./src/api/db/prisma/
RUN npx prisma generate --schema=src/api/db/prisma/schema.prisma

# Source and build
COPY . .
RUN npm run build && npm prune --omit=dev

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files, pruned node_modules (from builder), and built app
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

USER node
CMD ["node", "dist/main.js"]
