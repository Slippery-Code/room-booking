import type { Booking, DomainError } from './booking';
import { nameKey } from './name';
import { hasEnded } from './ownBookings';
import type { Result } from './result';

export interface CancelledBooking {
  readonly bookings: readonly Booking[];
}

/**
 * Removes the Booking `id` if `requesterName` owns it (via nameKey) and it has not ended.
 * Check order: not_found, not_owner, in_past. The input list is never mutated.
 */
export function cancelBooking(
  bookings: readonly Booking[],
  id: string,
  requesterName: string,
  now: Date,
): Result<CancelledBooking, DomainError> {
  const target = bookings.find((b) => b.id === id);
  if (!target) return { ok: false, error: { code: 'not_found' } };
  const key = nameKey(requesterName);
  if (key === '' || nameKey(target.name) !== key) {
    return { ok: false, error: { code: 'not_owner' } };
  }
  if (hasEnded(target, now)) return { ok: false, error: { code: 'in_past' } };
  return { ok: true, value: { bookings: bookings.filter((b) => b.id !== id) } };
}
