import { describe, expect, it } from 'vitest';
import type { Booking } from './booking';
import { ownBookings } from './ownBookings';

// 10:10 Athens (EEST) on Mon 19 Oct 2026 = slot index 4.
const NOW = new Date('2026-10-19T07:10:00Z');
const mk = (id: string, over: Partial<Booking> = {}): Booking => ({
  id,
  roomId: 'small',
  date: '2026-10-20',
  startSlot: 12,
  slotCount: 2,
  name: 'Eleni K.',
  ...over,
});
const ids = (bs: Booking[]) => bs.map((b) => b.id);

describe('ownBookings', () => {
  it('matches Names via nameKey (case and surrounding spaces)', () => {
    expect(ids(ownBookings([mk('a')], '  eleni k. ', NOW))).toEqual(['a']);
    expect(ids(ownBookings([mk('a', { name: ' ELENI K.  ' })], 'Eleni K.', NOW))).toEqual(['a']);
  });

  it('excludes other Names', () => {
    expect(ownBookings([mk('a', { name: 'Ann' })], 'Eleni K.', NOW)).toEqual([]);
  });

  it('returns nothing for a blank Name', () => {
    expect(ownBookings([mk('a', { name: '' })], '   ', NOW)).toEqual([]);
    expect(ownBookings([mk('a')], '', NOW)).toEqual([]);
  });

  it('sorts by date, then startSlot, then id', () => {
    const list = [
      mk('d', { date: '2026-10-21', startSlot: 0 }),
      mk('c', { startSlot: 8 }),
      mk('b', { startSlot: 8 }),
      mk('a', { startSlot: 2 }),
    ];
    expect(ids(ownBookings(list, 'eleni k.', NOW))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('excludes Bookings on earlier days', () => {
    expect(ownBookings([mk('a', { date: '2026-10-18' })], 'Eleni K.', NOW)).toEqual([]);
  });

  it('excludes a Booking ending exactly at the current Slot boundary', () => {
    // 10:00:00 Athens = slot 4; slots 2..3 end at 10:00.
    const at10 = new Date('2026-10-19T07:00:00Z');
    const b = mk('a', { date: '2026-10-19', startSlot: 2, slotCount: 2 });
    expect(ownBookings([b], 'Eleni K.', at10)).toEqual([]);
    // one millisecond before 10:00 it is still in progress
    expect(ids(ownBookings([b], 'Eleni K.', new Date('2026-10-19T06:59:59.999Z')))).toEqual(['a']);
  });

  it('includes a Booking in progress', () => {
    const b = mk('a', { date: '2026-10-19', startSlot: 3, slotCount: 2 });
    expect(ids(ownBookings([b], 'Eleni K.', NOW))).toEqual(['a']);
  });

  it('excludes today Bookings that ended earlier', () => {
    expect(ownBookings([mk('a', { date: '2026-10-19', startSlot: 0, slotCount: 1 })], 'Eleni K.', NOW)).toEqual([]);
  });

  it('after closing, nothing today remains; before opening everything does', () => {
    const b = mk('a', { date: '2026-10-19', startSlot: 22, slotCount: 2 });
    expect(ownBookings([b], 'Eleni K.', new Date('2026-10-19T17:00:00Z'))).toEqual([]);
    expect(ids(ownBookings([b], 'Eleni K.', new Date('2026-10-19T03:00:00Z')))).toEqual(['a']);
  });

  it('uses the Athens date at midnight', () => {
    // 2026-10-18T21:00Z is Athens midnight, Oct 19; Oct 18 Bookings are past.
    const midnight = new Date('2026-10-18T21:00:00Z');
    const list = [mk('old', { date: '2026-10-18', startSlot: 22 }), mk('new', { date: '2026-10-19' })];
    expect(ids(ownBookings(list, 'Eleni K.', midnight))).toEqual(['new']);
    // one ms earlier it is still Oct 18 in Athens, after closing: all of Oct 18 is over
    expect(ids(ownBookings(list, 'Eleni K.', new Date('2026-10-18T20:59:59.999Z')))).toEqual(['new']);
  });

  it('does not mutate the input', () => {
    const list = [mk('b', { startSlot: 9 }), mk('a', { startSlot: 1 })];
    ownBookings(list, 'Eleni K.', NOW);
    expect(ids(list)).toEqual(['b', 'a']);
  });
});
