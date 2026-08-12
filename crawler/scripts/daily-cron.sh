#!/bin/bash
# A股情绪日报 - crontab 启动脚本
# 每天15:00执行（交易日收盘后：分析+资金流向+发邮件）
#
# crontab 配置:
#   0 15 * * 1-5 /root/projects/angular20/crawler/scripts/daily-cron.sh >> /root/projects/angular20/crawler/data/cron.log 2>&1

export HOME="/root"
export PATH="$HOME/.local/bin:$HOME/.qoder/bin/qodercli:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export QODER_PERSONAL_ACCESS_TOKEN="pt-QyvtSqza6xZBwzzjvWsVNlJx_019f6e96-4966-7eb7-bd24-00a9379be6a4"
# Qoder 模型：lite=免费, efficient≈0.3x, auto≈1.0x, Kimi-K3≈0.8x
export QODER_MODEL="${QODER_MODEL:-Kimi-K3}"

cd /root/projects/angular20

echo "=========================================="
echo "[$(TZ=Asia/Shanghai date '+%Y-%m-%d %H:%M:%S')] 开始执行"
echo "=========================================="

node crawler/daily-report.mjs

echo "[$(TZ=Asia/Shanghai date '+%Y-%m-%d %H:%M:%S')] 执行完毕"
echo ""
