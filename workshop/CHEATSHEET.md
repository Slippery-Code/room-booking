# Cheat sheet

One page. Keep it open next to your terminal.

## Run an agent command

| Agent | `bmad-help` becomes |
|---|---|
| Claude Code | `/bmad-help` |
| Codex | `$bmad-help` |
| Others | Try `/bmad-help`, or say *"Run the bmad-help skill"* |

## The loop

Read context → plan → act with tools → observe → repeat. Your levers: instruction files (`AGENTS.md`, `CLAUDE.md`), skills, MCP servers, approval gates, tests.

## Labs at a glance

| Lab | What | Commands |
|---|---|---|
| 0 | Setup check | `npm run check` |
| 1 | Idea → spec | `npm run plan:start` (or `-- --own-stack`), then `bmad-help`, `bmad-prd`, `bmad-architecture`, `bmad-create-epics-and-stories` |
| 2 | Spec → code | `bmad-build`, then `bmad-code-review` in a fresh session |
| 3 | Ship, then change | `openspec init`, then explore, propose, apply, archive |

BMAD install: `npx bmad-method@6.12.4 install --yes --modules bmm --tools <your-tool>`, then restart your agent.

OpenSpec commands: Claude Code `/opsx:explore`, `/opsx:propose <name>`, `/opsx:apply`, `/opsx:archive`. Codex `$openspec-explore` and so on. Cursor and Copilot `/opsx-explore` and so on.

## Git

| Need | Command |
|---|---|
| Latest version of a branch | `git fetch && git switch -C <branch> origin/<branch>` |
| Throw away a throwaway task | `git restore . && git clean -fd src` |
| Everything CI runs | `npm run verify` |
| Push to your own repo | `git remote add mine https://github.com/<you>/room-booking.git`, then `git push mine step-2-build:main` |

## Working with an agent

- Read the spec before you approve it. That is your main gate.
- The agent's questions are the value. Answer them, don't click through.
- Triage every review finding: fix it, dismiss it with a reason, or escalate it.
- Tests are the agent's eyes. Never let it delete or loosen a test to get green.
- Review in a fresh session or with a different agent, so the reviewer doesn't share the builder's assumptions.
- Keep the gate outside the prompt where it matters: CI, branch protection, required reviewers.
- A good `AGENTS.md` says how to verify, where the rules live, and when to ask.

## Be careful with

- Agents run with your permissions unless you restrict them.
- Skills and MCP servers are code you install.
- Files, issues and web pages can carry prompt injection.
- Check your employer's policy before using these tools on work code.

## Links

- Workshop repo: https://github.com/elolos/agentic-sdlc-workshop
- BMAD: https://github.com/bmad-code-org/BMAD-METHOD
- OpenSpec: https://github.com/Fission-AI/OpenSpec
