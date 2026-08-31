# 工坊 后端 API 文档

> 基础地址：`https://<服务器IP>/angular20/api`（本地为 `http://localhost:3000/api`）  
> 认证方式：浏览器自动携带 Agent 登录 Cookie `hello_agent_login`（`credentials: include`）。后端校验该 Cookie，不再使用 JWT。

---

## 数据库表结构

### 1. users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER (PK) | 自增主键 |
| username | VARCHAR(254) | 用户名，现为 Agent 邮箱（唯一） |
| agentUserId | VARCHAR(36) | 对应的 Agent 用户 id（唯一，可空） |
| password | VARCHAR(200) | 占位密码（Agent 账号不同步密码） |
| nickname | VARCHAR(80) | 昵称，取自 Agent 显示名 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

### 2. records（使用记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER (PK) | 自增主键 |
| userId | INTEGER (FK) | 关联 users.id |
| type | VARCHAR(30) | 记录类型：weight / sleep / accounting |
| data | JSON | 记录数据（JSON 格式） |
| recordDate | DATE | 记录日期 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**索引**：`[userId, type]` 复合索引

### 3. game_scores（游戏分数表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER (PK) | 自增主键 |
| userId | INTEGER (FK) | 关联 users.id |
| game | VARCHAR(20) | 游戏类型：snake / tetris |
| score | INTEGER | 分数 |
| playedAt | DATETIME | 游戏时间 |
| createdAt | DATETIME | 创建时间 |

**索引**：`[userId, game]` 复合索引

---

## API 接口列表（共 12 个）

### 系统

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api` | 否 | 健康检查 |

### 认证模块（/api/auth）

| 方法 | 路径 | 认证 | 说明 | 限流 |
|------|------|------|------|------|
| POST | `/api/auth/register` | 否 | 已停用，请到 Agent 注册 | 10分钟/3次 |
| POST | `/api/auth/login` | 否 | 已停用，请到 Agent 登录 | 10分钟/10次 |
| GET | `/api/auth/profile` | 是 | 用 Agent Cookie 换取当前工坊用户与权限 | 全局 |

登录、注册请使用 Agent：`/agent/`。工坊前端请求需带 Cookie：

```http
GET /api/auth/profile
Cookie: hello_agent_login=<Agent会话>
```

成功时返回本地映射用户，例如：

```json
{
  "id": 1,
  "username": "you@example.com",
  "nickname": "显示名",
  "createdAt": "2026-08-21T00:00:00.000Z",
  "permissions": ["tools.mortgage", "chart.showcase"]
}
```

未带有效 Cookie 时返回 401。`POST /api/auth/login` 与 `POST /api/auth/register` 返回 410。

### 使用记录模块（/api/records）

> 所有接口需要认证

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/records` | 查询记录列表（支持 ?type=weight&startDate=&endDate=） |
| POST | `/api/records` | 创建记录 |
| PUT | `/api/records/:id` | 更新记录 |
| DELETE | `/api/records/:id` | 删除记录 |
| POST | `/api/records/sync` | 批量同步（先删旧记录再批量插入） |

#### 创建记录示例

```json
POST /api/records
{
  "type": "weight",
  "data": { "weight": 70.5 },
  "recordDate": "2026-07-10"
}
```

**type 可选值**：

| type | 对应页面 | data 结构 |
|------|---------|-----------|
| `weight` | 体重追踪 | `{ weight: number }` |
| `sleep` | 睡眠分析 | `{ sleepTime, wakeTime, napDuration, totalSleep }` |
| `accounting` | 记账分期 | `{ amount, category, remarks, date }` |

#### 批量同步示例

```json
POST /api/records/sync
{
  "type": "weight",
  "records": [
    { "data": { "weight": 70 }, "recordDate": "2026-07-01" },
    { "data": { "weight": 69.5 }, "recordDate": "2026-07-02" }
  ]
}
```

### 游戏分数模块（/api/game-scores）

> 所有接口需要认证

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/game-scores` | 查询分数列表（支持 ?game=snake） |
| GET | `/api/game-scores/best` | 查询最高分（?game=snake） |
| POST | `/api/game-scores` | 提交分数 |

#### 提交分数示例

```json
POST /api/game-scores
{
  "game": "snake",
  "score": 42
}
```

**game 可选值**：`snake`（贪吃蛇）、`tetris`（俄罗斯方块）

---

## 安全防护

| 措施 | 配置 |
|------|------|
| 全局限流 | 每 IP 每分钟 60 次 |
| 登录/注册接口 | 已停用（410），仍保留限流 |
| Helmet 安全头 | CSP / HSTS / X-Frame-Options 等 |
| 会话来源 | Agent Cookie `hello_agent_login`，后端向 `AGENT_AUTH_ME_URL` 校验 |

---

## 环境变量（.env）

```env
PORT=3000
DB_PATH=/var/lib/mydata/app.db
CORS_ORIGIN=http://localhost:4200
AGENT_AUTH_ME_URL=http://127.0.0.1:8000/auth/me
```
