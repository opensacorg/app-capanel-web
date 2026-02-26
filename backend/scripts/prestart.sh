#! /usr/bin/env bash

set -euo pipefail
set -x
log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [prestart] $*"
}

# Let the DB start
log "Waiting for database connection"
python app/scripts/backend_pre_start.py

# Run migrations
log "Running database migrations"
alembic upgrade head

# Create initial data in DB
log "Creating initial data"
python app/scripts/initial_data.py

log "Prestart tasks completed (no data imports)"
