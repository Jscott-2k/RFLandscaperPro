#!/usr/bin/env bash
set -e

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
