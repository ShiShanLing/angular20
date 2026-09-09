# iOS 面试题库 - 题目标题版
> 来源：`ios.job.questions.codex.md`
> 题目数量：146 题

## 目录

- [Swift 基础（15）](#topic-1)
- [Objective-C / Runtime（10）](#topic-2)
- [UIKit / App 生命周期（4）](#topic-3)
- [UIKit / 布局（1）](#topic-4)
- [UIKit / 列表（2）](#topic-5)
- [UIKit / 性能（1）](#topic-6)
- [UIKit / 渲染（1）](#topic-7)
- [UIKit / 事件响应（3）](#topic-8)
- [网络 / 安全（3）](#topic-9)
- [网络 / TCP（1）](#topic-10)
- [网络 / HTTP（1）](#topic-11)
- [网络 / 鉴权（2）](#topic-12)
- [网络 / URLSession（1）](#topic-13)
- [网络 / 架构（1）](#topic-14)
- [网络 / 缓存（1）](#topic-15)
- [数据存储（1）](#topic-16)
- [数据存储 / 安全（1）](#topic-17)
- [数据存储 / Core Data（1）](#topic-18)
- [数据存储 / 迁移（1）](#topic-19)
- [并发 / 线程（2）](#topic-20)
- [并发 / GCD（6）](#topic-21)
- [并发 / OperationQueue（2）](#topic-22)
- [并发 / RunLoop（4）](#topic-23)
- [Swift Concurrency（11）](#topic-24)
- [内存管理（8）](#topic-25)
- [内存管理 / 调试（1）](#topic-26)
- [架构 / MVC（1）](#topic-27)
- [架构 / MVVM（2）](#topic-28)
- [架构 / Coordinator（1）](#topic-29)
- [架构 / 依赖注入（1）](#topic-30)
- [架构 / 可测试性（1）](#topic-31)
- [架构 / 模块化（3）](#topic-32)
- [工程化 / 配置（1）](#topic-33)
- [工程化 / CI/CD（1）](#topic-34)
- [工程化 / 测试（1）](#topic-35)
- [性能 / 启动优化（4）](#topic-36)
- [性能 / 卡顿优化（1）](#topic-37)
- [性能 / 列表优化（2）](#topic-38)
- [性能 / 图片优化（2）](#topic-39)
- [性能 / 内存优化（2）](#topic-40)
- [性能 / 包体积（1）](#topic-41)
- [性能 / 网络优化（1）](#topic-42)
- [性能 / Instruments（1）](#topic-43)
- [Mach-O / dyld（6）](#topic-44)
- [Mach-O / Runtime 初始化（1）](#topic-45)
- [Mach-O / 包体积（1）](#topic-46)
- [项目表达（1）](#topic-47)
- [项目表达 / 架构（1）](#topic-48)
- [项目表达 / Bug 定位（1）](#topic-49)
- [项目表达 / 性能（1）](#topic-50)
- [项目表达 / 网络层（1）](#topic-51)
- [项目表达 / 缓存（1）](#topic-52)
- [项目表达 / 重构（1）](#topic-53)
- [项目表达 / 技术取舍（1）](#topic-54)
- [项目表达 / 扩展性（1）](#topic-55)
- [算法 / 哈希表（1）](#topic-56)
- [算法 / 链表（2）](#topic-57)
- [算法 / 栈（1）](#topic-58)
- [算法 / 滑动窗口（1）](#topic-59)
- [算法 / 二叉树（2）](#topic-60)
- [算法 / 二分查找（1）](#topic-61)
- [算法 / 排序（1）](#topic-62)
- [算法 / 缓存（1）](#topic-63)
- [工程化 / 线上质量（2）](#topic-64)
- [调试 / Xcode Debugger（2）](#topic-65)
- [调试 / LLDB（1）](#topic-66)
- [性能 / 卡顿与渲染（1）](#topic-67)
- [并发 / Timer（1）](#topic-68)
- [内存 / ARC（1）](#topic-69)

<a id="topic-1"></a>

## Swift 基础

### 1. Swift 中 Optional 的本质是什么？为什么 Swift 要设计 Optional？

### 2. `if let` 和 `guard let` 有什么区别？分别适合什么场景？

### 3. Struct 和 Class 有什么区别？为什么 Swift 推荐优先使用值类型？

### 4. 值类型和引用类型在赋值、传参、内存管理上的差异是什么？

### 5. 什么是 Copy-on-Write？Swift 的 Array、Dictionary 为什么可以既像值类型又避免频繁拷贝？

### 6. Swift Enum 的关联值和原始值有什么区别？适合用在哪些业务建模场景？

### 7. Protocol 和 Class 继承有什么区别？为什么 Swift 强调面向协议编程？

### 8. Protocol Extension 中的方法什么时候是静态派发，什么时候会动态派发？

### 9. Swift 泛型解决了什么问题？和协议作为类型使用有什么区别？

### 10. Swift 闭包捕获变量的规则是什么？捕获值类型和引用类型有什么差异？

### 11. `@escaping` 是什么？为什么异步回调通常需要标记为 escaping？

### 12. `@autoclosure` 是什么？它解决了什么可读性或延迟执行问题？

### 13. Swift 中 `private`、`fileprivate`、`internal`、`public`、`open` 有什么区别？

### 14. `Codable` 如何处理 JSON 字段名和 Model 属性名不一致？如何处理可选字段？

### 15. `Result`、`throws`、Optional 分别适合表达什么类型的失败？

<a id="topic-2"></a>

## Objective-C / Runtime

### 16. Objective-C 的消息发送流程是什么？`objc_msgSend` 大致做了什么？

### 17. Class 和 Meta Class 的关系是什么？实例方法和类方法分别存在哪里？

### 18. `isa` 指针有什么作用？对象、类、元类之间如何通过 isa 串起来？

### 19. Category 能不能添加属性？为什么？Associated Object 是如何补充存储能力的？

### 20. Category 和 Extension 有什么区别？它们分别在编译期和运行期有什么特点？

### 21. KVO 的实现原理是什么？为什么说它依赖 Runtime 动态子类？

### 22. KVC 的查找顺序是什么？访问不存在的 key 会发生什么？

### 23. Method Swizzling 的原理是什么？在业务中使用它有哪些风险？

### 24. Objective-C Block 有哪些类型？为什么 Block 通常需要 copy？

### 25. ARC 是编译期机制还是运行期机制？它和 Runtime 如何配合管理引用计数？

<a id="topic-3"></a>

## UIKit / App 生命周期

### 26. App 从点击图标到首屏展示大致经历了哪些阶段？

### 27. `AppDelegate` 和 `SceneDelegate` 分别负责什么？多 Scene 场景下生命周期有什么变化？

### 28. ViewController 生命周期方法的调用顺序是什么？每个方法适合做什么？

### 29. `loadView`、`viewDidLoad`、`viewWillAppear`、`viewDidAppear` 有什么区别？

<a id="topic-4"></a>

## UIKit / 布局

### 30. Auto Layout 的基本原理是什么？约束冲突通常如何排查？

<a id="topic-5"></a>

## UIKit / 列表

### 31. TableView Cell 复用机制是什么？如何避免复用导致的数据错乱？

### 32. CollectionView 和 TableView 的核心区别是什么？自定义 Layout 适合解决什么问题？

<a id="topic-6"></a>

## UIKit / 性能

### 33. 如何优化 TableView 或 CollectionView 的滚动性能？

<a id="topic-7"></a>

## UIKit / 渲染

### 34. `UIView` 和 `CALayer` 有什么关系？为什么 UIView 负责事件而 CALayer 负责显示？

<a id="topic-8"></a>

## UIKit / 事件响应

### 35. 响应链是什么？事件找不到处理者时会如何向上传递？

### 36. `hitTest(_:with:)` 和 `point(inside:with:)` 的作用是什么？如何扩大按钮点击区域？

### 37. 手势和按钮点击冲突怎么处理？多个 Gesture Recognizer 如何协调？

<a id="topic-9"></a>

## 网络 / 安全

### 38. HTTP 和 HTTPS 有什么区别？HTTPS 相比 HTTP 多了哪些安全能力？

### 39. HTTPS 相比 HTTP 多了什么？TLS 握手大致解决什么问题？

### 40. HTTPS 一定安全吗？还可能存在哪些安全风险？

<a id="topic-10"></a>

## 网络 / TCP

### 41. TCP 三次握手和四次挥手分别解决什么问题？

<a id="topic-11"></a>

## 网络 / HTTP

### 42. GET 和 POST 有什么区别？幂等性、安全性、缓存方面如何理解？

<a id="topic-12"></a>

## 网络 / 鉴权

### 43. Cookie 和 Token 有什么区别？移动端登录态通常如何设计？

### 44. Token 过期如何刷新？如何避免多个请求同时触发重复刷新？

<a id="topic-13"></a>

## 网络 / URLSession

### 45. `URLSession` 请求如何取消、重试和设置超时？

<a id="topic-14"></a>

## 网络 / 架构

### 46. 如何设计一个可测试、可扩展的网络层？需要包含哪些模块？

<a id="topic-15"></a>

## 网络 / 缓存

### 47. 图片缓存如何设计？内存缓存、磁盘缓存、下载取消、解码分别如何处理？

<a id="topic-16"></a>

## 数据存储

### 48. UserDefaults、Keychain、文件、SQLite/Core Data 分别适合存什么？

<a id="topic-17"></a>

## 数据存储 / 安全

### 49. 为什么 Token、密码类敏感信息不应该放在 UserDefaults？Keychain 的适用场景是什么？

<a id="topic-18"></a>

## 数据存储 / Core Data

### 50. Core Data 的核心对象有哪些？Context、Model、Persistent Store Coordinator 分别负责什么？

<a id="topic-19"></a>

## 数据存储 / 迁移

### 51. App 本地数据库结构升级时如何做数据迁移？如何降低迁移失败风险？

<a id="topic-20"></a>

## 并发 / 线程

### 52. 进程和线程的区别是什么？iOS App 中主线程承担哪些职责？

### 53. 为什么主线程不能做耗时任务？哪些操作容易造成主线程卡顿？

<a id="topic-21"></a>

## 并发 / GCD

### 54. GCD 中 `sync` 和 `async` 的区别是什么？它们和是否开新线程是一回事吗？

### 55. 串行队列和并发队列有什么区别？队列和线程之间是什么关系？

### 56. `dispatch_sync` 到主队列为什么可能死锁？请用执行流程解释。

### 57. 如何用 DispatchGroup 等待多个异步任务全部完成？适合什么场景？

### 58. Semaphore 可以解决什么问题？用它控制并发数时要注意什么？

### 59. iOS GCD 是什么？sync/async、串行/并发队列、常用 API 和死锁条件分别怎么理解？

<a id="topic-22"></a>

## 并发 / OperationQueue

### 60. OperationQueue 相比 GCD 有什么优势？依赖、取消、优先级如何体现？

### 61. iOS OperationQueue 是什么？相比 GCD 有什么特点？依赖、取消、优先级和常见坑怎么理解？

<a id="topic-23"></a>

## 并发 / RunLoop

### 62. RunLoop 是什么？它和线程是什么关系？

### 63. Timer 为什么有时不准？RunLoop Mode 对 Timer 有什么影响？

### 64. 如何实现一个常驻线程？为什么需要给线程启动 RunLoop？

### 65. iOS RunLoop 是什么？它和线程、Timer、Mode、主线程卡顿有什么关系？

<a id="topic-24"></a>

## Swift Concurrency

### 66. `async/await` 和 GCD 如何选择？它们解决的问题有什么不同？

### 67. `async/await` 相比回调有什么优势？错误处理和取消如何表达？

### 68. `Task` 是什么？什么时候需要用 `Task {}` 创建异步上下文？

### 69. Structured Concurrency 和 Unstructured Task 有什么区别？为什么结构化并发更容易管理生命周期？

### 70. `async let` 和 `TaskGroup` 分别适合什么场景？如何选择？

### 71. `actor` 解决了什么问题？它和用锁保护共享状态有什么区别？

### 72. `MainActor` 的作用是什么？为什么 UI 更新通常需要放在 MainActor 上？

### 73. `Sendable` 是什么？它能保证线程安全吗？什么时候需要 `@unchecked Sendable`？

### 74. `@Sendable` 闭包和普通闭包有什么区别？为什么捕获非线程安全对象可能报警？

### 75. Task 取消是强制取消还是协作式取消？业务代码如何正确响应取消？

### 76. Actor Isolation 是什么？为什么外部访问 actor 隔离状态通常需要 `await`？

<a id="topic-25"></a>

## 内存管理

### 77. ARC 的基本原理是什么？引用计数在对象生命周期中如何变化？

### 78. `strong`、`weak`、`assign`、`copy` 的区别是什么？分别适合什么属性？

### 79. `weak` 为什么能在对象释放后自动置 nil？大致依赖什么机制？

### 80. 什么情况下会发生循环引用？ViewController 中最常见的循环引用有哪些？

### 81. 闭包如何避免循环引用？`weak self` 和 `unowned self` 如何选择？

### 82. Delegate 为什么通常用 weak？什么时候 delegate 不能用 weak？

### 83. Timer 为什么容易造成循环引用？如何修复 Timer 持有 target 的问题？

### 84. Autorelease Pool 的作用是什么？在循环创建大量临时对象时为什么要手动加 autoreleasepool？

<a id="topic-26"></a>

## 内存管理 / 调试

### 85. 如何定位内存泄漏？Memory Graph、Leaks、Allocations 分别能看什么？

<a id="topic-27"></a>

## 架构 / MVC

### 86. MVC 在 iOS 项目里常见的问题是什么？为什么容易变成 Massive View Controller？

<a id="topic-28"></a>

## 架构 / MVVM

### 87. MVVM 解决了什么问题？ViewModel 应该承担哪些职责？

### 88. ViewModel 应该做什么，不应该做什么？如何避免 ViewModel 变胖？

<a id="topic-29"></a>

## 架构 / Coordinator

### 89. Coordinator 的作用是什么？它如何降低 ViewController 之间的跳转耦合？

<a id="topic-30"></a>

## 架构 / 依赖注入

### 90. 依赖注入解决什么问题？构造器注入、属性注入、服务定位器有什么区别？

<a id="topic-31"></a>

## 架构 / 可测试性

### 91. 如何设计一个可测试的网络层？Mock、Stub、Protocol 抽象如何使用？

<a id="topic-32"></a>

## 架构 / 模块化

### 92. iOS 项目如何做模块化？模块之间依赖方向应该如何设计？

### 93. 组件化和模块化有什么区别？它们分别解决什么工程问题？

### 94. 如何避免模块之间循环依赖？路由、协议下沉、依赖倒置可以怎么用？

<a id="topic-33"></a>

## 工程化 / 配置

### 95. iOS 项目如何做 Dev、Staging、Production 多环境配置？

<a id="topic-34"></a>

## 工程化 / CI/CD

### 96. iOS 项目的 CI/CD 通常包含哪些步骤？证书、打包、测试、分发如何处理？

<a id="topic-35"></a>

## 工程化 / 测试

### 97. 单元测试应该测什么？哪些逻辑不适合直接放在 UI 层里测试？

<a id="topic-36"></a>

## 性能 / 启动优化

### 98. App 启动分为哪些阶段？冷启动和热启动有什么区别？

### 99. 启动优化可以从哪些方向做？如何区分 main 前和 main 后耗时？

### 100. 如何统计启动耗时？埋点、MetricKit、Instruments 各有什么作用？

### 101. iOS 启动优化应该怎么做？冷启动、main 前、main 后分别要关注什么？

<a id="topic-37"></a>

## 性能 / 卡顿优化

### 102. 如何监控卡顿？RunLoop 监控、FPS、主线程堆栈采样分别有什么思路？

<a id="topic-38"></a>

## 性能 / 列表优化

### 103. 列表滚动卡顿怎么排查？布局、图片解码、主线程任务、离屏渲染如何分析？

### 104. iOS 列表滚动优化怎么做？UITableView/UICollectionView 可能遇到哪些问题？

<a id="topic-39"></a>

## 性能 / 图片优化

### 105. 图片加载为什么会卡？图片解码应该放在哪个线程？

### 106. iOS 图片解码与缓存怎么理解？使用 SDWebImage 时要注意哪些问题？

<a id="topic-40"></a>

## 性能 / 内存优化

### 107. 如何降低内存峰值？大图、大数组、缓存、临时对象分别如何处理？

### 108. OOM 怎么排查？它和普通 crash 的定位方式有什么不同？

<a id="topic-41"></a>

## 性能 / 包体积

### 109. App 包体积怎么优化？资源、架构切片、无用代码、Link Map 分析如何使用？

<a id="topic-42"></a>

## 性能 / 网络优化

### 110. 网络请求慢怎么排查？DNS、连接、TLS、服务端、弱网、缓存分别如何分析？

<a id="topic-43"></a>

## 性能 / Instruments

### 111. Instruments 常用哪些工具？Time Profiler、Allocations、Leaks、Core Animation 分别看什么？

<a id="topic-44"></a>

## Mach-O / dyld

### 112. Mach-O 是什么？它大致由 Header、Load Commands、Segment、Section 哪些部分组成？

### 113. 静态库和动态库有什么区别？它们对包体积、启动速度、链接方式有什么影响？

### 114. Framework 是什么？Static Framework 和 Dynamic Framework 有什么区别？

### 115. dyld 在 App 启动时做了什么？加载动态库、符号绑定、Runtime 初始化分别在哪个阶段？

### 116. Rebase 和 Bind 是什么？它们为什么会影响启动耗时？

### 117. 为什么动态库过多会影响启动？大型项目如何控制动态库数量？

<a id="topic-45"></a>

## Mach-O / Runtime 初始化

### 118. `+load` 和 `+initialize` 有什么区别？它们对启动性能有什么影响？

<a id="topic-46"></a>

## Mach-O / 包体积

### 119. Link Map 能看什么？如何用它分析二进制体积和大符号？

<a id="topic-47"></a>

## 项目表达

### 120. 请用 3 分钟介绍一个你最熟悉的 iOS 项目：背景、职责、技术栈、难点、结果。

<a id="topic-48"></a>

## 项目表达 / 架构

### 121. 你负责的项目架构是如何设计的？模块划分、依赖方向、数据流分别是什么？

<a id="topic-49"></a>

## 项目表达 / Bug 定位

### 122. 讲一个你定位过的复杂线上 Bug：现象、复现、定位过程、根因、修复和预防。

<a id="topic-50"></a>

## 项目表达 / 性能

### 123. 讲一个你做过的性能优化案例：指标、工具、瓶颈、方案、优化结果。

<a id="topic-51"></a>

## 项目表达 / 网络层

### 124. 你项目中的网络层是怎么设计的？鉴权、错误处理、重试、取消和测试如何支持？

<a id="topic-52"></a>

## 项目表达 / 缓存

### 125. 讲一个缓存设计案例：缓存对象、过期策略、一致性、内存和磁盘如何平衡？

<a id="topic-53"></a>

## 项目表达 / 重构

### 126. 讲一个架构重构案例：为什么重构、怎么分阶段推进、如何验证没有引入回归？

<a id="topic-54"></a>

## 项目表达 / 技术取舍

### 127. 讲一次技术选型或方案取舍：候选方案、约束条件、最终选择和代价是什么？

<a id="topic-55"></a>

## 项目表达 / 扩展性

### 128. 如果你的项目用户量或数据量扩大 10 倍，当前架构有哪些风险？你会怎么改？

<a id="topic-56"></a>

## 算法 / 哈希表

### 129. 两数之和如何实现？为什么哈希表可以把时间复杂度降到 O(n)？

<a id="topic-57"></a>

## 算法 / 链表

### 130. 如何反转单链表？迭代和递归写法分别如何理解？

### 131. 如何合并两个有序链表？时间复杂度和空间复杂度是多少？

<a id="topic-58"></a>

## 算法 / 栈

### 132. 有效括号如何判断？为什么栈适合解决这个问题？

<a id="topic-59"></a>

## 算法 / 滑动窗口

### 133. 最长无重复子串如何用滑动窗口解决？窗口左右边界如何移动？

<a id="topic-60"></a>

## 算法 / 二叉树

### 134. 二叉树层序遍历如何实现？为什么队列适合 BFS？

### 135. 二叉树最大深度如何计算？递归和迭代分别怎么写？

<a id="topic-61"></a>

## 算法 / 二分查找

### 136. 二分查找如何避免死循环和边界错误？左闭右闭、左闭右开写法有什么区别？

<a id="topic-62"></a>

## 算法 / 排序

### 137. 快速排序的核心思想是什么？平均和最坏时间复杂度分别是多少？

<a id="topic-63"></a>

## 算法 / 缓存

### 138. LRU Cache 如何设计？为什么通常用哈希表加双向链表？

<a id="topic-64"></a>

## 工程化 / 线上质量

### 139. iOS 项目中的错误上报是什么？它和日志、崩溃收集有什么区别？

### 140. iOS 崩溃收集是做什么的？常用第三方工具有哪些？

<a id="topic-65"></a>

## 调试 / Xcode Debugger

### 141. Xcode Debugger 中常见断点类型有哪些？Swift Error、Exception、Symbolic、Runtime Issue、Constraint Error、Test Failure 分别用来做什么？

### 142. Xcode View Debugger 是什么？适合排查哪些 UI 问题？

<a id="topic-66"></a>

## 调试 / LLDB

### 143. LLDB 常用命令有哪些？po、p、expr、bt、thread backtrace all、continue、next、step、finish 分别怎么用？

<a id="topic-67"></a>

## 性能 / 卡顿与渲染

### 144. iOS 中如何避免卡帧和掉帧？FPS、主线程、列表、图片和渲染分别要注意什么？

<a id="topic-68"></a>

## 并发 / Timer

### 145. iOS Timer 是什么？它和 RunLoop 有什么关系？使用时要注意哪些坑？

<a id="topic-69"></a>

## 内存 / ARC

### 146. iOS 中常见的循环引用有哪些？分别应该如何避免和排查？

