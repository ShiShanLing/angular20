#!/usr/bin/env bash
set -euo pipefail
umask 022

ARCHIVE_BASE_URL="${ANGULAR20_ARCHIVE_BASE_URL:-https://codeload.github.com/ShiShanLing/angular20/tar.gz}"
BUILD_USER="${ANGULAR20_BUILD_USER:-angular20-build}"
REQUEST_DIR="${DEPLOY_REQUEST_DIR:-/var/lib/angular20-deploy/requests}"
STATUS_DIR="${DEPLOY_STATUS_DIR:-/var/lib/angular20-deploy/status}"
LOG_PATH="${DEPLOY_LOG_PATH:-/var/log/angular20-deploy.log}"
BUILD_ROOT="${DEPLOY_BUILD_ROOT:-/var/tmp/angular20-deploy-build}"
BACKUP_ROOT="${DEPLOY_BACKUP_ROOT:-/var/lib/angular20-deploy/backups}"
LOCK_FILE="${DEPLOY_LOCK_FILE:-/run/angular20-deploy.lock}"
WEB_ROOT="${ANGULAR20_WEB_ROOT:-/var/www/projects/angular20}"
BACKEND_ROOT="${ANGULAR20_BACKEND_ROOT:-/opt/angular20-server}"
SERVICE_NAME="${ANGULAR20_SERVICE_NAME:-nest-server.service}"
BASE_PATH="${ANGULAR20_BASE_PATH:-/angular20/}"
BACKUP_RETENTION="${DEPLOY_BACKUP_RETENTION:-3}"

mkdir -p "$REQUEST_DIR" "$STATUS_DIR" "$BUILD_ROOT" "$BACKUP_ROOT" "$(dirname "$LOG_PATH")"

log() {
  echo "[$(date -Is)] $*" | tee -a "$LOG_PATH"
}

json_set() {
  local file="$1"
  local state="$2"
  local exit_code="${3:-}"
  local message="${4:-}"
  node - "$file" "$state" "$exit_code" "$message" <<'NODE'
const fs = require('fs');
const [file, state, rawCode, message] = process.argv.slice(2);
const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
data.state = state;
if (state === 'running') data.startedAt = new Date().toISOString();
if (state === 'success' || state === 'failure') data.finishedAt = new Date().toISOString();
if (rawCode !== '') data.exitCode = Number(rawCode);
if (message) data.message = message;
const temporary = `${file}.tmp-${process.pid}`;
fs.writeFileSync(temporary, JSON.stringify(data, null, 2));
fs.renameSync(temporary, file);
NODE
}

read_request() {
  node - "$1" <<'NODE'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (!/^[0-9a-f-]{36}$/i.test(data.runId || '')) throw new Error('invalid runId');
if (!/^[0-9a-f]{40}$/i.test(data.commit || '')) throw new Error('invalid commit');
process.stdout.write(`${data.runId} ${data.commit.toLowerCase()}`);
NODE
}

run_as_builder() {
  runuser -u "$BUILD_USER" -- env \
    HOME="$build_dir/home" \
    npm_config_cache="$build_dir/npm-cache" \
    "$@"
}

wait_for_health() {
  local _
  for _ in $(seq 1 45); do
    if curl -fsS "http://127.0.0.1${BASE_PATH}api/docs" >/dev/null && \
       curl -fsS "http://127.0.0.1${BASE_PATH}" >/dev/null; then
      return 0
    fi
    sleep 2
  done
  return 1
}

rollback_release() {
  log "Health check failed; rolling back the previous release"
  systemctl stop "$SERVICE_NAME" || true
  rm -rf -- "$WEB_ROOT" "$BACKEND_ROOT"
  if [ -d "$previous_web" ]; then mv "$previous_web" "$WEB_ROOT"; fi
  if [ -d "$previous_backend" ]; then mv "$previous_backend" "$BACKEND_ROOT"; fi
  systemctl start "$SERVICE_NAME" || true
}

prune_backups() {
  find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
    | sort -rn \
    | awk -v keep="$BACKUP_RETENTION" 'NR > keep { sub(/^[^ ]+ /, ""); print }' \
    | while IFS= read -r old_backup; do
        case "$old_backup" in
          "$BACKUP_ROOT"/*) rm -rf --one-file-system -- "$old_backup" ;;
        esac
      done
}

deploy_commit() {
  local run_id="$1"
  local commit="$2"
  build_dir="$BUILD_ROOT/$run_id"
  local repo_dir="$build_dir/repository"
  local next_web
  local next_backend
  next_web="$(dirname "$WEB_ROOT")/.angular20.next-$run_id"
  next_backend="$(dirname "$BACKEND_ROOT")/.angular20-server.next-$run_id"
  previous_web="$(dirname "$WEB_ROOT")/.angular20.previous-$run_id"
  previous_backend="$(dirname "$BACKEND_ROOT")/.angular20-server.previous-$run_id"

  rm -rf -- "$build_dir" "$next_web" "$next_backend" "$previous_web" "$previous_backend"
  install -d -o "$BUILD_USER" -g "$BUILD_USER" "$build_dir" "$build_dir/home" "$repo_dir"

  local source_archive="$build_dir/source.tar.gz"
  log "Downloading commit $commit into an isolated build directory"
  run_as_builder curl -fsSL --retry 3 --retry-delay 2 \
    "$ARCHIVE_BASE_URL/$commit" -o "$source_archive"
  run_as_builder tar -xzf "$source_archive" --strip-components=1 -C "$repo_dir"
  rm -f -- "$source_archive"
  test -f "$repo_dir/package-lock.json"
  test -f "$repo_dir/server/package-lock.json"

  log "Installing and building the frontend"
  run_as_builder npm --prefix "$repo_dir" ci --no-audit --no-fund
  run_as_builder npm --prefix "$repo_dir" exec -- ng build --base-href "$BASE_PATH"
  test -f "$repo_dir/dist/angular20/browser/index.html"

  log "Installing and building the backend"
  run_as_builder npm --prefix "$repo_dir/server" ci --no-audit --no-fund
  run_as_builder npm --prefix "$repo_dir/server" run build
  run_as_builder npm --prefix "$repo_dir/server" prune --omit=dev --no-audit --no-fund
  test -f "$repo_dir/server/dist/main.js"

  install -d "$next_web" "$next_backend"
  rsync -a --delete "$repo_dir/dist/angular20/browser/" "$next_web/"
  rsync -a --delete "$repo_dir/server/dist/" "$next_backend/dist/"
  rsync -a --delete "$repo_dir/server/node_modules/" "$next_backend/node_modules/"
  install -m 0644 "$repo_dir/server/package.json" "$next_backend/package.json"
  install -m 0644 "$repo_dir/server/package-lock.json" "$next_backend/package-lock.json"

  log "Switching the frontend and backend to commit $commit"
  systemctl stop "$SERVICE_NAME"
  if [ -d "$WEB_ROOT" ]; then mv "$WEB_ROOT" "$previous_web"; fi
  if [ -d "$BACKEND_ROOT" ]; then mv "$BACKEND_ROOT" "$previous_backend"; fi
  mv "$next_web" "$WEB_ROOT"
  mv "$next_backend" "$BACKEND_ROOT"
  systemctl start "$SERVICE_NAME"

  if ! wait_for_health; then
    rollback_release
    return 1
  fi

  local backup_dir
  backup_dir="$BACKUP_ROOT/$(date '+%Y%m%d-%H%M%S')-$run_id"
  mkdir -p "$backup_dir"
  if [ -d "$previous_web" ]; then mv "$previous_web" "$backup_dir/web"; fi
  if [ -d "$previous_backend" ]; then mv "$previous_backend" "$backup_dir/backend"; fi
  printf '%s\n' "$commit" > "$backup_dir/replaced-by-commit.txt"
  prune_backups
  log "Deployment and health checks completed for $commit"
}

run_one() {
  local request_file="$1"
  local request run_id commit status_file code
  request="$(read_request "$request_file")"
  run_id="${request%% *}"
  commit="${request##* }"
  status_file="$STATUS_DIR/$run_id.json"

  json_set "$status_file" running
  log "Deploy run $run_id started"

  set +e
  deploy_commit "$run_id" "$commit" >> "$LOG_PATH" 2>&1
  code=$?
  set -e

  rm -rf -- "${BUILD_ROOT:?}/$run_id"
  if [ "$code" -eq 0 ]; then
    json_set "$status_file" success "$code"
    rm -f -- "$request_file"
  else
    json_set "$status_file" failure "$code" "Deployment worker exited with code $code"
    mv -- "$request_file" "$request_file.failed"
  fi

  log "Deploy run $run_id finished with code $code"
  return "$code"
}

main() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "This worker must run as root." >&2
    exit 1
  fi
  id "$BUILD_USER" >/dev/null

  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    log "Deploy worker skipped because another deployment is running"
    exit 0
  fi

  local request_file
  request_file="$(find "$REQUEST_DIR" -maxdepth 1 -type f -name '*.json' | sort | head -n 1 || true)"
  if [ -z "$request_file" ]; then
    exit 0
  fi

  run_one "$request_file"
}

main "$@"
