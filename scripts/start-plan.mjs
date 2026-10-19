#!/usr/bin/env node
// Lab 1: start a planning branch.
//   npm run plan:start                  branch from main, keep the React + TypeScript app (option A)
//   npm run plan:start -- --own-stack   empty branch with only the idea, for any stack (option B)
// An optional branch name can follow: npm run plan:start -- --own-stack my-dotnet-plan

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const ownStack = args.includes('--own-stack');
const branch = args.find((a) => !a.startsWith('--')) ?? 'my-plan';

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const fail = (msg) => {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
};

try {
  git('rev-parse', '--is-inside-work-tree');
} catch {
  fail('Run this inside the agentic-sdlc-workshop folder.');
}
if (git('status', '--porcelain')) fail('You have uncommitted changes. Commit or discard them first.');
if (git('branch', '--list', branch)) fail(`Branch "${branch}" already exists. Pick another name: npm run plan:start -- ${ownStack ? '--own-stack ' : ''}<name>`);

if (!ownStack) {
  git('switch', '-c', branch, 'main');
  console.log(`\n  ✓ On branch "${branch}", starting from the React + TypeScript app.\n`);
  process.exit(0);
}

// Option B: a branch with no history and nothing but the idea.
const idea = git('show', 'main:docs/idea.md');
git('switch', '--orphan', branch);
// Newer git empties the index on --orphan; older git keeps it. Clear it either way.
try {
  git('rm', '-r', '-q', '--cached', '.');
} catch {
  /* already empty */
}
// Remove leftovers of the app (dist/, coverage/, …) but keep installed dependencies.
git('clean', '-fdq', '-e', 'node_modules');
writeFileSync('.gitignore', [
  '# Common build and dependency folders for most stacks',
  'node_modules/', 'dist/', 'build/', 'out/', 'coverage/',
  'bin/', 'obj/', '.vs/',
  '__pycache__/', '.venv/', 'venv/', '*.pyc',
  'target/', '.gradle/',
  '.env', '.env.*', '*.local', '.DS_Store', '',
].join('\n'));
writeFileSync('idea.md', `${idea}\n`);
writeFileSync('README.md', '# Room booking\n\nThe product idea is in [idea.md](idea.md).\n');
git('add', '-A');
git('commit', '-q', '-m', 'Start from the product idea');
console.log(`\n  ✓ On branch "${branch}": an empty project with only idea.md. Build in any stack.`);
console.log('    Back to the workshop app any time: git switch main\n');
