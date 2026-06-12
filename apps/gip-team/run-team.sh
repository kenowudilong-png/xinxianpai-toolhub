#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [ -d "$HOME/.local/bin" ]; then export PATH="$HOME/.local/bin:$PATH"; fi
if [ -d "$HOME/.local/node-v20.19.0-darwin-arm64/bin" ]; then export PATH="$HOME/.local/node-v20.19.0-darwin-arm64/bin:$PATH"; fi
if [ -d "$ROOT_DIR/runtime/node/bin" ]; then export PATH="$ROOT_DIR/runtime/node/bin:$PATH"; fi
export DATA_DIR=${DATA_DIR:-$ROOT_DIR/.local-data}
export PLATFORM_DB_PATH=${PLATFORM_DB_PATH:-$DATA_DIR/main.sqlite}
export HOST=${HOST:-127.0.0.1}
export PORT=${PORT:-18085}
cd "$ROOT_DIR/apps/gip-team"
exec node dist-server/index.js
