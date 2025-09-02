#!/usr/bin/env bash
set -euo pipefail

# Stop containers and remove volumes
docker compose down -v

if [[ "${1:-}" == "--prune" ]]; then
  docker network prune -f
fi
