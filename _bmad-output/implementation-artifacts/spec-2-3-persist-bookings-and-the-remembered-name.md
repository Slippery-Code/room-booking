---
title: 'Persist Bookings and the remembered Name'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_revision: '12cbe0c1b7b5c6c7f9a5b6f0fe0c38478a421807'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Bookings and the Member's Name exist only in memory, so a reload loses everything.

**Approach:** Add `src/storage/` (the only `localStorage` user) with a `useBookings` hook that wraps `createBooking`, persists `{ version: 1, bookings }` and the Name, tolerates bad data, and syncs across tabs.

## Boundaries & Constraints

**Always:** Keys `room-booking:v1` and `room-booking:name`. `book(requestWithoutId)`: shell generates id (`crypto.randomUUID()`, else `getRandomValues` fallback), re-reads storage, applies `createBooking(fresh, request, new Date())`, writes, then sets state and returns the domain `Result`. A write failure returns an error Result and leaves state unchanged. Missing, corrupt, wrong-version or wrongly shaped data loads as `[]` without throwing; a later commit overwrites it. `setName` stores the trimmed Name and never touches Bookings. A `storage` event (any key, including `key === null`) re-reads both values into state. Domain stays React- and storage-free.

**Never:** `localStorage` outside `src/storage/`, new dependencies, UI changes, `cancel` (Story 3.2), touching `vite.config.ts`/`tsconfig.json`/workflows, `any`/`@ts-ignore`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Book | valid request | id generated, stored, state updated, `ok` Result | none |
| Domain refusal | overlapping request | domain error returned, nothing written | none |
| Stale state | another tab stored a Booking after load | `book` checks against the fresh list | none |
| Reload | stored Bookings and Name | hook loads both; Name prefilled | none |
| Bad data | missing / invalid JSON / `version: 2` / non-array / item missing fields or with bad room | `[]` | none |
| Write throws | `setItem` throws | `{ ok: false, error: { code: 'storage_unavailable' } }`, state unchanged | no throw |
| Other tab | `storage` event, `key` set or `null` | state refreshed from storage | none |
| Name change | `setName("Eleni K.")` | stored; Bookings unchanged | write failure ignored, state still updates |

</intent-contract>

## Code Map

- `src/domain/booking.ts` -- `createBooking`, `Booking`, `BookingRequest = Booking`, `DomainError`; read-only
- `src/domain/rooms.ts` -- `ROOMS` for validating stored `roomId`; read-only
- `src/domain/result.ts` -- `Result<T, E>`; reuse
- `src/storage/bookingStore.ts` -- new: pure read/write of both keys, shape validation, id generation
- `src/storage/useBookings.ts` -- new: the hook
- `src/storage/*.test.ts(x)` -- new: jsdom `localStorage` tests; hook tests via Testing Library `renderHook`
- `src/App.test.tsx` -- style reference (fake `now`, Testing Library)

## Tasks & Acceptance

**Execution:**
- `src/storage/bookingStore.ts` -- `loadBookings`, `saveBookings` (returns ok/failed, catches throws), `loadName`, `saveName`, `newId`, `isBooking` guard -- one owner of `localStorage`
- `src/storage/useBookings.ts` -- `useBookings()` returning `{ bookings, currentName, book, setName }`, `storage` listener -- AC behaviours
- `src/storage/bookingStore.test.ts`, `src/storage/useBookings.test.tsx` -- cover every matrix row

**Acceptance Criteria:**
- Given the matrix cases, when the hook and store run under jsdom, then results match, no file outside `src/storage/` references `localStorage`, and `npm run verify` passes

## Spec Change Log

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: findings from 4 layers grouped by root cause — high 0, medium 0, low 3 (patched), rest rejected as by-design, speculative or out of scope
- findings:
  - `[low]` `[patch]` `isBooking` accepts out-of-range slots and malformed dates (blind-hunter, edge-case, verification-gap) — added range, day-end and `YYYY-MM-DD` checks plus tests
  - `[low]` `[patch]` Hook's use of the current time not pinned (verification-gap) — added `in_past` test through `book`
  - `[low]` `[patch]` Same root cause as the first row: Name emptiness/date garbage in stored items — covered by the same checks
  - `[low]` `[reject]` One bad item empties the list (blind-hunter, edge-case) — the story's AC says wrongly shaped data loads empty and a later commit overwrites it
  - `[low]` `[reject]` Storage-event key filtering, refresh on mount, refresh state after a refusal, duplicate ids, `setName` write-failure signal, `crypto` undefined, `!` assertions, cross-tab race, weak id assertions, missing unrelated-key and unmount tests — outside the story's ACs or speculative; fixes add branches and parameters
  - `[low]` `[reject]` No `cancel` (blind-hunter) — Story 3.2 owns it
  - `[low]` `[reject]` Sprint status unchanged (intent-alignment) — handled at finalization
- Intent alignment: the diff implements the hook/store reading; wiring into the UI is Story 2.4.

## Auto Run Result

Status: done. Added `src/storage/bookingStore.ts` (sole `localStorage` owner: load/save Bookings and Name, shape validation, id generation) and `src/storage/useBookings.ts` (`book`, `setName`, `storage`-event refresh), with tests for both. Patches applied: 3 (low). Deferred: none. Follow-up review not recommended. Residual risk: a concurrent write from two tabs between re-read and write is last-writer-wins. `npm run verify` passes.

## Design Notes

`book` returns `Result<CreatedBooking, DomainError | StorageError>` where `StorageError = { code: 'storage_unavailable' }`, so 2.4 can map it to a message. Stored items are validated field by field (string id/name, room in `ROOMS`, integer slots); a single invalid item makes the whole list load empty, so corruption never yields partial data.

## Verification

**Commands:**
- `npm run verify` -- expected: typecheck, tests and build pass
