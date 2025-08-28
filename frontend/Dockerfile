# syntax=docker/dockerfile:1

# ---------- Build Stage ----------
ARG NODE_VERSION=24.3.0
FROM node:${NODE_VERSION}-slim AS build

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the Angular app
RUN npm run build

# ---------- Production Stage ----------
FROM nginx:alpine AS prod

# Copy compiled app to Nginx html directory
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
