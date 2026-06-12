# 技术决策清单

- 开发位置：VPS `root@8.138.203.173`。
- 工作目录：`/opt/xinxianpai-toolhub`。
- 现有服务：`/opt/freshpixxp/app` + `18081` 只读保留。
- 技术栈：Next.js 全栈 + TypeScript strict + SQLite。
- 包管理：pnpm workspace。
- Node：优先 `/opt/xinxianpai-toolhub/runtime/node/bin/node`，版本 v20.19.0。
- 域名策略：同主域子路径，GIP 挂载 `/tools/gip`。
- 数据目录：`/var/lib/xinxianpai-toolhub`。
- 日志目录：`/var/log/xinxianpai-toolhub`。
- 备份目录：`/var/backups/xinxianpai-toolhub`。
- 存储：一期本地文件，代码保留 S3 兼容抽象。
- 部署：旁路端口 `18083`，验证后再写独立 Nginx conf。
