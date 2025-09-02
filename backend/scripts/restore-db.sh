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

if [ $# -eq 0 ]; then
  echo "Available backups:"
  ls "$BACKUP_DIR"
  read -p "Enter backup file name to restore: " BACKUP_FILE
else
  BACKUP_FILE="$1"
fi

FULL_PATH="$BACKUP_DIR/$BACKUP_FILE"

if [ ! -f "$FULL_PATH" ]; then
  echo "Backup file '$FULL_PATH' not found."
  exit 1
fi

read -p "This will overwrite database '$DB_NAME'. Continue? [y/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo "Restoring from $FULL_PATH..."
PGPASSWORD=${DB_PASSWORD:-} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" "$DB_NAME" < "$FULL_PATH"

echo "Restore complete."
