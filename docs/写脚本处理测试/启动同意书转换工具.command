#!/bin/bash

set -u

TOOL_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$TOOL_DIR" || exit 1

python3 - <<'PY'
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import quote
import os
import webbrowser

HOST = "127.0.0.1"
PAGE = "同意书HTML转TXT工具.html"

server = ThreadingHTTPServer((HOST, 0), SimpleHTTPRequestHandler)
port = server.server_address[1]
url = f"http://{HOST}:{port}/{quote(PAGE)}"

print("同意书转换工具已启动：")
print(url)
print("关闭此窗口或按 Control+C 可停止本地服务。")
webbrowser.open(url)

try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\n本地服务已停止。")
finally:
    server.server_close()
PY
