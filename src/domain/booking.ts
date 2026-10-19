import { nameKey } from './name';
import type { Result } from './result';
import type { RoomId } from './rooms';
import { athensDate, athensSlotIndex, windowDates } from './time';

/** A reservation. Dates are Athens 'YYYY-MM-DD'; slots are ints 0..23; slotCount 1..4. */
export interface Booking {
  readonly id: string;
  readonly roomId: RoomId;
  readonly date: string;
  readonly startSlot: number;
  readonly slotCount: number;
  readonly name: string;
}

/** A Booking to create; the caller generates the id. */
export type BookingRequest = Booking;

export type DomainError =
  | { readonly code: 'name_required' }
  | { readonly code: 'bad_length' }
  | { readonly code: 'outside_grid' }
  | { readonly code: 'outside_window' }
  | { readonly code: 'in_past' };

export interface CreatedBooking {
  readonly bookings: readonly Booking[];
  readonly created: Booking;
}

const MAX_SLOTS = 4;
const SLOTS_PER_DAY = 24;

/**
 * Validates a request and returns a new list with the Booking appended.
 * Check order: name, length, grid, window, past. First failure wins.
 */
export function createBooking(
  bookings: readonly Booking[],
  request: BookingRequest,
  now: Date,
): Result<CreatedBooking, DomainError> {
  const name = request.name.trim();
  if (nameKey(name) === '') return fail({ code: 'name_required' });

  const { startSlot, slotCount } = request;
  if (!Number.isInteger(slotCount) || slotCount < 1 || slotCount > MAX_SLOTS) {
    return fail({ code: 'bad_length' });
  }
  if (!Number.isInteger(startSlot) || startSlot < 0 || startSlot + slotCount > SLOTS_PER_DAY) {
    return fail({ code: 'outside_grid' });
  }

  if (!windowDates(now).includes(request.date)) return fail({ code: 'outside_window' });

  if (request.date === athensDate(now) && startSlot <= athensSlotIndex(now)) {
    return fail({ code: 'in_past' });
  }

  const created: Booking = { ...request, name };
  return { ok: true, value: { bookings: [...bookings, created], created } };
}

function fail(error: DomainError): Result<never, DomainError> {
  return { ok: false, error };
}
