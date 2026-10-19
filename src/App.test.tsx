import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import type { Booking } from './domain/booking';

// 10:10 Athens (EEST, UTC+3) on Mon 19 Oct 2026.
const NOW = new Date('2026-10-19T07:10:00Z');

const slotsOf = (room: string) =>
  within(screen.getByRole('region', { name: room })).getAllByRole('listitem');

describe('App', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders the app title', () => {
    render(<App now={NOW} />);
    expect(screen.getByRole('heading', { name: 'Room Booking' })).toBeDefined();
  });

  it('offers 7 days with today selected', () => {
    render(<App now={NOW} />);
    const select = screen.getByRole('combobox', { name: /day/i }) as HTMLSelectElement;
    expect(select.options).toHaveLength(7);
    expect(select.value).toBe('2026-10-19');
    expect(select.options[0]?.text).toBe('Mon 19 Oct');
    expect(select.options[6]?.text).toBe('Sun 25 Oct');
  });

  it('shows Room facts', () => {
    render(<App now={NOW} />);
    expect(screen.getByText('Capacity 4')).toBeDefined();
    expect(screen.getByText('Capacity 8')).toBeDefined();
    expect(screen.getByText('Capacity 14 · Projector')).toBeDefined();
    expect(screen.getAllByText(/Projector/)).toHaveLength(1);
  });

  it('marks 08:00-10:00 unavailable and 10:30 free at 10:10', () => {
    render(<App now={NOW} />);
    const items = slotsOf('Small');
    expect(items).toHaveLength(24);
    for (let i = 0; i <= 4; i++) expect(items[i]?.textContent).toContain('Unavailable');
    expect(items[0]?.textContent).toContain('08:00');
    expect(items[5]?.textContent).toContain('10:30');
    expect(items[5]?.textContent).toContain('Free');
  });

  it('re-renders with all Slots free when selecting a future day', () => {
    render(<App now={NOW} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2026-10-20' } });
    for (const room of ['Small', 'Medium', 'Large']) {
      for (const li of slotsOf(room)) expect(li.textContent).toContain('Free');
    }
  });

  it('shows the booker Name on booked Slots, including past ones', () => {
    const bookings: Booking[] = [
      { id: '1', roomId: 'medium', date: '2026-10-19', startSlot: 1, slotCount: 1, name: 'Ann' },
      { id: '2', roomId: 'large', date: '2026-10-19', startSlot: 6, slotCount: 2, name: 'Bo' },
    ];
    render(<App now={NOW} bookings={bookings} />);
    expect(slotsOf('Medium')[1]?.textContent).toContain('Booked: Ann');
    const large = slotsOf('Large');
    expect(large[6]?.textContent).toContain('Booked: Bo');
    expect(large[7]?.textContent).toContain('Booked: Bo');
    expect(large[8]?.textContent).toContain('Free');
  });

  describe('week overview', () => {
    const fixtures: Booking[] = [
      { id: '1', roomId: 'small', date: '2026-10-19', startSlot: 2, slotCount: 2, name: 'Ann' },
      { id: '2', roomId: 'small', date: '2026-10-19', startSlot: 4, slotCount: 3, name: 'Bo' },
      ...[0, 4, 8, 12, 16, 20].map((s, i): Booking => ({
        id: `f${i}`, roomId: 'large', date: '2026-10-21', startSlot: s, slotCount: 4, name: 'Cy',
      })),
    ];
    const overview = () => within(screen.getByRole('region', { name: 'Week overview' }));

    it('shows 3 Rooms x 7 days as 21 buttons with counts, Empty and Full', () => {
      render(<App now={NOW} bookings={fixtures} />);
      expect(overview().getAllByRole('button')).toHaveLength(21);
      expect(overview().getByRole('button', { name: 'Small, Mon 19 Oct, 5/24' }).textContent).toBe('5/24');
      expect(overview().getByRole('button', { name: 'Large, Wed 21 Oct, Full' }).textContent).toBe('Full');
      expect(overview().getByRole('button', { name: 'Medium, Mon 19 Oct, Empty' }).textContent).toBe('Empty');
      expect(overview().getAllByText('Full')).toHaveLength(1);
      expect(overview().getAllByText('Empty')).toHaveLength(19);
    });

    it('selects the day and shows its day view when a cell is clicked', () => {
      render(<App now={NOW} bookings={fixtures} />);
      const select = screen.getByRole('combobox', { name: /day/i }) as HTMLSelectElement;
      const cell = overview().getByRole('button', { name: 'Large, Wed 21 Oct, Full' });
      expect(cell.getAttribute('aria-pressed')).toBe('false');
      fireEvent.click(cell);
      expect(select.value).toBe('2026-10-21');
      expect(cell.getAttribute('aria-pressed')).toBe('true');
      for (const li of slotsOf('Large')) expect(li.textContent).toContain('Booked: Cy');
      for (const li of slotsOf('Small')) expect(li.textContent).toContain('Free');
    });
  });

  it('follows the clock when open without a fixed time', () => {
    vi.useFakeTimers({ now: NOW });
    render(<App />);
    expect(slotsOf('Small')[6]?.textContent).toContain('Free'); // 11:00
    act(() => {
      vi.advanceTimersByTime(60 * 60 * 1000); // 11:10
    });
    expect(slotsOf('Small')[6]?.textContent).toContain('Unavailable');
  });
});
