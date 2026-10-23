# Lab 2: spec → code

**Time:** 60 minutes · **Goal:** take one story from your plan to tested, reviewed code in a pull request, with a human approving at every gate.

## Where to start

| You have | Start from |
|---|---|
| Your own plan from Lab 1 (this repo or your own stack) | Your Lab 1 work |
| No finished plan, or you'd rather use a known-good one | The prepared plan for this repo: `git fetch && git switch -C step-1-plan origin/step-1-plan` |

The plan's stories are in `_bmad-output/planning-artifacts/epics.md`.

## Steps

### 1. Pick one story (2 min)

Pick a story near the start of the plan, since later stories build on earlier ones. On the prepared plan, start with **Story 1.1**.

### 2. Build it (13 min)

Run `bmad-build` and name the story, for example:

> Implement Story 1.1 from epics.md

It will ask clarifying questions, then show you a **spec**: what it intends to change and how it will check it. **Read the spec before you approve.** This is your main gate. Correct it if anything is wrong or missing.

### 3. Implementation and triage (20 min)

After you approve, it implements, runs the tests, and runs its own reviewers. The reviewers are told to find problems, so expect some noise. For each finding, decide:

- **Fix:** a real problem.
- **Dismiss, with a reason:** not a problem, or out of scope for this story.

Triage is the skill. Don't accept everything, and don't dismiss everything.

### 4. An independent review (10 min)

Start a **fresh session** (or use a different agent) so the reviewer hasn't seen the build conversation. Then run `bmad-code-review` on your changes.

Did it find anything the built-in reviewers missed?

### 5. Ship it to a pull request (10 min)

```bash
npm run verify            # option A; use your own stack's equivalent for option B
git switch -c story-1-1   # use your story's number
git add -A && git commit -m "Implement Story 1.1"
```

Push to **your own** GitHub repository and open a pull request there. You can't push to the workshop repo, and that's intentional.

### 6. If you finish early (optional)

Not required. Do them in this order, and stop anywhere.

1. **Swap the reviewer.** Run `bmad-code-review` again with a different agent or model than the one that built the story. If you only have one, swap laptops with a neighbour. Compare the two sets of findings: what did each catch that the other missed?
2. **Second story.** Take another story through steps 2–5, preferably one that builds on your first.
3. **Attack your tests.** Ask the agent for extra edge-case tests for your story, then read them. Which of them would actually fail if the rule were wrong?
4. **Fix AGENTS.md.** Pick one mistake the agent made today. Add a rule to `AGENTS.md` that would have prevented it, then repeat the task. Did it help?

## Questions to discuss

- Which edge cases do your tests cover? Which ones don't they cover?
- Where did you change the agent's spec, and why?
- What would you want a human reviewer to check that no agent did?

## Falling behind?

See the finished implementation of every story and read its diff and tests:

```bash
git fetch && git switch -C step-2-build origin/step-2-build
```
