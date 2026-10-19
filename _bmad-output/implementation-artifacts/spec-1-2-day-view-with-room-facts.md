---
title: 'Day view with Room facts'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_revision: '990d17b3f1c97d3e5bafc7939c6b8469ef285925'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** The app shows nothing; a Member cannot see which Rooms and Slots are free on a given day.

**Approach:** Add a pure day-grid query in `src/domain/` (3 Rooms x 24 cells with independent `booking`/`past`) and a day view in `App` with a day picker limited to the 7-day window, Room facts, and per-Slot free/booked/unavailable state.

## Boundaries & Constraints

**Always:** Domain stays pure and takes `now: Date`; all time/date work via `src/domain/time.ts`. A Slot is past iff its start is before `now` (strictly). Booking shape `{ id, roomId, date, startSlot, slotCount, name }`, overlap half-open. Each Slot shows its `HH:mm` label. Plain CSS, mobile-first. UI state in React only.

**Never:** Booking creation, persistence, week overview, router/state library, new dependencies; touching `vite.config.ts`, `tsconfig.json`, workflows; `any`/`@ts-ignore`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Today, 10:10 | date=today | slots 0..4 (08:00-10:00) past, 5+ not | none |
| Exactly 10:00:00.000 | date=today | slot 4 not past, slots 0..3 past | none |
| Future day | date>today | no cell past | none |
| Before opening / after closing | 07:00 / 20:30 today | none past / all past | none |
| Booked and past | booking on a past Slot | cell has `booking` and `past: true` | none |
| Multi-slot booking | startSlot 2, slotCount 3 | cells 2,3,4 of that Room carry it; other Rooms/dates unaffected | none |

</intent-contract>

## Code Map

- `src/domain/time.ts` -- reuse `athensDate`, `athensSlotIndex`, `windowDates`, `slotLabel`, `formatDate`; read-only
- `src/domain/rooms.ts` -- reuse `ROOMS` (capacity, `hasProjector`); read-only
- `src/domain/booking.ts` -- new: `Booking` type
- `src/domain/dayGrid.ts` -- new: `dayGrid(bookings, date, now)`
- `src/App.tsx` -- replace placeholder with day view; `now` and `bookings` optional props for tests
- `src/styles.css` -- add day view styles
- `src/App.test.tsx` -- existing Vitest + Testing Library pattern

## Tasks & Acceptance

**Execution:**
- `src/domain/booking.ts` -- define `Booking` -- shared shape for later epics
- `src/domain/dayGrid.ts` -- implement query; past = `slot <= athensSlotIndex(now - 1 ms)` on today, all on earlier dates -- strict "start before now" including the in-progress Slot
- `src/domain/dayGrid.test.ts` -- cover the matrix
- `src/App.tsx`, `src/styles.css` -- day `<select>` (7 window days, today default), per-Room capacity and projector (Large only), Slot list with time and Free / Booked: Name / Unavailable
- `src/App.test.tsx` -- UI tests: default today, 7 options, selecting a day re-renders, Room facts, past Slots unavailable at 10:10, booked Name shown

**Acceptance Criteria:**
- Given bookings, a date and `now`, when `dayGrid` runs, then 3 Rooms x 24 cells with independent `booking` and `past`
- Given today at 10:10 Athens, when the grid renders, then Slots 08:00-10:00 are unavailable and 10:30 is free
- Given the day picker, then only today..today+6 are offered, today selected
- Given no Bookings, then all future Slots are free
- Given `npm run verify`, then it passes

## Verification

**Commands:**
- `npm run verify` -- expected: typecheck, tests, build pass

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 36 findings — high 0, medium 1, low 2, false 0, maybe-false 0 (remaining 33 rejected)
- findings:
  - `[medium]` `patch` `now` frozen at mount, so Slots and the day window go stale in an open tab — added a 30 s clock tick when no `now` prop, fall back to today if the pick leaves the window; UI test added
  - `[low]` `patch` at exactly Athens midnight `now - 1 ms` is yesterday, so all Slots read past for 1 ms — `slotBefore` returns -1 then; test added
  - `[low]` `patch` sprint-status.yaml not advanced — story 1.2 set to done
  - `[low]` `reject` overlapping/malformed Bookings and invalid `date` unvalidated in `dayGrid` — inputs come from the future validated booking layer; guards add branches
  - `[low]` `reject` `find` per cell is O(rooms x 24 x bookings) — negligible at this scale
  - `[low]` `reject` accessibility, contrast, dark mode, `aria-labelledby`, long-name overflow, unused `code` style — no named harm in scope
  - `[low]` `reject` `now`/`bookings` props are a test seam on the root — `main.tsx` passes none; needed for deterministic UI tests
  - `[low]` `reject` DST day, Invalid Date, missing Room in grid, extra UI test wishes — Story 1.1 covers DST in `time.ts`; unreachable states
  - `[low]` `reject` spec-internal and process observations (frontmatter, matrix wording, commit evidence) — not code defects


## Auto Run Result

Summary: Added the day view: a pure `dayGrid(bookings, date, now)` query (3 Rooms x 24 cells, independent `booking`/`past`) and an `App` day picker over the 7-day Athens window with Room facts and free/booked/unavailable Slots.
Files: `src/domain/booking.ts` (Booking type), `src/domain/dayGrid.ts` (query), `src/domain/dayGrid.test.ts`, `src/App.tsx`, `src/App.test.tsx`, `src/styles.css`, `sprint-status.yaml`.
Review: 3 patches applied (1 medium, 2 low), 0 deferred, rest rejected as logged. Follow-up review recommended: false.
Verification: `npm run verify` passes (typecheck, 40 tests, build).
Residual risks: Bookings are not yet supplied to the app (persistence is Epic 2); not checked in a browser.
