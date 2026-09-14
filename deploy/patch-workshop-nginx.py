#!/usr/bin/env python3
"""Replace public /angular20 nginx locations with /workshop. Transform is hardcoded."""
from __future__ import annotations

from pathlib import Path
import re

TARGETS = [
    Path("/etc/nginx/snippets/hello-agent-routes.conf"),
    Path("/opt/hello-agent/deploy/hello-agent-routes.nginx"),
    Path("/opt/hello-agent/deploy/hello-agent.nginx"),
]


def transform(text: str) -> str:
    updated = text
    updated = updated.replace("location = /angular20", "location = /workshop")
    updated = updated.replace("return 301 /angular20/;", "return 301 /workshop/;")
    updated = updated.replace("location /angular20/api/", "location /workshop/api/")
    updated = updated.replace("location /angular20/uploads/", "location /workshop/uploads/")
    updated = re.sub(r"location /angular20/ \{", "location /workshop/ {", updated)
    updated = updated.replace(
        "try_files $uri $uri/ /angular20/index.html;",
        "try_files $uri $uri/ /workshop/index.html;",
    )
    return updated


def main() -> int:
    changed = False
    for path in TARGETS:
        if not path.is_file():
            continue
        original = path.read_text(encoding="utf-8")
        updated = transform(original)
        if updated == original:
            continue
        path.write_text(updated, encoding="utf-8")
        changed = True
        print(f"patched {path}")
    print("CHANGED" if changed else "UNCHANGED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
