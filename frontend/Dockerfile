# --- Stage 1: Builder ---
FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy root workspace configurations
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies for workspace monorepo
RUN npm ci || npm install

# Copy frontend codebase
COPY frontend ./frontend

# Build frontend static bundle into /app/frontend/dist
RUN npm run build --workspace frontend

# --- Stage 2: Nginx Runner ---
FROM nginx:alpine AS runner

# Copy custom Nginx configuration with SPA fallback & API proxying
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]