import { describe, expect, it } from 'vitest';
import { athensDate, athensSlotIndex, formatDate, slotLabel, windowDates } from './time';

const at = (iso: string) => new Date(iso);

describe('athensSlotIndex', () => {
  // Representation: -1 = before opening (all Slots future), 24 = after closing (all Slots past).
  it('opening is slot 0', () => {
    expect(athensSlotIndex(at('2026-07-15T05:00:00Z'))).toBe(0); // 08:00 EEST
  });
  it('19:30 is slot 23', () => {
    expect(athensSlotIndex(at('2026-07-15T16:30:00Z'))).toBe(23);
  });
  it('07:59 is -1', () => {
    expect(athensSlotIndex(at('2026-07-15T04:59:00Z'))).toBe(-1);
  });
  it('20:00 is 24', () => {
    expect(athensSlotIndex(at('2026-07-15T17:00:00Z'))).toBe(24);
  });
  it('moves to slot 1 exactly at 08:30', () => {
    expect(athensSlotIndex(at('2026-07-15T05:29:59Z'))).toBe(0);
    expect(athensSlotIndex(at('2026-07-15T05:30:00Z'))).toBe(1);
  });

  it('19:59 is still slot 23', () => {
    expect(athensSlotIndex(at('2026-07-15T16:59:59Z'))).toBe(23);
  });
  it('uses winter offset in winter', () => {
    expect(athensSlotIndex(at('2026-01-15T06:00:00Z'))).toBe(0); // 08:00 EET
  });
  it('midnight is -1', () => {
    expect(athensSlotIndex(at('2026-07-14T21:00:00Z'))).toBe(-1);
  });
});

describe('athensDate', () => {
  it('rolls over at Athens midnight in summer (UTC+3)', () => {
    expect(athensDate(at('2026-07-15T20:59:59Z'))).toBe('2026-07-15');
    expect(athensDate(at('2026-07-15T21:00:00Z'))).toBe('2026-07-16');
  });
  it('rolls over at Athens midnight in winter (UTC+2)', () => {
    expect(athensDate(at('2026-01-15T21:59:59Z'))).toBe('2026-01-15');
    expect(athensDate(at('2026-01-15T22:00:00Z'))).toBe('2026-01-16');
  });
  it('handles the March DST change day', () => {
    expect(athensDate(at('2026-03-28T22:00:00Z'))).toBe('2026-03-29'); // midnight EET
    expect(athensSlotIndex(at('2026-03-29T05:00:00Z'))).toBe(0); // 08:00 EEST
  });
  it('handles the October DST change day', () => {
    expect(athensDate(at('2026-10-24T21:00:00Z'))).toBe('2026-10-25'); // midnight EEST
    expect(athensSlotIndex(at('2026-10-25T06:00:00Z'))).toBe(0); // 08:00 EET
  });
});

describe('windowDates', () => {
  it('returns 7 consecutive dates starting today', () => {
    expect(windowDates(at('2026-07-15T10:00:00Z'))).toEqual([
      '2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18',
      '2026-07-19', '2026-07-20', '2026-07-21',
    ]);
  });
  it('starts on the Athens date near midnight', () => {
    expect(windowDates(at('2026-07-15T21:00:00Z'))[0]).toBe('2026-07-16');
  });
  it('spans the March DST change with 7 consecutive dates', () => {
    expect(windowDates(at('2026-03-27T10:00:00Z'))).toEqual([
      '2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30',
      '2026-03-31', '2026-04-01', '2026-04-02',
    ]);
  });
  it('spans the October DST change with 7 consecutive dates', () => {
    expect(windowDates(at('2026-10-23T10:00:00Z'))).toEqual([
      '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26',
      '2026-10-27', '2026-10-28', '2026-10-29',
    ]);
  });
  it('crosses month and year boundaries', () => {
    expect(windowDates(at('2026-12-29T10:00:00Z'))).toEqual([
      '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01',
      '2027-01-02', '2027-01-03', '2027-01-04',
    ]);
  });
  it('handles a leap day', () => {
    expect(windowDates(at('2028-02-28T10:00:00Z')).slice(0, 3)).toEqual([
      '2028-02-28', '2028-02-29', '2028-03-01',
    ]);
  });
});

describe('slotLabel', () => {
  it('labels first, second and last slots', () => {
    expect(slotLabel(0)).toBe('08:00');
    expect(slotLabel(1)).toBe('08:30');
    expect(slotLabel(23)).toBe('19:30');
  });
});

describe('formatDate', () => {
  it('formats a date label independent of process zone', () => {
    expect(formatDate('2026-10-19')).toBe('Mon 19 Oct');
    expect(formatDate('2026-03-29')).toBe('Sun 29 Mar');
  });
});
