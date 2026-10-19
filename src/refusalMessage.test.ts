import { describe, expect, it } from 'vitest';
import type { Booking, DomainError } from './domain/booking';
import { refusalMessage } from './refusalMessage';
import type { StorageError } from './storage/useBookings';

const b = (startSlot: number, slotCount: number, name: string): Booking => ({
  id: String(startSlot), roomId: 'small', date: '2026-10-19', startSlot, slotCount, name,
});

describe('refusalMessage', () => {
  it('gives every code a non-empty message', () => {
    const errors: (DomainError | StorageError)[] = [
      { code: 'name_required' },
      { code: 'bad_length' },
      { code: 'outside_grid' },
      { code: 'outside_window' },
      { code: 'in_past' },
      { code: 'not_found' },
      { code: 'not_owner' },
      { code: 'overlap', conflicts: [b(13, 1, 'Ann')] },
      { code: 'allowance_exceeded', remainingMinutes: 30 },
      { code: 'storage_unavailable' },
    ];
    for (const e of errors) expect(refusalMessage(e).length).toBeGreaterThan(10);
  });

  it('says what is wrong for each code', () => {
    const expected: [DomainError | StorageError, RegExp][] = [
      [{ code: 'name_required' }, /name/i],
      [{ code: 'bad_length' }, /30 minutes and 2 hours/],
      [{ code: 'outside_grid' }, /08:00 and 20:00/],
      [{ code: 'outside_window' }, /6 days ahead/],
      [{ code: 'in_past' }, /already started/],
      [{ code: 'not_found' }, /no longer exists/],
      [{ code: 'not_owner' }, /person who made/],
      [{ code: 'storage_unavailable' }, /storage/i],
    ];
    for (const [error, pattern] of expected) expect(refusalMessage(error)).toMatch(pattern);
  });

  it('names the conflicting time and booker', () => {
    const m = refusalMessage({ code: 'overlap', conflicts: [b(13, 1, 'Ann'), b(15, 2, 'Bo')] });
    expect(m).toContain('14:30-15:00 by Ann');
    expect(m).toContain('15:30-16:30 by Bo');
  });

  it('states the minutes remaining, including zero', () => {
    expect(refusalMessage({ code: 'allowance_exceeded', remainingMinutes: 30 })).toContain('30 minutes left');
    expect(refusalMessage({ code: 'allowance_exceeded', remainingMinutes: 0 })).toContain('0 minutes left');
  });
});
