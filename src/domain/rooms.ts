export type RoomId = 'small' | 'medium' | 'large';

export interface Room {
  readonly id: RoomId;
  readonly name: string;
  readonly capacity: number;
  readonly hasProjector: boolean;
}

/** Fixed Rooms of the space. Constants only: never persisted. */
export const ROOMS: readonly Room[] = [
  { id: 'small', name: 'Small', capacity: 4, hasProjector: false },
  { id: 'medium', name: 'Medium', capacity: 8, hasProjector: false },
  { id: 'large', name: 'Large', capacity: 14, hasProjector: true },
];
