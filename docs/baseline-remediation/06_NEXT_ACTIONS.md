# Next Actions

| # | Action | Owner | Priority | Stop Condition |
|---|---|---|---|---|
| 1 | Review this branch and confirm the source-only fixes are acceptable | human | P0 | Any fix appears broader than intended |
| 2 | Let CI run the PR Check on the Mac mini runner | CI | P0 | Runner unavailable or CI reads production env |
| 3 | Validate GIP server build in CI after `apps/gip-team npm ci` | CI | P0 | Build fails after dependencies install |
| 4 | Create a production DB migration plan for announcements schema if needed | human / Hermes | P1 | Requires touching real DB without backup |
| 5 | Decide whether `apps/platform` is legacy/reference or should be retired later | human | P1 | Ownership remains unclear |
| 6 | Define local/staging/prod env separation policy | human | P1 | Policy requires production secrets in local checks |
| 7 | Add a temporary-DB migration smoke test that never touches real data | Codex | P1 | Test would require real DB paths |
| 8 | Split public liveness from private readiness health checks | Codex | P2 | Reverse proxy depends on current response shape |
| 9 | Decide whether placeholder tools should be disabled until real integrations exist | human | P2 | Product wants placeholders visible |
| 10 | Add upload validation tests for GIP file handling | Codex | P2 | Tests require real OSS or production uploads |

## Recommended Human Decision

Approve or reject this branch as a baseline safety-rail branch. Do not treat it as production-ready until CI passes and a human-owned production DB/env separation plan exists.
