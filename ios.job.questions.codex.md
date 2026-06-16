# iOS 面试题库

> 来源：`ios.job.questions.codex.json`
> 题目数量：152 题
>
# 需要背的单词 some,none,guard,Comparable,existential,Codable,Present,Signature,unrecognized,Associated,Extension,Swizzling,descriptor,prepare,reuse,Gesture,Recognizer,keychain,Operation,Concurrency,isolation

## 目录

- [Swift 基础（15）](#topic-1)
- [Swift 基础 / 值类型与引用类型（1）](#topic-2)
- [Objective-C / Runtime（13）](#topic-3)
- [UIKit / App 生命周期（4）](#topic-4)
- [UIKit / 布局（1）](#topic-5)
- [UIKit / 列表（2）](#topic-6)
- [UIKit / 性能（1）](#topic-7)
- [UIKit / 渲染（2）](#topic-8)
- [UIKit / 事件响应（3）](#topic-9)
- [网络 / 安全（3）](#topic-10)
- [网络 / TCP（1）](#topic-11)
- [网络 / HTTP（1）](#topic-12)
- [网络 / 鉴权（2）](#topic-13)
- [网络 / URLSession（1）](#topic-14)
- [网络 / 架构（1）](#topic-15)
- [网络 / 缓存（1）](#topic-16)
- [数据存储（1）](#topic-17)
- [数据存储 / 安全（1）](#topic-18)
- [数据存储 / Core Data（1）](#topic-19)
- [数据存储 / 迁移（1）](#topic-20)
- [并发 / 线程（2）](#topic-21)
- [并发 / GCD（6）](#topic-22)
- [并发 / OperationQueue（2）](#topic-23)
- [并发 / RunLoop（4）](#topic-24)
- [Swift Concurrency（11）](#topic-25)
- [内存管理（8）](#topic-26)
- [内存管理 / 调试（1）](#topic-27)
- [架构 / MVC（1）](#topic-28)
- [架构 / MVVM（2）](#topic-29)
- [架构 / Coordinator（1）](#topic-30)
- [架构 / 依赖注入（1）](#topic-31)
- [架构 / 可测试性（1）](#topic-32)
- [架构 / 模块化（3）](#topic-33)
- [工程化 / 配置（1）](#topic-34)
- [工程化 / CI/CD（1）](#topic-35)
- [工程化 / 测试（1）](#topic-36)
- [性能 / 启动优化（4）](#topic-37)
- [性能 / 卡顿优化（1）](#topic-38)
- [性能 / 列表优化（2）](#topic-39)
- [性能 / 图片优化（2）](#topic-40)
- [性能 / 内存优化（2）](#topic-41)
- [性能 / 包体积（1）](#topic-42)
- [性能 / 网络优化（1）](#topic-43)
- [性能 / Instruments（1）](#topic-44)
- [Mach-O / dyld（6）](#topic-45)
- [Mach-O / Runtime 初始化（1）](#topic-46)
- [Mach-O / 包体积（1）](#topic-47)
- [项目表达（1）](#topic-48)
- [项目表达 / 架构（1）](#topic-49)
- [项目表达 / Bug 定位（1）](#topic-50)
- [项目表达 / 性能（1）](#topic-51)
- [项目表达 / 网络层（1）](#topic-52)
- [项目表达 / 缓存（1）](#topic-53)
- [项目表达 / 重构（1）](#topic-54)
- [项目表达 / 技术取舍（1）](#topic-55)
- [项目表达 / 扩展性（1）](#topic-56)
- [算法 / 哈希表（1）](#topic-57)
- [算法 / 链表（2）](#topic-58)
- [算法 / 栈（1）](#topic-59)
- [算法 / 滑动窗口（1）](#topic-60)
- [算法 / 二叉树（2）](#topic-61)
- [算法 / 二分查找（1）](#topic-62)
- [算法 / 排序（1）](#topic-63)
- [算法 / 缓存（1）](#topic-64)
- [工程化 / 线上质量（3）](#topic-65)
- [调试 / Xcode Debugger（2）](#topic-66)
- [调试 / LLDB（1）](#topic-67)
- [性能 / 卡顿与渲染（1）](#topic-68)
- [并发 / Timer（1）](#topic-69)
- [内存 / ARC（1）](#topic-70)

## Swift 基础

<a id="topic-1"></a>

### 1. Swift 中 Optional 的本质是什么？为什么 Swift 要设计 Optional？

- 难度：Easy
- ID：`ios-swift-optional-basics`
- 口述一句话：Optional 是 Swift 用类型系统表达“可能为空”的方式，本质接近 some/none 枚举。

**参考答案：**

Optional 本质是一个枚举，大致可以理解为 some(Wrapped) 或 none。它把“可能没有值”显式写进类型系统，避免 Objective-C 里 nil 随处传递导致的运行时问题。使用时要通过 if let、guard let、??、可选链等方式安全解包。面试要强调：Optional 不是普通值，也不是指针，它是类型层面的空值表达。

---

### 2. `if let` 和 `guard let` 有什么区别？分别适合什么场景？

- 难度：Easy
- ID：`ios-swift-iflet-guardlet`
- 口述一句话：if let 管局部解包，guard let 管前置校验和提前退出。

**参考答案：**

if let 适合在一个局部代码块里使用解包后的值；guard let 适合做前置校验，失败就提前 return/throw/break，成功后解包变量在后续作用域都可用。一般业务代码里，参数校验和失败早返回更推荐 guard let，可以减少嵌套。

---

### 3. Struct 和 Class 有什么区别？为什么 Swift 推荐优先使用值类型？

- 难度：Medium
- ID：`ios-swift-struct-class`
- 口述一句话：Struct 是值语义，Class 是引用语义；优先用 Struct 能减少共享状态，也常能减少堆分配和 ARC 成本。

**参考答案：**

Struct 是值类型，赋值和传参更像复制一份值，修改副本通常不影响原值；Class 是引用类型，多个变量可能指向同一个实例，修改对象状态会互相影响。

Swift 推荐优先使用 Struct，主要是因为值语义更安全、更容易推理，能减少共享可变状态带来的副作用，也更适合并发场景。性能上，Struct 在普通局部变量、临时值这类常见场景下通常在栈上或内联存储，能减少堆分配和 ARC 引用计数开销，所以可能更轻量。

如果需要继承、身份比较、deinit、共享状态，或者需要和 Objective-C 深度交互，再选择 Class。注意不要绝对说 Struct 一定在栈上，实际存储位置由编译器和使用场景决定。

---

### 4. 值类型和引用类型在赋值、传参、内存管理上的差异是什么？

- 难度：Medium
- ID：`ios-swift-value-reference`
- 口述一句话：值类型复制值，引用类型复制引用；值类型更独立，引用类型适合共享对象。

**参考答案：**

值类型赋值和传参时，更像复制一份独立的值，修改副本通常不影响原值；引用类型赋值和传参时，复制的是对象引用，多个变量可能指向同一个对象，修改对象内部状态会互相影响。

内存上可以这样理解：值类型在普通局部变量、临时值这类常见场景下通常在栈上或内联存储；Class 实例通常在堆上，由 ARC 管理生命周期。

但不要绝对说值类型一定在栈上。实际存储位置由编译器和使用场景决定。面试收口可以说：值类型重点是值语义和独立性，引用类型重点是引用语义和共享对象。

---

### 5. 什么是 Copy-on-Write？Swift 的 Array、Dictionary 为什么可以既像值类型又避免频繁拷贝？

- 难度：Hard
- ID：`ios-swift-copy-on-write`
- 口述一句话：COW 是读共享、写时才复制，让值语义和性能兼得。

**参考答案：**

Copy-on-Write 是写时复制。Array、Dictionary、String 表面是值类型，但底层共享存储；只有当某个副本发生修改且存储不唯一时，才真正复制一份。这样既保留值语义，又避免每次赋值都拷贝大块内存。自定义 COW 通常用 isKnownUniquelyReferenced 判断存储是否唯一。

---

### 6. Swift Enum 的关联值和原始值有什么区别？适合用在哪些业务建模场景？

- 难度：Medium
- ID：`ios-swift-enum-associated-values`
- 口述一句话：原始值是固定映射，关联值是 case 携带动态数据。

**参考答案：**

原始值是每个 case 绑定一个固定字面量，比如 Int 或 String；关联值是每次创建 enum case 时携带不同数据。原始值适合状态码、类型映射；关联值适合表达带数据的状态，比如 success(User)、failure(Error)。它能让业务状态建模更完整。

---

### 7. Protocol 和 Class 继承有什么区别？为什么 Swift 强调面向协议编程？

- 难度：Medium
- ID：`ios-swift-protocol-vs-inheritance`
- 口述一句话：继承表达类型层级，协议表达能力边界。

**参考答案：**

继承表达“是什么”，协议表达“能做什么”。Class 继承只能单继承，协议可以多遵循；继承复用实现但耦合更强，协议更适合抽象能力、依赖倒置和测试替换。Swift 面向协议编程的重点是用协议定义边界，用扩展提供默认实现。

---

### 8. Protocol Extension 中的方法什么时候是静态派发，什么时候会动态派发？

- 难度：Hard
- ID：`ios-swift-protocol-extension-dispatch`
- 口述一句话：协议要求的方法，通过协议类型调用通常走动态派发；协议扩展里的非要求方法，更偏静态派发。

**参考答案：**

协议要求的方法，也就是写在 protocol 声明里的 requirement，通过协议类型调用时通常走 witness table 动态派发，所以能调用到具体类型的实现。

如果方法只是写在 protocol extension 里的额外方法，不是 requirement，那么它更偏静态派发，调用哪个实现取决于变量的静态类型，容易调用到扩展默认实现。

面试可以这样收口：协议要求的方法，通过协议类型调用通常走动态派发；协议扩展里的非要求方法，更偏静态派发，容易调用到扩展默认实现。

---

### 9. Swift 泛型解决了什么问题？和协议作为类型使用有什么区别？

- 难度：Medium
- ID：`ios-swift-generics-basics`
- 口述一句话：泛型保留具体类型，协议类型隐藏具体类型。

**参考答案：**

泛型让一套代码适配多种具体类型，同时保留静态类型信息，比如 Array<Element>。协议作为类型更强调运行时抽象和能力约束，可能带来 existential 开销。泛型适合类型在编译期确定、追求类型安全和性能；协议类型适合异构集合和运行时替换。

---

### 10. Swift 闭包捕获变量的规则是什么？捕获值类型和引用类型有什么差异？

- 难度：Medium
- ID：`ios-swift-closure-capture`
- 口述一句话：闭包默认捕获外部变量；引用类型小心 weak self；值类型可用 [x] 固定快照。

**参考答案：**

闭包捕获变量可以先记三点：

1. 闭包默认会捕获它用到的外部变量。
2. 引用类型要小心强引用，常用 [weak self] 打破循环引用。
3. 值类型如果想固定创建闭包那一刻的值，用 [x] 捕获快照。

引用类型通常捕获的是对象引用，所以闭包里使用 self 时，如果 self 又持有这个闭包，就容易形成循环引用。常见解决方式是使用 [weak self]，让闭包不要强持有 self；如果能保证 self 一定比闭包活得久，也可以用 [unowned self]，但 self 已释放后再访问会崩溃。

值类型默认捕获外部变量时，闭包执行时可能看到变量后续的新值；如果写成 [x]，表示在创建闭包那一刻把 x 的值保存一份快照，后面外部变量再修改，也不会影响闭包内部的 x。

---

### 11. `@escaping` 是什么？为什么异步回调通常需要标记为 escaping？

- 难度：Easy
- ID：`ios-swift-escaping-closure`
- 口述一句话：escaping 闭包会逃出函数生命周期，所以异步回调通常需要它。

**参考答案：**

@escaping 表示闭包可能在函数返回后才执行，比如异步网络回调、DispatchQueue.async、保存到属性。非 escaping 闭包默认只在函数调用期间执行完。escaping 闭包需要显式写 self，是为了提醒可能延长对象生命周期并产生循环引用。

---

### 12. `@autoclosure` 是什么？它解决了什么可读性或延迟执行问题？

- 难度：Medium
- ID：`ios-swift-autoclosure`
- 口述一句话：@autoclosure 是把表达式自动包成延迟执行的闭包。

**参考答案：**

@autoclosure 会把一个表达式自动包装成无参闭包，让调用端看起来像传值，内部却可以延迟执行。常见例子是 assert 和 ??。它能提升可读性，但滥用会隐藏执行时机，尤其不要随便用于有副作用的表达式。

---

### 13. Swift 中 `private`、`fileprivate`、`internal`、`public`、`open` 有什么区别？

- 难度：Easy
- ID：`ios-swift-access-control`
- 口述一句话：访问控制从小到大是 private、fileprivate、internal、public、open。

**参考答案：**

private 限当前声明作用域和同文件扩展，fileprivate 限同文件，internal 是模块内默认可见，public 模块外可见但不能被外部继承或重写，open 模块外可见且允许继承和重写。库设计里 public 暴露使用能力，open 暴露扩展能力。

---

### 14. `Codable` 如何处理 JSON 字段名和 Model 属性名不一致？如何处理可选字段？

- 难度：Medium
- ID：`ios-swift-codable-key-mapping`
- 口述一句话：Codable 字段映射靠 CodingKeys，复杂解析自定义 init(from:)。

**参考答案：**

字段名不一致用 CodingKeys 映射。可选字段声明成 Optional，缺失时 decodeIfPresent 返回 nil；必填字段缺失会抛错。复杂转换可以自定义 init(from:) 和 encode(to:)。真实项目还要处理日期格式、嵌套结构和后端类型不稳定。

---

### 15. `Result`、`throws`、Optional 分别适合表达什么类型的失败？

- 难度：Medium
- ID：`ios-swift-result-error-handling`
- 口述一句话：Optional 表达有无，throws 表达流程错误，Result 把成功失败包装成值。

**参考答案：**

Optional 适合只关心有无值、不关心失败原因；throws 适合同步或 async 流程中抛出详细错误；Result 适合把成功或失败作为一个值传递、保存或回调。现代 async API 常用 async throws，回调式 API 常见 Result。

---

## Swift 基础 / 值类型与引用类型

<a id="topic-2"></a>

### 16. Struct 相比 Class 在性能上有什么优势？为什么不能简单说 Struct 一定在栈上？

- 难度：Medium
- ID：`ios-swift-struct-class-performance-stack-heap`
- 口述一句话：Struct 在常见局部场景下通常栈上或内联存储，减少堆分配和 ARC 成本；但不保证一定在栈上，本质区别仍是值语义和引用语义。

**参考答案：**

Struct 的优势不能只理解成“存在栈上所以快”，更准确地说，它是值语义，数据通常更独立，减少共享可变状态，代码更容易推理。性能上，Struct 在普通局部变量、临时值这类常见场景下，通常会直接存储在栈上，或者作为其他对象/容器的一部分内联存储，因此能减少堆分配、指针间接访问和 ARC 引用计数开销，所以在轻量数据模型、临时值、不可变数据传递等场景下可能更快。

Class 是引用类型，实例通常分配在堆上，由 ARC 管理生命周期。变量里保存的是对象引用，多个变量可以指向同一个对象。它适合需要继承、身份标识、共享状态、deinit 或 Objective-C 互操作的场景，但堆分配、引用计数和共享状态会带来额外成本。

但不能绝对说 Struct 一定在栈上。实际放栈还是堆由编译器和使用场景决定，例如 Struct 被 class 持有时会存在堆对象内部；被逃逸闭包捕获、放进某些容器、发生装箱、使用协议 existential 或泛型时，也可能涉及堆存储。面试时更稳的表达是：Struct 在常见局部使用场景下通常在栈上或内联存储，更容易减少堆分配和 ARC 成本；但 Struct 和 Class 的根本区别仍然是值语义和引用语义。

---

## Objective-C / Runtime

<a id="topic-3"></a>

### 17. Objective-C 的消息发送流程是什么？`objc_msgSend` 大致做了什么？

- 难度：Hard
- ID：`ios-objc-msgsend-flow`
- 口述一句话：objc_msgSend 先查缓存，再查类和父类；找不到时可在动态解析、快速转发、完整转发中补救。

**参考答案：**

Objective-C 调方法本质是发消息。objc_msgSend 会根据对象的 isa 找到类，先查方法缓存 cache，缓存没有再查当前类的方法列表，然后沿父类链继续查找。缓存命中是性能关键。

如果一直找不到方法，不会马上崩溃，而是进入消息转发流程，有三次补救机会：第一步是动态方法解析，可以在 +resolveInstanceMethod: 或 +resolveClassMethod: 里动态添加方法；第二步是快速转发，可以在 -forwardingTargetForSelector: 里把消息转给另一个对象；第三步是完整消息转发，通过 -methodSignatureForSelector: 和 -forwardInvocation: 拿到 invocation 后手动处理或转发。

如果这三步都没有处理，最后才会触发 doesNotRecognizeSelector，也就是常见的 unrecognized selector 崩溃。

---

### 18. Class 和 Meta Class 的关系是什么？实例方法和类方法分别存在哪里？

- 难度：Hard
- ID：`ios-objc-class-metaclass`
- 口述一句话：对象找 Class，类对象找 Meta Class；实例方法在类，类方法在元类。

**参考答案：**

实例对象的 isa 指向 Class，Class 保存实例方法、属性和协议等信息；Class 的 isa 指向 Meta Class，Meta Class 保存类方法。Meta Class 最终也有继承链，根元类的 isa 指向自己。实例方法发给对象，类方法本质上发给类对象。

---

### 19. `isa` 指针有什么作用？对象、类、元类之间如何通过 isa 串起来？

- 难度：Hard
- ID：`ios-objc-isa-pointer`
- 口述一句话：isa 是对象进入 Runtime 类型系统和方法查找的入口。

**参考答案：**

isa 用来从对象找到它所属的类，从类找到元类，是 Runtime 查找方法和识别类型的入口。实例对象 isa 指向类，类对象 isa 指向元类，元类继续指向根元类。现代 isa 可能是优化过的 non-pointer isa，里面还编码了引用计数等信息。

---

### 20. Category 能不能添加属性？为什么？Associated Object 是如何补充存储能力的？

- 难度：Medium
- ID：`ios-objc-category-property`
- 口述一句话：Category 能声明属性但不加 ivar，存值靠 Associated Object。

**参考答案：**

Category 可以声明属性，但不会自动生成实例变量。因为类的内存布局在编译期基本确定，Category 在运行期附加方法，不能直接扩展对象存储。要给 Category 属性保存值，通常用 Associated Object，以对象地址和 key 建立关联表。

---

### 21. Category 和 Extension 有什么区别？它们分别在编译期和运行期有什么特点？

- 难度：Medium
- ID：`ios-objc-category-extension`
- 口述一句话：Extension 参与类本体，Category 运行期扩展已有类。

**参考答案：**

Extension 是类扩展，通常写在主实现文件里，编译期参与类定义，可以声明私有属性和方法；Category 是运行期把方法列表附加到已有类上，常用于拆分功能或给系统类加方法。Extension 更像匿名私有接口，Category 更像后期扩展。

---

### 22. KVO 的实现原理是什么？为什么说它依赖 Runtime 动态子类？

- 难度：Hard
- ID：`ios-objc-kvo-principle`
- 口述一句话：KVO 靠 Runtime 动态子类重写 setter；OC 老式 KVO 手动移除，Swift block KVO 用 token 管理。

**参考答案：**

KVO 通过 Runtime 动态创建被观察类的子类，把对象的 isa 指向这个动态子类，并在子类里重写 setter。属性变化时，重写后的 setter 会在修改前后触发 willChange/didChange 通知，所以观察者能收到变化。

OC 老式 KVO 要手动 add/remove，生命周期处理不好容易崩。Swift block KVO 用 NSKeyValueObservation token 管理观察关系，相对安全，但本质仍然是 Runtime KVO。

---

### 23. KVC 的查找顺序是什么？访问不存在的 key 会发生什么？

- 难度：Medium
- ID：`ios-objc-kvc-search-order`
- 口述一句话：KVC 先找访问器，再找 ivar，找不到走 undefinedKey。

**参考答案：**

KVC 取值通常先找 get<Key>、<key>、is<Key>、_<key> 等 getter，再按规则访问 ivar；找不到会调用 valueForUndefinedKey。赋值类似先找 setter，再找 ivar，找不到调用 setValue:forUndefinedKey。它绕过编译期检查，灵活但不够安全。

---

### 24. Method Swizzling 的原理是什么？在业务中使用它有哪些风险？

- 难度：Hard
- ID：`ios-objc-method-swizzling-risk`
- 口述一句话：Swizzling 是换 IMP，强大但全局生效、顺序和冲突风险高。

**参考答案：**

Swizzling 通过 Runtime 交换两个 Method 的 IMP，让原调用走到新实现。风险是影响全局行为、调用顺序不确定、和其他库冲突、递归调用、难调试。使用时应在 +load 或明确初始化中只交换一次，并保留原实现调用路径。

---

### 25. Objective-C Block 有哪些类型？为什么 Block 通常需要 copy？

- 难度：Medium
- ID：`ios-objc-block-types`
- 口述一句话：Block 有全局、栈、堆三类；保存或异步使用时 copy 到堆上更安全。

**参考答案：**

Block 常见有全局 Block、栈 Block、堆 Block。没有捕获外部自动变量的 Block 通常是全局 Block；捕获局部变量的 Block 初始可能在栈上；对栈 Block 执行 copy 后会移动到堆上，变成堆 Block。

保存 Block 或异步执行 Block 时通常需要 copy，因为函数返回后栈空间会失效，copy 到堆上才能保证 Block 之后仍然可用。ARC 下很多场景编译器会自动 copy，但 Block 属性仍推荐声明为 copy，这是 Objective-C 的标准写法。

---

### 26. Objective-C Block 捕获变量、`__block` 和 `__weak` 分别怎么理解？

- 难度：Hard
- ID：`ios-objc-block-capture-rules`
- 口述一句话：Block 捕获外部变量；修改外部局部变量用 __block，避免 self 循环引用用 __weak。

**参考答案：**

Block 会捕获它内部使用到的外部变量。普通局部变量默认不能在 Block 内直接修改，如果要修改这个外部变量，需要用 __block；如果 Block 被 self 持有，同时 Block 内又使用 self，就要用 __weak 弱化 self，避免形成 self 和 Block 的循环引用。

可以这样记：__block 解决“能不能在 Block 内修改外部局部变量”的问题；__weak 解决“Block 会不会强持有 self 导致循环引用”的问题。

---

### 27. Block 属性为什么通常用 copy，而不是 strong？

- 难度：Medium
- ID：`ios-objc-block-property-copy`
- 口述一句话：Block 属性用 copy，是为了把可能在栈上的 Block 复制到堆上，保证保存后还能安全执行。

**参考答案：**

Block 属性推荐用 copy，是因为捕获局部变量的 Block 初始可能在栈上。栈 Block 随着函数返回可能失效，如果要把 Block 保存到属性里，必须 copy 到堆上，才能保证之后调用仍然安全。

ARC 下很多赋值场景编译器会自动帮忙 copy，但属性写 copy 仍然是标准写法，语义更明确：这个对象要保存这个 Block，并保证它能在当前作用域结束后继续使用。

常见写法：

```objc
@property (nonatomic, copy) void (^completion)(void);
```

---

### 28. Objective-C Block 底层结构大概是什么？为什么说 Block 也是对象？

- 难度：Hard
- ID：`ios-objc-block-under-the-hood`
- 口述一句话：Block 底层像对象，里面有 invoke 函数指针、descriptor 和捕获变量；可以理解为代码加上下文。

**参考答案：**

Block 在底层可以理解成一个 Objective-C 对象。它通常包含 isa、flags、invoke 函数指针、descriptor，以及捕获到的变量。

其中 invoke 指向 Block 真正要执行的函数实现，descriptor 保存 Block 大小、copy/dispose 辅助函数等元信息。如果 Block 捕获了变量，这些捕获内容也会作为 Block 结构的一部分保存。

所以 Block 既能像函数一样调用，又能像对象一样 copy、release，并参与 ARC 内存管理。面试不用死背结构体字段，重点记：Block = 代码 + 捕获上下文 + 对象语义。

---

### 29. ARC 是编译期机制还是运行期机制？它和 Runtime 如何配合管理引用计数？

- 难度：Hard
- ID：`ios-objc-arc-compile-runtime`
- 口述一句话：ARC 是编译器插入内存管理调用，Runtime 配合维护引用计数和 weak。

**参考答案：**

ARC 主要是编译器自动插入 retain、release、autorelease 等内存管理调用，但运行时也参与弱引用表、引用计数、autorelease pool 等机制。它不是垃圾回收，释放时机仍由引用计数决定。循环引用 ARC 无法自动解决。

---

## UIKit / App 生命周期

<a id="topic-4"></a>

### 30. App 从点击图标到首屏展示大致经历了哪些阶段？

- 难度：Medium
- ID：`ios-uikit-app-launch-basic`
- 口述一句话：启动链路是 dyld、Runtime、main、Application、Scene、首屏。

**参考答案：**

App 启动大致经历：系统创建进程，dyld 加载可执行文件和动态库，Runtime 初始化类和分类，进入 main，UIApplicationMain 创建应用对象，建立 AppDelegate/SceneDelegate、window、rootViewController，然后加载 view、布局并提交首帧。优化时按 main 前和 main 后拆。

---

### 31. `AppDelegate` 和 `SceneDelegate` 分别负责什么？多 Scene 场景下生命周期有什么变化？

- 难度：Medium
- ID：`ios-uikit-appdelegate-scenedelegate`
- 口述一句话：AppDelegate 管应用级生命周期，SceneDelegate 管窗口场景生命周期。

**参考答案：**

AppDelegate 负责应用级事件，比如启动、推送、后台任务和全局配置；SceneDelegate 负责一个 UI 场景的生命周期，比如创建 window、连接和断开 scene。iOS 13 后一个 App 可以有多个 Scene，所以 UI 生命周期从 AppDelegate 拆到了 SceneDelegate。

---

### 32. ViewController 生命周期方法的调用顺序是什么？每个方法适合做什么？

- 难度：Easy
- ID：`ios-uikit-vc-lifecycle`
- 口述一句话：VC 生命周期按加载、布局、出现、消失来记。

**参考答案：**

常见顺序是 init、loadView、viewDidLoad、viewWillAppear、viewWillLayoutSubviews、viewDidLayoutSubviews、viewDidAppear；离开时 viewWillDisappear、viewDidDisappear。viewDidLoad 适合一次性初始化，viewWillAppear 适合刷新即将展示的数据，布局相关放 layout 回调。

---

### 33. `loadView`、`viewDidLoad`、`viewWillAppear`、`viewDidAppear` 有什么区别？

- 难度：Medium
- ID：`ios-uikit-loadview-viewdidload`
- 口述一句话：loadView 建 view，viewDidLoad 初始化一次，viewWillAppear 每次显示前刷新。

**参考答案：**

loadView 负责创建 self.view，纯代码自定义根 view 时可重写；viewDidLoad 在 view 加载完成后调用一次，适合初始化子视图和绑定；viewWillAppear 每次即将显示都会调用，适合刷新数据或导航栏状态；viewDidAppear 表示已显示，适合开始动画或曝光。

---

## UIKit / 布局

<a id="topic-5"></a>

### 34. Auto Layout 的基本原理是什么？约束冲突通常如何排查？

- 难度：Medium
- ID：`ios-uikit-autolayout-principle`
- 口述一句话：Auto Layout 是约束求解，冲突从日志、优先级、缺失重复约束查。

**参考答案：**

Auto Layout 用一组线性约束描述视图位置和大小，系统通过约束求解得到 frame。排查冲突看控制台日志、约束标识、优先级、缺失或重复约束，以及 translatesAutoresizingMaskIntoConstraints 是否关闭。复杂页面要减少约束数量和频繁更新。

---

## UIKit / 列表

<a id="topic-6"></a>

### 35. TableView Cell 复用机制是什么？如何避免复用导致的数据错乱？

- 难度：Easy
- ID：`ios-uikit-tableview-reuse`
- 口述一句话：Cell 会复用，所以配置要完整，复用前要清理异步和状态。

**参考答案：**

TableView 复用 Cell 是为了避免频繁创建视图。滚出屏幕的 Cell 会进入复用池，新数据出现时取出重新配置。必须在配置方法里覆盖所有 UI 状态，在 prepareForReuse 中重置临时状态、取消图片请求，否则会出现错图、状态残留。

---

### 36. CollectionView 和 TableView 的核心区别是什么？自定义 Layout 适合解决什么问题？

- 难度：Medium
- ID：`ios-uikit-collectionview-layout`
- 口述一句话：CollectionView 是更通用的列表容器，Layout 决定它的空间排列。

**参考答案：**

TableView 主要是一维列表，CollectionView 更通用，支持网格、瀑布流和复杂布局。自定义 Layout 适合 item 位置、大小、吸附、装饰视图等不规则场景。现代 iOS 也可以用 Compositional Layout 快速组合复杂布局。

---

## UIKit / 性能

<a id="topic-7"></a>

### 37. 如何优化 TableView 或 CollectionView 的滚动性能？

- 难度：Medium
- ID：`ios-uikit-list-scroll-performance`
- 口述一句话：列表流畅靠主线程减负、图片异步、复用干净，并控制离屏渲染和透明混合。

**参考答案：**

列表优化重点是让主线程每帧工作足够少。常见做法包括复用 Cell、缓存高度、减少 Auto Layout 开销、异步加载和解码图片、取消无效图片请求、配置时覆盖所有 UI 状态，避免复用状态残留。

离屏渲染也是列表滚动里常见的渲染问题。它可以简单理解为：系统不能直接把图层画到屏幕上，而是要先在屏幕外开一块缓冲区，把圆角、阴影、mask、透明等效果处理完，再合成到屏幕上。这个过程会增加 GPU/渲染管线成本，Cell 数量一多、快速滚动时就可能掉帧。

常见触发场景包括圆角配合 masksToBounds、复杂阴影、mask、模糊效果、透明图层叠加等。优化方式是：圆角和阴影尽量不要放在同一个图层上；阴影设置 shadowPath；图片圆角可以提前裁剪或让图片服务端处理；减少透明重叠；复杂背景可以预渲染。最后用 Time Profiler 和 Core Animation 检查主线程耗时、FPS、Color Offscreen-Rendered 等渲染问题。

---

## UIKit / 渲染

<a id="topic-8"></a>

### 38. `UIView` 和 `CALayer` 有什么关系？为什么 UIView 负责事件而 CALayer 负责显示？

- 难度：Medium
- ID：`ios-uikit-uiview-calayer`
- 口述一句话：UIView 管交互和布局，CALayer 管显示和动画。

**参考答案：**

UIView 是 UIResponder 子类，负责事件响应、手势、布局和管理视图层级；CALayer 负责内容显示、动画和合成。每个 UIView 默认有一个 backing layer，最终渲染由 Core Animation 处理。很多视觉属性本质设置在 layer 上。

---

### 39. 什么是离屏渲染？它出现在屏幕渲染流程的哪一步？如何优化？

- 难度：Hard
- ID：`ios-uikit-offscreen-rendering`
- 口述一句话：离屏渲染是先画到屏幕外缓冲区再合成回屏幕；优化重点是少裁剪、拆圆角阴影、设 shadowPath、少 mask 和模糊。

**参考答案：**

离屏渲染可以理解为：本来图层可以直接参与屏幕合成，但因为某些效果需要先拿到“这个图层完整渲染后的结果”，系统就必须先在屏幕外开一块缓冲区，把这个图层单独画好，再把结果拿回来和其他图层合成到屏幕上。

屏幕渲染的大致流程可以这样理解：CPU 先负责业务逻辑、布局计算、生成视图和图层树；然后把图层信息提交给渲染服务；GPU 根据图层树做纹理处理、混合和合成；最后把最终帧显示到屏幕。正常情况下，图层可以直接作为纹理参与最终合成。

离屏渲染发生在 GPU 渲染/合成之前或过程中。原因不是“因为耗时所以离屏”，而是某些效果无法在普通的一次合成里直接完成。比如 masksToBounds 圆角裁剪需要先知道图层最终内容再裁掉圆角外的部分；复杂阴影需要根据图层形状生成阴影；mask 蒙版需要先得到内容再按蒙版裁剪；模糊效果也需要先拿到一块已经渲染好的内容再处理。这些场景都可能要求 GPU 先渲染到离屏缓冲纹理，再把这张纹理放回主渲染流程参与最终合成。

它的问题是多了一次额外的渲染目标切换和缓冲区读写，增加 GPU/渲染管线成本。列表快速滚动时，如果大量 Cell 同时触发离屏渲染，就容易掉帧。

常见触发场景包括：圆角配合 masksToBounds、clipsToBounds 裁剪、复杂阴影、mask、模糊效果、透明图层叠加、shouldRasterize 使用不当等。

优化方式可以这样记：第一，减少 masksToBounds / clipsToBounds 的使用，能通过布局约束避免内容溢出的，就不要到处开裁剪。第二，圆角和阴影尽量拆成不同图层，避免同一个图层既裁剪又做阴影。第三，阴影设置 shadowPath，让系统不用动态推算阴影形状。第四，头像、封面这类固定圆角图片可以提前裁剪、客户端预处理，或者让服务端直接返回合适尺寸和圆角效果。第五，少用复杂 mask 和实时模糊，复杂背景可以预渲染成图片。第六，减少透明重叠和 alpha 混合。第七，谨慎使用 shouldRasterize，它适合内容复杂但不频繁变化的图层；如果内容一直变化，缓存会频繁失效，反而更耗。

排查时可以用 Instruments 的 Core Animation，或者 Xcode 的 Debug View Hierarchy / Color Offscreen-Rendered 观察哪些图层触发了离屏渲染。面试收口：离屏渲染不是一定有问题，问题在于列表、动画这类高频场景大量触发，导致每帧渲染成本变高。

---

## UIKit / 事件响应

<a id="topic-9"></a>

### 40. 响应链是什么？事件找不到处理者时会如何向上传递？

- 难度：Medium
- ID：`ios-uikit-responder-chain`
- 口述一句话：响应链就是事件从命中的 view 一路向上传递的链。

**参考答案：**

响应链是事件处理对象的传递链。触摸事件先通过 hit-test 找到目标 view，如果它不处理，就沿 superview、viewController、window、application 向上传递。它让事件可以从具体视图逐级交给更高层处理。

---

### 41. `hitTest(_:with:)` 和 `point(inside:with:)` 的作用是什么？如何扩大按钮点击区域？

- 难度：Medium
- ID：`ios-uikit-hit-test`
- 口述一句话：pointInside 判断在不在，hitTest 决定谁接收。

**参考答案：**

point(inside:with:) 判断触点是否在当前 view 内；hitTest(_:with:) 从当前 view 递归查找真正接收事件的最深子视图。扩大按钮点击区域可以重写 point(inside:) 扩大判断区域，或在父视图 hitTest 中转发。

---

### 42. 手势和按钮点击冲突怎么处理？多个 Gesture Recognizer 如何协调？

- 难度：Medium
- ID：`ios-uikit-gesture-conflict`
- 口述一句话：手势冲突用 delegate 和失败依赖来协调识别顺序。

**参考答案：**

手势冲突可以通过 UIGestureRecognizerDelegate 控制是否同时识别、是否接收 touch、或者设置 require(toFail:) 让一个手势失败后另一个再识别。按钮和手势冲突时，要判断事件归属，避免父视图手势吞掉子控件点击。

---

## 网络 / 安全

<a id="topic-10"></a>

### 43. HTTP 和 HTTPS 有什么区别？HTTPS 相比 HTTP 多了哪些安全能力？

- 难度：Easy
- ID：`ios-http-vs-https`
- 口述一句话：HTTP 是 TCP 上直接跑明文 HTTP；HTTPS 是 TCP 上先做 TLS 握手，验证证书并协商密钥，再加密传输 HTTP。

**参考答案：**

HTTP 和 HTTPS 最大的区别，可以从握手过程看出来：HTTP 建立 TCP 连接后，直接传 HTTP 明文数据；HTTPS 建立 TCP 连接后，还要先完成 TLS 握手，确认服务器身份、协商加密算法和会话密钥，然后才传 HTTP 数据。

HTTP 的流程大概是：

```text
1. 客户端和服务器建立 TCP 三次握手
2. TCP 连接建立成功
3. 客户端直接发送 HTTP 请求
4. 服务器返回 HTTP 响应
```

例如：

```text
GET /user/info HTTP/1.1
Host: example.com
Token: abc123
```

这些内容在 HTTP 中都是明文传输，所以 HTTP 不防窃听、不防篡改，也不能可靠确认对方是不是真的服务器。

HTTPS = HTTP + TLS。它不是换了一套 HTTP 业务协议，而是在 HTTP 外面包了一层 TLS。HTTPS 的流程大概是：

```text
1. 客户端和服务器先建立 TCP 三次握手
2. 开始 TLS 握手
3. 客户端校验证书，确认服务器身份
4. 双方协商加密算法和会话密钥
5. TLS 握手完成
6. 后续 HTTP 请求/响应都通过 TLS 加密传输
```

也就是：

```text
TCP 连接 -> TLS 握手 -> 加密后的 HTTP 数据
```

TLS 握手简化理解包括：ClientHello，客户端告诉服务器自己支持的 TLS 版本、加密套件和随机数；ServerHello，服务器选择 TLS 版本和加密套件，并返回服务器随机数；Certificate，服务器发送证书；客户端验证证书链、证书是否过期、域名是否匹配、是否由可信 CA 签发；之后双方通过密钥协商生成会话密钥；最后 Finished 确认握手完成。

握手完成后，真正的 HTTP 请求和响应会使用协商出的会话密钥加密传输。中间人即使抓到包，也很难直接看到请求路径、Header、Token、响应 JSON 等明文内容。

所以两者核心区别是：

```text
HTTP:  TCP 握手 -> 直接传明文 HTTP
HTTPS: TCP 握手 -> TLS 握手 -> 传加密 HTTP
```

HTTPS 相比 HTTP 多了三类安全能力：第一，加密，防止内容被窃听；第二，完整性校验，防止内容被篡改；第三，身份认证，通过证书链确认服务器身份。

但 HTTPS 不等于业务绝对安全。它主要保护传输链路，客户端 token 存储、证书信任策略、服务端漏洞、重放攻击、业务参数校验、用户安装恶意根证书等问题仍然要单独处理。

面试收口：HTTP 建立 TCP 连接后直接明文传输请求和响应；HTTPS 是 HTTP 加 TLS，TCP 三次握手后还会进行 TLS 握手，客户端通过证书链验证服务器身份，双方协商会话密钥，之后 HTTP 数据加密传输。HTTPS 提供加密、防篡改和服务器身份认证，但只保护传输链路，不代表业务绝对安全。

---

### 44. HTTPS 相比 HTTP 多了什么？TLS 握手大致解决什么问题？

- 难度：Medium
- ID：`ios-https-tls-basics`
- 口述一句话：TLS 握手是为了认证身份、协商算法、生成会话密钥。

**参考答案：**

HTTPS 比 HTTP 多了 TLS 层。TLS 握手主要解决三件事：确认服务器身份，协商加密算法，安全地产生后续通信使用的会话密钥。之后 HTTP 内容会用会话密钥加密传输，避免明文被窃听或篡改。

---

### 45. HTTPS 一定安全吗？还可能存在哪些安全风险？

- 难度：Medium
- ID：`ios-https-is-always-safe`
- 口述一句话：HTTPS 保护链路，不保护所有业务和客户端风险。

**参考答案：**

HTTPS 不等于绝对安全。它保护传输过程，但如果用户安装了恶意根证书、客户端忽略证书校验、token 存储不安全、接口被重放、服务端有漏洞，仍然可能出问题。高安全场景还会做证书锁定、请求签名和敏感数据加密。

---

## 网络 / TCP

<a id="topic-11"></a>

### 46. TCP 三次握手和四次挥手分别解决什么问题？

- 难度：Medium
- ID：`ios-tcp-handshake-wave`
- 口述一句话：三次握手建连接，四次挥手关双向通道。

**参考答案：**

三次握手用于建立可靠连接，确认双方发送和接收能力正常，并同步初始序列号。四次挥手用于分别关闭两个方向的数据通道，因为 TCP 是全双工连接。面试重点是：握手建连接，挥手释放连接，序列号和确认号保证可靠有序。

---

## 网络 / HTTP

<a id="topic-12"></a>

### 47. GET 和 POST 有什么区别？幂等性、安全性、缓存方面如何理解？

- 难度：Easy
- ID：`ios-http-get-post`
- 口述一句话：GET 偏获取和幂等，POST 偏提交和修改。

**参考答案：**

GET 通常用于获取资源，参数常在 URL，适合缓存和幂等请求；POST 通常用于提交数据，参数在 body，常用于创建或修改资源。GET/POST 本身不决定安全，安全要靠 HTTPS、鉴权和服务端校验。

---

## 网络 / 鉴权

<a id="topic-13"></a>

### 48. Cookie 和 Token 有什么区别？移动端登录态通常如何设计？

- 难度：Medium
- ID：`ios-cookie-vs-token`
- 口述一句话：移动端常用 Token，重点是携带、刷新和安全存储。

**参考答案：**

Cookie 通常由浏览器自动携带，偏 Web 会话；Token 是客户端主动放在请求头里，移动端更常见。移动端一般登录后保存 access token 和 refresh token，access token 用于接口鉴权，过期后用 refresh token 换新。敏感 token 应存 Keychain。

---

### 49. Token 过期如何刷新？如何避免多个请求同时触发重复刷新？

- 难度：Hard
- ID：`ios-token-refresh`
- 口述一句话：Token 刷新要合并并发请求，避免同时刷新多次。

**参考答案：**

Token 过期后，客户端用 refresh token 请求新 access token，然后重试原请求。关键是避免多个接口同时 401 后重复刷新，可以用单飞机制：刷新中其他请求等待同一个刷新结果；也可以用 actor、锁或串行队列保护刷新状态。

---

## 网络 / URLSession

<a id="topic-14"></a>

### 50. `URLSession` 请求如何取消、重试和设置超时？

- 难度：Medium
- ID：`ios-urlsession-cancel-retry`
- 口述一句话：URLSession 管取消和超时，重试要看错误、次数和幂等性。

**参考答案：**

URLSessionTask 可以调用 cancel 取消；超时可在 URLRequest 或 URLSessionConfiguration 设置；重试要判断错误类型、状态码、幂等性和重试次数。常见策略是指数退避，且不要盲目重试非幂等写操作。

---

## 网络 / 架构

<a id="topic-15"></a>

### 51. 如何设计一个可测试、可扩展的网络层？需要包含哪些模块？

- 难度：Hard
- ID：`ios-network-layer-design`
- 口述一句话：好网络层要统一请求、解析、鉴权、错误、取消和测试替身。

**参考答案：**

网络层可以拆成 Endpoint、RequestBuilder、Transport、Decoder、Interceptor、Authenticator、ErrorMapper 和 Logger。通过 protocol 抽象传输层，测试时注入 Mock。业务层只关心 typed response 和业务错误，鉴权、重试、日志、取消统一收口。

---

## 网络 / 缓存

<a id="topic-16"></a>

### 52. 图片缓存如何设计？内存缓存、磁盘缓存、下载取消、解码分别如何处理？

- 难度：Hard
- ID：`ios-image-cache-design`
- 口述一句话：图片缓存要管内存、磁盘、去重、取消、解码和清理。

**参考答案：**

图片缓存通常分内存和磁盘两级。内存用 NSCache 控容量，磁盘用 URL/key 映射文件并设置过期清理。还要支持下载去重、取消请求、后台解码、按目标尺寸缩放，避免复用错图和大图造成内存峰值。

---

## 数据存储

<a id="topic-17"></a>

### 53. UserDefaults、Keychain、文件、SQLite/Core Data 分别适合存什么？

- 难度：Medium
- ID：`ios-storage-userdefaults-keychain-file-db`
- 口述一句话：存储选择看敏感性、数据量、结构化和查询需求。

**参考答案：**

UserDefaults 适合少量非敏感配置；Keychain 适合 token、账号凭证等敏感数据；FileManager 适合图片、日志、离线文件；SQLite/Core Data/SwiftData 适合结构化数据、查询和关系管理。选择依据是敏感性、数据量、结构化程度和查询复杂度。

---

## 数据存储 / 安全

<a id="topic-18"></a>

### 54. 为什么 Token、密码类敏感信息不应该放在 UserDefaults？Keychain 的适用场景是什么？

- 难度：Medium
- ID：`ios-keychain-sensitive-data`
- 口述一句话：敏感凭证放 Keychain，UserDefaults 只放非敏感配置。

**参考答案：**

UserDefaults 本质是偏好配置文件，不适合保存 token、密码等敏感信息。Keychain 由系统安全服务管理，支持访问控制和设备级保护，适合保存凭证。退出登录要清理，访问级别和备份迁移策略也要明确。

---

## 数据存储 / Core Data

<a id="topic-19"></a>

### 55. Core Data 的核心对象有哪些？Context、Model、Persistent Store Coordinator 分别负责什么？

- 难度：Medium
- ID：`ios-coredata-core-objects`
- 口述一句话：Core Data 是模型、上下文、协调器、持久化存储四块。

**参考答案：**

Core Data 核心包括 Managed Object Model、Managed Object Context、Persistent Store Coordinator 和 Persistent Store。Model 描述数据结构，Context 管理对象和变更，Coordinator 连接模型与底层存储，Store 是 SQLite 等实际持久化介质。

---

## 数据存储 / 迁移

<a id="topic-20"></a>

### 56. App 本地数据库结构升级时如何做数据迁移？如何降低迁移失败风险？

- 难度：Hard
- ID：`ios-database-migration`
- 口述一句话：迁移要有版本、兼容、测试、备份和失败策略。

**参考答案：**

数据库迁移要先做版本管理，再根据变更选择轻量迁移或自定义迁移。新增字段、简单改名适合轻量迁移；复杂结构调整要写 mapping 或分阶段迁移。上线前必须用旧版本真实数据测试，并准备失败回滚或重建策略。

---

## 并发 / 线程

<a id="topic-21"></a>

### 57. 进程和线程的区别是什么？iOS App 中主线程承担哪些职责？

- 难度：Easy
- ID：`ios-thread-process`
- 口述一句话：进程管资源，线程管执行，主线程管 UI 和事件。

**参考答案：**

进程是系统分配资源的单位，线程是 CPU 调度执行的单位。一个 App 至少有主线程，主线程负责 UI、事件响应和主 RunLoop。多个线程共享进程内存，所以访问共享数据时需要同步。

---

### 58. 为什么主线程不能做耗时任务？哪些操作容易造成主线程卡顿？

- 难度：Easy
- ID：`ios-main-thread-blocking`
- 口述一句话：主线程被耗时任务占住，UI 就不能及时响应和绘制。

**参考答案：**

主线程负责 UI 绘制、事件处理和 RunLoop 调度，如果做耗时任务，一帧内来不及提交就会卡顿。常见耗时包括同步网络、磁盘 IO、大量 JSON 解析、图片解码、复杂布局、锁等待和大循环计算。

---

## 并发 / GCD

<a id="topic-22"></a>

### 59. GCD 中 `sync` 和 `async` 的区别是什么？它们和是否开新线程是一回事吗？

- 难度：Medium
- ID：`ios-gcd-sync-async`
- 口述一句话：sync 等结果，async 不等结果；它们不等于是否开线程。

**参考答案：**

sync 会把任务提交到队列并等待执行完成后再返回；async 提交后立即返回。是否开新线程取决于队列和系统调度，不由 sync/async 直接决定。sync 主要影响等待关系，async 主要用于异步执行。

---

### 60. 串行队列和并发队列有什么区别？队列和线程之间是什么关系？

- 难度：Medium
- ID：`ios-gcd-serial-concurrent`
- 口述一句话：队列管任务顺序，线程负责实际执行。

**参考答案：**

串行队列一次只执行一个任务，保证任务顺序；并发队列可以同时执行多个任务，但开始顺序和完成顺序不一定一致。队列是任务调度抽象，线程是实际执行资源，GCD 会管理线程池。

---

### 61. `dispatch_sync` 到主队列为什么可能死锁？请用执行流程解释。

- 难度：Medium
- ID：`ios-gcd-main-sync-deadlock`
- 口述一句话：主线程同步派发到主队列，就是串行队列等待自己，必死锁。

**参考答案：**

如果当前就在主线程，再 dispatch_sync 到主队列，当前代码会等待主队列里的新任务执行完成；但主队列必须等当前任务结束才能执行新任务，于是互相等待造成死锁。本质是同一个串行队列同步等待自己。

---

### 62. 如何用 DispatchGroup 等待多个异步任务全部完成？适合什么场景？

- 难度：Easy
- ID：`ios-gcd-dispatchgroup`
- 口述一句话：DispatchGroup 用来汇总多个异步任务的完成时机。

**参考答案：**

DispatchGroup 用来等待多个异步任务完成。可以 group.enter/leave 包裹异步回调，或 group.async 提交任务，最后 notify 在所有任务结束后回调。适合多个接口并行请求后合并结果。

---

### 63. Semaphore 可以解决什么问题？用它控制并发数时要注意什么？

- 难度：Medium
- ID：`ios-gcd-semaphore`
- 口述一句话：Semaphore 能限流和同步，但主线程 wait 很危险。

**参考答案：**

Semaphore 是计数信号量，可以限制并发数或做线程同步。控制并发时先 wait，任务完成后 signal。要注意 wait/signal 成对出现，不要在主线程长时间 wait，否则容易卡顿或死锁。

---

### 64. iOS GCD 是什么？sync/async、串行/并发队列、常用 API 和死锁条件分别怎么理解？

- 难度：Hard
- ID：`ios-gcd-detailed-overview`
- 口述一句话：GCD 是基于队列的任务调度 API；串行/并发管队列怎么执行，sync/async 管当前线程等不等，死锁本质是同步等待形成等待环。

**参考答案：**

GCD，全称 Grand Central Dispatch，是 Apple 提供的基于队列的多线程任务调度 API。它的核心是把任务提交到队列，系统负责在线程池里调度执行。可以先这样说：GCD 用队列管理任务，后台做耗时工作，主线程更新 UI。

GCD 的核心概念有两个：Queue 和 Task。Queue 是队列，决定任务怎么排队、能不能并发；Task 是任务，也就是提交到队列里的闭包。队列不是线程，队列是调度抽象，线程是实际执行资源，GCD 会管理线程池。

队列分为串行队列和并发队列。串行队列一次只执行一个任务，任务按顺序执行，适合保护共享资源、按顺序写文件、顺序处理任务。并发队列可以同时执行多个任务，适合多个互不依赖的下载、计算、解析任务。主队列是特殊串行队列，在主线程执行，UI 更新必须回主队列。

任务提交方式分为 async 和 sync。async 是异步提交，提交后当前线程不等待任务完成，会继续往下走。sync 是同步提交，提交后当前线程会等待 block 执行完成，再继续往下走。注意：sync 一定会阻塞调用它的当前线程，不管目标队列是串行队列还是并发队列；串行/并发决定队列内部能不能并发执行，sync/async 决定当前线程等不等。

常见写法：

```swift
DispatchQueue.global(qos: .userInitiated).async {
    let result = loadData()

    DispatchQueue.main.async {
        updateUI(result)
    }
}
```

常用能力包括：

1. main queue：主队列，在主线程执行，用于 UI 更新。

2. global queue：系统后台并发队列，可以设置 QoS，比如 userInteractive、userInitiated、utility、background。

3. asyncAfter：延迟执行，常用于延迟提示、简单防抖、延迟关闭 loading。

4. DispatchGroup：等待多个异步任务全部完成后再统一回调，适合多个接口并行请求后合并结果。

5. DispatchSemaphore：计数信号量，可以限制并发数量或做线程同步。要注意 wait/signal 成对出现，不要在主线程长时间 wait。

6. DispatchWorkItem：把任务包装成对象，可以做简单取消和防抖。cancel 不会强制杀死已经执行中的任务，只是设置取消标记。

7. barrier：栅栏任务，配合自定义并发队列实现多读单写。多个读可以并发，写操作独占。

GCD 死锁的条件可以记成一句话：同步等待 + 目标任务无法开始 + 形成互相等待。最典型的是当前执行上下文正在占着某个队列，又 sync 等这个队列执行一个新任务，而这个新任务必须等当前任务结束后才能执行。

常见死锁场景：

1. 主线程调用 DispatchQueue.main.sync。主队列是串行队列，当前代码已经在主队列执行，又同步提交新任务到主队列，新任务要等当前任务结束，当前任务又等新任务完成，于是死锁。

2. 自定义串行队列内部 sync 自己。串行队列正在执行外层任务，外层任务里又 queue.sync 提交内层任务，内层任务必须等外层任务结束，外层任务又等待内层任务完成，于是死锁。

3. 两个串行队列互相 sync，形成等待环。

4. 并发队列的 barrier 内部 sync 同一个队列。barrier 正在独占队列，内层 sync 任务要等 barrier 结束，barrier 又在等 sync 完成，也可能死锁。

5. 主线程 wait 信号量，而 signal 又需要回主线程执行。主线程被 wait 阻塞，signal block 无法在主队列执行，于是卡死。

要特别区分：串行队列 sync 本身不一定死锁。如果你在主线程对一个自定义串行队列 sync，只是主线程等待任务完成，不会必然死锁；只有在同一个串行队列内部 sync 自己，或者形成等待环，才会死锁。并发队列 sync 自己通常不容易死锁，但 sync 仍然会阻塞调用线程。

避免 GCD 死锁和卡顿的原则：不要在主线程 DispatchQueue.main.sync；不要在队列内部 sync 自己；避免多个串行队列互相 sync；不要在主线程 semaphore.wait；不要为了把异步变同步而阻塞主线程；UI 更新回主线程；复杂共享状态可以考虑 actor、锁或串行队列统一保护。

GCD 和 Swift Concurrency 的关系：GCD 更偏底层任务派发，关注把闭包提交到队列；async/await、Task、TaskGroup、actor、MainActor 是 Swift 的语言级并发模型，关注把异步流程写得更清楚，并集成取消、错误处理和结构化并发。现代业务异步流程通常优先 async/await 和 Task；老项目、底层队列控制、barrier、semaphore、一些系统 API 和面试里仍然需要理解 GCD。

面试收口：GCD 是基于队列的任务调度 API。串行/并发决定队列内部一次执行几个任务，sync/async 决定当前线程是否等待。常用能力有 main/global queue、asyncAfter、DispatchGroup、Semaphore、WorkItem、barrier。GCD 死锁的本质是同步等待形成等待环，最常见是主队列 sync 主队列、串行队列里 sync 自己、主线程 wait 等一个回主线程 signal 的任务。

---

## 并发 / OperationQueue

<a id="topic-23"></a>

### 65. OperationQueue 相比 GCD 有什么优势？依赖、取消、优先级如何体现？

- 难度：Medium
- ID：`ios-operationqueue-vs-gcd`
- 口述一句话：复杂任务编排用 OperationQueue，简单异步派发用 GCD。

**参考答案：**

OperationQueue 比 GCD 更面向任务对象，支持依赖关系、取消、优先级、最大并发数和状态观察。复杂任务编排、可取消任务适合 OperationQueue；简单派发、轻量异步适合 GCD。

---

### 66. iOS OperationQueue 是什么？相比 GCD 有什么特点？依赖、取消、优先级和常见坑怎么理解？

- 难度：Hard
- ID：`ios-operationqueue-detailed-overview`
- 口述一句话：OperationQueue 用 Operation 对象管理任务，比 GCD 更适合依赖、取消、优先级、并发限制和状态观察；常见坑是 cancel 不强停、主线程 wait 卡死、依赖环和异步 Operation 提前完成。

**参考答案：**

OperationQueue 是 Apple 提供的基于 Operation 的任务调度 API。它底层也和系统线程调度有关，但比 GCD 更面向“任务对象”。可以先这样说：GCD 更像把闭包丢到队列执行，OperationQueue 更像管理一组可取消、可依赖、可设置优先级、可观察状态的任务。

OperationQueue 里有两个核心概念：Operation 和 OperationQueue。Operation 表示一个任务对象，OperationQueue 表示执行这些任务的队列。常见的 Operation 有 BlockOperation，也可以继承 Operation 自定义任务。

和 GCD 相比，OperationQueue 的优势主要是任务管理能力更强。它天然支持依赖关系、取消、优先级、最大并发数、暂停/恢复、任务状态观察。比如 A 任务必须等 B、C 下载完成后再执行，这种任务编排用 OperationQueue 会比手写 DispatchGroup 更清晰。

常见用法包括：

1. BlockOperation：把一段代码包装成 Operation，适合简单任务。

```swift
let operation = BlockOperation {
    print("执行后台任务")
}

let queue = OperationQueue()
queue.addOperation(operation)
```

2. maxConcurrentOperationCount：限制最大并发数量。设置为 1 时类似串行队列；设置为大于 1 时可以并发执行。适合限制下载、图片处理、数据库批处理的并发量。

```swift
let queue = OperationQueue()
queue.maxConcurrentOperationCount = 2
```

3. dependency：设置任务依赖。比如解析任务必须等下载任务完成后执行。

```swift
parseOperation.addDependency(downloadOperation)
queue.addOperations([downloadOperation, parseOperation], waitUntilFinished: false)
```

4. OperationQueue.main：回到主队列更新 UI。它类似 DispatchQueue.main，但对象模型是 OperationQueue。

```swift
OperationQueue.main.addOperation {
    self.titleLabel.text = "完成"
}
```

5. cancel：取消任务。注意 cancel 不是强制杀死线程，只是把 Operation 的 isCancelled 标记为 true。任务内部要主动检查 isCancelled，并尽早 return。

```swift
final class DownloadOperation: Operation {
    override func main() {
        if isCancelled { return }
        // 执行一部分工作
        if isCancelled { return }
        // 继续执行
    }
}
```

6. isSuspended：暂停队列。暂停后，队列不会启动新的 Operation；但已经在运行的 Operation 不会被强制暂停。恢复时设置 isSuspended = false。

7. queuePriority 和 qualityOfService：queuePriority 表示同一个队列里任务的相对优先级；qualityOfService 表示任务对系统资源调度的期望，比如 userInitiated、utility、background。优先级不是严格顺序保证，只是调度倾向。

OperationQueue 常见适用场景：多个任务有先后依赖；任务需要取消；需要限制并发数量；需要暂停/恢复一组任务；需要观察任务状态；需要把任务封装成对象复用。比如图片批量处理、文件上传下载队列、离线数据同步、复杂初始化流程、多个接口完成后再做合并处理。

常见坑要重点记：

1. cancel 不会强制停止任务。Operation 已经开始执行后，如果内部不检查 isCancelled，它仍然会跑完。所以自定义 Operation 里要在耗时步骤之间检查 isCancelled。

2. suspend 不会暂停正在执行的任务。isSuspended 只影响还没开始的任务。已经开始执行的任务要自己支持取消或暂停逻辑。

3. 不要在主线程调用 waitUntilAllOperationsAreFinished。这个方法会阻塞当前线程。如果在主线程等待，而某个 Operation 完成后又需要回主线程更新或 signal，就可能造成界面卡死甚至等待环。

4. 依赖关系不要形成环。比如 A 依赖 B，B 又依赖 A，这两个任务都会等对方完成，结果谁也不会开始。它不像 GCD sync 那样立刻死锁崩住线程，但表现是任务永远不执行。

5. 异步任务不能只在 main 里启动网络请求就返回。普通 Operation 的 main 方法一返回，OperationQueue 就认为任务完成了。如果 main 里只是发起 URLSession 请求，然后立刻返回，依赖它的下游任务可能提前执行。真正封装异步任务时，需要自定义 Asynchronous Operation，正确维护 isExecuting 和 isFinished，或者在现代 Swift 中优先用 async/await。

6. 不要把 OperationQueue 当成 UI 状态容器。OperationQueue 负责调度任务，不负责保护任意共享可变状态。多个 Operation 同时读写同一份数据，仍然要用锁、串行队列、actor 或数据库事务保护。

7. maxConcurrentOperationCount 不是线程数量的绝对保证。它限制的是队列同时执行的 Operation 数量，系统实际线程调度仍由系统决定。

OperationQueue 和 GCD 的选择可以这样记：简单异步派发、回主线程、延迟执行，用 GCD 很直接；任务有依赖、取消、优先级、并发限制和状态管理，用 OperationQueue 更合适；现代 Swift 业务异步流程优先考虑 async/await、Task、TaskGroup 和 actor，OperationQueue 更适合老项目、Foundation 任务编排、需要 Objective-C 兼容或对象化任务管理的场景。

面试收口：OperationQueue 是比 GCD 更面向任务对象的并发工具，适合管理复杂任务编排。它支持依赖、取消、优先级、最大并发数、暂停恢复和状态观察。常见坑是 cancel 不会强杀任务、suspend 不会暂停已运行任务、主线程 wait 会卡死、依赖环导致任务永远不执行、异步 Operation 要正确维护完成状态。

---

## 并发 / RunLoop

<a id="topic-24"></a>

### 67. RunLoop 是什么？它和线程是什么关系？

- 难度：Hard
- ID：`ios-runloop-basics`
- 口述一句话：RunLoop 是线程的事件循环，负责调度事件、Timer 和观察者。

**参考答案：**

RunLoop 是线程的事件循环，让线程有事件时处理、没事件时休眠。主线程默认启动 RunLoop，子线程默认没有。Source、Timer、Observer 都注册到 RunLoop 上，RunLoop 和线程是一一对应但懒创建的关系。

---

### 68. Timer 为什么有时不准？RunLoop Mode 对 Timer 有什么影响？

- 难度：Hard
- ID：`ios-runloop-timer-accuracy`
- 口述一句话：Timer 不准通常是 RunLoop 忙或 mode 不匹配。

**参考答案：**

Timer 依赖 RunLoop 触发，不是实时系统。主线程忙、RunLoop 没跑到对应 mode、或者系统调度延迟都会导致 Timer 不准。比如滚动时 RunLoop 进入 tracking mode，默认 mode 的 Timer 可能暂停；可加入 common modes 缓解。

---

### 69. 如何实现一个常驻线程？为什么需要给线程启动 RunLoop？

- 难度：Hard
- ID：`ios-runloop-persistent-thread`
- 口述一句话：常驻线程的关键是给子线程启动并保活 RunLoop。

**参考答案：**

常驻线程需要创建子线程后启动 RunLoop，并添加一个 Source、Port 或 Timer 保持 RunLoop 不退出。否则线程执行完入口函数就结束。常驻线程适合需要长期串行处理任务的场景，但现在很多情况可用队列或 actor 替代。

---

### 70. iOS RunLoop 是什么？它和线程、Timer、Mode、主线程卡顿有什么关系？

- 难度：Hard
- ID：`ios-runloop-detailed-overview`
- 口述一句话：RunLoop 是线程的事件循环；主线程默认开启来处理 UI、Timer 和事件，Timer 滚动暂停多半是 Mode 不匹配，主线程卡顿本质是 RunLoop 被耗时任务阻塞。

**参考答案：**

RunLoop 可以理解成线程里的事件循环机制。它让线程在有事件时被唤醒处理事件，没有事件时进入休眠，避免线程一直空转消耗 CPU。可以先这样说：RunLoop 不是线程，它是线程内部的事件循环；主线程靠 RunLoop 持续响应点击、滚动、Timer、Source 和 UI 刷新。

如果没有 RunLoop，一个线程执行完入口函数就结束了。比如子线程里执行一段 print，执行完线程就退出。但 App 的主线程不能退出，因为它要一直等待用户点击、滑动、页面刷新、定时器和系统事件。系统会在主线程启动 RunLoop，让主线程长期存活，并在有事件时处理事件。

可以用伪代码这样理解：

```swift
while appIsRunning {
    等待事件
    处理事件
    没有事件时休眠
}
```

RunLoop 和线程的关系：每个线程都可以有自己的 RunLoop，RunLoop 和线程是一一对应的，但 RunLoop 通常是懒创建的。主线程的 RunLoop 默认由系统启动；子线程的 RunLoop 默认不会自动一直运行，如果你想在子线程里使用 Timer、Port 或长期等待事件，需要手动启动 RunLoop。

```swift
Thread {
    Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
        print("子线程 Timer")
    }

    RunLoop.current.run()
}.start()
```

RunLoop 常处理的内容包括：Timer、Source、Observer、用户触摸事件、端口事件、performSelector、主队列任务、自动释放池相关处理、UI 刷新相关事件等。它不是专门为 Timer 存在的，Timer 只是 RunLoop 管理的一类输入。

Timer 和 RunLoop 的关系非常重要。Timer 本身不会自己开线程，也不会自己一直跑。Timer 需要被加入某个 RunLoop 的某个 Mode，RunLoop 运行到对应 Mode 时才会触发 Timer。

```swift
let timer = Timer(timeInterval: 1, repeats: true) { _ in
    print("tick")
}
RunLoop.main.add(timer, forMode: .common)
```

RunLoop Mode 可以理解成 RunLoop 的运行场景。常见 Mode 有：

1. default：普通模式，页面正常停留时常用。

2. tracking：滚动、拖拽、手势追踪时使用，比如 UIScrollView 正在滚动。

3. common：不是一个具体 Mode，而是一组常用 Mode 的集合。把 Timer 加到 common，通常可以让它在 default 和 tracking 等常用模式下都工作。

一个经典问题是：为什么滚动列表时 Timer 停了？原因通常是 Timer 默认被加入 default mode，而用户滚动 UIScrollView 时，主线程 RunLoop 切换到 tracking mode。此时 default mode 里的 Timer 不会被处理，所以看起来暂停了。解决方式是把 Timer 加到 common。

```swift
let timer = Timer(timeInterval: 0.2, repeats: true) { _ in
    print("刷新倒计时")
}
RunLoop.main.add(timer, forMode: .common)
```

Timer 还容易和循环引用一起考。RunLoop 会持有 Timer，Timer 又可能强持有 target 或 closure，ViewController 如果再强持有 Timer，就可能形成循环引用。解决方式是页面退出时 invalidate，并在 block 里使用 weak self。只把 timer = nil 不一定够，因为 Timer 还可能被 RunLoop 持有。

```swift
timer?.invalidate()
timer = nil
```

RunLoop 和主线程卡顿也有关系。主线程 RunLoop 负责处理 UI 事件和页面刷新。如果主线程正在执行耗时任务，比如同步网络、文件读写、大量 JSON 解析、大图解码、复杂布局、锁等待，RunLoop 就没有机会及时处理触摸和刷新，用户就会感觉卡顿。

```swift
// 错误示例：主线程睡眠会阻塞 RunLoop，页面无法响应。
Thread.sleep(forTimeInterval: 3)
```

实际开发中，RunLoop 常见应用场景包括：

1. 解释主线程为什么不会退出，以及 App 为什么能持续响应事件。

2. 解决 Timer 在列表滚动时暂停的问题。

3. 创建常驻线程，让子线程长期等待任务。

4. 理解 autorelease pool 在主线程 RunLoop 每轮中的释放时机。

5. 做卡顿监控，通过观察主线程 RunLoop 状态判断是否长时间没有进入正常循环。

6. 理解 UI 事件、手势、滚动和页面刷新为什么依赖主线程。

但也要注意：现在日常业务开发里，不建议为了普通异步任务去手写复杂 RunLoop。耗时任务可以优先用 async/await、Task、OperationQueue、GCD。RunLoop 更多用于理解系统事件机制、Timer、卡顿监控、常驻线程和面试底层原理。

面试可以这样回答：RunLoop 是线程的事件循环机制，让线程有事件时处理事件，没事件时休眠。主线程默认开启 RunLoop，所以 App 能持续响应点击、滚动、Timer 和 UI 刷新；子线程如果需要 Timer 或长期等待事件，需要手动启动 RunLoop。Timer 必须加入 RunLoop 的某个 Mode 才能触发，滚动时 Timer 暂停通常是因为 default mode 和 tracking mode 不匹配，可以加入 common modes。主线程如果被耗时任务阻塞，RunLoop 无法及时处理事件和刷新，就会造成卡顿。

面试收口：RunLoop 不是线程，而是线程的事件循环；主线程靠它活着并响应 UI 事件。Timer、Mode、滚动暂停、常驻线程、自动释放池和卡顿监控，都是 RunLoop 高频考点。

---

## Swift Concurrency

<a id="topic-25"></a>

### 71. `async/await` 和 GCD 如何选择？它们解决的问题有什么不同？

- 难度：Medium
- ID：`ios-concurrency-async-await-vs-gcd`
- 口述一句话：GCD 管派发，async/await 管异步流程表达。

**参考答案：**

GCD 是底层任务调度工具，关注把闭包派发到队列；async/await 是语言级异步模型，关注把异步流程写得像同步代码，并和错误、取消、结构化并发集成。简单线程切换可用 GCD；现代异步业务流程、并发请求和可取消任务优先 async/await。

---

### 72. `async/await` 相比回调有什么优势？错误处理和取消如何表达？

- 难度：Medium
- ID：`ios-concurrency-async-await-advantage`
- 口述一句话：async/await 让异步代码像同步代码，并统一错误和取消。

**参考答案：**

async/await 最大优势是消除回调嵌套，让异步代码按顺序书写；错误可用 throws 统一处理，取消可通过 Task 协作检查。它还配合结构化并发管理子任务生命周期，比散落回调更可读、更可维护。

---

### 73. `Task` 是什么？什么时候需要用 `Task {}` 创建异步上下文？

- 难度：Medium
- ID：`ios-concurrency-task-basics`
- 口述一句话：Task 是异步任务；同步代码要调用 async 时常用 Task 开上下文。

**参考答案：**

Task 是 Swift Concurrency 中异步任务的执行单元。同步上下文里不能直接 await async 方法，所以常用 Task { await work() } 创建异步上下文。Task 也用于启动非结构化任务，但要注意生命周期、取消和对 self 的捕获。

---

### 74. Structured Concurrency 和 Unstructured Task 有什么区别？为什么结构化并发更容易管理生命周期？

- 难度：Hard
- ID：`ios-concurrency-structured-unstructured`
- 口述一句话：结构化并发有父子生命周期，Task {} 更独立要谨慎。

**参考答案：**

结构化并发中子任务有明确父子关系，父任务会等待、取消和传播错误，比如 async let、TaskGroup。Unstructured Task 用 Task {} 创建，生命周期更独立，不自动受当前作用域管理。优先结构化并发，只有跨作用域任务才考虑非结构化。

---

### 75. `async let` 和 `TaskGroup` 分别适合什么场景？如何选择？

- 难度：Medium
- ID：`ios-concurrency-asynclet-taskgroup`
- 口述一句话：固定少量并发用 async let，动态批量并发用 TaskGroup。

**参考答案：**

async let 适合数量固定、写法简单的并发任务，比如同时请求用户和配置；TaskGroup 适合数量动态、循环创建、需要收集多个结果的任务。二者都是结构化并发，父作用域会等待子任务完成。

---

### 76. `actor` 解决了什么问题？它和用锁保护共享状态有什么区别？

- 难度：Medium
- ID：`ios-concurrency-actor-basics`
- 口述一句话：actor 用隔离机制保护共享可变状态。

**参考答案：**

actor 是并发安全的引用类型，用 actor isolation 保护内部可变状态，外部访问隔离方法或属性通常需要 await。它能替代一部分锁和串行队列，让共享状态的访问串行化。actor 保护的是内部状态，不代表所有传入对象都自动线程安全。

---

### 77. `MainActor` 的作用是什么？为什么 UI 更新通常需要放在 MainActor 上？

- 难度：Medium
- ID：`ios-concurrency-mainactor`
- 口述一句话：@MainActor 让 UI 相关代码回到主线程执行，并让编译器检查不安全访问。

**参考答案：**

@MainActor 可以标记 UI 相关代码，让它们固定在主线程相关的执行上下文中执行。跨并发环境调用时用 await，Swift 会帮你切回主线程，并检查不安全的 UI 访问。

---

### 78. `Sendable` 是什么？它能保证线程安全吗？什么时候需要 `@unchecked Sendable`？

- 难度：Hard
- ID：`ios-concurrency-sendable`
- 口述一句话：Sendable 是并发传递安全标记，不是自动加锁。

**参考答案：**

Sendable 表示一个类型的值可以安全跨并发边界传递。值类型且成员都 Sendable 通常自动满足；含可变共享状态的 class 默认不安全。Sendable 本身不加锁、不保证逻辑线程安全；@unchecked Sendable 是开发者向编译器承诺自己保证安全。

---

### 79. `@Sendable` 闭包和普通闭包有什么区别？为什么捕获非线程安全对象可能报警？

- 难度：Hard
- ID：`ios-concurrency-sendable-closure`
- 口述一句话：@Sendable 检查闭包跨并发执行时的捕获安全。

**参考答案：**

@Sendable 表示闭包可能跨并发域执行，编译器会限制它捕获非 Sendable 或可变共享状态。普通闭包没有这种并发安全约束。它能帮你发现潜在数据竞争，但不能自动让捕获对象线程安全，真正安全仍要靠 actor、锁或不可变数据。

---

### 80. Task 取消是强制取消还是协作式取消？业务代码如何正确响应取消？

- 难度：Medium
- ID：`ios-concurrency-task-cancellation`
- 口述一句话：Task 取消是协作式，代码要主动检查和响应。

**参考答案：**

Task 取消是协作式的，不会强制杀掉正在执行的代码。调用 cancel 只是设置取消标记，任务内部需要检查 Task.isCancelled、try Task.checkCancellation()，或调用支持取消的 async API。业务要在取消时停止后续工作并释放资源。

---

### 81. Actor Isolation 是什么？为什么外部访问 actor 隔离状态通常需要 `await`？

- 难度：Hard
- ID：`ios-concurrency-actor-isolation`
- 口述一句话：Actor Isolation 让外部访问 actor 状态必须排队 await。

**参考答案：**

Actor Isolation 是 actor 对自身状态的隔离规则：actor 内部可以直接访问自己的隔离状态，外部必须通过 await 排队进入 actor 执行。这样保证同一时间只有一个任务操作隔离状态，避免数据竞争。nonisolated 成员不受隔离保护。

---

## 内存管理

<a id="topic-26"></a>

### 82. ARC 的基本原理是什么？引用计数在对象生命周期中如何变化？

- 难度：Medium
- ID：`ios-memory-arc-principle`
- 口述一句话：ARC 靠引用计数释放对象，但解决不了循环引用。

**参考答案：**

ARC 通过引用计数管理对象生命周期。强引用增加计数，引用释放时计数减少，计数为 0 时对象 deinit。ARC 会在编译期插入 retain/release 等调用，运行时配合维护引用计数和 weak 表。循环引用会让计数无法归零。

---

### 83. `strong`、`weak`、`assign`、`copy` 的区别是什么？分别适合什么属性？

- 难度：Easy
- ID：`ios-memory-property-semantics`
- 口述一句话：strong 持有，weak 不持有，assign 不管理，copy 复制语义。

**参考答案：**

strong 持有对象，引用计数加一；weak 不持有对象，对象释放后自动置 nil；assign 用于基本类型或不管理生命周期的引用，容易悬垂；copy 会复制对象，常用于 NSString、NSArray 和闭包，保证不可变语义或把栈 Block 拷到堆。

---

### 84. `weak` 为什么能在对象释放后自动置 nil？大致依赖什么机制？

- 难度：Hard
- ID：`ios-memory-weak-nil`
- 口述一句话：weak 自动置 nil 依赖 Runtime 的 weak 引用表。

**参考答案：**

weak 引用不会增加对象引用计数。Runtime 维护 weak 表，记录哪些 weak 指针指向某个对象；对象释放时，Runtime 会遍历对应 weak 指针并置 nil。因此 weak 能避免悬垂指针，但只能用于 class 类型。

---

### 85. 什么情况下会发生循环引用？ViewController 中最常见的循环引用有哪些？

- 难度：Easy
- ID：`ios-memory-retain-cycle`
- 口述一句话：循环引用就是强引用形成闭环，ARC 无法释放。

**参考答案：**

循环引用是两个或多个对象互相强持有，导致引用计数无法归零。常见场景有 VC 强持有闭包，闭包强捕获 self；Timer 强持有 target；delegate 用 strong；对象之间互相 strong。解决方式是 weak/unowned、invalidate、解除观察或重新设计所有权。

---

### 86. 闭包如何避免循环引用？`weak self` 和 `unowned self` 如何选择？

- 难度：Medium
- ID：`ios-memory-closure-retain-cycle`
- 口述一句话：异步闭包默认用 weak self，unowned 只在生命周期绝对确定时用。

**参考答案：**

闭包被对象持有，同时闭包内部强捕获 self，就会循环引用。通常用 [weak self] 避免，适合 self 可能先释放的异步场景；unowned 不增加引用但对象释放后再访问会崩溃，只适合生命周期明确长于闭包的场景。

---

### 87. Delegate 为什么通常用 weak？什么时候 delegate 不能用 weak？

- 难度：Medium
- ID：`ios-memory-delegate-weak`
- 口述一句话：delegate 通常 weak，是为了避免反向强持有造成循环引用。

**参考答案：**

delegate 通常用 weak，因为被代理对象一般不应该拥有代理者，否则 owner 持有 child，child 又 strong 持有 owner 会循环引用。不能用 weak 的情况包括协议未限制 AnyObject、代理是值类型，或确实需要强持有的 delegate-like 对象，此时要明确所有权。

---

### 88. Timer 为什么容易造成循环引用？如何修复 Timer 持有 target 的问题？

- 难度：Medium
- ID：`ios-memory-timer-cycle`
- 口述一句话：Timer 循环来自 RunLoop 持有 Timer，Timer 持有 target。

**参考答案：**

Timer 会被 RunLoop 持有，Timer 又强持有 target，如果 target 也强持有 Timer，就形成循环。修复方式包括 invalidate、使用 block timer 并 weak self、代理对象转发、或用 GCD timer/Task 并管理取消。

---

### 89. Autorelease Pool 的作用是什么？在循环创建大量临时对象时为什么要手动加 autoreleasepool？

- 难度：Hard
- ID：`ios-memory-autoreleasepool`
- 口述一句话：autoreleasepool 用来提前释放一批临时对象，降低峰值。

**参考答案：**

Autorelease Pool 保存延迟释放对象，池子 drain 时统一发送 release。主线程 RunLoop 每轮会管理池子。循环中创建大量临时 Objective-C 对象时，手动加 autoreleasepool 可以让对象更早释放，降低内存峰值。

---

## 内存管理 / 调试

<a id="topic-27"></a>

### 90. 如何定位内存泄漏？Memory Graph、Leaks、Allocations 分别能看什么？

- 难度：Medium
- ID：`ios-memory-leak-debug`
- 口述一句话：泄漏定位看 deinit、强引用链、Leaks 和对象增长趋势。

**参考答案：**

先确认对象是否执行 deinit，再用 Xcode Memory Graph 查看强引用链，用 Instruments Leaks 找泄漏对象，用 Allocations 看对象数量是否持续增长。定位后修复循环引用、未移除观察、Timer 未释放等问题，并重复进出页面验证对象回落。

---

## 架构 / MVC

<a id="topic-28"></a>

### 91. MVC 在 iOS 项目里常见的问题是什么？为什么容易变成 Massive View Controller？

- 难度：Easy
- ID：`ios-architecture-mvc-problem`
- 口述一句话：MVC 变胖是职责混在 VC，优化就是拆职责。

**参考答案：**

MVC 的问题不是模式本身，而是 iOS 里 ViewController 很容易同时承担 UI、网络、状态、跳转和业务逻辑，变成 Massive View Controller。解决思路是拆分职责：网络放 Service，状态转换放 ViewModel，跳转放 Coordinator，数据访问放 Repository。

---

## 架构 / MVVM

<a id="topic-29"></a>

### 92. MVVM 解决了什么问题？ViewModel 应该承担哪些职责？

- 难度：Medium
- ID：`ios-architecture-mvvm-purpose`
- 口述一句话：MVVM 让 VC 变薄，让状态转换更可测试。

**参考答案：**

MVVM 把页面展示状态和业务转换放到 ViewModel，View/VC 只负责展示和用户事件。它让业务逻辑脱离 UIKit，便于单元测试，也能减少 VC 代码。关键是 ViewModel 输入输出清晰，不直接操作具体 View。

---

### 93. ViewModel 应该做什么，不应该做什么？如何避免 ViewModel 变胖？

- 难度：Medium
- ID：`ios-architecture-viewmodel-boundary`
- 口述一句话：ViewModel 管状态转换，不管具体 UI 和导航。

**参考答案：**

ViewModel 应该处理展示状态、用户动作到业务调用的转换、错误和 loading 状态；不应该直接持有 UIKit 控件、做页面跳转或承担过多业务规则。变胖时可继续拆 UseCase、Service、Repository 或子 ViewModel。

---

## 架构 / Coordinator

<a id="topic-30"></a>

### 94. Coordinator 的作用是什么？它如何降低 ViewController 之间的跳转耦合？

- 难度：Medium
- ID：`ios-architecture-coordinator`
- 口述一句话：Coordinator 管导航流程，让页面不互相硬依赖。

**参考答案：**

Coordinator 负责页面创建、依赖组装和导航流程，把 push、present、deep link 从 ViewController 中抽离。这样 VC 不需要知道下一个页面是谁，模块之间更解耦，也方便复用登录流程、支付流程等复杂导航。

---

## 架构 / 依赖注入

<a id="topic-31"></a>

### 95. 依赖注入解决什么问题？构造器注入、属性注入、服务定位器有什么区别？

- 难度：Medium
- ID：`ios-architecture-dependency-injection`
- 口述一句话：依赖注入让依赖显式、可替换、可测试。

**参考答案：**

依赖注入是把对象需要的依赖从外部传入，而不是内部 new 或直接用单例。构造器注入最明确，属性注入更灵活但可能不完整，服务定位器使用方便但依赖隐藏。DI 的核心价值是可替换、可测试、低耦合。

---

## 架构 / 可测试性

<a id="topic-32"></a>

### 96. 如何设计一个可测试的网络层？Mock、Stub、Protocol 抽象如何使用？

- 难度：Hard
- ID：`ios-architecture-testable-network`
- 口述一句话：可测试网络层靠协议抽象和 Mock 注入。

**参考答案：**

可测试网络层要依赖协议而不是 URLSession 具体实现。业务层注入 NetworkClient 协议，测试时换成 Mock 返回固定数据或错误。还要把请求构建、解析、错误映射拆开测试，避免真实网络影响单元测试稳定性。

---

## 架构 / 模块化

<a id="topic-33"></a>

### 97. iOS 项目如何做模块化？模块之间依赖方向应该如何设计？

- 难度：Hard
- ID：`ios-architecture-modularization`
- 口述一句话：模块化重点是边界清楚、依赖单向、跨模块靠接口。

**参考答案：**

模块化要先划边界：基础能力、业务模块、公共接口和宿主 App。依赖方向通常是业务依赖基础，不允许业务互相乱依赖。跨模块调用可通过协议、路由或事件。目标是降低耦合、提升编译效率和团队协作效率。

---

### 98. 组件化和模块化有什么区别？它们分别解决什么工程问题？

- 难度：Medium
- ID：`ios-architecture-component-vs-module`
- 口述一句话：模块化控边界，组件化重复用。

**参考答案：**

模块化更强调按边界拆分代码和依赖，组件化更强调可复用、可独立交付的功能单元。实际项目里二者会结合：基础组件提供能力，业务模块组合能力。核心都是控制依赖和提升复用。

---

### 99. 如何避免模块之间循环依赖？路由、协议下沉、依赖倒置可以怎么用？

- 难度：Hard
- ID：`ios-architecture-circular-dependency`
- 口述一句话：破循环依赖靠协议下沉、依赖倒置和路由解耦。

**参考答案：**

避免循环依赖的办法是依赖倒置和接口下沉。把双方都需要的协议放到更底层接口模块，具体实现由上层注入；页面跳转用路由或 Coordinator；共享数据用服务接口或事件，而不是模块互相 import。

---

## 工程化 / 配置

<a id="topic-34"></a>

### 100. iOS 项目如何做 Dev、Staging、Production 多环境配置？

- 难度：Medium
- ID：`ios-architecture-multi-env`
- 口述一句话：多环境靠 Scheme 和配置文件，业务只读统一配置。

**参考答案：**

多环境通常用 Scheme、Build Configuration、xcconfig 和 Info.plist 区分域名、证书、开关、日志级别。环境配置应集中管理，业务代码只读取配置对象，避免到处 if debug 或硬编码 URL。

---

## 工程化 / CI/CD

<a id="topic-35"></a>

### 101. iOS 项目的 CI/CD 通常包含哪些步骤？证书、打包、测试、分发如何处理？

- 难度：Hard
- ID：`ios-architecture-cicd`
- 口述一句话：CI/CD 是把检查、测试、签名、打包、分发自动化。

**参考答案：**

iOS CI/CD 通常包括拉代码、安装依赖、lint、跑测试、管理证书和 provisioning profile、archive、export ipa、上传 TestFlight 或内部分发。关键是构建可重复、证书安全、失败可追踪、产物可回溯。

---

## 工程化 / 测试

<a id="topic-36"></a>

### 102. 单元测试应该测什么？哪些逻辑不适合直接放在 UI 层里测试？

- 难度：Medium
- ID：`ios-architecture-unit-test-scope`
- 口述一句话：单测测逻辑和边界，业务别绑死 UI。

**参考答案：**

单元测试应该覆盖纯逻辑、状态转换、边界条件、错误处理和历史 bug。UI 细节不适合大量单测，应该把业务逻辑放到 ViewModel、UseCase、Service 等层，通过 Mock 依赖验证输入输出。

---

## 性能 / 启动优化

<a id="topic-37"></a>

### 103. App 启动分为哪些阶段？冷启动和热启动有什么区别？

- 难度：Medium
- ID：`ios-performance-launch-stages`
- 口述一句话：启动按 main 前、main 后和首屏链路拆。

**参考答案：**

启动可分为冷启动和热启动，也可按 main 前和 main 后拆。main 前包括 dyld 加载、符号绑定、Runtime 初始化；main 后包括 UIApplicationMain、App/Scene 初始化、根页面加载、首屏渲染。优化要看首屏可见时间。

---

### 104. 启动优化可以从哪些方向做？如何区分 main 前和 main 后耗时？

- 难度：Hard
- ID：`ios-performance-launch-optimization`
- 口述一句话：启动优化就是减少 main 前成本，把非首屏工作延后。

**参考答案：**

main 前优化包括减少动态库、减少 +load、减少类和符号数量；main 后优化包括延迟初始化、异步 IO、懒加载、减少首屏网络依赖和复杂布局。原则是先测量，再把非首屏必要工作后移。

---

### 105. 如何统计启动耗时？埋点、MetricKit、Instruments 各有什么作用？

- 难度：Medium
- ID：`ios-performance-launch-measure`
- 口述一句话：启动统计要先定义口径，再用埋点和工具验证。

**参考答案：**

启动耗时可以用埋点记录进程启动、main、首屏展示等节点，也可以用 Instruments 和 MetricKit 看系统统计。关键是统一口径，比如冷启动到首帧或首屏可交互，并做多次采样取稳定数据。

---

### 106. iOS 启动优化应该怎么做？冷启动、main 前、main 后分别要关注什么？

- 难度：Hard
- ID：`ios-launch-optimization-detailed`
- 口述一句话：启动优化按冷启动拆 main 前和 main 后：main 前减动态库、+load 和静态初始化，main 后延迟 SDK、后台化重活、轻量首屏，并用 Instruments/MetricKit/埋点衡量。

**参考答案：**

iOS 启动优化本质是在优化用户点击 App 图标后，到首页可见、可操作之间的时间。面试里可以先说：启动优化的核心是减少启动阶段主线程工作、减少动态库和类加载成本、延迟非必要初始化，让首屏尽快可见可操作。

首先要区分冷启动和热启动。冷启动是 App 进程不存在，用户点击图标后系统重新创建进程；热启动是 App 已经在后台，用户重新切回前台。启动优化重点通常是冷启动，因为冷启动需要创建进程、加载可执行文件、加载动态库、Runtime 初始化、执行 main、创建 UI 和渲染首屏。

启动阶段可以粗略拆成 main 前和 main 后。

main 前主要是系统和运行时做的事，包括加载 Mach-O、加载动态库、dyld 链接、地址重定位 rebase、符号绑定 bind、Objective-C 类和分类注册、执行 +load、C/C++ 静态初始化、Swift 全局初始化等。这里常见问题是动态库太多、类和方法数量太多、+load 太多、静态初始化太重、全局变量初始化做了文件读取或复杂计算。优化方向是减少动态库数量、减少无用三方库、避免在 +load 里做重活、减少复杂全局初始化，能静态化的依赖不要滥用动态库。

main 后主要是业务代码阶段，包括 UIApplicationMain、AppDelegate、SceneDelegate、window/rootViewController 创建、SDK 初始化、本地配置读取、数据库初始化、首屏 ViewController 加载、首页布局、首屏数据请求和首帧渲染。这里是业务侧最容易优化的部分，原则是启动阶段只做首屏必须的事，其他工作延迟、异步、按需。

常见启动耗时点包括：AppDelegate 里初始化太多 SDK；启动时同步读大文件；启动时同步查数据库；启动时做大量 JSON 解析；启动时等待多个网络接口；首页 ViewController 的 viewDidLoad 做太多事；首页布局太复杂；图片太大或过早解码；动态库过多；+load 或 Swift 全局变量里做重操作。

优化策略可以从几个方向说：

1. 延迟初始化：不是首屏必须的功能不要放在启动阶段。比如支付 SDK 可以进入支付页再初始化，地图 SDK 可以进入地图页再初始化，分享 SDK 可以点击分享时再初始化，广告、IM、推送、埋点也可以根据业务优先级延后。

2. SDK 分级初始化：启动时只初始化崩溃收集、基础日志、环境配置、必要的配置中心等关键能力；埋点、推送、IM、广告、分享、支付、地图等可以在首屏出现后或真正使用时再初始化。

3. 减少主线程阻塞：启动阶段主线程要负责 UI 创建和渲染，文件读取、数据库查询、JSON 解析、图片解码、复杂计算等耗时任务不要同步卡住主线程。可以放到后台任务中处理，完成后再回主线程更新 UI。

4. 首页轻量化：首屏不要一次性加载所有模块。可以先显示页面框架或缓存数据，再异步请求网络；列表分页加载；图片懒加载；复杂模块按需创建；不要在首页 viewDidLoad 里塞大量业务初始化。

5. 减少 main 前成本：控制动态库数量，清理无用依赖，减少类和符号数量，避免 +load 做网络、数据库、文件读写等重操作，避免 Swift 全局变量在启动时隐式执行复杂初始化。

6. 首屏数据策略：如果首页依赖网络，可以考虑先展示骨架屏、缓存数据或默认状态，网络回来后再刷新。不要为了等多个接口全部完成才展示首页，否则用户会明显感到启动慢。

启动优化必须先测量再优化。常见衡量方式包括 Xcode Organizer 的启动指标、Instruments 的 App Launch、os_signpost、MetricKit、自定义埋点。自定义埋点可以记录进程启动、main、didFinishLaunching、SceneDelegate 创建根页面、首屏 viewDidLoad、viewDidAppear、首屏数据完成、用户可操作等节点。口径要统一，比如冷启动到首帧、冷启动到首屏可见、冷启动到首屏可交互。

可以用一个回答模板收口：我会先区分冷启动和热启动，重点看冷启动；再按 main 前和 main 后拆。main 前关注 dyld、动态库、Runtime、+load 和静态初始化；main 后关注 AppDelegate/SceneDelegate、SDK 初始化、首页创建、首屏数据和首帧渲染。优化上减少动态库和 +load 重活，启动只做必要初始化，非核心 SDK 延迟或按需初始化，文件/数据库/JSON 等耗时任务后台化，首页轻量化并优先展示可见内容，最后用 Instruments、MetricKit、os_signpost 和埋点持续衡量。

面试收口：iOS 启动优化 = main 前减少加载成本，main 后减少启动路径上的业务耗时，让首屏尽快可见可操作；核心原则是启动阶段只做必须做的事，其他都延迟、异步、按需。

---

## 性能 / 卡顿优化

<a id="topic-38"></a>

### 107. 如何监控卡顿？RunLoop 监控、FPS、主线程堆栈采样分别有什么思路？

- 难度：Hard
- ID：`ios-performance-lag-monitor`
- 口述一句话：卡顿监控看 FPS、RunLoop 状态和主线程堆栈。

**参考答案：**

卡顿监控常见三种：FPS 监控看帧率，RunLoop 监控看主线程是否长时间停在某状态，主线程堆栈采样记录卡顿时调用栈。线上监控要控制开销，并结合阈值、场景和设备信息分析。

---

## 性能 / 列表优化

<a id="topic-39"></a>

### 108. 列表滚动卡顿怎么排查？布局、图片解码、主线程任务、离屏渲染如何分析？

- 难度：Hard
- ID：`ios-performance-list-lag-debug`
- 口述一句话：列表卡顿从主线程耗时、图片、布局和渲染查。

**参考答案：**

列表卡顿先用 Time Profiler 看主线程耗时，再查布局、图片解码、同步 IO、锁等待、复杂绘制和离屏渲染。解决方式包括缓存高度、预计算、异步解码、取消无效请求、减少透明混合和圆角阴影开销。

---

### 109. iOS 列表滚动优化怎么做？UITableView/UICollectionView 可能遇到哪些问题？

- 难度：Hard
- ID：`ios-list-scrolling-optimization-detailed`
- 口述一句话：列表优化核心是让 Cell 足够轻：复用正确、图片异步可取消、高度稳定、少 reloadData、布局渲染简单，并用 Time Profiler/Core Animation 验证。

**参考答案：**

iOS 列表滚动优化主要针对 UITableView 和 UICollectionView。核心目标是让滑动时每一帧都足够轻，不能让主线程、图片解码、布局计算和渲染管线被 Cell 拖慢。简单列表可能很少出问题，但图文混排、动态高度、大量图片、复杂 Cell、频繁刷新和数据量大的列表很容易出现滚动问题。

常见问题可以这样分类：

1. 滑动掉帧：表现是快速滑动时一卡一卡、手势不跟手、图片加载时突然卡一下。常见原因是 cellForRow/cellForItem 里做复杂计算、同步文件读取、主线程图片解码、复杂 Auto Layout、频繁计算动态高度。

2. 图片错乱：表现是 A 用户头像显示到 B 用户 Cell 上，滑动快时旧图片闪一下。原因是 Cell 复用后，旧图片请求回来又设置到了新 Cell 上。解决方式是复用时取消旧请求，设置 placeholder，图片回来时校验 URL，或者使用 SDWebImage、Kingfisher 这类成熟图片库。

3. 复用状态残留：表现是按钮选中状态、进度条、开关、Label、图片还保留上一个 model 的状态。解决方式是在 prepareForReuse 清理旧状态，并在 configure(model:) 里完整设置所有 UI 状态。

```swift
override func prepareForReuse() {
    super.prepareForReuse()
    avatarImageView.image = UIImage(named: "avatar_placeholder")
    titleLabel.text = nil
    progressView.progress = 0
}
```

4. Cell 高度跳动：表现是滑动时高度突然变化、内容展开收起时列表抖动、滚动条位置跳。常见原因是 estimatedRowHeight 不准确、动态高度计算不稳定、图片异步回来后改变高度、约束不完整。解决方式是给合理 estimated height，必要时缓存高度，图片区域预留固定尺寸或固定比例，约束写完整。

5. 首次进入列表慢：表现是进入页面白屏、首次 reloadData 卡一下。常见原因是一次性解析大量数据、一次性创建复杂 Cell、同步加载本地资源、首屏等待太多网络数据。解决方式是分页加载、后台解析、先展示缓存或骨架屏、首屏优先、分批插入。

6. 内存上涨：表现是滑动一会儿内存越来越高，加载很多图片后内存升高。常见原因是图片太大、缓存无限增长、Cell 持有大对象、闭包强引用 VC、预加载过度。解决方式是使用缩略图、限制缓存大小、复用时清理状态、弱引用 self、控制预加载数量。

7. 频繁 reloadData：表现是数据一变化就整表刷新，滑动时突然卡一下，动画不自然。优化方式是优先局部刷新、insert/delete/reload rows、performBatchUpdates、Diffable Data Source 或差量更新。

8. Auto Layout 太复杂：表现是 Cell 内容复杂时滑动不顺。优化方式是减少 view 层级、减少约束数量、避免 StackView 深层嵌套、缓存高度，极复杂高频列表可以考虑手动布局。

9. 渲染压力大：圆角、阴影、mask、透明混合、模糊效果都可能增加渲染成本。阴影可以设置 shadowPath，圆角和阴影尽量避免同时依赖 masksToBounds，复杂背景可以预渲染。

10. 数据源更新和 UI 不一致：表现是 Invalid update 崩溃、插入删除动画异常。原因通常是 dataSource 数量和 UI 更新不匹配，或者多线程改数据源。解决方式是先更新数据源，再更新 UI，UI 操作放主线程，复杂 diff 用 Diffable Data Source。

列表优化的常用做法：

第一，Cell 复用要正确。register/dequeue 只是基础，关键是 prepareForReuse 清旧状态，configure(model:) 完整设置新状态，不要依赖上一次 Cell 的状态。

第二，cellForRow/cellForItem 不做重活。不要在里面做网络请求、同步读文件、图片解码、复杂文本计算、大量 DateFormatter 创建或复杂高度计算。这些应提前算、缓存或异步处理。

第三，图片异步加载并能取消。复用时取消旧请求、设置 placeholder，避免旧请求回调污染新 Cell。SDWebImage、Kingfisher 这类库通常已经处理了缓存、取消和异步解码等问题。

```swift
override func prepareForReuse() {
    super.prepareForReuse()
    avatarImageView.sd_cancelCurrentImageLoad()
    avatarImageView.image = UIImage(named: "avatar_placeholder")
}
```

第四，高度要稳定。动态高度可以用 automaticDimension，但 estimatedRowHeight 要尽量合理；高度计算复杂时可以缓存；图片区域不要等图片回来后才撑开，最好预留固定高度或固定比例。

第五，减少全量刷新。不要动不动 reloadData，优先局部刷新、批量更新或 diff。全量刷新会导致更多 Cell 重新配置、重新布局和可能的滚动位置跳动。

第六，合理使用预加载。UITableViewDataSourcePrefetching 和 UICollectionViewDataSourcePrefetching 可以提前加载下一屏数据或图片，但要实现 cancelPrefetching，避免浪费网络和内存。

第七，控制布局和渲染成本。减少层级、减少透明重叠、避免复杂圆角阴影和模糊效果，必要时设置 shadowPath 或预渲染。

排查工具：Time Profiler 看主线程耗时和 cell 配置成本；Core Animation 看 FPS、掉帧和渲染压力；View Debugger 看 Cell 层级是否过深、约束是否复杂；Allocations 看滑动时对象是否大量创建；Memory Graph 看 Cell/VC 是否泄漏；卡住时可以暂停并用 LLDB thread backtrace all 看主线程栈。

面试收口：列表滚动优化 = Cell 轻量 + 复用正确 + 图片异步可取消 + 高度稳定 + 局部刷新 + 布局渲染简单。真实项目中最容易遇到的是滑动掉帧、图片错乱、复用状态残留、动态高度跳动、内存上涨、频繁 reloadData 和数据源更新不一致。

---

## 性能 / 图片优化

<a id="topic-40"></a>

### 110. 图片加载为什么会卡？图片解码应该放在哪个线程？

- 难度：Medium
- ID：`ios-performance-image-decode`
- 口述一句话：图片卡顿常因主线程解码，解决是后台解码和按需缩放。

**参考答案：**

图片从压缩格式变成位图需要解码，若在主线程首次显示时解码，会造成卡顿。优化是按展示尺寸缩放，在后台提前解码，使用合适缓存策略，并避免加载远大于显示尺寸的大图。

---

### 111. iOS 图片解码与缓存怎么理解？使用 SDWebImage 时要注意哪些问题？

- 难度：Hard
- ID：`ios-image-decoding-cache-sdwebimage-detailed`
- 口述一句话：图片优化关注尺寸、下载、解码、缓存和复用取消；SDWebImage 负责异步下载、内存/磁盘缓存、后台解码和设置图片，但仍要注意大图、URL 版本、placeholder 和缓存策略。

**参考答案：**

iOS 图片解码与缓存主要解决两个问题：第一，避免网络图片重复下载；第二，避免大图解码和显示过程阻塞主线程，导致列表滑动卡顿或内存暴涨。实际项目里常用 SDWebImage、Kingfisher 等图片库，其中 SDWebImage 很常见。

图片文件本身通常是 JPG、PNG、WebP 这类压缩格式，屏幕不能直接显示压缩数据，需要先解码成 Bitmap 像素数据。这个过程就是图片解码。解码后的内存占用大约是 宽 * 高 * 4 bytes，所以一张 3000 * 3000 的图片解码后可能接近 36MB。列表里如果加载原图，很容易造成内存上涨和掉帧。

SDWebImage 的典型用法是：

```swift
imageView.sd_setImage(
    with: URL(string: user.avatarURL),
    placeholderImage: UIImage(named: "avatar_placeholder")
)
```

它背后通常会做这些事：先查内存缓存，没有再查磁盘缓存，没有再发起网络下载；下载完成后进行图片解码和处理；把图片缓存到内存和磁盘；最后回到主线程设置到 UIImageView。对于列表复用场景，还可以取消旧图片请求，减少旧请求回调污染新 Cell。

图片缓存一般分两层：内存缓存和磁盘缓存。内存缓存速度快，适合当前页面、列表来回滑动时复用，但 App 退出或内存警告时可能被清理。磁盘缓存速度慢一些，但可以持久保存，减少下次启动或下次进入页面时的重复下载。

常见问题和解决方式：

1. 图片太大导致内存上涨：头像只显示 40x40，但服务端返回 3000x3000，这会浪费下载、解码和内存。解决方式是让服务端返回合适尺寸或缩略图 URL；客户端做 downsample/thumbnail；列表不要加载原图；限制内存和磁盘缓存大小。

2. 主线程解码导致卡顿：大图如果第一次显示时才在主线程解码，列表滑动会卡。解决方式是使用图片库的后台解码能力，或在后台队列提前解码/缩放，主线程只做设置 image。

3. URL 不变但图片内容变了：比如用户换头像但 URL 还是同一个，SDWebImage 会继续命中旧缓存。解决方式可以主动删除缓存，或者更推荐后端在图片 URL 上加版本号、时间戳或 hash，比如 avatar.png?v=123 或 avatar.png?hash=xxx。

```swift
SDImageCache.shared.removeImage(
    forKey: imageURL.absoluteString,
    cacheType: .all,
    completion: nil
)
```

4. Cell 复用导致图片错乱：旧 Cell 的图片请求还没回来，Cell 已经被复用成新数据，旧请求回来后可能设置错图。解决方式是 prepareForReuse 里取消旧请求并设置 placeholder；图片回来时也可以校验 URL 是否仍然匹配当前 model。

```swift
override func prepareForReuse() {
    super.prepareForReuse()
    avatarImageView.sd_cancelCurrentImageLoad()
    avatarImageView.image = UIImage(named: "avatar_placeholder")
}
```

5. 缓存无限增长：如果磁盘缓存和内存缓存不设置策略，图片会越来越多。可以配置最大磁盘大小、过期时间和内存成本。

```swift
SDImageCache.shared.config.maxDiskSize = 500 * 1024 * 1024
SDImageCache.shared.config.maxDiskAge = 7 * 24 * 60 * 60
SDImageCache.shared.config.maxMemoryCost = 100 * 1024 * 1024
```

6. placeholder 没设置导致体验差：Cell 复用时如果没有 placeholder，可能短暂显示旧图或空白。placeholder 可以让加载前状态稳定，也能减少旧图闪现。

7. 缓存 key 设计问题：默认通常用 URL 作为 key。如果不同尺寸共用同一个 URL，可能出现缓存图尺寸不符合预期。实际项目里可以让服务端提供不同尺寸 URL，或按尺寸、裁剪参数生成不同缓存 key。

8. GIF/WebP/动图问题：动图比普通静态图更耗内存和 CPU，需要控制尺寸、帧数和播放数量。列表里大量动图要谨慎，必要时只在可见 Cell 播放。

SDWebImage 适合网络图片、头像、商品图、Feed 流、聊天图片等需要下载和缓存的场景。如果只是 App 包里的固定图片，直接 UIImage(named:) 就可以，不需要走 SDWebImage。

面试回答可以这样说：图片性能主要关注下载、缓存、解码、缩放和复用取消。图片文件是压缩格式，真正显示前要解码成 Bitmap，大图如果在主线程解码会造成卡顿。实际项目里我一般用 SDWebImage，它会处理内存缓存、磁盘缓存、异步下载、后台解码、回主线程设置图片，并支持取消请求和缓存策略。优化上，服务端返回合适尺寸，客户端避免列表加载原图；Cell 复用时取消旧请求并设置 placeholder；URL 不变但内容变化时清缓存或让后端加版本号/hash；缓存要设置大小和过期时间；大图用 downsample，避免解码后内存暴涨。

面试收口：图片优化 = 合适尺寸 + 异步下载 + 后台解码 + 内存/磁盘缓存 + 复用取消 + 缓存策略。SDWebImage 封装了这些能力，但仍要注意大图、缓存 key、URL 版本、placeholder 和缓存上限。

---

## 性能 / 内存优化

<a id="topic-41"></a>

### 112. 如何降低内存峰值？大图、大数组、缓存、临时对象分别如何处理？

- 难度：Hard
- ID：`ios-performance-memory-peak`
- 口述一句话：内存峰值优化靠缩小大对象、分批、限缓存和及时释放。

**参考答案：**

降低内存峰值要控制大对象生命周期：大图按需缩放，数组分批处理，缓存设置容量和清理策略，循环临时对象用 autoreleasepool，页面消失释放不必要资源。优化前后要用 Allocations 或内存曲线验证。

---

### 113. OOM 怎么排查？它和普通 crash 的定位方式有什么不同？

- 难度：Hard
- ID：`ios-performance-oom-debug`
- 口述一句话：OOM 没普通堆栈，要靠内存曲线、日志和场景还原。

**参考答案：**

OOM 是系统因内存压力杀掉进程，通常没有普通 crash 堆栈。排查要结合内存曲线、场景日志、MetricKit、Jetsam 日志、最近页面和大对象操作。重点看内存峰值、缓存失控、大图和循环增长。

---

## 性能 / 包体积

<a id="topic-42"></a>

### 114. App 包体积怎么优化？资源、架构切片、无用代码、Link Map 分析如何使用？

- 难度：Medium
- ID：`ios-performance-binary-size`
- 口述一句话：包体积看资源、依赖、架构切片和 Link Map。

**参考答案：**

包体积优化分资源和二进制。资源侧压缩图片、删除无用资源、按需下载；二进制侧移除无用代码和依赖、控制架构切片、减少重复库、用 Link Map 找大符号。优化要避免影响启动和功能完整性。

---

## 性能 / 网络优化

<a id="topic-43"></a>

### 115. 网络请求慢怎么排查？DNS、连接、TLS、服务端、弱网、缓存分别如何分析？

- 难度：Hard
- ID：`ios-performance-network-slow`
- 口述一句话：网络慢按 DNS、连接、TLS、服务端、传输和缓存拆。

**参考答案：**

网络慢要分段看：DNS、TCP 连接、TLS 握手、请求排队、服务端耗时、响应体大小、弱网丢包和缓存命中。优化方式包括连接复用、缓存、压缩、分页、超时重试、降级和接口合并。

---

## 性能 / Instruments

<a id="topic-44"></a>

### 116. Instruments 常用哪些工具？Time Profiler、Allocations、Leaks、Core Animation 分别看什么？

- 难度：Medium
- ID：`ios-instruments-common-tools`
- 口述一句话：Instruments 要带着场景和指标看前后对比。

**参考答案：**

Time Profiler 看 CPU 热点，Allocations 看对象分配和增长，Leaks 看内存泄漏，Core Animation 看 FPS 和渲染问题，Network 看请求，Energy Log 看耗电。使用时要有复现场景、指标和优化前后对比。

---

## Mach-O / dyld

<a id="topic-45"></a>

### 117. Mach-O 是什么？它大致由 Header、Load Commands、Segment、Section 哪些部分组成？

- 难度：Hard
- ID：`ios-mach-o-basics`
- 口述一句话：Mach-O 是 Apple 可执行文件格式，由 Header、Load Commands、Segment、Section 组成。

**参考答案：**

Mach-O 是 Apple 平台的可执行文件、动态库和目标文件格式。Header 描述文件类型和架构，Load Commands 告诉系统如何加载，Segment 是运行时内存映射区域，Section 是更细的数据或代码区，比如 __text、__data。

---

### 118. 静态库和动态库有什么区别？它们对包体积、启动速度、链接方式有什么影响？

- 难度：Hard
- ID：`ios-mach-o-static-dynamic-lib`
- 口述一句话：静态库编进包里，动态库运行时加载。

**参考答案：**

静态库在链接期被拷贝进最终二进制，运行时不需要单独加载；动态库在运行时由 dyld 加载和链接。静态库可能增大主包但启动少一次动态加载，动态库利于共享和模块边界，但数量过多会增加启动成本。

---

### 119. Framework 是什么？Static Framework 和 Dynamic Framework 有什么区别？

- 难度：Medium
- ID：`ios-mach-o-framework`
- 口述一句话：Framework 是打包形式，里面可以是静态也可以是动态。

**参考答案：**

Framework 是一种打包形式，可以包含二进制、头文件、资源和模块信息。Static Framework 内部是静态库，链接进主二进制；Dynamic Framework 是动态库，运行时加载。不要把 Framework 简单等同于动态库。

---

### 120. dyld 在 App 启动时做了什么？加载动态库、符号绑定、Runtime 初始化分别在哪个阶段？

- 难度：Hard
- ID：`ios-dyld-launch-flow`
- 口述一句话：dyld 负责加载动态库、重定位、符号绑定、初始化，然后进 main。

**参考答案：**

dyld 负责加载主程序和依赖动态库，完成地址重定位 rebase、符号绑定 bind，执行初始化函数，触发 Objective-C Runtime 注册类和分类，然后进入 main。动态库数量、符号数量和初始化工作都会影响 main 前启动时间。

---

### 121. Rebase 和 Bind 是什么？它们为什么会影响启动耗时？

- 难度：Hard
- ID：`ios-dyld-rebase-bind`
- 口述一句话：Rebase 修内部地址，Bind 绑定外部符号。

**参考答案：**

Rebase 是因为 ASLR 导致加载地址变化，需要修正内部指针地址；Bind 是把外部符号引用绑定到实际动态库地址。二者都发生在启动加载阶段，指针和符号越多，处理成本越高，可能影响启动。

---

### 122. 为什么动态库过多会影响启动？大型项目如何控制动态库数量？

- 难度：Hard
- ID：`ios-dyld-too-many-dylibs`
- 口述一句话：动态库多会增加 dyld 加载和绑定成本。

**参考答案：**

动态库越多，dyld 需要加载、校验、映射、绑定的工作越多，也会增加依赖关系复杂度。大型项目要控制动态库数量，能静态化的静态化，合并小库，减少无用依赖，并避免每个业务都拆成动态库。

---

## Mach-O / Runtime 初始化

<a id="topic-46"></a>

### 123. `+load` 和 `+initialize` 有什么区别？它们对启动性能有什么影响？

- 难度：Hard
- ID：`ios-objc-load-initialize`
- 口述一句话：+load 早于 main 且影响启动，+initialize 首次消息前懒执行。

**参考答案：**

+load 在类或分类被加载到 Runtime 时调用，早于 main，且每个类和分类都会调用，容易拖慢启动。+initialize 在类第一次收到消息前懒执行，只调用一次。启动优化中应尽量避免在 +load 做重活。

---

## Mach-O / 包体积

<a id="topic-47"></a>

### 124. Link Map 能看什么？如何用它分析二进制体积和大符号？

- 难度：Medium
- ID：`ios-linkmap-usage`
- 口述一句话：Link Map 用来看二进制里谁占空间。

**参考答案：**

Link Map 记录最终二进制里目标文件、段和符号的大小分布。通过它可以找出大库、大函数、重复依赖和异常增长的符号。它常用于包体积分析，也能辅助判断哪些模块对二进制体积贡献最大。

---

## 项目表达

<a id="topic-48"></a>

### 125. 请用 3 分钟介绍一个你最熟悉的 iOS 项目：背景、职责、技术栈、难点、结果。

- 难度：Medium
- ID：`ios-project-three-minute-intro`
- 口述一句话：三分钟项目介绍讲背景、职责、技术、难点和结果。

**参考答案：**

3 分钟项目介绍按五步讲：项目背景和用户价值、你的职责、技术栈和架构、一个代表性难点、解决结果和指标。不要流水账，也不要只说“我参与了”，要突出你负责、你决策、你验证的内容。

---

## 项目表达 / 架构

<a id="topic-49"></a>

### 126. 你负责的项目架构是如何设计的？模块划分、依赖方向、数据流分别是什么？

- 难度：Hard
- ID：`ios-project-architecture-design`
- 口述一句话：架构项目题讲边界、依赖、数据流、取舍和演进。

**参考答案：**

架构设计要讲业务边界、模块划分、依赖方向、数据流和扩展点。再解释为什么这样设计，解决了什么痛点，比如降低耦合、提升测试性、缩短编译或支持多人协作。最后说不足和后续演进。

---

## 项目表达 / Bug 定位

<a id="topic-50"></a>

### 127. 讲一个你定位过的复杂线上 Bug：现象、复现、定位过程、根因、修复和预防。

- 难度：Hard
- ID：`ios-project-hardest-bug`
- 口述一句话：Bug 案例要讲清现象、证据链、根因、修复和预防。

**参考答案：**

复杂 Bug 按证据链讲：现象是什么，如何稳定复现，怎么缩小范围，用了哪些工具，最终根因是什么，如何修复，如何防止复发。要体现排查方法，比如日志、堆栈、抓包、Instruments、灰度数据和测试。

---

## 项目表达 / 性能

<a id="topic-51"></a>

### 128. 讲一个你做过的性能优化案例：指标、工具、瓶颈、方案、优化结果。

- 难度：Hard
- ID：`ios-project-performance-case`
- 口述一句话：性能案例要有指标、工具、瓶颈、方案和前后对比。

**参考答案：**

性能案例必须有指标。说明优化前的耗时、FPS、内存或包体积，用什么工具定位到瓶颈，采用什么方案，优化后提升多少，以及有没有副作用。没有量化结果，面试官很难相信优化价值。

---

## 项目表达 / 网络层

<a id="topic-52"></a>

### 129. 你项目中的网络层是怎么设计的？鉴权、错误处理、重试、取消和测试如何支持？

- 难度：Hard
- ID：`ios-project-network-layer-case`
- 口述一句话：网络层亮点是统一、可测、可观测和可扩展。

**参考答案：**

网络层案例要讲统一请求模型、Endpoint 设计、鉴权刷新、错误映射、重试取消、日志监控和 Mock 测试。亮点不是“封装了 URLSession”，而是减少重复代码、统一错误处理、提升稳定性和可测试性。

---

## 项目表达 / 缓存

<a id="topic-53"></a>

### 130. 讲一个缓存设计案例：缓存对象、过期策略、一致性、内存和磁盘如何平衡？

- 难度：Hard
- ID：`ios-project-cache-case`
- 口述一句话：缓存案例讲对象、key、层级、过期、容量、一致性和效果。

**参考答案：**

缓存案例按缓存对象、key 设计、内存/磁盘层级、过期策略、容量控制、一致性和并发安全讲。最好补充效果，比如接口请求减少、首屏更快、弱网体验更好或内存峰值受控。

---

## 项目表达 / 重构

<a id="topic-54"></a>

### 131. 讲一个架构重构案例：为什么重构、怎么分阶段推进、如何验证没有引入回归？

- 难度：Hard
- ID：`ios-project-refactor-case`
- 口述一句话：重构案例讲痛点、目标、阶段、测试和收益。

**参考答案：**

重构案例要先说痛点，如 VC 过胖、依赖混乱、难测试；再说目标和分阶段方案；然后讲兼容旧逻辑、测试保障、灰度发布和结果。好的重构是在不中断业务交付的前提下逐步降低风险。

---

## 项目表达 / 技术取舍

<a id="topic-55"></a>

### 132. 讲一次技术选型或方案取舍：候选方案、约束条件、最终选择和代价是什么？

- 难度：Hard
- ID：`ios-project-tradeoff`
- 口述一句话：取舍题讲约束、备选、选择理由、代价和补救。

**参考答案：**

技术取舍题要先列约束：时间、人力、性能、稳定性、团队熟悉度和长期维护。再比较候选方案，说明为什么选当前方案，以及它的缺点和补救措施。高级回答不是“这个最好”，而是“在约束下最合适”。

---

## 项目表达 / 扩展性

<a id="topic-56"></a>

### 133. 如果你的项目用户量或数据量扩大 10 倍，当前架构有哪些风险？你会怎么改？

- 难度：Hard
- ID：`ios-project-scale-ten-times`
- 口述一句话：扩展性看数据、流量、缓存、监控、降级和模块边界。

**参考答案：**

用户量或数据量扩大 10 倍时，要从接口压力、缓存、分页、数据库、内存、启动、日志监控和模块协作看风险。改进可以是分页懒加载、缓存分层、异步化、降级、监控告警、模块边界和服务端配合。

---

## 算法 / 哈希表

<a id="topic-57"></a>

### 134. 两数之和如何实现？为什么哈希表可以把时间复杂度降到 O(n)？

- 难度：Easy
- ID：`ios-algo-two-sum`
- 口述一句话：两数之和用哈希表保存补数，时间 O(n)。

**参考答案：**

遍历数组，用哈希表保存已经见过的值和下标。对当前值 x，检查 target - x 是否在表里；如果在就返回两个下标，不在就把 x 放入表。时间复杂度 O(n)，空间复杂度 O(n)。

---

## 算法 / 链表

<a id="topic-58"></a>

### 135. 如何反转单链表？迭代和递归写法分别如何理解？

- 难度：Easy
- ID：`ios-algo-reverse-linked-list`
- 口述一句话：反转链表记住 prev、cur、next 三指针。

**参考答案：**

迭代写法用 prev、cur、next 三个指针。每轮先保存 next，再把 cur.next 指向 prev，然后 prev 和 cur 向前移动。最后 prev 就是新头结点。时间 O(n)，空间 O(1)。

---

### 136. 如何合并两个有序链表？时间复杂度和空间复杂度是多少？

- 难度：Easy
- ID：`ios-algo-merge-two-lists`
- 口述一句话：合并有序链表用 dummy 节点减少边界判断。

**参考答案：**

用 dummy 虚拟头结点和 tail 指针。比较两个链表当前节点，把较小的接到 tail 后面并前进，直到一边为空，再把剩余链表接上。时间 O(m+n)，额外空间 O(1)。

---

## 算法 / 栈

<a id="topic-59"></a>

### 137. 有效括号如何判断？为什么栈适合解决这个问题？

- 难度：Easy
- ID：`ios-algo-valid-parentheses`
- 口述一句话：括号匹配就是右括号必须匹配当前栈顶。

**参考答案：**

遍历字符串，遇到左括号入栈，遇到右括号检查栈顶是否是匹配的左括号；不匹配直接失败。遍历结束后栈为空才合法。时间 O(n)，空间 O(n)。

---

## 算法 / 滑动窗口

<a id="topic-60"></a>

### 138. 最长无重复子串如何用滑动窗口解决？窗口左右边界如何移动？

- 难度：Medium
- ID：`ios-algo-longest-substring`
- 口述一句话：最长无重复子串是右边扩、重复时左边跳。

**参考答案：**

用滑动窗口维护无重复区间。右指针遍历字符，用字典记录字符最近位置；如果字符已在窗口内出现，就把左指针移动到上次位置后一位。每步更新最大长度，时间 O(n)。

---

## 算法 / 二叉树

<a id="topic-61"></a>

### 139. 二叉树层序遍历如何实现？为什么队列适合 BFS？

- 难度：Medium
- ID：`ios-algo-binary-tree-level-order`
- 口述一句话：层序遍历就是队列 BFS，一次处理一层。

**参考答案：**

层序遍历用队列。先把根节点入队，每轮记录当前队列数量作为这一层大小，依次弹出节点并加入左右孩子。每轮收集一个数组，最终得到按层结果。时间 O(n)。

---

### 140. 二叉树最大深度如何计算？递归和迭代分别怎么写？

- 难度：Easy
- ID：`ios-algo-binary-tree-max-depth`
- 口述一句话：最大深度 = 左右子树最大深度 + 1。

**参考答案：**

递归写法：空节点深度为 0，非空节点深度等于 max(左深度, 右深度) + 1。也可以用 BFS 层序遍历，每处理完一层深度加一。时间 O(n)，递归空间取决于树高。

---

## 算法 / 二分查找

<a id="topic-62"></a>

### 141. 二分查找如何避免死循环和边界错误？左闭右闭、左闭右开写法有什么区别？

- 难度：Medium
- ID：`ios-algo-binary-search`
- 口述一句话：二分查找最重要的是区间定义始终一致。

**参考答案：**

二分查找关键是区间定义一致。左闭右闭用 while left <= right，目标小于 mid 时 right = mid - 1；左闭右开用 while left < right，right = mid。mid 用 left + (right-left)/2 避免溢出。

---

## 算法 / 排序

<a id="topic-63"></a>

### 142. 快速排序的核心思想是什么？平均和最坏时间复杂度分别是多少？

- 难度：Medium
- ID：`ios-algo-quick-sort`
- 口述一句话：快排核心是分区，性能关键是 pivot 选择。

**参考答案：**

快速排序选一个 pivot，把数组分成小于 pivot 和大于 pivot 的两部分，再递归排序左右区间。平均时间 O(n log n)，最坏 O(n^2)，空间通常 O(log n)。随机 pivot 或三数取中可以降低退化概率。

---

## 算法 / 缓存

<a id="topic-64"></a>

### 143. LRU Cache 如何设计？为什么通常用哈希表加双向链表？

- 难度：Hard
- ID：`ios-algo-lru-cache`
- 口述一句话：LRU = 哈希表快速查找 + 双向链表维护新旧顺序。

**参考答案：**

LRU 要 O(1) get 和 put，通常用哈希表加双向链表。哈希表按 key 找节点，双向链表维护最近使用顺序；访问或更新节点移到头部，容量超限淘汰尾部节点。

---

## 工程化 / 线上质量

<a id="topic-65"></a>

### 144. iOS 项目中的日志系统是做什么的？实际项目中应该如何设计？

- 难度：Medium
- ID：`ios-observability-logging-system`
- 口述一句话：日志系统记录 App 运行过程，重点是统一封装、分级、脱敏、控制日志量，并能辅助线上排查。

**参考答案：**

日志系统主要用来回答：App 运行过程中发生了什么。它记录的是过程信息，比如进入页面、点击按钮、接口请求开始、接口返回结果、缓存命中、状态变化、关键分支判断等。

可以先这样说：日志系统是 App 的运行记录，用来复盘问题发生前后的上下文。它不一定代表错误，更多是帮助开发者理解线上行为。

常见日志等级包括 debug、info、warning、error。debug 适合开发调试，Release 环境通常关闭或降采样；info 记录正常关键流程；warning 表示可疑但不影响主流程的问题；error 表示明确失败但 App 没有崩溃。

实际项目中，日志系统一般要做几件事：第一，统一封装 Logger，不要到处直接 print；第二，日志要带时间、等级、模块、文件、行号、线程、用户状态、页面信息；第三，敏感信息要脱敏，比如 token、手机号、身份证号、支付信息不能明文输出；第四，线上日志量要控制，避免影响性能和磁盘；第五，重要日志可以写入本地文件，必要时由用户反馈或错误上报一起上传。

简单示例：

```swift
Logger.info("进入首页", module: "Home")
Logger.debug("请求用户信息 userId=123", module: "User")
Logger.error("登录失败 error=timeout", module: "Login")
```

常见实现方式：小项目可以自己封装 `os.Logger` 或 `print`；正式项目可以使用 CocoaLumberjack、SwiftyBeaver，也可以接入 Sentry、Datadog、Firebase 等平台的日志能力。iOS 系统层推荐了解 `os.Logger`，它比普通 print 更适合系统日志和性能分析。

注意点：日志不是越多越好。日志太少排查不了问题，日志太多会影响性能、磁盘和隐私合规。关键是记录关键路径和异常上下文。

面试收口：日志系统负责记录过程，帮助还原现场；设计重点是统一入口、分级、脱敏、按环境控制和必要时上传本地日志。

---

### 145. iOS 项目中的错误上报是什么？它和日志、崩溃收集有什么区别？

- 难度：Medium
- ID：`ios-observability-error-reporting`
- 口述一句话：错误上报记录非崩溃异常，比如接口失败、解析失败、数据库失败；关键是带上下文、去重限频和告警。

**参考答案：**

错误上报主要用来回答：App 没有崩溃，但业务哪里失败了。比如接口失败、JSON 解析失败、支付失败、图片上传失败、数据库写入失败、权限申请失败、状态机异常等，这些问题可能不会让 App 闪退，但会真实影响用户体验。

可以先这样说：错误上报记录的是非崩溃异常，重点是把业务失败和可恢复错误带着上下文传到后台。

常见需要上报的错误包括：网络请求失败、服务端业务码异常、关键接口超时、数据解析失败、CoreData/SQLite 写入失败、图片下载失败、登录态失效、支付流程异常、重要页面加载失败。

错误上报和日志的区别是：日志偏过程，错误上报偏结果和异常事件。日志可能有很多条，错误上报通常是筛选后的重要失败。错误上报和崩溃收集的区别是：错误上报发生时 App 还活着，崩溃收集发生在 App 闪退或卡死等严重问题上。

实际项目中，上报时最好带上下文：错误类型、错误信息、接口地址、业务 code、当前页面、用户 ID 或匿名 ID、App 版本、系统版本、设备型号、网络状态、环境 Dev/Staging/Production、Feature Flag 状态、最近关键操作。

简单示例：

```swift
do {
    let model = try JSONDecoder().decode(User.self, from: data)
} catch {
    Logger.error("用户信息解析失败: \(error)", module: "User")
    ErrorReporter.report(error, context: [
        "module": "User",
        "api": "/user/profile",
        "page": "ProfileViewController"
    ])
}
```

常用工具包括 Sentry、Firebase Crashlytics 的 non-fatal error、Bugly 的自定义错误上报、友盟+、阿里 ARMS、Datadog、New Relic。大厂或复杂业务也可能自建埋点和错误监控平台。

注意点：不是所有 error 都要上报。比如用户主动取消请求、弱网导致的普通失败，如果全部上报会产生噪音。要区分业务严重程度，设置采样、去重、限频和告警规则。敏感参数同样要脱敏。

面试收口：错误上报记录没崩但失败的问题，核心价值是发现业务异常；它要带上下文、能聚合统计、能告警，并且要控制噪音。

---

### 146. iOS 崩溃收集是做什么的？常用第三方工具有哪些？

- 难度：Medium
- ID：`ios-observability-crash-reporting`
- 口述一句话：崩溃收集负责采集闪退堆栈和影响范围，关键是集成 SDK、上传 dSYM、符号化和结合日志定位。

**参考答案：**

崩溃收集主要用来回答：App 为什么闪退、卡死或被系统杀掉。它关注的是比普通业务错误更严重的问题，比如数组越界、强制解包 nil、unrecognized selector、KVO/KVC 使用错误、多线程访问崩溃、内存问题、主线程卡死、OOM/Jetsam 等。

可以先这样说：崩溃收集负责自动采集线上 crash 堆栈、设备信息、版本信息和影响范围，帮助开发者定位闪退原因和优先级。

崩溃平台一般会收集：崩溃堆栈、崩溃线程、异常类型、信号类型、设备型号、iOS 版本、App 版本、构建号、发生时间、影响用户数、崩溃次数、最近日志、面包屑 breadcrumbs、自定义用户标识、自定义 key/value。

常用第三方工具包括：Firebase Crashlytics、Bugly、Sentry、友盟+、阿里 ARMS、Datadog、New Relic、Bugsnag、Instabug。国内项目常见 Bugly、友盟+、阿里 ARMS；海外或跨平台项目常见 Firebase Crashlytics、Sentry、Datadog、Bugsnag。

崩溃收集的关键流程一般是：集成 SDK；启动时初始化；Release 包上传 dSYM；平台收到崩溃后用 dSYM 符号化；开发者根据崩溃堆栈、版本、设备和最近行为定位问题。没有 dSYM 时，崩溃堆栈通常只有地址，定位价值会大幅下降。

简单示例：

```swift
// 示意：真实初始化代码以具体 SDK 文档为准
CrashReporter.start()
CrashReporter.setUserId(user.id)
CrashReporter.setCustomValue("Production", forKey: "environment")
CrashReporter.leaveBreadcrumb("进入订单详情页")
```

需要注意：普通 crash 有堆栈，但 OOM/Jetsam 往往没有普通崩溃堆栈，需要结合 MetricKit、内存曲线、系统 Jetsam 日志、业务日志和最近页面还原。主线程卡死也可能需要卡顿监控或 watchdog 监控。

崩溃收集和错误上报的区别是：崩溃收集主要处理 App 已经异常退出或严重不可用的问题；错误上报处理 App 仍然运行但业务失败的问题。成熟项目通常三者配合：日志还原过程，错误上报发现业务失败，崩溃收集定位闪退和卡死。

面试收口：崩溃收集的核心是自动采集 crash、符号化堆栈、统计影响范围并辅助定位；常用工具有 Firebase Crashlytics、Bugly、Sentry、友盟+、阿里 ARMS、Datadog、Bugsnag 等。

---

## 调试 / Xcode Debugger

<a id="topic-66"></a>

### 147. Xcode Debugger 中常见断点类型有哪些？Swift Error、Exception、Symbolic、Runtime Issue、Constraint Error、Test Failure 分别用来做什么？

- 难度：Medium
- ID：`ios-xcode-debugger-breakpoint-types`
- 口述一句话：Xcode 断点可以按问题类型来记：Exception 抓崩溃，Constraint 抓约束，Swift Error 抓 throw，Symbolic 抓函数，Runtime Issue 抓运行时问题，Test Failure 抓测试失败。

**参考答案：**

Xcode 的断点不只是普通行断点，还可以按错误类型、异常类型、函数符号、运行时问题、约束冲突和测试失败来自动暂停程序。面试或实际排查时，可以按“它们各自抓什么问题”来记。

1. Swift Error Breakpoint：用来抓 Swift 的 `throw`。当代码执行到 `throw` 时，Xcode 可能会暂停，适合排查为什么进入 `catch`、Codable 为什么解析失败、文件读写为什么失败、某个 `try` 到底在哪里抛错。注意它抓的是 Swift 错误，不一定是崩溃；很多业务错误本来就是正常流程，所以可能停得比较频繁。

2. Exception Breakpoint：用来抓 Objective-C / NSException 异常，也是日常开发最建议打开的断点之一。它常用于定位数组越界、KVC key 写错、unrecognized selector、NSInvalidArgumentException、NSRangeException 等问题。它的价值是让程序尽量停在真正抛异常的位置，而不是最后只停在 `main` 或 `UIApplicationMain`。

3. Symbolic Breakpoint：符号断点，不按具体代码行停，而是按函数名、方法名或符号名停。比如 Auto Layout 冲突常用 `UIViewAlertForUnsatisfiableConstraints`；Objective-C 异常抛出点可以用 `objc_exception_throw`；也可以监听 `-[UIViewController viewDidLoad]`、`-[UIView layoutSubviews]` 这类系统方法。它适合查某个系统函数什么时候被调用、谁触发了布局、谁抛出了异常。

4. Runtime Issue Breakpoint：用来抓 Xcode 运行时检测到的问题，通常和 Main Thread Checker、Thread Sanitizer、Address Sanitizer、Undefined Behavior Sanitizer 等工具配合。比如子线程更新 UI、数据竞争、内存访问异常、潜在未定义行为，都可能以 Runtime Issue 的形式出现。

5. Constraint Error Breakpoint：专门用来抓 Auto Layout 约束错误，比如控制台出现 `Unable to simultaneously satisfy constraints`。它和给 `UIViewAlertForUnsatisfiableConstraints` 加 Symbolic Breakpoint 的目标类似，但这是 Xcode 提供的更直接入口。适合排查约束冲突、约束优先级不合理、某个 view 宽高或位置约束互相打架。

6. Test Failure Breakpoint：用来抓 XCTest 测试失败。当 `XCTAssertEqual`、`XCTAssertTrue`、UI 测试断言或 Snapshot Testing 失败时，可以让 Xcode 停在失败位置，方便查看当时变量、页面状态和调用栈。

日常建议：默认可以打开 Exception Breakpoint 和 Constraint Error Breakpoint；调试 Codable、文件读写、Swift `throw` 时再打开 Swift Error Breakpoint；写单元测试、UI 测试、Snapshot Testing 时打开 Test Failure Breakpoint；遇到系统方法调用、Auto Layout 深层问题或异常抛出点时再用 Symbolic Breakpoint；遇到线程和内存运行时问题时再用 Runtime Issue Breakpoint。

面试收口：Exception 抓常见崩溃和 NSException，Constraint 抓 Auto Layout 冲突，Swift Error 抓 Swift throw，Symbolic 抓指定函数调用，Runtime Issue 抓运行时检查问题，Test Failure 抓测试断言失败。

---

### 148. Xcode View Debugger 是什么？适合排查哪些 UI 问题？

- 难度：Medium
- ID：`ios-xcode-view-debugger`
- 口述一句话：View Debugger 是 Xcode 的 UI 层级调试工具，用来看 view 层级、frame、约束和遮挡，常用于排查不显示、点不到和布局错乱。

**参考答案：**

View Debugger 是 Xcode 提供的 UI 层级调试工具。它可以在 App 运行时捕获当前页面的 View Hierarchy，把界面拆成可视化的层级结构，帮助开发者查看每个 view 的位置、大小、层级、约束、显示状态和遮挡关系。

可以先这样说：View Debugger 就是给当前页面做一次运行时 UI 拆解，用来确认 view 到底加在哪里、frame 是多少、谁盖住了谁、约束是否正确。

打开方式通常是：App 运行后点击 Xcode 调试栏里的 Debug View Hierarchy 按钮，或者通过菜单 Debug -> View Debugging -> Capture View Hierarchy。打开后 Xcode 会暂停当前界面，并展示一个可旋转、可展开的 UI 层级视图。

它常用于排查这些问题：

1. 控件不显示：检查 view 有没有加到父视图、frame 是否为 0、是否跑到屏幕外、isHidden 是否为 true、alpha 是否为 0、是否被其他 view 遮挡。

2. 点击无效：检查按钮上方是否盖了透明 view、按钮真实 frame 是否和看到的不一致、父 view 的 userInteractionEnabled 是否关闭、按钮是否超出父 view bounds。

3. 布局错乱：查看 Auto Layout 约束、safe area、StackView 布局、content hugging 和 compression resistance 等是否符合预期。

4. Cell 高度异常：查看 UITableViewCell / UICollectionViewCell 内部 contentView、label、imageView、button 的层级和约束，判断是哪个控件撑开或压缩了布局。

5. 层级复杂或遮挡问题：查看页面是否嵌套过深，是否有不该存在的遮罩 view、透明 view、全屏 view 盖在上面。

View Debugger 能看到的信息包括：UIView 层级、UIViewController 结构、frame、bounds、center、hidden、alpha、backgroundColor、约束关系、safe area、层级前后关系等。它和普通断点互补：断点看代码执行和变量，View Debugger 看最终 UI 结果。

一个常见排查顺序是：控件不显示时，先看是否存在于层级里；再看 frame/bounds 是否正常；再看 hidden/alpha；再看是否被遮挡；最后看约束和父视图裁剪。点击无效时，重点看遮挡、frame、父视图交互开关和超出父视图区域的问题。

注意：View Debugger 捕获的是某一刻的 UI 状态，不是实时编辑器；复杂页面打开可能较慢；它能帮你看到现象，但具体是哪段代码导致的，还要结合断点、LLDB、日志和约束代码继续定位。

面试收口：View Debugger 用来可视化查看当前 UI 层级、frame、约束和遮挡关系，最适合排查控件不显示、点击无效、布局错乱、Cell 高度异常和页面层级过深。

---

## 调试 / LLDB

<a id="topic-67"></a>

### 149. LLDB 常用命令有哪些？po、p、expr、bt、thread backtrace all、continue、next、step、finish 分别怎么用？

- 难度：Medium
- ID：`ios-lldb-common-commands`
- 口述一句话：LLDB 常用命令：po/p 看变量，expr 改状态或执行表达式，bt 看当前线程栈，thread backtrace all 看所有线程，continue/next/step/finish 控制执行。

**参考答案：**

LLDB 是 Xcode Debugger 背后的命令行调试器。程序停在断点、异常点或崩溃点时，可以在 Xcode 底部控制台输入 LLDB 命令，查看变量、修改状态、执行表达式、查看调用栈和控制程序继续运行。

常用命令可以这样记：

| 命令 | 常用简写/写法 | 作用 | 例子 |
|---|---|---|---|
| `po` | `po 对象` | print object，打印对象描述，Swift/Objective-C 对象最常用 | `po self`、`po user.name`、`po self.view` |
| `p` | `p 值` | print，打印基础值或表达式结果 | `p index`、`p count`、`p isLogin` |
| `expr` | `expr 表达式` | 在暂停时执行表达式，可以读值、改值、调用方法 | `expr isLogin = true`、`expr self.title = "Debug"` |
| `bt` | `bt` | backtrace，查看当前线程调用栈 | 崩溃或断点停住后输入 `bt` |
| `thread backtrace all` | `thread backtrace all` | 查看所有线程调用栈，适合排查卡死、死锁、主线程阻塞 | App 卡住时点暂停后输入 |
| `continue` | `continue` 或 `c` | 继续运行程序，直到下一个断点或结束 | `c` |
| `next` | `next` 或 `n` | 单步执行下一行，不进入函数内部 | 想跳过当前函数调用时用 |
| `step` | `step` 或 `s` | 单步进入函数内部 | 怀疑某个函数内部有问题时用 |
| `finish` | `finish` | 跳出当前函数，回到调用方 | 已经进入函数但不想继续看内部时用 |

`po` 和 `p` 的区别可以简单理解：`po` 更适合打印对象，会调用对象描述，输出更友好；`p` 更适合打印基础类型或表达式结果。Swift 调试里很多时候会优先试 `po`。

`expr` 很有用，因为它可以在不改代码、不重新编译的情况下临时改变运行状态。例如：

```lldb
expr self.view.backgroundColor = UIColor.red
expr isLogin = true
expr UserDefaults.standard.set(true, forKey: "isLogin")
expr self.reloadData()
```

调用栈相关命令重点记两个：`bt` 看当前线程；`thread backtrace all` 看所有线程。崩溃时先看当前崩溃线程调用栈，卡死时更应该看所有线程，尤其是主线程是否卡在锁、信号量、同步 I/O、数据库查询或大图处理上。

单步调试时可以这样选择：`next` 表示我不关心这个函数内部，执行下一行；`step` 表示我要进去看函数内部；`finish` 表示当前函数看够了，跳出去；`continue` 表示继续跑程序。

面试收口：LLDB 常用命令分四类：看变量用 `po/p`，改状态和执行代码用 `expr`，看调用栈用 `bt/thread backtrace all`，控制执行流程用 `continue/next/step/finish`。

---

## 性能 / 卡顿与渲染

<a id="topic-68"></a>

### 150. iOS 中如何避免卡帧和掉帧？FPS、主线程、列表、图片和渲染分别要注意什么？

- 难度：Hard
- ID：`ios-performance-avoid-frame-drops`
- 口述一句话：避免卡帧的核心是减少每帧主线程和渲染工作：重活后台化、列表轻量、图片缓存解码、布局简化、局部刷新、避免主线程等待，并用 Time Profiler/Core Animation 验证。

**参考答案：**

iOS 卡帧或掉帧，本质是某一帧没有在屏幕刷新时间内准备好。60Hz 设备一帧约 16.67ms，120Hz 设备一帧约 8.33ms。如果主线程布局、绘制、事件处理、数据处理或 GPU 渲染合成超过这个预算，用户就会感觉滑动卡、动画抖、页面切换不流畅。

可以先这样说：避免卡帧的核心是减少每一帧主线程和渲染管线的工作量，重活后台化，UI 更新轻量化，列表、图片、布局和图层效果重点优化，并用工具量化验证。

常见原因包括：主线程做大量计算、同步文件 IO、同步数据库查询、大 JSON 解析、复杂 Auto Layout、列表 Cell 太重、大图解码、频繁 reloadData、频繁 layoutIfNeeded、圆角阴影导致离屏渲染、透明视图过多导致混合成本高、主线程等待锁或信号量。

优化可以从这些方向做：

1. 主线程只做 UI 和轻量逻辑：计算、JSON 解析、文件读写、数据库查询、图片处理等不要放在主线程。后台处理完成后再回主线程更新 UI。

```swift
Task.detached {
    let models = try JSONDecoder().decode([User].self, from: data)

    await MainActor.run {
        self.models = models
        self.tableView.reloadData()
    }
}
```

2. 列表要轻：UITableView/UICollectionView 的 cellForRow 或 cellForItem 里不要做同步 IO、复杂计算、大图解码。要复用 Cell，异步加载图片，取消复用前的旧请求，缓存图片和布局结果，必要时预计算高度，避免每次滑动都重新算复杂布局。

3. 图片要小、要缓存、尽量后台解码：服务端最好返回合适尺寸的图片，列表不要加载原图。客户端可以使用缩略图、内存/磁盘缓存、后台解码和按需加载，避免大图在主线程解码造成瞬间卡顿。

4. 布局要简单：减少 view 层级和约束数量，避免 Cell 内嵌套过深；不要频繁调用 setNeedsLayout/layoutIfNeeded；复杂列表可以缓存高度或考虑手动布局；StackView 很方便，但在特别复杂和高频复用场景也要注意开销。

5. 减少无效 UI 刷新：不要动不动全量 reloadData。优先局部刷新、批量更新、Diffable Data Source 或差量更新；高频输入、滚动、搜索场景可以用防抖/节流；多次状态变化可以合并成一次 UI 刷新。

6. 控制渲染成本：避免大量透明视图重叠，减少 alpha 混合；谨慎使用圆角加阴影、mask、shouldRasterize、模糊效果等可能增加渲染成本的效果；圆角阴影可以用阴影路径 shadowPath、预渲染图片或拆分图层优化。

7. 避免主线程等待：不要在主线程等待网络、数据库、锁、信号量或异步任务结果。比如 DispatchSemaphore.wait、DispatchQueue.sync、锁竞争都可能让主线程卡住甚至死锁。

8. 分批和懒加载：首屏只加载当前可见内容，非首屏模块延迟加载；大量数据分页加载；复杂任务分批处理，避免一次性把所有工作压到同一帧。

排查工具也很重要：Time Profiler 看主线程 CPU 耗时函数；Core Animation 看 FPS、掉帧和渲染问题；Xcode Debug Navigator 看 CPU/内存粗略变化；View Debugger 看 UI 层级和遮挡；Instruments Allocations 看对象分配是否异常；卡住时可以暂停 App，用 LLDB 的 thread backtrace all 看主线程是否卡在 IO、锁、数据库、JSON 解析或布局里；线上可以用 MetricKit、RunLoop 卡顿监控、FPS 监控和主线程堆栈采样。

一个常见回答模板是：我会先确认卡顿场景，比如列表滑动、页面转场还是启动首屏；然后用 Time Profiler 和 Core Animation 找主线程或渲染瓶颈；优化上把重活后台化，减少 cell 内同步工作，图片缩放缓存和后台解码，减少约束和层级，局部刷新代替全量刷新，避免主线程等锁；最后用 FPS、耗时和线上卡顿率对比优化前后效果。

面试收口：避免卡帧就是守住每帧时间预算。主线程少做事，列表和图片重点优化，布局和渲染尽量简单，刷新要合并，锁和同步等待不能卡主线程，最终用 Instruments、MetricKit 和卡顿监控验证。

---

## 并发 / Timer

<a id="topic-69"></a>

### 151. iOS Timer 是什么？它和 RunLoop 有什么关系？使用时要注意哪些坑？

- 难度：Medium
- ID：`ios-timer-detailed-overview`
- 口述一句话：Timer 是依赖 RunLoop 的定时器；注意 default/common mode、触发精度、weak self 防循环引用，以及不需要时 invalidate。

**参考答案：**

Timer 是 Foundation 提供的定时器，以前 Objective-C 里常叫 NSTimer。它用于在未来某个时间点，或者每隔一段时间，触发一段代码。常见场景有验证码倒计时、轮播图自动切换、定时刷新状态、简单轮询、延迟执行等。

可以先这样说：Timer 是挂在 RunLoop 上的定时器，用来按时间触发任务；使用时重点注意 RunLoop Mode、精度、循环引用和 invalidate。

最常见的创建方式是 scheduledTimer：

```swift
Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { timer in
    print("每 1 秒执行一次")
}
```

这里 withTimeInterval 表示时间间隔，repeats 表示是否重复执行。repeats 为 false 时只触发一次；repeats 为 true 时会重复触发，直到调用 invalidate。

Timer 和 RunLoop 的关系非常关键。Timer 不是线程，它不会自己一直运行。Timer 必须被加入某个线程的 RunLoop，RunLoop 运行到对应 Mode 时，Timer 才会被触发。scheduledTimer 会自动把 Timer 加入当前线程 RunLoop 的 default mode。

```swift
let timer = Timer(timeInterval: 1, repeats: true) { _ in
    print("tick")
}
RunLoop.main.add(timer, forMode: .common)
```

如果你在子线程创建 Timer，但没有启动子线程 RunLoop，Timer 可能不会触发，因为子线程执行完就退出了。

```swift
Thread {
    Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
        print("子线程 Timer")
    }

    RunLoop.current.run()
}.start()
```

Timer 的一个经典问题是：滚动列表时 Timer 为什么暂停？原因通常是 Timer 默认加入 default mode，而 UIScrollView 滚动时主线程 RunLoop 会进入 tracking mode。RunLoop 当前在 tracking mode 时，不会处理 default mode 里的 Timer，所以 Timer 看起来停了。解决方式是把 Timer 加到 common modes。

```swift
let timer = Timer(timeInterval: 1, repeats: true) { _ in
    print("滚动时也继续触发")
}
RunLoop.main.add(timer, forMode: .common)
```

Timer 不是绝对精准的。它依赖 RunLoop 和系统调度，所以主线程繁忙、RunLoop mode 不匹配、系统调度延迟、App 进入后台等情况都会导致 Timer 延迟触发。Timer 适合普通倒计时和 UI 级别定时任务，不适合毫秒级严格计时。

Timer 另一个高频坑是循环引用。ViewController 强持有 Timer，Timer 的 closure 又强捕获 self，就会形成 ViewController -> Timer -> closure -> ViewController。target-selector 写法里，Timer 也会强持有 target，如果 target 是 ViewController，同样容易循环引用。

错误示例：

```swift
final class DemoViewController: UIViewController {
    private var timer: Timer?

    func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            self.updateUI()
        }
    }

    private func updateUI() {}
}
```

推荐写法：

```swift
timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
    self?.updateUI()
}
```

页面销毁或不需要 Timer 时，要调用 invalidate。invalidate 会让 Timer 从 RunLoop 中移除，并停止后续触发。只把 timer = nil 不一定够，因为 RunLoop 可能还持有 Timer。

```swift
timer?.invalidate()
timer = nil
```

target-selector 写法在老项目里常见：

```swift
timer = Timer.scheduledTimer(
    timeInterval: 1,
    target: self,
    selector: #selector(timerFire),
    userInfo: nil,
    repeats: true
)

@objc private func timerFire() {
    print("timer fire")
}
```

这种写法要特别注意 target 持有问题。如果 Timer 的 target 是 self，而 self 又持有 Timer，就容易出现循环引用。可以用 block + weak self，或者使用 weak proxy 转发。

Timer 常见使用场景包括：验证码倒计时、Banner 自动轮播、简单轮询、页面定时刷新、延迟执行、检测用户一段时间无操作等。使用时要根据场景选择合适工具。

几种定时方案的区别可以这样记：

1. Timer：依赖 RunLoop，适合 UI 相关、普通精度的定时任务。

2. DispatchSourceTimer：基于 GCD，适合后台队列定时任务，不受主 RunLoop Mode 影响。

3. CADisplayLink：跟屏幕刷新同步，适合逐帧动画、FPS 监控。

4. Task.sleep：Swift Concurrency 里的延迟等待，适合 async/await 流程中的延时、重试、超时控制。

```swift
Task {
    try? await Task.sleep(nanoseconds: 1_000_000_000)
    print("1 秒后继续异步流程")
}
```

实际开发建议：如果是页面上的倒计时或简单 UI 定时，Timer 可以用，但要 weak self、invalidate，并注意 common mode；如果是后台定时任务，可以考虑 DispatchSourceTimer；如果是动画每帧刷新，用 CADisplayLink；如果是 Swift 并发流程里的延迟，用 Task.sleep 更自然。

面试收口：Timer 是 Foundation 的定时器，依赖 RunLoop 触发。scheduledTimer 默认加入当前 RunLoop 的 default mode，所以滚动列表时可能因为 RunLoop 切到 tracking mode 而暂停，可以加入 common modes。Timer 不保证绝对精准，主线程忙、mode 不匹配和系统调度都会造成延迟。使用 Timer 要注意循环引用，block 里 weak self，不需要时调用 invalidate 从 RunLoop 移除。

---

## 内存 / ARC

<a id="topic-70"></a>

### 152. iOS 中常见的循环引用有哪些？分别应该如何避免和排查？

- 难度：Hard
- ID：`ios-retain-cycle-common-scenarios-detailed`
- 口述一句话：iOS 循环引用常见在闭包、Timer、delegate、通知、KVO、Combine、Task、CADisplayLink、Coordinator 和 Cell 回调；核心是找强引用闭环，用 weak、invalidate、remove、cancel 和 Memory Graph 处理。

**参考答案：**

iOS 中的循环引用，本质是两个或多个对象互相强持有，导致 ARC 的引用计数无法归零，对象不会执行 deinit。可以先这样说：只要 self 持有某个对象，而那个对象又长期保存一个会强捕获 self 的闭包，或者两个对象互相 strong，就要警惕循环引用。

最常见场景如下。

1. 闭包强持有 self。

如果 ViewController 持有一个闭包属性，闭包内部又直接使用 self，就会形成 VC -> closure -> VC。

```swift
final class DemoViewController: UIViewController {
    var callback: (() -> Void)?

    func setup() {
        callback = {
            self.reloadData()
        }
    }

    func reloadData() {}
}
```

解决方式是使用 weak self。

```swift
callback = { [weak self] in
    self?.reloadData()
}
```

注意：不是所有闭包都必须 weak self。关键看闭包是否被 self 间接或直接持有，或者闭包生命周期是否可能长于 self。短生命周期的一次性闭包不一定需要 weak。

2. Timer / NSTimer。

Timer 会被 RunLoop 持有，Timer 又会持有 target 或 closure。如果 VC 强持有 Timer，Timer 的 block 又强持有 VC，就会形成 VC -> Timer -> closure -> VC，同时 RunLoop -> Timer。

```swift
timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
    self.updateUI()
}
```

解决方式：block 中 weak self，并在页面退出或不需要时 invalidate。

```swift
timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
    self?.updateUI()
}

timer?.invalidate()
timer = nil
```

3. delegate 用 strong。

delegate 通常应该是 weak。如果 VC 持有 childView，childView 的 delegate 又强持有 VC，就会形成 VC -> childView -> delegate(VC)。

```swift
protocol ChildViewDelegate: AnyObject {}

final class ChildView: UIView {
    weak var delegate: ChildViewDelegate?
}
```

协议要继承 AnyObject，因为 weak 只能用于 class 类型。

4. NotificationCenter block observer。

block 方式添加通知观察者时，如果 self 持有 observer token，block 又强捕获 self，就可能形成 self -> observer token -> block -> self。

```swift
observer = NotificationCenter.default.addObserver(
    forName: .init("Demo"),
    object: nil,
    queue: .main
) { [weak self] notification in
    self?.handle(notification)
}
```

不需要时移除观察者。

```swift
if let observer {
    NotificationCenter.default.removeObserver(observer)
}
```

5. CADisplayLink。

CADisplayLink 和 Timer 很像，会被 RunLoop 持有，也会强持有 target。常见链路是 VC -> CADisplayLink -> target(VC)，RunLoop -> CADisplayLink。

```swift
displayLink = CADisplayLink(target: self, selector: #selector(tick))
displayLink?.add(to: .main, forMode: .common)
```

解决方式：不需要时 invalidate，或使用 weak proxy。

```swift
displayLink?.invalidate()
displayLink = nil
```

6. KVO。

Swift 的 KVO observation token 如果被 self 持有，而观察回调又强捕获 self，就可能形成 self -> observation -> closure -> self。

```swift
observation = object.observe(\.name, options: [.new]) { [weak self] object, change in
    self?.update()
}
```

不需要时可以 invalidate 或释放 token。

```swift
observation?.invalidate()
observation = nil
```

7. Combine。

Combine 很常见的循环引用链路是 self -> cancellables -> AnyCancellable -> sink closure -> self。

```swift
publisher
    .sink { [weak self] value in
        self?.handle(value)
    }
    .store(in: &cancellables)
```

只要订阅被 self 保存，sink/assign 的闭包里就要特别注意 self 捕获。页面销毁时 cancellables 会释放，订阅结束；必要时也可以手动 cancel 或 removeAll。

8. Task / async 闭包。

Task 也可能捕获 self，尤其是页面持有 task，而 task 里面又长期 await、轮询或循环。链路可能是 self -> task -> closure -> self。

```swift
task = Task { [weak self] in
    await self?.loadData()
}
```

页面销毁或任务不需要时取消。

```swift
task?.cancel()
```

短生命周期 Task 不一定必须 weak self，但页面级长期任务、轮询任务、监听任务要重点注意。

9. UIView 动画和 completion。

普通短动画一般问题不大，因为闭包很快执行完。但如果是循环动画、长动画、或者动画 completion 被长期保存，就要注意 self 捕获。可以根据生命周期使用 weak self。

```swift
UIView.animate(withDuration: 0.3) { [weak self] in
    self?.view.alpha = 0
} completion: { [weak self] _ in
    self?.finish()
}
```

10. 对象互相 strong。

两个普通对象互相强持有也会循环。比如 Teacher 持有 Student，Student 又持有 Teacher。

```swift
final class Teacher {
    var student: Student?
}

final class Student {
    weak var teacher: Teacher?
}
```

一般由拥有者强持有被拥有者，被拥有者反向引用拥有者时用 weak。

11. Coordinator。

Coordinator 模式里，父 Coordinator 通常强持有子 Coordinator；子 Coordinator 通过闭包通知父级完成。如果闭包强捕获父级，就可能形成 ParentCoordinator -> ChildCoordinator -> closure -> ParentCoordinator。

```swift
child.onFinish = { [weak self, weak child] in
    guard let self, let child else { return }
    self.free(child)
}
```

还要记得在流程结束时从 childCoordinators 数组中移除子 Coordinator。

12. TableView / CollectionView Cell 的闭包回调。

Cell 里常写按钮点击回调。如果 cell 持有 closure，closure 强持有 VC，而 VC 又持有 tableView，tableView 持有可见 cell，就可能形成 VC -> tableView -> cell -> closure -> VC。

```swift
cell.onTap = { [weak self] in
    self?.openDetail(model)
}
```

排查循环引用的方法：

1. 在 deinit 里打印日志，反复 push/pop 页面，看页面是否释放。

2. 使用 Xcode Memory Graph 查看对象是否残留，以及强引用链是谁持有谁。

3. 使用 Instruments 的 Leaks 和 Allocations，看对象数量是否持续增长。

4. 重点检查 Timer、CADisplayLink、Notification、KVO、Combine、Task、闭包属性、delegate、Coordinator children、Cell 回调。

5. 修复后重复进出页面，确认 deinit 执行、对象数量回落。

weak 和 unowned 的选择：weak 更安全，self 释放后自动变 nil，适合异步回调和生命周期不确定的场景；unowned 不增加引用计数，但对象释放后再访问会崩溃，只适合生命周期非常确定的场景。实际业务中异步闭包通常优先 weak。

面试收口：iOS 常见循环引用集中在闭包、Timer、delegate、Notification、KVO、Combine、Task、CADisplayLink、对象互相 strong、Coordinator 和 Cell 回调。判断原则是看有没有强引用闭环；解决方式是 weak/unowned、invalidate、removeObserver、cancel、打断父子持有关系，并用 Memory Graph 和 deinit 验证。

---

