# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy manifests first for caching
COPY shared/package.json shared/package-lock.json ./shared/
COPY backend/package.json backend/package-lock.json ./backend/

# Install deps
RUN cd shared && npm ci
RUN cd backend && npm ci

# Copy source
COPY shared ./shared
COPY backend ./backend

# Build shared then backend
RUN cd shared && npm run build
RUN cd backend && npm run build

WORKDIR /app/backend
EXPOSE 3001
CMD ["npm", "start"]
