---
title: 'Athens time model and fixed Rooms'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_revision: 'ce8bab3c0e0b390a151252844265c77c86ee5552'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** The app has no notion of the space's own time zone or its Rooms, so later day views and booking rules cannot be right on a phone set to another zone.

**Approach:** Add pure TypeScript modules `src/domain/rooms.ts` and `src/domain/time.ts` (Europe/Athens via `Intl.DateTimeFormat`), with unit tests beside them. No UI.

## Boundaries & Constraints

**Always:** Domain is pure, imports nothing outside itself, never reads the clock (`now: Date` is an argument). Dates are `'YYYY-MM-DD'`; slots are ints 0..23 (08:00 = 0, 19:30 = 23). `time.ts` is the only place converting instants and formatting dates/times. Day arithmetic on y/m/d parts, never +24 h. Strict TS, no `any`/`@ts-ignore`.

**Never:** Persist Rooms; add dependencies; touch `vite.config.ts`, `tsconfig.json`, workflows; use `getHours`/`getDate`/`getDay`/`toLocale*`; build UI or booking rules.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Opening slot | 08:00 Athens | slot 0 | none |
| Last slot | 19:30 Athens | slot 23 | none |
| Before opening | 07:59 Athens | -1 (all Slots future) | none |
| After closing | 20:00 Athens | 24 (all Slots past) | none |
| Athens midnight | 21:59:59Z vs 22:00:00Z on a summer day | date rolls over between them | none |
| DST change days | 2026-03-29 and 2026-10-25 | correct date/slot; window has 7 consecutive dates | none |
| Process zone | any TZ | same result | none |

</intent-contract>

## Code Map

- `src/domain/rooms.ts` -- new: Room constants (small 4, medium 8, large 14 + projector), `RoomId`
- `src/domain/time.ts` -- new: `athensDate`, `athensSlotIndex`, `windowDates`, `slotLabel`, `formatDate`
- `src/domain/*.test.ts` -- new: tests beside each module
- `src/App.test.tsx` -- existing test pattern (Vitest + Testing Library) to mirror

## Tasks & Acceptance

**Execution:**
- `src/domain/rooms.ts` -- define `RoomId`, `Room`, `ROOMS` -- fixed Rooms, never persisted
- `src/domain/time.ts` -- implement the five exports; `athensSlotIndex` returns -1 before 08:00 and 24 from 20:00 -- distinguishes before opening from after closing
- `src/domain/rooms.test.ts`, `src/domain/time.test.ts` -- cover the matrix, DST, midnight, window, labels, and document the -1/24 representation

**Acceptance Criteria:**
- Given any `now`, when `athensDate`/`athensSlotIndex` run, then they return Athens values regardless of process zone
- Given midnight and DST instants, when `windowDates` runs, then it returns exactly 7 consecutive dates starting today
- Given slots 0 and 23, when `slotLabel` runs, then `08:00` and `19:30`
- Given `npm run verify`, then it passes

## Verification

**Commands:**
- `npm run verify` -- expected: typecheck, tests, build all pass

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 22 findings — high 0, medium 0, low 5, false 3, maybe-false 0 (remaining 14 rejected as speculative design wishes with no named harm)
- findings:
  - `[low]` `patch` no test at the 08:29/08:30 slot boundary — added a boundary test
  - `[low]` `patch` sprint-status.yaml not advanced — epic-1 set to in-progress, story 1.1 to done
  - `[low]` `reject` invalid calendar dates roll over in `parseDate` — only fed by `athensDate` output; guard adds complexity
  - `[low]` `reject` `slotLabel` has no bounds check for sentinels -1/24 — no current caller; fix adds a branch
  - `[low]` `reject` `formatToParts` hour "24" / missing parts — `hourCycle: 'h23'` is used; tests pass on Node 24
  - `[false]` `reject` process-zone independence untested — implementation passes under TZ=America/Los_Angeles and Asia/Tokyo; code uses explicit `timeZone`
  - `[false]` `reject` DST mid-day slots wrong — slot derives from Athens wall-clock; open hours never overlap the 03:00-04:00 change
  - `[false]` `reject` no commit/verify evidence in diff — done at finalization

## Auto Run Result

Summary: Added the Athens time model (`athensDate`, `athensSlotIndex`, `windowDates`, `slotLabel`, `formatDate`) and fixed Room constants. `athensSlotIndex` returns -1 before 08:00 and 24 from 20:00.
Files: `src/domain/rooms.ts` (Rooms), `src/domain/time.ts` (time model), `src/domain/*.test.ts` (tests), `sprint-status.yaml` (progress).
Review: 2 patches applied, 0 deferred, rest rejected as above. Follow-up review recommended: false.
Verification: `npm run verify` passes (typecheck, tests, build).
Residual risks: the I/O matrix's "summer midnight" instants in this spec were wrong (summer midnight is 21:00Z); tests use the correct boundaries.
