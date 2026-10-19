import { useEffect, useState } from 'react';
import { busyness } from './domain/busyness';
import { dayGrid } from './domain/dayGrid';
import { ownBookings } from './domain/ownBookings';
import type { Booking, CreatedBooking, DomainError } from './domain/booking';
import type { Result } from './domain/result';
import { ROOMS, type RoomId } from './domain/rooms';
import { BookingForm } from './BookingForm';
import { refusalMessage } from './refusalMessage';
import type { CancelledBooking } from './domain/cancelBooking';
import type { BookRequest, StorageError } from './storage/useBookings';
import { athensDate, formatDate, slotLabel, windowDates } from './domain/time';

interface AppProps {
  now?: Date;
  bookings?: readonly Booking[];
  currentName?: string;
  book?: (request: BookRequest) => Result<CreatedBooking, DomainError | StorageError>;
  cancel?: (id: string) => Result<CancelledBooking, DomainError | StorageError>;
  setName?: (name: string) => void;
}

interface FormTarget {
  roomId: RoomId;
  date: string;
  startSlot: number;
}

const unavailable = (): Result<CreatedBooking, StorageError> => ({
  ok: false,
  error: { code: 'storage_unavailable' },
});
const cannotCancel = (): Result<CancelledBooking, StorageError> => ({
  ok: false,
  error: { code: 'storage_unavailable' },
});
const ignore = (): void => undefined;

const SLOTS_PER_DAY = 24;
const CLOCK_TICK_MS = 30_000;
const NO_BOOKINGS: readonly Booking[] = [];

export function App({
  now: nowProp,
  bookings = NO_BOOKINGS,
  currentName = '',
  book = unavailable,
  cancel = cannotCancel,
  setName = ignore,
}: AppProps) {
  const [target, setTarget] = useState<FormTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

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
  const mine = ownBookings(bookings, currentName, now);
  const busynessByDate = new Map(dates.map((d) => [d, busyness(bookings, d)]));

  const openForm = (next: FormTarget) => {
    setTarget(next);
    setError(null);
    setConfirmation(null);
  };
  const closeForm = () => {
    setTarget(null);
    setError(null);
  };
  const selectDay = (date: string) => {
    setSelected(date);
    closeForm();
  };
  const submit = (name: string, slotCount: number) => {
    if (!target) return;
    const result = book({ ...target, slotCount, name });
    if (!result.ok) {
      setError(refusalMessage(result.error));
      return;
    }
    const { created } = result.value;
    setName(created.name);
    const room = ROOMS.find((r) => r.id === created.roomId);
    setConfirmation(
      `Booked ${room?.name ?? created.roomId}, ${formatDate(created.date)}, ` +
        `${slotLabel(created.startSlot)}-${slotLabel(created.startSlot + created.slotCount)}`,
    );
    closeForm();
  };
  const cancelOne = (id: string) => {
    const result = cancel(id);
    setCancelError(result.ok ? null : refusalMessage(result.error));
  };
  const targetRoom = target ? ROOMS.find((r) => r.id === target.roomId) : undefined;

  return (
    <main className="app">
      <h1>Room Booking</h1>
      <p className="storage-notice">Bookings are stored only on this device.</p>
      {confirmation && (
        <p className="booking-confirmation" role="status">
          {confirmation}
        </p>
      )}
      {target && targetRoom && (
        <BookingForm
          key={`${target.roomId}|${target.date}|${target.startSlot}`}
          roomName={targetRoom.name}
          dayLabel={formatDate(target.date)}
          startSlot={target.startSlot}
          initialName={currentName}
          error={error}
          onSubmit={submit}
          onCancel={closeForm}
        />
      )}
      <section className="my-bookings" aria-label="My Bookings">
        <h2>My Bookings</h2>
        {cancelError && (
          <p className="cancel-error" role="alert">
            {cancelError}
          </p>
        )}
        {mine.length === 0 ? (
          <p className="my-bookings-empty">No upcoming bookings.</p>
        ) : (
          <ul className="my-bookings-list">
            {mine.map((b) => {
              const label = `${ROOMS.find((r) => r.id === b.roomId)?.name ?? b.roomId}, ${formatDate(b.date)}, ${slotLabel(b.startSlot)}-${slotLabel(b.startSlot + b.slotCount)}`;
              return (
                <li key={b.id}>
                  <span className="my-booking-text">{label}</span>
                  <button
                    type="button"
                    className="my-booking-cancel"
                    aria-label={`Cancel ${label}`}
                    onClick={() => cancelOne(b.id)}
                  >
                    Cancel
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <label className="day-picker">
        Day{' '}
        <select value={selected} onChange={(e) => selectDay(e.target.value)}>
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
                        onClick={() => selectDay(d)}
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
                      {state === 'free' ? (
                        <button
                          type="button"
                          className="slot-state slot-book"
                          aria-label={`Book ${room.name} ${slotLabel(cell.slot)}`}
                          onClick={() =>
                            openForm({ roomId: room.id, date: selected, startSlot: cell.slot })
                          }
                        >
                          {text}
                        </button>
                      ) : (
                        <span className="slot-state">{text}</span>
                      )}
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
