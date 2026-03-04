#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────────────────
# create-secrets.sh
#
# One-time script to upload application secrets to Google Cloud Secret Manager
# and grant the Cloud Run service account access to each one.
#
# Usage:
#   source .env
#   bash backend/scripts/gcp/create-secrets.sh
# ───────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${1:-}"

resolve_env_file() {
  if [[ -n "${ENV_FILE}" ]]; then
    if [[ -f "${ENV_FILE}" ]]; then
      printf '%s\n' "${ENV_FILE}"
      return 0
    fi
    echo "Environment file not found: ${ENV_FILE}" >&2
    exit 1
  fi

  local candidate_repo_env="${SCRIPT_DIR}/../../.env"
  if [[ -f "${candidate_repo_env}" ]]; then
    printf '%s\n' "${candidate_repo_env}"
    return 0
  fi

  echo "Environment file not found. Checked: ${candidate_repo_env}" >&2
  echo "Pass an env file path as the first argument or create .env in the repo root." >&2
  exit 1
}

# Load config from .env (or explicit env file path arg)
ENV_PATH="$(resolve_env_file)"
echo "Loading environment from ${ENV_PATH}"
source "${ENV_PATH}"

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${RUN_SERVICE_ACCOUNT:?Set RUN_SERVICE_ACCOUNT}"
: "${CLOUD_SQL_PASSWORD:?Set CLOUD_SQL_PASSWORD}"
: "${SECRET_KEY:?Set SECRET_KEY}"
: "${FIRST_SUPERUSER:?Set FIRST_SUPERUSER}"
: "${FIRST_SUPERUSER_PASSWORD:?Set FIRST_SUPERUSER_PASSWORD}"

RUN_SA_EMAIL="${RUN_SERVICE_ACCOUNT}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# Map: Secret-Manager-name -> value
declare -A SECRETS=(
  [capanel-postgres-password]="${CLOUD_SQL_PASSWORD}"
  [capanel-secret-key]="${SECRET_KEY}"
  [capanel-superuser-email]="${FIRST_SUPERUSER}"
  [capanel-superuser-password]="${FIRST_SUPERUSER_PASSWORD}"
)

echo "Enabling Secret Manager API …"
gcloud services enable secretmanager.googleapis.com --project="${GCP_PROJECT_ID}"

for secret_name in "${!SECRETS[@]}"; do
  secret_value="${SECRETS[$secret_name]}"

  # Create the secret if it doesn't exist yet
  if ! gcloud secrets describe "${secret_name}" \
       --project="${GCP_PROJECT_ID}" >/dev/null 2>&1; then
    echo "Creating secret ${secret_name} …"
    gcloud secrets create "${secret_name}" \
      --project="${GCP_PROJECT_ID}" \
      --replication-policy=automatic
  else
    echo "Secret ${secret_name} already exists — skipping creation."
  fi

  # Add a new version with the current value
  echo "Adding latest version for ${secret_name} …"
  printf '%s' "${secret_value}" \
    | gcloud secrets versions add "${secret_name}" \
        --project="${GCP_PROJECT_ID}" \
        --data-file=-

  # Grant the Cloud Run service account access
  echo "Granting ${RUN_SA_EMAIL} accessor role on ${secret_name} …"
  gcloud secrets add-iam-policy-binding "${secret_name}" \
    --project="${GCP_PROJECT_ID}" \
    --member="serviceAccount:${RUN_SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet
done

echo ""
echo "✅  All secrets created/updated and IAM bindings applied."
echo ""
echo "Verify with:"
echo "  gcloud secrets list --project=${GCP_PROJECT_ID} --filter='name:capanel-'"
