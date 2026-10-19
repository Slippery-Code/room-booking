import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

/** CSS with every @media block removed: what a phone gets as the base layout. */
function stripMedia(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const at = source.indexOf('@media', i);
    if (at === -1) {
      out += source.slice(i);
      break;
    }
    out += source.slice(i, at);
    let depth = 0;
    let j = source.indexOf('{', at);
    for (; j < source.length; j++) {
      if (source[j] === '{') depth++;
      if (source[j] === '}' && --depth === 0) break;
    }
    i = j + 1;
  }
  return out;
}

const base = stripMedia(css);

/** Declarations of every rule whose selector list contains `selector`. */
function declarations(source: string, selector: string): string {
  const out: string[] = [];
  for (const m of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = (m[1] ?? '').split(',').map((s) => s.trim());
    if (selectors.includes(selector)) out.push(m[2] ?? '');
  }
  return out.join('\n');
}

const minHeightRem = (selector: string): number => {
  const m = declarations(base, selector).match(/min-height:\s*([\d.]+)rem/);
  return m ? Number(m[1]) : 0;
};

describe('mobile-first CSS contract', () => {
  it.each([
    '.slot-book',
    '.overview-cell',
    '.day-picker select',
    '.booking-form select',
    '.booking-form input',
    '.booking-form button',
    '.my-booking-cancel',
  ])('%s has a 44px minimum height in the base rules', (selector) => {
    expect(minHeightRem(selector) * 16).toBeGreaterThanOrEqual(44);
  });

  it.each(['.slot-book', '.overview-cell', '.my-booking-cancel'])(
    '%s has a 44px minimum width in the base rules',
    (selector) => {
      const m = declarations(base, selector).match(/min-width:\s*([\d.]+)rem/);
      expect(Number(m?.[1] ?? 0) * 16).toBeGreaterThanOrEqual(44);
    },
  );

  it('keeps the overview table wide enough for eight 44px columns', () => {
    const m = declarations(base, '.overview table').match(/min-width:\s*([\d.]+)rem/);
    const columns = 8;
    const spacingPx = 2 * (columns + 1);
    expect(Number(m?.[1] ?? 0) * 16).toBeGreaterThanOrEqual(columns * 44 + spacingPx);
  });

  it('pins the booking form to the bottom in the base (phone) rules', () => {
    const d = declarations(base, '.booking-form');
    expect(d).toMatch(/position:\s*fixed/);
    expect(d).toMatch(/bottom:\s*0/);
  });

  it('uses 48rem as the only desktop breakpoint, with Rooms side by side', () => {
    const queries = [...css.matchAll(/@media\s*([^{]+)\{/g)].map((m) => (m[1] ?? '').trim());
    expect(queries.length).toBeGreaterThan(0);
    for (const q of queries) expect(q).toBe('(min-width: 48rem)');
    expect(declarations(base, '.rooms')).not.toMatch(/grid-template-columns/);
    const desktop = css.slice(css.indexOf('@media (min-width: 48rem)'));
    expect(desktop).toMatch(/\.rooms\s*\{[^}]*grid-template-columns/);
  });

  it('unpins the booking form on desktop', () => {
    expect(css).toMatch(/@media \(min-width: 48rem\) \{\s*\.booking-form \{[^}]*position:\s*static/);
  });

  it('shows a visible keyboard focus indicator', () => {
    expect(declarations(base, ':focus-visible')).toMatch(/outline:\s*\d/);
  });
});
