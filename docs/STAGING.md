# Staging Operations

This project has a local Mac mini staging foundation for Xinxianpai Toolhub. It is intentionally conservative: staging can be prepared and dry-run validated without starting services, reading secrets, running migrations, or touching production.

## Paths

Staging root:

```text
/Users/mima0000/Documents/xinxianpai/staging
```

Toolhub staging worktree:

```text
/Users/mima0000/Documents/xinxianpai/staging/toolhub
```

Runtime folders:

```text
/Users/mima0000/Documents/xinxianpai/staging/data
/Users/mima0000/Documents/xinxianpai/staging/logs
/Users/mima0000/Documents/xinxianpai/staging/runtime
/Users/mima0000/Documents/xinxianpai/staging/env
```

## Environment Separation

Real staging environment values are not stored in Git. The staging environment file must be created manually later by an authorized operator.

Staging must use separate database paths, upload paths, runtime paths, and object storage configuration from production. Do not copy production environment files into staging.

Recommended OSS separation:

```text
staging/
```

Use a dedicated staging OSS prefix, bucket policy, or credentials so staging uploads and generated objects cannot mix with production objects.

## Deploy Dry Run

The staging deploy helper defaults to dry-run:

```bash
scripts/deploy-staging.sh --ref HEAD
```

Dry-run mode prints the current staging branch, current staging commit, target ref, and the Git commands that would run in execute mode.

Dry-run mode does not update the staging worktree, start services, read secrets, run migrations, or touch production.

## Deploy Execute Mode

Execute mode is available only for updating the staging worktree:

```bash
scripts/deploy-staging.sh --ref <reviewed-ref> --execute
```

Execute mode fetches origin, checks out the `staging` branch, and fast-forwards it to the requested ref if the worktree is clean.

Execute mode still does not start or restart services, read secrets, run migrations, or deploy production.

## Not Automated Yet

The following are intentionally not automated:

- Staging environment creation.
- Staging service start or restart.
- Staging smoke tests.
- Staging database migrations.
- Production deployment.
- Production backup or rollback execution from GitHub Actions.
- OSS credential or bucket provisioning.
