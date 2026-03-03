#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────────────────
# create-secrets.sh
#
# One-time script to upload application secrets to Google Cloud Secret Manager
# and grant the Cloud Run service account access to each one.
#
# Usage:
#   source scripts/gcp/cloud-run.env   # or export the vars yourself
#   bash scripts/gcp/create-secrets.sh
# ───────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load config from cloud-run.env
# shellcheck source=cloud-run.env
source "${SCRIPT_DIR}/cloud-run.env"

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
