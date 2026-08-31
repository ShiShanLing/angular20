#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_ROOT=/var/lib/angular20-deploy
LEGACY_ARCHIVE="$DEPLOY_ROOT/legacy-webhook-$(date -u '+%Y%m%d-%H%M%S')"

if [ "$(id -u)" -ne 0 ]; then
  echo "run this installer as root" >&2
  exit 1
fi

id deploy >/dev/null 2>&1 || {
  echo "the deploy account must already exist" >&2
  exit 2
}
id angular20 >/dev/null 2>&1 || {
  echo "the angular20 runtime account must already exist" >&2
  exit 2
}

install -d -o root -g root -m 0755 /usr/local/sbin
install -o root -g root -m 0755 \
  "$ROOT_DIR/deploy/angular20-release" /usr/local/sbin/angular20-release

install -d -o root -g root -m 0755 /etc/sudoers.d
install -o root -g root -m 0440 \
  "$ROOT_DIR/deploy/angular20-deploy.sudoers" /etc/sudoers.d/angular20-deploy
visudo -cf /etc/sudoers.d/angular20-deploy >/dev/null

install -o root -g root -m 0644 \
  "$ROOT_DIR/deploy/nest-server.service" /etc/systemd/system/nest-server.service

install -d -o root -g root -m 0755 "$DEPLOY_ROOT"
install -d -o deploy -g deploy -m 0755 "$DEPLOY_ROOT/staging"
install -d -o root -g root -m 0750 "$DEPLOY_ROOT/releases"

# Retire the old public webhook worker. Preserve its request/status files for
# diagnosis instead of executing or silently deleting them.
systemctl disable --now angular20-deploy.path angular20-deploy.service 2>/dev/null || true
if [ -e /var/lib/angular20-deploy/request ] || \
   [ -d /var/lib/angular20-deploy/status ] || \
   [ -d /var/tmp/angular20-deploy-build ]; then
  install -d -o root -g root -m 0700 "$LEGACY_ARCHIVE"
  [ ! -e /var/lib/angular20-deploy/request ] || \
    mv /var/lib/angular20-deploy/request "$LEGACY_ARCHIVE/request"
  [ ! -d /var/lib/angular20-deploy/status ] || \
    mv /var/lib/angular20-deploy/status "$LEGACY_ARCHIVE/status"
  [ ! -d /var/tmp/angular20-deploy-build ] || \
    mv /var/tmp/angular20-deploy-build "$LEGACY_ARCHIVE/build"
fi
rm -f -- /etc/systemd/system/angular20-deploy.path \
  /etc/systemd/system/angular20-deploy.service
rm -rf --one-file-system -- /usr/local/lib/angular20-deploy

if [ -f /etc/angular20-server.env ]; then
  sed -i \
    -e '/^DEPLOY_HOOK_SECRET=/d' \
    -e '/^DEPLOY_REQUEST_DIR=/d' \
    -e '/^DEPLOY_STATUS_DIR=/d' \
    -e '/^DEPLOY_LOG_PATH=/d' \
    -e '/^DEPLOY_ACTIVE_TTL_MS=/d' \
    -e '/^PROJECT_DIR=/d' \
    -e '/^GITHUB_SHA=/d' \
    /etc/angular20-server.env
  chown root:angular20 /etc/angular20-server.env
  chmod 0640 /etc/angular20-server.env
fi

systemctl daemon-reload
systemctl reset-failed angular20-deploy.service 2>/dev/null || true

echo "Angular20 deploy access installed."
echo "The public webhook worker is disabled; releases now require deploy + the fixed helper."
