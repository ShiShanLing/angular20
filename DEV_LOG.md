# Angular20 项目开发日志

> **用途**：本文件记录项目每次开发的内容，供任何接手项目的 AI 或开发者快速了解项目开发历程。
> 当 AI 聊天上下文丢失时，阅读本文件可快速恢复对项目当前状态的理解。
>
> **维护规则**：
> 1. 每次开发后，在「开发记录」末尾追加新条目，**勿修改已有条目**（除非是修正错误信息）
> 2. 条目格式：日期 + 类型标签 + 简述 + 详细说明
> 3. 类型标签：`[功能开发]` `[BUG修复]` `[重构优化]` `[安全]` `[运维]` `[文档]`
> 4. 重大架构变更请在「架构演进」章节补充说明

---

## 项目基本信息

| 项目 | 说明 |
|------|------|
| 项目名称 | angular20 |
| 前端框架 | Angular 19.2 + TypeScript 5.7 |
| UI 框架 | NG-ZORRO (Ant Design) 19.x |
| 图表库 | ECharts 5.6 + ngx-echarts 19 + echarts-gl + echarts-liquidfill |
| 后端框架 | NestJS + TypeORM + SQLite |
| 认证方案 | JWT (前端 localStorage + authInterceptor，后端 Passport-JWT) |
| 路由策略 | Hash 路由 (withHashLocation)，全部懒加载 |
| 部署方式 | GitHub Pages (`npm run publish:gh-pages`) / 自建服务器 (systemd) |
| 开发代理 | proxy.conf.json → `/api` 代理到 `http://localhost:3000` |

## 当前功能模块一览

| 分类 | 功能 | 路由 | 后端 API |
|------|------|------|----------|
| 财务工具 | 房贷计算 | /tools/mortgage | ✅ |
| 财务工具 | 个税计算 | /tools/salary | ✅ |
| 财务工具 | 记账分期 | /tools/accounting | ✅ (CRUD) |
| 财务工具 | 订阅管理 | /tools/subscription | 本地存储 |
| 财务工具 | 攒钱计划 | /tools/saving | ✅ |
| 财务工具 | FIRE 计算器 | /tools/fire | ✅ |
| 财务工具 | 安徽农村养老金 | /tools/anhui-pension | ✅ |
| 身体健康 | BMI/体脂 | /tools/bmi | 本地存储 |
| 身体健康 | 饮水提醒 | /tools/water | 本地存储 |
| 身体健康 | 体重追踪 | /tools/weight | 本地存储 |
| 身体健康 | 睡眠分析 | /tools/sleep | 本地存储 |
| 效率工具 | 时间效率 | /tools/time | 本地存储 |
| 效率工具 | 天气预报 | /tools/weather | 本地存储 |
| 效率工具 | 万年历 | /tools/calendar | 本地存储 |
| 效率工具 | 文本处理 | /tools/text | 本地存储 |
| 效率工具 | 二维码 | /tools/qrcode | ✅ |
| 效率工具 | 记事本 | /tools/notes | ✅ (CRUD + 标签) |
| 效率工具 | 开发助手 | /tools/dev | 本地存储 |
| 效率工具 | 知识刷题 | /practice | 本地题库 |
| 效率工具 | 列表刷题 | /practice-list | 本地题库 |
| 效率工具 | iOS 学习 | /ios-learning | 本地题库 |
| 效率工具 | Angular 学习 | /angular-learning | 本地题库 |
| 休闲游戏 | 贪吃蛇 | /snake | ✅ (分数) |
| 休闲游戏 | 俄罗斯方块 | /tetris | ✅ (分数) |
| 数据演示 | 炫酷图表 | /chart-showcase | — |
| 数据演示 | 条款预览 | /html-preview | — |

## 后端模块结构 (NestJS)

| 模块 | 职责 | 主要实体 |
|------|------|----------|
| Auth | 登录/注册/JWT 签发与校验 | — |
| Users | 用户管理 | User |
| Records | 记账/体重等通用记录 CRUD | Record |
| GameScores | 游戏分数提交与查询 | GameScore |
| Notes | 记事本笔记/笔记本/标签 | Note, Notebook, NoteTag |
| Export | 数据导出 (CSV/Excel) | — |

**安全配置**：
- 全局限流 60 次/分钟/IP
- 登录限流 10 次/10 分钟/IP
- 注册限流 3 次/10 分钟/IP
- Helmet 安全 HTTP 头
- Swagger 文档 `/api/docs`

**运维**：
- systemd 守护进程 (`server/nest-server.service`)
- 数据库自动备份（每天凌晨 2 点，保留 7 天）
- 日志轮转（每天，保留 14 天，gzip 压缩）

## 关键架构设计

### 认证流程
1. 用户登录 → 后端签发 JWT → 前端存 localStorage
2. `authInterceptor` 自动为每个 `/api` 请求附带 `Authorization: Bearer <token>`
3. `APP_INITIALIZER` 启动时调用 `validateSession()` 校验 token 有效性
4. `authGuard` 拦截路由，未登录跳 `/login`
5. `menuAccessGuard` 校验菜单级权限

### 菜单权限三层过滤
1. **权限过滤** (`PermissionService`)：基于用户角色判断是否有权访问
2. **激活码过滤** (`FeatureActivationService`)：知识刷题等功能需输入激活码 `999` 解锁
3. **本地显隐设置** (`MenuVisibilityService`)：用户可自定义隐藏菜单项

### 主题切换
- `ThemeService` 管理 `dark`/`light` 主题
- 全局 CSS 变量驱动，`<body>` 上切换 class
- NG-ZORRO 组件深色模式通过 SCSS 覆盖适配

---

## 开发记录

---

### 2026-04-17

`[功能开发]` **项目初始化 — Angular 脚手架与基础工具**

- 使用 Angular CLI 创建项目（Angular 19）
- 集成 NG-ZORRO (Ant Design) UI 框架
- 集成 ECharts + ngx-echarts 图表库（含 echarts-gl、liquidfill、中国省份地图）
- 搭建 Layout 壳布局：顶栏 + 侧边栏多级菜单 + 主区域 router-outlet
- 实现首批财务/健康/效率小工具页面
- 配置路由懒加载、SCSS 样式系统
- 使用工具：Cursor AI

---

### 2026-04-27

`[功能开发]` **知识刷题模块（iOS 题库）**

- 内置 `ios.seed.json` 题库数据
- 实现扩展式卡片布局，支持搜索与对比答案
- 顶栏悬浮类型/字号控制
- 分类筛选条件持久化到 localStorage
- 添加 Marked 管道用于 Markdown 渲染
- 配套 Playwright E2E 测试与单元测试
- 使用工具：Cursor AI

`[功能开发]` **布局与刷题页移动端适配**

- 侧边栏改为移动端抽屉模式
- 适配 iOS 安全区域 (safe-area)
- 响应式断点监听 (BreakpointObserver, ≤768px)
- 使用工具：Cursor AI

`[重构优化]` **提升生产构建样式预算上限**

- practice 页面样式较大，调高 `anyComponentStyle` 的 budget 限制

---

### 2026-05-07

`[功能开发]` **月度 DCA 报告脚本 + 页面更新 + 架构文档**

- 新增 `monthly_dca_report.py` Python 脚本，生成月度定投 Excel 报告
- 生成示例报告 `reports/monthly_dca_report.xlsx`
- 更新 Layout 和 Practice 页面
- 添加架构文档

---

### 2026-05-08

`[BUG修复]` **移动端布局问题修复**

- 首帧同步 `isMobile` 状态，避免窄屏刷新时桌面/移动渲染冲突
- Header 菜单按钮 flex 安全处理
- Header z-index 提升到抽屉之上
- 关闭状态抽屉 pointer-events 设为 none
- 标题溢出省略号处理
- 注册 `MenuOutline` 图标到 `provideNzIcons`（nzType=menu 依赖）
- 更新月度 DCA 报告脚本与生成文件

---

### 2026-05-12

`[功能开发]` **游戏分数对接 + 布局修复**

- 贪吃蛇：游戏结束自动提交分数到 `/api/game-scores`
- 俄罗斯方块：游戏结束自动提交分数到 `/api/game-scores`
- 修复 Layout 中 `displayName` → `nickname` 字段名

---

### 2026-05-13

`[功能开发]` **刷题语音播放模式**

- 为 Practice 刷题页面添加语音朗读功能
- 支持题目内容 TTS 播放

`[BUG修复]` **语音播放跳过代码片段**

- 朗读时自动跳过代码块，避免读出无意义符号

`[运维]` **源码与 Pages 发布脚本**

- 新增 `scripts/publish-source-and-pages.cjs`
- 同时推送源码到主分支、构建产物到 gh-pages 分支

---

### 2026-05-15

`[功能开发]` **iOS 题库答案刷新 + 每日标记 UX**

- 更新 iOS 面试题库的参考答案
- 优化每日打卡/标记交互体验

---

### 2026-05-21

`[功能开发]` **iOS 面试题库扩充**

- 扩充 iOS 面试题种子数据

`[运维]` **提交剩余工作区更新**

---

### 2026-05-26

`[功能开发]` **iOS 学习练习模式**

- 新增 `/ios-learning` 路由
- 独立的 iOS 学习题库与练习界面
- 需激活码 `999` 解锁

---

### 2026-05-27

`[功能开发]` **Angular 学习练习模式**

- 新增 `/angular-learning` 路由
- 独立的 Angular 学习题库与练习界面
- 需激活码 `999` 解锁

---

### 2026-06-05

`[功能开发]` **二维码工具 + 功能激活门控**

- 新增 `/tools/qrcode` 二维码工具
- 支持文本生成二维码
- 支持图片扫描识别二维码
- 引入 `FeatureActivationService` 激活码门控机制
- 激活码 `999` 解锁知识刷题等高级功能

---

### 2026-06-08

`[功能开发]` **激活码回滚 + 二维码图片粘贴识别**

- 新增激活码 `888` 用于回滚（撤销 `999` 的激活）
- 二维码支持粘贴图片进行解码

`[BUG修复]` **二维码扫描解码 UX 改进**

- 优化扫描识别的用户体验

---

### 2026-06-16

`[功能开发]` **面试题库扩充**

- 新增约 70 道面试/学习题目

---

### 2026-07-10

`[功能开发]` **NestJS 后端 + 登录系统 + API 服务层**（重大里程碑）

- 搭建 NestJS 后端项目 (`server/`)
- 实现 Auth 模块：登录/注册/JWT 签发
- 实现 Users 模块：用户管理
- 实现 Records 模块：通用记录 CRUD
- 实现 GameScores 模块：游戏分数
- 使用 TypeORM + SQLite 数据库
- 前端新增 `AuthService`、`authGuard`、`authInterceptor`
- 前端新增 `RecordService`、`GameScoreService` HTTP 服务层
- 配置 `proxy.conf.json` 开发代理

`[功能开发]` **前后端对接 + 邀请码注册 + 各页面对接 API**

- 注册功能支持邀请码
- 记账分期对接 `/api/records` (CRUD)
- 贪吃蛇/俄罗斯方块分数提交对接
- Layout 显示用户 nickname

`[BUG修复]` **修复未登录可访问页面的安全问题**

- `AuthService.isLoggedIn()` 现在检查 JWT 是否过期
- 新增 `isTokenExpired()` 解析 JWT payload 的 exp 字段
- 新增 `validateSession()` 调用后端 `/api/auth/profile` 验证 token
- `APP_INITIALIZER` 启动时验证 token，无效则清除登录态
- 过期/无效 token 不再放行，强制跳转登录页

`[安全]` **接口防攻击保护**

- 全局限流：每 IP 每分钟 60 次请求 (`@nestjs/throttler`)
- 登录限流：每 IP 每 10 分钟 10 次（防暴力破解）
- 注册限流：每 IP 每 10 分钟 3 次（防滥用）
- Helmet 安全 HTTP 头（XSS/CSRF/点击劫持防护）
- 安全头：CSP, HSTS, X-Frame-Options, X-Content-Type-Options

`[文档]` **后端 API 接口文档**

- 新增 `server/API.md`
- 3 张数据库表结构说明（users / records / game_scores）
- 12 个 API 接口列表及请求示例
- 安全防护配置说明
- 环境变量配置说明

`[功能开发]` **运维基础设施 + 数据导出 + Swagger 文档**

- systemd 守护进程（开机自启 + 崩溃自动重启）
- 数据库自动备份（每天凌晨 2 点，保留 7 天）
- 日志轮转（每天，保留 14 天，gzip 压缩）
- 数据导出模块（CSV/Excel）：
  - `GET /api/export/records/csv?type=weight`
  - `GET /api/export/game-scores/csv?game=snake`
  - `GET /api/export/all/excel`（全部数据导出）
- Swagger 在线文档 (`/api/docs`)，所有接口带 Swagger 装饰器

`[功能开发]` **所有工具页面对接后端 API**

- 房贷计算 (mortgage)：表单参数云端同步
- 工资/个税 (salary)：计算模板云端同步
- 攒钱计划 (saving)：目标参数云端同步
- FIRE 计算 (fire)：退休模拟参数云端同步
- 安徽养老金 (pension)：计算参数云端同步
- 二维码 (qrcode)：生成文本 + 扫描记录保存
- 策略：localStorage 作为快速缓存，API 数据优先，表单防抖 500ms 自动保存

`[功能开发]` **协议文件上传**

- 上传个人信息处理授权同意书等 HTML 文件到 `src/test/`

---

### 2026-07-14

`[功能开发]` **列表刷题页面**

- 新增 `/practice-list` 路由
- 滚动看题、隐藏答案、手写记忆模式

`[功能开发]` **列表刷题手风琴模式**

- 同时只展开一题，提升浏览体验

`[功能开发]` **深色/浅色主题切换功能**

- 新增 `ThemeService` 管理主题状态
- 全局 CSS 变量驱动深色/浅色切换
- Header 一键切换按钮
- 主题选择持久化到 localStorage

`[重构优化]` **列表刷题菜单整合**

- 移除多余的通用列表刷题菜单
- 合并为统一入口，加载所有题库（iOS + Angular + 通用）
- 自动注入所有内置题库，首次访问即可看到全部题目

`[重构优化]` **代码质量优化**

- 修复样式重复代码
- 修复字符串转义 bug
- 深色模式适配补全
- 清理无关代码
- 统一版本号

`[BUG修复]` **深色模式全面适配（多轮修复）**

- 工具页面：全局添加 radio/card/alert 覆盖，各工具 SCSS 改用 CSS 变量
- 全面适配：SCSS 变量化 + HTML 内联样式替换 + CSS 变量补全
- nz-divider 深色模式文字颜色覆盖
- 全项目排查：清理 SCSS 重复代码 + practice/layout/dashboard 等页面适配 + 全局 NG-ZORRO 覆盖补全
- 日期选择器 (date-picker) 深色模式：面板/日历/时间选择器/范围选择器全面适配
- 日期选择器输入框文字深色模式适配
- ant-typography 深色模式覆盖
- 攒钱计划 alert 提示文字深色模式适配
- FIRE 提示文字深色模式适配
- 记事本权限深色模式适配

`[重构优化]` **房贷计算器 UI 布局优化（后回退）**

- 尝试合并输入卡片 + 英雄指标区 + 网格明细 + 支撑分析卡片
- 后因效果不理想 `revert` 还原原始布局

`[功能开发]` **记事本功能**（重大功能）

- 新增 `/tools/notes` 路由
- 三栏布局：文件夹列表 / 笔记列表 / 编辑区
- 后端新增 Notes 模块（Note + Notebook + NoteTag 实体）
- 支持文件夹、标签、搜索、收藏、置顶
- 支持导出、图片上传

`[重构优化]` **记事本编辑器演进**

1. 初始：Markdown 编辑器
2. 改为：富文本编辑器 (contenteditable + 自定义工具栏)
3. 增强：字号 9-72pt + 数字/字母列表 + 样式增强
4. 最终：替换为 Quill 成熟方案 (ngx-quill) + 表格 + 完整格式工具栏

`[功能开发]` **记事本插入表格**

- 支持自定义行列数插入表格
- 插入表格弹窗改用 nz-modal 组件 + 真实输入框

---

## 架构演进

### v0.1 (2026-04-17) — 纯前端工具集
- Angular 19 + NG-ZORRO + ECharts
- 全部数据存 localStorage
- 无后端、无认证

### v0.2 (2026-04-27 ~ 2026-06-16) — 刷题与工具丰富期
- 新增 iOS/Angular 刷题模块
- 新增二维码工具
- 引入激活码门控机制
- 移动端适配
- 游戏分数开始对接后端（早期 API）

### v0.3 (2026-07-10) — 全栈化（重大里程碑）
- 引入 NestJS 后端
- JWT 认证体系
- 所有核心工具对接后端 API
- 运维基础设施（systemd / 备份 / 日志轮转）
- 安全防护（限流 / Helmet）
- Swagger API 文档

### v0.4 (2026-07-14) — 体验优化期
- 深色/浅色主题切换
- 全项目深色模式适配
- 列表刷题模式
- 记事本功能（Quill 富文本编辑器）
- 代码质量优化

---

## 待办与已知问题

> 以下为已知但未解决的问题，供后续开发参考。

1. **二维码功能**：图片高度会影响下方结果展示位置；图片识别有时识别不出来
2. **部分工具仍为本地存储**：BMI、饮水、体重、睡眠、订阅管理、时间效率、天气、万年历、文本处理、开发助手尚未对接后端 API
3. **激活码为硬编码**：`999`/`888` 直接写在 LayoutComponent 中，未做后端验证

---

## 变更记录格式模板

> 后续开发者请复制以下模板添加新条目：

```markdown
### YYYY-MM-DD

`[功能开发]` **简述**

- 详细说明 1
- 详细说明 2
- 涉及文件：path/to/file

`[BUG修复]` **简述**

- 问题描述
- 修复方案
- 涉及文件：path/to/file

`[重构优化]` **简述**

- 重构原因
- 改动范围
- 涉及文件：path/to/file
```
