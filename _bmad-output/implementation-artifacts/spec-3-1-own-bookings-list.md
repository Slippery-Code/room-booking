---
title: 'Own Bookings list'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_revision: '1fa45c6235209f80ce716283f36b4a5506391944'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** A Member cannot see what they have reserved; Bookings are only visible as "Booked: Name" in the day grid.

**Approach:** Add a pure domain query `ownBookings(bookings, name, now)` and a "My Bookings" section in `App` listing the current Name's upcoming Bookings as Room, day and `HH:mm-HH:mm`, with an empty state.

## Boundaries & Constraints

**Always:** Match Names only via `nameKey`. A Booking is upcoming iff it ends after `now` (ends exactly at `now` is excluded). Sort by date then `startSlot` (ties by id). Domain stays free of React and UI strings. `App` stays presentational and reads `currentName` and `bookings` props.

**Never:** Cancel action (Story 3.2), edit action, `localStorage` outside `src/storage/`, new dependencies, hook changes, touching `vite.config.ts`/`tsconfig.json`/workflows, `any`/`@ts-ignore`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Name match | name `"  eleni k. "`, Booking by `"Eleni K."` | listed as `Room, Tue 20 Oct, 14:00-15:00` | none |
| Other Names | Bookings under other Names | not listed | none |
| Ordering | several upcoming | sorted by date, then startSlot | none |
| Ended | ends before or exactly at `now` | excluded | none |
| In progress | started, ends after `now` | included | none |
| Empty | no upcoming, or Name blank | empty-state message | none |

</intent-contract>

## Code Map

- `src/domain/ownBookings.ts` -- new: pure query
- `src/domain/name.ts` -- `nameKey`; read-only
- `src/domain/time.ts` -- `athensDate`, `athensSlotIndex`, `slotLabel`, `formatDate`; read-only
- `src/App.tsx` -- add My Bookings section
- `src/App.test.tsx` -- UI tests (Harness/seed helpers)
- `src/styles.css` -- minimal list styles

## Tasks & Acceptance

**Execution:**
- `src/domain/ownBookings.ts` -- implement query; ended iff date < today, or same day and `startSlot + slotCount <= athensSlotIndex(now)` -- single boundary rule
- `src/domain/ownBookings.test.ts` -- cover matrix incl. exact-end, midnight, blank Name
- `src/App.tsx` -- "My Bookings" section with list or empty message
- `src/App.test.tsx` -- UI tests for list, name normalisation, empty states
- `src/styles.css` -- list styling

**Acceptance Criteria:**
- Given the matrix cases, when run, then behaviours match and `npm run verify` passes

## Spec Change Log

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 14 findings — high 0, medium 0, low 3, false 4, maybe-false 0 (remaining 7 rejected as non-defects or speculative low)
- findings:
  - `[low]` `[patch]` Sort used locale-sensitive `localeCompare` for date and id (blind, edge-case) — replaced with code-unit comparison matching `src/domain/booking.ts`
  - `[low]` `[reject]` Test title/comment wording, slot-hour constants, missing "later today" test — in-progress, exact-end and midnight cases already cover the rule
  - `[low]` `[reject]` DST fall-back and corrupt stored data not tested — Slots run 08:00-20:00, outside the repeated hour; storage validates on load
  - `[false]` `[reject]` List goes stale as time passes — `App` ticks its clock every 30 s and recomputes
  - `[false]` `[reject]` Unstyled `.my-bookings` classes / dark mode — class names are hooks, no dark theme exists in the stylesheet
  - `[low]` `[reject]` Duplicate-id React keys, a11y wording (`aria-labelledby`, `role="status"`, en dash), room lookup duplication, memoisation — speculative or cosmetic, fixes add complexity
  - `[false]` `[reject]` "No story linked" — story 3.1 is the source
  - `[false]` `[reject]` Intent-alignment: always-visible section vs openable view; Name seeded via storage — AC2 "view opens" is satisfied by the section rendering; sprint-status and commit handled at finalization

## Auto Run Result

Status: done

- Summary: new pure `ownBookings(bookings, name, now)` query and a "My Bookings" section listing the current Name's upcoming Bookings, with an empty state.
- Files: `src/domain/ownBookings.ts` (query), `src/domain/ownBookings.test.ts` (unit tests), `src/App.tsx` (section), `src/App.test.tsx` (UI tests), `src/styles.css` (list styles).
- Review: 1 patch applied, 0 deferred, rest rejected as logged above.
- Follow-up review recommended: false.
- Verification: `npm run verify` passes (typecheck, tests, build).
- Residual risks: none known; app not exercised in a browser.

## Verification

**Commands:**
- `npm run verify` -- expected: typecheck, tests and build pass
