#!/usr/bin/env bash
# First-boot provisioning for the Amazon Linux 2023 instance. This runs ON THE
# INSTANCE, not on your machine, once, as ec2-user, before the first
# ./deploy.sh. Copy it up and run it:
#
#   scp -i <key.pem> bootstrap.sh ec2-user@<instance>:
#   ssh -i <key.pem> ec2-user@<instance> \
#     'REPO=https://github.com/<you>/app-capanel-web.git BRANCH=master bash bootstrap.sh'
#
# REPO and BRANCH default to the upstream default branch, so set them when
# deploying a fork or a branch that has not been merged yet.
#
# It is idempotent, so re-running it after an AMI refresh is safe.
#
# Amazon Linux 2023, not Ubuntu: the packages come from dnf, the login user is
# ec2-user, and the AWS CLI is already in the AMI (deploy.sh needs it for
# Parameter Store). SELinux ships in permissive mode, so the bind mounts in
# compose.yaml need no relabelling.
set -euo pipefail

APP_USER="${APP_USER:-ec2-user}"
APP_DIR="${APP_DIR:-/opt/capanel}"
REPO="${REPO:-https://github.com/opensacorg/app-capanel-web.git}"
# Empty means the remote's default branch.
BRANCH="${BRANCH:-}"
SWAP_SIZE_MB="${SWAP_SIZE_MB:-2048}"

sudo dnf -y upgrade --releasever=latest
# rsync is not in the minimal AMI and the front-end deploy is an rsync.
sudo dnf -y install docker git rsync

# AL2023 packages the Docker engine but not the Compose v2 CLI plugin, so it is
# installed by hand. Pin COMPOSE_VERSION to make this reproducible; unset, it
# follows whatever the releases/latest redirect points at.
COMPOSE_VERSION="${COMPOSE_VERSION:-}"
if [[ -z $COMPOSE_VERSION ]]; then
	latest=$(curl -fsSLI -o /dev/null -w '%{url_effective}' \
		https://github.com/docker/compose/releases/latest)
	COMPOSE_VERSION="${latest##*/}"
fi
plugin_dir=/usr/libexec/docker/cli-plugins
sudo mkdir -p "$plugin_dir"
# The release asset names match `uname -m` exactly (x86_64, aarch64), and the
# deployment target is a Graviton instance, so no architecture mapping is
# needed here.
sudo curl -fsSL -o "$plugin_dir/docker-compose" \
	"https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-$(uname -m)"
sudo chmod 0755 "$plugin_dir/docker-compose"

sudo systemctl enable --now docker
# Takes effect on the next login, which is why deploy.sh is a separate step.
sudo usermod -aG docker "$APP_USER"

# The AMI ships no swap, and `docker compose build` on a 2 GiB instance is the
# one thing that runs out of memory. Postgres is tuned for 2 GiB in
# compose.yaml, so this is headroom for builds, not for the database.
if [[ -z $(swapon --show) ]]; then
	# dd rather than fallocate: mkswap rejects a file with holes on xfs.
	sudo dd if=/dev/zero of=/swapfile bs=1M count="$SWAP_SIZE_MB" status=none
	sudo chmod 600 /swapfile
	sudo mkswap /swapfile
	sudo swapon /swapfile
	echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
fi

sudo mkdir -p "$APP_DIR"
sudo chown "$APP_USER" "$APP_DIR"
if [[ ! -d $APP_DIR/.git ]]; then
	clone_args=()
	[[ -n $BRANCH ]] && clone_args+=(--branch "$BRANCH")
	git clone "${clone_args[@]}" "$REPO" "$APP_DIR"
fi
# Where the front-end rsync lands. Caddy mounts it read-only and serves it
# directly, so an empty directory here just means a 404 until the first deploy.
mkdir -p "$APP_DIR/dist"

cat <<'DONE'

Provisioned. Log out and back in to pick up the docker group, then:

    cd /opt/capanel && ./deploy.sh
DONE
