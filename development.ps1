#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

docker compose up -d

Write-Host "Services are available at the following endpoints:"
Write-Host "Frontend: http://localhost:4200"
Write-Host "Backend: http://localhost:3000"
Write-Host "Swagger UI: http://localhost:3000/docs"
Write-Host "Log Server: http://localhost:9880"
Write-Host "Mailhog UI: http://localhost:8025 (SMTP: smtp://localhost:1025)"
Write-Host "Database: postgres://localhost:5432"
Write-Host "Prometheus: http://localhost:9090"
Write-Host "Grafana: http://localhost:3001"
