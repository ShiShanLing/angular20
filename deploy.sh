#!/usr/bin/env bash
# 兼容入口：统一调用安全的本地发布脚本。
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$ROOT_DIR/deploy/publish.sh" "$@"
