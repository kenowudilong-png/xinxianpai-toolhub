#!/usr/bin/env bash
set -euo pipefail

BACKUPS_ROOT="${XINXIANPAI_BACKUPS_ROOT:-/Users/mima0000/Documents/xinxianpai/backups}"
STAGING_DATA_ROOT="/Users/mima0000/Documents/xinxianpai/staging/data"
PROD_DATA_ROOT="${XINXIANPAI_PROD_DATA_ROOT:-/var/lib/xinxianpai-toolhub}"
EXECUTE=0
ENV_NAME=""
BACKUP_DIR=""

usage() {
  cat <<'USAGE'
Usage:
  scripts/rollback.sh --env staging|prod --backup <backup-dir> [--execute]

Default mode is dry-run. Dry-run prints the rollback plan only.
Execute mode restores SQLite backups after first creating a safety copy.
Production execute mode also requires CONFIRM_PROD_ROLLBACK=1.
USAGE
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --env)
      [ "$#" -ge 2 ] || die "--env requires staging or prod"
      ENV_NAME="$2"
      shift 2
      ;;
    --backup)
      [ "$#" -ge 2 ] || die "--backup requires a backup directory"
      BACKUP_DIR="$2"
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

[ -n "$BACKUP_DIR" ] || {
  usage
  die "--backup is required"
}

timestamp="$(date +%Y%m%d-%H%M%S)"
SAFETY_DIR="$BACKUPS_ROOT/$ENV_NAME/pre-rollback-$timestamp"
BACKUP_DATABASE_DIR="$BACKUP_DIR/databases"

backup_status="valid"
if [ ! -d "$BACKUP_DIR" ]; then
  backup_status="missing backup directory"
elif [ ! -f "$BACKUP_DIR/MANIFEST.md" ]; then
  backup_status="missing MANIFEST.md"
fi

if [ "$EXECUTE" -ne 1 ]; then
  cat <<PLAN
DRY RUN: rollback helper

Environment: $ENV_NAME
Data root: $DATA_ROOT
Backup directory: $BACKUP_DIR
Backup validation status: $backup_status
Pre-rollback safety copy: $SAFETY_DIR

Planned actions with --execute:
  - Validate the backup directory exists.
  - Validate MANIFEST.md exists.
  - Validate the data root is clear and exists.
  - Create a pre-rollback safety copy before overwriting any data.
  - Restore SQLite backup files from $BACKUP_DATABASE_DIR to $DATA_ROOT.

Production execute safeguard:
  - CONFIRM_PROD_ROLLBACK=1 is required for --env prod --execute.

No secrets, production deploys, service commands, or migrations will run.
PLAN
  exit 0
fi

if [ "$ENV_NAME" = "prod" ] && [ "${CONFIRM_PROD_ROLLBACK:-0}" != "1" ]; then
  die "Production rollback execute mode requires CONFIRM_PROD_ROLLBACK=1"
fi

[ "$backup_status" = "valid" ] || die "Backup is not valid: $backup_status"
[ -d "$DATA_ROOT" ] || die "Data root does not exist: $DATA_ROOT"
[ "$DATA_ROOT" != "/" ] || die "Refusing to use / as a data root"
[ -n "$DATA_ROOT" ] || die "Data root is empty"

mkdir -p "$SAFETY_DIR"
cp -a "$DATA_ROOT" "$SAFETY_DIR/data"

restore_count=0
if [ -d "$BACKUP_DATABASE_DIR" ] && [ -n "$(find "$BACKUP_DATABASE_DIR" -type f -print -quit)" ]; then
  while IFS= read -r -d '' backup_db; do
    rel_path="${backup_db#"$BACKUP_DATABASE_DIR"/}"
    restore_path="$DATA_ROOT/$rel_path"
    mkdir -p "$(dirname "$restore_path")"
    cp -p "$backup_db" "$restore_path"
    restore_count=$((restore_count + 1))
  done < <(find "$BACKUP_DATABASE_DIR" -type f -print0)
else
  echo "NO_DATABASES_IN_BACKUP"
fi

echo "Rollback completed for $ENV_NAME."
echo "Pre-rollback safety copy: $SAFETY_DIR/data"
echo "Restored database files: $restore_count"
echo "No services were started or restarted."
echo "No secrets, production deploys, or migrations were run."
