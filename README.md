# 工坊

## 线上入口

- 工坊：<https://shishanling.cn/workshop/>
- 接口文档：<https://shishanling.cn/workshop/api/docs>

二维码功能
1.还需要优化,图片高度会影响下方结果展示位置,
2.图片识别有问题,有可能识别不出来

基于 **Angular 19** 的综合性前端练习项目：侧边栏聚合多类**小工具**、小游戏与 **ECharts** 数据演示，界面使用 **NG-ZORRO (Ant Design)**。适合作为组件化、路由懒加载、表单与本地存储等场景的参考实现。

## 功能概览

- **财务工具**：房贷计算、个税计算、记账分期、订阅管理、攒钱计划、FIRE 退休现金流模拟等。
- **身体健康**：BMI/体脂、饮水提醒、体重追踪、睡眠分析等。
- **效率工具**：时间效率、天气预报、万年历、文本处理、开发助手（时间戳/JSON/Base64/URL 等）、知识刷题。
- **休闲游戏**：贪吃蛇、俄罗斯方块。
- **数据演示**：炫酷图表（含 ECharts 与中国地图等展示）。

默认进入应用会跳转到工具模块（如房贷计算页），具体菜单以侧边栏为准。

## 登录与账号

工坊不再维护独立账号。登录、注册、退出都走 **Hello Agent** 的统一账号（Cookie `hello_agent_login`，`path=/`）。

- 登录页点「使用统一账号登录」会跳到 `/agent/?next=/workshop/...`，在 Agent 登录或注册成功后回到工坊。
- 已在 Agent 登录时，直接打开 `/workshop/` 即可进入，不必再登一次。
- 游客模式仍可用：能用工具和游戏，使用记录不会写到服务器。
- 工坊后端不再签发 JWT。受保护接口会把浏览器带来的 Agent Cookie 转到 `http://127.0.0.1:8000/auth/me` 校验；通过后按 Agent 用户在本地 `users` 表建立或更新一条映射（笔记、记录仍用这条本地用户 id）。
- Agent 管理员（`can_access_admin`）在工坊拥有完整菜单权限；普通成员只有基础工具权限。
- 旧的工坊用户名/密码登录和邀请码注册已停用，请到 Agent 注册新账号。

统一账号入口：<https://shishanling.cn/agent/>

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Angular 19、TypeScript、RxJS |
| UI | ng-zorro-antd |
| 图表 | ECharts、ngx-echarts（含 echarts-gl、liquidfill、中国省份地图数据等） |
| 其他 | xlsx 等 |

## 开发环境

| 项目 | 说明 |
| --- | --- |
| **Node.js** | Angular 19 要求 **^18.19.1**、**^20.11.1** 或 **^22.x**；推荐使用当前 **20.x LTS**。用 `node -v` 自检。 |
| **包管理器** | **npm**（与仓库中的 `package-lock.json` 一致）。亦可用 yarn，以本地锁文件为准。 |
| **Angular / CLI** | **19.2.x**（见 `package.json` 中 `@angular/*`、`@angular/cli`）。本地可用 `npx ng version` 查看。 |
| **TypeScript** | **~5.7.2**（与 CLI 配套）。 |
| **浏览器** | 建议使用最新 **Chrome / Edge / Firefox / Safari**，需支持现代 ES 与 source map 调试。 |

可选：编辑器 **VS Code** + 官方 [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template) 扩展，模板与类型提示更友好。

## 本地开发

安装依赖并启动开发服务：

```bash
npm install
npm start
```

默认等价于 `ng serve`，开发服务器地址为 **`http://localhost:4200/`**。修改源码后会热更新；若端口占用可加 `--port 4300` 等参数（`npm start -- --port 4300`）。

其它常用脚本：

| 脚本 | 作用 |
| --- | --- |
| `npm run watch` | development 配置下持续构建（无 dev server，适合配合其它静态服务调试产物）。 |
| `npm test` | Karma 单元测试。 |

## 构建

生产构建（产物在 `dist/angular20/browser`）：

```bash
npm run build
```

## 部署到 GitHub Pages

仓库若发布在子路径（例如 `https://<user>.github.io/angular20/`），可使用已配置的脚本：先按子路径构建并生成 `404.html`（便于 SPA 路由），再推送到 `gh-pages` 分支：

```bash
npm run publish:gh-pages
```

等价命令：`npm run deploy`。若仓库名或 GitHub Pages 路径变更，请同步修改 `package.json` 中 `build:gh` 的 `--base-href`。

## 发布到生产服务器

生产服务器不保存 Git 仓库，也不接受公网部署 webhook。代码在本地构建后，通过普通账号 `deploy` 上传；服务器只允许该账号调用一个参数和目标均受校验的固定发布工具。后端以独立的低权限账号 `angular20` 运行，发布失败会自动恢复上一个版本。

```bash
./deploy/publish.sh publish --targets frontend
./deploy/publish.sh publish --targets backend
./deploy/publish.sh publish --targets frontend,backend
```

完整安装方式、安全边界和回滚目录见 [`deploy/README.md`](deploy/README.md)。旧的 GitHub Actions webhook 发布通道已经移除。

---

以下为 Angular CLI 默认生成的脚手架说明（可选用）。

## Code scaffolding

```bash
ng generate component component-name
```

查看全部 schematic：


```bash
ng generate --help
```

## Running unit tests

```bash
ng test
```

## Running end-to-end tests

```bash
ng e2e
```

Angular CLI 默认不包含端到端框架，可按需自行接入。

## Additional resources

更多 CLI 说明见 [Angular CLI 文档](https://angular.dev/tools/cli)。
