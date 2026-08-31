#!/usr/bin/env bash
# 服务器全量部署：拉取 master → 构建前后端 → 发布静态资源 → 重启 API
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/root/projects/angular20}"
WEB_ROOT="${WEB_ROOT:-/var/www/projects/angular20}"
BASE_HREF="${BASE_HREF:-/angular20/}"
BRANCH="${DEPLOY_BRANCH:-master}"
SERVICE_NAME="${NEST_SERVICE:-nest-server}"
BACKUP_ROOT="${DEPLOY_BACKUP_ROOT:-/root/deploy-backups/angular20}"

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
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1${BASE_HREF}api/docs || true)"
  if [ "$code" != "200" ]; then
    echo "Health check failed: ${BASE_HREF}api/docs returned HTTP $code" >&2
    exit 1
  fi
  log "Health check passed (HTTP $code)"
}

backup_and_clean_worktree() {
  local status
  status="$(git status --porcelain)"
  if [ -z "$status" ]; then
    return
  fi

  local backup_dir
  backup_dir="$BACKUP_ROOT/$(date '+%Y%m%d-%H%M%S')"
  mkdir -p "$backup_dir"

  log "Dirty deploy worktree detected; backing up local changes to $backup_dir"
  git status --short > "$backup_dir/status.txt"
  git diff > "$backup_dir/tracked.diff" || true
  git diff --staged > "$backup_dir/staged.diff" || true
  git ls-files --others --exclude-standard -z > "$backup_dir/untracked-files.zlist"
  if [ -s "$backup_dir/untracked-files.zlist" ]; then
    tar --null -czf "$backup_dir/untracked-files.tgz" -T "$backup_dir/untracked-files.zlist"
  fi

  log "Reset deploy worktree to a clean Git state"
  git reset --hard HEAD
  git clean -fd
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
  backup_and_clean_worktree
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
  log "HEAD: $(git log -1 --oneline)"

  log "Install frontend dependencies"
  npm install

  log "Build frontend"
  npx ng build --base-href "$BASE_HREF"

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
