# Labs

| Lab | Topic | Handout |
|---|---|---|
| 0 | Setup check and your first agent task | [lab-0.md](lab-0.md) |
| 1 | Idea → spec: plan a product with role-based agents | [lab-1.md](lab-1.md) |
| 2 | Spec → code: the implementation loop | [lab-2.md](lab-2.md) |
| 3 | Code → production: ship, then change a live rule | [lab-3.md](lab-3.md) |

One-page reference: [../CHEATSHEET.md](../CHEATSHEET.md)

## Running agent commands

The labs use skills and slash commands. How you call them depends on your agent:

| Agent | How to run a command such as `bmad-help` |
|---|---|
| Claude Code | `/bmad-help` |
| Codex | `$bmad-help` |
| Others (Cursor, Copilot, Gemini CLI, OpenCode…) | Try `/bmad-help`. If it isn't listed, write in plain words: *"Run the bmad-help skill"* |

## Falling behind

Every lab has a branch with the finished state of the previous one. If you get stuck, switch to it and carry on:

```bash
git fetch && git switch -C <branch> origin/<branch>
```

This always gives you the latest version of the branch, even if you fetched it before.
