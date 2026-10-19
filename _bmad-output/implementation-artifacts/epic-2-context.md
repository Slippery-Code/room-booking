# Epic 2 Context: Book a Room

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A Member picks a free time, types their Name once, and books a Room. Double bookings, over-long Bookings and Daily Allowance overruns are refused with clear, specific messages, and Bookings and the remembered Name survive reload and browser restart. This epic delivers the core rule engine and persistence that make the booking guarantees trustworthy; the prototype validates the booking flow with about 50 coworking Members.

## Stories

- Story 2.1: Booking validity rules and Name matching
- Story 2.2: No double bookings and Daily Allowance
- Story 2.3: Persist Bookings and the remembered Name
- Story 2.4: Booking form with clear refusals

## Requirements & Constraints

- A Booking is one Room, one day inside the Booking Window (today + 6, Europe/Athens), on 30-minute Slot boundaries, 30 minutes to 2 hours, within 08:00-20:00, with no past Slots (the in-progress Slot counts as past) and a non-blank Name.
- Overlapping Bookings in the same Room are refused with a message identifying the conflict. Back-to-back is allowed, and the outcome must not depend on attempt order.
- Daily Allowance: at most 2 hours per Member per day across all Rooms, matched by Name. Finished Bookings still count. A refusal states the remaining minutes.
- Name matching is case-insensitive and ignores surrounding spaces, everywhere a Name is compared.
- The Name is typed once, remembered on the device, prefilled later and changeable. Changing it never rewrites existing Bookings.
- Persistence is browser-local only. The page must plainly state that Bookings are visible only on this device. Data survives reload and restart. No network is needed after load.
- Success criteria: zero double bookings in any device's data; booking on a phone in under 30 seconds with Name remembered, without weakening overlap or allowance checks for speed.
- Every domain rule needs unit tests with edge cases: slot boundaries (08:00, 20:00), back-to-back, exactly 2 h versus 2 h plus one Slot, Name spacing and case, Athens midnight and DST, order independence.
- Repo constraints: no new runtime dependencies, strict TS, no `any` or `@ts-ignore`, do not touch workflows, `vite.config.ts` or `tsconfig.json`, and `npm run verify` must pass.

## Technical Decisions

- Layering: `ui` -> `storage` -> `domain`. `domain` is pure TS and imports nothing outside itself, never reads the clock, and takes `now: Date` as an argument. Only the UI shell calls `new Date()`.
- Only `Booking[]` and the Name are persisted. Everything else is derived. Booking shape is `{ id, roomId, date, startSlot, slotCount, name }`, with no `endSlot` (the exclusive end is `startSlot + slotCount`). Room ids are `small | medium | large`.
- Time model: dates are Athens `'YYYY-MM-DD'` strings. Times are slot ints 0..23 (slot 0 = 08:00). `slotCount` is 1..4. Overlap uses a half-open range. Only `src/domain/time.ts` converts instants. Only `slotLabel` and `formatDate` format times and dates.
- Mutations: only `createBooking(bookings, request, now)` produces a new list, returning `Result<T, E>`. Success is `{ ok: true, value: { bookings, created } }`. Rule failures never throw, and the input is not mutated. Check order is name, length/grid, window, past, overlap, allowance, and the first failure is returned.
- `DomainError` is a union discriminated on `code`: `name_required`, `bad_length`, `outside_grid`, `outside_window`, `in_past`, `overlap` (with `conflicts` sorted by `startSlot`), `allowance_exceeded` (with remaining minutes). The domain has no user-facing strings, and the UI maps each code to a message.
- `nameKey(name) = name.normalize('NFC').trim().toLowerCase()` in `src/domain/name.ts` is the only Name comparison. An empty key means `name_required`. The stored Name is trimmed but keeps the user's casing.
- Storage (`src/storage/` only, the sole `localStorage` user): the `useBookings` hook exposes `bookings`, `currentName`, `book(requestWithoutId)`, `cancel`, `setName`.
  - `book` generates the id in the shell (`crypto.randomUUID()` with a `getRandomValues` fallback), re-reads storage, applies `createBooking` to the fresh list, writes, then updates React state and returns the `Result`.
  - Keys are `room-booking:v1` (`{ version: 1, bookings }`) and `room-booking:name`.
  - Missing, corrupt, wrong-version or wrongly shaped data loads as empty. A write failure returns an error Result and leaves state unchanged.
  - State refreshes on `storage` events, including `key === null`.
  - Storage tests use jsdom `localStorage`.
- UI: view state only in React, no router, no state library, plain CSS in `src/styles.css` with mobile-first styling. UI tests use Testing Library.

## UX & Interaction Patterns

- Tapping a free Slot in the day view opens a booking form for that Room, day and start. The end time adjusts in 30-minute steps from 30 minutes to 2 hours. The Name field is prefilled from `currentName`.
- Success shows a confirmation (Room, day, `HH:mm-HH:mm`), the Slots then show as booked with the Name, and the Name is remembered.
- A refusal keeps the form open so the Member can change the time. Messages are plain: `overlap` names the conflicting Booking's time and booker, `allowance_exceeded` states the minutes left today, and blank Name, bad length, past and out-of-window cases each get a message.
- Example edge case: with 14:30 booked, extending 14:00 to 15:00 is refused with a message naming the conflict.
- The per-device storage notice is visible on the page.

## Cross-Story Dependencies

- 2.1 introduces `nameKey` and the `createBooking` validity checks. 2.2 extends the same function with overlap and allowance (overlap is reported before allowance), so 2.2 depends on 2.1.
- 2.3 wraps `createBooking` in the `useBookings` hook, and 2.4 consumes the hook and the `DomainError` codes. 2.4 therefore depends on 2.1-2.3.
- Depends on Epic 1: the Athens time helpers and Room constants (`time.ts`, `rooms.ts`), and the day view that hosts the Slot tap.
- Feeds Epic 3: `cancelBooking` and the own-Bookings query reuse `nameKey` and the hook, and verify that cancelling restores allowance.
- Epic 4 later adds architecture guard tests for the purity and single-owner rules, so code written here must already comply.
