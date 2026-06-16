# Angular + JavaScript + TypeScript 技术学习路线（`angular.job.cursor.md`）

> 面向 **前端 / Angular 岗** 技术学习：偏「常问什么、怎么答、怎么自检」，不是完整教程。
>
> **技术栈假设**：Angular **19+**（Standalone、Signals、`inject()`）、RxJS 7、TypeScript 5；UI 库常见为 **ng-zorro** 或 Material（概念互通）。
>
> **与本仓库**：本项目的 `src/app` 已用到 Standalone、`signal`/`computed`、`provideRouter` + 懒加载、`canActivateChild` 守卫、`HttpClient`、ng-zorro —— 可把下文当作「对照真实代码复习」的清单。

---

## 1. 重点在考什么（四块记分板）

| 板块 | 典型形式 | 你要准备到什么程度 |
|------|-----------|---------------------|
| **JS / TS 语言** | 口述 + 白板小代码 | 原型链、闭包、`this`、类型系统、泛型、工具类型 |
| **Angular 核心** | 场景题 + 生命周期/变更检测 | 组件、DI、模板语法、Signal vs Zone、路由 |
| **RxJS / 异步** |  marble 图 / 口述管道 | `Observable`、热冷、常用操作符、取消订阅 |
| **工程与质量** | 简历深挖 + 小设计 | 分层、可测性、表单/HTTP、性能与打包 |

**策略**：每个知识点准备 **「1 分钟定义 + 30 秒项目例子 + 1 个踩坑」**。

---

## 2. 路线总览（按学习 ROI 排序）

**建议顺序**：**JavaScript 核心 → TypeScript → Angular 组件/DI/模板 → 路由与表单 → RxJS → 变更检测与性能 → 测试**。

| 优先级 | 主题 | 学习关联 |
|--------|------|-----------|
| P0 | JS：`this`、闭包、原型、事件循环、Promise | 几乎必问 |
| P0 | TS：类型收窄、`interface` vs `type`、泛型、联合/交叉 | 几乎必问 |
| P0 | Angular：组件、模块/Standalone、`@Input`/`@Output`、DI、`inject` | 核心岗必问 |
| P0 | 变更检测：Zone.js 做什么；Signal 如何减少脏检查 | 19+ 高频 |
| P0 | 路由：懒加载、`Router`、守卫 `canActivate`/`canMatch` | 业务岗必问 |
| P1 | RxJS：`map`/`switchMap`/`mergeMap`/`catchError`、Subject 家族 | 中高级必问 |
| P1 | 表单：Reactive vs Template-driven、`FormControl` 校验 | 表单多的岗 |
| P1 | HTTP：`HttpClient`、拦截器、错误处理 | 业务岗 |
| P1 | 状态：Service + Signal vs NgRx（能说选型即可） | 架构题 |
| P2 | 性能：`OnPush`、track、`async` pipe、懒加载、预加载策略 | 加分 |
| P2 | 测试：`TestBed`、假服务、组件测试边界 | 重视质量的团队 |
| P2 | CSS：`:host`、封装、`::ng-deep` 为何废弃、Flex/Grid 一句 | 全栈/样式题 |
| P3 | SSR/Hydration、微前端、Monorepo Nx | JD 写了再深啃 |

---

## 3. 分模块：题纲（自检用）

对每个 **粗体短语** 自问：能否 **口述 1～2 分钟**，必要时 **写 5～10 行伪代码**。

### 3.1 JavaScript（基础盘）

- **数据类型**：原始 vs 引用；`==` vs `===`
- **作用域与闭包**：词法作用域；闭包用来做什么（缓存、工厂、回调保状态）
- **`this`**：默认绑定、隐式丢失、`call/apply/bind`、箭头函数不绑定 `this`
- **原型链**：`__proto__` / `Object.getPrototypeOf`；`new` 做了什么
- **事件循环**：宏任务 / 微任务；`setTimeout(0)` vs `Promise.then` 顺序
- **ES6+**：解构、展开、可选链 `?.`、空值合并 `??`、模块 `import/export`
- **异步**：Promise 状态；`async/await` 本质是 Promise；错误用 `try/catch`
- **深浅拷贝**：`JSON.parse` 局限；结构化克隆、`structuredClone`（概念）
- **防抖 / 节流**：适用场景（搜索输入 vs 滚动）

### 3.2 TypeScript

- **基本类型**：`unknown` vs `any`；何时用 `never` / `void`
- **`interface` vs `type`**：扩展、联合、映射类型更常用哪种
- **类型收窄**：`typeof`、`in`、`instanceof`、可辨识联合（`tag` 字段）
- **泛型**：函数/接口泛型；`extends` 约束；`keyof` / `typeof` 取键
- **工具类型（常考）**：`Partial`、`Pick`、`Omit`、`Record`、`ReturnType`
- **断言**：`as` 与类型守卫；非空断言 `!` 的风险
- **配置**：`strict` 开哪些；路径别名 `paths`
- **与 Angular**：组件类属性类型、`inject()` 返回类型、模板类型检查

### 3.3 Angular 核心（组件与 DI）

- **Standalone**：不再必需 `NgModule`；`imports: [...]` 显式依赖
- **组件元数据**：`selector`、`templateUrl`、`changeDetection`、`providers`
- **`@Input` / `@Output`**：`input()` / `output()`（19+ 信号 API）与装饰器版区别（了解即可）
- **内容投影**：`<ng-content>`；多 slot
- **DI**：注入令牌 `InjectionToken`；`providedIn: 'root'` vs 组件级 `providers`
- **`inject()`**：构造函数注入的函数式写法；在 `field initializer` 里用
- **生命周期（仍可能问）**：`ngOnInit`、`ngOnDestroy`、何时适合 `constructor`
- **指令**：结构型 `*ngIf` / `@if`；属性型指令概念
- **管道**：纯管道 vs 非纯；性能影响

### 3.4 Signals 与变更检测（Angular 16+，19 默认重点）

- **Signal / computed / effect**：谁可写、谁只读；`effect` 副作用边界
- **与模板**：`{{ count() }}` 调用 signal；`computed` 派生状态
- **Zone.js**：为何曾经「任何异步都触发 CD」；`provideZoneChangeDetection({ eventCoalescing: true })` 大意
- **`ChangeDetectionStrategy.OnPush`**：输入引用不变则不检；Signal 如何简化 OnPush 心智
- **`async` pipe**：自动订阅/取消；与手动 `subscribe` 对比
- **常见踩坑**：在 `effect` 里乱改 signal 导致循环；大列表缺 `track`

### 3.4.1 Angular 19 新控制流与新 API（高频补盘）

- **新控制流**：`@if`、`@for (item of list; track item.id)`、`@switch`、`@empty`；与旧 `*ngIf`/`*ngFor` 的取舍
- **`@defer`**：按视口/交互/定时延迟加载子树，配合 `@placeholder` / `@loading` / `@error`
- **信号 IO**：`input()` / `input.required()` / `model()` / `output()`，与装饰器版心智的差异
- **`viewChild()` / `contentChild()` 信号版**：相对老版 `@ViewChild` 的好处
- **`takeUntilDestroyed()`**：在 `inject` 上下文里自动随组件销毁取消订阅
- **桥接**：`toSignal(observable$)`、`toObservable(signal)`；何时该改写、何时只在边界桥接
- **新派生**：`linkedSignal()`（依赖另一个 signal 的可写派生）、`resource()`（异步数据 + 状态）
- **Zoneless 试水**：`provideExperimentalZonelessChangeDetection()`（口述：完全靠 Signal/事件驱动 CD）

### 3.5 路由

- **配置**：`Routes`、`loadComponent` / `loadChildren` 懒加载
- **导航**：`Router.navigate`、`routerLink`、相对路径
- **路由参数**：`ActivatedRoute` snapshot vs `paramMap` Observable
- **守卫**：`canActivate`、`canActivateChild`、`canMatch` 区别（**子路由用 Child**）
- **数据与复用**：`resolve`（了解）；同组件不同参数时 `runGuardsAndResolvers`
- **Hash vs Path**：`withHashLocation()` 适用静态托管（如 GitHub Pages）
- **激活态**：`RouterLinkActive` + `exact` 的常见误用
- **运行策略**：`runGuardsAndResolvers: 'always'`、`onSameUrlNavigation: 'reload'` 的适用场景
- **路由事件**：`NavigationStart`/`End`/`Cancel`/`Error`，常用于 loading 条 & 滚动恢复
- **本仓库例子**：`menuAccessGuard` + 无权限跳首个可访问页 / `no-access` 兜底

### 3.6 表单

- **Reactive Forms**：`FormGroup`、`FormControl`、`FormArray`；强类型表单（若用过）
- **校验**：同步 / 异步校验器；`Validators.required` 等
- **Template-driven**：`ngModel`；何时仍用（简单表单）
- **动态表单**：`FormArray` 增删行
- **与 Signal**：展示层用 signal 存 UI 状态，提交前 `patchValue` / `getRawValue`

### 3.7 HTTP

- **`HttpClient`**：`get/post` 返回 `Observable`（注意：只发请求，`subscribe` 才执行）
- **拦截器**：统一 Token、错误码、重试（概念）
- **函数式拦截器（推荐）**：`provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))`，对应 `HttpInterceptorFn`
- **错误处理**：`catchError` + 用户提示；不要把业务错误只 `console.log`
- **REST**：幂等、401 刷新 Token 队列（口述）
- **测试**：`HttpTestingController` 验证请求 URL / body，避免发真实请求

### 3.8 RxJS（Angular 重点）

- **Observable vs Promise**：多值、可取消、懒执行
- **Subscription**：`unsubscribe`；`takeUntilDestroyed()` / `async` pipe 防泄漏
- **创建**：`of`、`from`、`interval`；`Subject` vs `BehaviorSubject` vs `ReplaySubject`
- **常用操作符**：
  - **转换**：`map`、`switchMap`（搜素取消上一次）、`mergeMap`（并发）、`concatMap`（顺序）
  - **过滤**：`filter`、`take`、`debounceTime`、`distinctUntilChanged`
  - **组合**：`combineLatest`、`forkJoin`（全完成才发射）
  - **错误**：`catchError`、`retry`
- **热 vs 冷**：共享 `shareReplay` 场景
- **与 Signal**：`toSignal()` / `toObservable()` 桥接（19+ 常问方向）

### 3.9 架构与状态

- **分层**：Component 薄、Service 承载业务、纯函数 util
- **Smart / Dumb 组件**：容器管数据，展示组件只收 `@Input`
- **状态放哪**：组件内 signal、Service 单例、NgRx（大中台再深讲）
- **Facade 模式**：Service 对外统一 API
- **本仓库例子**：`PracticeStorageService` + `localStorage`；`PermissionService` / `MenuVisibilityService`

### 3.10 CSS（前端岗常带一句）

- **组件样式封装**：Emulated 封装；`:host`、`:host-context`
- **为何少用 `::ng-deep`**：破坏封装；用设计令牌或全局样式替代
- **Flex 布局**：主轴/交叉轴、`flex: 1` 含义
- **响应式**：媒体查询；CDK `BreakpointObserver`（本仓库 layout 用过）
- **BEM / 工具类**：知道即可，按团队规范答

### 3.11 测试与工程

- **单元测试**：Jasmine/Jest + `TestBed.configureTestingModule`
- **组件测试**：DOM 查询、`fixture.detectChanges()`、假服务 `useValue`
- **异步测试**：`fakeAsync` + `tick()` / `flush()`；`whenStable`；`waitForAsync`
- **HTTP 测试**：`HttpTestingController` 模拟请求与响应
- **Component Harness**：`@angular/cdk/testing`（与 Material/ng-zorro 配合更稳）
- **E2E**：Playwright / Cypress 概念（本仓库有 `e2e` 脚本）
- **构建**：`ng build` 生产优化、懒加载 chunk、Tree-shaking 一句
- **Lint / 规范**：ESLint、Prettier、提交前检查

### 3.12 性能与调试

- **变更检测次数**：减少不必要检测；OnPush + 不可变数据
- **列表**：`@for` + `track`；虚拟滚动（大数据）
- **延迟加载视图**：`@defer (on viewport)` / `on idle` / `on interaction`
- **预加载策略**：`withPreloading(PreloadAllModules)` 或自定义
- **首屏 / SSR**：Hydration（`provideClientHydration()`），SSR 与水合差异概念
- **Zoneless（实验）**：`provideExperimentalZonelessChangeDetection()` 一句即可
- **打包体积**：分析 `source-map-explorer` / `ng build --stats-json`（了解）
- **Chrome DevTools**：Network、Performance、Memory 各看什么

### 3.13 浏览器与网络（前端通用题）

- **HTTP 缓存**：`Cache-Control`、`ETag` / `If-None-Match`、304；强缓存 vs 协商缓存
- **CORS**：简单请求 vs 预检（OPTIONS）；`Access-Control-Allow-*` 含义
- **认证**：Cookie + Session vs JWT；`HttpOnly` / `Secure` / `SameSite` 的作用
- **存储**：Cookie / `localStorage` / `sessionStorage` / `IndexedDB` 的容量与生命周期
- **HTTPS / TLS**：握手大意、证书、HSTS（口述即可）
- **HTTP/2 vs HTTP/3**：多路复用、队头阻塞、QUIC 一句话
- **WebSocket vs SSE vs 轮询**：怎么选

### 3.14 安全（前端要会答出 3 条）

- **XSS**：模板默认转义；插入富文本走 `DomSanitizer.bypassSecurityTrustHtml`（谨慎）
- **CSRF**：Angular 内置 XSRF（`HttpClientXsrfModule`/读取 cookie token 写入请求头）
- **CSP**：内容安全策略，禁止内联脚本一句话带过
- **依赖供应链**：`npm audit`、`pnpm audit`、锁文件
- **敏感数据**：Token 别长期放 `localStorage`；优先 HttpOnly Cookie + 后端校验

### 3.15 DOM 与视图查询

- **查询**：`@ViewChild` / `@ViewChildren`、`@ContentChild` / `@ContentChildren`、`viewChild()`（信号版）
- **直接 DOM**：用 `Renderer2` 而非 `nativeElement.innerHTML`，便于 SSR/安全
- **生命周期匹配**：`AfterViewInit` 才能拿到模板里的 `@ViewChild` 引用
- **TemplateRef / ngTemplateOutlet**：模板复用（本仓库 layout 抽屉/侧栏用过）
- **指令**：自定义结构型指令的 `*` 语法糖原理

### 3.16 常见陷阱（被追问时显水平）

- **`ExpressionChangedAfterItHasBeenChecked`**：父子组件在同一帧改了显示中的值；用 `setTimeout` / `markForCheck` 或调整数据流向
- **循环依赖**：服务 A 注入 B，B 又注入 A → 用 `forwardRef` 或拆 facade
- **`OnPush` 不刷新**：输入引用没变；手动 `markForCheck()` / `detectChanges()`
- **`@for` 性能塌方**：缺 `track`、用了对象引用做 key
- **订阅泄漏**：忘记 `unsubscribe`；改用 `async` pipe / `takeUntilDestroyed()`
- **日期/时区**：`new Date(string)` 解析有歧义；展示用 `DatePipe` + 时区参数或 `Intl`
- **`*ngIf` else 套模板**：和 `@if` 新控制流互转时易踩

---

## 4. 算法与手写（前端常见附加题）

不要求 ACM 深度，但不少公司会考 **Easy～Medium**：

- 数组 / 哈希：两数之和、字母异位词、合并区间
- 字符串：有效括号、最长无重复子串
- 链表：反转、环检测
- 树：前序/层序遍历
- **前端场景**：深拷贝（说清局限）、防抖节流实现、LRU、扁平化数组

建议：**写完后口述时间/空间复杂度 + 边界**。

---

## 5. 简历与 STAR（与项目题一体）

对每个 Angular 项目准备：

1. **业务一句话** + 你负责的模块（路由/表单/权限/图表等）。
2. **技术决策**：为何 Standalone、为何 Signal、为何不用 NgRx（真实原因）。
3. **难点**：例如首屏性能、表单复杂校验、路由权限、RxJS 内存泄漏排查 —— 用 **STAR**。
4. **数据**：构建体积、首屏时间、缺陷率（没有就说监控/日志怎么补）。

**可对照本仓库举例（练习时改成你的表述）**：

- 多工具站：**懒加载路由** + Layout 壳 + 响应式侧栏
- 刷题页：**signal 状态** + `localStorage` 持久化 + Excel 导入
- 权限/菜单：**守卫** + 本地显示设置 + 兜底页

---

## 6. 时间盒（任选一种执行）

### 速成 4 周（已有 Vue/React 经验转 Angular）

| 周次 | 重点 |
|------|------|
| 1 | JS 事件循环/闭包/原型 + TS 泛型与工具类型 + 10 道 Easy 算法 |
| 2 | Angular Standalone、DI、模板、Signal；跟官方 Tour of Heroes 或本仓库读路由 |
| 3 | RxJS 核心操作符 + Reactive Form + HttpClient/拦截器概念 |
| 4 | 路由守卫 mock 3 题 + OnPush/性能一页笔记 + 刷 5 道 Medium |

### 稳扎稳打 8～10 周（校招 / 转行）

| 阶段 | 重点 |
|------|------|
| 1～2 周 | 本章 §3.1～3.2 自检 + 算法每周 8 题 |
| 3～4 周 | §3.3～3.5 + 做小 demo（列表+表单+路由） |
| 5～6 周 | §3.7～3.8 RxJS 专项 + 写 1 个带搜索防抖的页面 |
| 7～8 周 | 测试/性能/架构 + 简历项目 STAR 定稿 |
| 9～10 周 | §7 模拟演练清单过 2 轮 + 录音复述 |

---

## 7. 模拟演练清单（自拟）

- [ ] 「从输入 URL 到 Angular 首屏渲染，大致经过哪些步骤？」（可简答：bundle → bootstrap → 根组件 → 路由 outlet）
- [ ] 「`switchMap` 和 `mergeMap` 区别？搜索框用哪个？」
- [ ] 「Signal 和 `BehaviorSubject` 都能存状态，你怎么选？」
- [ ] 「`OnPush` 下子组件何时仍会更新？」
- [ ] 「懒加载路由的原理？如何减小首包？」
- [ ] 「`canActivate` 和 `canActivateChild` 有什么区别？」
- [ ] 「如何防止组件销毁后 RxJS 仍回调导致报错？」
- [ ] 「Reactive Form 如何做动态增删一行？」
- [ ] 「为什么生产环境仍可能看到 Zone.js？」（兼容旧 API / 默认构建）
- [ ] 「你做过的权限/菜单方案：菜单隐藏 vs 路由守卫各解决什么？」
- [ ] 「`@defer` 怎么用？它和懒加载路由有什么区别？」
- [ ] 「`takeUntilDestroyed()` 解决了什么老问题？」
- [ ] 「`input.required()` 和老 `@Input()` 有什么差别？」
- [ ] 「为什么模板里写 `{{ data() }}`？信号在模板里是值还是函数？」
- [ ] 「CORS 简单请求和预检请求有什么区别？」
- [ ] 「Angular 默认怎么防 XSS？什么时候需要 `bypassSecurityTrust*`？」
- [ ] 「`ExpressionChangedAfterItHasBeenChecked` 为什么出现？怎么排查？」

---

## 8. 与本仓库刷题模块的对应

| 分类（`practice.types.ts`） | 建议复习本章章节 |
|----------------------------|------------------|
| `angular-ts` | §3.2、§3.4、§3.9 |
| `angular-js` | §3.1、§3.8（与 TS 交叉） |
| `angular-css` | §3.10 |
| `ios` / 其他 | 用 `ios.job.cursor.md` |

导入 Excel 或内置 seed 后，在 **知识刷题** 页按分类筛选，配合本章 **§3** 做「口述自检」。

---

## 9. 推荐资源（少而精）

- **官方**： [angular.dev](https://angular.dev)（Signals、Standalone、Routing、`@defer`、Hydration）
- **Angular Blog**： [blog.angular.dev](https://blog.angular.dev/)（新版本发布说明，常考点的一手出处）
- **RxJS**： [rxjs.dev](https://rxjs.dev) 操作符文档 + marble 图
- **TypeScript**： [typescriptlang.org Handbook](https://www.typescriptlang.org/docs/handbook/)
- **JS / Web**：MDN（事件循环、Promise、CORS、安全）；《You Don’t Know JS》选读

---

*Version: interview track for Angular 19+ / TS / JS; revise per JD（是否 NgRx、是否 SSR、是否微前端）。*
