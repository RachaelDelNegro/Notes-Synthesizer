FROM node:20-alpine AS deps
WORKDIR /app

# Install backend deps
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci

# Copy source (including shared types)
COPY shared ./shared
COPY backend ./backend

WORKDIR /app/backend

# Build TypeScript -> dist (assumes you have npm run build)
RUN npm run build

EXPOSE 3001
ENV NODE_ENV=production

# Assumes you have "start": "node dist/index.js" in backend/package.json
CMD ["npm", "run", "start"]
