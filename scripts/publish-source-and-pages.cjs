#!/usr/bin/env node

const { execFileSync } = require('node:child_process');

function capture(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8' }).trim();
}

function run(cmd, args) {
  console.log(`\n$ ${[cmd, ...args].join(' ')}`);
  execFileSync(cmd, args, { stdio: 'inherit' });
}

const commitMessage =
  process.env.npm_config_message || process.env.MSG || 'chore: publish source and pages';
const branch = capture('git', ['branch', '--show-current']);

if (!branch) {
  console.error('Cannot publish: current git HEAD is detached.');
  process.exit(1);
}

if (branch === 'gh-pages') {
  console.error('Cannot publish source from gh-pages branch. Switch back to your source branch first.');
  process.exit(1);
}

const status = capture('git', ['status', '--porcelain']);

if (status) {
  run('git', ['add', '-A']);
  run('git', ['commit', '-m', commitMessage]);
} else {
  console.log('Working tree is clean; skipping source commit.');
}

run('git', ['push', '-u', 'origin', branch]);
run('npm', ['run', 'publish:gh-pages']);
