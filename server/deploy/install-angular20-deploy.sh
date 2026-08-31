#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this installer as root." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_USER="${ANGULAR20_APP_USER:-angular20}"
BUILD_USER="${ANGULAR20_BUILD_USER:-angular20-build}"
STATE_ROOT="${ANGULAR20_DEPLOY_STATE_ROOT:-/var/lib/angular20-deploy}"
ENV_FILE="${ANGULAR20_ENV_FILE:-/etc/angular20-server.env}"
BOOTSTRAP_COMMIT="${1:-}"

id "$APP_USER" >/dev/null
if ! id "$BUILD_USER" >/dev/null 2>&1; then
  useradd --system --home-dir "$STATE_ROOT/build-home" --create-home --shell /usr/sbin/nologin "$BUILD_USER"
fi

install -d -o root -g root -m 0755 /usr/local/lib/angular20-deploy
install -o root -g root -m 0755 "$SCRIPT_DIR/angular20-deploy-worker.sh" /usr/local/lib/angular20-deploy/worker.sh
install -o root -g root -m 0644 "$SCRIPT_DIR/angular20-deploy.service" /etc/systemd/system/angular20-deploy.service
install -o root -g root -m 0644 "$SCRIPT_DIR/angular20-deploy.path" /etc/systemd/system/angular20-deploy.path

install -d -o root -g root -m 0755 "$STATE_ROOT" "$STATE_ROOT/backups"
install -d -o "$APP_USER" -g "$APP_USER" -m 0755 "$STATE_ROOT/requests" "$STATE_ROOT/status"
install -d -o "$BUILD_USER" -g "$BUILD_USER" -m 0750 "$STATE_ROOT/build-home" /var/tmp/angular20-deploy-build
touch /var/log/angular20-deploy.log
chown root:adm /var/log/angular20-deploy.log
chmod 0640 /var/log/angular20-deploy.log

set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

touch "$ENV_FILE"
chmod 0600 "$ENV_FILE"
set_env DEPLOY_REQUEST_DIR "$STATE_ROOT/requests"
set_env DEPLOY_STATUS_DIR "$STATE_ROOT/status"
sed -i '/^PROJECT_DIR=/d' "$ENV_FILE"

systemctl daemon-reload
systemctl enable --now angular20-deploy.path

if [ -n "$BOOTSTRAP_COMMIT" ]; then
  if ! [[ "$BOOTSTRAP_COMMIT" =~ ^[0-9a-fA-F]{40}$ ]]; then
    echo "Bootstrap commit must be a full 40-character Git SHA." >&2
    exit 2
  fi
  run_id="$(cat /proc/sys/kernel/random/uuid)"
  requested_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  printf '{"runId":"%s","state":"queued","requestedAt":"%s","commit":"%s"}\n' \
    "$run_id" "$requested_at" "${BOOTSTRAP_COMMIT,,}" > "$STATE_ROOT/status/$run_id.json"
  printf '{"runId":"%s","requestedAt":"%s","commit":"%s"}\n' \
    "$run_id" "$requested_at" "${BOOTSTRAP_COMMIT,,}" > "$STATE_ROOT/requests/$run_id.json"
  chown "$APP_USER:$APP_USER" "$STATE_ROOT/status/$run_id.json" "$STATE_ROOT/requests/$run_id.json"
  systemctl start --no-block angular20-deploy.service
  echo "Bootstrap deployment queued with runId=$run_id"
fi

echo "Angular20 deployment worker installed."
