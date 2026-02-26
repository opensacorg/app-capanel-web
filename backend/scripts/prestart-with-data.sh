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

RUN_DATA_IMPORTS="${RUN_DATA_IMPORTS:-true}"
if [[ "${RUN_DATA_IMPORTS,,}" != "true" ]]; then
    log "RUN_DATA_IMPORTS=${RUN_DATA_IMPORTS}; skipping data imports."
    exit 0
fi

IMPORT_GCS_URI="${IMPORT_GCS_URI:-}"
IMPORT_RESOURCES_LOCAL_PATH="${IMPORT_RESOURCES_LOCAL_PATH:-$HOME/Downloads/resources}"
IMPORT_RESOURCES_BASE_PATH="/app/backend/resources"
if [[ -n "${IMPORT_GCS_URI}" ]]; then
    log "Syncing import resources from ${IMPORT_GCS_URI} to ${IMPORT_RESOURCES_LOCAL_PATH}"
    run_with_heartbeat "GCS resources sync" \
        python app/scripts/sync_gcs_resources.py \
            --uri "${IMPORT_GCS_URI}" \
            --dest "${IMPORT_RESOURCES_LOCAL_PATH}"
    IMPORT_RESOURCES_BASE_PATH="${IMPORT_RESOURCES_LOCAL_PATH}"
fi

# Avoid duplicate imports on container restarts.
ACADEMIC_INDICATOR_COUNT="$(
python - <<'PY'
from sqlalchemy import func
from sqlmodel import Session, select

from app.core.database import engine
from app.model.academic_indicator import AcademicIndicator

with Session(engine) as session:
    count = session.exec(
        select(func.count()).select_from(AcademicIndicator)
    ).one()
    print(int(count or 0))
PY
)"

if [[ "${ACADEMIC_INDICATOR_COUNT}" -gt 0 ]]; then
    log "Academic indicators already populated (${ACADEMIC_INDICATOR_COUNT} rows); skipping imports."
    exit 0
fi

IMPORT_ELA_DATA_FILE="${IMPORT_ELA_DATA_FILE:-${IMPORT_RESOURCES_BASE_PATH}/cde/eladownload2025.xlsx}"
if [[ -f "${IMPORT_ELA_DATA_FILE}" ]]; then
    log "ELA import file found: ${IMPORT_ELA_DATA_FILE}"
    run_with_heartbeat "ELA import parse/load" \
        python app/scripts/import_ela_data.py "${IMPORT_ELA_DATA_FILE}"
else
    log "ELA file not found at ${IMPORT_ELA_DATA_FILE}; skipping scripts/import_ela_data.py."
fi

IMPORT_INDICATORS_SOURCE="${IMPORT_INDICATORS_SOURCE:-cde}"
IMPORT_INDICATORS_PATH="${IMPORT_INDICATORS_PATH:-${IMPORT_RESOURCES_BASE_PATH}/cde}"
IMPORT_INDICATORS_BATCH_SIZE="${IMPORT_INDICATORS_BATCH_SIZE:-1000}"
IMPORT_INDICATORS_INDICATOR="${IMPORT_INDICATORS_INDICATOR:-}"

if [[ -e "${IMPORT_INDICATORS_PATH}" ]]; then
    log "Indicators import path found: ${IMPORT_INDICATORS_PATH} (source=${IMPORT_INDICATORS_SOURCE})"
    indicator_args=()
    if [[ -n "${IMPORT_INDICATORS_INDICATOR}" ]]; then
        indicator_args=(--indicator "${IMPORT_INDICATORS_INDICATOR}")
    fi

    run_with_heartbeat "Indicators import parse/load" \
        python app/scripts/import_indicators.py \
            --source "${IMPORT_INDICATORS_SOURCE}" \
            --path "${IMPORT_INDICATORS_PATH}" \
            --batch-size "${IMPORT_INDICATORS_BATCH_SIZE}" \
            "${indicator_args[@]}"
else
    log "Indicator path not found at ${IMPORT_INDICATORS_PATH}; skipping app/scripts/import_indicators.py."
fi

log "Prestart tasks with data imports completed"
