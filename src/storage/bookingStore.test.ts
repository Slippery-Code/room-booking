import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Booking } from '../domain/booking';
import {
  BOOKINGS_KEY,
  NAME_KEY,
  isBooking,
  loadBookings,
  loadName,
  newId,
  saveBookings,
  saveName,
} from './bookingStore';

const B: Booking = { id: 'a', roomId: 'small', date: '2026-10-19', startSlot: 4, slotCount: 2, name: 'Ann' };

describe('bookingStore', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('round-trips Bookings under the versioned key', () => {
    expect(saveBookings([B])).toBe(true);
    expect(JSON.parse(localStorage.getItem(BOOKINGS_KEY)!)).toEqual({ version: 1, bookings: [B] });
    expect(loadBookings()).toEqual([B]);
  });

  it('loads [] when nothing is stored', () => {
    expect(loadBookings()).toEqual([]);
  });

  it.each([
    ['invalid JSON', '{nope'],
    ['null', 'null'],
    ['wrong version', JSON.stringify({ version: 2, bookings: [B] })],
    ['non-array', JSON.stringify({ version: 1, bookings: {} })],
    ['missing field', JSON.stringify({ version: 1, bookings: [{ ...B, name: undefined }] })],
    ['bad room', JSON.stringify({ version: 1, bookings: [{ ...B, roomId: 'huge' }] })],
    ['negative start slot', JSON.stringify({ version: 1, bookings: [{ ...B, startSlot: -1 }] })],
    ['zero slot count', JSON.stringify({ version: 1, bookings: [{ ...B, slotCount: 0 }] })],
    ['booking past the end of the day', JSON.stringify({ version: 1, bookings: [{ ...B, startSlot: 22, slotCount: 4 }] })],
    ['malformed date', JSON.stringify({ version: 1, bookings: [{ ...B, date: 'tomorrow' }] })],
    ['non-integer slot', JSON.stringify({ version: 1, bookings: [{ ...B, startSlot: 1.5 }] })],
    ['one bad item among good', JSON.stringify({ version: 1, bookings: [B, { ...B, slotCount: 'x' }] })],
  ])('loads [] for %s', (_label, raw) => {
    localStorage.setItem(BOOKINGS_KEY, raw);
    expect(loadBookings()).toEqual([]);
  });

  it('loads [] and does not throw when getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(loadBookings()).toEqual([]);
    expect(loadName()).toBe('');
  });

  it('a later save overwrites corrupt data', () => {
    localStorage.setItem(BOOKINGS_KEY, '{nope');
    saveBookings([B]);
    expect(loadBookings()).toEqual([B]);
  });

  it('returns false when setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(saveBookings([B])).toBe(false);
    expect(saveName('Ann')).toBe(false);
  });

  it('stores the trimmed Name without touching Bookings', () => {
    saveBookings([B]);
    expect(saveName('  Eleni K.  ')).toBe(true);
    expect(localStorage.getItem(NAME_KEY)).toBe('Eleni K.');
    expect(loadName()).toBe('Eleni K.');
    expect(loadBookings()).toEqual([B]);
  });

  it('loadName is empty when missing', () => {
    expect(loadName()).toBe('');
  });

  it('isBooking rejects non-objects', () => {
    expect(isBooking(null)).toBe(false);
    expect(isBooking('x')).toBe(false);
    expect(isBooking(B)).toBe(true);
  });

  it('newId uses randomUUID when available and unique ids otherwise', () => {
    expect(newId()).toMatch(/^[0-9a-f-]{36}$/);
    const original = globalThis.crypto.randomUUID;
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      const a = newId();
      const b = newId();
      expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(a).not.toBe(b);
    } finally {
      Object.defineProperty(globalThis.crypto, 'randomUUID', { value: original, configurable: true });
    }
  });
});
