# Release Process

Xinxianpai Toolhub production release automation is not enabled. The current process is a gated foundation for future staging and release operations.

## Required Gates

Before a change can be considered for release:

- A pull request is required.
- PR Check must pass.
- Review is required.
- Staging deploy dry-run is required.
- Backup is required before production.
- A rollback plan is required before production.
- Production release remains disabled until explicitly approved and implemented in a later infrastructure phase.

## Staging Gate

Run the staging deploy helper in dry-run mode:

```bash
scripts/deploy-staging.sh --ref <reviewed-ref>
```

The dry-run output must identify the current staging branch, current staging commit, target ref, and planned Git commands.

Real staging service deployment is not automated yet.

## Backup Gate

Run backup dry-run for the target environment first:

```bash
scripts/backup.sh --env staging
scripts/backup.sh --env prod
```

Before production release is enabled in a future phase, a reviewed production backup command must be run and its manifest retained outside Git.

## Rollback Gate

Prepare a rollback command before production release:

```bash
scripts/rollback.sh --env prod --backup <backup-dir>
```

The rollback plan must identify the backup directory, data root, pre-rollback safety copy path, and production confirmation requirement.

## Production Release Manifest Gate

Production release must be traceable to an approved Git commit. Before any future production deployment is enabled, generate a read-only release manifest from the approved source tree:

```bash
scripts/release-manifest.sh --env prod --ref <approved-ref> --deploy-root /opt/xinxianpai-toolhub
```

The script prints the manifest to stdout and does not write to the deployment root, read env files, read database contents, deploy, restart services, or modify Git. Copying a manifest into production is a separate release step and requires explicit Keno approval.

A production deployment is not considered release-ready unless the deployed runtime has a manifest whose `Commit` value matches the approved PR/release commit.

## Tag Strategy

Use immutable tags for baseline and release checkpoints.

Current baseline tags:

- `v0.1-factory-base` for the factory baseline.
- `v0.2-baseline-safety-rails` for the Toolhub baseline safety rails.

Do not move existing tags. Do not force-push tags.

Future production tags should be created only after review, successful checks, staging validation, backup readiness, and explicit release approval.
