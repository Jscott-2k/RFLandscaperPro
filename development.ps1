#requires -version 7.0
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

$ErrorActionPreference = 'Stop'
Set-Location -Path (Resolve-Path $PSScriptRoot)

# --------------------------------------------------------------------
# Local-only shortcut
# --------------------------------------------------------------------
if ($Local) {
  $backend  = Start-Process -FilePath npm -ArgumentList '--prefix','backend','run','start:dev' -PassThru
  $frontend = Start-Process -FilePath npm -ArgumentList '--prefix','frontend','start' -PassThru
  Write-Host 'Started local backend and frontend.' -ForegroundColor Cyan
  Wait-Process -Id $backend.Id, $frontend.Id
  return
}

# --------------------------------------------------------------------
# Docker readiness helpers
# --------------------------------------------------------------------
function Test-DockerReady {
  & docker info --format '{{json .ServerVersion}}' > $null 2> $null
  return ($LASTEXITCODE -eq 0)
}

function Wait-Docker {
  param([int]$TimeoutSec = 180)
  Write-Host 'Waiting for Docker engine...' -ForegroundColor Yellow
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-DockerReady) {
      $v = (& docker version --format '{{.Server.Version}}' 2>$null)
      Write-Host ("Docker is ready. Server version: {0}" -f ($v -join '')) -ForegroundColor Green
      return $true
    }
    Start-Sleep -Seconds 2
  }
  throw "Docker did not become ready within ${TimeoutSec}s."
}

function Preflight {
  Write-Host 'Running Docker preflight checks' -ForegroundColor Cyan

  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI not found. Install Docker Desktop.'
  }

  if (-not (Test-DockerReady)) {
    $desktopExe = Join-Path $Env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    if (-not (Test-Path $desktopExe)) { throw 'Docker Desktop is not installed.' }

    $svc = Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
      [Security.Principal.WindowsBuiltInRole]::Administrator)

    if ($svc -and $svc.Status -ne 'Running' -and $isAdmin) {
      if ($svc.StartType -eq 'Disabled') { Set-Service -Name 'com.docker.service' -StartupType Automatic }
      Write-Host 'Starting com.docker.service...' -ForegroundColor Yellow
      Start-Service -Name 'com.docker.service' -ErrorAction Stop
    } elseif (-not $svc -or $svc.Status -ne 'Running') {
      Write-Host 'Launching Docker Desktop (user mode)...' -ForegroundColor Yellow
      Start-Process -FilePath $desktopExe | Out-Null
    }

    Wait-Docker
  }
}
# --------------------------------------------------------------------
# Compose detection (v2 vs v1)
# --------------------------------------------------------------------
$script:UseComposeV2 = $false
$null = & docker compose version 2>$null
if ($LASTEXITCODE -eq 0) { $script:UseComposeV2 = $true }

function Join-ComposeArgs {
  param([string[]]$Args)
  if ($null -eq $Args) { return @() }
  return @($Args | Where-Object { $_ -ne $null -and $_.ToString().Trim().Length -gt 0 })
}

function Invoke-ComposeCmd {
  param([string]$Cmd, [string[]]$Args)
  $argv = @($Cmd) + (Join-ComposeArgs -Args $Args)
  if ($script:UseComposeV2) {
    return & docker compose @argv 2>&1
  } else {
    return & docker-compose @argv 2>&1
  }
}

function Compose {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)

  if ($Args.Count -eq 0) { throw 'Compose: missing subcommand (e.g., up, down, build, ps)' }

  $cmd  = $Args[0]
  $rest = @()
  if ($Args.Count -gt 1) { $rest = $Args[1..($Args.Count-1)] }

  # Only add --progress=plain to `build` on v2 (not to `up`)
  if ($script:UseComposeV2 -and $cmd -eq 'build' -and -not ($rest -contains '--progress=plain')) {
    $rest = @('--progress=plain') + $rest
  }

  $shown = if ($script:UseComposeV2) { 'docker compose' } else { 'docker-compose' }
  Write-Host ("{0} {1} {2}" -f $shown, $cmd, ($rest -join ' ')) -ForegroundColor Cyan

  $lines = @()
  & { Invoke-ComposeCmd -Cmd $cmd -Args $rest } 2>&1 | Tee-Object -Variable lines
  $code = $LASTEXITCODE

  $isDown = ($cmd -eq 'down')
  if ($code -ne 0) {
    Write-Host ''
    Write-Host ("--- compose output (exit {0}) ---" -f $code) -ForegroundColor Red
    $lines | ForEach-Object { Write-Host $_ }
    Write-Host '--- end output ---' -ForegroundColor Red

    if (($lines -join "`n") -match 'error during connect|pipe') {
      throw 'Failed to communicate with Docker engine. Is Docker Desktop running?'
    }
    if ($isDown) {
      Write-Warning ("{0} down exited with {1} (likely nothing to remove). Continuing..." -f $shown, $code)
      return
    }
    throw ("{0} {1} {2} failed with exit code {3}" -f $shown, $cmd, ($rest -join ' '), $code)
  }
}

function Get-ComposeStatus {
  param([string[]]$Svcs)

  if ($script:UseComposeV2) {
    $out = Invoke-ComposeCmd -Args (@('ps','--format','json') + (Join-ComposeArgs -Args $Svcs))
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($out)) { return @() }
    if ($out -match 'Usage:\s+docker compose') { return @() }  # guard against help text
    try {
      $json = $out | ConvertFrom-Json
    } catch {
      return @()
    }
    if ($null -eq $json) { return @() }
    if ($json -is [System.Array]) { return $json } else { return @($json) }
  } else {
    # v1: parse plain table
    $out = Invoke-ComposeCmd -Args (@('ps') + (Join-ComposeArgs -Args $Svcs))
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($out)) { return @() }
    if ($out -match 'Usage:\s+docker-compose') { return @() }
    $lines = $out -split "`r?`n" | Where-Object { $_.Trim().Length -gt 0 }
    $rows = $lines | Where-Object { $_ -match '\b(Up|Exit|Restarting)\b' }
    $result = @()
    foreach ($r in $rows) {
      $name  = ($r -replace '\s{2,}', '|').Split('|')[0].Trim()
      $state = ($r -match '\b(Up|Exit|Restarting)\b') ? $Matches[1] : ''
      $service = $name -replace '_\d+$',''
      $result += [PSCustomObject]@{ Service = $service; Name = $name; State = $state; Health = $null }
    }
    return $result
  }
}

function Wait-ComposeHealthy {
  param([string[]]$Svcs, [int]$TimeoutSeconds = 120, [int]$PollSeconds = 3)
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
      if ($c.PSObject.Properties.Name -contains 'Health') { $health = $c.Health }
      if (($state -ne 'running') -and ($state -ne 'Up')) { $allOk = $false }
      if ($null -ne $health -and $health -ne 'healthy') { $allOk = $false }
    }
    if ($allOk) { return $true }
    Start-Sleep -Seconds $PollSeconds
  } while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds)
  return $false
}

# --------------------------------------------------------------------
# Main flow
# --------------------------------------------------------------------
Preflight

$svc = Join-ComposeArgs -Args $Services

if ($Clean) {
  if ($svc.Count -gt 0) { Compose down --volumes --remove-orphans @svc } else { Compose down --volumes --remove-orphans }
}
if ($Pull)  {
  if ($svc.Count -gt 0) { Compose pull @svc } else { Compose pull }
}

if ($NoCache) {
  if ($svc.Count -gt 0) { Compose build --no-cache @svc } else { Compose build --no-cache }
  if ($svc.Count -gt 0) { Compose up -d @svc } else { Compose up -d }
}
elseif ($Rebuild) {
  if ($svc.Count -gt 0) { Compose up --build -d @svc } else { Compose up --build -d }
}
else {
  if ($svc.Count -gt 0) { Compose up -d @svc } else { Compose up -d }
}

if ($svc.Count -gt 0) { Compose ps @svc } else { Compose ps }

$ok = Wait-ComposeHealthy -Svcs $svc

$items = Get-ComposeStatus -Svcs $svc
if ($items.Count -gt 0) {
  $items | Select-Object Service, Name, State, Health | Format-Table -AutoSize
}

if ($ok) {
  Write-Host ''
  Write-Host 'Services are available at:' -ForegroundColor Green
  Write-Host 'Frontend:   http://localhost:4200'
  Write-Host 'Backend:    http://localhost:3000'
  Write-Host 'Swagger UI: http://localhost:3000/docs'
  Write-Host 'Log Server: http://localhost:9880'
  Write-Host 'Mailhog:    http://localhost:8025  (SMTP: smtp://localhost:1025)'
  Write-Host 'Postgres:   postgres://localhost:5432'
  Write-Host 'Prometheus: http://localhost:9090'
  Write-Host 'Grafana:    http://localhost:3001'
} else {
  Write-Host ''
  Write-Host 'At least one service failed to reach a healthy running state within the timeout.' -ForegroundColor Yellow
  Write-Host 'Tip: run with -Logs to follow logs, or inspect a specific service:' -ForegroundColor DarkGray
  Write-Host '  docker compose logs --tail=200 <service>'
  Write-Host '  docker compose ps'
  if (-not $Logs) { exit 1 }
}

if ($Logs) {
  if ($svc.Count -gt 0) { Compose logs -f @svc } else { Compose logs -f }
}
