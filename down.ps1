#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

docker compose down

if ($args -contains "--prune") {
  docker network prune -f
}
