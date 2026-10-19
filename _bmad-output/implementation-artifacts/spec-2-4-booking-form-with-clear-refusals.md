---
title: 'Booking form with clear refusals'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_revision: 'e6e5a6994a2212cad6b076a0deb0b0dffa305208'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Members can see free Slots but cannot book them; the booking rules and storage exist with no UI.

**Approach:** Tapping a free Slot opens a form (Room, day, start, adjustable end, prefilled Name). Confirming calls `useBookings().book`; refusals map each error code to a plain message in the UI and keep the form open.

## Boundaries & Constraints

**Always:** Error messages live in the UI layer only. End time offers 30-minute steps from 30 min to 2 h, limited to the 20:00 close. On success: confirmation shows Room, day, `HH:mm-HH:mm`; the Name is remembered via `setName`; the form closes. A visible notice states Bookings are stored only on this device. `App` stays presentational (props `bookings`, `currentName`, `book`, `setName`); `main.tsx` wires `useBookings`.

**Never:** `localStorage` outside `src/storage/`, new dependencies, domain changes, cancel (Story 3.2), touching `vite.config.ts`/`tsconfig.json`/workflows, `any`/`@ts-ignore`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open | tap free Slot | form for Room/day/start, 30 min default, Name prefilled | none |
| Book | valid form, confirm | confirmation `HH:mm-HH:mm`; Slots show booked with Name; Name saved | none |
| Overlap | 14:30 booked, extend 14:00 to 15:00 | message names conflicting time and booker | form stays open |
| Allowance | Member already has 1.5 h today | message states minutes remaining | form stays open |
| Other refusals | blank Name, bad length, past, window, grid, storage | each has a plain message | form stays open |

</intent-contract>

## Code Map

- `src/App.tsx` -- day view; free Slots become buttons; hosts the form and confirmation
- `src/BookingForm.tsx` -- new: form component
- `src/refusalMessage.ts` -- new: `DomainError | StorageError` to message
- `src/main.tsx` -- wire `useBookings` into `App`
- `src/storage/useBookings.ts` -- `book`, `setName`, `StorageError`; read-only
- `src/domain/booking.ts`, `time.ts` -- `DomainError`, `slotLabel`, `formatDate`; read-only
- `src/App.test.tsx` -- existing style; add form tests
- `src/styles.css` -- mobile-first form styles

## Tasks & Acceptance

**Execution:**
- `src/refusalMessage.ts` -- map every error code to a message -- no strings in the domain
- `src/BookingForm.tsx` -- form with end select, Name input, confirm/cancel, error display
- `src/App.tsx` -- free Slot buttons, form state, confirmation, storage notice
- `src/main.tsx` -- connect hook
- `src/App.test.tsx`, `src/refusalMessage.test.ts` -- success, overlap, allowance, UJ-1 extension, prefill, notice

**Acceptance Criteria:**
- Given the matrix cases, when run under Testing Library, then behaviours match and `npm run verify` passes

## Spec Change Log

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 4 layers, grouped by root cause — high 0, medium 0, low 2 patched, rest rejected
- findings:
  - `[low]` `[patch]` Form kept the old day after the Day select or overview changed — now closes on day change, with a test
  - `[low]` `[patch]` Refusal message test only checked length — added per-code content assertions
  - `[low]` `[reject]` `Root` wiring untested / optional props (verification-gap, edge-case) — `main.tsx` read and passes all four props; making props required adds churn
  - `[low]` `[reject]` Stale error until resubmit, tapping another Slot discards draft, focus/aria, hardcoded limits duplicated, "1 minutes" (remaining is always a multiple of 30), `setName` throwing, double submit, stale confirmation, styling — speculative, unreachable or beyond the story's ACs
  - `[low]` `[reject]` Sprint status / commit unmet (intent-alignment) — done at finalization

## Verification

**Commands:**
- `npm run verify` -- expected: typecheck, tests and build pass

## Auto Run Result

Status: done. Tapping a free Slot opens a booking form (End in 30-minute steps up to 2 h, Name prefilled); success shows a confirmation and remembers the Name; every refusal maps to a plain UI message and keeps the form open; a storage notice is always visible. Files: `src/refusalMessage.ts` (messages), `src/BookingForm.tsx` (form), `src/App.tsx` (Slot buttons, form state, confirmation, notice), `src/main.tsx` (wires `useBookings`), `src/styles.css`, tests in `src/App.test.tsx` and `src/refusalMessage.test.ts`. Patches applied: 2 (low). Deferred: none. Follow-up review not recommended. Residual risk: `in_past`, `outside_window`, `bad_length` and `outside_grid` are unreachable from the form in normal use and covered only by message tests. `npm run verify` passes (148 tests).
