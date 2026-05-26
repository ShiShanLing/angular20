// 示例：修复「多线程并发读写 Dictionary」导致的数据竞争 / 可能 crash。
// 运行：swift docs/swift-bankaccount-concurrency-example.swift
// 说明：原问题来自 global 并发队列上同时执行 callback，且直接改 balances。

import Foundation

// MARK: - User（保持「多次 async 调 callback」形态）

struct User {
    let name: String
    let age: Int

    /// 仍会在全局并发队列上多次调用 `callback`，但 **不再在 callback 里直接碰共享可变状态**。
    func testUser(callback: @escaping () -> Void) {
        for _ in 0 ..< 1000 {
            DispatchQueue.global().async {
                callback()
            }
        }
    }
}

// MARK: - 方案一：串行队列 —— 所有对 `balances` 的读写都进同一条队列（推荐、易读）

final class BankAccount {
    private var balances: [Int: Double] = [1: 0.0]
    /// 专门保护 `balances`；与 global 队列无关，只负责串行化字典访问。
    private let balanceQueue = DispatchQueue(label: "com.example.bank.balances")

    func test() {
        let user = User(name: "Tom", age: 18)
        let group = DispatchGroup()

        user.testUser { [weak self] in
            guard let self else { return }
            group.enter()
            self.balanceQueue.async {
                defer { group.leave() }
                let key = 1
                let b = self.balances[key] ?? 0.0
                self.balances[key] = b + 1
                // 若需观察线程：应也在 balanceQueue 上 print，避免与写入交错
                print(
                    "balanceQueue, balance[\(key)] = \(String(describing: self.balances[key]))"
                )
            }
        }

        group.notify(queue: .main) { [weak self] in
            guard let self else { return }
            self.balanceQueue.async {
                print("--- 完成，最终 balance[1] = \(self.balances[1] ?? -1)（期望 1000）")
            }
        }
    }
}

// MARK: - 方案二：Swift Actor（Swift 5.5+）—— 用类型系统表达「余额只能串行更新」

actor BankAccountActor {
    private var balances: [Int: Double] = [1: 0.0]

    func incrementBalance(key: Int) {
        let b = balances[key] ?? 0.0
        balances[key] = b + 1
    }

    func balance(key: Int) -> Double {
        balances[key] ?? 0.0
    }

    func runConcurrentIncrements(times: Int = 1000) async {
        await withTaskGroup(of: Void.self) { group in
            for _ in 0 ..< times {
                group.addTask { [self] in
                    await incrementBalance(key: 1)
                }
            }
        }
        print("--- Actor 最终 balance[1] = \(await balance(key: 1))（期望 \(times)）")
    }
}

// MARK: - 演示入口
// 注意：若写 `BankAccount().test()` 且闭包用 `[weak self]`，对象会在 1000 个 async 跑完前释放。
// 这里强持有 `account` 直到 notify 结束（生产代码里由 UI/VM 生命周期自然持有即可）。

let account = BankAccount()
account.test()

Task {
    await BankAccountActor().runConcurrentIncrements(times: 1000)
}

// 给异步收尾一点时间（脚本跑完即退出时可按需调大）
RunLoop.main.run(until: Date(timeIntervalSinceNow: 5))
