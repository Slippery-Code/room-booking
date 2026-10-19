---
title: 'Cancel a Booking'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_revision: 'ecc071be0dbeb9cbd3170253e02ea17fd873f2db'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** A Member cannot release a Room they no longer need, so the Slots stay blocked and the Daily Allowance stays used.

**Approach:** Add a pure `cancelBooking(bookings, id, requesterName, now)` rule, a `cancel(id)` on `useBookings`, and a Cancel button per row in My Bookings. No edit action.

## Boundaries & Constraints

**Always:** Match Names only via `nameKey`. A Booking is finished iff it has ended by the same rule as `ownBookings` (shared helper). Check order: `not_found`, `not_owner`, `in_past`. On error the list is unchanged and not written. `cancel(id)` re-reads storage, applies the rule, saves, updates state, returns the `Result`; a failed write returns `storage_unavailable`. Error codes map to messages only in `refusalMessage.ts`. Day view and week overview update from the same `bookings` state.

**Never:** Edit action, `localStorage` outside `src/storage/`, new dependencies, touching `vite.config.ts`/`tsconfig.json`/workflows, `any`/`@ts-ignore`, strings in the domain.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Owner | nameKey matches | `{ ok: true, value: { bookings } }` without it | none |
| Other Name | nameKey differs | `not_owner`, list unchanged | error Result |
| Unknown id | no such id | `not_found` | error Result |
| Finished | ended at or before `now` (exactly at `now` counts) | `in_past` | error Result |
| In progress | started, ends after `now` | cancelled | none |
| Allowance | 2 h used, cancel 1 h, book 1 h same day | booking succeeds | none |
| Save fails | storage write throws | `storage_unavailable`, state unchanged | error Result |

</intent-contract>

## Code Map

- `src/domain/ownBookings.ts` -- ended rule inline in `ownBookings`; extract exported `hasEnded(booking, now)`
- `src/domain/cancelBooking.ts` -- new: pure rule
- `src/domain/booking.ts` -- `DomainError`, `createBooking` (allowance sums remaining Bookings, so restore is automatic); add `not_found`/`not_owner` to `DomainError`
- `src/storage/useBookings.ts` -- add `cancel`; mirrors `book`
- `src/refusalMessage.ts` -- exhaustive switch; add the two new codes
- `src/App.tsx` -- My Bookings rows (`li` at ~line 104); add optional `cancel` prop and button
- `src/App.test.tsx` -- `Harness`, `seed`, `My Bookings` describe
- `src/styles.css` -- `.my-bookings-list li` at ~line 250

## Tasks & Acceptance

**Execution:**
- `src/domain/ownBookings.ts` -- export `hasEnded`, use it in the filter -- one boundary rule
- `src/domain/booking.ts` -- extend `DomainError` -- new codes
- `src/domain/cancelBooking.ts` + `.test.ts` -- implement and test the matrix incl. exact-end, midnight, name normalisation, input not mutated, allowance restore via `createBooking`
- `src/storage/useBookings.ts` + `useBookings.test.tsx` -- `cancel(id)`; tests for success, refusal, stale-storage re-read, write failure
- `src/refusalMessage.ts` + test -- messages for new codes
- `src/App.tsx`, `src/App.test.tsx`, `src/styles.css` -- Cancel button (min 44px touch target) per row, error shown on refusal; tests: row removed, Slots free in day view, week overview count drops, no edit action

**Acceptance Criteria:**
- Given a Member at 2 h who cancels a 1 h Booking, when they book 1 h that day, then it succeeds
- Given the above, when `npm run verify` runs, then it passes

## Spec Change Log

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 24 findings — high 1, medium 0, low 2, false 3, maybe-false 0 (rest rejected as speculative or by design)
- findings:
  - `[high]` `[patch]` `src/main.tsx` did not pass `cancel` to `App`, so Cancel always failed in the shipped app (intent-alignment) — passed `cancel` through
  - `[low]` `[patch]` `in_past` message said "pick a later time", misleading when cancelling (blind, edge-case) — reworded to cover booking and cancelling
  - `[low]` `[patch]` sprint status still `backlog` (intent-alignment) — set story and epic 3 to done
  - `[low]` `[reject]` stale `cancelError` and no state refresh on `not_found` (blind, edge-case, gap) — `storage` events already refresh state; error clears on next cancel; guards add complexity
  - `[false]` `[reject]` two clocks / hook test uses real clock (blind, edge-case) — hook tests use fake timers; the 30 s tick keeps `App` in step
  - `[false]` `[reject]` duplicate ids, corrupt storage reported as `not_found`, double click — UUID ids; corrupt data loads as empty by design; second click only gets a harmless refusal
  - `[low]` `[reject]` 2.75rem vs 44px, confirm/undo, aria-label, success message, label helper, extra UI refusal tests — cosmetic or beyond the story

## Verification

**Commands:**
- `npm run verify` -- expected: typecheck, tests and build pass

## Auto Run Result

Status: done

- Summary: pure `cancelBooking` rule, `cancel(id)` on `useBookings`, and a Cancel button per My Bookings row; cancelling frees Slots, lowers Busyness and restores the Daily Allowance. No edit action.
- Files: `src/domain/cancelBooking.ts` (+test), `src/domain/ownBookings.ts` (shared `hasEnded`), `src/domain/booking.ts` (new error codes), `src/storage/useBookings.ts` (+test), `src/refusalMessage.ts` (+test), `src/App.tsx`, `src/App.test.tsx`, `src/styles.css`, `src/main.tsx` (wires `cancel`).
- Review: 3 patches applied (1 high, 2 low), 0 deferred, rest rejected as logged above. Follow-up review recommended: false.
- Verification: `npm run verify` passes.
- Residual risks: not exercised in a real browser.
