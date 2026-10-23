# Lab 1: idea → spec

**Time:** 60 minutes · **Goal:** turn [docs/idea.md](../../docs/idea.md) into a plan you could hand to a team: a PRD, an architecture, and epics with stories.

You'll use BMAD, a framework that gives your agent defined roles (analyst, product manager, architect, developer) and a document for each phase. See [README](README.md#running-agent-commands) for how to run its commands in your agent.

## Choose where to work

You stay in this repo either way. One command creates a branch for your plan:

| Option | When | Command |
|---|---|---|
| **A. This app** | You're happy with React + TypeScript | `npm run plan:start` |
| **B. Your own stack** | You'd rather plan for .NET, Python, or anything else | `npm run plan:start -- --own-stack` |

Option B gives you an empty branch containing only `idea.md`, so nothing from this app gets in your agent's way. `git switch main` takes you back to the workshop app at any time.

## Steps

Commit after every step: `git add -A && git commit -m "<step>"`. Later steps refuse to run on uncommitted changes.

### 0. Install BMAD (5 min)

```bash
npx bmad-method@6.12.4 install --yes --modules bmm --tools <your-tool>
```

Replace `<your-tool>` with `claude-code`, `codex`, `cursor`, `github-copilot`, `gemini` or `opencode`. Not listed? Run `npx bmad-method@6.12.4 install --list-tools`, or drop the flags and answer the installer's questions.

Then commit, and restart your agent so it picks up the new skills.

### 1. Ask for directions (2 min)

Run `bmad-help` and ask:

> I have a product idea in idea.md for a new app. What should I do first?

### 2. Product requirements (18 min)

Run `bmad-prd`, and point it at the idea file (`docs/idea.md`, or `idea.md` on option B). When it offers a working mode, pick **Fast path**.

The agent will ask questions the idea doesn't answer. **You are the product owner.** The community manager isn't in the room, so decide, and keep your answers short. When it offers to fill gaps with assumptions, read them before accepting.

### 3. Architecture (13 min)

Run `bmad-architecture`.

- **Option A:** tell it the stack is fixed by AGENTS.md: client-side React + TypeScript, no backend.
- **Option B:** choose your stack, but keep it small enough to build in an afternoon.

### 4. Epics and stories (15 min)

Run `bmad-create-epics-and-stories`. It walks through steps and pauses at menus: reply `C` to continue.

### 5. Review as a human (7 min)

Open the stories and read them as if they'd been handed to you on Monday:

- Would you accept them into a sprint as written?
- What did the agent **assume** that the idea never said?
- Is every rule from the idea covered by a story with acceptance criteria?
- Is anything there that nobody asked for?

Note your answers. We'll compare at the end of the lab.

## Where things end up

```
_bmad/                                 BMAD's own files and config
_bmad-output/planning-artifacts/       your PRD, architecture, epics and stories
```

## Falling behind?

Switch to the finished planning for this repo and go straight to step 5:

```bash
git fetch && git switch -C step-1-plan origin/step-1-plan
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `command not found: uv` | Install uv (see [SETUP.md](../SETUP.md)), or pair up |
| Agent doesn't know the `bmad-…` commands | Restart the agent after installing. Check you ran the installer in the folder you opened |
| "Working tree not clean" or similar | Commit, then retry |
| The conversation gets long and the agent loses track | Start a fresh session. The documents are on disk, so tell it where they are |
