#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

USER_HOME="${HOME:-$(cd ~ && pwd)}"

if [ -d "$USER_HOME/.local/bin" ]; then export PATH="$USER_HOME/.local/bin:$PATH"; fi
if [ -d "$ROOT_DIR/runtime/node/bin" ]; then export PATH="$ROOT_DIR/runtime/node/bin:$PATH"; fi
if [ -d "$USER_HOME/.local/node-v20.19.0-darwin-arm64/bin" ]; then export PATH="$USER_HOME/.local/node-v20.19.0-darwin-arm64/bin:$PATH"; fi

set -a
LOCAL_ENV_FILE="${LOCAL_ENV_FILE:-$ROOT_DIR/.env.production}"
if [ -f "$LOCAL_ENV_FILE" ]; then
  source "$LOCAL_ENV_FILE"
else
  echo "Warning: $LOCAL_ENV_FILE not found; using safe local defaults." >&2
fi
set +a

export DATA_DIR=${DATA_DIR:-$ROOT_DIR/.local-data}
export LOG_DIR=${LOG_DIR:-$ROOT_DIR/.local-logs}
export PLATFORM_DB_PATH=${PLATFORM_DB_PATH:-$DATA_DIR/main.sqlite}
export HOST=127.0.0.1
export PORT=18085

exec node "$ROOT_DIR/apps/gip-team/dist-server/index.js"
