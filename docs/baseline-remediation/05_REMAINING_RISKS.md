# Remaining Risks

## P0

No unresolved P0 risk is known from the four remediated baseline findings after local source verification. Production/runtime validation is still required before deployment.

## P1

| Risk | Status | Required Action |
|---|---|---|
| Existing production DB may already contain earlier announcements schema state | Not touched | Human-approved migration plan and backup/restore validation before production DB changes |
| GIP server build was not locally validated | Partially mitigated | Run CI or manually run `npm ci && npm run build:server` inside `apps/gip-team` in a safe environment |
| `apps/platform` remains as overlapping legacy/parallel app | Unresolved | Decide ownership: active app, reference app, or removal plan |
| Local `.env.production` may contain production OSS credentials | Documented only | Human decision on local/staging/prod env separation |
| GIP header trust boundary depends on loopback-only deployment | Not changed | Confirm service binding/reverse proxy strips spoofable headers before production |

## P2

| Risk | Status | Required Action |
|---|---|---|
| Placeholder tools `chat` and `kb` may be visible without real integrations | Not changed | Product decision to disable, label, or implement |
| Upload validation remains minimal in visible source | Not changed | Add MIME/content validation and tests in a later scoped task |
| Health endpoint still exposes `dataDir` and mutates a marker file | Not changed | Split public liveness and private readiness endpoints |
| `scripts/check.sh` remains broad and build-heavy | Improved but broad | Consider a smaller `check-pr.sh` if CI latency becomes a problem |

## Requires Human Approval

- Any production DB migration or repair.
- Any change to OSS bucket, object layout, or production credentials.
- Any production/staging service restart.
- Any removal of `apps/platform`.
- Any disabling/removal of seeded placeholder tools.

## Not Safe For Codex Yet

- Touching real DB contents.
- Running production or staging migrations.
- Calling OSS or external generation APIs.
- Refactoring auth/session/encryption/GIP generation flow without deeper tests and explicit approval.
