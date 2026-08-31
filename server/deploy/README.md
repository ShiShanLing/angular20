# Angular20 无常驻源码自动发布

## 目标

服务器不再保存 Git 工作副本。代码只在本地和 GitHub 维护；每次发布时，服务器在隔离临时目录中获取 GitHub Actions 指定的完整提交号，使用无特权账号构建，原子替换生产文件，健康检查通过后删除临时源码。

## 发布结构

- Nest 后端继续使用 `angular20` 低权限账号，并保留 `NoNewPrivileges=true`。
- 部署接口验证 `X-Deploy-Token` 和 `X-Deploy-Commit`，写入请求文件并返回 `runId`，不执行 `sudo`。
- `angular20-deploy.path` 监听请求文件，由 systemd 启动 root 管理的固定 Worker。
- Worker 本身安装在 `/usr/local/lib/angular20-deploy/worker.sh`，不可由应用账号修改。
- Git 获取、`npm ci` 和构建均由无特权账号 `angular20-build` 执行。
- root 只负责原子替换 `/var/www/projects/angular20`、`/opt/angular20-server` 和重启 `nest-server.service`。
- GitHub Actions 轮询运行状态；只有健康检查成功并返回 `success` 才算发布成功。

生产运行数据仍位于 `/var/lib/mydata` 和 `/var/www/uploads`，不在发布替换范围内。后端环境变量继续使用 `/etc/angular20-server.env`。

## 首次安装或修复

把仓库临时下载到服务器后，以 root 执行：

```bash
bash server/deploy/install-angular20-deploy.sh FULL_40_CHARACTER_COMMIT_SHA
```

安装器会：

1. 创建无登录权限的 `angular20-build` 构建账号；
2. 安装 root 所有的 Worker 和 systemd 单元；
3. 创建请求、状态和备份目录；
4. 更新 `/etc/angular20-server.env`；
5. 排队部署指定提交，以便把支持 `runId` 的后端首次发布上线。

部署进度：

```bash
systemctl status angular20-deploy.service --no-pager
tail -n 200 /var/log/angular20-deploy.log
```

## 发布和回滚

每次构建使用 `/var/tmp/angular20-deploy-build/<runId>/`，结束后自动删除。生产目录切换前会保留旧网页和后端；健康检查失败会立即回滚。成功版本备份位于 `/var/lib/angular20-deploy/backups/`，默认保留最近 3 份。

不再使用或创建 `/root/projects/angular20`，旧的 `scripts/deploy-full.sh` 也不属于这条生产发布链路。
