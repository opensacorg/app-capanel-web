#!/usr/bin/env bash
# The one script that runs on the Amazon Linux 2023 EC2 instance. Pulls secrets
# from SSM Parameter Store into .env, then rebuilds and restarts. ./bootstrap.sh
# installs Docker and clones the repository; this script assumes both are done.
#
#   cd /opt/capanel && ./deploy.sh
#
# The front end is deployed separately and does not go through this script:
#   vp install && vp run build
#   rsync -az --delete frontend/dist/ ec2-user@<instance>:/opt/capanel/dist/
set -euo pipefail

REGION="${AWS_REGION:-us-west-2}"
# Bare `:80` means plain HTTP on every interface, with no certificate: the
# instance is reachable at its AWS public DNS name straight away. Let's Encrypt
# cannot issue for a *.compute.amazonaws.com name — AWS owns that zone — so a
# real hostname is what turns TLS on, and setting SITE_ADDRESS to one is the
# only change needed.
SITE_ADDRESS="${SITE_ADDRESS:-:80}"
FIRST_SUPERUSER="${FIRST_SUPERUSER:-admin@example.org}"
APP_DIR="${APP_DIR:-/opt/capanel}"

cd "$APP_DIR"

param() {
	aws ssm get-parameter --region "$REGION" --name "$1" --with-decryption \
		--query Parameter.Value --output text
}

# The instance metadata service, IMDSv2 only — AL2023 refuses the unauthenticated
# v1 request.
imds() {
	local token
	token=$(curl -fsS -X PUT http://169.254.169.254/latest/api/token \
		-H 'X-aws-ec2-metadata-token-ttl-seconds: 60')
	curl -fsS -H "X-aws-ec2-metadata-token: $token" \
		"http://169.254.169.254/latest/meta-data/$1"
}

# The origin the browser actually uses, which is what the application needs for
# password-reset links and CORS. With a hostname in SITE_ADDRESS that is the
# https:// form of it; without one, it is the instance's own public DNS name.
case "$SITE_ADDRESS" in
:*) PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-http://$(imds public-hostname)}" ;;
*) PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://${SITE_ADDRESS}}" ;;
esac

cat > .env <<ENV
SITE_ADDRESS=${SITE_ADDRESS}
PROJECT_NAME=California Dashboard
POSTGRES_DB=capanel
POSTGRES_USER=capanel
POSTGRES_PASSWORD=$(param /capanel/postgres-password)
SECRET_KEY=$(param /capanel/secret-key)
FIRST_SUPERUSER=${FIRST_SUPERUSER}
FIRST_SUPERUSER_PASSWORD=$(param /capanel/first-superuser-password)
FRONTEND_HOST=${PUBLIC_ORIGIN}
BACKEND_CORS_ORIGINS=${PUBLIC_ORIGIN}
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

echo "Deployed. The site is at ${PUBLIC_ORIGIN}"
