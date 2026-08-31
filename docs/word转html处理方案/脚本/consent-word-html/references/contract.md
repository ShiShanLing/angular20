# Word HTML → legal_permission 转换契约

## 目标

把 Microsoft Word 导出的完整 HTML 转为两种对应产物：

- HTML 正文片段：用于检查和反向解析。
- TXT：顶层是一个合法 JSON 字符串，可作为 `legal_permission` 的属性值，并可安全放入单引号包裹的 `core-data='...'`。

参考结构固定为：

```html
<style>保留的排版样式</style>
<div class="legal-permission">正文</div>
```

不得在结果中保留 `<!doctype>`、`html`、`head`、`meta` 或 `body` 文档外壳。

## 允许的确定性处理

1. 提取 `<style>` 和 `<body>` 正文，移除文档外壳及 Word 头部元数据。
2. 去除浏览器不可见的 Word 条件注释和条件标记，但保留非注释回退内容。
3. 删除 CSS 中仅供 Microsoft Office 使用的 `mso-*` 声明，以及现代浏览器不采用的旧式 Word/IE 排版声明：`layout-grid` 系列、`tab-stops` 和 `text-underline`。其中 `text-underline` 仅是 Word 对下划线类型的附加描述，标准的 `text-decoration` 必须保留。默认删除所有字体家族选择：完整删除 `@font-face` 规则和 `font-family` 声明，删除 `<font>` 标签的 `face` 属性；对于 `font:` 简写，只移除字体家族部分，并把可证明安全的字号、行高、粗体、斜体、变体和拉伸设置还原为对应的独立声明。
4. 删除全部 Word 私有 `@list` 规则。脚本已移除正文中的 `mso-list` 声明，浏览器也不会执行 `@list`；因此这些规则属于可以确定无效的 Word 残留。只允许删除 `@list`，不得据此猜测删除普通 CSS 选择器。移除 `<style>` 内的 CSS 注释，包括 Word 写入的 `/* Font Definitions */`、`/* Style Definitions */`、`/* Page Definitions */` 和 `/* List Definitions */` 等分区说明；引号字符串中的同形文字不属于注释，必须保留。处理完成后，对 `<style>` 和元素的 `style` 属性执行安全 CSS 压缩：删除选择器逗号、花括号、声明分号及属性冒号周围不影响语义的空白，并删除相邻 CSS 规则之间的空白，例如 `p.MsoNormal, li.MsoNormal, div.MsoNormal { margin: 0 }` 转为 `p.MsoNormal,li.MsoNormal,div.MsoNormal{margin:0}`。后代选择器、多个属性值之间、函数表达式、CSS 字符串和转义字符中的必要空白必须逐字符保留。随后在 Word HTML 初次转换的最终正文片段中把全部 CR/LF 源码换行字符替换为普通空格，使生成 HTML 保持单行，同时避免标签名、属性或正文单词意外粘连。该格式化不得删除 `<p>`、`<br>` 或空段落等实际页面结构。
5. 固定移除所有图片引用，不得把图片转为 `data:` URL：删除 `<img>`、Word/VML 图片节点、HTML 图片资源属性，以及 CSS 中通过 `url(...)` 引用图片的声明。图片资源目录不参与转换，图片缺失不得导致转换失败。圆点、方框等视觉标记由后续宿主页面使用 CSS 实现。
6. 保留除图片以外的正文标签、文字、表格、粗体、下划线、颜色、字号、缩进、margin 和空段落。字体家族按照上一条固定移除，让结果继承宿主页面或用户设备的默认字体。
7. 把 `<a>` 替换为不可点击的 `<span>`，保留链接文字和安全的 `class`/`style`。对于带 `href` 且依赖 Word 默认 `a:link, span.MsoHyperlink` 规则显示颜色和下划线的链接，替换后的 `<span>` 必须包含 `MsoHyperlink` 类；仅含 `name` 的书签锚点不得因此新增链接样式。不得留下 `href`、`onclick` 或可点击跳转。
8. 正文中所有可见的 `http://` 或 `https://` URL 必须包裹在带 `non-wrapping-url` 类的 `<span>` 中，并通过保留的 CSS 设置 `white-space: nowrap`，避免 URL 在内部断行。只能作用于 URL 文字本身，不得改变周围文字、段落宽度或其他排版。
9. 单引号属性边界改为双引号。例如：

   ```html
   style='margin-top:0cm'
   ```

   转为：

   ```html
   style="margin-top:0cm"
   ```

   属性值内部原有双引号必须编码成 `&quot;`，不能直接覆盖。
10. 不得无上下文地把所有 `'` 替换成 `"`。为兼容 `legal_permission` 先进入一层 JSON、随后整个 `core-data` 再次 `JSON.stringify` 并放入单引号 HTML 属性的生产链路，输出的 HTML 正文片段不得含裸半角单引号：
   - `<style>` 原始文本中的 CSS 单引号字符串必须改写为语义等价的双引号字符串，例如 `'Times New Roman'` 改为 `"Times New Roman"`；字符串内容中的双引号必须按 CSS 规则转义。
   - 其他位置的半角单引号必须写成 `&#39;`，例如 `O'Brien` 写成 `O&#39;Brien`。浏览器解析后仍显示为原字符。
   - 不得删除单引号、改成全角字符或改变 CSS 计算值、正文可见文字及属性值。

## JSON 转码顺序

顺序不可改变：

1. 对 HTML 中的 `&`、`<`、`>` 做实体编码。
2. 使用 `JSON.stringify` 生成 JSON 字符串；HTML 属性双引号由它自动写成 `\"`。
3. 把 JSON 文本中意外剩余的半角单引号 `'` 全部写成 `\u0027`，作为最后一道保护；正常情况下，HTML 正文片段经过上一步的上下文安全处理后不应再含裸单引号。
4. 禁止把字体或正文中的单引号删除。HTML 实体解码或浏览器渲染后必须恢复原字符。

## 两层 core-data 安全

TXT 不仅要能单独 `JSON.parse`，还必须通过与目标系统一致的第二层验收：

1. `JSON.parse(TXT)` 得到 `legal_permission` 字段值。
2. 把该值放入 `coreData.company_config.legal_permission`。
3. 对整个 `coreData` 执行 `JSON.stringify`。
4. 第二层 JSON 文本不得含裸半角单引号，确保它放入 `core-data='...'` 时不会截断属性。
5. 第二层 JSON 再次解析后，`legal_permission` 必须与第一步完全一致。

## 处理后 HTML 的编辑往返

用户可以对脚本已经生成的 `legal_permission` HTML 正文片段做明确的小范围编辑，再单独执行 HTML → TXT 转码。该步骤必须：

- 保留用户提交的 HTML 内容，不得再次执行 Word 外壳清理、链接替换或推测性排版修改。
- 保留用户编辑时主动加入的源码换行；“初次转换输出单行化”规则不得再次应用于编辑往返流程。
- 要求内容恰好包含一个 `legal-permission` 容器，且不含完整文档外壳、可点击链接、事件属性或危险标签；其中的图片引用仍按本契约固定移除。
- 严格按照本契约的 JSON 转码顺序生成 TXT，并验证 TXT 可逐字符还原编辑后的 HTML。

TXT → HTML 反向解析必须要求 TXT 顶层是 JSON 字符串，按固定实体顺序还原，并验证重新编码后与原 TXT 表示的字符串逐字符一致。反向解析不得额外清理或修改 HTML。

## 禁止的推测性修改

除非用户另行明确授权并扩展固定脚本，否则禁止：

- 删除“看起来多余”的空段落或换行。
- 修改 margin、padding、line-height、text-indent 或列表缩进。
- 根据截图猜测标题、编号或层级并重建 DOM。
- 为链接增加或删除下划线、颜色、粗体。
- 删除未知标签或 CSS，只因为模型认为它“可能没用”。
- 覆盖输入文件，或在校验失败后仍交付结果。

## 必须通过的验收

- TXT 可由 `JSON.parse` 读取，顶层值为字符串。
- TXT 不含裸半角单引号。
- HTML 正文片段不含裸半角单引号。
- HTML 和 CSS 中不含 `@font-face`、`font-family`、`font:` 简写或 `<font face>` 字体家族设置；字号、粗体、斜体等可独立保留的属性不得随字体家族一起丢失。
- HTML 和 CSS 中不含 `layout-grid` 系列、`tab-stops` 或 `text-underline` 旧式 Word/IE 排版声明；标准的 `text-decoration` 等对应样式必须保留。
- CSS 中不含 Word 私有 `@list` 规则。
- `<style>` 内不含 CSS 注释；CSS 引号字符串中的同形文字不受影响。
- `<style>` 和元素的 `style` 属性已经过安全 CSS 压缩：选择器逗号、花括号、声明分号、属性冒号及相邻规则之间不含无意义空白；后代选择器、属性值、函数、字符串及转义字符中的必要空白保持不变。
- Word HTML 初次转换生成的整个 HTML 正文片段不含任何 CR/LF 换行字符；`<p>`、`<br>` 和空段落等页面结构仍须保留。
- TXT 经过“解析为字段值 → 整个 core-data 再次 JSON 序列化”后仍不含裸半角单引号，且字段值逐字符一致。
- 解码后与脚本生成的 HTML 正文片段逐字符一致。
- 解码结果没有完整文档外壳，且恰好包含一个 `legal-permission` 容器。
- 没有 `<a>`、`href`、`onclick`、`<img>`、Word/VML 图片节点、HTML 图片资源属性或 CSS 图片 URL。
- 输入先按固定规则移除 CR/LF 后，其可见文字指纹与输出一致；除此之外不得改变正文字符或普通空格。
- 段落、表格、粗体和下划线标签计数一致；输入中的图片节点必须全部移除。除此之外，仅允许新增一个 `legal-permission` 外层容器以及把 `<a>` 等量替换为 `<span>`。
- 所有输出都写入新文件，并生成机器可读报告。

## 边界

“无损”指除项目明确要求移除的图片和字体家族外，在浏览器目标环境中保留正文、结构和视觉相关信息；不承诺复现 Microsoft Word 专用渲染器的私有行为。遇到脚本无法证明安全的结构时应失败并请求人工确认。
