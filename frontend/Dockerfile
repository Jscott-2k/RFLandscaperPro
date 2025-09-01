# syntax=docker/dockerfile:1

# ---------- Build Stage ----------
ARG NODE_VERSION=24.3.0
FROM node:${NODE_VERSION}-slim AS build

# Set working directory
WORKDIR /app

# Install dependencies using workspaces
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY shared/package.json shared/package.json
RUN npm ci --include=dev --workspace frontend

# Copy source code
COPY frontend/ frontend/
COPY shared/ shared/

# Build the Angular app
RUN npm run build

# ---------- Production Stage ----------
FROM node:${NODE_VERSION}-slim AS prod

# Set working directory for the runtime image
WORKDIR /app

# Install only production dependencies for the frontend workspace
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/frontend/package.json frontend/package.json
COPY --from=build /app/shared/package.json shared/package.json
RUN npm ci --omit=dev --workspace frontend

# Copy the built application
COPY --from=build /app/dist ./dist

# Expose the port used by the Node server
EXPOSE 4000

# Start the server
CMD ["node", "dist/frontend/server/server.mjs"]
