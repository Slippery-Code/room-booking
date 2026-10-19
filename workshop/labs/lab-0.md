# Lab 0: setup check and your first agent task

**Time:** 15 minutes · **Goal:** a working agent in this repo, and a first look at how instruction files steer it.

## 1. Update and check

```bash
cd agentic-sdlc-workshop
git pull
npm install
npm run check
```

Any ✗? Tell the facilitator now and pair with a neighbour while it gets fixed.

## 2. Meet your agent

Open this repo in your coding agent:

| Agent | How |
|---|---|
| Claude Code | `claude` in the repo folder |
| Codex | `codex` in the repo folder |
| Cursor, VS Code + Copilot | Open the folder, then the agent / chat panel in agent mode |

Ask:

> Read AGENTS.md and tell me the rules you must follow in this repo.

Compare its answer with [AGENTS.md](../../AGENTS.md). Did it miss anything?

## 3. A first task

The app has no footer. Ask the agent to add one. This is a throwaway task to watch how the agent works, and you'll discard it in step 4.

> Add a footer showing the space's opening hours, 08:00–20:00.

It may first ask for a story, because AGENTS.md tells it to work from one. That's the instructions file doing its job. Reply that this is a throwaway exercise and it can go ahead.

While it works, notice:

- Does it run `npm run verify` before saying it's done?
- Does it add a test, or only change the UI?
- Does it ask you anything, or just decide?

## 4. Throw it away

Discard everything the agent changed:

```bash
git restore . && git clean -fd src
```

`git status` should now say "nothing to commit, working tree clean".

## Takeaway

The agent's behaviour comes from its instructions as much as from your prompt. `AGENTS.md` is context you write once and every session reuses.
