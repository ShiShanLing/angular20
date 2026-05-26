# iOS 学习路线图（入门 → 精通，界面 → 底层）

> 面向「时间充足、希望系统铺开」的自学者。进度可按周或按月缩放；每一阶段都配有**检验方式**，避免只看不练。
>
> **环境**：Mac + Xcode（_current stable_）+ 真机可选但建议至少有（推送、相册、传感器、性能更真实）。

---

## 总览（建议顺序）

| 阶段 | 主题 | 你应达到的状态 |
|------|------|----------------|
| 0 | Swift 语言与工具链 | 能独立写可编译 Swift，读懂官方文档句式 |
| 1 | Xcode、Human Interface、上架基础 | 能新建工程、调试、存档、签名概念清晰 |
| 2 | UI：SwiftUI 为主 + UIKit 能读能改 | 能完成多端布局、列表、导航、媒体与权限 |
| 3 | 数据与网络 | REST/JSON、Codable、本地存储、离线策略 |
| 4 | App 结构与质量 | MVC→MVVM、依赖注入、可测设计、 Instruments |
| 5 | 系统能力 | 通知、后台、Widget、Shortcuts、深色模式、a11y |
| 6 | 并发与性能 | GCD、Operation、Swift Concurrency（async/await、actor） |
| 7 | Objective-C / 运行时与桥接 | 能维护混编模块、读懂系统头文件与 objc_msgSend 思路 |
| 8 | 底层与运行机制 | ABI、Mach-O、dyld、内存、越狱无关的「正版链」调试 |
| 9 | 专项（按需加深） | 图形（Metal/Core Animation）、音视频、蓝牙、SwiftData/Core Data |

---

## 阶段 0：Swift 基石（并行于阶段 1）

**目标**：离开「抄教程」而能**自己拆分问题**。

- **语法与控制流**：可选型、`guard`、`if let`、`switch`、枚举与关联值、`struct` vs `class`、协议与扩展。
- **值类型语义**：拷贝、写时拷贝（概念）、`mutating`。
- **错误处理**：`throws`、`try`、`Result`。
- **泛型**：关联类型、`where`、`some`/`any`（存在类型）基础。
- **标准库习惯**：`Collection`、`Optional`、`String`/`Substring`。

**检验**

- [ ] 不写 UI，完成小型 CLI 或小 Playground： LRU 字典缓存、链表、简单表达式解析任选其一。
- [ ] 口述：`struct` 放什么、`class` 放什么；什么情况下必须用 `class`。

**资源方向**：Swift.org 文档「Language Guide」为主线；中英文书籍任选其一做第二遍查漏补缺。

---

## 阶段 1：Xcode 与世界观

**目标**：工具链成为你的「肌肉记忆」。

- **工程结构**：Target、Scheme、Configuration（Debug/Release）、Build Phase、Bridging Header。
- **调试**：断点条件、lldb 常用命令、`po`、`frame`、`bt`。
- **证书与描述文件**：Development / Distribution、Capability、Provisioning Profile（理解「为何要签名」）。
- **Human Interface Guidelines**：触控目标、可读性、导航模式（tab / stack）、深色模式与高对比度简介。

**检验**

- [ ] 从零创建 App，打洞真机调试；改 Bundle ID/Capability 后能解释报错。
- [ ] Archive 出一条可提交 TestFlight 的包（不必真上架）。

---

## 阶段 2：界面层（SwiftUI 为主）

**目标**：90% 新功能用 SwiftUI **独立交付**；遇到老代码能改 UIKit。

- **SwiftUI**：`State` / `Binding` / `Observable` / `@Observable`、`Environment`、导航（`NavigationStack`）、列表与性能（标识 `id`、`EquatableView` 思想）。
- **组合与样式**：模块化 View、preference、layout 优先级调试。
- **UIKit 兜底**：ViewController 生命周期、`UIView`/`Auto Layout`（或 Snap 思路）、`UIHostingController` 嵌入 SwiftUI。
- **资源**：Asset Catalog、`SF Symbols`、`LocalizedStringKey` / `String Catalog`。

**检验**

- [ ] 做 1 个「生产级小样」：多页面、表单校验、异步加载占位与错误页、暗黑模式、a11y（VoiceOver 走一圈）。
- [ ] Instruments **Time Profiler** 找一遍列表滑动热点。

---

## 阶段 3：数据层与网络

**目标**：可维护的数据流，而不是「调通就行」。

- **网络**：`URLSession`、`async/await`、重试/超时策略、分页；HTTPS 与证书钉扎（概念即可，谨慎使用场景）。
- **解析**：`Codable`、`JSONEncoder`/`Decoder`，自定义 `@propertyWrapper`（可选）。
- **本地**：`UserDefaults` 边界、`FileManager`、Keychain（敏感数据）。
- **数据库路径**：SQLite 语义（migration）、或为阶段 9 预埋 **SwiftData/Core Data**。

**检验**

- [ ] 离线优先：演示「无网可读缓存 + 同步冲突策略」的简单方案（文档说明即可）。
- [ ] Mock：可切换 Mock / 真实 API 的 Repository 抽象。

---

## 阶段 4：架构与可测性

**目标**：改需求时不「推倒重来」。

- **模式**：MVVM + Coordinator（或 Router）思路；模块化边界（ SPM 内模块化优先）。
- **依赖方向**：向内稳定接口、向外可替换实现。
- **测试**：`XCTest` 单元测试、依赖注入、fakes；UI 测试选做（维护成本高）。
- **质量**：SwiftLint/SwiftFormat（团队一致即可）、语义化日志。

**检验**

- [ ] 核心业务可单测覆盖率 > 对你认为关键路径的语句覆盖（不要求数字虚荣）。
- [ ] 画一张模块依赖简图（谁允许依赖谁）。

---

## 阶段 5：系统能力（按需扩展）

按需学习，不求一次吃完。

- **通知**：本地 vs 推送、Notification Service Extension。
- **后台**：BGTask、`backgroundURLSession` 概念边界。
- **小组件**：WidgetKit、`Timeline`、`App Groups`。
- **深度链接**：Universal Link / URL Scheme、`onOpenURL`。
- **隐私**：ATT、Privacy Manifest、相册/定位/通讯录权限文案与降级。

**检验**：选 2 项做进阶段 2 的「小样」或通过小型 side project。

---

## 阶段 6：并发与内存

**目标**：少写「莫名闪退」「难复现场」。

- **GCD**：串行队列、_barrier 思想、死锁案例。
- **Swift Concurrency**：`Task`、`MainActor`、`Sendable`、`actor`、结构化并发取消。
- **内存**：ARC、循环引用（`weak`/`unowned`）、Instruments Leaks / Allocations。

**检验**

- [ ] 解释：为什么 UI 必须在主线程更新（规则与例外）。
- [ ] `Sendable` 报错时，你知道三种修复路径（标注、改写、脱离 actor）及各代价。

---

## 阶段 7：Objective-C 与运行时（「精通」分界线之一）

**目标**：读懂苹果历史 API、开源代码、crash 符号化后的栈。

- **语法与内存管理**：MRC 概念（即使你只写 ARC）、`copy`/`strong`、`block` 循环引用。
- **运行时**：`objc_msgSend`、类目（category）、关联对象、`method swizzling`（**谨慎**）。
- **`self`/`super`/消息转发`/ `+initialize`/`+load` 顺序。
- **桥接**：Swift↔︎ ObjC、`@objc`、`dynamic`、混编 pitfalls。

**检验**

- [ ] 读一份 Apple 开源或老项目中的 `.m`，能标出生命周期与阻塞点。
- [ ] Demo：给 ObjC 类写 Swift extension 或反向，并解释生成的头文件链路。

---

## 阶段 8：底层与运行机制（表面之下的「底盘」）

**目标**：回答问题从「我猜」升级到「可查可证」。

- **Mach-O**：segment/section、`__TEXT`/`__DATA`；Framework vs static lib 基本概念。
- **启动**：dyld 共享缓存、`+load`/静态初始化次序（与崩溃关系）。
- **链接与符号**：dSYM、atos、常见「Undefined symbol」原因。
- **ABI / 调用约定**：寄存器传参概念（精读 ARM64 ABI 任选章节）。
- **安全与沙盒**：sandbox、code signing、`entitlements` 与 Capability 对应关系。
- **（扩展）**：XNU/Mach、bootstrap 仅限兴趣阅读，与工作关联度自定。

**检验**

- [ ] `otool`、`nm`、` instruments`（启动模板）任选一条实际跑过一次并写半页笔记。
- [ ] 能口述：从你按 Run 到 `main`/UIKit 层级大致发生了什么。

---

## 阶段 9：专项深度学习（任选 1～2 条做深）

根据职业方向选课，不必全做。

- **图形/UI 性能**：Core Animation、`CALayer`、`drawRect` 成本、`Metal` 入门。
- **媒体**：AVFoundation、照片管线、离线缓存策略。
- **网络进阶**：HTTP/3 QUIC 概念、mTLS、gRPC-Mobile（若公司业务需要）。
- **数据**：SwiftData/Core Data 建模、大批量导入、migration 实战进阶。
- **跨端**：Rust/C++ ↔︎ Swift 通过 SPM / xcframework（若需要）。

---

## 日常节奏建议（时间充足版）

| 作息块 | 内容 |
|--------|------|
| 理论 25% | 文档、WWDC、`objc.io` / 书评 |
| 动手 55% | 小样、改写开源小项目、`git` 有清晰提交 |
| 复盘 15% | 每周一篇短笔记（问题 → 结论 → 链接） |
| 广度 5% | 扫一眼 Xcode Release Notes |

**原则**

1. **每个阶段都要有可运行产物**，避免囤积视频。
2. **先广度再深度**：阶段 8 以前在「会用」阶段多项目练手，再钻 Mach-O/runtime。
3. **与源码对话**：任选 SDWebImage、Alamofire 级别库读一两个模块胜过百集入门课。

---

## 推荐自检清单（「精通」自评，非权威考试）

- [ ] 独立从 0 发布 TestFlight → 上架流程走通过一次。
- [ ] SwiftUI/UIKit 混合界面能维护；性能问题能用 Instruments 举证。
- [ ] 异步与线程问题能稳定复现并修复。
- [ ] ObjC/runtime 段落能读写；混编不怵。
- [ ] Mach-O、dSYM、签名与 Capabilities 能串成一条叙述。
- [ ] 在任一专项（媒体/Metal/数据库/构建）有较同事更深的 20% 知识。

---

## 附：并行资源类型（任选，不绑定具体书名）

- **官方**：Swift.org、Apple Developer Documentation、WWDC Sessions、Sample Code。
- **练习**：Hackintosh 无关的小型算法 + 小而全的 App repo（自定主题）。
- **社区**：Swift Forums、stackoverflow 精读「有引用」的高质量回答。

---

*文件用途：自用学习索引；可随时删改权重与阶段。Version: 初次整理。*
