# Angular 面试题库

> 来源：`angular.job.questions.codex.json`
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

- 难度：Easy
- ID：`ng-js-var-let-const`
- 口述一句话：var 函数作用域且会提升，let/const 块级作用域更安全。

**参考答案：**

var 是函数作用域且有变量提升，允许重复声明；let 和 const 是块级作用域，有暂时性死区，不允许同作用域重复声明。const 只是绑定不可重新赋值，不代表对象内容不可变。现代代码优先 const，确实要重新赋值再用 let，基本避免 var。

---

### 2. 什么是词法作用域和闭包？闭包在项目中常见用途有哪些？

- 难度：Medium
- ID：`ng-js-scope-closure`
- 口述一句话：闭包就是函数记住了定义时的外部作用域。

**参考答案：**

词法作用域指变量查找由代码书写位置决定。闭包是函数和它能访问的外部词法环境的组合，即使外部函数执行完，内部函数仍能访问那些变量。项目里常用于缓存、函数工厂、事件回调保留状态和防抖节流。

---

### 3. 闭包有什么优点和风险？为什么闭包可能导致内存无法释放？

- 难度：Medium
- ID：`ng-js-closure-leak`
- 口述一句话：闭包能保状态，也会延长被捕获对象的生命周期。

**参考答案：**

闭包优点是可以封装私有状态、延长变量生命周期；风险是如果闭包长期被保存，它引用的外部对象也无法释放，可能导致内存占用增长。尤其 DOM 节点、大对象、组件实例被闭包捕获时要注意及时解绑或置空。

---

### 4. JavaScript 原型链是什么？对象属性查找过程是怎样的？

- 难度：Medium
- ID：`ng-js-prototype-chain`
- 口述一句话：原型链就是对象属性查找的向上委托链。

**参考答案：**

每个对象都有原型，对象读取属性时先查自身，找不到就沿原型链向上查，直到 null。函数有 prototype，实例的原型通常指向构造函数的 prototype。原型链是 JS 复用方法和实现继承的基础。

---

### 5. `new` 操作符大致做了什么？如何手写一个简化版 `new`？

- 难度：Medium
- ID：`ng-js-new-operator`
- 口述一句话：new 做四件事：建对象、接原型、绑 this、返回对象。

**参考答案：**

new 会创建一个新对象，把它的原型指向构造函数的 prototype，以新对象作为 this 执行构造函数，最后如果构造函数返回对象就用该对象，否则返回新对象。核心是创建对象、连原型、绑定 this、处理返回值。

---

### 6. `this` 的绑定规则有哪些？默认绑定、隐式绑定、显式绑定、new 绑定如何理解？

- 难度：Medium
- ID：`ng-js-this-binding`
- 口述一句话：this 看调用方式，不看函数在哪里定义。

**参考答案：**

this 取决于调用方式：普通函数直接调用是默认绑定，作为对象方法调用是隐式绑定，call/apply/bind 是显式绑定，new 调用是 new 绑定。优先级通常是 new 高于 bind，高于 call/apply，高于对象调用，高于默认绑定。

---

### 7. 箭头函数的 `this` 和普通函数有什么区别？哪些场景不适合用箭头函数？

- 难度：Medium
- ID：`ng-js-arrow-this`
- 口述一句话：箭头函数的 this 来自定义时外层作用域。

**参考答案：**

箭头函数没有自己的 this，它捕获外层词法作用域的 this，也不能作为构造函数，没有 arguments。适合回调里保留外层 this；不适合对象方法、原型方法、构造函数、需要动态 this 的事件处理。

---

### 8. `call`、`apply`、`bind` 有什么区别？分别适合什么场景？

- 难度：Easy
- ID：`ng-js-call-apply-bind`
- 口述一句话：call/apply 立即执行，bind 返回新函数。

**参考答案：**

call 和 apply 都是立即调用函数并指定 this，区别是 call 参数逐个传，apply 参数用数组。bind 不立即调用，而是返回一个绑定好 this 和部分参数的新函数。可补一句：bind 常用于回调保留 this。

---

### 9. 如何判断一个值的真实类型？`typeof`、`instanceof`、`Object.prototype.toString` 各有什么局限？

- 难度：Medium
- ID：`ng-js-type-detect`
- 口述一句话：类型判断常用 typeof、instanceof 和 Object.prototype.toString 组合。

**参考答案：**

typeof 适合判断基本类型，但 null 会返回 object，数组和对象都返回 object；instanceof 判断原型链，但跨 iframe 可能失效；Object.prototype.toString.call(value) 更通用，可区分 Array、Date、RegExp 等内置类型。

---

### 10. 可选链 `?.` 和空值合并 `??` 解决什么问题？和 `||` 有什么区别？

- 难度：Easy
- ID：`ng-js-nullish-optional`
- 口述一句话：?. 防空访问，?? 只处理 null 和 undefined。

**参考答案：**

可选链 ?. 用于安全读取可能为空的属性或方法，避免 Cannot read property。?? 只在左侧是 null 或 undefined 时取右侧，和 || 不同，|| 会把 0、空字符串、false 也当成默认值。

---

### 11. `map`、`forEach`、`filter`、`reduce` 分别适合什么场景？

- 难度：Easy
- ID：`ng-js-array-methods`
- 口述一句话：数组方法按目的选：转 map，筛 filter，累 reduce，遍历 forEach。

**参考答案：**

map 用于一对一转换并返回新数组；forEach 只遍历不关心返回值；filter 用于筛选元素；reduce 用于累计成任意结果，比如求和、分组、转换对象。选择时看目标是转换、遍历、筛选还是归约。

---

<a id="topic-2"></a>

## JavaScript 异步

### 12. Promise 有哪些状态？状态变化有什么特点？

- 难度：Easy
- ID：`ng-js-promise-states`
- 口述一句话：Promise 状态一旦从 pending 落定，就不可再改变。

**参考答案：**

Promise 有 pending、fulfilled、rejected 三种状态。状态只能从 pending 变为 fulfilled 或 rejected，且一旦改变就不可再变。then/catch 注册回调，回调会进入微任务队列。

---

### 13. Promise 链式调用如何传值和捕获错误？`then` 和 `catch` 的返回值如何影响后续链路？

- 难度：Medium
- ID：`ng-js-promise-chain-error`
- 口述一句话：Promise 链靠返回值传递结果，靠 throw/reject 传递错误。

**参考答案：**

then 返回新的 Promise，回调返回普通值会传给下一个 then，返回 Promise 会等待它完成，抛错或返回 rejected 会进入后续 catch。catch 处理后如果返回正常值，链路会恢复 fulfilled；如果继续抛错，后续仍是 rejected。

---

### 14. async / await 和 Promise 是什么关系？`try/catch` 如何捕获异步错误？

- 难度：Medium
- ID：`ng-js-async-await-promise`
- 口述一句话：async/await 是 Promise 的语法糖，让异步流程更像同步代码。

**参考答案：**

async 函数总是返回 Promise；await 会等待 Promise 结果，并把异步流程写成同步形式。await 后面的 rejected 会像 throw 一样被 try/catch 捕获。async/await 只是语法层更易读，本质仍建立在 Promise 和微任务之上。

---

### 15. 宏任务和微任务的执行顺序是什么？遇到 Promise、setTimeout、async/await 输出顺序题如何分析？

- 难度：Hard
- ID：`ng-js-event-loop-order`
- 口述一句话：事件循环口诀：同步先跑，微任务清空，再下一个宏任务。

**参考答案：**

事件循环先执行当前同步代码，清空微任务队列，再取一个宏任务执行，然后继续清空微任务。Promise.then、queueMicrotask、await 后续属于微任务；setTimeout、setInterval、DOM 事件多属于宏任务。输出顺序题先同步，再微任务，再宏任务。

---

<a id="topic-3"></a>

## JavaScript 手写题

### 16. 防抖和节流有什么区别？搜索输入和滚动监听分别适合哪一个？

- 难度：Medium
- ID：`ng-js-debounce-throttle`
- 口述一句话：防抖等停下来执行，节流按固定频率执行。

**参考答案：**

防抖是连续触发后只在停止一段时间后执行一次，适合搜索输入、窗口 resize。节流是在固定时间间隔内最多执行一次，适合滚动、拖拽、鼠标移动。防抖关注最后一次，节流关注稳定频率。

---

### 17. 深拷贝有哪些实现方式？JSON 拷贝、structuredClone、递归拷贝分别有什么坑？

- 难度：Medium
- ID：`ng-js-deep-clone`
- 口述一句话：深拷贝难点是循环引用和特殊对象。

**参考答案：**

浅拷贝只复制第一层引用，深拷贝要递归复制嵌套对象。JSON 方案简单但会丢失函数、undefined、Symbol、Date、Map、循环引用等；structuredClone 更强但不支持函数；手写递归要处理循环引用、特殊对象和原型。

---

<a id="topic-4"></a>

## JavaScript 模块化

### 18. ESM 和 CommonJS 有什么区别？静态分析、运行时加载、tree-shaking 如何理解？

- 难度：Medium
- ID：`ng-js-esm-commonjs`
- 口述一句话：ESM 静态、利于 tree-shaking；CommonJS 偏运行时。

**参考答案：**

CommonJS 主要运行时加载，module.exports 导出，require 引入；ESM 是语言标准，import/export 静态结构更利于 tree-shaking。ESM 绑定是 live binding，CommonJS 导出更像值快照或对象引用。现代前端优先 ESM。

---

<a id="topic-5"></a>

## TypeScript

### 19. `type` 和 `interface` 有什么区别？在业务项目里如何选择？

- 难度：Medium
- ID：`ng-ts-type-interface`
- 口述一句话：interface 偏对象契约，type 偏类型表达能力。

**参考答案：**

interface 更适合描述对象结构和可扩展 API，支持声明合并；type 更灵活，可以表达联合、交叉、条件、映射等复杂类型。业务里对象模型常用 interface，复杂类型组合常用 type。

---

### 20. `any` 和 `unknown` 有什么区别？为什么 `unknown` 更安全？

- 难度：Medium
- ID：`ng-ts-any-unknown`
- 口述一句话：unknown 是安全版 any，使用前必须收窄。

**参考答案：**

any 会关闭类型检查，任何操作都允许；unknown 表示未知类型，使用前必须做类型收窄。unknown 比 any 安全，因为它逼你先判断类型再访问属性或调用方法，适合外部输入、JSON、错误对象。

---

### 21. `never` 和 `void` 分别表示什么？`never` 适合哪些场景？

- 难度：Medium
- ID：`ng-ts-never-void`
- 口述一句话：void 是不返回有用值，never 是不可能有值。

**参考答案：**

void 表示函数没有有意义的返回值；never 表示永远不会产生值，比如抛错、死循环、或联合类型穷尽检查后不可能到达的分支。never 常用于状态机穷尽检查，帮助发现漏处理的 case。

---

### 22. 联合类型和交叉类型有什么区别？分别适合表达什么业务模型？

- 难度：Medium
- ID：`ng-ts-union-intersection`
- 口述一句话：联合是二选一，交叉是都要有。

**参考答案：**

联合类型 A | B 表示值可以是 A 或 B，需要收窄后使用特有属性；交叉类型 A & B 表示同时具备 A 和 B 的能力。联合适合多状态、多返回；交叉适合组合多个对象能力。

---

### 23. 泛型解决什么问题？函数泛型、接口泛型和类型约束如何使用？

- 难度：Medium
- ID：`ng-ts-generics-basics`
- 口述一句话：泛型是类型参数，解决复用和类型安全。

**参考答案：**

泛型把类型作为参数，让函数、接口、类在保持类型安全的同时复用逻辑。extends 可以约束泛型必须具备某些字段或能力。比如 APIResponse<T> 可以让不同接口复用响应结构，同时保留 data 的具体类型。

---

### 24. `keyof` 和 `typeof` 在类型系统中如何使用？请举一个业务例子。

- 难度：Medium
- ID：`ng-ts-keyof-typeof`
- 口述一句话：keyof 取键，typeof 从值反推类型。

**参考答案：**

keyof 取一个类型的键名联合，typeof 在类型位置可以从变量反推出类型。常见例子是根据配置对象生成类型，或写 getValue<T, K extends keyof T>(obj, key) 保证 key 一定存在。

---

### 25. 什么是类型守卫？`typeof`、`in`、`instanceof` 和自定义类型谓词如何收窄类型？

- 难度：Medium
- ID：`ng-ts-type-guard`
- 口述一句话：类型守卫让运行时判断变成编译期类型收窄。

**参考答案：**

类型守卫是在运行时判断类型，并让 TS 在分支内收窄类型。常用 typeof 判断基本类型，in 判断属性，instanceof 判断实例，自定义谓词如 value is User 封装复杂判断。

---

### 26. 什么是可辨识联合？为什么它适合表达业务状态机？

- 难度：Hard
- ID：`ng-ts-discriminated-union`
- 口述一句话：可辨识联合用一个 tag 字段表达状态机。

**参考答案：**

可辨识联合是在每个成员里放一个固定字面量字段，比如 status: loading/success/error。判断 status 后 TS 能自动收窄到对应类型。它非常适合表达请求状态、表单状态、业务流程状态机。

---

### 27. 条件类型和映射类型是什么？它们如何支撑工具类型？

- 难度：Hard
- ID：`ng-ts-conditional-mapped`
- 口述一句话：条件类型做分支，映射类型遍历属性。

**参考答案：**

条件类型形如 T extends U ? X : Y，根据类型关系产生新类型；映射类型遍历 keyof T 生成新对象类型。Partial、Readonly、Pick 等工具类型都依赖映射类型，ReturnType 等常结合 infer。

---

### 28. `Partial`、`Pick`、`Omit`、`Record` 分别怎么用？能否说出简化实现？

- 难度：Hard
- ID：`ng-ts-utility-partial-pick-omit`
- 口述一句话：工具类型是把已有类型按规则变形。

**参考答案：**

Partial<T> 把属性变可选，Pick<T,K> 选出部分属性，Omit<T,K> 排除部分属性，Record<K,V> 构造键值映射。它们能减少重复类型定义，让表单、列表、DTO、配置更容易维护。

---

### 29. 类型断言 `as` 和非空断言 `!` 有什么风险？什么时候应该用类型守卫替代？

- 难度：Medium
- ID：`ng-ts-assertion-risk`
- 口述一句话：断言是绕过检查，类型守卫才是证明类型。

**参考答案：**

as 和 ! 会告诉编译器相信你，但不会改变运行时值；如果判断错了，运行时仍会报错。能用类型守卫、可选链、默认值或更准确的类型建模时，就不要滥用断言。非空断言尤其容易隐藏空值 bug。

---

### 30. 如何用 TypeScript 给后端 API Response 建模？如何表达成功、失败和分页？

- 难度：Medium
- ID：`ng-ts-api-response-model`
- 口述一句话：API 类型建模用泛型承载 data，用联合表达成功失败。

**参考答案：**

可以设计 ApiResponse<T> 表达通用响应，data 用泛型保留具体类型；分页可用 PageResult<T> 表示 list、total、page、pageSize；失败可用可辨识联合表达 success 和 error。核心是让接口层和业务层都有明确类型。

---

<a id="topic-6"></a>

## TypeScript / Angular

### 31. Angular 模板类型检查有什么价值？它能提前发现哪些问题？

- 难度：Medium
- ID：`ng-ts-template-check`
- 口述一句话：模板类型检查让 HTML 模板也享受 TS 的安全网。

**参考答案：**

Angular 模板类型检查能在编译期发现属性不存在、输入输出类型不匹配、空值未处理、事件类型错误等问题。它把模板也纳入 TypeScript 安全范围，能减少运行时页面错误。

---

<a id="topic-7"></a>

## TypeScript 工程化

### 32. `tsconfig` 中 strict 模式有什么价值？大型项目为什么应该尽量开启严格检查？

- 难度：Medium
- ID：`ng-ts-tsconfig-strict`
- 口述一句话：strict 提高前期约束，换长期可维护性。

**参考答案：**

strict 会开启一组严格检查，如 strictNullChecks、noImplicitAny、strictFunctionTypes 等。大型项目开启 strict 可以更早发现空值、any 扩散和类型不一致问题，代价是初期类型编写成本更高。

---

<a id="topic-8"></a>

## Angular 核心

### 33. Angular 和 React / Vue 的主要区别是什么？Angular 更适合哪些团队或项目？

- 难度：Medium
- ID：`ng-angular-react-vue-diff`
- 口述一句话：Angular 是完整框架，适合强规范的大型业务应用。

**参考答案：**

Angular 是完整框架，内置路由、表单、DI、HttpClient、构建规范；React 更像 UI 库，生态自由度高；Vue 上手轻，渐进式强。Angular 更适合中大型团队、强规范、复杂表单和企业后台项目。

---

### 34. Standalone Component 相比 NgModule 有什么变化？`imports` 显式依赖有什么好处？

- 难度：Medium
- ID：`ng-angular-standalone`
- 口述一句话：Standalone 让组件自带依赖声明，减少 NgModule 心智。

**参考答案：**

Standalone Component 不再必须声明在 NgModule 中，组件通过 imports 显式声明依赖。好处是依赖更清晰、懒加载更直接、组件更独立，也更符合现代 Angular 的推荐写法。NgModule 仍需了解，用于存量项目。

---

### 35. Component、Directive、Pipe 分别解决什么问题？它们在模板中如何协作？

- 难度：Easy
- ID：`ng-angular-component-directive-pipe`
- 口述一句话：组件管视图，指令管行为，管道管展示转换。

**参考答案：**

Component 是带模板的视图单元；Directive 给已有 DOM 或组件增加行为，分结构型和属性型；Pipe 用于模板中的展示转换。三者配合：组件组织页面，指令增强行为，管道处理展示格式。

---

<a id="topic-9"></a>

## Angular 模板

### 36. Angular 数据绑定有哪些方式？插值、属性绑定、事件绑定、双向绑定分别怎么用？

- 难度：Easy
- ID：`ng-angular-data-binding`
- 口述一句话：Angular 数据绑定分插值、属性、事件和双向绑定。

**参考答案：**

插值 {{ }} 展示文本，属性绑定 [prop] 传 DOM/组件属性，事件绑定 (event) 监听用户行为，双向绑定 [(ngModel)] 同时读写状态。Angular 推荐数据驱动视图，避免直接操作 DOM。

---

### 37. Angular 新控制流 `@if`、`@for`、`@switch`、`@empty` 有什么特点？和旧 `*ngIf` / `*ngFor` 如何对比？

- 难度：Medium
- ID：`ng-angular-new-control-flow`
- 口述一句话：新控制流更清晰，@for 要认真写 track。

**参考答案：**

新控制流 @if、@for、@switch 更像语言结构，模板更清晰；@for 明确要求 track，有助于性能；@empty 处理空列表也更直观。旧 *ngIf/*ngFor 在存量项目仍常见，都要能读。

---

<a id="topic-10"></a>

## Angular 组件通信

### 38. `@Input` 和 `@Output` 如何实现父子组件通信？什么时候应该改用 Service？

- 难度：Easy
- ID：`ng-angular-input-output`
- 口述一句话：Input 向下传数据，Output 向上传事件。

**参考答案：**

@Input 接收父组件传入数据，@Output 通过 EventEmitter 或 output() 向父组件发事件。简单父子通信用输入输出；跨层级、跨页面或共享状态更适合 Service、路由参数或状态管理。

---

<a id="topic-11"></a>

## Angular 生命周期

### 39. Angular 组件生命周期有哪些？`ngOnInit`、`ngAfterViewInit`、`ngOnDestroy` 分别适合做什么？

- 难度：Medium
- ID：`ng-angular-lifecycle`
- 口述一句话：生命周期按输入变化、初始化、内容视图完成、销毁来记。

**参考答案：**

常见生命周期有 constructor、ngOnChanges、ngOnInit、ngAfterContentInit、ngAfterViewInit、ngOnDestroy。ngOnInit 适合初始化业务数据，AfterViewInit 适合访问 ViewChild，ngOnDestroy 适合取消订阅、清理计时器和释放资源。

---

### 40. constructor 和 `ngOnInit` 有什么区别？为什么不建议在 constructor 里做复杂业务初始化？

- 难度：Medium
- ID：`ng-angular-constructor-oninit`
- 口述一句话：constructor 管注入，ngOnInit 管 Angular 初始化后的业务启动。

**参考答案：**

constructor 是 TypeScript 类实例化阶段，主要用于依赖注入和轻量字段初始化；ngOnInit 是 Angular 初始化完输入绑定后调用，适合发请求、初始化业务状态。复杂业务放 constructor 可能拿不到 Input，也不利于测试。

---

<a id="topic-12"></a>

## Angular 视图查询

### 41. `ViewChild` 和 `ContentChild` 有什么区别？它们和组件模板、内容投影有什么关系？

- 难度：Medium
- ID：`ng-angular-viewchild-contentchild`
- 口述一句话：ViewChild 查自己模板，ContentChild 查投影内容。

**参考答案：**

ViewChild 查询组件自己模板里的元素或子组件；ContentChild 查询外部投影进来的内容。ViewChild 通常在 ngAfterViewInit 后可靠，ContentChild 通常在 ngAfterContentInit 后可靠。区别在“自己模板”还是“投影内容”。

---

<a id="topic-13"></a>

## Angular 组件

### 42. 内容投影 `<ng-content>` 解决什么问题？多 slot 投影如何设计？

- 难度：Medium
- ID：`ng-angular-content-projection`
- 口述一句话：ng-content 让组件提供壳，内容由外部投影进来。

**参考答案：**

内容投影让父组件把一段模板塞进子组件的 ng-content 位置，适合卡片、弹窗、布局容器等。多 slot 可以用 select 区分不同区域。它让组件结构可复用，同时内容由调用方决定。

---

<a id="topic-14"></a>

## Angular 架构

### 43. Service 为什么通常用来放业务逻辑？如何避免 Component 变胖？

- 难度：Medium
- ID：`ng-angular-service-business`
- 口述一句话：Service 放业务和状态，Component 负责展示和交互。

**参考答案：**

Service 适合承载可复用业务逻辑、数据访问、状态和副作用，让 Component 保持薄，只负责展示和用户交互。避免 Component 变胖的方法是把 API、缓存、权限、计算逻辑拆进 Service 或纯函数。

---

### 44. 如何设计一个统一 API Service？请求构建、错误映射、类型约束和测试如何处理？

- 难度：Hard
- ID：`ng-http-api-service-design`
- 口述一句话：API 层要统一类型、错误、鉴权、重试和测试。

**参考答案：**

统一 API Service 应包含类型化 Endpoint、请求参数、响应模型、错误映射、鉴权、重试、日志和测试替身。组件不应直接拼 URL 或处理所有 HTTP 细节，而应调用清晰的业务方法。

---

### 45. Smart / Dumb 组件是什么？为什么它能降低组件耦合？

- 难度：Medium
- ID：`ng-architecture-smart-dumb`
- 口述一句话：Smart 管数据，Dumb 管展示。

**参考答案：**

Smart 组件负责取数据、处理状态和副作用；Dumb 组件只接收输入、发出事件并展示 UI。这样可以提高复用性、测试性，减少展示组件对业务服务和路由的依赖。

---

### 46. 组件内 signal、Service + Signal、NgRx 分别适合什么状态规模？

- 难度：Hard
- ID：`ng-architecture-service-signal-ngrx`
- 口述一句话：状态方案看规模：局部 signal，共享 Service，大型复杂再 NgRx。

**参考答案：**

组件局部状态适合 signal；跨组件共享但逻辑不复杂可用 Service + Signal；复杂全局状态、严格单向数据流、审计和大型团队协作可考虑 NgRx。不要为了“高级”过早引入 NgRx。

---

### 47. Facade 模式解决什么问题？它如何隐藏 API、状态和副作用细节？

- 难度：Medium
- ID：`ng-architecture-facade`
- 口述一句话：Facade 给组件一个干净门面，隐藏复杂实现。

**参考答案：**

Facade 对组件暴露统一状态和方法，内部隐藏 API 调用、缓存、权限、错误处理和状态流转。它能让组件更薄，也方便未来从 Service + Signal 切到 NgRx 或其他状态方案。

---

### 48. 服务之间循环依赖如何产生？如何通过拆分 Facade、接口或依赖方向解决？

- 难度：Hard
- ID：`ng-architecture-circular-deps`
- 口述一句话：循环依赖要调边界和方向，不只靠 forwardRef。

**参考答案：**

循环依赖常来自服务互相注入或模块边界不清。解决方式包括抽出公共接口/工具，调整依赖方向，拆 Facade，使用事件或回调反转依赖。forwardRef 只是临时手段，不应掩盖架构问题。

---

<a id="topic-15"></a>

## Angular DI

### 49. Angular 依赖注入的基本原理是什么？Provider、Injector、Token 如何理解？

- 难度：Hard
- ID：`ng-angular-di-basics`
- 口述一句话：DI = 用 Token 找 Provider，由 Injector 提供实例。

**参考答案：**

Angular DI 通过 Injector 根据 Token 查找 Provider，创建或返回依赖实例。Token 可以是类、InjectionToken 等；Provider 描述如何创建值。组件、路由、应用根都有注入层级，子级可以覆盖父级依赖。

---

### 50. Provider 的作用域有哪些？`providedIn: root` 和组件级 providers 有什么区别？

- 难度：Medium
- ID：`ng-angular-provider-scope`
- 口述一句话：Provider 放在哪里，实例作用域就在哪里。

**参考答案：**

providedIn: root 通常是应用级单例；组件级 providers 会为该组件子树创建独立实例；路由级 provider 可以和懒加载边界绑定。作用域不同会影响状态共享、生命周期和内存。

---

### 51. `inject()` 相比构造函数注入有什么特点？适合在哪些场景使用？

- 难度：Medium
- ID：`ng-angular-inject-function`
- 口述一句话：inject() 是函数式 DI，只能在注入上下文使用。

**参考答案：**

inject() 是函数式注入写法，常用于字段初始化、函数式守卫、函数式拦截器和工具函数中。它比构造函数注入更灵活，但必须在注入上下文里调用，不能在任意异步回调里随便用。

---

### 52. `InjectionToken` 解决什么问题？为什么不能只用接口作为 DI token？

- 难度：Hard
- ID：`ng-angular-injection-token`
- 口述一句话：InjectionToken 给配置和接口抽象一个运行时注入标识。

**参考答案：**

接口在 TypeScript 编译后不存在，不能作为运行时 DI token。InjectionToken 可以为非类依赖、配置对象、接口抽象提供运行时 token，也能带泛型增强类型提示。

---

<a id="topic-16"></a>

## Angular Pipe

### 53. 纯管道和非纯管道有什么区别？为什么非纯管道可能影响性能？

- 难度：Medium
- ID：`ng-angular-pipe-pure-impure`
- 口述一句话：纯管道看输入引用变化，非纯管道会频繁执行。

**参考答案：**

纯管道只在输入引用变化时执行，性能更好；非纯管道每次变更检测都可能执行，适合少量必须追踪内部变化的场景。复杂计算应优先纯管道、computed 或提前缓存，避免非纯管道拖慢页面。

---

<a id="topic-17"></a>

## Angular Signals

### 54. Angular Signals 解决什么问题？`signal`、`computed`、`effect` 分别做什么？

- 难度：Medium
- ID：`ng-angular-signals-basics`
- 口述一句话：signal 存状态，computed 派生状态，effect 处理副作用。

**参考答案：**

signal 保存可写状态，computed 基于 signal 派生只读状态，effect 在依赖变化时执行副作用。Signals 让状态依赖更明确，减少手动订阅和部分变更检测心智，适合组件局部状态和服务状态。

---

### 55. `effect` 适合什么副作用？为什么在 effect 里乱写 signal 可能导致循环？

- 难度：Hard
- ID：`ng-angular-effect-risk`
- 口述一句话：effect 做副作用，不要拿它替代 computed 写派生状态。

**参考答案：**

effect 适合日志、同步外部系统、localStorage 持久化等副作用。风险是如果在 effect 中修改它依赖的 signal，可能形成循环触发；业务派生状态应优先 computed，而不是 effect 里手动同步。

---

### 56. `input()`、`input.required()`、`model()`、`output()` 这类信号 API 相比装饰器版有什么变化？

- 难度：Medium
- ID：`ng-angular-signal-input-output`
- 口述一句话：信号 IO 让组件输入输出更自然接入 Signals。

**参考答案：**

input()/output() 是新式信号化组件 API，让输入更容易参与 computed 等响应式派生。input.required() 表示必传输入，model() 支持双向绑定语义。装饰器版仍常见，新 API 更贴近 Signals 心智。

---

<a id="topic-18"></a>

## Angular 模板 / 性能

### 57. `@for` 中为什么必须重视 `track`？track key 选不好会造成什么问题？

- 难度：Medium
- ID：`ng-angular-for-track`
- 口述一句话：track 是列表 diff 的身份标识，稳定 id 最靠谱。

**参考答案：**

track 用来告诉 Angular 列表项的稳定身份，避免数据变化时大量销毁重建 DOM。应选择稳定唯一 key，如 id，不要随便用对象引用或 index。key 选不好会导致状态错乱、动画异常和性能下降。

---

<a id="topic-19"></a>

## Angular 性能

### 58. `@defer` 可以解决什么性能问题？`@placeholder`、`@loading`、`@error` 分别有什么作用？

- 难度：Hard
- ID：`ng-angular-defer`
- 口述一句话：@defer 把非关键视图延后加载，改善首屏。

**参考答案：**

@defer 可以延迟加载非首屏或重组件，减少初始渲染和 bundle 压力。@placeholder 显示占位，@loading 显示加载状态，@error 显示失败状态。触发条件可按视口、交互、空闲等配置。

---

### 59. `trackBy` 或 `@for track` 为什么能优化列表？大列表还可以怎么优化？

- 难度：Medium
- ID：`ng-performance-trackby`
- 口述一句话：trackBy 让列表更新复用 DOM，减少重建。

**参考答案：**

trackBy 或 @for track 给每个列表项稳定身份，数据更新时 Angular 能复用 DOM，而不是全部销毁重建。大列表还可以配合虚拟滚动、分页、OnPush、缓存计算结果和减少复杂子组件。

---

### 60. Pipe 为什么要区分 pure 和 impure？非纯管道为什么可能造成性能问题？

- 难度：Medium
- ID：`ng-performance-pipe`
- 口述一句话：非纯管道会频繁执行，重逻辑别放里面。

**参考答案：**

纯管道只在输入引用变化时运行，适合格式化和轻计算；非纯管道每轮检测都可能运行，若逻辑重会拖慢页面。复杂计算应预处理、memoize、computed 或放到服务层。

---

### 61. 如何减少 Angular 应用首屏 bundle 体积？懒加载、tree-shaking、CommonJS warning 如何处理？

- 难度：Hard
- ID：`ng-performance-bundle`
- 口述一句话：首屏体积优化靠懒加载、按需引入和 ESM 依赖。

**参考答案：**

减少首屏 bundle 可做路由懒加载、@defer、移除无用依赖、优先 ESM、避免大库全量引入、开启 production build 和 tree-shaking。CommonJS warning 说明依赖不利于静态优化，应换 ESM 版本或配置允许但评估体积。

---

### 62. 如何排查和优化一个很慢的列表页面？

- 难度：Hard
- ID：`ng-performance-slow-list`
- 口述一句话：慢列表先定位瓶颈，再从 DOM 数量和变更检测下手。

**参考答案：**

先用 Performance/Angular DevTools 找瓶颈：是否变更检测过多、DOM 太多、track 缺失、管道或模板函数过重、图片太大。优化可用 trackBy、虚拟滚动、OnPush、分页、预计算、懒加载子组件。

---

### 63. SSR、SSG、Hydration 分别是什么？它们主要解决什么性能或 SEO 问题？

- 难度：Medium
- ID：`ng-performance-ssr-hydration`
- 口述一句话：SSR/SSG 改善首屏和 SEO，Hydration 负责客户端接管。

**参考答案：**

SSR 在服务端生成 HTML，改善首屏和 SEO；SSG 是构建时预生成静态页面；Hydration 是客户端复用服务端 HTML 并接管交互。它们能改善首屏，但会增加架构和部署复杂度。

---

<a id="topic-20"></a>

## Angular 指令

### 64. `HostBinding` 和 `HostListener` 有什么作用？适合写什么类型的指令？

- 难度：Medium
- ID：`ng-angular-hostbinding-hostlistener`
- 口述一句话：HostBinding 改宿主属性，HostListener 听宿主事件。

**参考答案：**

HostBinding 用来绑定宿主元素属性、class、style；HostListener 用来监听宿主元素或全局事件。它们常用于自定义属性指令，比如高亮、权限禁用、点击外部关闭等行为增强。

---

<a id="topic-21"></a>

## Angular 路由

### 65. Angular 路由懒加载有什么好处？`loadComponent` 和 `loadChildren` 分别适合什么场景？

- 难度：Medium
- ID：`ng-router-lazy-loading`
- 口述一句话：路由懒加载用空间换首屏速度，访问时再加载代码。

**参考答案：**

懒加载把某个路由的代码拆成独立 chunk，访问时再加载，减少首屏 bundle。loadComponent 适合懒加载 standalone 组件，loadChildren 适合懒加载一组子路由。大型应用应按业务模块拆路由。

---

### 66. Route Guard 有哪些类型？`canActivate`、`canActivateChild`、`canMatch` 有什么区别？

- 难度：Medium
- ID：`ng-router-guards`
- 口述一句话：菜单隐藏管入口，路由守卫管真正访问权限。

**参考答案：**

canActivate 控制当前路由能否进入，canActivateChild 控制子路由，canMatch 控制路由是否匹配，适合权限、登录态和功能开关。只隐藏菜单不安全，守卫才是路由层访问控制。

---

### 67. Resolver 的作用是什么？它和组件内请求数据有什么取舍？

- 难度：Medium
- ID：`ng-router-resolver`
- 口述一句话：Resolver 是进页面前取数据，但会阻塞导航。

**参考答案：**

Resolver 在路由激活前预取数据，让组件进入时已有数据。优点是组件更简单，缺点是会阻塞导航，慢接口可能影响体验。适合详情页关键数据，不适合所有接口都放 Resolver。

---

### 68. ActivatedRoute 如何读取路由参数？snapshot 和 paramMap Observable 有什么区别？

- 难度：Medium
- ID：`ng-router-activated-route`
- 口述一句话：snapshot 读一次，paramMap 监听参数变化。

**参考答案：**

snapshot 是当前时刻参数快照，适合同组件不会复用或只读一次的场景；paramMap Observable 能监听同组件不同参数变化。比如 /users/1 切到 /users/2，组件复用时应订阅 paramMap。

---

### 69. Router Events 可以做什么？如何用导航事件实现全局 loading 或埋点？

- 难度：Medium
- ID：`ng-router-events-loading`
- 口述一句话：Router Events 适合全局 loading、埋点和导航状态处理。

**参考答案：**

Router Events 能监听导航开始、结束、取消、错误。可以在 NavigationStart 显示全局 loading，在 NavigationEnd/Cancel/Error 关闭，也可以做页面埋点、标题更新、滚动恢复等。

---

<a id="topic-22"></a>

## Angular 部署

### 70. 静态部署到 GitHub Pages 时刷新 404 是什么原因？HashLocation 和 404 fallback 如何解决？

- 难度：Medium
- ID：`ng-router-github-pages-404`
- 口述一句话：静态托管刷新 404，本质是服务器不认识前端路由。

**参考答案：**

SPA 使用 path 路由时，刷新 /angular20/ios-learning 会让服务器找真实文件，GitHub Pages 找不到就 404。解决方式是用 HashLocation，或把 index.html 复制成 404.html，让所有路径回退到 SPA。base-href 也要配置正确。

---

<a id="topic-23"></a>

## Angular 路由 / 权限

### 71. 菜单隐藏和路由守卫分别解决什么问题？为什么不能只隐藏菜单？

- 难度：Medium
- ID：`ng-router-permission-menu`
- 口述一句话：权限不能只靠隐藏菜单，路由和接口也要拦住。

**参考答案：**

菜单隐藏只是用户体验，避免展示不能访问的入口；路由守卫才是权限边界，防止用户手输 URL 访问。完整方案应同时有菜单过滤、路由守卫、无权限页，后端接口也必须校验权限。

---

<a id="topic-24"></a>

## Angular 表单

### 72. Reactive Forms 和 Template-driven Forms 有什么区别？复杂业务表单更推荐哪一种？

- 难度：Medium
- ID：`ng-forms-reactive-template`
- 口述一句话：复杂表单用 Reactive Forms，简单表单可用模板驱动。

**参考答案：**

Reactive Forms 用类模型显式管理表单，适合复杂表单、动态字段和强测试；Template-driven 依赖模板和 ngModel，更适合简单表单。企业后台复杂表单通常优先 Reactive Forms。

---

### 73. FormControl、FormGroup、FormArray 分别是什么？动态表单应该如何建模？

- 难度：Medium
- ID：`ng-forms-control-group-array`
- 口述一句话：Control 是字段，Group 是对象，Array 是动态列表。

**参考答案：**

FormControl 表示单个字段，FormGroup 表示对象结构，FormArray 表示动态数组字段。动态表单通常用 FormArray 增删行，用 FormGroup 组织每行字段，再配合 validators 做校验。

---

### 74. 如何实现自定义同步校验和异步校验？校验错误如何展示？

- 难度：Medium
- ID：`ng-forms-custom-validator`
- 口述一句话：校验器返回错误对象表示失败，返回 null 表示通过。

**参考答案：**

同步校验器接收 AbstractControl 并返回错误对象或 null；异步校验器返回 Observable/Promise。错误展示通常根据 control.errors、dirty/touched 控制。复杂校验可以放在独立函数中复用。

---

### 75. 强类型表单解决什么问题？它如何减少表单字段和提交数据的类型错误？

- 难度：Medium
- ID：`ng-forms-typed-forms`
- 口述一句话：强类型表单把表单值纳入 TS 类型安全。

**参考答案：**

强类型表单让 FormControl、FormGroup 的值类型可被 TS 检查，减少字段名写错、提交模型不匹配、空值处理遗漏等问题。复杂项目中它能让重构更安全。

---

### 76. `setValue`、`patchValue`、`getRawValue` 有什么区别？禁用字段对取值有什么影响？

- 难度：Medium
- ID：`ng-forms-patch-set-raw`
- 口述一句话：setValue 要完整，patchValue 可部分，getRawValue 含禁用值。

**参考答案：**

setValue 要求完整匹配表单结构，字段缺失会报错；patchValue 允许只更新部分字段；getRawValue 会包含 disabled 控件的值，而普通 value 通常不包含禁用字段。

---

<a id="topic-25"></a>

## Angular HTTP

### 77. HttpClient 为什么返回 Observable？为什么不 subscribe 就不会真正发请求？

- 难度：Easy
- ID：`ng-httpclient-observable`
- 口述一句话：HttpClient 返回冷 Observable，不订阅不发送。

**参考答案：**

HttpClient 返回冷 Observable，只有 subscribe、async pipe 或转成 signal 等被消费时才会发请求。Observable 支持取消、操作符组合和拦截器链，适合 Angular 与 RxJS 生态。

---

### 78. Http Interceptor 可以做什么？如何统一处理 Token、错误和 loading？

- 难度：Medium
- ID：`ng-http-interceptor`
- 口述一句话：Interceptor 统一处理请求和响应的横切逻辑。

**参考答案：**

Interceptor 可以统一加 Token、设置 header、记录日志、处理错误、重试、loading、刷新 Token。它让横切逻辑集中在一处，避免散落在每个 API 调用里。

---

### 79. 函数式拦截器 `HttpInterceptorFn` 和类拦截器有什么区别？

- 难度：Medium
- ID：`ng-http-functional-interceptor`
- 口述一句话：函数式拦截器更轻量，配合 inject 和 provideHttpClient 使用。

**参考答案：**

函数式拦截器是一个函数，通常配合 provideHttpClient(withInterceptors()) 注册，可直接用 inject() 获取依赖。相比类拦截器更轻量、更贴近现代 Angular 配置方式。

---

<a id="topic-26"></a>

## Angular HTTP / 鉴权

### 80. 如何处理 Token 注入和过期刷新？如何避免多个请求同时刷新 Token？

- 难度：Hard
- ID：`ng-http-token-refresh`
- 口述一句话：Token 刷新重点是并发合并和失败兜底。

**参考答案：**

请求时注入 access token，401 后用 refresh token 换新 token 并重试原请求。关键是并发控制：刷新中其他请求等待同一个刷新结果，避免同时刷新多次。还要处理刷新失败后的登出和队列清理。

---

<a id="topic-27"></a>

## Angular HTTP / RxJS

### 81. Angular 里如何取消 HTTP 请求？`switchMap`、`takeUntilDestroyed`、AbortSignal 分别如何理解？

- 难度：Medium
- ID：`ng-http-cancel-request`
- 口述一句话：取消请求本质是取消订阅，搜索常用 switchMap。

**参考答案：**

Angular HTTP 取消通常来自取消订阅。搜索场景用 switchMap 自动取消旧请求；组件销毁用 takeUntilDestroyed；新版本底层也可结合 AbortSignal。核心是让无效请求不再更新 UI。

---

<a id="topic-28"></a>

## Angular 测试

### 82. 如何用 `HttpTestingController` 测试 HTTP 请求？它相比真实请求有什么好处？

- 难度：Medium
- ID：`ng-http-testing-controller`
- 口述一句话：HttpTestingController 让 HTTP 测试不发真实请求。

**参考答案：**

HttpTestingController 可以在单元测试里拦截 HttpClient 请求，断言 URL、method、body，并手动 flush 响应或错误。它避免真实网络依赖，让 API Service 测试稳定、快速、可重复。

---

### 83. Angular 组件测试里 TestBed、fixture、detectChanges 分别是什么？

- 难度：Medium
- ID：`ng-testing-testbed-fixture`
- 口述一句话：TestBed 搭环境，fixture 拿组件，detectChanges 刷模板。

**参考答案：**

TestBed 创建 Angular 测试模块，配置组件、依赖和 provider；fixture 包装组件实例和 DOM；detectChanges 触发一次变更检测，让模板根据当前状态渲染。

---

### 84. `fakeAsync`、`tick`、`flush`、`whenStable` 分别适合测试什么异步场景？

- 难度：Hard
- ID：`ng-testing-fakeasync`
- 口述一句话：fakeAsync 让异步时间在测试里可控。

**参考答案：**

fakeAsync 把异步放进可控测试区域；tick 推进定时器时间；flush 清空宏任务；whenStable 等待异步稳定。适合测试 setTimeout、debounceTime、Promise、异步表单校验等。

---

### 85. 组件测试中如何 Mock 一个 Service？`useValue`、`useClass`、spy 分别怎么用？

- 难度：Medium
- ID：`ng-testing-mock-service`
- 口述一句话：Mock Service 是为了隔离组件和外部依赖。

**参考答案：**

Mock Service 可用 useValue 提供假对象和 spy，useClass 提供假实现，或 useFactory 动态创建。组件测试应验证组件和依赖的交互，不依赖真实 HTTP、真实存储或复杂外部服务。

---

<a id="topic-29"></a>

## RxJS

### 86. Observable 和 Promise 有什么区别？多值、懒执行、取消能力如何理解？

- 难度：Medium
- ID：`ng-rxjs-observable-promise`
- 口述一句话：Promise 一次结果，Observable 多值、懒执行、可取消。

**参考答案：**

Promise 表示一次异步结果，创建后通常立即执行，不支持多次发射；Observable 可以发射多次，默认懒执行，订阅才开始，并且可以取消。Angular HTTP、事件流、表单 valueChanges 更适合 Observable。

---

### 87. Subject、BehaviorSubject、ReplaySubject、AsyncSubject 有什么区别？

- 难度：Medium
- ID：`ng-rxjs-subject-types`
- 口述一句话：Subject 家族区别在是否保存和回放历史值。

**参考答案：**

Subject 既是 Observable 又是 Observer，可主动 next；BehaviorSubject 会保存最新值，新订阅立刻拿到当前值；ReplaySubject 可以回放多个历史值；AsyncSubject 只在完成时发出最后一个值。

---

### 88. `switchMap`、`mergeMap`、`concatMap`、`exhaustMap` 有什么区别？分别适合什么场景？

- 难度：Hard
- ID：`ng-rxjs-map-operators`
- 口述一句话：四大高阶映射：取消、并发、排队、忽略。

**参考答案：**

switchMap 会取消上一个内部流，适合搜索；mergeMap 并发执行，适合互不影响的请求；concatMap 排队顺序执行，适合必须有顺序的任务；exhaustMap 忽略新请求直到当前完成，适合防重复提交。

---

### 89. 搜索框防抖、去重、取消旧请求应该如何用 RxJS 实现？

- 难度：Medium
- ID：`ng-rxjs-search-debounce`
- 口述一句话：搜索流三件套：防抖、去重、switchMap 取消旧请求。

**参考答案：**

搜索流通常 valueChanges.pipe(debounceTime, distinctUntilChanged, switchMap)。debounceTime 等用户停顿，distinctUntilChanged 避免重复关键词，switchMap 取消旧请求，只保留最后一次搜索结果。

---

### 90. `combineLatest` 和 `forkJoin` 有什么区别？多个接口并发后合并结果如何选择？

- 难度：Medium
- ID：`ng-rxjs-combine-forkjoin`
- 口述一句话：combineLatest 组合持续状态，forkJoin 等全部完成一次性返回。

**参考答案：**

combineLatest 在任一源更新时发出所有源的最新值，适合长期状态组合；forkJoin 等所有源完成后发出一次，适合多个 HTTP 请求全部完成后渲染。HTTP 并发一般常用 forkJoin。

---

### 91. 如何避免 RxJS 订阅内存泄漏？AsyncPipe、takeUntil、takeUntilDestroyed 如何选择？

- 难度：Medium
- ID：`ng-rxjs-unsubscribe-leak`
- 口述一句话：长期 Observable 要取消订阅，优先 async pipe 或 takeUntilDestroyed。

**参考答案：**

订阅不释放会让回调、组件实例或 DOM 被长期引用。模板里优先 async pipe；组件代码里可用 takeUntilDestroyed；老写法是 destroy$ + takeUntil。HTTP 单次请求通常完成会自动结束，但长期流必须管理。

---

### 92. `shareReplay` 有什么作用和坑？缓存接口结果时要注意什么？

- 难度：Hard
- ID：`ng-rxjs-share-replay`
- 口述一句话：shareReplay 能缓存和共享，也要管理生命周期。

**参考答案：**

shareReplay 可以共享源 Observable 并缓存最近结果，常用于接口结果缓存，避免多个订阅重复请求。坑是如果不设置 refCount 或缓存生命周期，源可能长期不释放，旧数据也可能过期不更新。

---

### 93. `catchError` 放在内层和外层有什么区别？为什么位置会影响流是否终止？

- 难度：Hard
- ID：`ng-rxjs-catch-error-position`
- 口述一句话：catchError 放内层保外层流，放外层可能终止整个流。

**参考答案：**

catchError 放在内层，比如 switchMap 内，只处理单次请求错误，外层输入流还能继续；放在外层可能让整个流结束，后续输入不再触发。错误处理位置会决定流的生死。

---

### 94. 冷 Observable 和热 Observable 有什么区别？HttpClient 返回的是冷还是热？

- 难度：Medium
- ID：`ng-rxjs-hot-cold`
- 口述一句话：冷流每次订阅独立执行，热流多个订阅共享源。

**参考答案：**

冷 Observable 每个订阅独立执行，比如 HttpClient；热 Observable 不因订阅者而重新产生源，比如 DOM 事件、Subject。冷转热常用 share/shareReplay。理解冷热有助于解释重复请求和共享缓存。

---

<a id="topic-30"></a>

## RxJS / Angular

### 95. AsyncPipe 有什么好处？它如何自动订阅和取消订阅？

- 难度：Easy
- ID：`ng-rxjs-async-pipe`
- 口述一句话：AsyncPipe 自动订阅、更新视图并在销毁时取消。

**参考答案：**

AsyncPipe 在模板中订阅 Observable/Promise，值变化时触发视图更新，组件销毁时自动取消订阅。它减少手动 subscribe 和内存泄漏，也能配合 OnPush 正确触发检查。

---

<a id="topic-31"></a>

## RxJS / Signals

### 96. `toSignal()` 和 `toObservable()` 适合放在什么边界？Angular Signals 和 RxJS 如何选择？

- 难度：Medium
- ID：`ng-rxjs-signal-bridge`
- 口述一句话：Signals 管状态，RxJS 管流；桥接放在边界。

**参考答案：**

Signals 适合同步状态和模板派生，RxJS 适合事件流、异步流和复杂组合。toSignal 把 Observable 结果用于模板状态，toObservable 把 signal 变化接入 RxJS 管道。建议在边界桥接，不要混得满项目都是。

---

<a id="topic-32"></a>

## Angular 变更检测

### 97. Zone.js 在 Angular 中做了什么？为什么异步任务会触发变更检测？

- 难度：Hard
- ID：`ng-cd-zonejs`
- 口述一句话：Zone.js 追踪异步任务，通知 Angular 做变更检测。

**参考答案：**

Zone.js patch 浏览器异步 API，知道什么时候发生了 setTimeout、Promise、事件等异步任务，然后通知 Angular 触发变更检测。它让开发者少手动刷新 UI，但也可能导致过多检查。

---

### 98. Default 和 OnPush 变更检测策略有什么区别？OnPush 为什么能优化性能？

- 难度：Medium
- ID：`ng-cd-default-onpush`
- 口述一句话：Default 更自动，OnPush 更克制、更依赖清晰数据流。

**参考答案：**

Default 策略下，异步事件后通常会检查整棵相关组件树；OnPush 只在输入引用变化、组件事件、async pipe、signal 等场景触发，更适合不可变数据和清晰状态流。OnPush 能减少无效检查。

---

### 99. OnPush 下哪些情况会触发检查？输入引用、事件、async pipe、signal 分别如何触发？

- 难度：Hard
- ID：`ng-cd-onpush-trigger`
- 口述一句话：OnPush 看引用和显式触发，别原地改对象。

**参考答案：**

OnPush 会在输入引用变化、组件内部事件、async pipe 发新值、signal 更新、手动 markForCheck 等情况下触发。对象内部原地修改但引用不变，通常不会刷新，所以要用不可变更新。

---

### 100. `markForCheck` 和 `detectChanges` 有什么区别？什么时候使用？

- 难度：Hard
- ID：`ng-cd-mark-detect`
- 口述一句话：markForCheck 等下一轮，detectChanges 立刻检查子树。

**参考答案：**

markForCheck 标记当前组件及祖先在下一轮检测中检查，适合 OnPush 异步更新；detectChanges 立即对当前组件子树执行一次检查。前者温和，后者更主动，滥用 detectChanges 可能掩盖数据流问题。

---

### 101. `ExpressionChangedAfterItHasBeenChecked` 是什么原因？应该如何从数据流上修复？

- 难度：Hard
- ID：`ng-cd-expression-changed`
- 口述一句话：这个错误说明同一轮检查里展示值被改了。

**参考答案：**

这个错误表示 Angular 检查后发现绑定值在同一轮检测中又变化了，开发模式用它提醒数据流不稳定。应优先调整更新时机和单向数据流，比如把变更放到正确生命周期、父级统一传入，而不是习惯性 setTimeout。

---

<a id="topic-33"></a>

## 前端性能

### 102. FCP、LCP、CLS、INP、TTI 分别衡量什么？前端优化如何量化？

- 难度：Medium
- ID：`ng-performance-web-vitals`
- 口述一句话：Web Vitals 用来量化加载、稳定性和交互体验。

**参考答案：**

FCP 是首次内容绘制，LCP 是最大内容绘制，CLS 是布局偏移，INP 是交互响应，TTI 是可交互时间。性能优化要有指标前后对比，不只说感觉变快。

---

### 103. Chrome DevTools 的 Network、Performance、Memory 面板分别适合排查什么？

- 难度：Medium
- ID：`ng-performance-devtools`
- 口述一句话：DevTools 三板斧：Network、Performance、Memory。

**参考答案：**

Network 看请求瀑布、缓存、体积和时序；Performance 看主线程任务、渲染和长任务；Memory 看泄漏和对象增长。排查时要带着复现场景录制，再看瓶颈在哪里。

---

### 104. Web Worker 适合解决什么问题？在 Angular 中使用时要注意什么？

- 难度：Medium
- ID：`ng-performance-web-worker`
- 口述一句话：Worker 用来把重计算挪出主线程。

**参考答案：**

Web Worker 适合把 CPU 密集任务移出主线程，比如大数据计算、解析、压缩。它不能直接操作 DOM，通信需要 postMessage，数据复制或转移也有成本。Angular CLI 支持生成 worker。

---

<a id="topic-34"></a>

## 浏览器基础

### 105. 浏览器从输入 URL 到页面展示经历了什么？DNS、TCP、TLS、解析渲染如何串起来？

- 难度：Hard
- ID：`ng-browser-url-flow`
- 口述一句话：URL 到页面展示可按网络、解析、渲染三段讲。

**参考答案：**

输入 URL 后，浏览器解析地址，查缓存，DNS 解析，建立 TCP，HTTPS 还要 TLS 握手，发送 HTTP 请求，接收 HTML，解析 DOM/CSSOM，构建渲染树，布局、绘制、合成，执行 JS 并继续加载子资源。

---

<a id="topic-35"></a>

## 浏览器渲染

### 106. DOM、CSSOM、Render Tree、Layout、Paint、Composite 分别是什么？

- 难度：Hard
- ID：`ng-browser-render-flow`
- 口述一句话：浏览器渲染链路是 DOM/CSSOM、布局、绘制、合成。

**参考答案：**

HTML 解析成 DOM，CSS 解析成 CSSOM，二者合成 Render Tree；Layout 计算几何位置，Paint 绘制像素，Composite 合成图层显示。JS、CSS、图片和字体都可能影响这条管线。

---

### 107. 回流和重绘有什么区别？如何减少 DOM 操作造成的性能问题？

- 难度：Medium
- ID：`ng-browser-reflow-repaint`
- 口述一句话：回流改布局，重绘改外观；回流通常更贵。

**参考答案：**

回流是布局变化，需要重新计算位置尺寸；重绘是不改布局只重画外观。回流通常更贵。减少方式包括批量 DOM 操作、避免频繁读写布局、使用 class 切换、transform/opacity 动画、虚拟列表。

---

<a id="topic-36"></a>

## 浏览器事件

### 108. 事件捕获、目标、冒泡阶段是什么？事件委托为什么能提升性能？

- 难度：Medium
- ID：`ng-browser-event-flow`
- 口述一句话：事件委托靠冒泡，把监听放父级。

**参考答案：**

事件经历捕获、目标、冒泡阶段。事件委托利用冒泡，把监听器挂在父元素，通过 event.target 判断具体子元素，减少大量子元素监听器，适合动态列表。

---

<a id="topic-37"></a>

## 浏览器存储

### 109. localStorage、sessionStorage、Cookie、IndexedDB 有什么区别？分别适合存什么？

- 难度：Medium
- ID：`ng-browser-storage`
- 口述一句话：浏览器存储按生命周期、容量和是否随请求发送来选。

**参考答案：**

localStorage 长期保存、同步 API、容量较小；sessionStorage 随标签页会话结束；Cookie 会随请求发送，适合会话但容量小；IndexedDB 适合大量结构化离线数据。敏感 token 不建议长期放 localStorage。

---

<a id="topic-38"></a>

## 网络 / 缓存

### 110. HTTP 强缓存和协商缓存有什么区别？Cache-Control、ETag、304 如何理解？

- 难度：Hard
- ID：`ng-browser-http-cache`
- 口述一句话：强缓存不请求，协商缓存请求后可能 304。

**参考答案：**

强缓存通过 Cache-Control/Expires 判断是否直接用本地缓存；协商缓存通过 ETag/If-None-Match 或 Last-Modified 问服务器资源是否变化，未变返回 304。强缓存不发请求，协商缓存会发请求。

---

<a id="topic-39"></a>

## 网络 / CORS

### 111. CORS 是什么？简单请求和预检请求有什么区别？服务端如何配置跨域？

- 难度：Medium
- ID：`ng-browser-cors`
- 口述一句话：CORS 是浏览器限制，最终要服务端响应头允许。

**参考答案：**

CORS 是浏览器同源策略下的跨域访问控制。简单请求可直接发，复杂请求会先发 OPTIONS 预检。服务端通过 Access-Control-Allow-Origin、Methods、Headers、Credentials 等响应头允许跨域。

---

<a id="topic-40"></a>

## 网络 / 鉴权

### 112. Cookie + Session 和 JWT 有什么区别？HttpOnly、Secure、SameSite 分别解决什么问题？

- 难度：Hard
- ID：`ng-browser-cookie-jwt`
- 口述一句话：Cookie Session 偏服务端状态，JWT 偏客户端携带声明。

**参考答案：**

Cookie+Session 状态在服务端，客户端带 session id；JWT 把声明签名后放客户端，服务端验证签名。HttpOnly 防 JS 读取，Secure 仅 HTTPS 发送，SameSite 减少 CSRF。选择看安全、可撤销性和架构。

---

<a id="topic-41"></a>

## 前端安全

### 113. XSS 是什么？Angular 默认模板转义能防什么？什么时候 DomSanitizer 会有风险？

- 难度：Hard
- ID：`ng-browser-xss`
- 口述一句话：XSS 防范核心是转义、过滤和少信任 HTML。

**参考答案：**

XSS 是攻击者把恶意脚本注入页面。Angular 模板默认会转义插值，能防大多数文本注入。但 innerHTML、DomSanitizer.bypassSecurityTrustHtml、第三方富文本都要谨慎，最好做白名单过滤和 CSP。

---

### 114. CSRF 是什么？SameSite Cookie、CSRF Token、Angular XSRF 机制如何防范？

- 难度：Hard
- ID：`ng-browser-csrf`
- 口述一句话：CSRF 是借用户 Cookie 发请求，靠 SameSite 和 token 防。

**参考答案：**

CSRF 利用浏览器自动携带 Cookie 向站点发请求。防范包括 SameSite Cookie、CSRF Token、自定义请求头、校验 Origin/Referer。Angular 可读取 XSRF Cookie 并写入请求头配合后端校验。

---

### 115. CSP 是什么？它如何降低 XSS 风险？

- 难度：Medium
- ID：`ng-browser-csp`
- 口述一句话：CSP 用白名单限制资源和脚本执行来源。

**参考答案：**

CSP 是内容安全策略，通过响应头限制脚本、样式、图片等资源来源，减少 XSS 成功后的执行能力。比如禁用 inline script，只允许可信域名脚本。它是防御加固，不替代输入过滤和输出转义。

---

<a id="topic-42"></a>

## 网络

### 116. WebSocket、SSE、轮询有什么区别？实时消息场景如何选择？

- 难度：Medium
- ID：`ng-browser-websocket-sse`
- 口述一句话：双向实时用 WebSocket，单向推送可用 SSE，简单兼容用轮询。

**参考答案：**

WebSocket 是双向长连接，适合聊天、协作；SSE 是服务端到客户端单向推送，适合通知、日志流；轮询兼容性好但开销大。选择看是否需要双向、实时性、兼容性和服务端能力。

---

<a id="topic-43"></a>

## Angular 样式

### 117. Angular 组件样式封装如何理解？`:host`、`:host-context`、`::ng-deep` 分别是什么？

- 难度：Medium
- ID：`ng-css-host-ngdeep`
- 口述一句话：Angular 样式默认封装，::ng-deep 会破坏边界。

**参考答案：**

Angular 默认 Emulated 样式封装会给选择器加属性标记，让样式只影响组件。:host 选择宿主元素，:host-context 根据祖先环境匹配。::ng-deep 会穿透封装，容易污染全局，应尽量少用。

---

<a id="topic-44"></a>

## CSS

### 118. Flex 和 Grid 分别适合什么布局？`flex: 1` 具体表示什么？

- 难度：Easy
- ID：`ng-css-flex-grid`
- 口述一句话：Flex 管一维，Grid 管二维。

**参考答案：**

Flex 是一维布局，适合横向或纵向排列；Grid 是二维布局，适合行列同时控制。flex:1 通常是 flex-grow:1、flex-shrink:1、flex-basis:0，表示占据剩余空间并可伸缩。

---

<a id="topic-45"></a>

## Angular DOM

### 119. 为什么 Angular 中不建议随便直接操作 DOM？Renderer2、ElementRef、innerHTML 分别有什么风险？

- 难度：Medium
- ID：`ng-dom-renderer2`
- 口述一句话：Angular 优先数据驱动，直接 DOM 操作要克制。

**参考答案：**

直接操作 DOM 会绕开 Angular 数据流，也可能影响 SSR、安全和测试。ElementRef 暴露原生节点要谨慎，innerHTML 有 XSS 风险；Renderer2 提供抽象 DOM 操作，更适合跨平台和安全边界。

---

<a id="topic-46"></a>

## 前端可访问性

### 120. 前端可访问性要关注哪些基础点？按钮语义、label、键盘操作、ARIA 如何理解？

- 难度：Easy
- ID：`ng-a11y-basics`
- 口述一句话：A11y 先用语义化，再用 ARIA 补不足。

**参考答案：**

可访问性基础包括使用语义化元素、按钮可键盘操作、表单 label 关联、焦点可见、颜色对比足够。ARIA 用来补充语义，不应替代原生语义。好的可访问性也提升自动化测试和键盘用户体验。

---

<a id="topic-47"></a>

## 工程化

### 121. Angular CLI production build 大致做了什么？优化、压缩、hash、chunk 如何理解？

- 难度：Medium
- ID：`ng-engineering-cli-build`
- 口述一句话：production build 会编译、打包、压缩、拆分和加 hash。

**参考答案：**

Angular production build 会做 TypeScript 编译、模板编译、依赖打包、压缩、tree-shaking、代码分割、文件 hash 等优化。最终产物是静态文件，可部署到 Nginx、CDN、GitHub Pages 等。

---

### 122. package-lock 的作用是什么？为什么团队项目需要提交锁文件？

- 难度：Easy
- ID：`ng-engineering-package-lock`
- 口述一句话：锁文件保证依赖安装可重复。

**参考答案：**

package-lock 锁定依赖树的精确版本，保证团队和 CI 安装结果一致。没有锁文件时，同一个 package.json 在不同时间可能解析到不同子依赖，引发难复现问题。应用项目应提交锁文件。

---

### 123. npm、pnpm、yarn 有什么区别？pnpm 为什么能节省磁盘空间？

- 难度：Medium
- ID：`ng-engineering-npm-pnpm-yarn`
- 口述一句话：pnpm 省空间且依赖更严格，npm 最通用。

**参考答案：**

npm 是默认包管理器；yarn 强调速度和工作区；pnpm 用内容寻址存储和硬链接，依赖不扁平，能节省磁盘并减少幽灵依赖。团队选择主要看生态、速度、monorepo 和规范。

---

### 124. Angular 项目如何做多环境配置？dev、staging、prod 如何区分？

- 难度：Medium
- ID：`ng-engineering-env-config`
- 口述一句话：多环境配置要集中，构建时或运行时注入。

**参考答案：**

多环境可以用 Angular configuration、fileReplacements、环境配置文件、运行时配置 JSON 或 CI 注入变量。域名、开关、日志级别应集中管理，业务代码不要到处写 if production。

---

### 125. 如何设计前端 CI/CD？从提交到部署一般有哪些步骤？

- 难度：Medium
- ID：`ng-engineering-cicd`
- 口述一句话：CI/CD 把检查、测试、构建和部署自动化。

**参考答案：**

前端 CI/CD 通常包括安装依赖、lint、单测、构建、E2E、产物上传和部署。关键是锁定 Node/包管理器版本、缓存依赖、失败阻断、产物可追踪、支持回滚。

---

<a id="topic-48"></a>

## 测试

### 126. 单元测试、组件测试、E2E 测试分别测什么？如何决定测试边界？

- 难度：Medium
- ID：`ng-testing-unit-component-e2e`
- 口述一句话：单测测逻辑，组件测交互，E2E 测业务流程。

**参考答案：**

单元测试测纯逻辑和服务，组件测试测模板交互和输入输出，E2E 测真实用户流程。测试金字塔建议底层多、E2E 少而关键，避免所有问题都靠慢速 E2E 发现。

---

<a id="topic-49"></a>

## 工程化 / 构建

### 127. 为什么 CommonJS 依赖可能影响构建优化？Angular 构建中的 CommonJS warning 如何处理？

- 难度：Medium
- ID：`ng-engineering-commonjs-warning`
- 口述一句话：CommonJS warning 表示可能影响 tree-shaking 和体积优化。

**参考答案：**

CommonJS 依赖动态性强，不利于 tree-shaking，Angular 会提示 optimization bailout。处理方式是优先换 ESM 版本、按需引入，实在无法替换再配置 allowedCommonJsDependencies，并评估 bundle 体积。

---

<a id="topic-50"></a>

## 工程化 / 部署

### 128. Angular 静态项目发布到 GitHub Pages 要注意什么？base-href、404.html、路由模式如何处理？

- 难度：Medium
- ID：`ng-engineering-gh-pages`
- 口述一句话：GitHub Pages 部署 Angular 要处理 base-href 和刷新 404。

**参考答案：**

GitHub Pages 是静态托管，Angular 发布要设置正确 base-href，如 /repo/。SPA path 路由刷新可能 404，可复制 index.html 为 404.html 或使用 hash 路由。发布流程通常是 build 后推 dist 到 gh-pages 分支。

---

<a id="topic-51"></a>

## 项目表达

### 129. 请用 3 分钟介绍一个 Angular 项目：业务背景、职责、技术栈、难点、结果。

- 难度：Medium
- ID：`ng-project-three-minute`
- 口述一句话：三分钟项目介绍讲背景、职责、技术、难点和结果。

**参考答案：**

项目介绍按背景、职责、技术栈、难点、结果讲。重点突出你负责的模块、做过的决策和可量化结果，不要只说“参与开发”。最后补一句复盘，说明如果重做会怎么优化。

---

<a id="topic-52"></a>

## 项目表达 / 权限

### 130. 讲一个权限路由或菜单权限案例：菜单隐藏、路由守卫、无权限兜底分别怎么设计？

- 难度：Hard
- ID：`ng-project-permission-route`
- 口述一句话：权限不能只藏菜单，要有守卫和后端校验。

**参考答案：**

权限案例要讲三层：菜单过滤提升体验，路由守卫防 URL 直达，后端接口做最终权限校验。再补无权限兜底页、动态权限配置和刷新后的权限恢复。

---

<a id="topic-53"></a>

## 项目表达 / 表单

### 131. 讲一个复杂表单案例：动态字段、校验、错误展示、提交模型如何设计？

- 难度：Hard
- ID：`ng-project-complex-form`
- 口述一句话：复杂表单要讲建模、动态字段、校验和提交转换。

**参考答案：**

复杂表单案例可讲 Reactive Forms、FormGroup/FormArray 建模、配置驱动字段、同步/异步校验、错误展示、草稿保存和提交 DTO 转换。重点是让表单结构可维护、可测试、可扩展。

---

<a id="topic-54"></a>

## 项目表达 / API

### 132. 讲一个 API 层封装案例：类型、拦截器、错误、重试、loading、测试如何处理？

- 难度：Hard
- ID：`ng-project-api-layer`
- 口述一句话：API 层亮点是统一、类型安全、可测和可观测。

**参考答案：**

API 层案例要讲类型化响应、统一请求入口、拦截器、错误映射、loading、重试、取消和测试。组件只调用业务方法，不直接拼 URL。这样能减少重复代码并提升可测试性。

---

<a id="topic-55"></a>

## 项目表达 / RxJS

### 133. 讲一个 RxJS 异步流案例：搜索、取消旧请求、并发合并、错误处理如何设计？

- 难度：Hard
- ID：`ng-project-rxjs-flow`
- 口述一句话：RxJS 项目题要把操作符选择和业务语义对上。

**参考答案：**

RxJS 案例可用搜索：valueChanges 做 debounceTime 和 distinctUntilChanged，switchMap 发请求并取消旧请求，catchError 处理错误，shareReplay 缓存结果，takeUntilDestroyed 清理订阅。重点是解释为什么这样选操作符。

---

<a id="topic-56"></a>

## 项目表达 / Signals

### 134. 讲一个 Signal 状态管理案例：状态、派生状态、副作用、持久化如何组织？

- 难度：Hard
- ID：`ng-project-signal-state`
- 口述一句话：Signal 状态案例讲原始状态、派生状态和副作用边界。

**参考答案：**

Signal 案例要讲 signal 保存原始状态，computed 派生列表、统计、按钮状态，effect 做 localStorage 持久化或日志。避免把派生状态写成 effect 手动同步，复杂异步流可在边界用 toSignal。

---

<a id="topic-57"></a>

## 项目表达 / 性能

### 135. 讲一个 Angular 性能优化案例：指标、工具、瓶颈、方案和结果是什么？

- 难度：Hard
- ID：`ng-project-performance-case`
- 口述一句话：性能案例要有指标、工具、瓶颈、方案和结果。

**参考答案：**

性能案例必须有指标和工具。先说优化前问题，如首屏慢、列表卡顿、bundle 大；再说用 DevTools/Angular DevTools/构建分析定位瓶颈；最后说方案和优化后数据。

---

<a id="topic-58"></a>

## 项目表达 / 工程化

### 136. 讲一个前端 CI/CD 或 GitHub Pages 发布案例：构建、测试、产物、部署和回滚如何处理？

- 难度：Hard
- ID：`ng-project-ci-cd`
- 口述一句话：CI/CD 项目题讲从提交到部署的自动化链路。

**参考答案：**

CI/CD 案例讲安装依赖、lint、测试、构建、产物、部署和回滚。GitHub Pages 可讲 base-href、404 fallback、gh-pages 分支。重点是自动化、可追踪和失败阻断。

---

<a id="topic-59"></a>

## 项目表达 / Bug 定位

### 137. 讲一个你定位过的复杂前端 Bug：现象、复现、定位、根因、修复和预防。

- 难度：Hard
- ID：`ng-project-hardest-bug`
- 口述一句话：Bug 案例要讲证据链和预防措施。

**参考答案：**

复杂 Bug 按现象、复现、缩小范围、工具、根因、修复和预防讲。前端常见工具有 console、Network、Performance、source map、日志和用户环境信息。高级点是讲证据链。

---

<a id="topic-60"></a>

## 项目表达 / 技术取舍

### 138. 讲一次 Angular 项目里的技术取舍：Signals vs RxJS、Service vs NgRx、SSR vs SPA 等如何决策？

- 难度：Hard
- ID：`ng-project-tradeoff`
- 口述一句话：取舍题不是选最强，而是在约束下选最合适。

**参考答案：**

技术取舍要先列约束，如团队熟悉度、业务期限、性能、可维护性。再比较方案，比如 Signals vs RxJS、Service vs NgRx、SSR vs SPA，说明为什么当前选择最合适，并承认代价和后续演进。

---

<a id="topic-61"></a>

## 手写题

### 139. 手写 debounce，并说明立即执行版和非立即执行版如何实现。

- 难度：Medium
- ID：`ng-handwrite-debounce`
- 口述一句话：防抖是等用户停下来再执行，核心是重置 timer。

**参考答案：**

防抖是在连续触发时重置计时器，只在停止触发一段时间后执行。搜索输入、窗口 resize 很适合防抖。

```ts
function debounce<T extends (...args: any[]) => void>(fn: T, delay = 300, immediate = false) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    const callNow = immediate && !timer;
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      timer = null;
      if (!immediate) fn.apply(this, args);
    }, delay);

    if (callNow) fn.apply(this, args);
  };
}
```

收口总结：防抖关注最后一次触发，核心是清掉旧 timer。

---

### 140. 手写 throttle，并说明时间戳版和定时器版有什么差异。

- 难度：Medium
- ID：`ng-handwrite-throttle`
- 口述一句话：节流是固定频率执行，适合滚动这类高频事件。

**参考答案：**

节流是在固定时间间隔内最多执行一次，适合滚动、拖拽、mousemove 等高频事件。

```ts
function throttle<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - last);

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}
```

收口总结：节流关注稳定频率，核心是控制执行间隔。

---

### 141. 手写 Promise.all，需要处理顺序、失败、空数组和非 Promise 值。

- 难度：Hard
- ID：`ng-handwrite-promise-all`
- 口述一句话：Promise.all 保持顺序，全部成功才成功，一个失败就失败。

**参考答案：**

Promise.all 要保持结果顺序；任意一个失败就整体失败；空数组直接成功。

```ts
function promiseAll<T>(items: Array<T | Promise<T>>): Promise<T[]> {
  return new Promise((resolve, reject) => {
    if (items.length === 0) return resolve([]);

    const results: T[] = new Array(items.length);
    let finished = 0;

    items.forEach((item, index) => {
      Promise.resolve(item).then(value => {
        results[index] = value;
        finished++;
        if (finished === items.length) resolve(results);
      }, reject);
    });
  });
}
```

收口总结：Promise.all 的关键是顺序不乱、失败短路、计数完成。

---

### 142. 手写 Promise.race，它和 Promise.all 的行为有什么区别？

- 难度：Medium
- ID：`ng-handwrite-promise-race`
- 口述一句话：Promise.race 谁先落定就采用谁的结果。

**参考答案：**

Promise.race 返回第一个 settled 的结果，无论成功还是失败。

```ts
function promiseRace<T>(items: Array<T | Promise<T>>): Promise<T> {
  return new Promise((resolve, reject) => {
    for (const item of items) {
      Promise.resolve(item).then(resolve, reject);
    }
  });
}
```

常见用途是超时控制：请求 Promise 和 timeout Promise race。

---

### 143. 手写 new 操作符，并解释原型链接和构造函数返回对象的规则。

- 难度：Medium
- ID：`ng-handwrite-new`
- 口述一句话：new 做建对象、接原型、绑 this、处理返回值。

**参考答案：**

new 的核心是创建对象、链接原型、绑定 this 执行构造函数、处理返回值。

```ts
function myNew<T extends object>(Ctor: new (...args: any[]) => T, ...args: any[]): T {
  const obj = Object.create(Ctor.prototype);
  const ret = Ctor.apply(obj, args);
  return ret !== null && (typeof ret === 'object' || typeof ret === 'function') ? ret : obj;
}
```

收口总结：构造函数如果返回对象，就用返回对象，否则用新建对象。

---

### 144. 手写 instanceof，并解释它如何沿原型链查找。

- 难度：Medium
- ID：`ng-handwrite-instanceof`
- 口述一句话：instanceof 就是沿原型链找 constructor.prototype。

**参考答案：**

instanceof 本质是检查构造函数的 prototype 是否出现在对象原型链上。

```ts
function myInstanceof(obj: unknown, Ctor: Function): boolean {
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) return false;

  let proto = Object.getPrototypeOf(obj);
  const target = Ctor.prototype;

  while (proto) {
    if (proto === target) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
```

收口总结：instanceof 查的是原型链，不是直接比较构造函数。

---

### 145. 手写 bind，需要考虑参数预置和作为构造函数调用的情况。

- 难度：Hard
- ID：`ng-handwrite-bind`
- 口述一句话：bind 返回新函数，还要处理预置参数和 new 调用。

**参考答案：**

bind 返回一个新函数，固定 this 和部分参数；作为构造函数调用时，this 绑定要让位给 new。

```ts
function myBind(fn: Function, ctx: any, ...preset: any[]) {
  function bound(this: any, ...later: any[]) {
    const isNew = this instanceof bound;
    return fn.apply(isNew ? this : ctx, [...preset, ...later]);
  }
  bound.prototype = Object.create(fn.prototype);
  return bound;
}
```

收口总结：bind 难点是参数预置和 new 调用优先级。

---

### 146. 手写 EventEmitter，支持 on、off、once、emit。

- 难度：Medium
- ID：`ng-handwrite-event-emitter`
- 口述一句话：EventEmitter 核心是事件名到监听器集合的映射。

**参考答案：**

EventEmitter 用事件名映射监听器集合，emit 时依次执行。once 可以包装一层，执行后自动 off。

```ts
class EventEmitter {
  private events = new Map<string, Set<Function>>();

  on(name: string, fn: Function) {
    if (!this.events.has(name)) this.events.set(name, new Set());
    this.events.get(name)!.add(fn);
    return () => this.off(name, fn);
  }

  off(name: string, fn: Function) {
    this.events.get(name)?.delete(fn);
  }

  once(name: string, fn: Function) {
    const wrapper = (...args: any[]) => {
      this.off(name, wrapper);
      fn(...args);
    };
    this.on(name, wrapper);
  }

  emit(name: string, ...args: any[]) {
    for (const fn of this.events.get(name) ?? []) fn(...args);
  }
}
```

收口总结：核心结构是 eventName 到 listeners 的映射。

---

### 147. 手写数组扁平化 flat，支持指定展开深度。

- 难度：Medium
- ID：`ng-handwrite-array-flat`
- 口述一句话：数组扁平化就是递归展开，并控制 depth。

**参考答案：**

数组扁平化可以递归处理，每遇到数组且深度未耗尽就展开。

```ts
function flat(arr: any[], depth = 1): any[] {
  const res: any[] = [];

  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      res.push(...flat(item, depth - 1));
    } else {
      res.push(item);
    }
  }

  return res;
}
```

收口总结：递归时记得 depth 要递减，depth 为 0 就不再展开。

---

### 148. 手写 curry，并说明它和函数组合 compose 的区别。

- 难度：Hard
- ID：`ng-handwrite-curry`
- 口述一句话：柯里化是分批收集参数，收够再调用原函数。

**参考答案：**

柯里化把多参数函数变成一连串接收部分参数的函数，参数收集够了再执行。

```ts
function curry(fn: Function) {
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return (...next: any[]) => curried(...args, ...next);
  };
}

const add = (a: number, b: number, c: number) => a + b + c;
const curriedAdd = curry(add);
curriedAdd(1)(2)(3); // 6
```

compose 是函数从右到左组合执行，curry 是参数分批收集。

---

### 149. 手写 LRU Cache，为什么通常用 Map 或哈希表 + 双向链表？

- 难度：Hard
- ID：`ng-handwrite-lru`
- 口述一句话：LRU 的核心是快速查找和维护最近使用顺序。

**参考答案：**

LRU 要在 O(1) 内 get/put。JS 里 Map 保留插入顺序，可以用删除再插入表示最近使用。

```ts
class LRUCache<K, V> {
  private map = new Map<K, V>();

  constructor(private capacity: number) {}

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);

    if (this.map.size > this.capacity) {
      const oldest = this.map.keys().next().value as K;
      this.map.delete(oldest);
    }
  }
}
```

传统实现是哈希表 + 双向链表；Map 版利用了插入顺序。

---

<a id="topic-62"></a>

## 算法

### 150. 两数之和如何实现？为什么哈希表可以把时间复杂度降到 O(n)？

- 难度：Easy
- ID：`ng-algo-two-sum`
- 口述一句话：两数之和用哈希表记录已见数字，查补数。

**参考答案：**

两数之和用哈希表保存已经遍历过的值和下标。

```ts
function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need)!, i];
    seen.set(nums[i], i);
  }

  return [];
}
```

时间复杂度 O(n)，空间复杂度 O(n)。

---

### 151. 有效括号如何判断？为什么栈适合这个问题？

- 难度：Easy
- ID：`ng-algo-valid-parentheses`
- 口述一句话：括号匹配就是右括号必须匹配当前栈顶。

**参考答案：**

有效括号用栈。左括号入栈，右括号必须和栈顶匹配。

```ts
function isValid(s: string): boolean {
  const stack: string[] = [];
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else if (stack.pop() !== pairs[ch]) {
      return false;
    }
  }

  return stack.length === 0;
}
```

时间复杂度 O(n)，空间复杂度 O(n)。

---

### 152. 最长无重复子串如何用滑动窗口解决？

- 难度：Medium
- ID：`ng-algo-longest-substring`
- 口述一句话：滑动窗口口诀：右边扩，重复时左边跳。

**参考答案：**

最长无重复子串用滑动窗口。右指针扩展，遇到重复字符就移动左边界。

```ts
function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let left = 0;
  let ans = 0;

  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (last.has(ch) && last.get(ch)! >= left) {
      left = last.get(ch)! + 1;
    }
    last.set(ch, right);
    ans = Math.max(ans, right - left + 1);
  }

  return ans;
}
```

时间复杂度 O(n)。

---

### 153. 二分查找如何避免边界错误？左闭右闭和左闭右开有什么区别？

- 难度：Medium
- ID：`ng-algo-binary-search`
- 口述一句话：二分查找最重要的是区间定义始终一致。

**参考答案：**

二分查找关键是区间定义一致。下面是左闭右闭写法。

```ts
function binarySearch(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1;
}
```

左闭右闭用 left <= right；左闭右开通常用 left < right。不要混用边界规则。

---
