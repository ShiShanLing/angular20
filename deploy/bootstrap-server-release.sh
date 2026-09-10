#!/usr/bin/env bash
# Emergency/first-install bootstrap for cases where the ordinary SSH upload
# channel is unavailable. Daily releases must use deploy/publish.sh instead.
set -Eeuo pipefail

REPOSITORY=ShiShanLing/angular20
STAGING_ROOT=/var/lib/angular20-deploy/staging

if [ "$(id -u)" -ne 0 ]; then
  echo "run this bootstrap as root" >&2
  exit 1
fi
if [ "$#" -ne 1 ] || [[ ! "$1" =~ ^[0-9a-f]{40}$ ]]; then
  echo "usage: bootstrap-server-release.sh COMMIT_SHA" >&2
  exit 2
fi

commit="$1"
release_id="$(date -u '+%Y%m%d-%H%M%S')-${commit:0:12}"
work="/var/tmp/angular20-bootstrap-release-$release_id"
stage="$STAGING_ROOT/$release_id"

case "$work" in /var/tmp/angular20-bootstrap-release-*) ;; *) exit 2 ;; esac
case "$stage" in "$STAGING_ROOT"/*) ;; *) exit 2 ;; esac
[ ! -e "$work" ] && [ ! -e "$stage" ]

cleanup() {
  rm -rf --one-file-system -- "$work"
}
trap cleanup EXIT

install -d -m 0700 "$work/source"
curl --fail --location --retry 3 --connect-timeout 15 \
  "https://codeload.github.com/$REPOSITORY/tar.gz/$commit" \
  | tar -xz -C "$work/source" --strip-components=1

cd "$work/source"
npm ci --no-audit --no-fund
npm run build -- --base-href /workshop/
test -f dist/angular20/browser/index.html

npm --prefix server ci --no-audit --no-fund
npm --prefix server run build
npm --prefix server prune --omit=dev --no-audit --no-fund
test -f server/dist/main.js
chmod -R u=rwX,go=rX dist/angular20/browser

install -d -m 0755 "$stage/frontend" "$stage/backend"
rsync -a --delete dist/angular20/browser/ "$stage/frontend/"
rsync -a --delete server/dist/ "$stage/backend/dist/"
rsync -a --delete server/node_modules/ "$stage/backend/node_modules/"
install -m 0644 server/package.json server/package-lock.json "$stage/backend/"
printf '{"releaseId":"%s","commit":"%s","targets":"frontend,backend","createdAt":"%s"}\n' \
  "$release_id" "$commit" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" \
  > "$stage/release.json"
chown -R deploy:deploy "$stage"

/usr/local/sbin/angular20-release apply "$release_id" frontend,backend
echo "Angular20 bootstrap release completed: $release_id"
