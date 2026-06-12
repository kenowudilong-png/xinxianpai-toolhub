#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
if [ -d "$HOME/.local/bin" ]; then export PATH="$HOME/.local/bin:$PATH"; fi
if [ -d "$HOME/.local/node-v20.19.0-darwin-arm64/bin" ]; then export PATH="$HOME/.local/node-v20.19.0-darwin-arm64/bin:$PATH"; fi
if [ -d "$ROOT_DIR/runtime/node/bin" ]; then export PATH="$ROOT_DIR/runtime/node/bin:$PATH"; fi
set -a
source .env.production
set +a
mkdir -p "${LOG_DIR:-$ROOT_DIR/.local-logs}"
export PORT=${PORT:-18083}
if [ -f "${LOG_DIR:-$ROOT_DIR/.local-logs}/platform-staging.pid" ]; then kill $(cat "${LOG_DIR:-$ROOT_DIR/.local-logs}/platform-staging.pid") 2>/dev/null || true; fi
pkill -f "next start" 2>/dev/null || true
nohup pnpm --filter web start > "${LOG_DIR:-$ROOT_DIR/.local-logs}/web-staging.log" 2>&1 &
echo $! > "${LOG_DIR:-$ROOT_DIR/.local-logs}/platform-staging.pid"
