import { describe, expect, it } from 'vitest';
import type { Booking } from './booking';
import { dayGrid } from './dayGrid';

// Oct 19 2026 is EEST (UTC+3): 10:10 Athens = 07:10Z.
const at = (iso: string) => new Date(iso);
const TODAY = '2026-10-19';
const pastSlots = (now: Date, date = TODAY) =>
  dayGrid([], date, now)[0]?.cells.filter((c) => c.past).map((c) => c.slot) ?? [];

describe('dayGrid', () => {
  it('returns 3 Rooms x 24 cells with no bookings and all free', () => {
    const g = dayGrid([], '2026-10-20', at('2026-10-19T07:10:00Z'));
    expect(g.map((r) => r.roomId)).toEqual(['small', 'medium', 'large']);
    for (const r of g) {
      expect(r.cells).toHaveLength(24);
      expect(r.cells.every((c) => c.booking === null && !c.past)).toBe(true);
    }
  });

  it('marks slots 0..4 past at 10:10', () => {
    expect(pastSlots(at('2026-10-19T07:10:00Z'))).toEqual([0, 1, 2, 3, 4]);
  });

  it('at exactly 10:00:00.000 slot 4 is not past, 0..3 are', () => {
    expect(pastSlots(at('2026-10-19T07:00:00.000Z'))).toEqual([0, 1, 2, 3]);
  });

  it('at exactly Athens midnight no Slot of the new day is past', () => {
    expect(pastSlots(at('2026-10-18T21:00:00.000Z'))).toEqual([]);
  });

  it('1 ms after 10:00 slot 4 is past', () => {
    expect(pastSlots(at('2026-10-19T07:00:00.001Z'))).toEqual([0, 1, 2, 3, 4]);
  });

  it('future day has no past cells', () => {
    expect(pastSlots(at('2026-10-19T07:10:00Z'), '2026-10-20')).toEqual([]);
  });

  it('earlier day is all past', () => {
    expect(pastSlots(at('2026-10-19T07:10:00Z'), '2026-10-18')).toHaveLength(24);
  });

  it('before opening (07:00) none past; after closing (20:30) all past', () => {
    expect(pastSlots(at('2026-10-19T04:00:00Z'))).toEqual([]);
    expect(pastSlots(at('2026-10-19T17:30:00Z'))).toHaveLength(24);
  });

  it('exactly 20:00 all past; exactly 08:00 none past', () => {
    expect(pastSlots(at('2026-10-19T17:00:00Z'))).toHaveLength(24);
    expect(pastSlots(at('2026-10-19T05:00:00Z'))).toEqual([]);
  });

  it('a booked past cell has booking and past true', () => {
    const b: Booking = { id: '1', roomId: 'small', date: TODAY, startSlot: 1, slotCount: 1, name: 'Ann' };
    const cell = dayGrid([b], TODAY, at('2026-10-19T07:10:00Z'))[0]?.cells[1];
    expect(cell?.booking).toBe(b);
    expect(cell?.past).toBe(true);
  });

  it('multi-slot booking covers cells 2,3,4 of its Room only', () => {
    const b: Booking = { id: '1', roomId: 'medium', date: '2026-10-20', startSlot: 2, slotCount: 3, name: 'Bo' };
    const now = at('2026-10-19T07:10:00Z');
    const g = dayGrid([b], '2026-10-20', now);
    const booked = (i: number) =>
      g[i]?.cells.filter((c) => c.booking).map((c) => c.slot);
    expect(booked(1)).toEqual([2, 3, 4]);
    expect(booked(0)).toEqual([]);
    expect(booked(2)).toEqual([]);
    expect(dayGrid([b], TODAY, now)[1]?.cells.some((c) => c.booking)).toBe(false);
  });
});
