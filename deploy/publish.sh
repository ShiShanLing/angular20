#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${ANGULAR20_DEPLOY_HOST:-baidu-bcc}"
STAGING_ROOT="${ANGULAR20_STAGING_ROOT:-/var/lib/angular20-deploy/staging}"
PUBLIC_BASE="${ANGULAR20_PUBLIC_BASE:-https://shishanling.cn/workshop/}"
DRY_RUN=false
TARGETS_RAW=""

log() {
  printf '[publish] %s\n' "$*"
}

fail() {
  printf '[publish] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage:
  ./deploy/publish.sh publish --targets frontend[,backend] [--dry-run]

Targets:
  frontend   Build and publish /var/www/projects/workshop
  backend    Build and publish /opt/angular20-server, then restart nest-server.service

GitHub:
  HEAD must already be pushed to origin before packaging or publishing.
  Uncommitted or unpushed local commits are rejected.
EOF
}

if [ "${1:-}" != "publish" ]; then
  usage
  exit 2
fi
shift

while [ "$#" -gt 0 ]; do
  case "$1" in
    --targets)
      [ "$#" -ge 2 ] || fail "--targets requires a value"
      TARGETS_RAW="$2"
      shift 2
      ;;
    --allow-dirty)
      fail "--allow-dirty is disabled; commit and push to GitHub before publishing"
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "unknown argument: $1"
      ;;
  esac
done

[ -n "$TARGETS_RAW" ] || fail "--targets must explicitly select frontend, backend, or both"

want_frontend=false
want_backend=false
IFS=',' read -r -a requested_targets <<< "$TARGETS_RAW"
for target in "${requested_targets[@]}"; do
  case "$target" in
    frontend) want_frontend=true ;;
    backend) want_backend=true ;;
    *) fail "unsupported target: $target" ;;
  esac
done

targets=()
$want_frontend && targets+=(frontend)
$want_backend && targets+=(backend)
targets_csv="$(IFS=,; printf '%s' "${targets[*]}")"

cd "$ROOT"
if [ -n "$(git status --porcelain)" ]; then
  fail "uncommitted changes are not on GitHub; commit and push before publishing"
fi

origin_url="$(git remote get-url origin 2>/dev/null || true)"
[ -n "$origin_url" ] || fail "origin remote is missing; push this repo to GitHub first"
case "$origin_url" in
  *github.com*) ;;
  *) fail "origin is not GitHub ($origin_url)" ;;
esac

branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" != HEAD ] || fail "detached HEAD cannot be published; checkout a branch and push it to GitHub"

log "verifying $branch@$(git rev-parse --short HEAD) is on GitHub"
git fetch origin "$branch" || fail "could not fetch origin/$branch from GitHub"
git rev-parse --verify "origin/$branch" >/dev/null 2>&1 || \
  fail "origin/$branch does not exist; git push -u origin HEAD"
git merge-base --is-ancestor HEAD "origin/$branch" || \
  fail "HEAD is not on GitHub; git push origin HEAD before publishing"

if [ -s "$ROOT/.nvmrc" ] && [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  nvm use >/dev/null
fi

required_node="$(tr -dc '0-9' < "$ROOT/.nvmrc")"
actual_node="$(node -p 'process.versions.node.split(".")[0]')"
[ "$actual_node" = "$required_node" ] || fail "Node $required_node is required; current major version is $actual_node"

git_sha="$(git rev-parse HEAD)"
release_id="$(date -u '+%Y%m%d-%H%M%S')-${git_sha:0:12}"
stage="$STAGING_ROOT/$release_id"

log "release=$release_id targets=$targets_csv host=$HOST"
log "checking SSH and server runtime"
ssh -o BatchMode=yes -o ConnectTimeout=10 "$HOST" \
  "test \"\$(id -un)\" = deploy && command -v node npm rsync >/dev/null && test -d '$STAGING_ROOT'"

if $want_frontend; then
  log "installing frontend dependencies"
  npm ci --no-audit --no-fund
  log "building frontend"
  npm run build -- --base-href /workshop/
  test -f "$ROOT/dist/angular20/browser/index.html"
  grep -q '<base href="/workshop/">' "$ROOT/dist/angular20/browser/index.html"
  if grep -Eq '(src|href)="/(assets/|main-|polyfills-|styles-)' \
    "$ROOT/dist/angular20/browser/index.html"; then
    fail "frontend build contains root-relative assets outside /workshop/"
  fi
  chmod -R u=rwX,go=rX "$ROOT/dist/angular20/browser"
fi

if $want_backend; then
  log "installing backend dependencies"
  npm --prefix "$ROOT/server" ci --no-audit --no-fund
  log "building backend"
  npm --prefix "$ROOT/server" run build
  test -f "$ROOT/server/dist/main.js"
fi

if [ "$DRY_RUN" = true ]; then
  log "dry-run completed; production was not changed"
  exit 0
fi

log "creating isolated remote staging directory"
ssh "$HOST" "install -d -m 0755 '$stage'"

if $want_frontend; then
  ssh "$HOST" "install -d -m 0755 '$stage/frontend'"
  rsync -az --delete "$ROOT/dist/angular20/browser/" "$HOST:$stage/frontend/"
fi

if $want_backend; then
  ssh "$HOST" "install -d -m 0755 '$stage/backend' '$stage/backend/dist'"
  rsync -az --delete "$ROOT/server/dist/" "$HOST:$stage/backend/dist/"
  rsync -az "$ROOT/server/package.json" "$ROOT/server/package-lock.json" "$HOST:$stage/backend/"
  log "installing Linux production dependencies in staging"
  ssh "$HOST" "cd '$stage/backend' && npm ci --omit=dev --no-audit --no-fund"
fi

metadata_file="$ROOT/.angular20-release-$release_id.json"
trap 'rm -f -- "$metadata_file"' EXIT
printf '{"releaseId":"%s","commit":"%s","targets":"%s","createdAt":"%s"}\n' \
  "$release_id" "$git_sha" "$targets_csv" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" > "$metadata_file"
rsync -az "$metadata_file" "$HOST:$stage/release.json"

log "requesting validated atomic release"
ssh "$HOST" "sudo -n /usr/local/sbin/angular20-release apply '$release_id' '$targets_csv'"

log "verifying public endpoints"
if $want_frontend; then
  curl -fsS "$PUBLIC_BASE" >/dev/null
fi
if $want_backend; then
  curl -fsS "${PUBLIC_BASE}api/docs" >/dev/null
fi

log "release completed successfully: $release_id"
