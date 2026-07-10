#!/bin/bash
# ============================================
# 数据库自动备份脚本
# 每天凌晨 2:00 执行，保留最近 7 天备份
# ============================================

BACKUP_DIR="/root/backups"
DB_FILE="/var/lib/mydata/app.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/app_db_${DATE}.db"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 复制数据库文件（SQLite 支持热备份，可直接 cp）
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_FILE"
    
    # 压缩备份文件
    gzip "$BACKUP_FILE"
    
    echo "[$(date)] 备份成功: ${BACKUP_FILE}.gz ($(du -h ${BACKUP_FILE}.gz | cut -f1))"
else
    echo "[$(date)] 错误: 数据库文件不存在 $DB_FILE"
    exit 1
fi

# 清理 7 天前的旧备份
find "$BACKUP_DIR" -name "app_db_*.gz" -mtime +7 -delete
echo "[$(date)] 已清理 7 天前的旧备份"
