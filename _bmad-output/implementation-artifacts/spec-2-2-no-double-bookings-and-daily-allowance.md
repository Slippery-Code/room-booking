---
title: 'No double bookings and Daily Allowance'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_revision: '835befa71168f00b0d097acf2bea5b3c90454d28'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** `createBooking` accepts overlapping Bookings and unlimited hours per Member per day.

**Approach:** Extend `createBooking` with an `overlap` check (same Room, same date) and an `allowance_exceeded` check (max 4 Slots = 2 hours per Name per day), both after the existing validity checks.

## Boundaries & Constraints

**Always:** Domain stays pure; never mutate input. Check order: name, length, grid, window, past, overlap, allowance. Overlap = same `roomId` and `date` with intersecting half-open Slot ranges; back-to-back is fine. `conflicts` are the clashing existing Bookings sorted by `startSlot` (ties by `id`). Allowance sums `slotCount` of existing Bookings on the request's date whose `nameKey` equals the request's, across Rooms, including already-finished ones. A Slot is 30 minutes; limit is 4 Slots. `allowance_exceeded` carries `remainingMinutes` (30 per remaining Slot, never negative).

**Never:** Persistence, UI, user-facing strings, new dependencies, touching `vite.config.ts`/`tsconfig.json`/workflows, `any`/`@ts-ignore`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Overlap | existing 10:00-11:00 Medium, request 10:30-11:30 Medium | `overlap`, `conflicts` sorted by `startSlot` | none |
| Back-to-back | existing ends 10:00, request starts 10:00 same Room | ok | none |
| Other Room / day | same times, different Room or date | ok | none |
| Order independence | A and B overlap, either order | first ok, second `overlap` | none |
| Over allowance | 3 Slots booked that day, request 2 | `allowance_exceeded`, `remainingMinutes` 30 | none |
| Exactly 2h | total 4 Slots after request | ok | none |
| 2h + one Slot | 4 Slots booked, request 1 | `allowance_exceeded`, `remainingMinutes` 0 | none |
| Name matching | existing `"Eleni K."`, request `"  ELENI k. "` | counted together | none |
| Per day, finished | other day not counted; past Bookings today counted | as stated | none |
| Both fail | overlapping and over allowance | `overlap` | none |

</intent-contract>

## Code Map

- `src/domain/booking.ts` -- `createBooking`, `DomainError`; add checks and error variants
- `src/domain/booking.test.ts` -- existing helpers `req`, `code`, `NOW`; add cases
- `src/domain/name.ts` -- `nameKey`; read-only

## Tasks & Acceptance

**Execution:**
- `src/domain/booking.ts` -- add `overlap` (with `conflicts`) and `allowance_exceeded` (with `remainingMinutes`) after the past check
- `src/domain/booking.test.ts` -- cover every matrix row

**Acceptance Criteria:**
- Given the matrix cases, when `createBooking` runs, then results match and `npm run verify` passes

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 18 findings — high 0, medium 0, low 3, false 4, maybe-false 0 (11 further rejected as low/out of scope)
- findings:
  - `[low]` `[patch]` in_past order vs overlap/allowance not pinned (verification-gap) — tests now use non-empty lists; added in_past-before-allowance test
  - `[low]` `[patch]` `Math.max(0, ...)` clamp untested (edge-case, verification-gap, blind-hunter) — added test with 6 booked slots
  - `[low]` `[patch]` Order test title misleading (blind-hunter) — rewritten as above
  - `[false]` `[reject]` `nameKey` not imported (blind-hunter) — already imported at top of `booking.ts`
  - `[low]` `[reject]` Corrupt stored data, duplicate ids, unknown rooms, helper extraction, comparator style, richer error payload, test fixture room change — outside intent (storage is Story 2.3; AC fixes error shape); fixes add complexity
- Intent alignment: diff implements the domain-rule reading, matching the story's acceptance criteria; UI is Story 2.4.

## Auto Run Result

Status: done. Added `overlap` (with sorted `conflicts`) and `allowance_exceeded` (with `remainingMinutes`) to `createBooking` in `src/domain/booking.ts`; tests in `src/domain/booking.test.ts`. Patches applied: 3 (low). Deferred: none. Follow-up review not recommended. `npm run verify` passes (102 tests).
