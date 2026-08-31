# MCP Tool: fetch-indices（指数涨跌快照）

## 目标

在 NestJS 服务器项目中新增一个 MCP Server 模块，注册一个名为 `fetch-indices` 的 MCP tool。该 tool 调用东方财富 push2 公开接口，返回项目监控的所有指数/板块/ETF 的实时涨跌数据。

---

## 1. 安装依赖

```bash
npm install @modelcontextprotocol/sdk
```

---

## 2. 数据源说明

所有行情数据来自东方财富 push2 免费接口，无需鉴权。

### 2.1 核心 API

**批量行情接口**：
```
GET https://push2.eastmoney.com/api/qt/ulist.np/get
  ?fltt=2&invt=2
  &secids=1.000001,0.399001,0.399006,...
  &fields=f2,f3,f4,f6,f12,f13,f14,f104,f105,f106,f152
  &ut=bd1d9ddb04089700cf9c27f6f7426281
```

请求头要求：
```
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36
Referer: https://quote.eastmoney.com/
```

备用域名（按顺序 fallback）：
- `82.push2.eastmoney.com`
- `39.push2.eastmoney.com`
- `48.push2.eastmoney.com`
- `push2delay.eastmoney.com`
- `push2.eastmoney.com`

### 2.2 返回字段映射

| 字段 | 含义 |
|------|------|
| f2 | 最新价 |
| f3 | 涨跌幅(%) |
| f4 | 涨跌额 |
| f6 | 成交额(元) |
| f12 | 代码 |
| f13 | 市场(1=沪, 0=深) |
| f14 | 名称 |
| f104 | 上涨家数 |
| f105 | 下跌家数 |
| f106 | 平盘家数 |

---

## 3. 监控标的列表

### 3.1 内置指数（INDEX_SPECS）

```json
[
  { "name": "上证指数", "secid": "1.000001" },
  { "name": "深证成指", "secid": "0.399001" },
  { "name": "创业板指", "secid": "0.399006" },
  { "name": "科创50",   "secid": "1.000688" },
  { "name": "沪深300",  "secid": "1.000300" }
]
```

### 3.2 扩展标的（guba_targets.json）

以下标的从配置文件读取，需硬编码或做成可配置项：

```json
{
  "codes": [
    "sh000001", "sz399006", "sh000688",
    "BK0473", "BK0475", "BK0477", "BK0896",
    "BK0493", "BK0447",
    "of512480", "of515000",
    "BK0428", "BK0891", "BK0917",
    "BK1216", "BK1041", "BK0727",
    "of512170", "of159938"
  ],
  "labels": {
    "sh000001": "上证指数",
    "sz399006": "创业板指",
    "sh000688": "科创50",
    "BK0473": "证券",
    "BK0475": "银行",
    "BK0477": "酿酒",
    "BK0896": "白酒",
    "BK0493": "新能源",
    "BK0447": "互联网",
    "of512480": "半导体ETF",
    "of515000": "科技ETF",
    "BK0428": "电力",
    "BK0891": "国产芯片",
    "BK0917": "半导体概念",
    "BK1216": "医药生物",
    "BK1041": "医疗器械",
    "BK0727": "医疗服务",
    "of512170": "医疗ETF",
    "of159938": "医药ETF"
  }
}
```

### 3.3 代码 → secid 转换规则

```
sh000001  → 1.000001    (sh前缀 → 市场1)
sz399006  → 0.399006    (sz前缀 → 市场0)
BK0473    → 90.BK0473   (BK前缀 → 市场90, 板块)
of512480  → 1.512480    (of前缀, 5开头 → 市场1, ETF)
of159938  → 0.159938    (of前缀, 1开头 → 市场0, ETF)
```

完整规则：
- `BK` 开头 → `90.{CODE}`
- `sh` 开头 → `1.{6位数字}`
- `sz` 开头 → `0.{6位数字}`
- `of` 开头 → 按首位判断：`6/5/9` 开头用市场 `1`，其余用市场 `0`
- 已含 `.` 的（如 `1.000001`）直接使用

---

## 4. MCP Tool 定义

### 4.1 Tool Schema

```typescript
{
  name: "fetch-indices",
  description: "获取项目监控的全部指数/板块/ETF当前涨跌情况",
  inputSchema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["json", "html"],
        description: "返回格式, 默认 json",
        default: "json"
      }
    }
  }
}
```

### 4.2 Tool 返回值（format=json）

```json
{
  "date": "2026-08-19",
  "generatedAt": "2026-08-19T15:30:12+08:00",
  "count": 22,
  "pinned": [
    {
      "name": "上证",
      "secid": "1.000001",
      "price": 3342.00,
      "pct": 1.23,
      "change": 40.62,
      "direction": "涨",
      "label": "涨 1.23%"
    }
  ],
  "rest": [
    {
      "name": "证券",
      "secid": "90.BK0473",
      "type": "board",
      "price": 1025.30,
      "pct": -0.56,
      "change": -5.78,
      "direction": "跌",
      "label": "跌 0.56%"
    }
  ]
}
```

### 4.3 Tool 返回值（format=html）

返回完整 HTML 字符串，样式规范：

- **涨**用红色 `#ff4d4f`，**跌**用绿色 `#52c41a`，**平**用灰色 `#8c8c8c`
- 优先置顶（pinned）：上证、深证、创业板、科创板，字号稍大
- 所有项目按涨跌幅降序排列
- 深色背景 `#111`，白色文字

---

## 5. 核心实现逻辑（伪代码）

```typescript
import axios from 'axios'; // 或 Node 原生 fetch

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ...';
const REFERER = 'https://quote.eastmoney.com/';
const UT = 'bd1d9ddb04089700cf9c27f6f7426281';
const HOSTS = [
  'https://82.push2.eastmoney.com',
  'https://39.push2.eastmoney.com',
  'https://48.push2.eastmoney.com',
  'https://push2delay.eastmoney.com',
  'https://push2.eastmoney.com',
];

// 1. 组装全部 secid（去重）
const allSecids = buildSecidList(); // 合并 INDEX_SPECS + guba_targets

// 2. 请求行情（多域名 fallback）
async function fetchQuotes(secids: string[]): Promise<QuoteItem[]> {
  const secidStr = secids.join(',');
  const path = `/api/qt/ulist.np/get?fltt=2&invt=2&secids=${secidStr}&fields=f2,f3,f4,f6,f12,f13,f14,f104,f105,f106,f152&ut=${UT}`;

  for (const host of HOSTS) {
    try {
      const res = await axios.get(`${host}${path}`, {
        headers: { 'User-Agent': UA, 'Referer': REFERER },
        timeout: 15000,
      });
      if (res.data?.data?.diff) {
        return parseRows(res.data.data.diff);
      }
    } catch { continue; }
  }
  throw new Error('所有东财行情节点均不可用');
}

// 3. 解析返回
function parseRows(diff): QuoteItem[] {
  const rows = Array.isArray(diff) ? diff : Object.values(diff);
  return rows.map(row => ({
    name:      row.f14 || '',
    code:      `${row.f13}.${row.f12}`,
    secid:     `${row.f13}.${row.f12}`,
    price:     toNum(row.f2),
    pct:       toNum(row.f3),      // 涨跌幅 %
    change:    toNum(row.f4),      // 涨跌额
    amountYi:  toYi(row.f6),      // 成交额(亿)
    upCount:   toNum(row.f104),
    downCount: toNum(row.f105),
  }));
}

// 4. 分离置顶 + 排序
const PINNED = ['1.000001', '0.399001', '0.399006', '1.000688'];
function splitAndSort(quotes) {
  const pinned = PINNED
    .map(id => quotes.find(q => q.secid === id))
    .filter(Boolean)
    .sort((a, b) => b.pct - a.pct);
  const rest = quotes
    .filter(q => !PINNED.includes(q.secid))
    .sort((a, b) => b.pct - a.pct);
  return { pinned, rest };
}

// 5. 生成涨跌标签
function moveLabel(pct: number): { kind: string; text: string } {
  if (pct == null) return { kind: 'flat', text: '未知' };
  const abs = Math.abs(pct).toFixed(2);
  if (pct > 0.05)  return { kind: 'up',   text: `涨 ${abs}%` };
  if (pct < -0.05) return { kind: 'down', text: `跌 ${abs}%` };
  return { kind: 'flat', text: `平 ${abs}%` };
}
```

---

## 6. NestJS + MCP 集成方式

### 6.1 推荐架构

```
server/src/
  mcp/
    mcp.module.ts          # NestJS 模块
    mcp.service.ts         # MCP Server 实例管理
    tools/
      fetch-indices.tool.ts  # fetch-indices tool 实现
      eastmoney-api.ts       # 东财 API 封装
      targets.config.ts      # 监控标的配置
```

### 6.2 MCP Server 启动

MCP Server 可以通过 **SSE (Server-Sent Events)** 方式暴露，这样 Cursor 等 MCP 客户端可以通过 HTTP 连接。

```typescript
// mcp.service.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const server = new McpServer({
  name: "market-tools",
  version: "1.0.0",
});

// 注册 tool
server.tool("fetch-indices", { /* inputSchema */ }, async (args) => {
  const quotes = await fetchQuotes(allSecids);
  const { pinned, rest } = splitAndSort(quotes);
  // 根据 args.format 返回 json 或 html
  return { content: [{ type: "text", text: JSON.stringify({ pinned, rest }) }] };
});
```

### 6.3 NestJS 路由挂载

```typescript
// 在 NestJS Controller 中挂 SSE 端点
@Controller('mcp')
export class McpController {
  @Get('sse')
  async sse(@Req() req, @Res() res) {
    const transport = new SSEServerTransport('/api/mcp/messages', res);
    await server.connect(transport);
  }

  @Post('messages')
  async messages(@Req() req, @Res() res) {
    // 处理 MCP 消息
    await transport.handlePostMessage(req, res);
  }
}
```

---

## 7. MCP 客户端配置

完成部署后，在 Cursor 的 MCP 配置中添加：

```json
{
  "mcpServers": {
    "market-tools": {
      "url": "https://your-server.com/api/mcp/sse"
    }
  }
}
```

---

## 8. 注意事项

1. **东财接口无鉴权**，但需带正确的 `User-Agent` 和 `Referer` 头，否则可能返回空数据
2. **多域名 fallback** 是必要的，单个节点偶尔不可用
3. **涨跌幅判定阈值**：±0.05% 以内算"平"
4. **成交额单位**：接口返回元，需除以 1e8 转为"亿"
5. **时区**：所有时间使用北京时间 (UTC+8)
6. 接口返回的 `diff` 字段可能是数组或对象，需兼容两种格式
