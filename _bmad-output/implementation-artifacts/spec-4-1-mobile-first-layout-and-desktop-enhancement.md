---
title: 'Mobile-first layout and desktop enhancement'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_revision: 'a61b6b17a9cfd0039c4c9d078008c17cc11d6442'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Several controls are under 44 px tall, the booking form can sit off-screen above the slot list, and the desktop enhancement starts at 640 px instead of 768 px.

**Approach:** Plain-CSS changes in `src/styles.css`: phone layout stays the base, every control gets a 44x44 px minimum, the booking form is pinned to the bottom of the screen on phones, and a `min-width: 48rem` media query lays out Rooms side by side.

## Boundaries & Constraints

**Always:** Phone layout is base CSS; desktop is `@media (min-width: 48rem)` only. Semantic controls, visible focus (`:focus-visible`). No horizontal page scroll at 360 px. Flow with a remembered Name stays: tap Slot, tap Confirm.

**Never:** New dependencies, CSS frameworks, touching `vite.config.ts`/`tsconfig.json`/workflows, domain changes, `any`/`@ts-ignore`.

</intent-contract>

## Code Map

- `src/styles.css` -- all layout; `.slot-book`, `.overview-cell`, `.day-picker select` are 40 px or less; Rooms grid breakpoint at 40rem
- `src/App.tsx`, `src/BookingForm.tsx` -- already semantic (button/label/select/input); read-only
- `src/App.test.tsx` -- add a test that guards the CSS contract (jsdom does no layout)

## Tasks & Acceptance

**Execution:**
- `src/styles.css` -- 44 px minimum for slot, overview cell, day select, form and cancel controls; `:focus-visible` outline; pinned booking form on phones; move Rooms grid to 48rem and unpin the form there -- touch targets, reachability, desktop enhancement
- `src/styles.test.ts` -- assert base rules carry no media query dependency for the phone layout, 44 px minimums, 48rem breakpoint, focus rule -- guard against regression

**Acceptance Criteria:**
- Given 360 px viewport, when using the four views, then no horizontal scroll and controls are at least 44x44 px
- Given a remembered Name and a free Slot, when booking, then it takes one Slot tap plus Confirm, with the form at the bottom of the screen
- Given 768 px or wider, when the app renders, then Rooms are side by side
- Given the change, when `npm run verify` runs, then it passes

## Spec Change Log

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 5 grouped findings from 4 layers — high 0, medium 2, low 1, false 0, maybe-false 0 (rest rejected as speculative or cosmetic)
- findings:
  - `[medium]` `[patch]` overview table min-width 22.5rem too narrow for eight 44px columns (blind, edge-case, gap) — raised to 23.25rem, added a test for the arithmetic
  - `[medium]` `[patch]` 24rem bottom padding vs 80vh form height could hide content on short screens (blind, edge-case, gap) — form max-height now min(80vh, 24rem)
  - `[low]` `[patch]` sprint status still backlog (intent-alignment) — story set to done, epic 4 in-progress
  - `[low]` `[reject]` no \`:has()\` fallback, safe-area/dvh, focus scroll-padding, keyboard overlap — modern-browser baseline; real-device check noted for the PR
  - `[low]` `[reject]` regex-test brittleness, unit/comment handling, extra width assertions, Code Map vs Tasks test-file wording, reduced-motion/dark mode — cosmetic or beyond the story
  - `[low]` `[reject]` page-level scroll vs table-internal scroll — deliberate: 8 columns of 44px targets cannot fit 360px; the page itself does not scroll

## Verification

**Commands:**
- `npm run verify` -- expected: typecheck, tests and build pass

**Manual checks (if no CLI):**
- Real-device check at 360 px and 768 px is left for the PR

## Auto Run Result

Status: done

- Summary: phone-first CSS pass. Every control has a 44 px minimum, visible focus, the booking form is pinned to the bottom of the screen on phones, the week overview scrolls inside its own section, and Rooms sit side by side from 768 px.
- Files: `src/styles.css`, `src/styles.test.ts` (CSS contract test), `_bmad-output/implementation-artifacts/sprint-status.yaml`, epic-4 context and this spec.
- Review: 3 patches applied (2 medium, 1 low), 0 deferred, rest rejected as logged. Follow-up review recommended: false.
- Verification: `npm run verify` passes.
- Residual risks: layout not exercised in a real browser or on a device; check 360 px and 768 px, and the pinned form with the on-screen keyboard, in the PR.
