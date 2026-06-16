# Angular 面试题库 - 题目标题版
> 来源：`angular.job.questions.codex.md`
> 题目数量：153 题

## 目录

- [JavaScript 基础（11）](#topic-1)
- [JavaScript 异步（4）](#topic-2)
- [JavaScript 手写题（2）](#topic-3)
- [JavaScript 模块化（1）](#topic-4)
- [TypeScript（12）](#topic-5)
- [TypeScript / Angular（1）](#topic-6)
- [TypeScript 工程化（1）](#topic-7)
- [Angular 核心（3）](#topic-8)
- [Angular 模板（2）](#topic-9)
- [Angular 组件通信（1）](#topic-10)
- [Angular 生命周期（2）](#topic-11)
- [Angular 视图查询（1）](#topic-12)
- [Angular 组件（1）](#topic-13)
- [Angular 架构（6）](#topic-14)
- [Angular DI（4）](#topic-15)
- [Angular Pipe（1）](#topic-16)
- [Angular Signals（3）](#topic-17)
- [Angular 模板 / 性能（1）](#topic-18)
- [Angular 性能（6）](#topic-19)
- [Angular 指令（1）](#topic-20)
- [Angular 路由（5）](#topic-21)
- [Angular 部署（1）](#topic-22)
- [Angular 路由 / 权限（1）](#topic-23)
- [Angular 表单（5）](#topic-24)
- [Angular HTTP（3）](#topic-25)
- [Angular HTTP / 鉴权（1）](#topic-26)
- [Angular HTTP / RxJS（1）](#topic-27)
- [Angular 测试（4）](#topic-28)
- [RxJS（9）](#topic-29)
- [RxJS / Angular（1）](#topic-30)
- [RxJS / Signals（1）](#topic-31)
- [Angular 变更检测（5）](#topic-32)
- [前端性能（3）](#topic-33)
- [浏览器基础（1）](#topic-34)
- [浏览器渲染（2）](#topic-35)
- [浏览器事件（1）](#topic-36)
- [浏览器存储（1）](#topic-37)
- [网络 / 缓存（1）](#topic-38)
- [网络 / CORS（1）](#topic-39)
- [网络 / 鉴权（1）](#topic-40)
- [前端安全（3）](#topic-41)
- [网络（1）](#topic-42)
- [Angular 样式（1）](#topic-43)
- [CSS（1）](#topic-44)
- [Angular DOM（1）](#topic-45)
- [前端可访问性（1）](#topic-46)
- [工程化（5）](#topic-47)
- [测试（1）](#topic-48)
- [工程化 / 构建（1）](#topic-49)
- [工程化 / 部署（1）](#topic-50)
- [项目表达（1）](#topic-51)
- [项目表达 / 权限（1）](#topic-52)
- [项目表达 / 表单（1）](#topic-53)
- [项目表达 / API（1）](#topic-54)
- [项目表达 / RxJS（1）](#topic-55)
- [项目表达 / Signals（1）](#topic-56)
- [项目表达 / 性能（1）](#topic-57)
- [项目表达 / 工程化（1）](#topic-58)
- [项目表达 / Bug 定位（1）](#topic-59)
- [项目表达 / 技术取舍（1）](#topic-60)
- [手写题（11）](#topic-61)
- [算法（4）](#topic-62)

<a id="topic-1"></a>

## JavaScript 基础

### 1. `var`、`let`、`const` 有什么区别？为什么现在更推荐 `let` / `const`？

### 2. 什么是词法作用域和闭包？闭包在项目中常见用途有哪些？

### 3. 闭包有什么优点和风险？为什么闭包可能导致内存无法释放？

### 4. JavaScript 原型链是什么？对象属性查找过程是怎样的？

### 5. `new` 操作符大致做了什么？如何手写一个简化版 `new`？

### 6. `this` 的绑定规则有哪些？默认绑定、隐式绑定、显式绑定、new 绑定如何理解？

### 7. 箭头函数的 `this` 和普通函数有什么区别？哪些场景不适合用箭头函数？

### 8. `call`、`apply`、`bind` 有什么区别？分别适合什么场景？

### 9. 如何判断一个值的真实类型？`typeof`、`instanceof`、`Object.prototype.toString` 各有什么局限？

### 10. 可选链 `?.` 和空值合并 `??` 解决什么问题？和 `||` 有什么区别？

### 11. `map`、`forEach`、`filter`、`reduce` 分别适合什么场景？

<a id="topic-2"></a>

## JavaScript 异步

### 12. Promise 有哪些状态？状态变化有什么特点？

### 13. Promise 链式调用如何传值和捕获错误？`then` 和 `catch` 的返回值如何影响后续链路？

### 14. async / await 和 Promise 是什么关系？`try/catch` 如何捕获异步错误？

### 15. 宏任务和微任务的执行顺序是什么？遇到 Promise、setTimeout、async/await 输出顺序题如何分析？

<a id="topic-3"></a>

## JavaScript 手写题

### 16. 防抖和节流有什么区别？搜索输入和滚动监听分别适合哪一个？

### 17. 深拷贝有哪些实现方式？JSON 拷贝、structuredClone、递归拷贝分别有什么坑？

<a id="topic-4"></a>

## JavaScript 模块化

### 18. ESM 和 CommonJS 有什么区别？静态分析、运行时加载、tree-shaking 如何理解？

<a id="topic-5"></a>

## TypeScript

### 19. `type` 和 `interface` 有什么区别？在业务项目里如何选择？

### 20. `any` 和 `unknown` 有什么区别？为什么 `unknown` 更安全？

### 21. `never` 和 `void` 分别表示什么？`never` 适合哪些场景？

### 22. 联合类型和交叉类型有什么区别？分别适合表达什么业务模型？

### 23. 泛型解决什么问题？函数泛型、接口泛型和类型约束如何使用？

### 24. `keyof` 和 `typeof` 在类型系统中如何使用？请举一个业务例子。

### 25. 什么是类型守卫？`typeof`、`in`、`instanceof` 和自定义类型谓词如何收窄类型？

### 26. 什么是可辨识联合？为什么它适合表达业务状态机？

### 27. 条件类型和映射类型是什么？它们如何支撑工具类型？

### 28. `Partial`、`Pick`、`Omit`、`Record` 分别怎么用？能否说出简化实现？

### 29. 类型断言 `as` 和非空断言 `!` 有什么风险？什么时候应该用类型守卫替代？

### 30. 如何用 TypeScript 给后端 API Response 建模？如何表达成功、失败和分页？

<a id="topic-6"></a>

## TypeScript / Angular

### 31. Angular 模板类型检查有什么价值？它能提前发现哪些问题？

<a id="topic-7"></a>

## TypeScript 工程化

### 32. `tsconfig` 中 strict 模式有什么价值？大型项目为什么应该尽量开启严格检查？

<a id="topic-8"></a>

## Angular 核心

### 33. Angular 和 React / Vue 的主要区别是什么？Angular 更适合哪些团队或项目？

### 34. Standalone Component 相比 NgModule 有什么变化？`imports` 显式依赖有什么好处？

### 35. Component、Directive、Pipe 分别解决什么问题？它们在模板中如何协作？

<a id="topic-9"></a>

## Angular 模板

### 36. Angular 数据绑定有哪些方式？插值、属性绑定、事件绑定、双向绑定分别怎么用？

### 37. Angular 新控制流 `@if`、`@for`、`@switch`、`@empty` 有什么特点？和旧 `*ngIf` / `*ngFor` 如何对比？

<a id="topic-10"></a>

## Angular 组件通信

### 38. `@Input` 和 `@Output` 如何实现父子组件通信？什么时候应该改用 Service？

<a id="topic-11"></a>

## Angular 生命周期

### 39. Angular 组件生命周期有哪些？`ngOnInit`、`ngAfterViewInit`、`ngOnDestroy` 分别适合做什么？

### 40. constructor 和 `ngOnInit` 有什么区别？为什么不建议在 constructor 里做复杂业务初始化？

<a id="topic-12"></a>

## Angular 视图查询

### 41. `ViewChild` 和 `ContentChild` 有什么区别？它们和组件模板、内容投影有什么关系？

<a id="topic-13"></a>

## Angular 组件

### 42. 内容投影 `<ng-content>` 解决什么问题？多 slot 投影如何设计？

<a id="topic-14"></a>

## Angular 架构

### 43. Service 为什么通常用来放业务逻辑？如何避免 Component 变胖？

### 44. 如何设计一个统一 API Service？请求构建、错误映射、类型约束和测试如何处理？

### 45. Smart / Dumb 组件是什么？为什么它能降低组件耦合？

### 46. 组件内 signal、Service + Signal、NgRx 分别适合什么状态规模？

### 47. Facade 模式解决什么问题？它如何隐藏 API、状态和副作用细节？

### 48. 服务之间循环依赖如何产生？如何通过拆分 Facade、接口或依赖方向解决？

<a id="topic-15"></a>

## Angular DI

### 49. Angular 依赖注入的基本原理是什么？Provider、Injector、Token 如何理解？

### 50. Provider 的作用域有哪些？`providedIn: root` 和组件级 providers 有什么区别？

### 51. `inject()` 相比构造函数注入有什么特点？适合在哪些场景使用？

### 52. `InjectionToken` 解决什么问题？为什么不能只用接口作为 DI token？

<a id="topic-16"></a>

## Angular Pipe

### 53. 纯管道和非纯管道有什么区别？为什么非纯管道可能影响性能？

<a id="topic-17"></a>

## Angular Signals

### 54. Angular Signals 解决什么问题？`signal`、`computed`、`effect` 分别做什么？

### 55. `effect` 适合什么副作用？为什么在 effect 里乱写 signal 可能导致循环？

### 56. `input()`、`input.required()`、`model()`、`output()` 这类信号 API 相比装饰器版有什么变化？

<a id="topic-18"></a>

## Angular 模板 / 性能

### 57. `@for` 中为什么必须重视 `track`？track key 选不好会造成什么问题？

<a id="topic-19"></a>

## Angular 性能

### 58. `@defer` 可以解决什么性能问题？`@placeholder`、`@loading`、`@error` 分别有什么作用？

### 59. `trackBy` 或 `@for track` 为什么能优化列表？大列表还可以怎么优化？

### 60. Pipe 为什么要区分 pure 和 impure？非纯管道为什么可能造成性能问题？

### 61. 如何减少 Angular 应用首屏 bundle 体积？懒加载、tree-shaking、CommonJS warning 如何处理？

### 62. 如何排查和优化一个很慢的列表页面？

### 63. SSR、SSG、Hydration 分别是什么？它们主要解决什么性能或 SEO 问题？

<a id="topic-20"></a>

## Angular 指令

### 64. `HostBinding` 和 `HostListener` 有什么作用？适合写什么类型的指令？

<a id="topic-21"></a>

## Angular 路由

### 65. Angular 路由懒加载有什么好处？`loadComponent` 和 `loadChildren` 分别适合什么场景？

### 66. Route Guard 有哪些类型？`canActivate`、`canActivateChild`、`canMatch` 有什么区别？

### 67. Resolver 的作用是什么？它和组件内请求数据有什么取舍？

### 68. ActivatedRoute 如何读取路由参数？snapshot 和 paramMap Observable 有什么区别？

### 69. Router Events 可以做什么？如何用导航事件实现全局 loading 或埋点？

<a id="topic-22"></a>

## Angular 部署

### 70. 静态部署到 GitHub Pages 时刷新 404 是什么原因？HashLocation 和 404 fallback 如何解决？

<a id="topic-23"></a>

## Angular 路由 / 权限

### 71. 菜单隐藏和路由守卫分别解决什么问题？为什么不能只隐藏菜单？

<a id="topic-24"></a>

## Angular 表单

### 72. Reactive Forms 和 Template-driven Forms 有什么区别？复杂业务表单更推荐哪一种？

### 73. FormControl、FormGroup、FormArray 分别是什么？动态表单应该如何建模？

### 74. 如何实现自定义同步校验和异步校验？校验错误如何展示？

### 75. 强类型表单解决什么问题？它如何减少表单字段和提交数据的类型错误？

### 76. `setValue`、`patchValue`、`getRawValue` 有什么区别？禁用字段对取值有什么影响？

<a id="topic-25"></a>

## Angular HTTP

### 77. HttpClient 为什么返回 Observable？为什么不 subscribe 就不会真正发请求？

### 78. Http Interceptor 可以做什么？如何统一处理 Token、错误和 loading？

### 79. 函数式拦截器 `HttpInterceptorFn` 和类拦截器有什么区别？

<a id="topic-26"></a>

## Angular HTTP / 鉴权

### 80. 如何处理 Token 注入和过期刷新？如何避免多个请求同时刷新 Token？

<a id="topic-27"></a>

## Angular HTTP / RxJS

### 81. Angular 里如何取消 HTTP 请求？`switchMap`、`takeUntilDestroyed`、AbortSignal 分别如何理解？

<a id="topic-28"></a>

## Angular 测试

### 82. 如何用 `HttpTestingController` 测试 HTTP 请求？它相比真实请求有什么好处？

### 83. Angular 组件测试里 TestBed、fixture、detectChanges 分别是什么？

### 84. `fakeAsync`、`tick`、`flush`、`whenStable` 分别适合测试什么异步场景？

### 85. 组件测试中如何 Mock 一个 Service？`useValue`、`useClass`、spy 分别怎么用？

<a id="topic-29"></a>

## RxJS

### 86. Observable 和 Promise 有什么区别？多值、懒执行、取消能力如何理解？

### 87. Subject、BehaviorSubject、ReplaySubject、AsyncSubject 有什么区别？

### 88. `switchMap`、`mergeMap`、`concatMap`、`exhaustMap` 有什么区别？分别适合什么场景？

### 89. 搜索框防抖、去重、取消旧请求应该如何用 RxJS 实现？

### 90. `combineLatest` 和 `forkJoin` 有什么区别？多个接口并发后合并结果如何选择？

### 91. 如何避免 RxJS 订阅内存泄漏？AsyncPipe、takeUntil、takeUntilDestroyed 如何选择？

### 92. `shareReplay` 有什么作用和坑？缓存接口结果时要注意什么？

### 93. `catchError` 放在内层和外层有什么区别？为什么位置会影响流是否终止？

### 94. 冷 Observable 和热 Observable 有什么区别？HttpClient 返回的是冷还是热？

<a id="topic-30"></a>

## RxJS / Angular

### 95. AsyncPipe 有什么好处？它如何自动订阅和取消订阅？

<a id="topic-31"></a>

## RxJS / Signals

### 96. `toSignal()` 和 `toObservable()` 适合放在什么边界？Angular Signals 和 RxJS 如何选择？

<a id="topic-32"></a>

## Angular 变更检测

### 97. Zone.js 在 Angular 中做了什么？为什么异步任务会触发变更检测？

### 98. Default 和 OnPush 变更检测策略有什么区别？OnPush 为什么能优化性能？

### 99. OnPush 下哪些情况会触发检查？输入引用、事件、async pipe、signal 分别如何触发？

### 100. `markForCheck` 和 `detectChanges` 有什么区别？什么时候使用？

### 101. `ExpressionChangedAfterItHasBeenChecked` 是什么原因？应该如何从数据流上修复？

<a id="topic-33"></a>

## 前端性能

### 102. FCP、LCP、CLS、INP、TTI 分别衡量什么？前端优化如何量化？

### 103. Chrome DevTools 的 Network、Performance、Memory 面板分别适合排查什么？

### 104. Web Worker 适合解决什么问题？在 Angular 中使用时要注意什么？

<a id="topic-34"></a>

## 浏览器基础

### 105. 浏览器从输入 URL 到页面展示经历了什么？DNS、TCP、TLS、解析渲染如何串起来？

<a id="topic-35"></a>

## 浏览器渲染

### 106. DOM、CSSOM、Render Tree、Layout、Paint、Composite 分别是什么？

### 107. 回流和重绘有什么区别？如何减少 DOM 操作造成的性能问题？

<a id="topic-36"></a>

## 浏览器事件

### 108. 事件捕获、目标、冒泡阶段是什么？事件委托为什么能提升性能？

<a id="topic-37"></a>

## 浏览器存储

### 109. localStorage、sessionStorage、Cookie、IndexedDB 有什么区别？分别适合存什么？

<a id="topic-38"></a>

## 网络 / 缓存

### 110. HTTP 强缓存和协商缓存有什么区别？Cache-Control、ETag、304 如何理解？

<a id="topic-39"></a>

## 网络 / CORS

### 111. CORS 是什么？简单请求和预检请求有什么区别？服务端如何配置跨域？

<a id="topic-40"></a>

## 网络 / 鉴权

### 112. Cookie + Session 和 JWT 有什么区别？HttpOnly、Secure、SameSite 分别解决什么问题？

<a id="topic-41"></a>

## 前端安全

### 113. XSS 是什么？Angular 默认模板转义能防什么？什么时候 DomSanitizer 会有风险？

### 114. CSRF 是什么？SameSite Cookie、CSRF Token、Angular XSRF 机制如何防范？

### 115. CSP 是什么？它如何降低 XSS 风险？

<a id="topic-42"></a>

## 网络

### 116. WebSocket、SSE、轮询有什么区别？实时消息场景如何选择？

<a id="topic-43"></a>

## Angular 样式

### 117. Angular 组件样式封装如何理解？`:host`、`:host-context`、`::ng-deep` 分别是什么？

<a id="topic-44"></a>

## CSS

### 118. Flex 和 Grid 分别适合什么布局？`flex: 1` 具体表示什么？

<a id="topic-45"></a>

## Angular DOM

### 119. 为什么 Angular 中不建议随便直接操作 DOM？Renderer2、ElementRef、innerHTML 分别有什么风险？

<a id="topic-46"></a>

## 前端可访问性

### 120. 前端可访问性要关注哪些基础点？按钮语义、label、键盘操作、ARIA 如何理解？

<a id="topic-47"></a>

## 工程化

### 121. Angular CLI production build 大致做了什么？优化、压缩、hash、chunk 如何理解？

### 122. package-lock 的作用是什么？为什么团队项目需要提交锁文件？

### 123. npm、pnpm、yarn 有什么区别？pnpm 为什么能节省磁盘空间？

### 124. Angular 项目如何做多环境配置？dev、staging、prod 如何区分？

### 125. 如何设计前端 CI/CD？从提交到部署一般有哪些步骤？

<a id="topic-48"></a>

## 测试

### 126. 单元测试、组件测试、E2E 测试分别测什么？如何决定测试边界？

<a id="topic-49"></a>

## 工程化 / 构建

### 127. 为什么 CommonJS 依赖可能影响构建优化？Angular 构建中的 CommonJS warning 如何处理？

<a id="topic-50"></a>

## 工程化 / 部署

### 128. Angular 静态项目发布到 GitHub Pages 要注意什么？base-href、404.html、路由模式如何处理？

<a id="topic-51"></a>

## 项目表达

### 129. 请用 3 分钟介绍一个 Angular 项目：业务背景、职责、技术栈、难点、结果。

<a id="topic-52"></a>

## 项目表达 / 权限

### 130. 讲一个权限路由或菜单权限案例：菜单隐藏、路由守卫、无权限兜底分别怎么设计？

<a id="topic-53"></a>

## 项目表达 / 表单

### 131. 讲一个复杂表单案例：动态字段、校验、错误展示、提交模型如何设计？

<a id="topic-54"></a>

## 项目表达 / API

### 132. 讲一个 API 层封装案例：类型、拦截器、错误、重试、loading、测试如何处理？

<a id="topic-55"></a>

## 项目表达 / RxJS

### 133. 讲一个 RxJS 异步流案例：搜索、取消旧请求、并发合并、错误处理如何设计？

<a id="topic-56"></a>

## 项目表达 / Signals

### 134. 讲一个 Signal 状态管理案例：状态、派生状态、副作用、持久化如何组织？

<a id="topic-57"></a>

## 项目表达 / 性能

### 135. 讲一个 Angular 性能优化案例：指标、工具、瓶颈、方案和结果是什么？

<a id="topic-58"></a>

## 项目表达 / 工程化

### 136. 讲一个前端 CI/CD 或 GitHub Pages 发布案例：构建、测试、产物、部署和回滚如何处理？

<a id="topic-59"></a>

## 项目表达 / Bug 定位

### 137. 讲一个你定位过的复杂前端 Bug：现象、复现、定位、根因、修复和预防。

<a id="topic-60"></a>

## 项目表达 / 技术取舍

### 138. 讲一次 Angular 项目里的技术取舍：Signals vs RxJS、Service vs NgRx、SSR vs SPA 等如何决策？

<a id="topic-61"></a>

## 手写题

### 139. 手写 debounce，并说明立即执行版和非立即执行版如何实现。

### 140. 手写 throttle，并说明时间戳版和定时器版有什么差异。

### 141. 手写 Promise.all，需要处理顺序、失败、空数组和非 Promise 值。

### 142. 手写 Promise.race，它和 Promise.all 的行为有什么区别？

### 143. 手写 new 操作符，并解释原型链接和构造函数返回对象的规则。

### 144. 手写 instanceof，并解释它如何沿原型链查找。

### 145. 手写 bind，需要考虑参数预置和作为构造函数调用的情况。

### 146. 手写 EventEmitter，支持 on、off、once、emit。

### 147. 手写数组扁平化 flat，支持指定展开深度。

### 148. 手写 curry，并说明它和函数组合 compose 的区别。

### 149. 手写 LRU Cache，为什么通常用 Map 或哈希表 + 双向链表？

<a id="topic-62"></a>

## 算法

### 150. 两数之和如何实现？为什么哈希表可以把时间复杂度降到 O(n)？

### 151. 有效括号如何判断？为什么栈适合这个问题？

### 152. 最长无重复子串如何用滑动窗口解决？

### 153. 二分查找如何避免边界错误？左闭右闭和左闭右开有什么区别？
