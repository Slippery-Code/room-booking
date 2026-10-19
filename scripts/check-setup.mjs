#!/usr/bin/env node
// Workshop setup check. Zero dependencies: runs before `npm install`.
// Usage: npm run check   (or: node scripts/check-setup.mjs)

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Versions pinned for the workshop. Update here only.
// Supported Node lines and their minimum versions (set by jsdom, the test DOM).
const NODE_LINES = { 22: [22, 22, 2], 24: [24, 15, 0], 26: [26, 0, 0] };
const NODE_REQUIREMENT = '24.15+ (recommended) or 22.22.2+';
const MIN_PYTHON = '3.10';
const OPENSPEC_VERSION = '1.14.3';
const BMAD_VERSION = '6.12.4';

const AGENT_CLIS = [
  ['claude', 'Claude Code'],
  ['codex', 'OpenAI Codex CLI'],
  ['copilot', 'GitHub Copilot CLI'],
  ['opencode', 'OpenCode'],
  ['gemini', 'Gemini CLI'],
  ['cursor-agent', 'Cursor CLI'],
];

const results = [];
const ok = (msg) => results.push(['ok', msg]);
const warn = (msg, fix) => results.push(['warn', msg, fix]);
const fail = (msg, fix) => results.push(['fail', msg, fix]);

// On Windows, npm-installed CLIs are .cmd shims and need a shell.
// Native executables (uv) must run without one, so arguments like ">=3.10" aren't parsed as redirects.
function run(cmd, args = ['--version'], { shell = process.platform === 'win32' } = {}) {
  try {
    return execFileSync(cmd, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      shell,
      timeout: 15000,
    }).trim();
  } catch {
    return null;
  }
}

function atLeast(actual, min) {
  for (let i = 0; i < min.length; i++) {
    if ((actual[i] ?? 0) > min[i]) return true;
    if ((actual[i] ?? 0) < min[i]) return false;
  }
  return true;
}

// Node
const nodeVersion = process.versions.node.split('.').map(Number);
const nodeMajor = nodeVersion[0] ?? 0;
const nodeMin = nodeMajor >= 26 ? NODE_LINES[26] : NODE_LINES[nodeMajor];
if (nodeMin && atLeast(nodeVersion, nodeMin)) {
  ok(`Node ${process.versions.node}`);
} else {
  fail(
    `Node ${process.versions.node} is not supported (need ${NODE_REQUIREMENT})`,
    'Install the current LTS from https://nodejs.org',
  );
}

// npm
const npmVersion = run('npm');
npmVersion ? ok(`npm ${npmVersion}`) : fail('npm not found', 'It ships with Node: reinstall Node');

// git
const gitVersion = run('git');
if (!gitVersion) {
  fail('git not found', 'Install from https://git-scm.com');
} else {
  ok(gitVersion);
  const name = run('git', ['config', 'user.name']);
  const email = run('git', ['config', 'user.email']);
  name && email
    ? ok(`git identity: ${name} <${email}>`)
    : warn(
        'git user.name / user.email not set',
        'git config --global user.name "Your Name" && git config --global user.email you@example.com',
      );
}

// uv + Python (BMAD runs its scripts through uv)
const uvVersion = run('uv', ['--version'], { shell: false });
if (!uvVersion) {
  fail('uv not found (BMAD needs it)', 'Install from https://docs.astral.sh/uv/getting-started/installation/');
} else {
  ok(uvVersion);
  const python = run('uv', ['python', 'find', `>=${MIN_PYTHON}`], { shell: false });
  python
    ? ok(`Python ${MIN_PYTHON}+ found (${python})`)
    : fail(`Python ${MIN_PYTHON}+ not found`, 'uv python install 3.12');
}

// OpenSpec
const openspecVersion = run('openspec');
if (!openspecVersion) {
  warn('OpenSpec CLI not installed', `npm install -g @fission-ai/openspec@${OPENSPEC_VERSION}`);
} else if (!openspecVersion.includes(OPENSPEC_VERSION)) {
  warn(
    `OpenSpec ${openspecVersion} (workshop uses ${OPENSPEC_VERSION})`,
    `npm install -g @fission-ai/openspec@${OPENSPEC_VERSION}`,
  );
} else {
  ok(`OpenSpec ${openspecVersion}`);
}

// Coding agent
const agents = AGENT_CLIS.filter(([cmd]) => run(cmd) !== null).map(([, label]) => label);
agents.length
  ? ok(`Coding agent CLI: ${agents.join(', ')}`)
  : warn(
      'No coding agent CLI found',
      'Fine if you use an IDE agent (Cursor, Copilot in VS Code, etc.). Make sure you are signed in.',
    );

// GitHub CLI (optional)
const ghVersion = run('gh');
if (ghVersion) ok(ghVersion.split('\n')[0]);

// Project dependencies
existsSync('node_modules')
  ? ok('Project dependencies installed')
  : warn('Project dependencies not installed', 'npm install');

// Report
const icon = { ok: '✓', warn: '!', fail: '✗' };
console.log('\nAgentic SDLC workshop: setup check\n');
for (const [level, msg, fix] of results) {
  console.log(`  ${icon[level]} ${msg}`);
  if (fix) console.log(`      -> ${fix}`);
}

const failures = results.filter(([l]) => l === 'fail').length;
const warnings = results.filter(([l]) => l === 'warn').length;
console.log(
  `\nBMAD is installed per project during Lab 1 (npx bmad-method@${BMAD_VERSION} install).`,
);
if (failures) {
  console.log(`\n${failures} problem(s) must be fixed before the workshop.\n`);
  process.exit(1);
}
console.log(
  warnings ? `\nReady, with ${warnings} warning(s) worth fixing.\n` : '\nAll set. See you on Saturday!\n',
);
