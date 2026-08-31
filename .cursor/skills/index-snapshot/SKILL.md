---
name: index-snapshot
description: >-
  Fetch current rise/fall for all project-tracked indices, boards, and ETFs.
  Use when the user asks for 指数涨跌, 指数情况, 指数快照, or current index quotes.
  Write a file and reply with the file path only — never paste or summarize the numbers.
---

# 指数涨跌快照

1. Run `node crawler/fetch-indices.mjs` from the repo root.
2. Reply with **only** the absolute path printed by the command.
3. Do not paste, summarize, or describe prices, percentages, or directions.
