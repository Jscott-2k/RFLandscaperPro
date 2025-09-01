#!/usr/bin/env pwsh
param(
  [switch]$Rebuild,      # up --build
  [switch]$NoCache,      # build --no-cache, then up
  [string[]]$Services,   # -Services backend,frontend
  [switch]$Clean,        # down --volumes --remove-orphans
  [switch]$Logs,         # logs -f
  [switch]$Pull,         # pull
  [switch]$Local         # run backend and frontend without Docker
)

$ErrorActionPreference = "Stop"
Set-Location -Path (Resolve-Path "$PSScriptRoot")

if ($Local) {
  $backend  = Start-Process npm -ArgumentList '--prefix','backend','run','start:dev' -PassThru
  $frontend = Start-Process npm -ArgumentList '--prefix','frontend','start' -PassThru
  Write-Host "→ Started local backend (PID $($backend.Id)) and frontend (PID $($frontend.Id))." -ForegroundColor Cyan
  Wait-Process -Id $backend.Id, $frontend.Id
  return
}

function Preflight {
  Write-Host "→ Running Docker preflight checks" -ForegroundColor Cyan

  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI not found. Install Docker Desktop."
  }

  $desktopExe = Join-Path $Env:ProgramFiles 'Docker/Docker/Docker Desktop.exe'
  if (-not (Test-Path $desktopExe)) { throw "Docker Desktop is not installed." }

  $svc = Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue
  if ($null -eq $svc) { throw "Docker Desktop service 'com.docker.service' not found." }
  if ($svc.Status -ne 'Running') {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
      throw "Docker Desktop service is not running and current user lacks permission to start it. Start Docker Desktop manually or run PowerShell as Administrator."
    }
    try {
      Start-Service -Name 'com.docker.service' -ErrorAction Stop
    } catch {
      throw "Failed to start Docker Desktop service: $_"
    }
    do {
      Start-Sleep -Seconds 1
      $svc = Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue
    } until ($svc.Status -eq 'Running')
  }

  if (Get-Command wsl -ErrorAction SilentlyContinue) {
    try {
      $wsl = wsl.exe -l -v 2>$null
      if ($LASTEXITCODE -eq 0 -and -not ($wsl | Select-String 'docker-desktop')) {
        throw "WSL backend is not running. Ensure Docker Desktop is configured for WSL2."
      }
    } catch {
      throw "Unable to query WSL backend: $_"
    }
  }

  $pipe = '\\.\pipe\docker_engine'
  if (-not (Test-Path $pipe)) { throw "Docker engine socket '$pipe' not found." }

  try { docker version | Out-Null } catch { throw "Cannot communicate with Docker engine." }
}

function Compose {
  param([Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args)

  Write-Host "→ docker compose $($Args -join ' ')" -ForegroundColor Cyan
  $output = & docker compose @Args 2>&1
  $code = $LASTEXITCODE

  # Be lenient for `down` (it often returns non-zero when nothing exists); strict otherwise.
  $isDown = ($Args.Count -gt 0 -and $Args[0] -eq 'down')
  if ($code -ne 0) {
    if ($output -match 'error during connect' -or $output -match 'pipe') {
      throw "Failed to communicate with Docker engine. Is Docker Desktop running?"
    }
    if ($isDown) {
      Write-Warning "docker compose down exited with $code (likely nothing to remove). Continuing…"
      return
    } else {
      throw "docker compose $($Args -join ' ') failed with exit code $code"
    }
  }
}

function Get-ComposeStatus {
  param([string[]]$Svcs)
  $out = & docker compose ps --format json @Svcs 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($out)) { return @() }
  $json = $out | ConvertFrom-Json
  if ($null -eq $json) { return @() }
  if ($json -is [System.Array]) { return $json } else { return @($json) }
}

function Wait-ComposeHealthy {
  param(
    [string[]]$Svcs,
    [int]$TimeoutSeconds = 120,
    [int]$PollSeconds    = 3
  )
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  do {
    $items = Get-ComposeStatus -Svcs $Svcs
    if ($items.Count -eq 0) {
      Start-Sleep -Seconds $PollSeconds
      continue
    }

    $allOk = $true
    foreach ($c in $items) {
      $state = $c.State
      $health = $null
      if ($c.PSObject.Properties.Name -contains 'Health') {
        $health = $c.Health
      }
      if ($state -ne 'running') { $allOk = $false }
      if ($null -ne $health -and $health -ne 'healthy') { $allOk = $false }
    }

    if ($allOk) { return $true }
    Start-Sleep -Seconds $PollSeconds
  } while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds)

  return $false
}

# Preflight checks before any docker compose commands
Preflight

# Optional bits
if ($Clean) { Compose down --volumes --remove-orphans @Services }  # use long flag; avoids -Verbose capture
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

# Show current state
Compose ps

# Wait for services to be 'running' (and 'healthy' if healthchecks exist)
$ok = Wait-ComposeHealthy -Svcs $Services

# Always print a status table so you can see what happened
$items = Get-ComposeStatus -Svcs $Services
if ($items.Count -gt 0) {
  $items | Select-Object Service, Name, State, Health | Format-Table -AutoSize
}

if ($ok) {
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
} else {
  Write-Host ""
  Write-Host "At least one service failed to reach a healthy running state within the timeout." -ForegroundColor Yellow
  Write-Host "Tip: run with -Logs to follow logs, or inspect a specific service:" -ForegroundColor DarkGray
  Write-Host "  docker compose logs --tail=200 <service>"
  Write-Host "  docker compose ps"
  if (-not $Logs) { exit 1 }
}

if ($Logs) { Compose logs -f @Services }
