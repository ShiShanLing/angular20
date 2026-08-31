# Angular 20–22 技术更新要点

> 按版本整理 Angular 20 及之后的主要技术变化，并对照本项目现状。  
> 当前项目依赖：`@angular/* ^22.0.7`

---

## 一、版本总览

| 版本 | 核心方向 |
|------|----------|
| **Angular 20** | Signal 体系继续稳定；`resource` / `httpResource` 实验推进；SSR 增量水合稳定；Zoneless 进入预览并逐步稳定 |
| **Angular 21** | 新项目默认 Zoneless；Signal Forms 实验发布；Vitest 成为默认测试；Angular Aria 预览；MCP 增强 |
| **Angular 22** | Signal Forms / Resource / Aria 转正；组件默认 OnPush；HttpClient 默认 Fetch；TS 6 + Node 22/24/26 |

---

## 二、Angular 20（夯实 Signal 体系）

### 2.1 Signal 相关稳定化

- `effect()` 正式稳定
- `linkedSignal()` 正式稳定（可写、且会随源 signal 重置/重算）
- `toSignal()` / `toObservable()` 正式稳定
- `afterRenderEffect()`、`afterEveryRender()`（原 `afterRender` 重命名）稳定

### 2.2 异步数据（实验）

- `resource()` / `rxResource()`：以 signal 驱动异步加载，结果以 signal 暴露
- `httpResource()`：基于 Signal 的 HTTP 请求封装（loading / error / value 一体化）

### 2.3 SSR / 性能

- 增量水合（Incremental Hydration）稳定
- 路由级渲染模式配置稳定
- Zoneless 进入 Developer Preview（后续在 20.2 稳定）

### 2.4 模板 / 其他

- 模板表达式能力增强（如 `in`、指数运算、无标签模板字面量等）
- 动态组件绑定 API 增强
- Chrome DevTools 集成增强

---

## 三、Angular 21（默认值大变）

### 3.1 默认行为变化

- **新建项目默认 Zoneless**（不再默认引入 Zone.js）
- 老项目升级时可用官方迁移自动补回 `provideZoneChangeDetection()`

### 3.2 表单

- **Signal Forms** 实验发布（`@angular/forms/signals`）
  - 表单状态建立在 Signal 上
  - 类型更强、校验更声明式
  - 目标：兼顾 Reactive Forms 能力与更轻量的写法

### 3.3 无障碍

- **Angular Aria** Developer Preview
  - 无样式、可访问性优先的 headless 指令 
  - 覆盖 Tabs / Menu / Accordion / Combobox 等常见模式

### 3.4 测试

- **Vitest** 成为默认、稳定的测试运行器
- Karma 仍可继续用，但新项目默认转向 Vitest

### 3.5 AI / 工具链

- Angular **MCP Server** 能力增强（便于 AI / Agent 调用框架能力）

---

## 四、Angular 22（稳定收口）

### 4.1 三大能力转正

1. **Signal Forms** → 稳定，可上生产  
2. **`resource` / `httpResource` / `rxResource`** → 稳定  
3. **Angular Aria** → 正式可用  

### 4.2 新默认

- 组件默认 **OnPush**  
  - 旧 Default 策略改名为 Eager  
  - 升级时有自动迁移，避免行为突变
- `HttpClient` 默认走 **Fetch**（`withFetch()` 可逐步移除）
- Router：`paramsInheritanceStrategy` 默认更偏 `always`

### 4.3 DI / API

- 新的 `@Service` 装饰器
- `injectAsync()`：异步 / 懒加载注入
- 实验性 `debounced()`：给任意 Signal 做防抖

### 4.4 模板

- 模板支持箭头函数等增强写法

### 4.5 运行时要求

- TypeScript **6**
- Node：**22 / 24 / 26**（本项目 `engines` 已对齐）

### 4.6 AI

- 实验性 **WebMCP**：让应用内能力可被浏览器中的 AI Agent 调用

---

## 五、旧写法 → 新写法对照

| 旧技术 | 20+ 推荐方向 |
|--------|----------------|
| 可变字段 + Default CD | `signal` + **OnPush** |
| `*ngIf` / `*ngFor` / `*ngSwitch` | `@if` / `@for` / `@switch` |
| `@Input()` / `@Output()` | `input()` / `output()` |
| constructor 注入 | `inject()` |
| 手写 `loading` / `error` / `data` | `resource` / `httpResource` |
| Reactive Forms（长期方向） | **Signal Forms** |
| Zone.js 默认 | **Zoneless**（新项目默认） |
| Karma | **Vitest** |
| 写 `standalone: true` | 可省略（已是默认） |
| `ngClass` / `ngStyle` | `class` / `style` 绑定 |
| `@HostBinding` / `@HostListener` | `@Component({ host: { ... } })` |

---

## 六、本项目现状对照
所以
### 6.1 已落地

- `signal` / `computed` / `input` / `effect`
- 组件全面 `OnPush`
- 普遍使用 `inject()`
- 模板使用 `@if` / `@for`
- 去掉多余 `standalone: true`

### 6.2 尚未深入使用（可后续推进）

| 技术 | 建议 |
|------|------|
| `httpResource` / `resource` | 适合列表/详情类异步数据，逐步替换手写 subscribe |
| Signal Forms | 新表单或重构表单时试点，不必一次性替换全部 Reactive Forms |
| Zoneless | 需单独验证第三方库（如部分 ng-zorro 场景），可规划迁移 |
| Vitest | 测试基建升级时切换 |
| Angular Aria | 自研无障碍组件时使用 |

---

## 七、推荐落地优先级（本项目）

### 适合马上用

1. 继续保持 / 完善 `signal` + `computed` + `OnPush`
2. 模板统一 `@if` / `@for`
3. `inject()`、`input()` / `output()`
4. 合适处试用 `httpResource`（如 weather、market、notes 拉数）

### 适合观察 / 试点

1. Signal Forms（选 1–2 个简单表单试点）
2. Vitest（新测或迁测时）
3. Angular Aria（有无障碍组件需求时）

### 暂时别急着全量改

1. 一次性去掉 Zone.js（需充分回归）
2. 全量 Reactive Forms → Signal Forms
3. 游戏循环、复杂第三方图表等处硬套不合适的新 API

---

## 八、参考链接

- [Announcing Angular v20](https://blog.angular.dev/announcing-angular-v20-b5c9c06cf301)
- [Announcing Angular v21](https://blog.angular.dev/announcing-angular-v21-57946c34f14b)
- [Announcing Angular v22](https://blog.angular.dev/announcing-angular-v22-c52bb83a4664)
- [Angular v22 Release](https://angular.dev/events/v22)
- [What's new in Angular 20 (Ninja Squad)](https://blog.ninja-squad.com/2025/05/28/what-is-new-angular-20.0)
- [What's new in Angular 21 (Ninja Squad)](https://blog.ninja-squad.com/2025/11/20/what-is-new-angular-21.0)
- [What's new in Angular 22 (Ninja Squad)](https://blog.ninja-squad.com/2026/06/03/what-is-new-angular-22.0)
