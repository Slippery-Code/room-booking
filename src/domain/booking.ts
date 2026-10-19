import type { RoomId } from './rooms';

/** A reservation. Dates are Athens 'YYYY-MM-DD'; slots are ints 0..23; slotCount 1..4. */
export interface Booking {
  readonly id: string;
  readonly roomId: RoomId;
  readonly date: string;
  readonly startSlot: number;
  readonly slotCount: number;
  readonly name: string;
}
