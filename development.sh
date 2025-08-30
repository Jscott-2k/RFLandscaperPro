#!/usr/bin/env bash
set -e

NETWORK=rflandscaperpro
if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
  docker network create "$NETWORK"
fi

services=(db logging mailhog backend frontend prometheus grafana)
for dir in "${services[@]}"; do
  echo "Starting $dir..."
  (cd "$dir" && docker compose -f docker-compose.yml -f docker-compose.override.yml up -d)
done
