# Backup And Rollback

This document describes the first safe backup and rollback foundation for Xinxianpai Toolhub. The scripts are dry-run by default and are designed to avoid secrets, deployments, service restarts, migrations, and production changes unless explicit local safeguards are provided.

## Backup Strategy

Use the backup helper in dry-run mode first:

```bash
scripts/backup.sh --env staging
scripts/backup.sh --env prod
```

Execute mode creates a timestamped backup directory:

```text
/Users/mima0000/Documents/xinxianpai/backups/<env>/<timestamp>/
```

The script writes `MANIFEST.md` for every execute-mode backup. If no SQLite databases are found, it reports `NO_DATABASES_FOUND` and still writes the manifest.

The script does not delete old backups.

## SQLite Backup Method

When SQLite database files are found in the configured data path, the backup helper uses:

```text
sqlite3 .backup
```

The helper does not query application tables. It only asks SQLite to create a database backup file.

## Secret Handling

Secrets are not backed up to Git. The backup helper does not read `.env`, `.env.production`, API keys, app secrets, JWT secrets, OSS credentials, private keys, or generated environment files.

Only config templates and documentation may be copied as reference material.

## Staging And Production Safeguards

Staging execute mode may run when the staging data path exists and the operator intentionally passes `--execute`.

Production backup execute mode requires:

```bash
CONFIRM_PROD_BACKUP=1 scripts/backup.sh --env prod --execute
```

Production rollback execute mode requires:

```bash
CONFIRM_PROD_ROLLBACK=1 scripts/rollback.sh --env prod --backup <backup-dir> --execute
```

Production deploys are not enabled by these scripts.

## Rollback Strategy

Use rollback dry-run first:

```bash
scripts/rollback.sh --env staging --backup <backup-dir>
```

Rollback execute mode validates the backup directory and requires `MANIFEST.md`. It creates a pre-rollback safety copy before overwriting any current data.

Rollback scripts do not start services, restart services, deploy production, read secrets, or run migrations.

## Restore Rehearsal

Before any real production release, rehearse backup and rollback on staging with representative non-production data. Record:

- Backup directory.
- Manifest contents.
- Restore command.
- Validation result.
- Any manual recovery steps.
