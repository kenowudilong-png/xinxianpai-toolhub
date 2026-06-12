#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

USER_HOME="${HOME:-$(cd ~ && pwd)}"

if [ -d "$USER_HOME/.local/bin" ]; then export PATH="$USER_HOME/.local/bin:$PATH"; fi
if [ -d "$ROOT_DIR/runtime/node/bin" ]; then export PATH="$ROOT_DIR/runtime/node/bin:$PATH"; fi
if [ -d "$USER_HOME/.local/node-v20.19.0-darwin-arm64/bin" ]; then export PATH="$USER_HOME/.local/node-v20.19.0-darwin-arm64/bin:$PATH"; fi

set -a
source .env.production
set +a

export DATA_DIR=${DATA_DIR:-$ROOT_DIR/.local-data}
export LOG_DIR=${LOG_DIR:-$ROOT_DIR/.local-logs}
export PLATFORM_DB_PATH=${PLATFORM_DB_PATH:-$DATA_DIR/main.sqlite}
export GIP_INTERNAL_ORIGIN=${GIP_INTERNAL_ORIGIN:-http://127.0.0.1:18085}
export PORT=${PORT:-18083}

cd "$ROOT_DIR/apps/web"
exec "$ROOT_DIR/apps/web/node_modules/.bin/next" start -H 0.0.0.0 -p "$PORT"
