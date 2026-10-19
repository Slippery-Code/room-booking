import { describe, expect, it } from 'vitest';
import { ROOMS } from './rooms';

describe('ROOMS', () => {
  it('has the three fixed Rooms with capacities', () => {
    expect(ROOMS.map((r) => [r.id, r.capacity])).toEqual([
      ['small', 4],
      ['medium', 8],
      ['large', 14],
    ]);
  });

  it('only the large Room has a projector', () => {
    expect(ROOMS.filter((r) => r.hasProjector).map((r) => r.id)).toEqual(['large']);
  });
});
