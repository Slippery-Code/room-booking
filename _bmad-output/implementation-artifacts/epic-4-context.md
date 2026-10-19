# Epic 4 Context: Phone-Ready and Trustworthy

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Make the whole booking flow (week overview, day view, booking form, My Bookings) comfortable on a phone and capable on desktop, and lock in the architecture and offline guarantees with automated checks so future changes cannot quietly reintroduce double bookings or device-time bugs. A Member should be able to book one-handed on a phone in under 30 seconds with their Name remembered.

## Stories

- Story 4.1: Mobile-first layout and desktop enhancement
- Story 4.2: Architecture and offline guard tests

## Requirements & Constraints

- All flows must work on phone and desktop; the booking flow must be one-handed on phone with comfortable touch targets (at least 44x44 CSS px on every interactive control).
- At 360 px width: no horizontal page scroll, readable text. With Name remembered and a free Slot, booking completes in at most 3 taps plus confirm.
- After page load, no network access is needed to browse or book; the source tree must contain no `fetch`, `XMLHttpRequest` or `WebSocket`.
- Booking rules (name, length/grid, window, past, overlap, allowance) must remain covered by automated tests; speed or layout work must not weaken allowance or overlap checks.
- Controls are semantic (`button`, `label`, `select`/`input`) with visible focus.
- Plain CSS only; no new runtime dependencies (dev dependencies need a stated reason); no changes to `.github/workflows/`, `vite.config.ts` or `tsconfig.json`; strict TypeScript, no `any`/`@ts-ignore`. `npm run verify` must pass; real-device checks are noted in the PR.

## Technical Decisions

- Layering is `ui` -> `storage` -> `domain`; `src/domain/` is pure TypeScript importing nothing outside itself and never reading the clock (it takes `now: Date`).
- Only `src/storage/` may touch `localStorage`. Only `src/domain/time.ts` converts instants or formats times/dates (Intl, Europe/Athens).
- Styling lives in `src/styles.css`, mobile-first: phone layout is the base CSS and 768 px+ is a media-query enhancement (e.g. Rooms side by side). View state is React-only; no router or state library.
- `src/architecture.test.ts` (no new dependency) scans sources and fails when:
  - `src/domain/` imports `react` or anything outside itself, or uses `Date.now`, argument-less `new Date()` or `localStorage`;
  - any file outside `src/storage/` uses `localStorage`;
  - any file outside `src/domain/time.ts` uses `getHours`, `getDate`, `getDay` or `toLocale*`.
- The scanner needs its own test feeding deliberately violating sample strings so each rule is proven to detect its violation (no vacuous pass).

## UX & Interaction Patterns

- Phone: controls reachable in the lower half of the screen where practical; the Name-remembered booking path is the fast path.
- Desktop (768 px+): use extra space without changing the phone base layout.
- The per-device storage notice must stay visible in the layout.

## Cross-Story Dependencies

- Depends on Epics 1-3 being in place: the layout story styles the week overview, day view, booking form and My Bookings; the guard tests scan the finished source tree and must pass against it.
- Story 4.2 should run on the final codebase so any violations from earlier epics surface and are fixed (or the rule's scope confirmed).
- Stories 4.1 and 4.2 are otherwise independent.
