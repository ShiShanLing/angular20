# Angular + JavaScript + TypeScript Job Interview Roadmap

> 目标：面向前端求职和晋升考核，系统准备 Angular、JavaScript、TypeScript、浏览器、工程化、性能优化和项目表达。  
> 适用对象：准备前端校招、社招、Angular 专项岗位、全栈前端岗位、晋升答辩。  
> 建议周期：`8-16 周`集中准备，之后持续补项目、源码和工程经验。
> 技术栈假设：Angular 19+、Standalone Component、Signals、RxJS 7、TypeScript 5；UI 库可以是 ng-zorro 或 Angular Material。

## 能力模型

Angular + JS + TS 通常覆盖 7 类能力：

1. JavaScript 语言基础与运行机制。
2. TypeScript 类型系统和工程使用能力。
3. Angular 框架核心：组件、模板、指令、服务、依赖注入、路由、表单、HttpClient。
4. RxJS 与异步状态管理。
5. 浏览器基础：事件循环、渲染、缓存、网络、安全。
6. 前端工程化：构建、测试、Lint、CI/CD、模块化、部署。
7. 项目经验表达、性能优化、问题定位和技术取舍。

准备时不要只背概念。每个知识点都应该做到：

1. 能解释它是什么。
2. 能写出最小 Demo。
3. 能说出项目里怎么用。
4. 能讲常见坑。
5. 能说出一点底层或原理。

## 阶段 1：JavaScript 高频基础

### 必会知识

- 变量声明：`var`、`let`、`const`
- 作用域与词法作用域
- 变量提升
- 闭包
- 原型与原型链
- `this` 绑定规则
- `call`、`apply`、`bind`
- 执行上下文
- 事件循环
- 宏任务与微任务
- Promise
- async / await
- 数组与对象常用方法
- 深拷贝与浅拷贝
- 类型判断
- 隐式类型转换
- 防抖与节流
- 模块化：ESM、CommonJS

### 高频题

- `var`、`let`、`const` 有什么区别？
- 什么是闭包？闭包有什么优缺点？
- JavaScript 原型链是什么？
- `this` 的绑定规则有哪些？
- 箭头函数的 `this` 有什么特点？
- `call`、`apply`、`bind` 有什么区别？
- Promise 的状态有哪些？
- Promise 链式调用如何传值和捕获错误？
- async / await 和 Promise 是什么关系？
- 宏任务和微任务的执行顺序是什么？
- 如何实现防抖和节流？
- 如何判断一个值的真实类型？
- 深拷贝有哪些实现方式和坑？
- ESM 和 CommonJS 有什么区别？

### 练习任务

- 手写 `debounce`。
- 手写 `throttle`。
- 手写 `Promise.all`。
- 手写 `new`。
- 手写 `call` / `bind`。
- 手写深拷贝。
- 写一段事件循环输出顺序题并解释。

### 回答模板

回答 JS 基础题可以按这个顺序：

1. 先给概念。
2. 再说执行机制。
3. 再写一个小例子。
4. 最后补常见坑或项目场景。

## 阶段 2：TypeScript 高频基础

### 必会知识

- 基础类型
- 联合类型
- 交叉类型
- 字面量类型
- 类型别名 `type`
- 接口 `interface`
- 泛型
- 类型约束
- 类型推断
- 类型断言
- 类型守卫
- `keyof`
- `typeof`
- `in`
- `infer`
- 映射类型
- 条件类型
- 工具类型：`Partial`、`Required`、`Pick`、`Omit`、`Record`、`ReturnType`
- `unknown` 和 `any`
- `never`
- 枚举
- 装饰器基础
- `tsconfig`

### 高频题

- `type` 和 `interface` 有什么区别？
- `any` 和 `unknown` 有什么区别？
- `never` 适合什么场景？
- 联合类型和交叉类型有什么区别？
- 泛型解决什么问题？
- `keyof` 和 `typeof` 怎么用？
- 什么是类型守卫？
- 条件类型和映射类型是什么？
- `Partial`、`Pick`、`Omit`、`Record` 如何实现？
- TypeScript 如何提升大型项目可维护性？
- TS 类型只在编译期存在，这句话怎么理解？
- Angular 里泛型常用在哪些地方？

### 练习任务

- 手写 `Partial<T>`。
- 手写 `Pick<T, K>`。
- 手写 `Omit<T, K>`。
- 手写 `Readonly<T>`。
- 写一个泛型 API Response 类型。
- 写一个表单字段配置类型。
- 写一个类型安全的事件总线类型。

### 检查标准

- 能用 TS 类型约束业务模型。
- 能写常见工具类型。
- 能解释 `unknown` 比 `any` 安全在哪里。
- 能在 Angular 项目中设计清晰的接口类型。

## 阶段 3：Angular 核心基础

### 必会知识

- Angular 项目结构
- Standalone Component
- NgModule 了解
- Component
- Template
- Data Binding
- Property Binding
- Event Binding
- Two-way Binding
- Directive
- Pipe
- Service
- Dependency Injection
- Provider
- Component Lifecycle
- Input / Output
- Content Projection
- ViewChild / ContentChild
- HostBinding / HostListener
- Template Reference Variable
- Angular Signals
- `signal`
- `computed`
- `effect`
- `inject()`
- `input()` / `output()` 了解
- Change Detection
- Zone.js
- Angular 新控制流：`@if`、`@for`、`@switch`、`@empty`
- `@defer` 延迟加载视图

### 高频题

- Angular 和 React / Vue 的主要区别是什么？
- Component、Directive、Pipe 分别解决什么问题？
- Angular 数据绑定有哪些方式？
- `@Input` 和 `@Output` 如何通信？
- Angular 组件生命周期有哪些？
- `ngOnInit` 和 constructor 有什么区别？
- `ViewChild` 和 `ContentChild` 有什么区别？
- Service 为什么通常用来放业务逻辑？
- Angular 依赖注入的基本原理是什么？
- Provider 的作用域有哪些？
- Standalone Component 相比 NgModule 有什么变化？
- Pipe 分为纯管道和非纯管道，有什么区别？
- Angular Signals 解决什么问题？
- `signal`、`computed`、`effect` 分别适合什么场景？
- `inject()` 相比构造函数注入有什么特点？
- Angular 新控制流相比 `*ngIf` / `*ngFor` 有什么变化？
- `@defer` 可以解决什么性能问题？

### 练习任务

- 写一个 Todo List。
- 写一个搜索过滤组件。
- 写一个自定义 Directive。
- 写一个自定义 Pipe。
- 写一个父子组件通信 Demo。
- 写一个 Service + DI Demo。
- 写一个使用 Signals 的状态 Demo。
- 写一个 `@for` + `track` 的列表 Demo。
- 写一个 `@defer` 延迟加载重组件 Demo。

### Angular 19+ 补盘

- Standalone：组件通过 `imports` 显式声明依赖，不再必须依赖 NgModule 组织页面。
- 新控制流：`@if`、`@for`、`@switch` 更贴近语言结构，`@for` 必须重视 `track`。
- Signals：`signal` 保存状态，`computed` 做派生，`effect` 做副作用，但不要在 effect 中随意写回导致循环。
- 信号输入输出：`input()`、`input.required()`、`model()`、`output()` 是新 API，能说出方向即可。
- 信号查询：`viewChild()`、`contentChild()` 可以把查询结果作为 signal 使用。
- `takeUntilDestroyed()`：在组件销毁时自动取消 RxJS 订阅，减少手动 Subject 样板代码。
- Signal/RxJS 桥接：`toSignal(observable$)` 和 `toObservable(signal)` 适合在边界转换，不建议全项目盲目互转。
- Zoneless：了解 `provideExperimentalZonelessChangeDetection()`，知道它依赖更显式的状态变更驱动。

## 阶段 4：Angular 路由、表单与 HTTP

### 必会知识

- Router
- Route Config
- Lazy Loading
- Route Guard
- `canActivate`
- `canActivateChild`
- `canMatch`
- Resolver
- ActivatedRoute
- Router Events
- Query Params
- Hash Location
- Reactive Forms
- Typed Forms
- Template-driven Forms
- FormControl
- FormGroup
- FormArray
- Validator
- Async Validator
- HttpClient
- Interceptor
- Functional Interceptor
- Error Handling
- Loading State
- Retry
- Cancel Request
- HttpTestingController

### 高频题

- Angular 路由懒加载有什么好处？
- Route Guard 有哪些类型？分别适合什么场景？
- `canActivate`、`canActivateChild`、`canMatch` 有什么区别？
- Resolver 的作用是什么？
- ActivatedRoute 如何读取路由参数？
- snapshot 和 paramMap Observable 有什么区别？
- GitHub Pages 这类静态部署为什么容易遇到刷新 404？
- Reactive Forms 和 Template-driven Forms 有什么区别？
- 强类型表单解决什么问题？
- FormGroup、FormControl、FormArray 分别是什么？
- 如何实现自定义表单校验？
- HttpClient 如何统一处理错误？
- Interceptor 可以做什么？
- 函数式拦截器 `HttpInterceptorFn` 和类拦截器有什么区别？
- 如何处理 Token 注入和刷新？
- Angular 里如何取消请求？
- 如何设计一个统一 API Service？
- 如何用 `HttpTestingController` 测试 HTTP 请求？

### 练习任务

- 做一个登录页和权限路由。
- 做一个用户列表 + 详情路由。
- 做一个复杂表单：动态字段、同步校验、异步校验。
- 封装一个 API Service。
- 写一个 Token Interceptor。
- 写一个全局错误处理和 loading 方案。
- 写一个 `canActivateChild` 权限守卫 Demo。
- 写一个 `HttpTestingController` 请求测试 Demo。

## 阶段 5：RxJS 与异步状态管理

### 必会知识

- Observable
- Observer
- Subscription
- Subject
- BehaviorSubject
- ReplaySubject
- AsyncSubject
- 常用操作符：
  - `map`
  - `filter`
  - `tap`
  - `switchMap`
  - `mergeMap`
  - `concatMap`
  - `exhaustMap`
  - `debounceTime`
  - `distinctUntilChanged`
  - `combineLatest`
  - `forkJoin`
  - `catchError`
  - `retry`
- `takeUntil`
- `takeUntilDestroyed`
- `shareReplay`
- `toSignal`
- `toObservable`
- 冷 Observable 与热 Observable
- 取消订阅
- 内存泄漏
- AsyncPipe
- Angular Signals 与 RxJS 互操作

### 高频题

- Observable 和 Promise 有什么区别？
- Subject 和 BehaviorSubject 有什么区别？
- `switchMap`、`mergeMap`、`concatMap`、`exhaustMap` 有什么区别？
- 搜索框防抖应该怎么写？
- 多个接口并发后合并结果怎么做？
- 如何避免 RxJS 订阅内存泄漏？
- AsyncPipe 有什么好处？
- `takeUntilDestroyed()` 相比手动 `destroy$` 有什么好处？
- `shareReplay` 有什么作用和坑？
- `catchError` 放在内层和外层有什么区别？
- Angular Signals 和 RxJS 如何选择？
- `toSignal()` / `toObservable()` 适合放在什么边界？

### 练习任务

- 写一个搜索框：防抖、去重、取消旧请求。
- 写一个多接口并发加载页。
- 写一个 Subject 事件流 Demo。
- 写一个 `takeUntilDestroyed` 自动取消订阅 Demo。
- 写一个 `shareReplay` 缓存接口结果 Demo。
- 写一个 Observable 转 Signal 展示列表状态的 Demo。

## 阶段 6：Angular 变更检测与性能优化

### 必会知识

- Change Detection
- Zone.js
- Default Strategy
- OnPush Strategy
- Signals 与 OnPush
- `ChangeDetectorRef`
- `markForCheck`
- `detectChanges`
- TrackBy
- `@for track`
- Pure Pipe
- Lazy Loading
- `@defer`
- Preloading Strategy
- Bundle Splitting
- Tree Shaking
- SSR / SSG 了解
- Hydration 了解
- Virtual Scroll
- Web Worker
- 性能指标：
  - FCP
  - LCP
  - CLS
  - INP
  - TTI

### 高频题

- Angular 变更检测是如何触发的？
- Zone.js 在 Angular 中做了什么？
- Signal 如何减少不必要的变更检测心智负担？
- OnPush 策略有什么作用？
- OnPush 下哪些情况会触发检查？
- `markForCheck` 和 `detectChanges` 有什么区别？
- `trackBy` 为什么能优化列表？
- `@for` 里为什么必须认真选择稳定的 `track` key？
- Pipe 为什么要区分 pure 和 impure？
- `@defer`、懒加载和预加载分别解决什么问题？
- 如何优化一个很慢的列表页面？
- 如何减少首屏 bundle 体积？
- Angular 应用首屏慢怎么排查？
- 如何定位页面卡顿？

### 练习任务

- 写一个 OnPush 组件 Demo。
- 写一个不加 `trackBy` 和加 `trackBy` 的列表对比。
- 写一个 `@for track` 使用错误导致 DOM 重建的对比 Demo。
- 用 Angular DevTools 看变更检测。
- 给路由加懒加载。
- 分析一次 production bundle。
- 优化一个大列表页面。

## 阶段 7：浏览器、网络与安全

### 必会知识

- 浏览器渲染流程
- DOM
- CSSOM
- Render Tree
- Layout
- Paint
- Composite
- 回流与重绘
- 事件捕获与冒泡
- 事件委托
- localStorage
- sessionStorage
- IndexedDB
- Cookie
- HttpOnly Cookie
- HTTP / HTTPS
- DNS
- TCP
- TLS
- HTTP/2 / HTTP/3 了解
- WebSocket / SSE / 轮询
- CORS
- 缓存策略
- XSS
- CSRF
- CSP
- SameSite Cookie
- HSTS

### 高频题

- 浏览器从输入 URL 到页面展示经历了什么？
- 回流和重绘有什么区别？
- 如何减少 DOM 操作造成的性能问题？
- 事件捕获、目标、冒泡阶段是什么？
- 事件委托为什么能提升性能？
- localStorage、sessionStorage、Cookie 有什么区别？
- Cookie + Session 和 JWT 有什么区别？
- HTTP 缓存有哪些？
- 强缓存和协商缓存有什么区别？
- CORS 是什么？如何解决跨域？
- 简单请求和预检请求有什么区别？
- XSS 如何防范？
- CSRF 如何防范？
- Angular 默认模板转义能防哪些 XSS？什么时候 `DomSanitizer` 会有风险？
- HTTPS 解决了什么问题？
- WebSocket、SSE、轮询分别适合什么场景？

### 练习任务

- 写一个事件委托 Demo。
- 写一个 localStorage 封装。
- 用 DevTools 分析一次页面加载。
- 配置一个缓存响应头 Demo。
- 写一个 XSS 风险示例和防范方案。

### CSS、DOM 与可访问性补盘

- 组件样式封装：理解 Emulated、`:host`、`:host-context`。
- 少用 `::ng-deep`：它会破坏样式封装，优先用全局样式、设计 token 或组件 API。
- Flex / Grid：能解释主轴、交叉轴、`flex: 1`、响应式布局。
- DOM 操作：优先数据驱动；必须操作 DOM 时了解 `Renderer2`，不要随便 `nativeElement.innerHTML`。
- 视图查询：`ViewChild`、`ViewChildren`、`ContentChild`、`ContentChildren`，以及信号版查询 API。
- `TemplateRef` / `ngTemplateOutlet`：适合抽象可复用模板。
- A11y：按钮语义、表单 label、键盘可达、ARIA 只在语义不足时补充。

## 阶段 8：工程化与质量保障

### 必会知识

- Angular CLI
- Vite / esbuild 了解
- Webpack 基础
- npm / pnpm / yarn
- package-lock
- ESM / CJS
- ESLint
- Prettier
- Husky
- lint-staged
- 单元测试
- 组件测试
- TestBed
- fakeAsync / tick / flush
- HttpTestingController
- E2E 测试
- Karma / Jasmine
- Jest / Vitest
- Playwright / Cypress
- CI/CD
- 环境配置
- Docker 了解
- 静态部署
- GitHub Pages
- Nginx

### 高频题

- Angular CLI 构建大致做了什么？
- package-lock 的作用是什么？
- npm、pnpm、yarn 有什么区别？
- 如何做多环境配置？
- 如何设计前端 CI/CD？
- 单元测试、组件测试、E2E 测试分别测什么？
- `fakeAsync`、`tick`、`flush` 适合测试什么？
- Angular 组件测试里 `fixture.detectChanges()` 做了什么？
- 如何 Mock 一个 Service？
- 如何提高前端项目质量？
- 如何处理依赖升级风险？
- 为什么 CommonJS 依赖可能影响构建优化？
- 静态前端项目部署时刷新 404 怎么处理？

### 练习任务

- 配置一个 production build。
- 写 10 个组件单元测试。
- 写 3 个 Service 测试，包含 Mock 依赖。
- 写 2 个 `fakeAsync` 异步测试。
- 写 3 个 Playwright E2E 测试。
- 配置 GitHub Actions。
- 部署到 GitHub Pages。
- 处理一次前端路由刷新 404。

## 阶段 9：项目经验包装

### 项目表达结构

每个项目准备 3 分钟版本和 10 分钟版本。

### 3 分钟版本

1. 项目是什么，服务什么用户。
2. 你负责什么模块。
3. 技术栈是什么。
4. 最有代表性的难点是什么。
5. 你怎么解决，结果如何。

### 10 分钟版本

1. 业务背景。
2. 前端架构。
3. 模块划分。
4. 状态管理。
5. 权限与路由。
6. 表单与接口。
7. 性能优化。
8. 测试与发布。
9. 复盘和改进空间。

### 必备项目素材

- 一个复杂表单案例。
- 一个权限路由案例。
- 一个 API 封装案例。
- 一个 RxJS 异步流案例。
- 一个 Signal 状态管理案例。
- 一个性能优化案例。
- 一个工程化或 CI/CD 案例。
- 一个线上 Bug 定位案例。
- 一个技术选型或重构案例。

### 对照本仓库可准备的项目案例

- 刷题页：Signal 状态、computed 派生、本地存储、Excel 导入、每日 5 题和语音播报。
- 权限/菜单：`canActivateChild` 守卫、菜单权限过滤、无权限兜底页。
- 路由与部署：GitHub Pages 静态部署、`base-href`、404 fallback。
- UI 组件：ng-zorro 按钮、弹窗、消息提示和业务组件组合。
- 工程发布：`npm run build:gh`、`angular-cli-ghpages`、源码分支和 gh-pages 分支发布。
- 性能警示：SCSS budget warning、CommonJS dependency warning 如何解释和处理。

### 常追问

- 这个模块为什么这样设计？
- 有没有替代方案？
- 如何验证方案有效？
- 如何处理异常和边界？
- 如果数据量扩大 10 倍怎么办？
- 如何测试这个模块？
- 线上出问题怎么定位？
- 如果让你重做，你会怎么改？

## 阶段 9.5：Angular 架构、状态与常见陷阱

### 架构与状态

- 分层：Component 保持薄，Service 承载业务逻辑，纯函数 util 处理可复用逻辑。
- Smart / Dumb 组件：容器组件管数据和副作用，展示组件通过输入输出通信。
- 状态放哪里：组件内状态用 signal，跨页面共享状态可放 Service，复杂中后台再考虑 NgRx。
- Service + Signal vs NgRx：前者简单直接，后者适合复杂全局状态、时间旅行、严格单向数据流和团队规范。
- Facade 模式：对组件暴露统一状态和方法，隐藏 API、缓存、权限和错误处理细节。

### 常见陷阱

- `ExpressionChangedAfterItHasBeenChecked`：同一轮检查后又改了已展示值，优先调整数据流，少用 setTimeout 硬压。
- OnPush 不刷新：输入引用没变、手动订阅没触发检查，考虑不可变更新、async pipe、signal 或 `markForCheck()`。
- RxJS 订阅泄漏：忘记取消订阅，优先 async pipe 或 `takeUntilDestroyed()`。
- `shareReplay` 泄漏：不理解 refCount 和缓存生命周期，导致源 Observable 长期不释放。
- `@for` 性能问题：缺少稳定 `track`，或用对象引用导致 DOM 大量重建。
- 循环依赖：Service A 注入 B，B 又注入 A，考虑拆接口、拆 Facade 或调整依赖方向。
- 日期和时区：`new Date(string)` 解析可能有歧义，展示用 `DatePipe` 或 `Intl` 时明确时区。
- 直接 DOM 和富文本：`innerHTML`、`bypassSecurityTrustHtml` 要格外谨慎。

## 阶段 10：算法与手写题

### 高频算法方向

- 数组
- 字符串
- 哈希表
- 双指针
- 滑动窗口
- 栈
- 队列
- 链表
- 二叉树
- 排序
- 二分查找
- 动态规划基础

### 高频手写题

- 防抖 debounce
- 节流 throttle
- 深拷贝 deepClone
- Promise.all
- Promise.race
- Promise.allSettled
- 手写 new
- 手写 instanceof
- 手写 call / apply / bind
- EventEmitter
- LRU Cache
- 数组扁平化
- 函数组合 compose
- 柯里化 curry

### 检查标准

- 能写出正确代码。
- 能解释边界条件。
- 能说出时间复杂度。
- 能解释在项目中的实际应用。

## 阶段 11：冲刺时间表

### 第 1-2 周：JS + TS 基础

- JS 作用域、闭包、原型、this。
- Promise、async / await、事件循环。
- TS 泛型、工具类型、类型守卫。
- 每天 2 道手写题。

### 第 3-4 周：Angular 核心

- 组件、模板、指令、管道。
- 生命周期、父子通信。
- DI、Service、Provider。
- 路由、表单、HttpClient。
- 做一个完整 CRUD Demo。

### 第 5-6 周：RxJS + 性能

- Observable、Subject、常用操作符。
- 搜索防抖、请求取消、并发合并。
- 变更检测、OnPush、trackBy。
- Bundle 分析和首屏优化。

### 第 7-8 周：浏览器 + 工程化 + 项目表达

- 浏览器渲染、缓存、安全。
- 测试、CI/CD、部署。
- 整理项目案例。
- 模拟演练。

### 第 9-12 周：强化与查漏补缺

- 高频题复刷。
- 手写题复刷。
- 项目深挖。
- 简历优化。
- 针对目标公司补专题。

## 每日复习模板

### 上午

- 复习 3 个知识点。
- 每个知识点写一段自己的回答。

### 下午

- 做 1 个 Demo 或手写题。
- 做 2 道算法题。

### 晚上

- 复盘项目经历。
- 模拟回答 5 个练习题。
- 记录不会的问题。

## 每周产出

- 一份知识点总结。
- 一个可运行 Demo。
- 一份手写题代码。
- 一份错题清单。
- 一次模拟演练记录。

## 回答原则

1. 先给结论。
2. 再解释原理。
3. 补一个代码或项目例子。
4. 主动说边界和坑。
5. 不会的问题说分析路径，不硬编。

## 常用回答框架

### 原理题

1. 它是什么。
2. 解决什么问题。
3. 大致流程。
4. 常见坑。
5. 项目中怎么用。

### 方案题

1. 业务背景。
2. 约束条件。
3. 方案设计。
4. 取舍原因。
5. 验证方式。
6. 后续优化。

### Bug 定位题

1. 现象是什么。
2. 如何复现。
3. 如何缩小范围。
4. 用了哪些工具。
5. 根因是什么。
6. 怎么修复。
7. 如何防止再次发生。

## 简历准备

### 技术栈描述

避免写：

- 熟悉 Angular。
- 熟悉 JavaScript。
- 熟悉 TypeScript。
- 熟悉 RxJS。

建议写：

- 使用 Angular Standalone Component、Reactive Forms、Router 和 HttpClient 独立开发业务模块。
- 使用 TypeScript 泛型和接口约束 API 响应、表单模型和组件输入输出。
- 使用 RxJS 处理搜索防抖、请求取消、多接口合并和状态流转。
- 使用 OnPush、trackBy、懒加载和 bundle 分析优化页面性能。
- 使用 Playwright / Jasmine 编写关键流程测试，并接入 CI/CD。

### 项目描述模板

```text
项目名称：
业务背景：
技术栈：
负责模块：
核心难点：
解决方案：
量化结果：
复盘改进：
```

### 项目亮点示例

- 将首屏加载时间从 X 秒降低到 Y 秒。
- 将某复杂表单拆成配置驱动，减少重复代码。
- 用 RxJS 实现搜索防抖、请求取消和结果缓存。
- 用 OnPush + trackBy 优化大列表渲染。
- 封装统一 API 层，支持鉴权、错误处理和重试。
- 接入 E2E 测试，覆盖核心业务流程。

## 高频知识点清单

### 必背但不能只背

- 闭包
- 原型链
- this
- Promise
- 事件循环
- async / await
- 防抖节流
- TypeScript 泛型
- `type` vs `interface`
- `any` vs `unknown`
- Angular 生命周期
- 依赖注入
- 路由守卫
- Reactive Forms
- Http Interceptor
- RxJS switchMap
- 取消订阅
- 变更检测
- OnPush
- trackBy
- 浏览器缓存
- XSS / CSRF
- 前端性能优化

### 容易加分

- Angular Signals
- Standalone Component
- Zone.js 原理
- RxJS 高阶映射操作符对比
- `shareReplay` 缓存与泄漏风险
- 类型体操基础
- Bundle 分析
- Web Vitals
- SSR / Hydration 了解
- CI/CD 实战
- 线上问题复盘

## 模拟题库

### JavaScript

- 闭包是什么？项目中哪里用过？
- 原型链是什么？如何实现继承？
- `this` 在普通函数和箭头函数里有什么区别？
- Promise 和 async / await 的关系是什么？
- 事件循环输出顺序题如何分析？
- 防抖和节流分别适合什么场景？
- 深拷贝为什么难？

### TypeScript

- `type` 和 `interface` 如何选择？
- 泛型约束怎么写？
- `unknown` 为什么比 `any` 安全？
- 条件类型和映射类型是什么？
- 如何给 API 响应建模？
- 如何让组件输入输出类型安全？

### Angular

- Angular 组件生命周期说一下。
- constructor 和 `ngOnInit` 有什么区别？
- Angular DI 是什么？
- Provider 作用域有哪些？
- 路由懒加载怎么配置？
- Reactive Forms 如何做动态表单？
- Interceptor 如何处理 Token？
- Angular Signals 适合什么场景？

### RxJS

- Observable 和 Promise 有什么区别？
- `switchMap` 和 `mergeMap` 有什么区别？
- 搜索框防抖如何实现？
- 多个接口并发如何合并？
- 如何避免订阅泄漏？
- `shareReplay` 有什么坑？

### 性能与工程化

- Angular 首屏慢怎么排查？
- OnPush 为什么能优化性能？
- 大列表渲染怎么优化？
- 如何减少 bundle 体积？
- 前端路由刷新 404 怎么解决？
- 如何设计前端 CI/CD？

### 项目

- 你项目中最复杂的 Angular 模块是什么？
- 你如何设计权限路由？
- 你如何封装 API 层？
- 你遇到过最难的线上 Bug 是什么？
- 你做过哪些性能优化？
- 如果重构这个项目，你会怎么做？

## 最终验收标准

准备完成时，你应该能够：

- 讲清 80 个以上前端高频题。
- 手写 15 个以上 JS / TS 高频题。
- 准备 3 个以上 Angular 项目深挖案例。
- 准备 2 个性能优化案例。
- 准备 1 个 RxJS 异步流案例。
- 准备 1 个工程化或 CI/CD 案例。
- 每个简历项目都能讲 10 分钟。
- 遇到不会的问题能给出合理分析路径。

## 最推荐的准备方式

1. 用一个 Angular 项目串起所有知识点。
2. 每个高频题都写一个最小 Demo。
3. 每天口述 5 个问题。
4. 每周做一次模拟演练。
5. 把不会的问题整理成错题本。
6. 用“项目场景 + 原理 + 取舍 + 指标”回答高级问题。
