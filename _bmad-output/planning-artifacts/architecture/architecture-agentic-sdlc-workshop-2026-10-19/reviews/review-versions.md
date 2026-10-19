# Review: versions and reality-check of ARCHITECTURE-SPINE.md

Date: 2026-10-19. Reviewer scope: Stack table, named technologies, platform API claims. Spine not edited.

## Verdict: PASS WITH FIXES

Every package version in the Stack table is correct and current. Two items need correction: the Node floor, and the unstated `crypto.randomUUID` secure-context caveat. Several platform claims are right but nothing in the spine says they were checked.

## 1. Stack table vs repo and npm registry (checked 2026-10-19)

| Spine | package.json (pinned) | Installed | npm latest | Result |
| --- | --- | --- | --- | --- |
| React / DOM 19.3.1 | 19.3.1 | 19.3.1 | 19.3.1 | OK |
| TypeScript 7.0.2 | 7.0.2 | 7.0.2 | 7.0.2 | OK (see 4) |
| Vite 8.3.4 | 8.3.4 | 8.3.4 | 8.3.4 | OK |
| plugin-react 6.1.2 | 6.1.2 | 6.1.2 | 6.1.2 | OK |
| Vitest 5.0.5 | 5.0.5 | 5.0.5 | 5.0.5 | OK |
| jsdom 30.1.3 | 30.1.3 | 30.1.3 | 30.1.3 | OK, but see F1 |
| @testing-library/react 16.3.3 | 16.3.3 | 16.3.3 | 16.3.3 | OK |
| Node >=22.12.0 (`.nvmrc` in CI) | engines >=22.12.0; `.nvmrc` = `24` | local v22.22.0 | - | WRONG, see F1 and F2 |

Strict mode and `noUncheckedIndexedAccess` are both on in tsconfig.json. `base` from `BASE_PATH` matches vite.config.ts and deploy.yml. `npm run verify` passes locally (typecheck, 1 test, build).

Not in the Stack table but required by the stated approach:
- `@testing-library/dom` 10.4.2 is a peer dependency of @testing-library/react 16 and is in devDependencies.
- `@types/node` 24.19.2 and `@types/react` / `@types/react-dom` 19.3.x are installed.
- The spine's Tests row mentions Testing Library UI tests but not `@testing-library/user-event`, `jest-dom` or setup files. None are installed, and AGENTS.md requires a stated reason for new dev dependencies.

Peer ranges are satisfied: plugin-react 6.1.2 accepts the Vite 8 line, and RTL 16.3.3 accepts React 19.

## 2. Findings

### F1 (High): Node floor `>=22.12.0` is wrong for the pinned toolchain
- jsdom 30.1.3 declares `engines.node: ^22.22.2 || ^24.15.0 || >=26.0.0`.
- Vite 8.3.4 requires `^20.19.0 || >=22.12.0`. Vitest 5.0.5 requires `^22.12.0 || ^24.0.0 || >=26.0.0`.
- The binding constraint is therefore jsdom, so the real floor is 22.22.2, not 22.12.0.
- This sandbox runs v22.22.0, which is below that. Local checks passed because the suite has one trivial test, but the spine mandates jsdom `localStorage` tests, so a Node in the gap range can fail or print engine warnings.
- Recommend stating the floor as `^22.22.2 || >=24.15.0`, and aligning `package.json` engines. The engines edit is outside the spine, so route it to the owner.

### F2 (Medium): "`.nvmrc` in CI" is ambiguous and contradicts the floor
- `.nvmrc` contains `24`, and ci.yml and deploy.yml use `node-version-file: .nvmrc`, so CI runs the latest 24.x, not 22.12.0.
- The Stack cell reads as though CI uses the floor. State it as "runtime floor X; CI and dev use `.nvmrc` (24)".
- Node lifecycle, from secondary sources only (the official schedule was not opened): Node 24 is LTS and leaves Active LTS around 2026-10-20, with EOL in April 2028. Node 22 is in maintenance, with EOL on 2027-04-30. Node 26 is expected to become LTS in October 2026. Pinning 24 is reasonable. The floor on 22 is the near-EOL end, so do not describe 22 as a target.
- Confirm against nodejs/Release before relying on these dates.

### F3 (Medium): AD-1 `crypto.randomUUID()` has an unstated secure-context requirement
- Verified via MDN and secondary write-ups: `randomUUID` exists in Chrome/Edge 92+, Firefox 95+ and Safari 15.4+. It is secure-context only (HTTPS, `localhost`, `127.0.0.1`).
- GitHub Pages is HTTPS (and `*.github.io` is HTTPS-enforced by default), so production is fine. This was not verified against GitHub docs in this review.
- The risks are:
  - A LAN preview such as `vite --host` served over `http://192.168.x.x` on a phone. This is the likely workshop case, since the app is mobile-first, and `randomUUID` will be undefined there.
  - Safari older than 15.4, which is a plausible old-phone case.
  - jsdom: `crypto.randomUUID` is available through Node's global `crypto` in Node 22+, but jsdom's `window.crypto` is a separate surface. Not run here, so unconfirmed in the vitest jsdom environment.
- Recommend one line in AD-1 or Deferred: the id helper lives in `src/storage/` and falls back to `crypto.getRandomValues` (available in insecure contexts) when `randomUUID` is absent. This adds no dependency. Tests should assert id uniqueness.

### F4 (Medium): TypeScript 7.0.2 is a major toolchain change and nothing in the spine says it was vetted
- 7.0.2 is the current npm release and `tsc` runs fine here. It is the native-compiler major. `skipLibCheck`, `types: ["vite/client","node"]` and `verbatimModuleSyntax` all work with this repo's typecheck today.
- The spine's claims about `noUncheckedIndexedAccess` and strict behave as stated.
- The risk is ecosystem fit. Tools that import the TypeScript JS API (typescript-eslint, some Vite/Vitest plugins) may lag. No linter is in the stack, so there is no current impact.
- Recommend one sentence recording "TS 7 verified with `npm run verify` on 2026-10-19", so a later story does not add an ESLint stack without checking.

### F5 (Low): Platform API claims are correct but unsourced
- **`Intl.DateTimeFormat` with `timeZone: 'Europe/Athens'`:** works. Node here has ICU 77.1 and tzdata 2025b. A probe of `2026-10-25T00:30:00Z` (the DST-end night) formatted to `03:30`, which is Athens summer time (UTC+3) at that instant. Browsers on mobile ship their own tzdata, so Greek rules (EU DST: last Sunday of March and October) are well supported.
  - Caveat: `Intl` formatting gives local parts for an instant, but AD-2's "day-window arithmetic on y/m/d parts" is the right way to avoid the pitfall of converting Athens wall time back to an instant. The spine does not define that reverse conversion, and "Athens midnight" tests need it, so a story author must not use `new Date(y, m, d)` (device zone).
  - Use `formatToParts` with `hourCycle: 'h23'`. A plain `hour12: false` can produce `24:xx` at midnight in some engines. The spine does not mention this, and it directly affects the "Athens midnight" test case.
- **`storage` event:** AD-6 says React state updates on `storage` events from other tabs. Verified via MDN: the event fires in other same-origin documents sharing the storage area, and never in the writing document. That matches AD-6, whose commit publishes to its own React state directly. Gaps:
  - `event.key` is `null` on `clear()`, so the handler should reload on null.
  - Events do not fire when storage is blocked.
  - Safari private mode and similar cases can throw on write (the spine already covers this with its error Result).
  - The event is a hint only. Re-reading on `focus` or `visibilitychange` is a cheap backstop, since mobile browsers suspend background tabs. Optional.
- **GitHub Pages HTTPS:** not independently re-verified in this review (see F3). `deploy.yml` uses the official Pages actions, and `*.github.io` serves HTTPS. Private repos skip deploy per the workflow comment, which relates to the "Skipped while private" note, not to the spine.
- **Back-button and URL:** AD-7 says no routing, so Pages needs no rewrite rules. Correct: Pages serves `index.html` at the base path only.

### F6 (Low): `localStorage` limits not stated
- AD-6 handles full storage. Quota is about 5 MB per origin, and `Booking[]` stays far below that. No action needed.
- `JSON.parse` shape validation is handled with no dependency, which is the right call under the no-new-dependencies rule. No schema library is named, and none should be added.

## 3. What was and was not checked

- **Checked, live:** npm registry versions and engines for all 9 packages; installed versions; repo config files (package.json, tsconfig.json, vite.config.ts, `.nvmrc`, both workflows); `npm run verify`; an Intl probe on local Node.
- **Checked via web search (secondary sources, MDN mirrors):** `randomUUID` support and secure-context rule; `storage` event semantics; Node lifecycle dates.
- **Not checked:** official GitHub Pages docs on HTTPS enforcement; official Node release schedule; `randomUUID` inside the jsdom test environment; real mobile browser behavior; React 19.3 and Vite 8 release notes for breaking changes (all versions are the current npm `latest`, so no staleness).

## 4. Summary of recommended spine edits (for the owner, not applied)

1. Stack: Node cell becomes "floor `^22.22.2 || >=24.15.0` (jsdom 30 constraint); CI/dev use `.nvmrc` = 24"; fix `package.json` engines to match.
2. AD-1: add the `randomUUID` secure-context note and a `getRandomValues` fallback inside `src/storage/`.
3. AD-2: add the `formatToParts` and `hourCycle: 'h23'` note.
4. Stack or Deferred: record that the toolchain was verified on 2026-10-19, and name the Testing Library companions if used.
