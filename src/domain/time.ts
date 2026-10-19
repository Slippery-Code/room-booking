const ZONE = 'Europe/Athens';
const OPEN_MINUTES = 8 * 60;
const SLOT_MINUTES = 30;
const SLOTS_PER_DAY = 24;
const WINDOW_DAYS = 7;

const athensParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

interface Parts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function partsOf(now: Date): Parts {
  const out: Parts = { year: 0, month: 0, day: 0, hour: 0, minute: 0 };
  for (const p of athensParts.formatToParts(now)) {
    if (
      p.type === 'year' || p.type === 'month' || p.type === 'day' ||
      p.type === 'hour' || p.type === 'minute'
    ) {
      out[p.type] = Number(p.value);
    }
  }
  return out;
}

function parseDate(date: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid date: ${date}`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

const pad = (n: number, width: number): string => String(n).padStart(width, '0');

function ymd(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

/** Athens calendar date of an instant, as 'YYYY-MM-DD'. */
export function athensDate(now: Date): string {
  const p = partsOf(now);
  return ymd(p.year, p.month, p.day);
}

/**
 * Athens Slot index of an instant. 0..23 while open (08:00-20:00).
 * Returns -1 before opening (all Slots are future) and 24 from closing
 * time on (all Slots are past).
 */
export function athensSlotIndex(now: Date): number {
  const p = partsOf(now);
  const minutes = p.hour * 60 + p.minute - OPEN_MINUTES;
  if (minutes < 0) return -1;
  const slot = Math.floor(minutes / SLOT_MINUTES);
  return slot >= SLOTS_PER_DAY ? SLOTS_PER_DAY : slot;
}

/** Exactly 7 consecutive Athens dates starting today (y/m/d arithmetic). */
export function windowDates(now: Date): string[] {
  const { y, m, d } = parseDate(athensDate(now));
  const dates: string[] = [];
  for (let i = 0; i < WINDOW_DAYS; i++) {
    const t = new Date(Date.UTC(y, m - 1, d + i));
    dates.push(ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()));
  }
  return dates;
}

/** 'HH:mm' start time of a Slot: 0 -> '08:00', 23 -> '19:30'. */
export function slotLabel(slot: number): string {
  const minutes = OPEN_MINUTES + slot * SLOT_MINUTES;
  return `${pad(Math.floor(minutes / 60), 2)}:${pad(minutes % 60, 2)}`;
}

const dateLabel = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** Human label for a 'YYYY-MM-DD' date, e.g. 'Mon 19 Oct'. */
export function formatDate(date: string): string {
  const { y, m, d } = parseDate(date);
  return dateLabel.format(new Date(Date.UTC(y, m - 1, d))).replace(',', '');
}
