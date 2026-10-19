# Addendum: Meeting-Room Booking

## Technical context (from the repo's AGENTS.md; not part of the PRD body)

- Client-side only: React 19 + TypeScript (strict), built with Vite, tested with Vitest, deployed as static files to GitHub Pages.
- No backend; persistence in `localStorage`. This matches the prototype limitation in PRD FR-12 and §5.
- No new runtime dependencies without asking the human first.
- Business rules (overlap, Daily Allowance, Booking length, Name matching, Booking Window, grid bounds) belong in plain TypeScript modules under `src/domain/`, free of React, each with unit tests including edge cases.
- Time zone: the Booking Window and "today" must be computed in Europe/Athens, not the device zone. Needs care around midnight and daylight-saving changes.

## Notes for the next phase

- Shared storage across devices is the next phase. It will need a real backend, which conflicts with the current client-only constraint, so that decision needs an explicit change of scope. It is also what makes the no-double-booking guarantee hold across devices.
- Name-only identity should be revisited at the same time.

## Deferred ideas from the original idea

Recurring bookings and screens next to each room were mentioned as later wishes by the community manager (`docs/idea.md`).
