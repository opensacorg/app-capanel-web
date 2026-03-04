#!/usr/bin/env bash

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
: "${GCP_REGION:?Set GCP_REGION, for example us-central1}"
: "${GCP_AR_REPOSITORY:?Set GCP_AR_REPOSITORY}"
: "${RUN_SERVICE_ACCOUNT:?Set RUN_SERVICE_ACCOUNT}"
: "${VPC_NETWORK:?Set VPC_NETWORK, for example default}"
: "${PRIVATE_RANGE_NAME:?Set PRIVATE_RANGE_NAME}"
: "${PRIVATE_RANGE_PREFIX:?Set PRIVATE_RANGE_PREFIX, for example 16}"
: "${CLOUD_SQL_INSTANCE:?Set CLOUD_SQL_INSTANCE}"
: "${CLOUD_SQL_DB:?Set CLOUD_SQL_DB}"
: "${CLOUD_SQL_USER:?Set CLOUD_SQL_USER}"
: "${CLOUD_SQL_PASSWORD:?Set CLOUD_SQL_PASSWORD}"

CLOUD_SQL_VERSION="${CLOUD_SQL_VERSION:-POSTGRES_18}"
CLOUD_SQL_EDITION="${CLOUD_SQL_EDITION:-enterprise}"
RUN_SERVICE_ACCOUNT_EMAIL="${RUN_SERVICE_ACCOUNT}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "${GCP_PROJECT_ID}"

gcloud services enable \
  run.googleapis.com \
  cloudfunctions.googleapis.com \
  eventarc.googleapis.com \
  pubsub.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  servicenetworking.googleapis.com \
  compute.googleapis.com

if ! gcloud artifacts repositories describe "${GCP_AR_REPOSITORY}" \
  --location="${GCP_REGION}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${GCP_AR_REPOSITORY}" \
    --location="${GCP_REGION}" \
    --repository-format=docker \
    --description="Container images for CAPanel services"
fi

if ! gcloud iam service-accounts describe "${RUN_SERVICE_ACCOUNT_EMAIL}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${RUN_SERVICE_ACCOUNT}" \
    --display-name="CAPanel Cloud Run runtime"
fi

gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:${RUN_SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/cloudsql.client" >/dev/null

gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:${RUN_SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/artifactregistry.reader" >/dev/null

gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:${RUN_SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/run.developer" >/dev/null

gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:${RUN_SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/storage.objectViewer" >/dev/null

if ! gcloud compute addresses describe "${PRIVATE_RANGE_NAME}" \
  --global >/dev/null 2>&1; then
  gcloud compute addresses create "${PRIVATE_RANGE_NAME}" \
    --global \
    --purpose=VPC_PEERING \
    --prefix-length="${PRIVATE_RANGE_PREFIX}" \
    --network="${VPC_NETWORK}"
fi

if ! gcloud services vpc-peerings list --network="${VPC_NETWORK}" \
  --format='value(service)' | grep -Fxq "servicenetworking.googleapis.com"; then
  gcloud services vpc-peerings connect \
    --service=servicenetworking.googleapis.com \
    --network="${VPC_NETWORK}" \
    --ranges="${PRIVATE_RANGE_NAME}"
fi

if ! gcloud sql instances describe "${CLOUD_SQL_INSTANCE}" >/dev/null 2>&1; then
  gcloud sql instances create "${CLOUD_SQL_INSTANCE}" \
    --database-version="${CLOUD_SQL_VERSION}" \
    --edition="${CLOUD_SQL_EDITION}" \
    --cpu=1 \
    --memory=3840MiB \
    --region="${GCP_REGION}" \
    --availability-type=zonal \
    --storage-size=20GB \
    --storage-type=SSD \
    --network="${VPC_NETWORK}" \
    --no-assign-ip
fi

if ! gcloud sql databases describe "${CLOUD_SQL_DB}" \
  --instance="${CLOUD_SQL_INSTANCE}" >/dev/null 2>&1; then
  gcloud sql databases create "${CLOUD_SQL_DB}" \
    --instance="${CLOUD_SQL_INSTANCE}"
fi

if ! gcloud sql users list --instance="${CLOUD_SQL_INSTANCE}" \
  --format='value(name)' | grep -Fxq "${CLOUD_SQL_USER}"; then
  gcloud sql users create "${CLOUD_SQL_USER}" \
    --instance="${CLOUD_SQL_INSTANCE}" \
    --password="${CLOUD_SQL_PASSWORD}"
fi

echo "Provisioning complete."
echo "Artifact Registry: ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_AR_REPOSITORY}"
echo "Cloud SQL connection: ${GCP_PROJECT_ID}:${GCP_REGION}:${CLOUD_SQL_INSTANCE}"
