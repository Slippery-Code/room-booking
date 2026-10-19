import type { Booking } from './booking';
import { nameKey } from './name';
import { athensDate, athensSlotIndex } from './time';

/**
 * Upcoming Bookings under `name` (matched via nameKey), sorted by date,
 * then startSlot, then id. A Booking has ended iff its date is before today,
 * or it is today and its end Slot is at or before the current Slot index.
 */
export function ownBookings(
  bookings: readonly Booking[],
  name: string,
  now: Date,
): Booking[] {
  const key = nameKey(name);
  if (key === '') return [];
  const today = athensDate(now);
  const slotNow = athensSlotIndex(now);
  const ended = (b: Booking): boolean =>
    b.date < today || (b.date === today && b.startSlot + b.slotCount <= slotNow);
  return bookings
    .filter((b) => nameKey(b.name) === key && !ended(b))
    .sort(
      (a, b) =>
        (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) ||
        a.startSlot - b.startSlot ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
}
