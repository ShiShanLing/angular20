#!/usr/bin/env node
/**
 * 把项目里的背题文件收成一份清单，服务启动时只补数据库里还没有的题。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const seeds = join(root, 'src/app/pages/practice/seeds');

function load(relativePath) {
  const rows = JSON.parse(readFileSync(join(seeds, relativePath), 'utf8'));
  if (!Array.isArray(rows)) {
    throw new Error(`${relativePath} 不是题目数组`);
  }
  return rows.filter((row) => row && typeof row.id === 'string' && row.id.trim());
}

function isTypeScriptRow(row) {
  return String(row.topic ?? '').startsWith('TypeScript');
}

const angularRows = load('angular/angular-job.seed.json');
const banks = {
  ios: load('ios/ios-job.seed.json'),
  frontend: load('frontend/frontend-job.seed.json'),
  agent: load('agent/agent-job.seed.json'),
  practice: load('ios/ios.seed.json'),
  angular: angularRows.filter((row) => !isTypeScriptRow(row)),
  ts: angularRows.filter((row) => isTypeScriptRow(row)),
};

const outDir = join(root, 'server/src/practice-banks');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'practice-seeds.json');
writeFileSync(outFile, JSON.stringify(banks));

const summary = Object.entries(banks)
  .map(([track, rows]) => `${track} ${rows.length}`)
  .join(', ');
console.log(`practice seeds: ${summary}`);
