# Review: ARCHITECTURE-SPINE.md (rubric review)

Reviewed against: PRD (prd.md, addendum.md), AGENTS.md, package.json, vite.config.ts, tsconfig.json, .nvmrc, .github/workflows/deploy.yml.
Proportionality: small afternoon prototype, so only gaps that could make two builders diverge, or that make a rule unenforceable, are blocking.

## Verdict: PASS WITH CHANGES (no blocker; 4 fixes recommended before stories are cut)

The spine is strong for its size. It fixes the time model, the clock, the mutation API, name comparison, storage and layering. Every FR/NFR is mapped, and nothing contradicts AGENTS.md. The gaps below are small and cheap to close.

## Findings (ordered by importance)

### F1 (medium) - Booking `id` has no owner in the `createBooking` contract
AD-1 says `id` comes from `crypto.randomUUID()` "generated in the storage shell, not the domain". AD-4 says `createBooking(bookings, request, now)` is the only code that may produce a new `Booking[]`. Nothing says how the id gets into the new Booking. Two builders can reasonably choose different answers: the request carries an `id`, the domain takes an id factory, or the shell patches the id afterwards (which breaks AD-4's "only code that produces Booking[]"). Fix: state that `request` includes a caller-supplied `id`, and give the `request` shape (`{ id, roomId, date, startSlot, slotCount, name }`).

### F2 (medium) - "Upcoming" (FR-9) and "past" semantics for own-bookings and cancel are unfixed
AD-2 defines a past slot only for creation. FR-9 shows "upcoming" Bookings, so builders must choose between "ends after now" and "starts after now". Both are plausible and the choice changes what appears in My Bookings and what stays cancellable. `cancelBooking` takes no `now`, so cancelling past Bookings is silently allowed. Fix: one line stating that "upcoming" means the end slot is after `now` (or starts after), that the own-bookings query takes `now`, and that cancelling a past Booking is allowed or refused.

### F3 (medium) - Several AD Rules are conventions with no enforcement mechanism
AD-2 (no `getHours`/`toLocale*` outside `time.ts`), AD-3 (domain never reads the clock), the layering diagram ("domain imports nothing outside itself") and AD-6 (only `src/storage/` touches `localStorage`) are all unenforced. The repo has no ESLint, and `npm run verify` runs only typecheck, tests and build. These are exactly the rules builders break accidentally. Fix with no new dependency: add one Vitest architecture test in `src/domain/` that reads source files and fails on forbidden tokens (`react`, `localStorage`, `Date.now`, `new Date(` with no args, `getHours`, `toLocale`) and on `localStorage` outside `src/storage/`. Name it in Conventions. A failing `verify` is then the enforcement.

### F4 (low-medium) - Small contract shapes left open between parallel builders
- `Result<T,E>` shape is not defined (`{ok:true,value}` vs `{ok:false,error}` or a tuple). Domain, storage and UI all consume it.
- AD-2 bans `toLocale*` on device-zone `Date`, but the UI must still render weekday and day labels from `'YYYY-MM-DD'` strings. No sanctioned formatter is named. Fix: add a `time.ts` formatter, or say the UI formats via `Intl` with `timeZone: 'UTC'` on a date built from y/m/d parts.
- The Busyness return type is not stated (booked slot count out of 24, or a fraction). FR-2 requires "empty" and "full" states, so state which value (for example `bookedSlots: 0..24`).
- The storage commit signature is not stated (does it take a closure `(list) => Result<list, DomainError>`?). The storage error type is also not in `DomainError`.

### F5 (low) - Smaller notes
- AD-6 says corrupt data "is not overwritten until the next successful commit". The next commit re-reads the corrupt blob as an empty list and overwrites it, so all prior data is lost. That is probably acceptable for a prototype, but say it plainly, or keep a backup key.
- "Remembered-Name edge: Name changes do not rewrite existing Bookings" sits under Deferred but is actually a decision. A consequence is that a Member who changes their Name can no longer cancel earlier Bookings. Move it to AD-5 or the conventions.
- The Stack table omits `@testing-library/dom@10.4.2` (a peer dependency that is installed). Add it to the table.
- Past Bookings are never pruned, so storage grows. Irrelevant at 50 users, but a one-line Deferred note would close it.

## Checklist results

| Check | Result |
| --- | --- |
| Fixes the real divergence points, misses none | Mostly. Misses: F1 (id), F2 (upcoming/past), F4 (Result shape, date formatter, Busyness type). |
| Every AD Rule enforceable and prevents its stated divergence | AD-1, AD-4 and AD-5 are enforceable through types and tests. AD-2, AD-3, AD-6 and the layering rule are convention only (F3). The AD-6 corrupt-data wording is slightly off (F5). |
| Nothing under Deferred could let two units diverge | Mostly. "Component breakdown" and "copy for error messages" are safe because the domain returns coded errors with data. The Name-change edge is a decision, not a deferral (F5). Deep-link routing is safely closed by AD-7. |
| Named tech verified current | Matches package.json and `npm ls` exactly: React/React DOM 19.3.1, TypeScript 7.0.2, Vite 8.3.4, plugin-react 6.1.2, Vitest 5.0.5, jsdom 30.1.3, Testing Library React 16.3.3. Node >=22.12.0 matches `engines`. `.nvmrc` pins 24, which satisfies the range and is used by deploy.yml. Not checked against the npm registry beyond what is installed. Minor omission: `@testing-library/dom`. |
| Covers every FR/NFR | Yes. FR-1..12, NFR-tests and NFR-offline are all bound and mapped. SM-1 is bound at AD-6. SM-2 and SM-C1 are out of architecture scope and need no decision. |
| Initiative-level dimensions (deployment, environments, ops, infra) decided, deferred or open | Yes. Decided: GitHub Pages through the existing deploy.yml, `BASE_PATH` for the base, local dev only, no secrets, no runtime config, no ops beyond CI. Optional one-line note: deploy.yml skips private repositories, so a private repo means no deployment. Not a gap. |
| Consistent with AGENTS.md | Yes. Client-side only, no new runtime deps, no changes to workflows, vite.config.ts or tsconfig.json, domain free of React, tests next to code, no `any`. |

## Suggested minimal edits
1. AD-4: add the `request` shape including `id`, and the `Result` shape.
2. AD-2 or AD-4: define "upcoming" and the cancel-past behaviour; pass `now` to the own-bookings query.
3. Conventions > Tests: add a Vitest architecture test (forbidden tokens in `src/domain/`, `localStorage` only in `src/storage/`).
4. AD-2: name the date-label formatter. AD-1: state the Busyness value type.
