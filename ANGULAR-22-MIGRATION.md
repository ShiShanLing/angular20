# Angular 22 升级迁移说明

> 升级日期：2026-07-20  
> 升级路径：Angular **19.2.x** → **22.0.7**

---

## 1. 依赖版本变更

| 包名 | 升级前 | 升级后 |
|------|--------|--------|
| `@angular/*` | ^19.2.x | **^22.0.7** |
| `@angular/cli` | ^19.2.x | **^22.0.7** |
| `@angular-devkit/build-angular` | ^19.2.x | **^22.0.7** |
| `typescript` | ~5.7.x | **~6.0.0** |
| `ng-zorro-antd` | ^19.3.0 | **^22.0.0-beta.0** |
| `ngx-echarts` | ^19.0.0 | **^22.0.0** |
| `ngx-quill` | ^31.0.1 | ^31.0.1（已兼容 Angular 22） |
| `rxjs` | ~7.8.0 | ~7.8.0（未变） |
| `zone.js` | ~0.15.0 | ~0.15.0（未变） |

---

## 2. 环境要求

### Node.js

Angular 22 要求 Node 版本为以下之一：

- `^22.22.3`
- `^24.15.0`
- `>=26.0.0`

已在 `package.json` 中添加：

```json
"engines": {
  "node": "^22.22.3 || ^24.15.0 || >=26.0.0"
}
```

`.nvmrc` 已从 `20.11.1` 更新为 `22`。

推荐本地启动步骤：

```bash
nvm install 22
nvm use 22
npm install
npm start
```

---

## 3. Angular CLI 自动迁移

执行 `ng update @angular/core@20 @angular/cli@20` 时，CLI 自动完成以下变更：

### 3.1 `angular.json`

- 新增 `schematics` 配置，保持与旧版 style guide 一致的生成器默认行为（component / directive / service / guard 等）。

### 3.2 `DOCUMENT` 导入路径变更

Angular 20+ 将 `DOCUMENT` 从 `@angular/common` 移至 `@angular/core`。

**修改文件：** `src/app/app.component.ts`

```diff
- import { DOCUMENT } from '@angular/common';
- import { Component, inject } from '@angular/core';
+ import { Component, inject, DOCUMENT } from '@angular/core';
```

---

## 4. ng-zorro-antd 22 API 迁移

ng-zorro-antd 22 对组件命名与 Input API 做了较大调整，以下为项目中实际修改内容。

### 4.1 模块重命名

| 旧 API | 新 API |
|--------|--------|
| `NzToolTipModule` | `NzTooltipModule` |

**涉及文件：**

- `src/app/layout/layout.component.ts`
- `src/app/pages/tools/tools-fire.component.ts`
- `src/app/pages/tools/tools-notes.component.ts`
- `src/app/pages/tools/tools-text.component.ts`

### 4.2 移除 `NzMessageModule`

ng-zorro-antd 22 不再导出 `NzMessageModule`，`NzMessageService` 可直接注入使用，无需在 `imports` 中声明模块。

**涉及文件：**

- `src/app/pages/tools/tools-notes.component.ts`
- `src/app/pages/tools/tools-time.component.ts`
- `src/app/pages/tools/tools-water.component.ts`

```diff
- import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
+ import { NzMessageService } from 'ng-zorro-antd/message';

  imports: [
-   ..., NzMessageModule
+   ...
  ]
```

### 4.3 Tabs：`nz-tabset` → `nz-tabs`

| 旧写法 | 新写法 |
|--------|--------|
| `<nz-tabset>` | `<nz-tabs>` |
| `</nz-tabset>` | `</nz-tabs>` |

子组件 `<nz-tab>` 保持不变，`nzSelectedIndex`、`nzTabPosition`、`nzSize` 等属性仍可用。

**涉及文件：**

- `src/app/pages/login/login.component.html`
- `src/app/pages/charts/charts.component.html`
- `src/app/pages/tools/tools-accounting.component.html`
- `src/app/pages/tools/tools-dev.component.html`
- `src/app/pages/tools/tools-qrcode.component.html`

### 4.4 Input：`nz-input-group` → `nz-input-wrapper` / `nz-input-search`

| 旧写法 | 新写法 |
|--------|--------|
| `<nz-input-group>` | `<nz-input-wrapper>` 或 `<nz-input-search>` |
| `nzAddOnBefore` | `nzAddonBefore` |
| `nzAddOnAfter` | `nzAddonAfter` |
| `nzPrefixIcon="user"` | 使用内容投影 `<span nzInputPrefix><nz-icon nzType="user" /></span>` |
| `[nzPrefix]="templateRef"` | 使用 `<span nzInputPrefix>...</span>` 内容投影 |
| `nzSearch` 属性 | 改用 `<nz-input-search>` 组件 |

**登录页前缀图标示例：**

```html
<!-- 旧 -->
<nz-input-group nzPrefixIcon="user">
  <input nz-input formControlName="username" />
</nz-input-group>

<!-- 新 -->
<nz-input-wrapper>
  <span nzInputPrefix><nz-icon nzType="user" /></span>
  <input nz-input formControlName="username" />
</nz-input-wrapper>
```

**搜索框 + 后缀按钮示例：**

```html
<!-- 旧 -->
<nz-input-group nzSearch [nzAddOnAfter]="suffixButton">
  <input nz-input [(ngModel)]="city" />
</nz-input-group>
<ng-template #suffixButton>
  <button nz-button>搜索</button>
</ng-template>

<!-- 新 -->
<nz-input-search>
  <input nz-input [(ngModel)]="city" />
  <button nzInputAddonAfter nz-button>搜索</button>
</nz-input-search>
```

**涉及文件：**

- `src/app/pages/login/login.component.html`
- `src/app/pages/practice/practice-list.component.ts`
- `src/app/pages/table/table.component.html`
- `src/app/pages/tools/tools-dev.component.html`
- `src/app/pages/tools/tools-notes.component.html`
- `src/app/pages/tools/tools-weather.component.html`

### 4.5 Textarea 自动高度：`nzAutosize` → CDK

ng-zorro-antd 22 移除了 `[nzAutosize]`，改用 Angular CDK 的 `TextFieldModule`。

| 旧写法 | 新写法 |
|--------|--------|
| `[nzAutosize]="{ minRows: 4, maxRows: 10 }"` | `cdkTextareaAutosize [cdkAutosizeMinRows]="4" [cdkAutosizeMaxRows]="10"` |

组件 `imports` 中需新增：

```typescript
import { TextFieldModule } from '@angular/cdk/text-field';
```

**涉及文件：**

| 文件 | 变更 |
|------|------|
| `src/app/pages/practice/practice-list.component.ts` | 模板 + 新增 `TextFieldModule` |
| `src/app/pages/tools/tools-dev.component.ts` | 新增 `TextFieldModule` |
| `src/app/pages/tools/tools-dev.component.html` | 6 处 textarea |
| `src/app/pages/tools/tools-qrcode.component.ts` | 新增 `TextFieldModule` |
| `src/app/pages/tools/tools-qrcode.component.html` | 3 处 textarea |
| `src/app/pages/tools/tools-text.component.ts` | 新增 `TextFieldModule` |
| `src/app/pages/tools/tools-text.component.html` | 1 处 textarea |
| `src/app/pages/tools/tools-water.component.ts` | 新增 `TextFieldModule` |
| `src/app/pages/tools/tools-water.component.html` | 1 处 textarea |

---

## 5. 完整变更文件清单

```
.nvmrc
angular.json
package.json
package-lock.json
yarn.lock
src/app/app.component.ts
src/app/layout/layout.component.ts
src/app/pages/charts/charts.component.html
src/app/pages/login/login.component.html
src/app/pages/practice/practice-list.component.ts
src/app/pages/table/table.component.html
src/app/pages/tools/tools-accounting.component.html
src/app/pages/tools/tools-dev.component.html
src/app/pages/tools/tools-dev.component.ts
src/app/pages/tools/tools-fire.component.ts
src/app/pages/tools/tools-notes.component.html
src/app/pages/tools/tools-notes.component.ts
src/app/pages/tools/tools-qrcode.component.html
src/app/pages/tools/tools-qrcode.component.ts
src/app/pages/tools/tools-text.component.html
src/app/pages/tools/tools-text.component.ts
src/app/pages/tools/tools-time.component.ts
src/app/pages/tools/tools-water.component.html
src/app/pages/tools/tools-water.component.ts
src/app/pages/tools/tools-weather.component.html
```

---

## 6. 构建验证

升级完成后执行：

```bash
nvm use 22   # 或 nvm use 26
npm install
npm run build
```

构建结果：**成功**（2026-07-20 验证通过）

当前存在的 warning（不影响运行）：

- `tools-notes.component.html`：可选链 `?.` 可简化为 `.`（NG8107）
- `practice.component.scss`：样式体积略超 budget（15.08 kB / 14 kB）
- `echarts`、`jsqr`、`qrcode` 为 CommonJS 模块，可能触发 optimization bailout

---

## 7. 后续建议

1. **ng-zorro-antd**：当前使用 `22.0.0-beta.0`，待正式版发布后升级至 stable。
2. **Deprecated API**（Angular 22 已标记，暂未改动）：
   - `@angular/animations` → 推荐使用 `animate.enter` / `animate.leave`
   - `@angular/platform-browser-dynamic` → 推荐仅使用 `@angular/platform-browser`
   - `@angular-devkit/build-angular`（Webpack）→ 推荐迁移至 `@angular/build`（esbuild + Vite）
3. **可选迁移**（未执行，可按需运行）：
   ```bash
   ng update @angular/core --name control-flow-migration
   ng update @angular/core --name router-current-navigation
   ng update @angular/cli --name use-application-builder
   ```

---

## 8. 升级命令参考

若需在其他环境复现，推荐按主版本逐步升级：

```bash
# 19 → 20（含 CLI 自动迁移）
ng update @angular/core@20 @angular/cli@20 --allow-dirty

# 20 → 21 → 22 可继续用 ng update，或直接修改 package.json 后 npm install
# 本项目最终直接升级至 22.0.7 并手动适配 ng-zorro 22 破坏性变更
```
