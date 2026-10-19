---
title: 'Week overview'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_revision: '2a12b27758ed7ed6a99ac38a3f5482d35a3cb3fd'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** A Member must open each day to find a quiet one; there is no at-a-glance view of how busy each Room is across the Booking Window.

**Approach:** Add a pure busyness query in `src/domain/` (integer `bookedSlots` 0..24 per Room per date) and a week overview in `App`: 3 Rooms x 7 days visible at once, each cell a button showing the count with an Empty/Full label, that selects the day and shows its day view.

## Boundaries & Constraints

**Always:** Domain stays pure (no React, no clock). Count distinct booked Slots per Room per date (half-open `startSlot..startSlot+slotCount`), clamped to the 24 Slots of the day. Overview days come from `windowDates(now)`. Selecting a day uses the same selected-day state as the day picker. Plain CSS, mobile-first. UI state in React only.

**Never:** Booking creation, persistence, router/state library, new dependencies; touching `vite.config.ts`, `tsconfig.json`, workflows; `any`/`@ts-ignore`; changing `dayGrid` behaviour.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No Bookings | any date | `bookedSlots` 0 for all 3 Rooms | none |
| Fully booked Room-day | bookings covering slots 0..23 | that Room 24, other Rooms 0 | none |
| Back-to-back pair | slot 2 x2 then slot 4 x3 | 5 | none |
| Multi-slot booking | startSlot 2, slotCount 3 | 3 for that Room/date only | none |
| Other date / Room | booking on another date or Room | not counted | none |
| Overlapping bookings | two Bookings share a Slot | shared Slot counted once | none |

</intent-contract>

## Code Map

- `src/domain/booking.ts` -- `Booking` type; read-only
- `src/domain/rooms.ts` -- `ROOMS`; read-only
- `src/domain/time.ts` -- `windowDates`, `formatDate`; read-only
- `src/domain/dayGrid.ts` -- sibling query, same style (`SLOTS_PER_DAY = 24`, `ROOMS.map`); read-only
- `src/domain/busyness.ts` -- new: `busyness(bookings, date)`
- `src/App.tsx` -- holds `selected` state, `dates`; add overview section above the day view
- `src/styles.css` -- add overview styles
- `src/App.test.tsx` -- existing helpers `slotsOf`, `NOW`; add overview tests

## Tasks & Acceptance

**Execution:**
- `src/domain/busyness.ts` -- export `busyness(bookings, date): { roomId, bookedSlots }[]` in `ROOMS` order, counting distinct Slots -- derived query, nothing persisted
- `src/domain/busyness.test.ts` -- cover every matrix row
- `src/App.tsx` -- `<section aria-label="Week overview">` with a table: header row of the 7 window days, a row per Room; each cell a `<button>` labelled with Room, day and `N/24`, text `Empty` when 0, `Full` when 24, else `N/24`; click sets `selected`; mark the selected day -- week to day navigation
- `src/styles.css` -- mobile-first table styles, distinct empty/full looks, horizontal fit at phone width
- `src/App.test.tsx` -- UI tests with fixtures (back-to-back pair, a fully booked Room-day): 21 buttons, counts, Empty/Full text, clicking a day changes the picker value and day view

**Acceptance Criteria:**
- Given Bookings and a date, when `busyness` runs, then it returns integer 0..24 per Room (0 with none, 24 when all Slots booked)
- Given the overview, then all 7 days and 3 Rooms are visible at once; 0 booked reads Empty, 24 reads Full
- Given the overview, when a day is selected, then the day view and picker show that day
- Given `npm run verify`, then it passes

## Verification

**Commands:**
- `npm run verify` -- expected: typecheck, tests, build pass

### 2026-10-19 — Review pass
- verdicts: 31 findings — high 0, medium 0, low 3, false 0, maybe-false 0 (remaining 28 rejected)
- findings:
  - `[low]` `patch` accessible name showed `N/24` while the visible text was `Empty`/`Full` (label-in-name) — `aria-label` now ends in the visible text; UI tests updated
  - `[low]` `patch` sprint-status.yaml not advanced — story 1.3 set to done
  - `[low]` `reject` negative/fractional/NaN/zero `startSlot`/`slotCount`, missing lower-clamp test — outside the documented Booking contract (ints, validated in Epic 2); guards add branches
  - `[low]` `reject` `SLOTS_PER_DAY` duplicated across files — `dayGrid.ts`/`time.ts` read-only per spec, no divergence demonstrated
  - `[low]` `reject` Empty/Full classification inline in `App.tsx`, nested `find`, `useMemo`, 7x3 recompute — presentation only, negligible cost
  - `[low]` `reject` colour contrast, `aria-pressed` vs `aria-current`, touch targets, phone-width fit unverified in browser, focus/scroll after selection — no named harm in scope
  - `[low]` `reject` spec bookkeeping, process-only and tracker observations, picker/overview redundancy — not code defects; picker kept deliberately

## Auto Run Result

Summary: Added the week overview: a pure `busyness(bookings, date)` query (integer `bookedSlots` 0..24 per Room per date) and a 3 Rooms x 7 days table in `App` whose cells read Empty / N/24 / Full and select that day in the day view.
Files: `src/domain/busyness.ts`, `src/domain/busyness.test.ts`, `src/App.tsx`, `src/App.test.tsx`, `src/styles.css`, `sprint-status.yaml`.
Review: 2 patches applied (low), 0 deferred, rest rejected as logged. Follow-up review recommended: false.
Verification: `npm run verify` passes (typecheck, tests, build).
Residual risks: phone-width layout not checked in a browser; Bookings not yet supplied to the app (Epic 2).
