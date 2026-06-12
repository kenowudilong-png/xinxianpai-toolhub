# 验收清单

- [x] Logo 已上传并可通过 `/brand/logo-freshpi.png` 访问。
- [x] `/opt/xinxianpai-toolhub` 是唯一开发目录。
- [x] `/opt/freshpixxp/app` 未被覆盖。
- [x] `/var/lib/xinxianpai-toolhub/main.sqlite` 存在并可写。
- [x] 登录页接入 Logo、记住我、显隐密码、错误态。
- [x] 登录后布局为顶栏 + 左侧应用栏 + 右侧内容区。
- [x] 门户从 `tools` 表读取并支持搜索/空态。
- [x] `/tools/gip` 可用且无用户侧密钥设置。
- [x] 管理后台拆分为用户、接口配置、用量、工具四标签。
- [x] 接口配置按工具存 URL/Key/多模型，列表不回显密钥。
- [x] `scripts/check.sh` 通过构建和审计。
- [x] 旧 `18081` 服务仍可访问。
