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
COPY package*.json ./
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the app
RUN npm run build

# ---------- Final Stage ----------
FROM base

# Copy build artifacts
COPY --from=build /app /app

# Expose NestJS port
EXPOSE 3000

# Start the app in production mode
CMD ["npm", "run", "start:prod"]
