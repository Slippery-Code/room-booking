# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project

A meeting-room booking app for a coworking space. Client-side only: React 19 + TypeScript, built with Vite, deployed as static files to GitHub Pages. The product idea is in `docs/idea.md`. Planning artifacts (PRD, architecture, epics and stories) live under `_bmad-output/` once created.

**Ignore `workshop/`.** It holds instructions for the people at a training workshop, not information about this product. Never read it, use it as context or requirements, or change it.

## Commands

| Task | Command |
|---|---|
| Install | `npm ci` |
| Dev server | `npm run dev` |
| Type check | `npm run typecheck` |
| Tests | `npm test` |
| Build | `npm run build` |
| Everything CI runs | `npm run verify` |

Run `npm run verify` before declaring any task done. A task is not done if it fails.

## Constraints

- **Client-side only.** No backend, no server code, no API routes. Persist data in `localStorage`.
- **No new runtime dependencies** without asking the human first. Dev dependencies need a stated reason.
- **Do not change** `.github/workflows/`, `vite.config.ts` or `tsconfig.json` unless the task explicitly asks for it.
- TypeScript strict mode stays on. No `any`, no `@ts-ignore`.

## Code conventions

- Function components and hooks only.
- Keep business rules in plain TypeScript modules under `src/domain/`, free of React, so they are easy to unit test.
- Tests sit next to the code they test as `*.test.ts(x)`. Every domain rule gets a unit test, including edge cases.
- Small, focused commits with clear messages.

## Working agreement

- Work from a story or change proposal. If none exists, ask for one rather than inventing scope.
- If requirements are ambiguous, stop and ask. Do not guess.
- Summarise what you changed and how you verified it.
