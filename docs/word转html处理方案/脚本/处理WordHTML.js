#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const planDirectory = path.resolve(__dirname, '..');
const inputDirectory = path.join(planDirectory, '输入');
const outputDirectory = path.join(planDirectory, '输出');
const canonicalScript = path.join(
  __dirname,
  'consent-word-html',
  'scripts',
  'process-consent-word-html.js'
);

function fail(message) {
  throw new Error(message);
}

function findInputFile(argument) {
  if (argument) {
    const directPath = path.resolve(argument);
    const inputFolderPath = path.join(inputDirectory, argument);
    if (fs.existsSync(directPath)) return directPath;
    if (fs.existsSync(inputFolderPath)) return inputFolderPath;
    fail('找不到输入文件：' + argument);
  }

  const candidates = fs.readdirSync(inputDirectory)
    .filter(function (name) { return /\.html?$/i.test(name); })
    .sort();

  if (candidates.length === 0) {
    fail('“输入”文件夹中没有 .html 或 .htm 文件。');
  }
  if (candidates.length > 1) {
    fail('“输入”文件夹中有多个 HTML，请在命令后明确指定文件名。');
  }
  return path.join(inputDirectory, candidates[0]);
}

function createRandomId() {
  return String(100000 + (crypto.randomBytes(4).readUInt32BE(0) % 900000));
}

function removeEntry(entryPath) {
  const stat = fs.lstatSync(entryPath);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    fs.readdirSync(entryPath).forEach(function (name) {
      removeEntry(path.join(entryPath, name));
    });
    fs.rmdirSync(entryPath);
    return;
  }
  fs.unlinkSync(entryPath);
}

function clearOutputDirectory() {
  if (path.dirname(outputDirectory) !== planDirectory || path.basename(outputDirectory) !== '输出') {
    fail('拒绝清理非预期目录：' + outputDirectory);
  }
  if (!fs.existsSync(outputDirectory) || !fs.statSync(outputDirectory).isDirectory()) {
    fail('找不到“输出”文件夹：' + outputDirectory);
  }
  fs.readdirSync(outputDirectory).forEach(function (name) {
    removeEntry(path.join(outputDirectory, name));
  });
}

try {
  if (!fs.existsSync(canonicalScript)) {
    fail('找不到项目内置的 consent-word-html 标准脚本：' + canonicalScript);
  }

  const inputPath = findInputFile(process.argv[2]);
  if (!/\.html?$/i.test(inputPath)) fail('输入文件必须是 .html 或 .htm。');

  const extension = path.extname(inputPath);
  const stem = path.basename(inputPath, extension);
  const id = createRandomId();
  const processor = require(canonicalScript);

  clearOutputDirectory();

  process.exitCode = processor.runCli([
    inputPath,
    '--html-output', path.join(outputDirectory, stem + '_legal_permission_' + id + '.html'),
    '--txt-output', path.join(outputDirectory, stem + '_转码+转义_' + id + '.txt'),
    '--report-output', path.join(outputDirectory, stem + '_处理报告_' + id + '.json')
  ]);
} catch (error) {
  console.error('处理失败：' + error.message);
  process.exitCode = 1;
}
