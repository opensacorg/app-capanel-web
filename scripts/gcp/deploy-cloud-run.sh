#!/usr/bin/env bash

set -euo pipefail

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
: "${CLOUD_SQL_PASSWORD:?Set CLOUD_SQL_PASSWORD}"
: "${SECRET_KEY:?Set SECRET_KEY}"
: "${FIRST_SUPERUSER:?Set FIRST_SUPERUSER}"
: "${FIRST_SUPERUSER_PASSWORD:?Set FIRST_SUPERUSER_PASSWORD}"

TAG="${TAG:-$(git rev-parse --short HEAD)}"
API_V1_STR="${API_V1_STR:-/api/v1}"
PROJECT_NAME="${PROJECT_NAME:-California Accountability Panel}"
BACKEND_CORS_ORIGINS="${BACKEND_CORS_ORIGINS:-https://localhost}"
CLOUD_SQL_CONNECTION_NAME="${GCP_PROJECT_ID}:${GCP_REGION}:${CLOUD_SQL_INSTANCE}"
RUN_SERVICE_ACCOUNT_EMAIL="${RUN_SERVICE_ACCOUNT}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
RUN_DATA_IMPORTS="${RUN_DATA_IMPORTS:-false}"
IMPORT_GCS_URI="${IMPORT_GCS_URI:-gs://ca-panel-001-resources}"
IMPORT_RESOURCES_LOCAL_PATH="${IMPORT_RESOURCES_LOCAL_PATH:-$HOME/Downloads/resources}"
SYNC_LOCAL_IMPORTS_TO_BUCKET="${SYNC_LOCAL_IMPORTS_TO_BUCKET:-true}"
BACKEND_INIT_JOB="${BACKEND_INIT_JOB:-${BACKEND_SERVICE}-init}"
RUN_BACKEND_INIT_JOB="${RUN_BACKEND_INIT_JOB:-true}"

BACKEND_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_AR_REPOSITORY}/${BACKEND_SERVICE}:${TAG}"
FRONTEND_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_AR_REPOSITORY}/${FRONTEND_SERVICE}:${TAG}"

echo "Using project=${GCP_PROJECT_ID}, region=${GCP_REGION}, tag=${TAG}"

gcloud config set project "${GCP_PROJECT_ID}"

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com

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
  --set-env-vars "ENVIRONMENT=production,PROJECT_NAME=${PROJECT_NAME},API_V1_STR=${API_V1_STR},BACKEND_CORS_ORIGINS=${BACKEND_CORS_ORIGINS},CLOUD_SQL_INSTANCE_CONNECTION_NAME=${CLOUD_SQL_CONNECTION_NAME},POSTGRES_DB=${CLOUD_SQL_DB},POSTGRES_USER=${CLOUD_SQL_USER},POSTGRES_PASSWORD=${CLOUD_SQL_PASSWORD},SECRET_KEY=${SECRET_KEY},FIRST_SUPERUSER=${FIRST_SUPERUSER},FIRST_SUPERUSER_PASSWORD=${FIRST_SUPERUSER_PASSWORD},RUN_DATA_IMPORTS=${RUN_DATA_IMPORTS},IMPORT_GCS_URI=${IMPORT_GCS_URI},IMPORT_RESOURCES_LOCAL_PATH=${IMPORT_RESOURCES_LOCAL_PATH}"

echo "Deploying backend init job ${BACKEND_INIT_JOB}"
gcloud run jobs deploy "${BACKEND_INIT_JOB}" \
  --image "${BACKEND_IMAGE}" \
  --region "${GCP_REGION}" \
  --service-account "${RUN_SERVICE_ACCOUNT_EMAIL}" \
  --network "${VPC_NETWORK}" \
  --subnet "${VPC_SUBNET}" \
  --vpc-egress private-ranges-only \
  --add-cloudsql-instances "${CLOUD_SQL_CONNECTION_NAME}" \
  --command bash \
  --args scripts/prestart.sh \
  --set-env-vars "ENVIRONMENT=production,PROJECT_NAME=${PROJECT_NAME},API_V1_STR=${API_V1_STR},BACKEND_CORS_ORIGINS=${BACKEND_CORS_ORIGINS},CLOUD_SQL_INSTANCE_CONNECTION_NAME=${CLOUD_SQL_CONNECTION_NAME},POSTGRES_DB=${CLOUD_SQL_DB},POSTGRES_USER=${CLOUD_SQL_USER},POSTGRES_PASSWORD=${CLOUD_SQL_PASSWORD},SECRET_KEY=${SECRET_KEY},FIRST_SUPERUSER=${FIRST_SUPERUSER},FIRST_SUPERUSER_PASSWORD=${FIRST_SUPERUSER_PASSWORD},RUN_DATA_IMPORTS=true,IMPORT_GCS_URI=${IMPORT_GCS_URI},IMPORT_RESOURCES_LOCAL_PATH=${IMPORT_RESOURCES_LOCAL_PATH}"

if [[ "${RUN_BACKEND_INIT_JOB,,}" == "true" ]]; then
  echo "Executing backend init job ${BACKEND_INIT_JOB}"
  gcloud run jobs execute "${BACKEND_INIT_JOB}" \
    --region "${GCP_REGION}" \
    --wait
else
  echo "RUN_BACKEND_INIT_JOB=${RUN_BACKEND_INIT_JOB}; skipping job execution."
fi

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
echo "Done."
