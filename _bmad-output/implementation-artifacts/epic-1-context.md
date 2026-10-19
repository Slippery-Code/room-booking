# Epic 1 Context: See What's Free

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A Member opens the page and sees, for any day in the Booking Window (today plus the next 6 days, Europe/Athens), which of the three meeting Rooms and which half-hour Slots are free, plus a week overview of how busy each Room is. This is the read-only foundation of the booking app: it establishes the time model, Room constants and derived queries that later epics (booking, cancelling) build on.

## Stories

- Story 1.1: Athens time model and fixed Rooms
- Story 1.2: Day view with Room facts
- Story 1.3: Week overview

## Requirements & Constraints

- Day view: Member picks any day in the Booking Window and sees each Room's Slots as free, booked (showing the booker's Name) or unavailable (past). Days outside the window cannot be selected; today is selected by default; Slots whose start is before now, including the in-progress Slot, are unavailable.
- Week overview: Busyness for all 3 Rooms x 7 days visible at once; 0 booked Slots reads as empty, all 24 as full; selecting a day opens its day view.
- Room facts: Small (capacity 4), Medium (8), Large (14, with projector), shown in the day view.
- Slots are 30 minutes, 24 per day, 08:00-20:00 (slot 0 = 08:00, slot 23 = 19:30).
- Works on phone and desktop; no network access needed after page load.
- Every domain rule and query gets a unit test next to the code, including edge cases; UI behaviour (day selection, week to day navigation) gets UI tests.

## Technical Decisions

- Layering: `ui` -> `storage` -> `domain`. `domain` is pure TypeScript under `src/domain/`, imports nothing outside itself, and never reads the clock (takes `now: Date`).
- Rooms are constants in `src/domain/rooms.ts` with ids `small | medium | large`; never persisted. Persisted data is only `Booking[]` and the Name; everything else is derived.
- Booking shape: `{ id, roomId, date, startSlot, slotCount, name }` (no `endSlot`). Dates are Athens `'YYYY-MM-DD'` strings; times are slot ints 0..23; slotCount 1..4; overlap is half-open.
- `src/domain/time.ts` is the only place converting instants (via Intl, Europe/Athens) and the only place using date/locale APIs. It exports `athensDate`, `athensSlotIndex`, `windowDates`, `slotLabel`, `formatDate`. `windowDates` does y/m/d arithmetic (not +24 h) and returns exactly 7 dates starting today. Tests must cover Athens midnight and March/October DST days.
- `athensSlotIndex` must let callers distinguish before opening (all Slots future) from after closing (all Slots past); document the chosen representation in a test.
- Day-grid query returns 24 cells per Room, each with independent `booking: Booking | null` and `past: boolean` (a cell can be both). Busyness query returns integer `bookedSlots` 0..24 per Room per date.
- UI: view state in React only; no router, no state library; plain CSS in `src/styles.css`, mobile-first.
- Repo rules: no new runtime dependencies, strict TypeScript with no `any` or `@ts-ignore`, do not touch workflows, `vite.config.ts` or `tsconfig.json`; `npm run verify` must pass. Existing Vite + React 19 scaffold; check `src/` before assuming anything exists.

## UX & Interaction Patterns

- No UX design contract exists; direction comes from the PRD. Day picker limited to the 7 window days; week overview doubles as navigation into a day.
- Each Slot is labelled with its `HH:mm` time and visibly distinguishes free, booked (with Name) and unavailable.

## Cross-Story Dependencies

- Story 1.2 and 1.3 depend on Story 1.1 (Room constants and time helpers: `athensDate`, `athensSlotIndex`, `windowDates`, `slotLabel`, `formatDate`).
- Story 1.3's selection feeds the day view from Story 1.2.
- Later epics reuse these: Epic 2 (booking form is opened from free day-view Slots; window and past checks reuse the time model) and Epic 3 (cancelling must update day view and Busyness immediately).
