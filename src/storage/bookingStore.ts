import type { Booking } from '../domain/booking';
import { ROOMS } from '../domain/rooms';

export const BOOKINGS_KEY = 'room-booking:v1';
export const NAME_KEY = 'room-booking:name';

const STORAGE_VERSION = 1;
const SLOTS_PER_DAY = 24;
const MAX_SLOTS = 4;

const isInt = (value: unknown, min: number, max: number): boolean =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

/** True when `value` has every Booking field with a valid type and a known Room. */
export function isBooking(value: unknown): value is Booking {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
    typeof v.roomId === 'string' &&
    ROOMS.some((r) => r.id === v.roomId) &&
    isInt(v.startSlot, 0, SLOTS_PER_DAY - 1) &&
    isInt(v.slotCount, 1, MAX_SLOTS) &&
    (v.startSlot as number) + (v.slotCount as number) <= SLOTS_PER_DAY
  );
}

/** Loads Bookings; missing, corrupt, wrong-version or wrongly shaped data yields []. */
export function loadBookings(): Booking[] {
  try {
    const raw = window.localStorage.getItem(BOOKINGS_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return [];
    const { version, bookings } = parsed as Record<string, unknown>;
    if (version !== STORAGE_VERSION || !Array.isArray(bookings)) return [];
    if (!bookings.every(isBooking)) return [];
    return bookings.map((b) => ({
      id: b.id,
      roomId: b.roomId,
      date: b.date,
      startSlot: b.startSlot,
      slotCount: b.slotCount,
      name: b.name,
    }));
  } catch {
    return [];
  }
}

/** Writes Bookings. Returns false instead of throwing when storage is unavailable. */
export function saveBookings(bookings: readonly Booking[]): boolean {
  try {
    window.localStorage.setItem(
      BOOKINGS_KEY,
      JSON.stringify({ version: STORAGE_VERSION, bookings }),
    );
    return true;
  } catch {
    return false;
  }
}

/** Loads the remembered Name, or '' when none is stored or storage is unreadable. */
export function loadName(): string {
  try {
    return window.localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Stores the trimmed Name. Returns false instead of throwing on failure. */
export function saveName(name: string): boolean {
  try {
    window.localStorage.setItem(NAME_KEY, name.trim());
    return true;
  } catch {
    return false;
  }
}

/** A new Booking id: crypto.randomUUID(), else a getRandomValues-based fallback. */
export function newId(): string {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes = c.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10).join(''),
  ].join('-');
}
