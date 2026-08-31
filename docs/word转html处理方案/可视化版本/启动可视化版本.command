#!/bin/bash

set -u

visual_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$visual_dir" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "启动失败：未找到 Node.js。请先安装 Node.js 后重试。"
  read -r -p "按回车键关闭…"
  exit 1
fi

node "$visual_dir/server.js"
exit_code=$?

if [ "$exit_code" -ne 0 ]; then
  read -r -p "按回车键关闭…"
fi

exit "$exit_code"
