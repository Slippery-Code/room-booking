import { useEffect, useState } from 'react';
import { busyness } from './domain/busyness';
import { dayGrid } from './domain/dayGrid';
import type { Booking } from './domain/booking';
import { ROOMS } from './domain/rooms';
import { athensDate, formatDate, slotLabel, windowDates } from './domain/time';

interface AppProps {
  now?: Date;
  bookings?: readonly Booking[];
}

const SLOTS_PER_DAY = 24;
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
  const busynessByDate = new Map(dates.map((d) => [d, busyness(bookings, d)]));

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
      <section className="overview" aria-label="Week overview">
        <h2>Week overview</h2>
        <table>
          <thead>
            <tr>
              <th scope="col">Room</th>
              {dates.map((d) => (
                <th
                  key={d}
                  scope="col"
                  className={d === selected ? 'overview-selected' : undefined}
                >
                  {formatDate(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROOMS.map((room) => (
              <tr key={room.id}>
                <th scope="row">{room.name}</th>
                {dates.map((d) => {
                  const booked =
                    busynessByDate.get(d)?.find((r) => r.roomId === room.id)?.bookedSlots ?? 0;
                  const level = booked === 0 ? 'empty' : booked === SLOTS_PER_DAY ? 'full' : 'part';
                  const text =
                    level === 'empty' ? 'Empty' : level === 'full' ? 'Full' : `${booked}/${SLOTS_PER_DAY}`;
                  return (
                    <td key={d}>
                      <button
                        type="button"
                        className={`overview-cell overview-${level}${d === selected ? ' overview-selected' : ''}`}
                        aria-label={`${room.name}, ${formatDate(d)}, ${text}`}
                        aria-pressed={d === selected}
                        onClick={() => setSelected(d)}
                      >
                        {text}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
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
