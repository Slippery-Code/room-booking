import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Booking } from '../domain/booking';
import { BOOKINGS_KEY, NAME_KEY } from './bookingStore';
import { useBookings } from './useBookings';

// 10:10 Athens on Mon 19 Oct 2026.
const NOW = new Date('2026-10-19T07:10:00Z');
const REQ = { roomId: 'small', date: '2026-10-20', startSlot: 4, slotCount: 2, name: 'Ann' } as const;
const stored = (): Booking[] => JSON.parse(localStorage.getItem(BOOKINGS_KEY) ?? '{"bookings":[]}').bookings;

describe('useBookings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ now: NOW });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('books: generates an id, stores, updates state, returns ok', () => {
    const { result } = renderHook(() => useBookings());
    let r!: ReturnType<typeof result.current.book>;
    act(() => {
      r = result.current.book(REQ);
    });
    expect(r.ok).toBe(true);
    expect(result.current.bookings).toHaveLength(1);
    expect(result.current.bookings[0]?.id).toBeTruthy();
    expect(stored()).toEqual(result.current.bookings);
  });

  it('returns the domain error and writes nothing on refusal', () => {
    const { result } = renderHook(() => useBookings());
    act(() => {
      result.current.book(REQ);
    });
    let r!: ReturnType<typeof result.current.book>;
    act(() => {
      r = result.current.book({ ...REQ, name: 'Bo', startSlot: 5 });
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('overlap');
    expect(stored()).toHaveLength(1);
    expect(result.current.bookings).toHaveLength(1);
  });

  it('refuses a Slot that has already started, using the current time', () => {
    const { result } = renderHook(() => useBookings());
    let r!: ReturnType<typeof result.current.book>;
    act(() => {
      r = result.current.book({ ...REQ, date: '2026-10-19', startSlot: 4 });
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('in_past');
    expect(stored()).toHaveLength(0);
  });

  it('checks against fresh storage, not stale state', () => {
    const { result } = renderHook(() => useBookings());
    const other: Booking = { id: 'x', roomId: 'small', date: '2026-10-20', startSlot: 4, slotCount: 2, name: 'Bo' };
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify({ version: 1, bookings: [other] }));
    let r!: ReturnType<typeof result.current.book>;
    act(() => {
      r = result.current.book(REQ);
    });
    expect(r.ok).toBe(false);
    expect(stored()).toEqual([other]);
  });

  it('loads stored Bookings and Name on mount', () => {
    const b: Booking = { id: 'x', roomId: 'large', date: '2026-10-20', startSlot: 0, slotCount: 1, name: 'Bo' };
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify({ version: 1, bookings: [b] }));
    localStorage.setItem(NAME_KEY, 'Eleni K.');
    const { result } = renderHook(() => useBookings());
    expect(result.current.bookings).toEqual([b]);
    expect(result.current.currentName).toBe('Eleni K.');
  });

  it('loads empty for bad data', () => {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify({ version: 2, bookings: [] }));
    const { result } = renderHook(() => useBookings());
    expect(result.current.bookings).toEqual([]);
    expect(result.current.currentName).toBe('');
  });

  it('returns storage_unavailable and keeps state when setItem throws', () => {
    const { result } = renderHook(() => useBookings());
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    let r!: ReturnType<typeof result.current.book>;
    act(() => {
      r = result.current.book(REQ);
    });
    expect(r).toEqual({ ok: false, error: { code: 'storage_unavailable' } });
    expect(result.current.bookings).toEqual([]);
  });

  it('setName stores the trimmed Name and leaves Bookings alone', () => {
    const { result } = renderHook(() => useBookings());
    act(() => {
      result.current.book(REQ);
    });
    const before = localStorage.getItem(BOOKINGS_KEY);
    act(() => {
      result.current.setName('  Eleni K. ');
    });
    expect(result.current.currentName).toBe('Eleni K.');
    expect(localStorage.getItem(NAME_KEY)).toBe('Eleni K.');
    expect(localStorage.getItem(BOOKINGS_KEY)).toBe(before);
    expect(result.current.bookings[0]?.name).toBe('Ann');
  });

  it('setName updates state even when the write fails', () => {
    const { result } = renderHook(() => useBookings());
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    act(() => {
      result.current.setName('Eleni');
    });
    expect(result.current.currentName).toBe('Eleni');
  });

  it.each([['a key', BOOKINGS_KEY], ['key null', null]])('refreshes on a storage event with %s', (_l, key) => {
    const { result } = renderHook(() => useBookings());
    const b: Booking = { id: 'x', roomId: 'medium', date: '2026-10-20', startSlot: 2, slotCount: 1, name: 'Bo' };
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify({ version: 1, bookings: [b] }));
    localStorage.setItem(NAME_KEY, 'Zed');
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key }));
    });
    expect(result.current.bookings).toEqual([b]);
    expect(result.current.currentName).toBe('Zed');
  });

  describe('cancel', () => {
    const mine: Booking = { id: 'm', roomId: 'small', date: '2026-10-20', startSlot: 4, slotCount: 2, name: 'Ann' };
    const put = (...bs: Booking[]) =>
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify({ version: 1, bookings: bs }));

    it('removes the Booking, stores and updates state', () => {
      put(mine);
      localStorage.setItem(NAME_KEY, ' ANN ');
      const { result } = renderHook(() => useBookings());
      let r!: ReturnType<typeof result.current.cancel>;
      act(() => {
        r = result.current.cancel('m');
      });
      expect(r.ok).toBe(true);
      expect(result.current.bookings).toEqual([]);
      expect(stored()).toEqual([]);
    });

    it.each([
      ['not_owner', 'Bo', 'm'],
      ['not_found', 'Ann', 'zzz'],
    ])('refuses with %s and writes nothing', (code, name, id) => {
      put(mine);
      localStorage.setItem(NAME_KEY, name);
      const { result } = renderHook(() => useBookings());
      let r!: ReturnType<typeof result.current.cancel>;
      act(() => {
        r = result.current.cancel(id);
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe(code);
      expect(stored()).toEqual([mine]);
      expect(result.current.bookings).toEqual([mine]);
    });

    it('refuses a finished Booking', () => {
      const old = { ...mine, date: '2026-10-19', startSlot: 0, slotCount: 1 };
      put(old);
      localStorage.setItem(NAME_KEY, 'Ann');
      const { result } = renderHook(() => useBookings());
      let r!: ReturnType<typeof result.current.cancel>;
      act(() => {
        r = result.current.cancel('m');
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('in_past');
    });

    it('re-reads storage instead of trusting stale state', () => {
      put(mine);
      localStorage.setItem(NAME_KEY, 'Ann');
      const { result } = renderHook(() => useBookings());
      const other = { ...mine, id: 'o', startSlot: 10, name: 'Bo' };
      put(mine, other);
      act(() => {
        result.current.cancel('m');
      });
      expect(stored()).toEqual([other]);
    });

    it('returns storage_unavailable and keeps state when the write fails', () => {
      put(mine);
      localStorage.setItem(NAME_KEY, 'Ann');
      const { result } = renderHook(() => useBookings());
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });
      let r!: ReturnType<typeof result.current.cancel>;
      act(() => {
        r = result.current.cancel('m');
      });
      expect(r).toEqual({ ok: false, error: { code: 'storage_unavailable' } });
      expect(result.current.bookings).toEqual([mine]);
    });
  });
});
