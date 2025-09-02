#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

function Load-Env($path) {
    Get-Content $path | ForEach-Object {
        if ($_ -match '^([^#][^=]*)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptDir
Set-Location $BackendDir

$envFile = if ($env:NODE_ENV) { ".env.$($env:NODE_ENV)" } else { '.env.development' }
if (Test-Path $envFile) {
    Load-Env $envFile
} elseif (Test-Path '.env') {
    Load-Env '.env'
}

$BackupDir = Join-Path $BackendDir 'backups'

if ($args.Count -eq 0) {
    Write-Output 'Available backups:'
    Get-ChildItem $BackupDir | ForEach-Object { $_.Name }
    $BackupFile = Read-Host 'Enter backup file name to restore'
} else {
    $BackupFile = $args[0]
}

$FullPath = Join-Path $BackupDir $BackupFile
if (-not (Test-Path $FullPath)) {
    Write-Output "Backup file '$FullPath' not found."
    exit 1
}

$Confirm = Read-Host "This will overwrite database '$env:DB_NAME'. Continue? [y/N]"
if ($Confirm -notmatch '^[Yy]$') {
    Write-Output 'Aborted.'
    exit 0
}

Write-Output "Restoring from $FullPath..."
[Environment]::SetEnvironmentVariable('PGPASSWORD', $env:DB_PASSWORD)
psql -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USERNAME -d $env:DB_NAME -f $FullPath

Write-Output 'Restore complete.'
