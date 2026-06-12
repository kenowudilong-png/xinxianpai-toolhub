#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%Y%m%d-%H%M%S)
mkdir -p /var/backups/xinxianpai-toolhub/deploy
tar -czf "/var/backups/xinxianpai-toolhub/deploy/workdir-${TS}.tar.gz" -C /opt xinxianpai-toolhub --exclude node_modules --exclude .next || true
tar -czf "/var/backups/xinxianpai-toolhub/deploy/data-${TS}.tar.gz" -C /var/lib xinxianpai-toolhub || true
tar -czf "/var/backups/xinxianpai-toolhub/deploy/nginx-${TS}.tar.gz" -C /etc nginx || true
ls -lh /var/backups/xinxianpai-toolhub/deploy | tail
