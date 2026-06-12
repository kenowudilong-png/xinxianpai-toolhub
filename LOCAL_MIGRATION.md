# Local Migration

This copy was migrated from `root@8.138.203.173`.

- Snapshot path is recorded in `.server-snapshot-path`.
- Local data lives in `.local-data`.
- Local logs live in `.local-logs`.
- `STORAGE_DRIVER=oss` is intentionally preserved.
- OSS object keys keep the production rule: `gip/<userId>/<relativePath>`.

Important: this local copy uses the production OSS credentials from `.env.production`.
Generating, uploading, or deleting images can affect the same OSS bucket used by the VPS.

Useful commands:

```bash
export PATH="$HOME/.local/node-v20.19.0-darwin-arm64/bin:$HOME/.local/bin:$PATH"
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
(cd apps/gip-team && npm install && npm run build:all)
bash scripts/start-local.sh
bash scripts/stop-local.sh
```

`scripts/start-local.sh` uses detached macOS `screen` sessions:

- `xinxianpai-toolhub-gip`
- `xinxianpai-toolhub-web`

They can be inspected with `screen -ls` and stopped with `bash scripts/stop-local.sh`.
The stop script also unloads old local LaunchAgents if they exist and clears project-owned
listeners on ports `18083` and `18085`.
