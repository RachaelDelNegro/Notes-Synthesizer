FROM node:20-alpine AS build
WORKDIR /app

# Install frontend deps
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

# shared types used by frontend build
COPY shared ./shared
COPY frontend ./frontend

# Build Vite -> dist
RUN cd frontend && npm run build

FROM nginx:alpine

# Nginx config to:
# - serve the built frontend
# - proxy /api to backend container
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
