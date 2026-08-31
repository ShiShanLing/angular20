# Angular20 安全发布说明

生产环境不保存 Git 仓库，也不接受公网部署 webhook。代码只在本地修改和构建，通过 SSH 普通账号 `deploy` 上传到隔离暂存目录，再由 root 所有且不可被 `deploy` 修改的固定发布工具完成原子切换、健康检查和失败回滚。

## 首次安装服务器权限

在服务器控制台中以 root 运行一次：

```bash
bash /path/to/project/deploy/install-deploy-access.sh
```

安装器会创建受限 sudo 规则、安装加固后的 `nest-server.service`，并停用旧的 webhook Worker。它不会删除 `/var/lib/mydata`、`/var/www/uploads` 或数据库。

## 日常发布

本机 SSH 别名 `baidu-bcc` 必须连接普通账号 `deploy`。发布时必须明确目标：

```sshconfig
Host baidu-bcc
  HostName 106.13.175.227
  User deploy
  Port 22022
  IdentityFile ~/.ssh/baidu_bcc_codex
  IdentitiesOnly yes
```

生产服务器同时保留 22 和 22022；当前发布通道使用 22022，以避开本地网络或代理线路对 22 端口的限制。两个端口都必须保持公钥专用登录，并由 Fail2ban 保护。

```bash
./deploy/publish.sh publish --targets frontend
./deploy/publish.sh publish --targets backend
./deploy/publish.sh publish --targets frontend,backend
```

脚本默认拒绝发布未提交的工作区。仅在明确审查过本地修改后才使用 `--allow-dirty`；只做构建和连接检查可加 `--dry-run`。

服务器端固定边界：

- 静态站点：`/var/www/projects/angular20/`
- 后端程序：`/opt/angular20-server/`
- 上传文件：`/var/www/uploads/`（发布绝不覆盖）
- 数据库及运行数据：`/var/lib/mydata/`（发布绝不覆盖）
- 暂存目录：`/var/lib/angular20-deploy/staging/`
- 回滚快照：`/var/lib/angular20-deploy/releases/`（保留最近 3 次）

`deploy` 不能执行任意 root 命令，只能调用 `/usr/local/sbin/angular20-release apply ...`。后端继续以无登录权限的 `angular20` 账号运行，并由 systemd 限制文件系统写入范围。

## 首次恢复或 SSH 暂不可用

只有首次安装、正式目录损坏且普通 SSH 上传通道暂不可用时，才能从服务器控制台运行：

```bash
bash deploy/bootstrap-server-release.sh 完整的40位提交SHA
```

它会从固定 GitHub 仓库下载指定提交，在临时目录完成一次构建，并交给同一个受校验的发布工具处理；结束后会删除临时源码。此入口不用于日常发布，也不会在服务器保留 Git 仓库。
