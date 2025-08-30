#!/usr/bin/env bash
set -e

docker compose down

if [[ "$1" == "--prune" ]]; then
  docker network prune -f
fi
