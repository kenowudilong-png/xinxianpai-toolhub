# CI/CD Foundation

This repository has a safe GitHub Actions foundation for pull request validation and future deployment automation.

## PR Check

The PR Check workflow runs on pull requests targeting `main` or `staging`. It uses the Mac mini self-hosted runner and performs repository validation without deploying, restarting services, running database migrations, or reading secrets.

The workflow:

- checks out the repository
- uses Node.js 20.19.0
- installs pnpm 9.15.4
- runs `pnpm install --frozen-lockfile`
- runs `pnpm --filter web typecheck` when `apps/web` exists
- runs `npm run build:server` in `apps/gip-team` when `build:server` exists
- runs `scripts/audit-integrity.sh` when present
- runs `scripts/check.sh` when present

Optional checks are skipped with clear messages when their files or scripts do not exist.

## Staging Workflow

`Deploy Staging` is currently a dry-run workflow only. It is triggered manually with `workflow_dispatch`, checks out the repository, prints the current commit SHA, lists required future gates, and exits successfully without performing a deployment.

It does not deploy, restart services, read secrets, run migrations, or modify staging or production runtime files.

Future requirements before enabling real staging deployment:

- staging runtime path
- staging environment strategy
- smoke tests
- reviewed deploy script

## Production Workflow

`Deploy Production` is currently a dry-run workflow only. It is triggered manually with `workflow_dispatch`, checks out the repository, prints the current commit SHA, lists required production gates, and exits successfully without performing a deployment.

Production deploy is not enabled yet.

Future requirements before enabling real production deployment:

- backup script
- rollback script
- release notes
- GitHub environment protection
- human approval
- passing PR Check
- staging smoke test

## Runner

Expected self-hosted runner labels:

- `self-hosted`
- `macOS`
- `ARM64`
- `toolhub`
- `macmini`

Runner name:

- `macmini-toolhub-runner`

To verify the runner on the Mac mini:

```bash
cd /Users/mima0000/Documents/xinxianpai/github-runner/toolhub-runner
./svc.sh status
```

GitHub should show the runner as idle when no workflow job is running.

## Smoke PR

To create a smoke PR for validating PR Check:

```bash
git checkout main
git pull
git checkout -b test/pr-check-smoke
printf '%s\n' '# PR Check Smoke Test' '' 'This branch exists only to verify that the PR Check workflow runs on the Mac mini self-hosted runner.' '' 'It should not be merged unless explicitly approved.' > docs/PR_CHECK_SMOKE.md
git add docs/PR_CHECK_SMOKE.md
git commit -m "test: trigger PR check"
git push -u origin test/pr-check-smoke
```

Then open a pull request from `test/pr-check-smoke` to `main` and confirm the PR Check workflow runs on `macmini-toolhub-runner`.
