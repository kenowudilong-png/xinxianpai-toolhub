#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
if [ -d "$HOME/.local/bin" ]; then export PATH="$HOME/.local/bin:$PATH"; fi
if [ -d "$HOME/.local/node-v20.19.0-darwin-arm64/bin" ]; then export PATH="$HOME/.local/node-v20.19.0-darwin-arm64/bin:$PATH"; fi
if [ -d "$ROOT_DIR/runtime/node/bin" ]; then export PATH="$ROOT_DIR/runtime/node/bin:$PATH"; fi
export PYTHON=${PYTHON:-$(command -v python3 || true)}
TEST_DATA_DIR=/tmp/xinxianpai-toolhub-e2e
TEST_LOG_DIR=/tmp/xinxianpai-toolhub-e2e-logs
TEST_PORT=${TEST_PORT:-18084}
rm -rf "$TEST_DATA_DIR" "$TEST_LOG_DIR"
mkdir -p "$TEST_DATA_DIR" "$TEST_LOG_DIR"
set -a
source .env.production
set +a
export DATA_DIR="$TEST_DATA_DIR"
export LOG_DIR="$TEST_LOG_DIR"
export PORT="$TEST_PORT"
export E2E_BASE_URL="http://127.0.0.1:$TEST_PORT"
pnpm --filter web build >/tmp/xinxianpai-e2e-build.log
pnpm --filter web start > "$TEST_LOG_DIR/web-e2e.log" 2>&1 &
PID=$!
cleanup(){ kill "$PID" 2>/dev/null || true; rm -rf "$TEST_DATA_DIR" "$TEST_LOG_DIR"; }
trap cleanup EXIT
for _ in $(seq 1 40); do
  if curl -fsS "$E2E_BASE_URL/api/health" >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS "$E2E_BASE_URL/api/health" >/dev/null
pnpm --filter web exec playwright test --config playwright.config.ts
