import { describe, expect, it } from 'vitest';
import { busyness } from './busyness';
import type { Booking } from './booking';

const DATE = '2026-10-19';

const make = (
  id: string,
  roomId: Booking['roomId'],
  startSlot: number,
  slotCount: number,
  date = DATE,
): Booking => ({ id, roomId, date, startSlot, slotCount, name: 'Ann' });

const counts = (bookings: Booking[], date = DATE) =>
  busyness(bookings, date).map((r) => r.bookedSlots);

describe('busyness', () => {
  it('returns 0 for all 3 Rooms in ROOMS order with no Bookings', () => {
    expect(busyness([], DATE)).toEqual([
      { roomId: 'small', bookedSlots: 0 },
      { roomId: 'medium', bookedSlots: 0 },
      { roomId: 'large', bookedSlots: 0 },
    ]);
  });

  it('returns 24 for a fully booked Room-day and 0 for the others', () => {
    const bookings = [0, 4, 8, 12, 16, 20].map((s, i) => make(`b${i}`, 'medium', s, 4));
    expect(counts(bookings)).toEqual([0, 24, 0]);
  });

  it('sums a back-to-back pair', () => {
    expect(counts([make('1', 'small', 2, 2), make('2', 'small', 4, 3)])).toEqual([5, 0, 0]);
  });

  it('counts a multi-slot Booking for its Room and date only', () => {
    const bookings = [make('1', 'large', 2, 3)];
    expect(counts(bookings)).toEqual([0, 0, 3]);
    expect(counts(bookings, '2026-10-20')).toEqual([0, 0, 0]);
  });

  it('ignores Bookings of another date or Room', () => {
    const bookings = [make('1', 'small', 0, 4, '2026-10-20'), make('2', 'medium', 0, 2)];
    expect(counts(bookings)).toEqual([0, 2, 0]);
  });

  it('counts a shared Slot of overlapping Bookings once', () => {
    expect(counts([make('1', 'small', 2, 3), make('2', 'small', 4, 3)])).toEqual([5, 0, 0]);
    expect(counts([make('1', 'small', 2, 2), make('2', 'small', 2, 2)])).toEqual([2, 0, 0]);
  });

  it('clamps a Booking running past the end of the day', () => {
    expect(counts([make('1', 'small', 22, 4)])).toEqual([2, 0, 0]);
  });

  it('treats the range as half-open at the first and last Slot', () => {
    expect(counts([make('1', 'small', 0, 1), make('2', 'small', 23, 1)])).toEqual([2, 0, 0]);
  });
});
