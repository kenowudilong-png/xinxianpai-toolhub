# Baseline Remediation Scope

## Objective

Run a controlled remediation sprint for the Xinxianpai Toolhub baseline findings without touching secrets, production data, staging data, live services, or deployment state.

## Repository

- Toolhub: `/Users/mima0000/Documents/xinxianpai/toolhub/xinxianpai-toolhub`
- Branch: `fix/baseline-safety-rails`

## In Scope

- Re-verify baseline findings using source, package metadata, scripts, docs, and git state.
- Apply low-risk source-only fixes for route/package/schema/check blockers.
- Add documentation under `docs/baseline-remediation/`.
- Run allowed local verification commands that do not require production secrets or live services.
- Commit safe changes to the remediation branch.

## Out Of Scope

- Production deployment.
- Service start/stop/restart.
- Real database migrations or database reads.
- External API or OSS calls.
- Reading `.env`, `.env.production`, secret files, private keys, credentials, user data, logs, backups, prod data, or staging data.
- Broad refactors of auth, encryption, OSS key layout, GIP generation flow, or runtime data paths.

## Safety Confirmation

This sprint is intended to improve baseline safety rails and build readiness. Any fix requiring secrets, real DB contents, production data, or live runtime access must be documented as a follow-up instead of implemented here.
