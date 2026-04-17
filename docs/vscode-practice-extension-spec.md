# VS Code 扩展：面试刷题工具 — 需求说明

**目标读者**：负责实现 VS Code / Cursor 插件的同事或外部协作者。  
**方案定位**：采用 **Extension + Webview** 的 **轻量 UI**；**业务规则与 Web 版对齐**，避免两套题库逻辑长期分叉。

**参考实现（权威行为来源）**：本仓库 Angular 应用中的面试刷题页。

**扩展侧已提交示例题库**：若使用 `hello-cursor-extension` 仓库，可直接打开其中 `data/practice-catalog.json`（20 条结构化题目）与 `data/README.txt`；网站端无内置题库文件，题目在浏览器 `localStorage` 键 `angular20_practice_v1`，可自行导出 JSON 覆盖扩展内 `practice-catalog.json` 以同步。

| 路径 | 说明 |
| --- | --- |
| `src/app/pages/practice/practice.types.ts` | 题型、分类、标签文案 |
| `src/app/pages/practice/practice-import.ts` | Excel/CSV 导入与表头规则 |
| `src/app/pages/practice/practice-storage.service.ts` | 本地持久化、去重、统计 |
| `src/app/pages/practice/practice.component.ts` | 交互流程（筛选、随机、上一题/下一题、显隐答案等） |

---

## 1. 背景与目标

- 用户在 **VS Code / Cursor** 内刷题，无需切到浏览器打开本站。
- **不上架 Marketplace 也可**：打包 `.vsix` 本机「Install from VSIX」自用。
- **不要求**把 Angular + NgZorro 整站搬进 Webview；Webview 内可使用 **原生 HTML/CSS + 少量 TS**（或极薄一层 UI 框架），以降低体积与 CSP 风险。

---

## 2. 非目标（本期可不做）

- 与 Angular 站点的 **实时数据同步**（云端账号、多端同步）。
- 题目在线编辑富文本、LaTeX 渲染（与 Web 版一致即可：纯文本 + 换行）。
- Language Server、代码片段等与「刷题」无关的编辑器深度集成（可留作二期）。

---

## 3. 数据模型（必须与 Web 版一致）

以下与 `practice.types.ts` **字段名与枚举值保持一致**，便于将来抽公共包或手动拷贝 JSON。

### 3.1 分类 `PracticeCategory`

`ios` | `android` | `angular-ts` | `angular-js` | `angular-css`

### 3.2 展示用中文标签

与 `PRACTICE_CATEGORY_LABELS` 一致（如 `angular-ts` → `Angular · TypeScript`）。

### 3.3 题目条目 `PracticeItem`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 唯一 id，`randomUUID` 或等价实现 |
| `category` | `PracticeCategory` | |
| `question` | `string` | 题干 |
| `answer` | `string` | 参考答案，可空字符串 |
| `tags` | `string` | 标签/备注 |
| `importedAt` | `number` | Unix 毫秒时间戳 |

### 3.4 导入草稿 `PracticeItemDraft`

与 `practice-import` 解析结果一致：`category`, `question`, `answer`, `tags`, `sourceRow`（Excel 行号，用于报错提示）。

---

## 4. 核心业务规则（须与 Web 版行为一致）

### 4.1 导入表格

- 支持 `.xlsx`、`.xls`、**Excel 另存为 CSV**（与现网相同：底层用 `xlsx` 读 `ArrayBuffer`）。
- **第一个 Sheet** 为数据源。
- 表头行识别、列别名、无表头时的列序、分类归一化规则：**逐条照搬** `practice-import.ts`（含 `HEADER_ALIASES`、`normalizeCategory`、`CATEGORY_ALIASES`）。
- 解析结果：`{ drafts, errors }`；errors 用于提示，不必阻断全部导入（与 Web 版一致：有 drafts 仍可导入，并提示部分行失败）。

### 4.2 入库去重

- 键：`` `${category}::${normQuestion(question)}` ``  
- `normQuestion`：`trim` → 空白压成单空格 → **小写**（与 `practice-storage.service.ts` 一致）。
- 已存在则 **skipped++**，否则 **added++**，并 `save` 全量列表。

### 4.3 持久化

- Web 版使用 `localStorage`，键名：`angular20_practice_v1`。
- **扩展建议**：使用 `ExtensionContext.globalState`（或等价 API）存 **同结构 JSON 数组**。键名可仍为 `angular20_practice_v1` 或加前缀 `practiceItems`，但须在文档中写死，便于排查。
- **可选（增强）**：提供「导出 JSON / 导入 JSON」与 Web 版手工迁移；非本期必做。

### 4.4 统计

- `countByCategory`：五类各多少题；总题数。用于 Webview 展示（与 Web 版统计含义一致）。

---

## 5. Webview 功能清单（MVP）

| 功能 | 说明 |
| --- | --- |
| 打开面板 | 命令面板注册命令，如「刷题：打开练习面板」，激活并显示 Webview。 |
| 分类筛选 | `全部` + 五类；切换筛选后当前索引 **clamp** 到合法范围，**关闭「显示答案」**（与 `setFilter` 一致）。 |
| 随机一题 | 在当前筛选列表内 `random`；无题时提示（与 `randomOne` 一致）。 |
| 上一题 / 下一题 | 循环列表（模运算）；切换题目时默认隐藏答案。 |
| 显示 / 隐藏答案 | 切换布尔状态；无「参考答案」时可显示「（暂无）」或留空。 |
| 导入题库 | 使用 `vscode.window.showOpenDialog` 选文件，扩展侧读文件为 `ArrayBuffer`，调用与 Web 相同的解析与 `importDrafts` 逻辑，再通过 `postMessage` 刷新 Webview 或重载状态。 |
| 清空题库 | **二次确认**（与 `confirmClear` 一致），确认后删除持久化数据并刷新 UI。 |
| 空状态 | 无题时引导用户导入；可与 Web 版 `nz-empty` 文案类似。 |

**不需要**在 MVP 内复刻 NgZorro 视觉；布局清晰、键盘可操作即可。

---

## 6. 通信与安全

- **Extension ↔ Webview**：`postMessage` / `onDidReceiveMessage`。消息类型需定义 TS 枚举或字面量联合（如 `ready`、`importResult`、`clear`、`navigate` 等），避免字符串魔法值散落。
- Webview `Content-Security-Policy`：默认收紧；若使用内联脚本，需 `nonce` 或外链单独打包的脚本文件（按官方 Webview 指南）。
- 不在 Webview 内直接使用 Node API；文件读写仅在 Extension Host 完成。

---

## 7. 逻辑代码组织建议（减少「单独再写一套」）

**推荐**：将以下 **无 Angular 依赖** 的文件 **复制或抽成 `packages/practice-core`**，扩展与 Web 共用：

- `practice.types.ts`
- `practice-import.ts`（依赖 `xlsx`，扩展的 `package.json` 需声明 `xlsx`）
- 持久化：Web 用 `localStorage` 封装一层接口；扩展用 `globalState` 封装 **同一套** `load/save/importDrafts/clearAll/parseItem` 签名。

若短期不抽包：**允许在扩展仓库中复制上述 TS 文件**，但须在 README 标明「与 angular20 某 commit 对齐」，避免静默漂移。

---

## 8. 验收标准

1. 用 **同一份** 本站支持的 Excel 样例导入，扩展与 Web 产出的题目条数、分类、去重结果一致（在相同初始空库下）。  
2. 筛选「Angular · TypeScript」后随机/上一题/下一题仅在子集内切换。  
3. 关闭 VS Code 再打开，题目仍在（验证持久化）。  
4. `vsce package` 可打出 `.vsix`，本机 Install from VSIX 后命令可用。

---

## 9. 参考命令（实现方自检）

- 扩展内读文件 → `parsePracticeFile(buf)` → `importDrafts` → `save`。  
- 与浏览器差异仅 **存储后端**（`globalState` vs `localStorage`），**不向用户暴露两套去重规则**。

---

## 10. 联系人 / 仓库

- 业务规则以 **`src/app/pages/practice/`** 当前实现为准；若 Web 端有变更，应同步更新本需求文档版本号或 Git 引用。

**文档版本**：1.0（随 `practice` 模块行为变更而修订）
