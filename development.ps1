#!/usr/bin/env pwsh
param(
  [switch]$Rebuild,      # up --build
  [switch]$NoCache,      # build --no-cache, then up
  [string[]]$Services,   # -Services backend,frontend
  [switch]$Clean,        # down -v --remove-orphans
  [switch]$Logs,         # logs -f
  [switch]$Pull,         # pull
  [switch]$Local         # run backend and frontend without Docker
)

$ErrorActionPreference = "Stop"
Set-Location -Path (Resolve-Path "$PSScriptRoot")

if ($Local) {
  $backend = Start-Process npm -ArgumentList '--prefix','backend','run','start:dev' -PassThru
  $frontend = Start-Process npm -ArgumentList '--prefix','frontend','start' -PassThru
  Wait-Process -Id $backend.Id, $frontend.Id
  return
}

function Compose {
  param([Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args)
  Write-Host "→ docker compose $($Args -join ' ')" -ForegroundColor Cyan
  & docker compose @Args
}

# Sanity
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw "Docker not found." }
try { docker info | Out-Null } catch { throw "Docker daemon not running." }

# Optional bits
if ($Clean) { Compose down -v --remove-orphans @Services }
if ($Pull)  { Compose pull @Services }

# Build/run
if ($NoCache) {
  Compose build --no-cache @Services
  Compose up -d @Services
}
elseif ($Rebuild) {
  Compose up --build -d @Services
}
else {
  Compose up -d @Services
}

Compose ps

Write-Host ""
Write-Host "Services are available at:" -ForegroundColor Green
Write-Host "Frontend:   http://localhost:4200"
Write-Host "Backend:    http://localhost:3000"
Write-Host "Swagger UI: http://localhost:3000/docs"
Write-Host "Log Server: http://localhost:9880"
Write-Host "Mailhog:    http://localhost:8025  (SMTP: smtp://localhost:1025)"
Write-Host "Postgres:   postgres://localhost:5432"
Write-Host "Prometheus: http://localhost:9090"
Write-Host "Grafana:    http://localhost:3001"

if ($Logs) { Compose logs -f @Services }
