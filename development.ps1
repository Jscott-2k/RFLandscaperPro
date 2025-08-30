#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"
$network = "rflandscaperpro"
# Check if Docker network exists; create if not
& docker network inspect $network *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Docker network '$network'..."
    & docker network create $network | Out-Null
}
$services = @("db", "logging", "mailhog", "backend", "frontend", "prometheus", "grafana")
foreach ($dir in $services) {
    Write-Host "Starting $dir..."
    Push-Location $dir
    & docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
    Pop-Location
}
