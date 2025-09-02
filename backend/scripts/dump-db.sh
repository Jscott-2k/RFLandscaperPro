#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

ENV_FILE=".env.${NODE_ENV:-development}"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
elif [ -f ".env" ]; then
  export $(grep -v '^#' ".env" | xargs)
fi

BACKUP_DIR="$BACKEND_DIR/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUT_FILE="$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.sql"

echo "Dumping database $DB_NAME to $OUT_FILE"
PGPASSWORD=${DB_PASSWORD:-} pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" "$DB_NAME" > "$OUT_FILE"

echo "Backup completed."
