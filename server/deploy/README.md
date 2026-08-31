# Angular20 服务器部署修复说明

## 问题原因

后端服务使用低权限账号运行，并启用了 `NoNewPrivileges=true` 时，进程不能再通过 `sudo` 提权。部署钩子如果执行 `sudo systemctl start angular20-deploy.service`，会直接失败。GitHub Actions 过去只检查接口返回 `started`，所以会误判为发布成功。

## 推荐结构

- Nest 后端继续低权限运行，保留 `NoNewPrivileges=true`。
- 部署接口只写入请求文件，不执行 `sudo`。
- `angular20-deploy.path` 由 systemd 以 root 权限监听请求目录。
- `angular20-deploy.service` 以 root 权限运行 `angular20-deploy-worker.sh`。
- GitHub Actions 拿到 `runId` 后轮询 `/api/deploy/runs/:runId`，只有状态为 `success` 才算成功。

## 服务器安装步骤

在 BCC 服务器上执行：

```bash
sudo mkdir -p /var/lib/angular20-deploy/requests /var/lib/angular20-deploy/status
sudo chown -R angular20:angular20 /var/lib/angular20-deploy

sudo cp /root/projects/angular20/server/deploy/angular20-deploy.service /etc/systemd/system/angular20-deploy.service
sudo cp /root/projects/angular20/server/deploy/angular20-deploy.path /etc/systemd/system/angular20-deploy.path
sudo chmod +x /root/projects/angular20/server/deploy/angular20-deploy-worker.sh

sudo systemctl daemon-reload
sudo systemctl enable --now angular20-deploy.path
```

后端 `.env` 增加：

```bash
DEPLOY_REQUEST_DIR=/var/lib/angular20-deploy/requests
DEPLOY_STATUS_DIR=/var/lib/angular20-deploy/status
DEPLOY_LOG_PATH=/var/log/angular20-deploy.log
PROJECT_DIR=/root/projects/angular20
```

然后重启后端：

```bash
sudo systemctl restart nest-server
```

## 处理部署目录脏状态

`scripts/deploy-full.sh` 会在拉取代码前检测部署目录是否有本地修改。如果有，会备份到：

```text
/root/deploy-backups/angular20/<时间戳>/
```

备份后执行 `git reset --hard` 和 `git clean -fd`，让 `/root/projects/angular20` 成为专用、干净的部署副本。

## 验证

触发部署后可以查看：

```bash
sudo journalctl -u angular20-deploy.service -n 100 --no-pager
sudo tail -n 200 /var/log/angular20-deploy.log
```

线上资源哈希应从旧版本更新为最新构建输出。
