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
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$OutFile = Join-Path $BackupDir "$($env:DB_NAME)-$Timestamp.sql"

Write-Output "Dumping database $env:DB_NAME to $OutFile"
[Environment]::SetEnvironmentVariable('PGPASSWORD', $env:DB_PASSWORD)
pg_dump -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USERNAME -d $env:DB_NAME -f $OutFile

Write-Output 'Backup completed.'
