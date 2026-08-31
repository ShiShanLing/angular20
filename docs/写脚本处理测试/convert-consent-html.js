#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const canonicalScript = path.join(
  os.homedir(),
  '.codex',
  'skills',
  'consent-word-html',
  'scripts',
  'process-consent-word-html.js'
);

try {
  if (!fs.existsSync(canonicalScript)) {
    throw new Error('找不到标准转换脚本：' + canonicalScript);
  }

  const processor = require(canonicalScript);
  let args = process.argv.slice(2);

  // 保留旧脚本不传参数时的便捷入口，但所有逻辑都由 Skill 中的
  // 唯一标准脚本执行，避免页面外再维护一套转换规则。
  if (args.length === 0) {
    const input = path.join(__dirname, '个人信息处理授权同意书及承诺函.html');
    const outputDir = path.resolve(__dirname, '../知情同意书模版');
    args = [
      input,
      '--html-output', path.join(outputDir, '知情同意书html文件.html'),
      '--txt-output', path.join(outputDir, '知情同意书转码+转义.txt'),
      '--report-output', path.join(outputDir, '知情同意书处理报告.json')
    ];
  }

  process.exitCode = processor.runCli(args);
} catch (error) {
  console.error('处理失败：' + error.message);
  process.exitCode = 1;
}

