#!/bin/bash
# Scholar's Tea - 自动版本同步脚本
# 功能：检测更改并自动推送到 GitHub
# 使用：./scripts/auto-sync.sh

set -e

# Resolve project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

APP_DIR="${APP_DIR:-$PROJECT_ROOT}"
GITHUB_REPO="https://github.com/photonics-dhl/Scholar-s-tea"

# GitHub 配置（从 .env 环境变量读取）
GITHUB_REPO="https://github.com/photonics-dhl/Scholar-s-tea"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

mkdir -p "$APP_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "开始版本同步"
log "=========================================="

cd "$APP_DIR"

# 检查是否有未提交的更改
if git diff --quiet && git diff --cached --quiet; then
    log "没有检测到更改，跳过同步"
    exit 0
fi

# 显示更改状态
log "检测到更改："
git status --short | tee -a "$LOG_FILE"

# 添加所有更改（除了 .env 和其他敏感文件）
log "暂存更改..."
git add .

# 创建提交
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
log "创建提交..."
git commit -m "Auto-sync: $TIMESTAMP" || log "提交失败（可能没有更改）"

# 配置远程（使用 token 认证）
REMOTE_URL="$GITHUB_REPO.git"
git remote set-url origin "$REMOTE_URL"
git config credential.helper store

# 使用 token 认证推送
log "推送到 GitHub..."
export GIT_ASKPASS=/bin/true
git push origin develop || {
    if [ -n "$GITHUB_TOKEN" ]; then
        log "推送失败，尝试使用 token..."
        git push "https://$GITHUB_TOKEN@github.com/photonics-dhl/Scholar-s-tea.git" develop
    else
        log "推送失败：未配置 GITHUB_TOKEN"
    fi
}

log "同步完成"
log "=========================================="
log ""
