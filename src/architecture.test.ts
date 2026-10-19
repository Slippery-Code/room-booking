import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

type Rule =
  | 'domain-imports'
  | 'domain-clock'
  | 'domain-storage'
  | 'local-storage-outside-storage'
  | 'date-accessors-outside-time'
  | 'network';

interface Violation {
  rule: Rule;
  detail: string;
}

/**
 * Removes comments so prose mentioning banned names is not flagged. String and
 * template literals are matched first and kept, so `//` or `/*` inside them
 * cannot swallow real code.
 */
function stripComments(source: string): string {
  const token =
    /("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/.*$/gm;
  return source.replace(token, (_match, literal: string | undefined) => literal ?? '');
}

const IMPORT_SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)(['"])([^'"]+)\1/g;

/**
 * Pure scanner: `path` is POSIX-style and relative to the repo root
 * (e.g. `src/domain/time.ts`); `source` is the file text.
 */
export function scanSource(path: string, source: string): Violation[] {
  const code = stripComments(source);
  const found: Violation[] = [];
  const add = (rule: Rule, detail: string) => found.push({ rule, detail });

  const inDomain = path.startsWith('src/domain/');
  const inStorage = path.startsWith('src/storage/');
  const isTime = path === 'src/domain/time.ts';

  if (inDomain) {
    for (const m of code.matchAll(IMPORT_SPECIFIER)) {
      const spec = m[2] ?? '';
      if (!spec.startsWith('./')) add('domain-imports', spec);
    }
    if (/\bDate\.now\b/.test(code)) add('domain-clock', 'Date.now');
    if (/\bnew\s+Date\s*\(\s*\)/.test(code)) add('domain-clock', 'new Date()');
    if (/\blocalStorage\b/.test(code)) add('domain-storage', 'localStorage');
  }

  if (!inStorage && /\blocalStorage\b/.test(code)) {
    add('local-storage-outside-storage', 'localStorage');
  }

  if (!isTime) {
    const re = /\.\s*(getHours|getDate|getDay|toLocale\w*)\b/g;
    for (const m of code.matchAll(re)) {
      add('date-accessors-outside-time', m[1] ?? '');
    }
  }

  for (const m of code.matchAll(/\b(fetch|XMLHttpRequest|WebSocket)\b/g)) {
    add('network', m[1] ?? '');
  }

  return found;
}

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('architecture guard on the real source tree', () => {
  const root = process.cwd();
  const files = listSourceFiles(resolve(root, 'src'));

  it('finds the source files it is meant to scan', () => {
    const rel = files.map((f) => relative(root, f).split(sep).join('/'));
    expect(rel).toContain('src/domain/time.ts');
    expect(rel).toContain('src/storage/bookingStore.ts');
    expect(rel.some((f) => f.endsWith('.test.ts'))).toBe(false);
  });

  it('reports no violations', () => {
    const all: string[] = [];
    for (const file of files) {
      const rel = relative(root, file).split(sep).join('/');
      for (const v of scanSource(rel, readFileSync(file, 'utf8'))) {
        all.push(`${rel}: ${v.rule} (${v.detail})`);
      }
    }
    expect(all).toEqual([]);
  });
});

describe('scanner detects violating samples', () => {
  const rules = (path: string, source: string) =>
    scanSource(path, source).map((v) => v.rule);

  it('domain importing react or anything outside itself', () => {
    expect(rules('src/domain/x.ts', `import { useState } from 'react';`)).toContain(
      'domain-imports',
    );
    expect(rules('src/domain/x.ts', `import { a } from '../storage/s';`)).toContain(
      'domain-imports',
    );
    expect(rules('src/domain/x.ts', `const m = await import('react');`)).toContain(
      'domain-imports',
    );
    expect(rules('src/domain/x.ts', `import { a } from './time';`)).toEqual([]);
  });

  it('domain reading the clock', () => {
    expect(rules('src/domain/x.ts', 'const t = Date.now();')).toContain('domain-clock');
    expect(rules('src/domain/x.ts', 'const d = new Date();')).toContain('domain-clock');
    expect(rules('src/domain/x.ts', 'const d = new Date( );')).toContain('domain-clock');
    expect(rules('src/domain/x.ts', 'const d = new Date(ms);')).toEqual([]);
  });

  it('domain using localStorage', () => {
    expect(rules('src/domain/x.ts', 'localStorage.getItem("a");')).toContain(
      'domain-storage',
    );
  });

  it('localStorage outside storage, allowed inside it', () => {
    expect(rules('src/App.tsx', 'window.localStorage.setItem("a", "b");')).toContain(
      'local-storage-outside-storage',
    );
    expect(rules('src/storage/s.ts', 'window.localStorage.getItem("a");')).toEqual([]);
  });

  it('date accessors outside time.ts, allowed inside it', () => {
    for (const call of ['d.getHours()', 'd.getDate()', 'd.getDay()', 'd.toLocaleString()', 'd.toLocaleDateString()', 'd.toLocaleTimeString()']) {
      expect(rules('src/App.tsx', `const x = ${call};`)).toContain(
        'date-accessors-outside-time',
      );
    }
    expect(rules('src/domain/time.ts', 'const x = d.getHours();')).toEqual([]);
  });

  it('network calls anywhere', () => {
    expect(rules('src/App.tsx', 'fetch("/x");')).toContain('network');
    expect(rules('src/storage/s.ts', 'new XMLHttpRequest();')).toContain('network');
    expect(rules('src/domain/x.ts', 'new WebSocket("ws://x");')).toContain('network');
  });

  it('does not let comment markers inside strings hide violations', () => {
    expect(rules('src/App.tsx', 'const u = "a//b"; fetch(u);')).toContain('network');
    expect(rules('src/App.tsx', 'const g = "src/**/*.ts"; fetch(g);')).toContain('network');
  });

  it('domain importing via require or a side-effect import', () => {
    expect(rules('src/domain/x.ts', `const r = require('react');`)).toContain(
      'domain-imports',
    );
    expect(rules('src/domain/x.ts', `import 'react';`)).toContain('domain-imports');
  });

  it('ignores banned names that only appear in comments', () => {
    expect(rules('src/App.tsx', '// never call fetch or localStorage here\nconst a = 1;')).toEqual([]);
    expect(rules('src/App.tsx', '/* d.getHours() */ const a = 1;')).toEqual([]);
  });
});
