# iOS 面试向学习路线（`ios.job.cursor.md`）

> 与 `ios.learning.cursor.md` **互补**：那条偏「体系与深度」，本条偏 **面试官常问什么、你要能讲什么、写什么 demo 能撑住简历**。
>
> **默认假设**：Swift 为主；公司若偏 ObjC/UIKit 老栈，把下表「UIKit / Runtime」权重上调即可。

---

## 1. 面试在考什么（四块记分板）

| 板块 | 典型形式 | 你要准备到什么程度 |
|------|-----------|---------------------|
| **语言与基础** | 口述 + 白板小代码 | Swift 选型、内存、可选、泛型、`async` 能理解陷阱 |
| **UI 与交互** | 场景题 + 口述生命周期 | UITableView 差异重载、SwiftUI state、布局约束思路 |
| **工程与架构** | 系统设计小问 + 简历深挖 | MVC/MVP/MVVM、模块边界、怎么做可测 |
| **系统与调试** | 现场追问 + Crash 归因 | RunLoop、常驻线程、推送、签名、Instruments、dSYM |

**策略**：每一块至少准备 **「1 分钟定义 + 30 秒例子 + 1 个踩坑」**，比背八股长段文字更吃香。

---

## 2. 路线总览（按面试 ROI 排序）

**建议顺序**（可按岗调整）：**Swift / 内存与并发 → UIKit **或** SwiftUI（看 JD）→ 网络与持久化 → 架构与模块化 → ObjC Runtime（可选加分）→ 启动与卡顿（进阶加分）**。

| 优先级 | 主题 | 面试关联 |
|--------|------|-----------|
| P0 | Swift 语义、ARC、逃逸闭包、`Sendable`、`actor`/`MainActor` | 必考 |
| P0 | GCD、`Operation`（概念）、debounce/throttle（口述） | 必考 |
| P0 | `UITableView`/`UICollectionView`复用、`UIView`/Auto Layout、`UIViewController`生命周期 | UIKit 岗 |
| P0 | `URLSession`、`Codable`、HTTPS 基本概念 | 业务岗 |
| P1 | SwiftUI：`Observable`/`@State`、`Task`、`navigation` | 新公司/混合型 |
| P1 | MVC vs MVVM、Coordinator/Router、「谁依赖谁」 | 架构深挖 |
| P1 | Keychain、`UserDefaults` 边界、`FileManager` | 安全意识 |
| P2 | Push / APNs 流程、`UNUserNotificationCenter` | 做过的项目 |
| P2 | Objective-C：`objc_msgSend`、`weak`/`strong`、Block、`_cmd`/`super` | 老项目/大厂 |
| P2 | 启动链路、卡顿（主线程、`Layout`/`Display`/`Commit`）、Time Profiler | 性能向 |
| P3 | SwiftData/Core Data、e Tag 缓存语义、离线一致 | 中台 / 重度数据 |
| P3 | Mach-O、`dyld`、符号表 | 少数人问，说了很加分 |

**与系统学习对齐**：深度专题仍按 **`ios.learning.cursor.md`** 阶段走；本条只规定 **先看哪几块更容易过简历关与一面**。

---

## 3. 分模块：面试题纲（自检用）

自检方式：对每个 **粗体短语** 自问「能否口述 1～2 分钟 + 画图或写伪代码？」。

### 3.1 Swift

- **`struct` / `class`**：引用语义、线程安全不负责、Mutating、`copy`/`COW`
- **`enum` / 关联值**：状态机、`switch`穷尽
- **可选**：`guard let` vs `if let` vs `Optional.map`
- **`Protocol`**：有关联类型时用 `some`/`any`，泛型约束
- **错误**：`throws`、`Result` vs `async throws`
- **`async/await`**：`Task`、`Task.detached`、`Task.cancel`、取消传播
- **`Sendable` / `@MainActor`**：为什么 UI 在主线程、`nonisolated` 谨慎点

### 3.2 内存与引用

- **ARC**：计数规则、闭环为什么需要 `weak`/`unowned`（口述闭包、`delegate`）
- **`unowned` 何时剧毒**：对象可能先释放时禁用
- **Instruments**：Leaks、Allocations 各解决什么问题（各一句）

### 3.3 并发（几乎必有一题）

- **串行队列 vs 并发队列**；`_barrier_` **思想**（同队列读写锁）
- **死锁**：例子（主队列 `sync` 自己）
- **OperationQueue** vs GCD：**依赖/cancel/maxConcurrent**（概念）
- **与 Swift Concurrency**：`actor` vs 队列；数据竞争如何避免

### 3.4 UIKit（老栈与高概率）

- **生命周期**：`loadView`/`viewDidLoad`/`appear`/`layoutSubviews`/何时算 frame
- **Auto Layout**：内在内容大小、`priority`、ambiguous layout 怎么排查
- **Table/Collection**：`dequeue`、`prepareForReuse`、estimated height、`Diffable`（若用过）
- **触摸/响应链**：简单说「从上到下找，再上船」可选

### 3.5 SwiftUI（新栈与高概率）

- **状态**：谁拥有状态、为什么不能乱 `@ObservedObject` 传错 owner
- **性能**：identity、`equatable`、`@ViewBuilder` 成本直觉
- **与 UIKit 互嵌**：`UIHostingController`、什么时候该逃回 UIKit

### 3.6 网络与数据

- **GET/POST**，幂等（一句）
- **鉴权**：Token 放哪儿、过期刷新策略（口述）
- **Codable**：`CodingKeys`、蛇形字段、容错解码策略
- **缓存**：memory/disk、`ETag`、`If-Modified-Since`（概念）

### 3.7 架构与工程

- **MVC**：Massive VC 怎么走数据与导航
- **MVVM**：ViewModel 的职责边界，什么不要放进 VM
- **依赖注入**：构造注入 vs 全局单例的痛
- **测试**：如何把网络层剥出来测「纯逻辑」

### 3.8 系统与投递

- **App 生命周期** + **scene**（若问到多窗口）
- **Push**：开发者证书、p8、`_device token_` → 服务器的路径
- **后台**：能做的几类 UIBackgroundMode（知道名字即可）、别夸大
- **沙盒**：能读写什么、为什么这么设计

### 3.9 Objective-C / Runtime（加分）

- **`objc_msgSend` 大意**、动态派发 vs Swift 静态优化
- **Category**：能加啥、不能覆盖原方法（口述风险）
- **Method Swizzle**：少用、次序与二进制注入风险一句带过
- **Block**：栈→堆、`__block`（概念）

### 3.10 性能与调试（中高阶）

- **卡顿**：主线程谁在忙、如何避免在 `scroll` 里解码大图
- **Instruments**：Time Profiler、counters 选一个会操作
- **崩溃**：`**EXC_BAD_ACCESS` vs `fatalError`**，`dSYM` 做什么用

---

## 4. 算法与手写（面试常见附加题）

不要求 ACM，但常被问 **中等及以下**：

- 数组 / 哈希 / 链表：两数之和、环形链表、LRU（你学过正好）
- 字符串：括号匹配、无前缀映射（Trie）偶尔
- 树：二叉树遍历、二叉搜索树验证
- **iOS 场景**：图片缓存（LRU + 线程）、节流防抖、递归转迭代

建议：**Easy 稳住 + Medium 能讲清思路**，每题复盘「时间/空间、边界、能否 O(1) 额外空间」。

---

## 5. 简历与STAR（和业务题一体准备）

对每个项目准备：

1. **一句话业务** + **你在其中的决策**（不是只列模块名）。
2. **难点**：具体到「卡顿/崩溃/一致/兼容性」选一，用 **STAR**。
3. **数据**：延时从多少到多少、崩溃率、`DAU/`可选，没有则说「如何把不可复现场变成可观测」。
4. **技术名词**：JD 上出现的前三个，在简历故事里各出现一次自然叙述。

---

## 6. 时间盒（任选一种执行）

### 速成 4 周（已有 iOS 开发经验）

| 周次 | 重点 |
|------|------|
| 1 | Swift 内存 + 并发 + 刷题 10～15 题（哈希/链表/二分） |
| 2 | UIKit **或** SwiftUI 全真模拟：列表+网络+缓存小 demo |
| 3 | MVVM + 网络层抽象 + XCTest 给核心逻辑写一个测 |
| 4 | ObjC/runtime 速通 + Instruments 一页笔记 + mock 系统设计 3 题 |

### 稳扎稳打 10～12 周（转岗或校招）

参照 **`ios.learning.cursor.md`** 阶段 0～6 ，每周抽 **半天** 做本章 **§3** 自检；另每周 **半天** LeetCode 与白板。

---

## 7. 模拟面试清单（自拟）

- [ ] 「从点击 Cell 到 `didSelect`，中间经过什么？」（UIKit）
- [ ] 「`@Published`/`Observable` 改一次，视图更新路径？」（SwiftUI）
- [ ] 「主线程卡住，你如何定位？」
- [ ] 「Token 失效并发请求怎么办？」（拦截器/单次刷新队列）
- [ ] 「如何保证列表滚动不掉帧？」（缓存、异步解码、减负 layout）
- [ ] 「为什么选择 MVVM而不是 Clean？」（说清团队规模与演进成本）

---

## 8. 与深度学习文档的关系

| 文档 | 用途 |
|------|------|
| `ios.learning.cursor.md` | 长期能力、广度与底层底盘 |
| `ios.job.cursor.md` | **排课优先级、话术与自检**，面试前滚动复习 |

可按面试日期设日历提醒：**T-14 过完 P0，T-7 过完 P1 + 简历故事，T-2 只听自己的录音复述**。

---

*Version: interview track; revise per target company JD.*
