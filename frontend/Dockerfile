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
FROM node:${NODE_VERSION}-slim AS prod

# Set working directory for the runtime image
WORKDIR /app

# Install only production dependencies
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev

# Copy the built application
COPY --from=build /app/dist ./dist

# Expose the port used by the Node server
EXPOSE 4000

# Start the server
CMD ["node", "dist/frontend/server/server.mjs"]
