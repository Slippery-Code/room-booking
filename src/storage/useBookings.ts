import { useCallback, useEffect, useState } from 'react';
import { cancelBooking } from '../domain/cancelBooking';
import { createBooking } from '../domain/booking';
import type { Booking, CreatedBooking, DomainError } from '../domain/booking';
import type { CancelledBooking } from '../domain/cancelBooking';
import type { Result } from '../domain/result';
import { loadBookings, loadName, newId, saveBookings, saveName } from './bookingStore';

export interface StorageError {
  readonly code: 'storage_unavailable';
}

export type BookRequest = Omit<Booking, 'id'>;

export interface UseBookings {
  readonly bookings: readonly Booking[];
  readonly currentName: string;
  book: (request: BookRequest) => Result<CreatedBooking, DomainError | StorageError>;
  cancel: (id: string) => Result<CancelledBooking, DomainError | StorageError>;
  setName: (name: string) => void;
}

export function useBookings(): UseBookings {
  const [bookings, setBookings] = useState<readonly Booking[]>(loadBookings);
  const [currentName, setCurrentName] = useState<string>(loadName);

  useEffect(() => {
    const refresh = () => {
      setBookings(loadBookings());
      setCurrentName(loadName());
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const book = useCallback(
    (request: BookRequest): Result<CreatedBooking, DomainError | StorageError> => {
      const fresh = loadBookings();
      const result = createBooking(fresh, { ...request, id: newId() }, new Date());
      if (!result.ok) return result;
      if (!saveBookings(result.value.bookings)) {
        return { ok: false, error: { code: 'storage_unavailable' } };
      }
      setBookings(result.value.bookings);
      return result;
    },
    [],
  );

  const cancel = useCallback(
    (id: string): Result<CancelledBooking, DomainError | StorageError> => {
      const fresh = loadBookings();
      const result = cancelBooking(fresh, id, currentName, new Date());
      if (!result.ok) return result;
      if (!saveBookings(result.value.bookings)) {
        return { ok: false, error: { code: 'storage_unavailable' } };
      }
      setBookings(result.value.bookings);
      return result;
    },
    [currentName],
  );

  const setName = useCallback((name: string) => {
    const trimmed = name.trim();
    saveName(trimmed);
    setCurrentName(trimmed);
  }, []);

  return { bookings, currentName, book, cancel, setName };
}
