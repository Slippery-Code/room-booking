---
title: 'Architecture and offline guard tests'
type: 'chore'
created: '2026-10-19'
status: 'done'
baseline_revision: '6f6dc98c4036d749ca81ad81bee661e2d3cf4307'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Nothing automatically stops future changes from importing React into the domain, reading the device clock or `localStorage` outside storage, formatting time outside `time.ts`, or adding network calls.

**Approach:** One dependency-free test, `src/architecture.test.ts`, with a pure scanner (rules over source text) run against the real source tree, plus tests feeding violating sample strings to each rule so the guard cannot pass vacuously.

## Boundaries & Constraints

**Always:** Only `node:fs`/`node:path` and vitest; scan non-test source files under `src/` (test files may mention banned names in samples); fix real violations in source if the scan finds any.

**Never:** New dependencies, changes to `vite.config.ts`, `tsconfig.json` or workflows, `any`/`@ts-ignore`, domain behaviour changes.

</intent-contract>

## Code Map

- `src/domain/*.ts` -- pure domain; imports only `./` siblings (verified by grep); read-only
- `src/storage/bookingStore.ts` -- the only `localStorage` user
- `src/domain/time.ts` -- the only place allowed `getHours`/`getDate`/`getDay`/`toLocale*`
- `src/styles.test.ts` -- precedent for reading sources with `node:fs` in a vitest test

## Tasks & Acceptance

**Execution:**
- `src/architecture.test.ts` -- scanner rules (domain imports, domain clock/storage use, `localStorage` outside storage, date accessors outside `time.ts`, `fetch`/`XMLHttpRequest`/`WebSocket` anywhere), real-tree scan, and violating-sample tests per rule -- guard architecture and offline guarantee

**Acceptance Criteria:**
- Given the source tree, when `npm test` runs, then no rule reports a violation
- Given a violating sample for each rule, when scanned, then that rule reports it
- Given `npm run verify`, then it passes

## Verification

**Commands:**
- `npm run verify` -- expected: typecheck, tests and build pass

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 4 grouped findings from 4 layers — high 0, medium 1, low 1, false 0, maybe-false 0 (rest rejected)
- findings:
  - `[medium]` `[patch]` `//` or `/*` inside a string literal made the comment stripper hide a following banned call (blind, edge-case, gap) — stripper now keeps string/template literals; two regression samples added
  - `[low]` `[patch]` `require` and side-effect import forms untested (gap) — samples added
  - `[low]` `[reject]` `./..` import escape, other Date/Intl/storage/network APIs, clock rules beyond `src/domain/`, `.js` files, `process.cwd()` root, scanner exported from a test file — beyond the story's acceptance criteria or unlikely; the AC scopes the clock rules to the domain
  - `[low]` `[reject]` sprint-status not updated (intent-alignment) — updated as part of finalisation

## Auto Run Result

Status: done

- Summary: `src/architecture.test.ts` scans the source tree and fails on domain imports outside the domain, domain clock or `localStorage` use, `localStorage` outside `src/storage/`, date accessors/`toLocale*` outside `src/domain/time.ts`, and `fetch`/`XMLHttpRequest`/`WebSocket` anywhere. Violating samples prove each rule detects its violation.
- Files: `src/architecture.test.ts`, sprint status and this spec. No source violations were found.
- Review: 2 patches applied (1 medium, 1 low), 0 deferred. Follow-up review recommended: false.
- Verification: `npm run verify` passes.
- Residual risks: regex-based scanner; unusual syntax (bracket access, aliasing) is not detected.
