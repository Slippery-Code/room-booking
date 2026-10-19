import { useState } from 'react';
import type { FormEvent } from 'react';
import { slotLabel } from './domain/time';

const MAX_SLOTS = 4;
const SLOTS_PER_DAY = 24;

interface BookingFormProps {
  roomName: string;
  dayLabel: string;
  startSlot: number;
  initialName: string;
  error: string | null;
  onSubmit: (name: string, slotCount: number) => void;
  onCancel: () => void;
}

export function BookingForm({
  roomName,
  dayLabel,
  startSlot,
  initialName,
  error,
  onSubmit,
  onCancel,
}: BookingFormProps) {
  const [name, setName] = useState(initialName);
  const [slotCount, setSlotCount] = useState(1);
  const options = Array.from(
    { length: Math.min(MAX_SLOTS, SLOTS_PER_DAY - startSlot) },
    (_, i) => i + 1,
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(name, slotCount);
  };

  return (
    <form className="booking-form" aria-label="Book a room" onSubmit={submit}>
      <h2>Book a room</h2>
      <dl className="booking-facts">
        <dt>Room</dt>
        <dd>{roomName}</dd>
        <dt>Day</dt>
        <dd>{dayLabel}</dd>
        <dt>Start</dt>
        <dd>{slotLabel(startSlot)}</dd>
      </dl>
      <label>
        End
        <select value={slotCount} onChange={(e) => setSlotCount(Number(e.target.value))}>
          {options.map((n) => (
            <option key={n} value={n}>
              {slotLabel(startSlot + n)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Name
        <input type="text" value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
      </label>
      {error && (
        <p className="booking-error" role="alert">
          {error}
        </p>
      )}
      <div className="booking-actions">
        <button type="submit">Confirm booking</button>
        <button type="button" onClick={onCancel}>
          Close
        </button>
      </div>
    </form>
  );
}
