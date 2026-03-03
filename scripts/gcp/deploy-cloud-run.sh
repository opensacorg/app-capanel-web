#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load config from cloud-run.env
# shellcheck source=cloud-run.env
source "${SCRIPT_DIR}/cloud-run.env"

# Required inputs
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${GCP_REGION:?Set GCP_REGION, for example us-central1}"
: "${GCP_AR_REPOSITORY:?Set GCP_AR_REPOSITORY}"
: "${BACKEND_SERVICE:?Set BACKEND_SERVICE}"
: "${FRONTEND_SERVICE:?Set FRONTEND_SERVICE}"
: "${RUN_SERVICE_ACCOUNT:?Set RUN_SERVICE_ACCOUNT}"
: "${VPC_NETWORK:?Set VPC_NETWORK, for example default}"
: "${VPC_SUBNET:?Set VPC_SUBNET, for example default}"
: "${CLOUD_SQL_INSTANCE:?Set CLOUD_SQL_INSTANCE}"
: "${CLOUD_SQL_DB:?Set CLOUD_SQL_DB}"
: "${CLOUD_SQL_USER:?Set CLOUD_SQL_USER}"
# Sensitive values (SECRET_KEY, FIRST_SUPERUSER, FIRST_SUPERUSER_PASSWORD,
# CLOUD_SQL_PASSWORD) are pulled from Secret Manager at runtime — see create-secrets.sh.

TAG="${TAG:-$(git rev-parse --short HEAD)}"
API_V1_STR="${API_V1_STR:-/api/v1}"
PROJECT_NAME="${PROJECT_NAME:-California Accountability Panel}"
BACKEND_CORS_ORIGINS="${BACKEND_CORS_ORIGINS:-https://localhost}"
CLOUD_SQL_CONNECTION_NAME="${GCP_PROJECT_ID}:${GCP_REGION}:${CLOUD_SQL_INSTANCE}"
RUN_SERVICE_ACCOUNT_EMAIL="${RUN_SERVICE_ACCOUNT}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
RUN_DATA_IMPORTS="${RUN_DATA_IMPORTS:-false}"
IMPORT_GCS_URI="${IMPORT_GCS_URI:-gs://ca-panel-001-resources/resources}"
IMPORT_RESOURCES_LOCAL_PATH="${IMPORT_RESOURCES_LOCAL_PATH:-$HOME/Downloads/resources}"
SYNC_LOCAL_IMPORTS_TO_BUCKET="${SYNC_LOCAL_IMPORTS_TO_BUCKET:-true}"
BACKEND_INIT_JOB="${BACKEND_INIT_JOB:-${BACKEND_SERVICE}-init}"
INIT_TRIGGER_FUNCTION_NAME="${INIT_TRIGGER_FUNCTION_NAME:-${BACKEND_SERVICE}-init-trigger}"

BACKEND_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_AR_REPOSITORY}/${BACKEND_SERVICE}:${TAG}"
FRONTEND_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_AR_REPOSITORY}/${FRONTEND_SERVICE}:${TAG}"

echo "Using project=${GCP_PROJECT_ID}, region=${GCP_REGION}, tag=${TAG}"

gcloud config set project "${GCP_PROJECT_ID}"

gcloud services enable \
  run.googleapis.com \
  cloudfunctions.googleapis.com \
  eventarc.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com

# Ensure the resources bucket exists and is in the correct region
IMPORT_GCS_BUCKET=$(echo "${IMPORT_GCS_URI}" | sed -E 's|^gs://([^/]+).*|\1|')
if ! gcloud storage buckets describe "gs://${IMPORT_GCS_BUCKET}" >/dev/null 2>&1; then
  echo "Creating bucket gs://${IMPORT_GCS_BUCKET} in ${GCP_REGION}"
  gcloud storage buckets create "gs://${IMPORT_GCS_BUCKET}" \
    --location="${GCP_REGION}" \
    --uniform-bucket-level-access
fi

if [[ "${SYNC_LOCAL_IMPORTS_TO_BUCKET,,}" == "true" ]]; then
  if [[ -d "${IMPORT_RESOURCES_LOCAL_PATH}" ]]; then
    echo "Syncing local resources ${IMPORT_RESOURCES_LOCAL_PATH} -> ${IMPORT_GCS_URI}"
    gcloud storage rsync "${IMPORT_RESOURCES_LOCAL_PATH}" "${IMPORT_GCS_URI}" --recursive
  else
    echo "Local resources path not found: ${IMPORT_RESOURCES_LOCAL_PATH}"
    exit 1
  fi
else
  echo "SYNC_LOCAL_IMPORTS_TO_BUCKET=${SYNC_LOCAL_IMPORTS_TO_BUCKET}; skipping local->bucket sync."
fi

if ! gcloud artifacts repositories describe "${GCP_AR_REPOSITORY}" \
  --location="${GCP_REGION}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${GCP_AR_REPOSITORY}" \
    --location="${GCP_REGION}" \
    --repository-format=docker \
    --description="Container images for CAPanel services"
fi

echo "Building backend image ${BACKEND_IMAGE}"
gcloud builds submit --tag "${BACKEND_IMAGE}" --file backend/Dockerfile .

echo "Deploying backend service ${BACKEND_SERVICE}"
gcloud run deploy "${BACKEND_SERVICE}" \
  --image "${BACKEND_IMAGE}" \
  --region "${GCP_REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --service-account "${RUN_SERVICE_ACCOUNT_EMAIL}" \
  --network "${VPC_NETWORK}" \
  --subnet "${VPC_SUBNET}" \
  --vpc-egress private-ranges-only \
  --add-cloudsql-instances "${CLOUD_SQL_CONNECTION_NAME}" \
  --set-env-vars "ENVIRONMENT=production,PROJECT_NAME=${PROJECT_NAME},API_V1_STR=${API_V1_STR},BACKEND_CORS_ORIGINS=${BACKEND_CORS_ORIGINS},CLOUD_SQL_INSTANCE_CONNECTION_NAME=${CLOUD_SQL_CONNECTION_NAME},POSTGRES_DB=${CLOUD_SQL_DB},POSTGRES_USER=${CLOUD_SQL_USER},POSTGRES_SERVER=localhost,RUN_DATA_IMPORTS=${RUN_DATA_IMPORTS},IMPORT_GCS_URI=${IMPORT_GCS_URI},IMPORT_RESOURCES_LOCAL_PATH=${IMPORT_RESOURCES_LOCAL_PATH}" \
  --set-secrets "POSTGRES_PASSWORD=capanel-postgres-password:latest,SECRET_KEY=capanel-secret-key:latest,FIRST_SUPERUSER=capanel-superuser-email:latest,FIRST_SUPERUSER_PASSWORD=capanel-superuser-password:latest"

echo "Deploying backend init job ${BACKEND_INIT_JOB}"
gcloud run jobs deploy "${BACKEND_INIT_JOB}" \
  --image "${BACKEND_IMAGE}" \
  --region "${GCP_REGION}" \
  --service-account "${RUN_SERVICE_ACCOUNT_EMAIL}" \
  --network "${VPC_NETWORK}" \
  --subnet "${VPC_SUBNET}" \
  --vpc-egress private-ranges-only \
  --add-cloudsql-instances "${CLOUD_SQL_CONNECTION_NAME}" \
  --command python \
  --args app/scripts/initial_data.py \
  --set-env-vars "ENVIRONMENT=production,PROJECT_NAME=${PROJECT_NAME},API_V1_STR=${API_V1_STR},BACKEND_CORS_ORIGINS=${BACKEND_CORS_ORIGINS},CLOUD_SQL_INSTANCE_CONNECTION_NAME=${CLOUD_SQL_CONNECTION_NAME},POSTGRES_DB=${CLOUD_SQL_DB},POSTGRES_USER=${CLOUD_SQL_USER},POSTGRES_SERVER=localhost,RUN_DATA_IMPORTS=false,IMPORT_GCS_URI=${IMPORT_GCS_URI},IMPORT_RESOURCES_LOCAL_PATH=${IMPORT_RESOURCES_LOCAL_PATH}" \
  --set-secrets "POSTGRES_PASSWORD=capanel-postgres-password:latest,SECRET_KEY=capanel-secret-key:latest,FIRST_SUPERUSER=capanel-superuser-email:latest,FIRST_SUPERUSER_PASSWORD=capanel-superuser-password:latest"

echo "Granting ${RUN_SERVICE_ACCOUNT_EMAIL} permission to run ${BACKEND_INIT_JOB}"
gcloud run jobs add-iam-policy-binding "${BACKEND_INIT_JOB}" \
  --region "${GCP_REGION}" \
  --member "serviceAccount:${RUN_SERVICE_ACCOUNT_EMAIL}" \
  --role "roles/run.invoker"

echo "Deploying manual init trigger function ${INIT_TRIGGER_FUNCTION_NAME}"
gcloud functions deploy "${INIT_TRIGGER_FUNCTION_NAME}" \
  --gen2 \
  --runtime python312 \
  --region "${GCP_REGION}" \
  --source scripts/gcp/functions/manual_backend_init \
  --entry-point trigger_backend_init \
  --trigger-http \
  --no-allow-unauthenticated \
  --service-account "${RUN_SERVICE_ACCOUNT_EMAIL}" \
  --set-env-vars "GCP_PROJECT_ID=${GCP_PROJECT_ID},GCP_REGION=${GCP_REGION},BACKEND_INIT_JOB=${BACKEND_INIT_JOB}"

BACKEND_URL="$(
  gcloud run services describe "${BACKEND_SERVICE}" \
    --region "${GCP_REGION}" \
    --format='value(status.url)'
)"

echo "Backend URL: ${BACKEND_URL}"
echo "Building frontend image ${FRONTEND_IMAGE} with VITE_API_URL=${BACKEND_URL}"
gcloud builds submit \
  --substitutions "_IMAGE=${FRONTEND_IMAGE},_VITE_API_URL=${BACKEND_URL}" \
  --config - . <<'YAML'
steps:
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - -f
      - frontend/Dockerfile
      - -t
      - ${_IMAGE}
      - --build-arg
      - VITE_API_URL=${_VITE_API_URL}
      - .
images:
  - ${_IMAGE}
YAML

echo "Deploying frontend service ${FRONTEND_SERVICE}"
gcloud run deploy "${FRONTEND_SERVICE}" \
  --image "${FRONTEND_IMAGE}" \
  --region "${GCP_REGION}" \
  --platform managed \
  --allow-unauthenticated

FRONTEND_URL="$(
  gcloud run services describe "${FRONTEND_SERVICE}" \
    --region "${GCP_REGION}" \
    --format='value(status.url)'
)"

echo "Frontend URL: ${FRONTEND_URL}"
INIT_TRIGGER_FUNCTION_URL="$(
  gcloud functions describe "${INIT_TRIGGER_FUNCTION_NAME}" \
    --region "${GCP_REGION}" \
    --gen2 \
    --format='value(serviceConfig.uri)'
)"
echo "Manual init trigger URL: ${INIT_TRIGGER_FUNCTION_URL}"
echo "Invoke with:"
echo "curl -X POST -H \"Authorization: Bearer \$(gcloud auth print-identity-token)\" \"${INIT_TRIGGER_FUNCTION_URL}\""
echo "Done."
