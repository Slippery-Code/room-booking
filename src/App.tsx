import { useEffect, useState } from 'react';
import { dayGrid } from './domain/dayGrid';
import type { Booking } from './domain/booking';
import { ROOMS } from './domain/rooms';
import { athensDate, formatDate, slotLabel, windowDates } from './domain/time';

interface AppProps {
  now?: Date;
  bookings?: readonly Booking[];
}

const CLOCK_TICK_MS = 30_000;
const NO_BOOKINGS: readonly Booking[] = [];

export function App({ now: nowProp, bookings = NO_BOOKINGS }: AppProps) {
  const [clock, setClock] = useState(() => new Date());
  const now = nowProp ?? clock;
  useEffect(() => {
    if (nowProp) return;
    const id = setInterval(() => setClock(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, [nowProp]);
  const dates = windowDates(now);
  const [picked, setSelected] = useState(() => athensDate(now));
  // The window moves at midnight; fall back to today if the pick left it.
  const selected = dates.includes(picked) ? picked : (dates[0] ?? picked);
  const grid = dayGrid(bookings, selected, now);

  return (
    <main className="app">
      <h1>Room Booking</h1>
      <label className="day-picker">
        Day{' '}
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatDate(d)}
            </option>
          ))}
        </select>
      </label>
      <div className="rooms">
        {ROOMS.map((room) => {
          const day = grid.find((g) => g.roomId === room.id);
          return (
            <section key={room.id} className="room" aria-label={room.name}>
              <h2>{room.name}</h2>
              <p className="room-facts">
                Capacity {room.capacity}
                {room.hasProjector ? ' · Projector' : ''}
              </p>
              <ul className="slots">
                {day?.cells.map((cell) => {
                  const state = cell.booking ? 'booked' : cell.past ? 'unavailable' : 'free';
                  const text = cell.booking
                    ? `Booked: ${cell.booking.name}`
                    : cell.past
                      ? 'Unavailable'
                      : 'Free';
                  return (
                    <li key={cell.slot} className={`slot slot-${state}`}>
                      <span className="slot-time">{slotLabel(cell.slot)}</span>{' '}
                      <span className="slot-state">{text}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
