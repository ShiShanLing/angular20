#!/usr/bin/env bash
# 服务器全量部署：拉取 master → 构建前后端 → 发布静态资源 → 重启 API
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/root/projects/angular20}"
WEB_ROOT="${WEB_ROOT:-/var/www/angular20}"
BRANCH="${DEPLOY_BRANCH:-master}"
SERVICE_NAME="${NEST_SERVICE:-nest-server}"

log() {
  echo "[deploy] $(date '+%Y-%m-%d %H:%M:%S') $*"
}

setup_node() {
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "$HOME/.nvm/nvm.sh"
    if [ -f "$PROJECT_DIR/.nvmrc" ]; then
      nvm install >/dev/null
      nvm use >/dev/null
    fi
  fi
  log "Node $(node -v), npm $(npm -v)"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

health_check() {
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/api/docs || true)"
  if [ "$code" != "200" ]; then
    echo "Health check failed: /api/docs returned HTTP $code" >&2
    exit 1
  fi
  log "Health check passed (HTTP $code)"
}

main() {
  require_cmd git
  require_cmd npm
  require_cmd rsync
  require_cmd systemctl
  require_cmd curl

  setup_node

  cd "$PROJECT_DIR"
  log "Pull latest $BRANCH in $PROJECT_DIR"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
  log "HEAD: $(git log -1 --oneline)"

  log "Install frontend dependencies"
  npm install

  log "Build frontend"
  npm run build

  log "Publish frontend to $WEB_ROOT"
  rsync -a --delete dist/angular20/browser/ "$WEB_ROOT/"
  systemctl reload nginx

  log "Install backend dependencies"
  cd "$PROJECT_DIR/server"
  npm install

  log "Build backend"
  npm run build

  log "Restart $SERVICE_NAME"
  systemctl restart "$SERVICE_NAME"
  systemctl is-active --quiet "$SERVICE_NAME"

  health_check
  log "Deploy completed successfully"
}

main "$@"
