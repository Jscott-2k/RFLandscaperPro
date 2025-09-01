#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--local" ]]; then
  (cd backend && npm run start:dev) &
  (cd frontend && npm start) &
  wait
else
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker CLI not found. Install Docker." >&2
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "Docker daemon not running or not reachable." >&2
    exit 1
  fi

  docker compose up -d

  printf '%s\n' \
    'Services are available at the following endpoints:' \
    'Frontend: http://localhost:4200' \
    'Backend: http://localhost:3000' \
    'Swagger UI: http://localhost:3000/docs' \
    'Log Server: http://localhost:9880' \
    'Mailhog UI: http://localhost:8025 (SMTP: smtp://localhost:1025)' \
    'Database: postgres://localhost:5432' \
    'Prometheus: http://localhost:9090' \
    'Grafana: http://localhost:3001'
fi
