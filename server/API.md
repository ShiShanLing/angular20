# Angular20 后端 API 文档

> 基础地址：`http://<服务器IP>/api`  
> 认证方式：Bearer Token（登录后获取 `access_token`，放入请求头 `Authorization: Bearer <token>`）

---

## 数据库表结构

### 1. users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER (PK) | 自增主键 |
| username | VARCHAR(50) | 用户名（唯一） |
| password | VARCHAR(200) | 密码（bcrypt 加密存储） |
| nickname | VARCHAR(50) | 昵称（可选） |
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
| POST | `/api/auth/register` | 否 | 注册（需邀请码） | 10分钟/3次 |
| POST | `/api/auth/login` | 否 | 登录，返回 JWT token | 10分钟/10次 |
| GET | `/api/auth/profile` | 是 | 获取当前用户信息 | 全局 |

#### 注册请求示例

```json
POST /api/auth/register
{
  "username": "zhangsan",
  "password": "123456",
  "inviteCode": "999",
  "nickname": "张三"        // 可选
}
```

#### 登录请求示例

```json
POST /api/auth/login
{
  "username": "zhangsan",
  "password": "123456"
}

// 响应
{
  "access_token": "eyJhbGci...",
  "user": { "id": 1, "username": "zhangsan", "nickname": "张三" }
}
```

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
| 登录限流 | 每 IP 每 10 分钟 10 次 |
| 注册限流 | 每 IP 每 10 分钟 3 次 |
| Helmet 安全头 | CSP / HSTS / X-Frame-Options 等 |
| 密码加密 | bcrypt |
| JWT 有效期 | 7 天 |

---

## 环境变量（.env）

```env
PORT=3000
DB_PATH=/var/lib/mydata/app.db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:4200
INVITE_CODE=999
```
