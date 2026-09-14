# iOS Job Interview Learning Roadmap

> 目标：面向 iOS 求职和晋升考核，建立一条从基础题、项目题、工程题到底层题的复习路线。  
> 适用对象：准备校招、社招、转岗、晋升答辩、技术考核。  
> 建议周期：`8-16 周`集中准备，之后持续补项目和源码能力。

## 能力模型

iOS 学习通常覆盖 6 类能力：

1. Swift / Objective-C 语言基础。
2. UIKit / SwiftUI 和 iOS 应用开发能力。
3. 网络、存储、并发、内存管理等通用工程基础。
4. 架构设计、模块化、测试、性能优化。
5. Runtime、RunLoop、Mach-O、dyld、启动优化等底层理解。
6. 项目经验表达、问题定位能力、技术取舍能力。

学习准备不要只背答案。每个知识点都应该做到：

1. 能说清概念。
2. 能写出代码。
3. 能结合项目场景。
4. 能说出常见坑。
5. 能讲一点底层原理。

## 阶段 1：Swift 高频基础

### 必会知识

- `let` 和 `var`
- Optional：`?`、`!`、`if let`、`guard let`
- Struct 和 Class
- Enum
- Protocol
- Extension
- Generics
- Closure
- Escaping Closure
- Copy-on-Write
- Access Control
- Error Handling
- `Codable`
- `Result`

### 高频题

- Swift 中 Optional 的本质是什么？
- `guard let` 和 `if let` 有什么区别？
- Struct 和 Class 有什么区别？
- Swift 为什么推荐值类型？
- 什么是 Copy-on-Write？
- Closure 为什么可能造成循环引用？
- `weak` 和 `unowned` 有什么区别？
- Protocol 和 Class 继承有什么区别？
- Protocol Extension 的静态派发和动态派发有什么区别？
- Swift 泛型解决什么问题？
- `Codable` 如何处理字段名不一致？

### 练习任务

- 手写一个泛型缓存容器。
- 写一个带 `Codable` 的 API Model。
- 写一个闭包循环引用示例，并修复它。
- 写一段代码解释值类型和引用类型差异。

### 回答模板

回答语言题时可以按这个顺序：

1. 先给定义。
2. 再说使用场景。
3. 再说优缺点。
4. 最后结合项目或代码例子。

## 阶段 2：Objective-C 与 Runtime 基础

### 必会知识

- Objective-C 对象模型
- `NSObject`
- `isa`
- Class 和 Meta Class
- Category
- Extension
- Protocol
- Block
- KVC
- KVO
- Runtime
- `objc_msgSend`
- Method Swizzling

- Associated Object
- ARC

### 高频题

- Objective-C 的消息发送流程是什么？
- `objc_msgSend` 大致做了什么？
- Class 和 Meta Class 的关系是什么？
- Category 能不能添加属性？为什么？
- Associated Object 的原理是什么？
- Category 和 Extension 有什么区别？
- KVO 的实现原理是什么？
- KVC 的查找顺序是什么？
- Method Swizzling 的风险是什么？
- Block 的类型有哪些？
- Block 为什么需要 copy？
- ARC 是编译期还是运行期机制？
- `weak` 的实现原理是什么？

### 练习任务

- 写一个 Category 添加关联属性。
- 写一个 Method Swizzling Demo。
- 写一个 KVO 观察属性变化 Demo。
- 用 Runtime 打印类的方法列表、属性列表、协议列表。
- 写一个 Block 捕获变量示例。

## 阶段 3：UIKit 与 App 基础

### 必会知识

- App 生命周期
- Scene 生命周期
- ViewController 生命周期
- View 生命周期
- Auto Layout
- Responder Chain
- Event Handling
- Hit Testing
- Gesture Recognizer
- `UITableView`
- `UICollectionView`
- Cell Reuse
- Navigation
- Modal
- `UIScrollView`
- Safe Area
- Dark Mode

### 高频题

- App 从启动到首屏展示经历了什么？
- `AppDelegate` 和 `SceneDelegate` 分别负责什么？
- ViewController 生命周期方法调用顺序是什么？
- `loadView`、`viewDidLoad`、`viewWillAppear` 有什么区别？
- Auto Layout 的原理是什么？
- TableView Cell 复用机制是什么？
- 如何优化列表滚动性能？
- `UIView` 和 `CALayer` 有什么关系？
- 响应链是什么？
- 事件如何从屏幕触摸传递到 View？
- `hitTest(_:with:)` 和 `point(inside:with:)` 的作用是什么？
- 手势和按钮点击冲突怎么处理？

### 练习任务

- 手写一个 TableView 列表页。
- 手写一个 CollectionView 瀑布流或网格页。
- 写一个自定义 View，并正确处理布局。
- 写一个扩大按钮点击区域的 Demo。
- 写一个响应链传递 Demo。

## 阶段 4：网络与数据存储

### 必会知识

- HTTP / HTTPS
- TCP / UDP 基础
- TLS 握手基础
- DNS
- RESTful API
- `URLSession`
- 请求取消和重试
- Token 鉴权
- Cookie
- Keychain
- UserDefaults
- FileManager
- SQLite
- Core Data
- SwiftData
- 缓存策略

### 高频题

- HTTP 和 HTTPS 有什么区别？
- HTTPS 一定安全吗？
- TCP 三次握手和四次挥手是什么？
- GET 和 POST 有什么区别？
- Cookie 和 Token 有什么区别？
- 登录态如何设计？
- Token 过期如何刷新？
- 网络请求如何取消？
- 如何设计一个网络层？
- 图片缓存如何设计？
- UserDefaults、Keychain、文件、数据库分别适合存什么？
- Core Data 的核心对象有哪些？
- 数据库迁移怎么做？

### 练习任务

- 封装一个 API Client。
- 实现 Token 自动刷新。
- 实现一个简单图片缓存。
- 用 Keychain 保存登录凭证。
- 写一个 Core Data 或 SwiftData Demo。

## 阶段 5：并发、线程与 RunLoop

### 必会知识

- Thread
- GCD
- Serial Queue
- Concurrent Queue
- Main Queue
- Global Queue
- DispatchGroup
- Semaphore
- Barrier
- OperationQueue
- RunLoop
- Timer
- Source
- Observer
- Swift Concurrency

### Swift Concurrency 必会知识

- `async/await`
- `Task`
- `TaskGroup`
- `async let`
- `actor`
- `MainActor`
- `Sendable`
- `@Sendable`
- Structured Concurrency
- Unstructured Task
- Task Cancellation
- Task Priority
- Actor Isolation
- Global Actor

### 高频题

- 进程和线程的区别是什么？
- 主线程为什么不能做耗时任务？
- GCD 同步和异步有什么区别？
- 串行队列和并发队列有什么区别？
- `dispatch_sync` 在主队列为什么会死锁？
- 如何控制多个异步任务完成后再回调？
- Semaphore 可以解决什么问题？
- OperationQueue 相比 GCD 有什么优势？
- RunLoop 是什么？
- RunLoop 和线程是什么关系？
- Timer 为什么有时不准？
- 如何常驻线程？
- `async/await` 和 GCD 如何选择？
- `async/await` 相比回调有什么优势？
- `Task` 是什么？什么时候需要用 `Task {}`？
- Structured Concurrency 和 Unstructured Task 有什么区别？
- `async let` 和 `TaskGroup` 分别适合什么场景？
- `actor` 解决了什么问题？
- `MainActor` 的作用是什么？
- `Sendable` 是什么？它能保证线程安全吗？
- `@Sendable` 闭包和普通闭包有什么区别？
- Task 取消是强制取消还是协作式取消？
- Actor Isolation 是什么？

### 练习任务

- 写一个 GCD 死锁示例。
- 用 DispatchGroup 合并多个请求。
- 用 Semaphore 控制并发数。
- 写一个 RunLoop + Timer Demo。
- 写一个用 `async/await` 的网络请求函数。
- 写一个 `async let` 并发请求 Demo。
- 写一个 `TaskGroup` 批量请求 Demo。
- 写一个 `actor` 保护共享状态 Demo。
- 写一个 `@Sendable` 闭包捕获非线程安全对象的示例，并解释编译器警告。

## 阶段 6：内存管理

### 必会知识

- ARC
- 引用计数
- Strong
- Weak
- Unowned
- Retain Cycle
- Autorelease Pool
- MRC 了解
- Block 内存管理
- Delegate 内存语义
- Timer 循环引用
- Notification 生命周期

### 高频题

- ARC 的原理是什么？
- `strong`、`weak`、`assign`、`copy` 的区别是什么？
- `weak` 为什么自动置 nil？
- 什么情况下会发生循环引用？
- 闭包如何避免循环引用？
- Delegate 为什么通常用 weak？
- Timer 为什么容易造成循环引用？
- Autorelease Pool 的作用是什么？
- 如何定位内存泄漏？
- Instruments 里 Leaks 和 Allocations 怎么用？

### 练习任务

- 写一个 ViewController 和闭包循环引用示例。
- 写一个 Timer 循环引用示例并修复。
- 用 Memory Graph 找泄漏。
- 用 Instruments 分析对象生命周期。

## 阶段 7：架构与工程化

### 必会知识

- MVC
- MVVM
- MVP
- VIPER
- Coordinator
- Clean Architecture
- Dependency Injection
- Repository Pattern
- Modularization
- Componentization
- SPM
- CocoaPods
- Tuist / XcodeGen
- 多环境配置
- CI/CD
- Unit Test
- UI Test
- Snapshot Test

### 高频题

- MVC 有什么问题？
- MVVM 解决了什么问题？
- ViewModel 应该做什么，不应该做什么？
- Coordinator 的作用是什么？
- 如何设计一个可测试的网络层？
- 如何做模块化？
- 组件化和模块化有什么区别？
- 多业务线如何管理依赖？
- 如何避免模块之间循环依赖？
- 如何做多环境配置？
- 你们项目的 CI/CD 怎么做？
- 单元测试应该测什么？

### 练习任务

- 把一个 MVC Demo 改成 MVVM。
- 给 ViewModel 写单元测试。
- 用 SPM 拆一个基础模块。
- 设计一个登录模块、首页模块、账户模块的依赖关系图。

## 阶段 8：性能优化

### 必会知识

- 启动优化
- 首屏优化
- 包体积优化
- 卡顿优化
- 列表优化
- 图片优化
- 内存优化
- I/O 优化
- 网络优化
- 耗电优化
- Instruments
- MetricKit

### 高频题

- App 启动分为哪些阶段？
- 启动优化可以从哪些方向做？
- 如何统计启动耗时？
- 如何监控卡顿？
- 列表滚动卡顿怎么排查？
- 图片加载为什么会卡？
- 图片解码应该放在哪个线程？
- 如何降低内存峰值？
- 如何排查 OOM？
- 包体积怎么优化？
- 网络请求慢怎么排查？
- Instruments 常用哪些工具？

### 练习任务

- 用 Time Profiler 分析一个耗时方法。
- 优化一个图片列表页。
- 写一个 FPS 或卡顿监控 Demo。
- 分析 App 包体积组成。
- 用 Allocations 观察内存增长。

## 阶段 9：Mach-O、dyld 与启动流程

### 必会知识

- Mach-O
- Header
- Load Commands
- Segment
- Section
- Symbol
- Link Map
- Static Library
- Dynamic Library
- Framework
- dyld
- Rebase
- Bind
- Objective-C Runtime 初始化
- `+load`
- `+initialize`

### 高频题

- Mach-O 是什么？
- 静态库和动态库有什么区别？
- Framework 是什么？
- dyld 在 App 启动时做了什么？
- Rebase 和 Bind 是什么？
- 为什么动态库过多会影响启动？
- `+load` 和 `+initialize` 有什么区别？
- 如何减少启动阶段的耗时？
- Link Map 能看什么？

### 练习任务

- 用工具查看一个 Mach-O 文件。
- 打开 Link Map 并分析符号大小。
- 写多个 `+load` 方法观察调用顺序。
- 统计动态库数量。

## 阶段 10：项目经验包装

### 项目表达结构

每个项目都准备一份 3 分钟版本和 10 分钟版本。

### 3 分钟版本

1. 项目是什么，面向什么用户。
2. 你负责什么模块。
3. 技术栈是什么。
4. 遇到一个最有代表性的问题。
5. 你如何解决，结果如何。

### 10 分钟版本

1. 业务背景。
2. 架构设计。
3. 模块划分。
4. 核心技术点。
5. 难点和取舍。
6. 性能或稳定性优化。
7. 测试和发布。
8. 复盘和改进空间。

### 必备项目素材

- 一个完整 App 项目。
- 一个网络层设计。
- 一个缓存设计。
- 一个架构重构案例。
- 一个性能优化案例。
- 一个线上 Bug 定位案例。
- 一个测试或 CI 改进案例。
- 一个跨团队协作或技术选型案例。

### 常追问

- 这个方案为什么这样设计？
- 有没有替代方案？
- 你怎么验证它有效？
- 线上有没有出现过问题？
- 如果用户量扩大 10 倍怎么办？
- 如果让你重做，你会怎么改？
- 这个模块如何测试？
- 这个方案的缺点是什么？

## 阶段 11：算法与计算机基础

### iOS 常见算法题

- 数组
- 字符串
- 哈希表
- 双指针
- 滑动窗口
- 栈
- 队列
- 链表
- 二叉树
- 二分查找
- 排序
- 动态规划基础

### 高频题型

- 两数之和
- 反转链表
- 合并两个有序链表
- 有效括号
- 最长无重复子串
- 二叉树层序遍历
- 二叉树最大深度
- 快速排序
- 二分查找
- LRU Cache

### 计算机基础

- 进程和线程
- 死锁
- 锁
- 内存分区
- HTTP / HTTPS
- TCP / UDP
- DNS
- 数据库索引
- 设计模式

## 阶段 12：冲刺时间表

### 第 1-2 周：Swift 与 UIKit

- Swift 高频题。
- ViewController 生命周期。
- TableView / CollectionView。
- Auto Layout。
- 响应链。

### 第 3-4 周：网络、存储、并发、内存

- HTTP / HTTPS / TCP。
- 网络层设计。
- 登录态和 Token。
- GCD / OperationQueue / async-await。
- ARC 和循环引用。

### 第 5-6 周：架构、工程化、性能

- MVC / MVVM / Coordinator。
- 模块化。
- 测试。
- 启动优化。
- 卡顿优化。
- 内存优化。

### 第 7-8 周：底层与项目表达

- Runtime。
- RunLoop。
- KVO / KVC。
- Mach-O / dyld。
- 项目复盘。
- 模拟演练。

### 第 9-12 周：强化与查漏补缺

- 刷算法。
- 阅读源码。
- 整理错题。
- 优化简历。
- 针对目标公司补专题。

## 每日复习模板

### 上午

- 复习 3 个高频知识点。
- 每个知识点写一段自己的回答。

### 下午

- 做 1 个 Demo 或源码实验。
- 做 2-3 道算法题。

### 晚上

- 复盘项目经历。
- 模拟回答 5 个练习题。
- 记录不会的问题。

## 每周产出

- 一份知识点总结。
- 一个小 Demo。
- 一次项目表达录音或文字稿。
- 一份错题清单。
- 一次模拟演练。

## 回答原则

1. 先回答结论，不绕。
2. 再补充原因和原理。
3. 结合项目场景。
4. 主动说边界和缺点。
5. 不会的问题可以说思路，不要硬编。

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

- 熟悉 iOS 开发。
- 熟悉 Swift。
- 熟悉网络请求。

建议写：

- 使用 Swift 和 UIKit / SwiftUI 独立开发过完整业务模块。
- 设计过基于 `URLSession` 的网络层，支持鉴权、错误处理、重试和取消。
- 使用 MVVM 拆分页面状态和业务逻辑，并为 ViewModel 编写单元测试。
- 使用 Instruments 分析并优化列表滚动卡顿和内存增长问题。

### 项目描述模板

```text
项目名称：
项目背景：
技术栈：
负责模块：
核心难点：
解决方案：
量化结果：
复盘改进：
```

### 项目亮点示例

- 将首页首屏耗时从 X 秒降低到 Y 秒。
- 将图片列表滑动 FPS 从 X 提升到 Y。
- 将某模块从 MVC 重构为 MVVM，单元测试覆盖核心状态转换。
- 设计统一网络层，减少重复请求代码。
- 通过缓存策略减少重复接口请求。
- 通过模块化降低业务耦合。

## 高频知识点清单

### 必背但不能只背

- ARC
- 循环引用
- weak 原理
- Block
- Runtime 消息发送
- Category
- KVO
- RunLoop
- GCD
- TableView 复用
- Auto Layout
- 响应链
- App 启动流程
- 启动优化
- 卡顿优化
- 图片缓存
- 网络层设计
- MVVM
- 模块化

### 容易加分

- Swift Copy-on-Write
- Protocol Dispatch
- Swift Concurrency：`Task`、`actor`、`MainActor`、`Sendable`
- dyld
- Mach-O
- Link Map
- Swift ABI
- Instruments 实战经验
- CI/CD
- 测试策略
- 线上问题复盘

## 模拟题库

### Swift

- Swift 的 Optional 是如何表达空值的？
- Swift 中 `mutating` 的作用是什么？
- Swift 的协议可以作为类型使用吗？
- 泛型和协议有什么区别？
- Swift 的闭包捕获列表怎么写？
- `@escaping` 是什么？
- `@autoclosure` 是什么？

### UIKit

- ViewController 生命周期完整说一下。
- TableView 如何避免复用错乱？
- Auto Layout 约束冲突怎么排查？
- 如何实现一个自定义转场？
- 如何处理键盘遮挡输入框？

### Runtime

- Runtime 主要能做什么？
- 消息转发流程是什么？
- Category 方法冲突时谁生效？
- KVO 为什么会生成子类？
- Method Swizzling 应该注意什么？

### 并发

- GCD 队列有哪些？
- `sync` 和 `async` 的区别是什么？
- 如何避免线程安全问题？
- 锁有哪些类型？
- Swift Concurrency 如何处理取消？

### 性能

- 启动优化怎么做？
- 卡顿怎么监控？
- OOM 怎么排查？
- 如何优化大图加载？
- 如何减少包体积？

### 架构

- 你项目里为什么用 MVVM？
- ViewModel 如何与 View 通信？
- 如何做依赖注入？
- 如何设计可测试代码？
- 模块化后资源和路由怎么处理？

## 最终验收标准

准备完成时，你应该能够：

- 讲清 50 个以上 iOS 高频题。
- 手写 10 个以上关键 Demo。
- 准备 3 个以上项目深挖案例。
- 准备 2 个性能优化案例。
- 准备 1 个线上 Bug 定位案例。
- 准备 1 个架构或模块化案例。
- 每个简历项目都能讲 10 分钟。
- 遇到不会的问题能给出合理分析路径。

## 最推荐的准备方式

1. 用一个真实项目串起知识点。
2. 每个八股题都写 Demo 验证。
3. 每天录音模拟回答。
4. 每周做一次完整模拟演练。
5. 把不会的问题整理成错题本。
6. 用“项目场景 + 原理 + 取舍”回答高级问题。
