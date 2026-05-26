# iOS Learning Plan: From Beginner To Deep Mastery

> 目标：系统学习 iOS 开发，从 Swift、UIKit/SwiftUI、工程化、网络与数据，到性能、系统底层、架构、发布与进阶专题。  
> 建议节奏：如果时间充足，可以按 `6-12 个月`推进；每个阶段都要有作品、笔记、源码阅读和复盘。

## 总体路线

1. 入门基础：掌握 Swift、Xcode、iOS App 生命周期和基础 UI。
2. 应用开发：能独立开发完整 App，包括网络、存储、列表、导航、权限、调试。
3. 工程能力：掌握架构、模块化、依赖管理、测试、CI/CD、发布流程。
4. 进阶能力：深入性能优化、并发、动画、响应链、RunLoop、内存管理。
5. 底层理解：理解 Objective-C Runtime、Swift ABI、Mach-O、dyld、系统启动、消息机制。
6. 专项突破：SwiftUI、Combine、CoreData、AVFoundation、Metal、Widget、Push、In-App Purchase 等。
7. 精通阶段：阅读优秀开源项目，构建复杂项目，形成自己的技术体系。

## 阶段 0：准备工作

### 学习目标

- 熟悉 Apple 开发生态。
- 配置稳定的开发环境。
- 建立长期学习方法。

### 必备工具

- macOS
- Xcode
- iOS Simulator
- Git
- Homebrew
- Swift Package Manager
- CocoaPods 或 Tuist/XcodeGen，可后续再学
- Instruments
- Charles / Proxyman
- Postman / Bruno

### 应做事项

- 注册 Apple Developer 账号，先免费账号即可。
- 熟悉 Xcode：项目结构、Scheme、Target、Build Settings、Debug Area、Simulator。
- 学会使用 Apple 官方文档。
- 建立笔记目录：
  - Swift 语言
  - UIKit
  - SwiftUI
  - 网络
  - 存储
  - 架构
  - 性能
  - 底层
  - 项目复盘

## 阶段 1：Swift 语言基础

### 学习目标

- 能熟练阅读和编写 Swift。
- 理解 Swift 的类型系统、值类型、引用类型、协议和泛型。

### 核心知识

- 常量与变量：`let`、`var`
- 基础类型：`Int`、`Double`、`Bool`、`String`
- 集合：`Array`、`Dictionary`、`Set`
- 控制流：`if`、`switch`、`for`、`while`
- 函数、闭包、逃逸闭包
- Optional：`?`、`!`、`guard let`、`if let`
- Struct、Class、Enum
- 值类型和引用类型
- 属性、方法、初始化器
- 协议、扩展、泛型
- 错误处理：`throw`、`try`、`Result`
- 访问控制：`private`、`fileprivate`、`internal`、`public`、`open`
- Swift 并发基础：`async/await`、`Task`、`MainActor`

### 实战任务

- 写一个命令行 Todo 程序。
- 写一个 JSON 解析小工具。
- 实现一个简单的网络请求封装。
- 手写常用数据结构：栈、队列、链表、二叉树。

### 检查标准

- 能解释 Optional 的意义。
- 能解释 Struct 和 Class 的区别。
- 能写出泛型函数和协议扩展。
- 能用 `async/await` 完成异步请求。

## 阶段 2：iOS 基础与 UIKit

### 学习目标

- 能用 UIKit 做出常见 App 页面。
- 理解 App 生命周期、ViewController 生命周期和事件响应。

### 核心知识

- iOS App 启动流程基础
- `UIApplication`
- `AppDelegate`
- `SceneDelegate`
- `UIViewController` 生命周期
- `UIView` 基础
- Auto Layout
- Safe Area
- Storyboard 与纯代码 UI
- `UILabel`、`UIButton`、`UIImageView`
- `UITextField`、`UITextView`
- `UIScrollView`
- `UITableView`
- `UICollectionView`
- Navigation Controller
- Tab Bar Controller
- Modal Presentation
- Gesture Recognizer
- NotificationCenter
- Delegate 模式
- Target-Action 模式

### 实战任务

- 做一个计算器 App。
- 做一个 Todo List App。
- 做一个新闻列表 App：列表、详情、分页、下拉刷新。
- 做一个图片浏览 App：网格、预览、缩放、保存。

### 检查标准

- 能不用 Storyboard 搭建完整页面。
- 能解释 ViewController 生命周期每个方法的时机。
- 能熟练处理列表复用、点击、刷新和分页。
- 能排查常见 Auto Layout 冲突。

## 阶段 3：SwiftUI

### 学习目标

- 掌握声明式 UI 思维。
- 能用 SwiftUI 独立构建中小型应用。

### 核心知识

- `View`
- `Text`、`Image`、`Button`
- `VStack`、`HStack`、`ZStack`
- `List`、`ScrollView`、`LazyVGrid`
- `NavigationStack`
- `sheet`、`alert`、`confirmationDialog`
- `@State`
- `@Binding`
- `@ObservedObject`
- `@StateObject`
- `@EnvironmentObject`
- `@Environment`
- `Observable`
- SwiftUI 生命周期
- 动画与过渡
- 自定义 ViewModifier
- UIKit 与 SwiftUI 混编

### 实战任务

- 用 SwiftUI 重写 Todo App。
- 做一个记账 App。
- 做一个天气 App。
- 做一个 Markdown 笔记 App。

### 检查标准

- 能解释 SwiftUI 数据流。
- 能处理列表、导航、弹窗、表单。
- 能把 UIKit 控件封装进 SwiftUI。
- 能判断什么时候用 SwiftUI，什么时候用 UIKit。

## 阶段 4：网络、数据与本地存储

### 学习目标

- 掌握真实业务 App 的数据流。
- 能处理 API 请求、缓存、持久化和离线场景。

### 核心知识

- `URLSession`
- REST API
- JSON 编解码：`Codable`
- 请求取消、重试、超时
- 文件上传与下载
- Cookie、Token、鉴权
- Keychain
- UserDefaults
- FileManager
- SQLite
- Core Data
- SwiftData
- 本地缓存策略
- 图片缓存
- 数据迁移

### 实战任务

- 封装一个网络层。
- 做一个 GitHub Client：搜索仓库、用户页、收藏。
- 做一个离线可用的笔记 App。
- 实现登录、Token 刷新、退出登录。

### 检查标准

- 能设计清晰的 API Client。
- 能解释 `Codable` 的高级用法。
- 能处理登录态和敏感信息存储。
- 能做基础数据迁移。

## 阶段 5：并发与异步编程

### 学习目标

- 掌握 iOS 中的异步模型。
- 能写出稳定、可取消、线程安全的异步代码。

### 核心知识

- GCD
- OperationQueue
- RunLoop 基础
- Timer
- Swift Concurrency
- `async/await`
- `Task`
- `TaskGroup`
- `actor`
- `MainActor`
- 任务取消
- 优先级
- 线程安全
- Combine 基础

### 实战任务

- 实现图片并发下载器。
- 实现带取消能力的搜索页。
- 实现一个异步任务队列。
- 用 Combine 或 async sequence 处理搜索输入防抖。

### 检查标准

- 能解释主线程为什么不能被阻塞。
- 能判断代码在哪个线程执行。
- 能写出可取消的异步请求。
- 能解释 actor 解决了什么问题。

## 阶段 6：架构与工程化

### 学习目标

- 从“能写页面”升级到“能维护大型项目”。
- 建立可测试、可扩展、可协作的工程思维。

### 核心知识

- MVC
- MVVM
- MVP
- VIPER
- Coordinator
- Clean Architecture
- The Composable Architecture 思想
- 依赖注入
- 模块化
- 组件化
- Swift Package Manager
- CocoaPods
- Carthage 了解即可
- Tuist / XcodeGen
- 多 Target
- 多环境配置：Dev、Staging、Production
- Feature Flag
- 日志系统
- 错误上报
- 崩溃收集
- 单元测试
- UI 测试
- Snapshot Testing
- CI/CD

### 实战任务

- 把已有 Todo App 改造成 MVVM。
- 做一个模块化 Demo：登录模块、首页模块、个人中心模块。
- 为网络层和 ViewModel 写单元测试。
- 配置 GitHub Actions 或其他 CI 跑测试。

### 检查标准

- 能解释不同架构的优缺点。
- 能让业务逻辑脱离 UI 测试。
- 能拆分模块并控制依赖方向。
- 能设计环境配置和发布流程。

## 阶段 7：调试、测试与质量保障

### 学习目标

- 熟练定位问题。
- 让 App 更稳定、更可观测。

### 核心知识

- Xcode Debugger
- Breakpoint
- Symbolic Breakpoint
- LLDB
- View Debugger
- Memory Graph
- Instruments
- XCTest
- XCUITest
- Mock、Stub、Fake
- Snapshot Testing
- Crash Log 符号化
- 日志分级
- 性能指标监控

### 实战任务

- 定位一个循环引用问题。
- 定位一个主线程卡顿问题。
- 写 20 个单元测试。
- 写 5 个 UI 自动化测试。
- 分析一次 Crash Log。

### 检查标准

- 能用 LLDB 查看变量、调用表达式、修改运行时状态。
- 能用 Instruments 分析内存和耗时。
- 能设计可测试代码。
- 能读懂崩溃堆栈。

## 阶段 8：性能优化

### 学习目标

- 掌握 iOS 性能问题的分析方法。
- 能优化启动、列表、内存、包体和耗电。

### 核心知识

- 启动优化
- 主线程卡顿
- FPS
- 列表滚动优化
- 图片解码与缓存
- 内存峰值
- 循环引用
- ARC
- Autorelease Pool
- App 包体积优化
- I/O 优化
- 网络优化
- 电量优化
- Instruments：
  - Time Profiler
  - Allocations
  - Leaks
  - Energy Log
  - Network
  - Core Animation

### 实战任务

- 优化一个图片列表页面。
- 给 App 做启动耗时分析。
- 排查并修复内存泄漏。
- 减少一次 App 包体积。

### 检查标准

- 能量化优化前后的差异。
- 能解释卡顿产生的常见原因。
- 能识别循环引用。
- 能用 Instruments 给出证据。

## 阶段 9：iOS 系统底层

### 学习目标

- 从“会用 API”深入到“理解系统怎么运行”。
- 建立对 Runtime、内存、线程、二进制、启动链路的理解。

### 核心知识

- Objective-C Runtime
- 消息发送：`objc_msgSend`
- Method Swizzling
- KVO 原理
- KVC 原理
- Category 原理
- Associated Object
- ISA 指针
- Class、Meta Class
- ARC 原理
- Block 原理
- RunLoop
- GCD 底层概念
- Mach-O 文件结构
- dyld 加载流程
- App 启动流程
- 静态库与动态库
- Framework
- Symbol
- Link Map
- Swift ABI
- Swift Runtime
- 内存布局：
  - 栈
  - 堆
  - 全局区
  - 常量区
  - 代码区

### 实战任务

- 写 Runtime Demo：动态添加方法、交换方法、读取属性列表。
- 写 KVO 原理模拟 Demo。
- 分析一个 Mach-O 文件。
- 查看 App 的启动耗时和 dyld 统计。
- 分析 Swift Struct、Class、Closure 的内存表现。

### 检查标准

- 能解释 Objective-C 方法调用流程。
- 能解释 KVO 为什么依赖 Runtime。
- 能解释 RunLoop 和 Timer 的关系。
- 能解释 App 从点击图标到首屏展示的大致过程。

## 阶段 10：系统能力专题

### 学习目标

- 掌握常见 iOS 系统框架。
- 具备开发复杂 App 功能的能力。

### 专题清单

- 推送通知：APNs、UNUserNotificationCenter
- 后台任务：Background Tasks
- 定位：CoreLocation
- 地图：MapKit
- 相机与相册：AVFoundation、Photos
- 音视频播放：AVPlayer
- 音频处理：AVAudioEngine
- 蓝牙：CoreBluetooth
- 传感器：CoreMotion
- Widget
- Live Activities
- App Intents
- Siri Shortcuts
- Share Extension
- Keyboard Extension
- Safari Extension
- In-App Purchase
- StoreKit
- Sign in with Apple
- CloudKit
- HealthKit
- HomeKit
- Core ML
- Vision
- Metal

### 实战任务

- 做一个带推送的提醒 App。
- 做一个扫码 App。
- 做一个本地音乐播放器。
- 做一个 Widget。
- 做一个带内购的会员 Demo。
- 做一个 Core ML 图片识别 Demo。

### 检查标准

- 能独立查官方文档接入系统能力。
- 能处理权限申请、拒绝、降级逻辑。
- 能理解系统限制和审核要求。

## 阶段 11：安全、隐私与合规

### 学习目标

- 写出更安全、更符合 App Store 要求的应用。

### 核心知识

- Keychain
- ATS
- HTTPS
- 证书校验
- Jailbreak 检测了解即可
- 数据加密
- 本地敏感数据保护
- 隐私权限说明
- App Tracking Transparency
- Privacy Manifest
- App Store Review Guidelines
- 崩溃日志与用户隐私

### 实战任务

- 给登录态接入 Keychain。
- 对本地文件做加密存储。
- 整理 App 权限说明文案。
- 阅读一次 App Store 审核被拒案例。

### 检查标准

- 能说明哪些数据不能存在 UserDefaults。
- 能解释 HTTPS 仍然可能有哪些风险。
- 能根据权限设计用户友好的授权流程。

## 阶段 12：发布、运营与真实项目经验

### 学习目标

- 完成从开发到上架的闭环。

### 核心知识

- Bundle Identifier
- Provisioning Profile
- Certificate
- App ID
- TestFlight
- App Store Connect
- App Review
- 版本号和构建号
- 灰度发布
- 崩溃监控
- Analytics
- A/B Testing
- 远程配置
- 用户反馈

### 实战任务

- 发布一个 TestFlight 版本。
- 准备 App Store 截图、描述、隐私政策。
- 接入崩溃监控。
- 做一次线上问题复盘。

### 检查标准

- 能独立打包和上传。
- 能处理证书和 Profile 问题。
- 能解释上架审核的基本规则。

## 阶段 13：大型项目与源码阅读

### 学习目标

- 学会从优秀项目中吸收工程经验。
- 建立复杂项目设计能力。

### 推荐阅读方向

- Alamofire：网络层设计
- Kingfisher / SDWebImage：图片缓存
- SnapKit：DSL 与 Auto Layout
- RxSwift / CombineExt：响应式思想
- Texture：异步 UI 思想
- Swift Collections：数据结构
- TCA：状态管理和架构

### 阅读方法

1. 先跑起来。
2. 看 README 和示例。
3. 画模块关系图。
4. 找核心入口。
5. 跟一条完整调用链。
6. 写源码阅读笔记。
7. 模仿实现一个极简版本。

### 实战任务

- 仿写一个简化版图片缓存库。
- 仿写一个简化版网络请求库。
- 仿写一个简化版状态管理框架。

### 检查标准

- 能说清一个开源库解决了什么问题。
- 能画出核心模块关系。
- 能提炼出可迁移到业务项目的设计经验。

## 阶段 14：作品集路线

### 项目 1：Todo App

- Swift
- UIKit
- 本地存储
- MVVM
- 单元测试

### 项目 2：新闻 / GitHub Client

- 网络请求
- 分页
- 图片缓存
- 搜索
- 登录态
- 错误处理

### 项目 3：记账 App

- SwiftUI
- 图表
- SwiftData 或 Core Data
- iCloud 同步可选
- Widget 可选

### 项目 4：聊天 App

- WebSocket
- 本地消息缓存
- 图片上传
- 推送
- 消息状态

### 项目 5：音视频 App

- AVPlayer
- 播放列表
- 后台播放
- 缓存
- 音频会话

### 项目 6：综合 App

- 模块化
- 多环境
- CI/CD
- 测试
- 性能监控
- TestFlight 发布

## 推荐学习顺序

### 第 1 个月

- Swift 基础
- Xcode
- UIKit 基础
- Todo App

### 第 2 个月

- Auto Layout
- TableView / CollectionView
- 网络请求
- JSON
- 新闻 App

### 第 3 个月

- 本地存储
- 登录态
- MVVM
- 单元测试
- GitHub Client

### 第 4 个月

- SwiftUI
- Swift Concurrency
- Combine 基础
- 记账 App

### 第 5 个月

- 架构
- 模块化
- CI/CD
- 工程配置
- 重构已有项目

### 第 6 个月

- Instruments
- 性能优化
- 内存管理
- Crash 分析
- TestFlight 发布

### 第 7-9 个月

- Runtime
- RunLoop
- Mach-O
- dyld
- Swift Runtime
- 底层 Demo

### 第 10-12 个月

- 系统框架专题
- 大型项目
- 源码阅读
- 上架完整 App
- 总结个人技术体系

## 每周学习模板

### 周一到周三

- 学习新知识。
- 看官方文档。
- 写最小 Demo。

### 周四到周五

- 把知识用到项目里。
- 处理边界情况。
- 写测试。

### 周六

- 阅读源码或技术文章。
- 用 Instruments / Debugger 分析项目。

### 周日

- 写复盘：
  - 本周学了什么
  - 哪些概念还模糊
  - 做出了什么功能
  - 下周要解决什么问题

## 每个知识点的学习闭环

1. 知道它解决什么问题。
2. 能写一个最小 Demo。
3. 能用在真实项目里。
4. 能说出常见坑。
5. 能调试它。
6. 能解释一点底层原理。
7. 能总结成自己的笔记。

## 面试与表达能力

### 基础高频

- Swift Optional 原理和使用场景
- Struct 和 Class 区别
- ARC 和循环引用
- Delegate、Notification、KVO 区别
- ViewController 生命周期
- TableView 复用机制
- Auto Layout 原理
- RunLoop 和 Timer
- GCD 和 OperationQueue
- async/await

### 进阶高频

- Runtime 消息发送
- KVO 实现原理
- Category 加载过程
- Block 内存管理
- App 启动优化
- 卡顿监控
- Mach-O 和 dyld
- Swift 协议和泛型
- Swift ABI
- 组件化和模块化

### 表达训练

- 每学完一个主题，用 3 分钟讲清楚。
- 每做完一个项目，写一份项目复盘。
- 每解决一个 Bug，记录现象、原因、定位过程和修复方式。

## 推荐资料

### 官方资料

- Apple Developer Documentation
- The Swift Programming Language
- Swift Evolution
- WWDC Videos
- Human Interface Guidelines

### 书籍方向

- Swift 语言类书籍
- iOS 编程基础类书籍
- Objective-C Runtime 相关资料
- 操作系统基础
- 计算机网络
- 数据结构与算法
- 编译原理入门

### 必补计算机基础

- 数据结构
- 算法复杂度
- 操作系统线程与进程
- 内存管理
- 网络 HTTP / TCP / TLS
- 数据库基础
- 设计模式

## 长期能力地图

### 初级 iOS 开发者

- 能完成页面和基础业务。
- 会使用常见系统控件。
- 能请求接口和展示数据。
- 能修简单 Bug。

### 中级 iOS 开发者

- 能独立负责完整模块。
- 能设计网络层、缓存层和业务架构。
- 能写测试。
- 能分析常见性能和崩溃问题。

### 高级 iOS 开发者

- 能负责大型 App 架构。
- 能做工程化和模块化。
- 能解决复杂性能问题。
- 能理解关键底层机制。
- 能带人、评审代码、制定规范。

### 专家级 iOS 开发者

- 对系统机制有深入理解。
- 能设计稳定的基础设施。
- 能做跨团队技术决策。
- 能从源码、汇编、二进制层面定位疑难问题。
- 能把业务、体验、工程效率和长期维护统一起来。

## 最终毕业项目

做一个完整可发布 App，要求：

- UIKit 或 SwiftUI 至少一种主技术栈熟练。
- 有真实网络请求。
- 有本地缓存。
- 有登录或用户系统。
- 有错误处理。
- 有测试。
- 有性能分析记录。
- 有模块化设计。
- 有 README。
- 有 TestFlight 或 App Store 发布记录。
- 有完整项目复盘文档。

## 学习原则

- 不只看教程，要写项目。
- 不只会调用 API，要理解为什么这样设计。
- 不只追新框架，要掌握稳定基础。
- 不只修 Bug，要记录定位路径。
- 不只做 Demo，要做能长期维护的工程。
- 每个月至少完成一个可运行作品。
- 每个季度做一次体系化复盘。

