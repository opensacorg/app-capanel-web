#!/usr/bin/env bash
# The one script that runs on the EC2 instance. Pulls secrets from SSM
# Parameter Store into .env, then rebuilds and restarts.
#
#   sudo mkdir -p /opt/capanel && sudo chown "$USER" /opt/capanel
#   git clone https://github.com/opensacorg/app-capanel-web.git /opt/capanel
#   cd /opt/capanel && ./deploy.sh
#
# The front end is deployed separately and does not go through this script:
#   vp install && vp run build
#   rsync -az --delete frontend/dist/ <instance>:/opt/capanel/dist/
set -euo pipefail

REGION="${AWS_REGION:-us-west-2}"
SITE_ADDRESS="${SITE_ADDRESS:-capanel.example.org}"
FIRST_SUPERUSER="${FIRST_SUPERUSER:-admin@example.org}"
APP_DIR="${APP_DIR:-/opt/capanel}"

cd "$APP_DIR"

param() {
	aws ssm get-parameter --region "$REGION" --name "$1" --with-decryption \
		--query Parameter.Value --output text
}

cat > .env <<ENV
SITE_ADDRESS=${SITE_ADDRESS}
PROJECT_NAME=California Accountability Panel
POSTGRES_DB=capanel
POSTGRES_USER=capanel
POSTGRES_PASSWORD=$(param /capanel/postgres-password)
SECRET_KEY=$(param /capanel/secret-key)
FIRST_SUPERUSER=${FIRST_SUPERUSER}
FIRST_SUPERUSER_PASSWORD=$(param /capanel/first-superuser-password)
FRONTEND_HOST=https://${SITE_ADDRESS}
BACKEND_CORS_ORIGINS=https://${SITE_ADDRESS}
AWS_REGION=${REGION}
RESEARCH_FILE_SOURCE_URI=s3://capanel-007361225089-us-west-2-an/resources/california-state
ENV
chmod 600 .env

git pull --ff-only
docker compose build

# Migrations run as a one-off task rather than in the container's entrypoint,
# so a failed migration cannot crash-loop the service and shows up here.
docker compose run --rm backend alembic upgrade head
docker compose run --rm backend python backend/app/scripts/initial_data.py

docker compose up -d
docker image prune -f
