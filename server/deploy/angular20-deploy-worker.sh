#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/root/projects/angular20}"
REQUEST_DIR="${DEPLOY_REQUEST_DIR:-/var/lib/angular20-deploy/requests}"
STATUS_DIR="${DEPLOY_STATUS_DIR:-/var/lib/angular20-deploy/status}"
LOG_PATH="${DEPLOY_LOG_PATH:-/var/log/angular20-deploy.log}"
LOCK_FILE="${DEPLOY_LOCK_FILE:-/run/angular20-deploy.lock}"

mkdir -p "$REQUEST_DIR" "$STATUS_DIR" "$(dirname "$LOG_PATH")"

json_set() {
  local file="$1"
  local state="$2"
  local exit_code="${3:-}"
  node - "$file" "$state" "$exit_code" <<'NODE'
const fs = require('fs');
const [file, state, rawCode] = process.argv.slice(2);
const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
data.state = state;
if (state === 'running') data.startedAt = new Date().toISOString();
if (state === 'success' || state === 'failure') data.finishedAt = new Date().toISOString();
if (rawCode !== '') data.exitCode = Number(rawCode);
fs.writeFileSync(file, JSON.stringify(data, null, 2));
NODE
}

run_one() {
  local request_file="$1"
  local run_id
  run_id="$(node -e 'const fs=require("fs"); process.stdout.write(JSON.parse(fs.readFileSync(process.argv[1],"utf8")).runId)' "$request_file")"
  local status_file="$STATUS_DIR/$run_id.json"

  json_set "$status_file" running
  {
    echo
    echo "[$(date -Is)] deploy run $run_id started"
  } >> "$LOG_PATH"

  set +e
  "$PROJECT_DIR/scripts/deploy-full.sh" >> "$LOG_PATH" 2>&1
  local code=$?
  set -e

  if [ "$code" -eq 0 ]; then
    json_set "$status_file" success "$code"
    rm -f "$request_file"
  else
    json_set "$status_file" failure "$code"
    mv "$request_file" "$request_file.failed"
  fi

  echo "[$(date -Is)] deploy run $run_id finished with code $code" >> "$LOG_PATH"
  return "$code"
}

main() {
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    echo "[$(date -Is)] deploy worker skipped: another deploy is running" >> "$LOG_PATH"
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
