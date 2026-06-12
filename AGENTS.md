## Project Rules

### VPS Scope

- Develop only on VPS `ssh root@8.138.203.173`.
- Main workdir is `/opt/xinxianpai-toolhub`; always `cd` there before work.
- Do not modify `/opt/freshpixxp/app`; it is rollback/reference only.
- Persistent data lives in `/var/lib/xinxianpai-toolhub` and must not be committed.
- Logs live in `/var/log/xinxianpai-toolhub`; backups live in `/var/backups/xinxianpai-toolhub`.
- Back up before deployment or Nginx changes.

### Product Goal

- Build 芯鲜派工具站: internal AI tool hub with unified login, portal, key proxy, isolated user data, and GIP-Team embedded at `/tools/gip`.
- Phase 1 delivers platform foundation plus GIP-Team integration.
- Keep the platform lightweight for 5 users and 5-10 tools.

### Hard Rules

- Work from `TASK.md` and `STATE.md`; do not invent extra product scope.
- After each completed step, update `STATE.md` and `LOG.md`.
- Never expose API keys to frontend code, responses, logs, or test snapshots.
- User business data must be isolated by tool ID and user ID.
- Do not directly overwrite Nginx main config; add `/etc/nginx/conf.d/xinxianpai-toolhub.conf` only after validation.
- New services run on side ports first; keep existing `18081` service available.

### Engineering Defaults

- TypeScript strict mode.
- Next.js full-stack platform.
- SQLite main DB plus per-user tool DB files.
- Local storage implementation with S3-compatible abstraction.
- Use `/opt/xinxianpai-toolhub/runtime/node/bin/node` if `node` is not in PATH.

### Verification

- Run the narrowest relevant check first, then `bash scripts/check.sh` when available.
- Run `bash scripts/audit-harness.sh` before claiming completion.
- If a failure repeats 3 times, write it as a blocker in `STATE.md` and stop.
