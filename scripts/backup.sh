#!/usr/bin/env bash
set -euo pipefail

BACKUPS_ROOT="/Users/mima0000/Documents/xinxianpai/backups"
STAGING_DATA_ROOT="/Users/mima0000/Documents/xinxianpai/staging/data"
PROD_DATA_ROOT="${XINXIANPAI_PROD_DATA_ROOT:-/Users/mima0000/Documents/xinxianpai/prod/data}"
EXECUTE=0
ENV_NAME=""

usage() {
  cat <<'USAGE'
Usage:
  scripts/backup.sh --env staging|prod [--execute]

Default mode is dry-run. Dry-run prints the backup plan only.
Execute mode creates a timestamped backup directory and writes MANIFEST.md.
Production execute mode also requires CONFIRM_PROD_BACKUP=1.
USAGE
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

reject_single_quote() {
  case "$1" in
    *"'"*) die "Path contains a single quote and cannot be passed safely to sqlite3: $1" ;;
  esac
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --env)
      [ "$#" -ge 2 ] || die "--env requires staging or prod"
      ENV_NAME="$2"
      shift 2
      ;;
    --execute)
      EXECUTE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

case "$ENV_NAME" in
  staging)
    DATA_ROOT="$STAGING_DATA_ROOT"
    ;;
  prod)
    DATA_ROOT="$PROD_DATA_ROOT"
    ;;
  *)
    usage
    die "--env must be staging or prod"
    ;;
esac

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
timestamp="$(date +%Y%m%d-%H%M%S)"
DEST_DIR="$BACKUPS_ROOT/$ENV_NAME/$timestamp"

if [ "$EXECUTE" -ne 1 ]; then
  cat <<PLAN
DRY RUN: backup helper

Environment: $ENV_NAME
Data root: $DATA_ROOT
Backup destination: $DEST_DIR

Planned actions with --execute:
  - Validate the data root exists.
  - Create the backup destination.
  - Find SQLite files under the data root.
  - Use sqlite3 .backup for each SQLite file found.
  - Copy repository config templates and docs only.
  - Write MANIFEST.md.
  - Delete no old backups.

Production execute safeguard:
  - CONFIRM_PROD_BACKUP=1 is required for --env prod --execute.

No secrets, environment files with real values, production deploys, service commands, or migrations will run.
PLAN
  exit 0
fi

if [ "$ENV_NAME" = "prod" ] && [ "${CONFIRM_PROD_BACKUP:-0}" != "1" ]; then
  die "Production backup execute mode requires CONFIRM_PROD_BACKUP=1"
fi

[ -d "$DATA_ROOT" ] || die "Data root does not exist: $DATA_ROOT"
[ "$DATA_ROOT" != "/" ] || die "Refusing to use / as a data root"

command -v sqlite3 >/dev/null 2>&1 || die "sqlite3 is required for execute mode"

mkdir -p "$DEST_DIR/databases" "$DEST_DIR/reference/docs"

db_list="$(mktemp)"
trap 'rm -f "$db_list"' EXIT

find "$DATA_ROOT" -type f \( -name '*.sqlite' -o -name '*.sqlite3' -o -name '*.db' \) -print > "$db_list"

db_count=0
if [ -s "$db_list" ]; then
  while IFS= read -r db_path; do
    rel_path="${db_path#"$DATA_ROOT"/}"
    backup_db="$DEST_DIR/databases/$rel_path"
    mkdir -p "$(dirname "$backup_db")"
    reject_single_quote "$backup_db"
    sqlite3 "$db_path" ".backup '$backup_db'"
    db_count=$((db_count + 1))
  done < "$db_list"
else
  echo "NO_DATABASES_FOUND"
fi

if [ -f "$REPO_ROOT/.env.example" ]; then
  cp "$REPO_ROOT/.env.example" "$DEST_DIR/reference/.env.example"
fi

if [ -d "$REPO_ROOT/docs" ]; then
  find "$REPO_ROOT/docs" -maxdepth 1 -type f -name '*.md' -exec cp {} "$DEST_DIR/reference/docs/" \;
fi

cat > "$DEST_DIR/MANIFEST.md" <<MANIFEST
# Xinxianpai Toolhub Backup Manifest

Timestamp: $timestamp

Environment: $ENV_NAME

Data root: $DATA_ROOT

Backup destination: $DEST_DIR

SQLite database count: $db_count

Database backup method: sqlite3 .backup

Reference files: repository docs and config templates only

Secrets: not read, not copied, not printed

Old backups deleted: no

MANIFEST

if [ "$db_count" -eq 0 ]; then
  echo "NO_DATABASES_FOUND" >> "$DEST_DIR/MANIFEST.md"
fi

echo "Backup completed: $DEST_DIR"
echo "SQLite database count: $db_count"
echo "MANIFEST.md written."
