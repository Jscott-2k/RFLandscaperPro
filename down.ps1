#!/usr/bin/env pwsh
param(
  [switch] $Prune  # use -Prune to prune networks after down
)

$ErrorActionPreference = "Stop"

# Stop containers and remove volumes too (wipes DB volumes like postgres_data)
docker compose down -v

if ($Prune) {
  docker network prune -f
}
