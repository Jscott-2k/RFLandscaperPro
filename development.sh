#!/usr/bin/env bash
# Start the development environment using Docker.
# Provides preflight checks and friendly error messages so the script
# can be dropped into new environments without modification.
set -uo pipefail

preflight() {
  echo "→ Running Docker preflight checks"

  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker CLI not found. Install Docker." >&2
    return 1
  fi

  if ! docker info >/dev/null 2>&1; then
    echo "Cannot communicate with Docker daemon." >&2
    if [[ $EUID -ne 0 ]] && ! groups 2>/dev/null | grep -q '\bdocker\b'; then
      echo "You may need administrative privileges (run as root or add your user to the docker group)." >&2
    fi
    return 1
  fi
}

compose() {
  echo "→ docker compose $*"
  if ! output=$(docker compose "$@" 2>&1); then
    echo "$output" >&2
    if [[ "$output" == *"error during connect"* || "$output" == *"permission denied"* ]]; then
      echo "Failed to communicate with Docker daemon. Is it running and accessible?" >&2
    fi
    return 1
  fi
}

if [[ "${1:-}" == "--local" ]]; then
  (cd backend && npm run start:dev) &
  (cd frontend && npm start) &
  wait
else
  preflight || exit 1

  compose up -d || exit 1

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
