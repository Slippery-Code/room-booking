import type { Booking } from './booking';
import { nameKey } from './name';
import { athensDate, athensSlotIndex } from './time';

/** A Booking has ended iff its date is before today, or it is today and its end Slot is at or before the current Slot index. */
export function hasEnded(booking: Booking, now: Date): boolean {
  const today = athensDate(now);
  return (
    booking.date < today ||
    (booking.date === today && booking.startSlot + booking.slotCount <= athensSlotIndex(now))
  );
}

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
  return bookings
    .filter((b) => nameKey(b.name) === key && !hasEnded(b, now))
    .sort(
      (a, b) =>
        (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) ||
        a.startSlot - b.startSlot ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
}
