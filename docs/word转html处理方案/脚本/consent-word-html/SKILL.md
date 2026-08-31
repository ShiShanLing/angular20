---
name: consent-word-html
description: 安全、可重复地处理 Microsoft Word 导出的知情同意书 HTML，生成 legal_permission 正文片段和可嵌入 core-data 的 JSON 字符串。适用于 Word HTML 精简、HTML 转 TXT、转义错误诊断和结果验收；不用于根据视觉猜测修改正文排版。
---

# 知情同意书 Word HTML 标准处理

处理任何 Word 导出的知情同意书 HTML 前，先完整阅读 [转换契约](references/contract.md)。
用户询问如何调用或测试本 Skill 时，读取 [使用说明](references/usage.md)。

## 固定工作流

1. 保持输入文件只读，禁止覆盖原文件。
2. 使用本 Skill 的固定脚本，不要临时重写正则或手工批量替换：

   ```bash
   node scripts/process-consent-word-html.js <输入.html> [--html-output <正文片段.html>] [--txt-output <转码.txt>] [--report-output <报告.json>]
   ```

3. 脚本必须同时完成结构处理、Word 私有 `@list` 规则移除、全部图片引用移除、链接禁用、属性引号规范化、JSON 转义和验收。
4. 只有脚本退出码为 0 且报告中的所有检查通过，才能交付输出。
5. 报告输入、输出和报告文件的绝对路径，并简述变更计数。不要只说“处理完成”。

可视化版本对处理后 HTML 进行 HTML → TXT 或 TXT → HTML 往返时，必须调用同一脚本导出的 `encodeFragment` / `decodeTxt`，并遵守转换契约的“处理后 HTML 的编辑往返”规则；不得在页面脚本中复制另一套转义正则。

## 失败处理

- 脚本失败时停止自动交付，报告具体校验项，并完整阅读 [AI 受控回退说明](references/ai-fallback.md)。
- AI 只能按照回退说明制作候选副本和差异报告；不得绕过验收、覆盖输入或自由发挥。
- 如需新增转换规则，先更新 [转换契约](references/contract.md)，再修改固定脚本，并使用历史 Word HTML 样本回归验证。
- 未经用户明确要求，不得删除空段落、修改 margin/缩进/字号/字体/颜色、重建编号、调整标题位置或改变链接文字的视觉样式。
