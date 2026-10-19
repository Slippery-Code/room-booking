import { describe, expect, it } from 'vitest';
import { nameKey } from './name';

describe('nameKey', () => {
  it('ignores case and surrounding spaces', () => {
    expect(nameKey('  Eleni K. ')).toBe(nameKey('eleni k.'));
    expect(nameKey('  Eleni K. ')).toBe('eleni k.');
  });
  it('keeps inner spacing significant', () => {
    expect(nameKey('Eleni  K')).not.toBe(nameKey('Eleni K'));
  });
  it('maps blank and whitespace-only names to an empty key', () => {
    expect(nameKey('')).toBe('');
    expect(nameKey('   \t\n')).toBe('');
  });
  it('treats composed and decomposed accents as the same name', () => {
    expect(nameKey('José')).toBe(nameKey('José'));
  });
  it('lowercases Greek names', () => {
    expect(nameKey('  ΕΛΕΝΗ ')).toBe('ελενη');
  });
});
