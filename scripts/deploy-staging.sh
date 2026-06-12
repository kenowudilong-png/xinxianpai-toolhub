#!/usr/bin/env bash
set -euo pipefail
if [ "${ALLOW_VPS_DEPLOY:-0}" != "1" ]; then
  echo "deploy-staging.sh targets the VPS layout. Set ALLOW_VPS_DEPLOY=1 on the VPS to run it." >&2
  exit 1
fi
cd /opt/xinxianpai-toolhub
export PATH=/opt/xinxianpai-toolhub/runtime/node/bin:$PATH
set -a; source .env.production; set +a
bash scripts/backup-before-deploy.sh
pnpm build
nohup pnpm --filter @xinxianpai/platform start > /var/log/xinxianpai-toolhub/platform-staging.log 2>&1 &
echo $! > /var/log/xinxianpai-toolhub/platform-staging.pid
sleep 3
bash scripts/healthcheck.sh
