#!/bin/bash
# Scholar's Tea - Server Startup Script
# Usage: ./scripts/start.sh

set -e

# Resolve project root (scripts/ -> project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

APP_DIR="${APP_DIR:-$PROJECT_ROOT}"
PG_DIR="${PG_DIR:-${DATA_DIR:-/data/home/zju321/pgdata}}"
LOG_FILE="$APP_DIR/logs/startup.log"

mkdir -p "$APP_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Starting Scholar's Tea Services"
log "=========================================="

# Start PostgreSQL if not running
if ! pgrep -f "postgres -D $PG_DIR" > /dev/null; then
    log "Starting PostgreSQL..."
    pg_ctl -D "$PG_DIR" -l "$PG_DIR/logfile" start
    sleep 3
    log "PostgreSQL started."
else
    log "PostgreSQL already running."
fi

# Navigate to app directory
cd "$APP_DIR"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    log "Installing dependencies..."
    npm install
fi

# Build the Next.js app if needed
if [ ! -d ".next" ]; then
    log "Building Next.js app..."
    npm run build
fi

# Start with PM2
log "Starting application with PM2..."
pm2 delete scholars-tea 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

log "Application started."
log ""
log "Useful commands:"
log "  pm2 status          - Check app status"
log "  pm2 logs scholars-tea  - View logs"
log "  pm2 restart scholars-tea - Restart app"
log ""
log "=========================================="
