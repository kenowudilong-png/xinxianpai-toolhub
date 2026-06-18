#!/usr/bin/env bash
set -euo pipefail

WEB_PORT="${PORT:-18083}"
GIP_PORT="${GIP_PORT:-18085}"
WEB_ORIGIN="http://127.0.0.1:${WEB_PORT}"
GIP_ORIGIN="http://127.0.0.1:${GIP_PORT}"

check_json_endpoint() {
  local name="$1"
  local url="$2"
  local body
  body="$(curl -fsS "$url")"
  if [ -z "$body" ]; then
    echo "FAIL $name empty response" >&2
    exit 1
  fi
  printf 'PASS %s %s\n' "$name" "$body"
}

check_status() {
  local name="$1"
  local url="$2"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$url")"
  case "$code" in
    200|301|302|307|308)
      printf 'PASS %s HTTP %s\n' "$name" "$code"
      ;;
    *)
      printf 'FAIL %s HTTP %s\n' "$name" "$code" >&2
      exit 1
      ;;
  esac
}

check_json_endpoint "web health" "$WEB_ORIGIN/api/health"
check_json_endpoint "gip health" "$GIP_ORIGIN/api/health"
check_status "web root" "$WEB_ORIGIN/"

echo "PASS local smoke complete"
