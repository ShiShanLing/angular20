#!/usr/bin/env bash
# 兼容旧用法：./deploy.sh → 调用全量部署脚本
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$ROOT_DIR/scripts/deploy-full.sh" "$@"
