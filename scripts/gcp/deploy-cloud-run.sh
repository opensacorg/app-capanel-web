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
SYNC_LOCAL_IMPORTS_TO_BUCKET="${SYNC_LOCAL_IMPORTS_TO_BUCKET:-false}"
BACKEND_INIT_JOB="${BACKEND_INIT_JOB:-${BACKEND_SERVICE}-init}"
INIT_TRIGGER_FUNCTION_NAME="${INIT_TRIGGER_FUNCTION_NAME:-${BACKEND_SERVICE}-init-trigger}"
ENVIRONMENT="${ENVIRONMENT:-production}"
if [[ "${ENVIRONMENT}" == "production" ]]; then
  FRONTEND_HOST="${FRONTEND_HOST_PRODUCTION:-https://capanel-service-5418848943.us-west1.run.app}"
else
  FRONTEND_HOST="${FRONTEND_HOST:-http://localhost:5173}"
fi

BACKEND_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_AR_REPOSITORY}/${BACKEND_SERVICE}:${TAG}"
FRONTEND_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_AR_REPOSITORY}/${FRONTEND_SERVICE}:${TAG}"

echo "Using project=${GCP_PROJECT_ID}, region=${GCP_REGION}, tag=${TAG}"
echo "Using FRONTEND_HOST=${FRONTEND_HOST}"

if [[ "${ENVIRONMENT}" != "production" ]]; then
  echo "Refusing deploy: ENVIRONMENT must be production for Cloud Run deploys."
  echo "Current value: ${ENVIRONMENT}"
  exit 1
fi

gcloud config set project "${GCP_PROJECT_ID}"

gcloud services enable \
  run.googleapis.com \
  cloudfunctions.googleapis.com \
  eventarc.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com

# Ensure the resources bucket already exists
IMPORT_GCS_BUCKET=$(echo "${IMPORT_GCS_URI}" | sed -E 's|^gs://([^/]+).*|\1|')
if ! gcloud storage buckets describe "gs://${IMPORT_GCS_BUCKET}" >/dev/null 2>&1; then
  echo "Bucket gs://${IMPORT_GCS_BUCKET} was not found."
  echo "This deploy expects an existing bucket (for example: gs://ca-panel-001-resources/resources)."
  exit 1
fi

if [[ "${SYNC_LOCAL_IMPORTS_TO_BUCKET,,}" == "true" ]]; then
  if [[ -d "${IMPORT_RESOURCES_LOCAL_PATH}" ]]; then
    echo "Merging local resources ${IMPORT_RESOURCES_LOCAL_PATH} -> ${IMPORT_GCS_URI} (new files only; no overwrite/delete)"
    gcloud storage cp --recursive --no-clobber "${IMPORT_RESOURCES_LOCAL_PATH}"/* "${IMPORT_GCS_URI}"
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
gcloud builds submit \
  --substitutions "_IMAGE=${BACKEND_IMAGE}" \
  --config - . <<'YAML'
steps:
  - name: gcr.io/cloud-builders/docker
    env:
      - DOCKER_BUILDKIT=1
    args:
      - build
      - -f
      - backend/Dockerfile
      - -t
      - ${_IMAGE}
      - .
images:
  - ${_IMAGE}
YAML

echo "Deploying backend service ${BACKEND_SERVICE}"
yaml_escape() {
  printf '%s' "$1" | sed "s/'/''/g"
}

BACKEND_ENV_FILE="$(mktemp)"
{
  printf "ENVIRONMENT: '%s'\n" "$(yaml_escape "${ENVIRONMENT}")"
  printf "PROJECT_NAME: '%s'\n" "$(yaml_escape "${PROJECT_NAME}")"
  printf "API_V1_STR: '%s'\n" "$(yaml_escape "${API_V1_STR}")"
  printf "BACKEND_CORS_ORIGINS: '%s'\n" "$(yaml_escape "${BACKEND_CORS_ORIGINS}")"
  printf "FRONTEND_HOST: '%s'\n" "$(yaml_escape "${FRONTEND_HOST}")"
  printf "CLOUD_SQL_INSTANCE_CONNECTION_NAME: '%s'\n" "$(yaml_escape "${CLOUD_SQL_CONNECTION_NAME}")"
  printf "POSTGRES_DB: '%s'\n" "$(yaml_escape "${CLOUD_SQL_DB}")"
  printf "POSTGRES_USER: '%s'\n" "$(yaml_escape "${CLOUD_SQL_USER}")"
  printf "POSTGRES_SERVER: 'localhost'\n"
  printf "RUN_DATA_IMPORTS: '%s'\n" "$(yaml_escape "${RUN_DATA_IMPORTS}")"
  printf "IMPORT_GCS_URI: '%s'\n" "$(yaml_escape "${IMPORT_GCS_URI}")"
  printf "IMPORT_RESOURCES_LOCAL_PATH: '%s'\n" "$(yaml_escape "${IMPORT_RESOURCES_LOCAL_PATH}")"
} > "${BACKEND_ENV_FILE}"
trap 'rm -f "${BACKEND_ENV_FILE}" "${JOB_ENV_FILE:-}"' EXIT

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
  --env-vars-file "${BACKEND_ENV_FILE}" \
  --set-secrets "POSTGRES_PASSWORD=capanel-postgres-password:latest,SECRET_KEY=capanel-secret-key:latest,FIRST_SUPERUSER=capanel-superuser-email:latest,FIRST_SUPERUSER_PASSWORD=capanel-superuser-password:latest"

DEPLOYED_BACKEND_ENVIRONMENT="$(
  gcloud run services describe "${BACKEND_SERVICE}" \
    --region "${GCP_REGION}" \
    --flatten="spec.template.spec.containers[].env[]" \
    --format="csv[no-heading](spec.template.spec.containers.env.name,spec.template.spec.containers.env.value)" \
    | awk -F, '$1=="ENVIRONMENT"{print $2; exit}'
)"
if [[ "${DEPLOYED_BACKEND_ENVIRONMENT}" != "production" ]]; then
  echo "Backend service ENVIRONMENT verification failed."
  echo "Expected: production"
  echo "Actual: ${DEPLOYED_BACKEND_ENVIRONMENT:-<unset>}"
  exit 1
fi
echo "Verified backend ENVIRONMENT=${DEPLOYED_BACKEND_ENVIRONMENT}"

echo "Deploying backend init job ${BACKEND_INIT_JOB}"
JOB_ENV_FILE="$(mktemp)"
{
  printf "ENVIRONMENT: '%s'\n" "$(yaml_escape "${ENVIRONMENT}")"
  printf "PROJECT_NAME: '%s'\n" "$(yaml_escape "${PROJECT_NAME}")"
  printf "API_V1_STR: '%s'\n" "$(yaml_escape "${API_V1_STR}")"
  printf "BACKEND_CORS_ORIGINS: '%s'\n" "$(yaml_escape "${BACKEND_CORS_ORIGINS}")"
  printf "FRONTEND_HOST: '%s'\n" "$(yaml_escape "${FRONTEND_HOST}")"
  printf "CLOUD_SQL_INSTANCE_CONNECTION_NAME: '%s'\n" "$(yaml_escape "${CLOUD_SQL_CONNECTION_NAME}")"
  printf "POSTGRES_DB: '%s'\n" "$(yaml_escape "${CLOUD_SQL_DB}")"
  printf "POSTGRES_USER: '%s'\n" "$(yaml_escape "${CLOUD_SQL_USER}")"
  printf "POSTGRES_SERVER: 'localhost'\n"
  printf "RUN_DATA_IMPORTS: 'false'\n"
  printf "IMPORT_GCS_URI: '%s'\n" "$(yaml_escape "${IMPORT_GCS_URI}")"
  printf "IMPORT_RESOURCES_LOCAL_PATH: '%s'\n" "$(yaml_escape "${IMPORT_RESOURCES_LOCAL_PATH}")"
} > "${JOB_ENV_FILE}"

gcloud run jobs deploy "${BACKEND_INIT_JOB}" \
  --image "${BACKEND_IMAGE}" \
  --region "${GCP_REGION}" \
  --service-account "${RUN_SERVICE_ACCOUNT_EMAIL}" \
  --network "${VPC_NETWORK}" \
  --subnet "${VPC_SUBNET}" \
  --vpc-egress private-ranges-only \
  --set-cloudsql-instances "${CLOUD_SQL_CONNECTION_NAME}" \
  --command python \
  --args app/scripts/initial_data.py \
  --env-vars-file "${JOB_ENV_FILE}" \
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
    env:
      - DOCKER_BUILDKIT=1
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
