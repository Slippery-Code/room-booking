import type { Booking } from './booking';
import { ROOMS, type RoomId } from './rooms';
import { athensDate, athensSlotIndex } from './time';

const SLOTS_PER_DAY = 24;

export interface Cell {
  readonly slot: number;
  readonly booking: Booking | null;
  readonly past: boolean;
}

export interface RoomDay {
  readonly roomId: RoomId;
  readonly cells: readonly Cell[];
}

// Index of the last Slot of `today` that starts strictly before `now`.
// At exactly Athens midnight the instant before belongs to yesterday: none.
function slotBefore(now: Date, today: string): number {
  const before = new Date(now.getTime() - 1);
  return athensDate(before) === today ? athensSlotIndex(before) : -1;
}

/**
 * Day grid: 3 Rooms x 24 cells. `booking` and `past` are independent.
 * A Slot is past iff its start is strictly before `now`.
 */
export function dayGrid(
  bookings: readonly Booking[],
  date: string,
  now: Date,
): RoomDay[] {
  const today = athensDate(now);
  // Last Slot whose start is strictly before now (-1: none, 24: all).
  const lastPast =
    date < today
      ? SLOTS_PER_DAY
      : date > today
        ? -1
        : slotBefore(now, today);

  return ROOMS.map((room) => {
    const cells: Cell[] = [];
    for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
      const booking =
        bookings.find(
          (b) =>
            b.roomId === room.id &&
            b.date === date &&
            slot >= b.startSlot &&
            slot < b.startSlot + b.slotCount,
        ) ?? null;
      cells.push({ slot, booking, past: slot <= lastPast });
    }
    return { roomId: room.id, cells };
  });
}
