import type { Booking } from './booking';
import { ROOMS, type RoomId } from './rooms';

const SLOTS_PER_DAY = 24;

export interface RoomBusyness {
  readonly roomId: RoomId;
  /** Distinct booked Slots of the day, integer 0..24. */
  readonly bookedSlots: number;
}

/**
 * Busyness of each Room on `date`, in ROOMS order. Counts distinct booked
 * Slots (half-open startSlot..startSlot+slotCount), clamped to the day.
 */
export function busyness(
  bookings: readonly Booking[],
  date: string,
): RoomBusyness[] {
  return ROOMS.map((room) => {
    const booked = new Set<number>();
    for (const b of bookings) {
      if (b.roomId !== room.id || b.date !== date) continue;
      const from = Math.max(0, b.startSlot);
      const to = Math.min(SLOTS_PER_DAY, b.startSlot + b.slotCount);
      for (let slot = from; slot < to; slot++) booked.add(slot);
    }
    return { roomId: room.id, bookedSlots: booked.size };
  });
}
