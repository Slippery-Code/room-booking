# Epic 3 Context: Manage My Bookings

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A Member can see their own upcoming Bookings and cancel one. Cancelling frees the Slots immediately in the day view, lowers Busyness in the week overview, and restores the Member's Daily Allowance. There are no logins, so identity is the Name typed on the device, and the trust model is deliberately light: anyone who types the same Name can cancel that Booking.

## Stories

- Story 3.1: Own Bookings list
- Story 3.2: Cancel a Booking

## Requirements & Constraints

- Own Bookings are matched by Name (case-insensitive, surrounding spaces ignored) and shown as Room, day and `HH:mm-HH:mm`.
- Only upcoming Bookings are listed. A Booking that ends at or before `now` is excluded, including one ending exactly at `now`.
- Show an empty-state message when there are no upcoming Bookings or no Name is set.
- Cancelling requires a matching Name. Bookings cannot be edited; the only path is cancel and rebook.
- Finished Bookings cannot be cancelled.
- A cancelled Booking's time must count back toward the 2 h Daily Allowance. Verify this in tests: a Member at 2 h cancels 1 h, then books 1 h successfully.
- Cancelling must work with no network. Data stays on this device only.
- Rules need unit tests with edge cases, and `npm run verify` must pass.

## Technical Decisions

- `cancelBooking(bookings, id, requesterName, now)` is the only way to remove a Booking. It lives in `src/domain/`, is pure, and returns a `Result`. Success is `{ ok: true, value: { bookings } }`, a new array without the Booking.
- Errors are `not_owner`, `not_found` and `in_past`. The list is unchanged on error. The domain has no user-facing strings; the UI maps error codes to messages.
- Name comparison goes only through `nameKey(name)` (NFC normalise, trim, lowercase) in `src/domain/name.ts`. Do not compare Names any other way.
- The domain takes `now: Date` and never reads the clock. Tests should cover Athens midnight and DST. Slot and date logic goes through `src/domain/time.ts`.
- The own-Bookings query is a pure domain function. It takes the list, the current Name and `now`, and sorts by date then `startSlot`.
- Booking shape is `{ id, roomId, date, startSlot, slotCount, name }`. Dates are Athens `'YYYY-MM-DD'`, slots are ints 0..23, and there is no `endSlot`.
- The `useBookings` hook exposes `bookings`, `currentName`, `book`, `cancel` and `setName`. `cancel(id)` does a read-modify-write: re-read storage, apply `cancelBooking` to the fresh list, write, update React state, and return the `Result`. Storage write failures are returned as an error Result.
- Only `src/storage/` touches `localStorage`. View state lives in React only, with no router and no state library. Styling is plain CSS in `src/styles.css`.
- Do not add runtime dependencies. Strict TypeScript, no `any` or `@ts-ignore`. Tests sit next to the code.
- `src/architecture.test.ts` enforces these boundaries through `npm run verify`.

## UX & Interaction Patterns

- A "My Bookings" view lists the Member's upcoming Bookings, each with a cancel action. There is no edit action.
- After a successful cancel, the day view and week overview reflect the change immediately with no reload.
- Mobile-first layout applies: controls need touch targets of at least 44x44 px, and the page must not scroll horizontally on a phone.

## Cross-Story Dependencies

- Story 3.2 builds on Story 3.1's My Bookings view as the place to cancel from.
- Epic 3 reuses `nameKey` and the `Result` and `DomainError` conventions from Epic 2 (Story 2.1).
- It also reuses the persistence hook from Story 2.3 and the booking and allowance rules from Story 2.2 (allowance restore).
- It reuses the Epic 1 day grid and Busyness queries, which must reflect cancellations.
- Epic 4 styles and guard-tests this flow.
