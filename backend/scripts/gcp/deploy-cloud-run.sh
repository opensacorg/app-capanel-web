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

  local candidate_repo_env="${SCRIPT_DIR}/../../../.env"
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

cleanup_files=()
register_cleanup_file() {
  cleanup_files+=("$1")
}
cleanup_temp_files() {
  for f in "${cleanup_files[@]}"; do
    rm -f "${f}"
  done
}
trap cleanup_temp_files EXIT

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
BACKEND_CORS_ORIGINS="${BACKEND_CORS_ORIGINS_PRODUCTION:-${BACKEND_CORS_ORIGINS:-https://localhost}}"
CLOUD_SQL_CONNECTION_NAME="${GCP_PROJECT_ID}:${GCP_REGION}:${CLOUD_SQL_INSTANCE}"
RUN_SERVICE_ACCOUNT_EMAIL="${RUN_SERVICE_ACCOUNT}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
RUN_DATA_IMPORTS="${RUN_DATA_IMPORTS:-false}"
RUN_STARTUP_DATA_IMPORTS="${RUN_STARTUP_DATA_IMPORTS:-false}"
IMPORT_GCS_URI="${IMPORT_GCS_URI:-gs://ca-panel-001-resources/resources}"
IMPORT_RESOURCES_LOCAL_PATH="${IMPORT_RESOURCES_LOCAL_PATH:-$HOME/Downloads/resources}"
SYNC_LOCAL_IMPORTS_TO_BUCKET="${SYNC_LOCAL_IMPORTS_TO_BUCKET:-false}"
FULL_SERVICE="${FULL_SERVICE:-capanel-full}"
BACKEND_INIT_JOB="${BACKEND_INIT_JOB:-${FULL_SERVICE}-init}"
INIT_TRIGGER_FUNCTION_NAME="${INIT_TRIGGER_FUNCTION_NAME:-${FULL_SERVICE}-init-trigger}"
BACKEND_INIT_JOB_TASK_TIMEOUT="${BACKEND_INIT_JOB_TASK_TIMEOUT:-7200s}"
BACKEND_INIT_JOB_CPU="${BACKEND_INIT_JOB_CPU:-4}"
BACKEND_INIT_JOB_MEMORY="${BACKEND_INIT_JOB_MEMORY:-8Gi}"
INIT_TRIGGER_FUNCTION_TIMEOUT="${INIT_TRIGGER_FUNCTION_TIMEOUT:-3600s}"
JOB_STEP_TIMEOUT_SECONDS="${JOB_STEP_TIMEOUT_SECONDS:-7200}"
JOB_POLL_INTERVAL_SECONDS="${JOB_POLL_INTERVAL_SECONDS:-10}"
ORIGINAL_ENVIRONMENT="${ENVIRONMENT:-<unset>}"
ENVIRONMENT="production"
if [[ "${ENVIRONMENT}" == "production" ]]; then
  FRONTEND_HOST="${FRONTEND_HOST_PRODUCTION:-https://capanel-full-5418848943.us-west1.run.app}"
else
  FRONTEND_HOST="${FRONTEND_HOST:-http://localhost:5173}"
fi

BACKEND_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_AR_REPOSITORY}/${BACKEND_SERVICE}:${TAG}"
FRONTEND_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_AR_REPOSITORY}/${FRONTEND_SERVICE}:${TAG}"

echo "Using project=${GCP_PROJECT_ID}, region=${GCP_REGION}, tag=${TAG}"
echo "Using FRONTEND_HOST=${FRONTEND_HOST}"
if [[ "${ORIGINAL_ENVIRONMENT}" != "production" ]]; then
  echo "Forcing ENVIRONMENT=production for Cloud Run deploy (was: ${ORIGINAL_ENVIRONMENT})"
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
BACKEND_BUILD_CONFIG="$(mktemp)"
register_cleanup_file "${BACKEND_BUILD_CONFIG}"
cat > "${BACKEND_BUILD_CONFIG}" <<'YAML'
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
gcloud builds submit \
  --substitutions "_IMAGE=${BACKEND_IMAGE}" \
  --config "${BACKEND_BUILD_CONFIG}" \
  .

yaml_escape() {
  printf '%s' "$1" | sed "s/'/''/g"
}

echo "Preparing one-service deployment for ${FULL_SERVICE}"

echo "Deploying backend init job ${BACKEND_INIT_JOB}"
JOB_ENV_FILE="$(mktemp)"
register_cleanup_file "${JOB_ENV_FILE}"
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
  printf "RUN_STARTUP_DATA_IMPORTS: 'false'\n"
  printf "IMPORT_GCS_URI: '%s'\n" "$(yaml_escape "${IMPORT_GCS_URI}")"
  printf "IMPORT_RESOURCES_LOCAL_PATH: '%s'\n" "$(yaml_escape "${IMPORT_RESOURCES_LOCAL_PATH}")"
} > "${JOB_ENV_FILE}"

gcloud run jobs deploy "${BACKEND_INIT_JOB}" \
  --image "${BACKEND_IMAGE}" \
  --region "${GCP_REGION}" \
  --service-account "${RUN_SERVICE_ACCOUNT_EMAIL}" \
  --task-timeout "${BACKEND_INIT_JOB_TASK_TIMEOUT}" \
  --cpu "${BACKEND_INIT_JOB_CPU}" \
  --memory "${BACKEND_INIT_JOB_MEMORY}" \
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
  --timeout "${INIT_TRIGGER_FUNCTION_TIMEOUT}" \
  --source backend/scripts/gcp/functions/manual_backend_init \
  --entry-point trigger_backend_init \
  --trigger-http \
  --no-allow-unauthenticated \
  --service-account "${RUN_SERVICE_ACCOUNT_EMAIL}" \
  --set-env-vars "GCP_PROJECT_ID=${GCP_PROJECT_ID},GCP_REGION=${GCP_REGION},BACKEND_INIT_JOB=${BACKEND_INIT_JOB},JOB_STEP_TIMEOUT_SECONDS=${JOB_STEP_TIMEOUT_SECONDS},JOB_POLL_INTERVAL_SECONDS=${JOB_POLL_INTERVAL_SECONDS}"

echo "Building frontend image ${FRONTEND_IMAGE} with VITE_API_URL=${API_V1_STR}"
FRONTEND_BUILD_CONFIG="$(mktemp)"
register_cleanup_file "${FRONTEND_BUILD_CONFIG}"
cat > "${FRONTEND_BUILD_CONFIG}" <<'YAML'
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
gcloud builds submit \
  --substitutions "_IMAGE=${FRONTEND_IMAGE},_VITE_API_URL=${API_V1_STR}" \
  --config "${FRONTEND_BUILD_CONFIG}" \
  .

echo "Deploying combined Cloud Run service ${FULL_SERVICE}"
SERVICE_RENDERED="$(mktemp)"
register_cleanup_file "${SERVICE_RENDERED}"
cat > "${SERVICE_RENDERED}" <<YAML
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: ${FULL_SERVICE}
  labels:
    cloud.googleapis.com/location: ${GCP_REGION}
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cloudsql-instances: ${CLOUD_SQL_CONNECTION_NAME}
        run.googleapis.com/network-interfaces: '[{"network":"${VPC_NETWORK}","subnetwork":"${VPC_SUBNET}"}]'
        run.googleapis.com/vpc-access-egress: private-ranges-only
    spec:
      serviceAccountName: ${RUN_SERVICE_ACCOUNT_EMAIL}
      containers:
      - name: frontend
        image: ${FRONTEND_IMAGE}
        ports:
        - containerPort: 8080
        startupProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        livenessProbe:
          httpGet:
            path: /
            port: 8080
          periodSeconds: 30
          timeoutSeconds: 5
        resources:
          limits:
            cpu: 500m
            memory: 256Mi
      - name: backend
        image: ${BACKEND_IMAGE}
        startupProbe:
          httpGet:
            path: /api/v1/utils/health-check/
            port: 9000
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        livenessProbe:
          httpGet:
            path: /api/v1/utils/health-check/
            port: 9000
          periodSeconds: 30
          timeoutSeconds: 5
        env:
        - name: ENVIRONMENT
          value: "$(yaml_escape "${ENVIRONMENT}")"
        - name: PROJECT_NAME
          value: "$(yaml_escape "${PROJECT_NAME}")"
        - name: API_V1_STR
          value: "$(yaml_escape "${API_V1_STR}")"
        - name: BACKEND_CORS_ORIGINS
          value: "$(yaml_escape "${BACKEND_CORS_ORIGINS}")"
        - name: FRONTEND_HOST
          value: "$(yaml_escape "${FRONTEND_HOST}")"
        - name: CLOUD_SQL_INSTANCE_CONNECTION_NAME
          value: "$(yaml_escape "${CLOUD_SQL_CONNECTION_NAME}")"
        - name: POSTGRES_SERVER
          value: "localhost"
        - name: POSTGRES_DB
          value: "$(yaml_escape "${CLOUD_SQL_DB}")"
        - name: POSTGRES_USER
          value: "$(yaml_escape "${CLOUD_SQL_USER}")"
        - name: RUN_DATA_IMPORTS
          value: "$(yaml_escape "${RUN_DATA_IMPORTS}")"
        - name: RUN_STARTUP_DATA_IMPORTS
          value: "$(yaml_escape "${RUN_STARTUP_DATA_IMPORTS}")"
        - name: IMPORT_GCS_URI
          value: "$(yaml_escape "${IMPORT_GCS_URI}")"
        - name: IMPORT_RESOURCES_LOCAL_PATH
          value: "$(yaml_escape "${IMPORT_RESOURCES_LOCAL_PATH}")"
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              key: latest
              name: capanel-secret-key
        - name: FIRST_SUPERUSER
          valueFrom:
            secretKeyRef:
              key: latest
              name: capanel-superuser-email
        - name: FIRST_SUPERUSER_PASSWORD
          valueFrom:
            secretKeyRef:
              key: latest
              name: capanel-superuser-password
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              key: latest
              name: capanel-postgres-password
        resources:
          limits:
            cpu: 1000m
            memory: 2Gi
YAML

gcloud run services replace "${SERVICE_RENDERED}" --region "${GCP_REGION}"
gcloud run services add-iam-policy-binding "${FULL_SERVICE}" \
  --region "${GCP_REGION}" \
  --member "allUsers" \
  --role "roles/run.invoker" >/dev/null

FULL_SERVICE_URL="$(
  gcloud run services describe "${FULL_SERVICE}" \
    --region "${GCP_REGION}" \
    --format='value(status.url)'
)"
echo "Full service URL: ${FULL_SERVICE_URL}"
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
