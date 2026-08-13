# --- Stage 1: Builder ---
FROM node:22-alpine AS builder
WORKDIR /app

# Copy root workspace configurations
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies for workspace monorepo
RUN npm ci

# Copy backend codebase
COPY backend ./backend

# Build TypeScript to JavaScript in backend/dist
RUN npm run build --workspace backend

# --- Stage 2: Production Runner ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

# Install production dependencies only
RUN npm ci --omit=dev --workspace backend

# Copy built dist files from builder
COPY --from=builder /app/backend/dist ./backend/dist

EXPOSE 4000

CMD ["node", "backend/dist/server.js"]