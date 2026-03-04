#! /usr/bin/env bash

set -euo pipefail
set -x

log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [prestart-with-data] $*"
}

run_with_heartbeat() {
    local label="$1"
    shift
    local heartbeat_seconds="${PRESTART_HEARTBEAT_SECONDS:-20}"

    log "${label} started"
    "$@" &
    local cmd_pid=$!

    while kill -0 "${cmd_pid}" 2>/dev/null; do
        log "${label} in progress..."
        sleep "${heartbeat_seconds}"
    done

    wait "${cmd_pid}"
    log "${label} finished"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${SCRIPT_DIR}/prestart.sh"
log "Prestart tasks completed (initial_data only; imports must be triggered manually)"
