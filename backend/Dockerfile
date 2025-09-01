# syntax=docker/dockerfile:1

# ---------- Base Stage ----------
ARG NODE_VERSION=24.3.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="NestJS"

# Set working directory
WORKDIR /app

# Set environment
ENV NODE_ENV=production

# ---------- Build Stage ----------
FROM base AS build

# Install OS-level build tools
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    node-gyp \
    pkg-config \
    python-is-python3

# Install dependencies
# Leverage root workspace lockfile to install only backend deps
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY backend/package-lock.json backend/package-lock.json
COPY shared/package.json shared/package.json
RUN npm ci --include=dev --workspace backend

# Copy source code
# Copy backend and shared workspaces into the image
COPY backend/ backend/
COPY shared/ shared/

# Build the app
RUN npm run build --workspace backend

# ---------- Final Stage ----------
FROM base

# Copy build artifacts
COPY --from=build /app /app

# Expose NestJS port
EXPOSE 3000

# Start the app in production mode
CMD ["npm", "run", "start:prod", "--workspace", "backend"]
