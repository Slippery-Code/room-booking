# Lab 3: code → production

**Time:** 50 minutes, in pairs · **Goal:** ship the app, then change a rule that is already live, with a lightweight, spec-driven change.

Everyone works on this repo's finished app (`step-2-build`), whatever stack you used before. One laptop per pair is enough. Swap the keyboard halfway.

## 1. Ship it (10 min)

**a. Create an empty repository** on GitHub: **New repository** → name it `room-booking` → **Public** → don't add a README → **Create**.

**b. Turn on Pages:** in the new repo, go to **Settings → Pages → Source: GitHub Actions**.

**c. Push the finished app to it as `main`:**

```bash
git fetch && git switch -C step-2-build origin/step-2-build
git remote add mine https://github.com/<your-username>/room-booking.git
git push mine step-2-build:main
```

**d. Watch it deploy:** in the **Actions** tab, **CI** runs first, then **Deploy to GitHub Pages**. If Deploy didn't start, open it and click **Run workflow**.

**e. Open your live site** at `https://<your-username>.github.io/room-booking/` and make a booking.

## 2. The change request (5 min)

A message from the coworking space's community manager:

> The 2-hour daily limit is causing trouble. Members book an hour in the small room for a call and then can't get the large room for their team meeting in the afternoon. Please make the limit **2 hours per room per day** instead of 2 hours across all rooms. Everything else stays the same.

**Try the current behaviour on your live site first:** book 2 hours in one room, then try another room on the same day. You should be refused. That's the rule you're changing.

## 3. Change it with OpenSpec (30 min)

OpenSpec is a lighter way to do spec-driven change: a short proposal and a spec delta, not a whole plan.

| Step | Command (Claude Code) | What you do |
|---|---|---|
| 1 | `openspec init` (in the terminal) | Choose your agent |
| 2 | `/opsx:explore` | Ask the agent where the limit lives: in the PRD, in the code, in the tests. **No changes yet** |
| 3 | `/opsx:propose <short-name>` | Review the proposal, the spec delta and the tasks. See below |
| 4 | `/opsx:apply` | **Tests before the change.** See below |
| 5 | `npm run verify`, commit, `git push mine step-2-build:main` | Watch CI and the deploy, then try the new rule on the live site |
| 6 | Teach the next agent | See below |
| 7 | `/opsx:archive` | Fold the change into the specs |

Other agents: Codex uses `$openspec-explore`, `$openspec-propose`, and so on. Cursor and Copilot use `/opsx-explore`, `/opsx-propose`, and so on.

### Step 3: review the proposal

- Is the new rule stated exactly? What happens to someone who already has 2 hours across two rooms today?
- What does the refusal message say now? Does it still make sense?
- The PRD still describes the old rule. Does the proposal update it, or are there now two specs that disagree? Decide which one is the source of truth.

### Step 4: tests before the change

Ask for tests of the **new** rule and run them **before** the agent changes any code. They should fail.

Then let it change the code. Some **existing** tests will now fail. For each one, before the agent edits it, ask:

- Does this test describe the **old rule**? Then it should change, because the rule changed.
- Or did it only **happen to use** two rooms? Then the test is still right and its setup needs fixing.

Watch for an agent that "fixes" failing tests by deleting them or loosening what they check.

### Step 6: teach the next agent

Ask:

> Add to AGENTS.md anything you got wrong or had to ask about during this change, so the next agent working in this repo gets it right first time.

(BMAD's `bmad-project-context` skill does the same thing and records it as a "pitfall".)

Review what it adds before you commit it:

- Would it have changed what the agent did during this change?
- Does it apply to future changes, or does it only describe this one?
- Could an agent follow it without asking you anything?

## Finished early? (optional)

Not required, and the comparison below always comes first: when the room is called back, stop where you are. Do them in this order.

1. **Add a real CI gate.** Add something you would keep in a real project to CI: accessibility tests or a Lighthouse check are good candidates. Then try to push a change that fails it. `AGENTS.md` normally tells the agent not to touch `.github/workflows/`; this task asks for it, so say so. Don't lower a threshold or remove the check to get green.
2. **Spot the spec drift.** Compare the OpenSpec spec, the PRD and the code. Which of them now say different things? Which one is the source of truth?
3. **Roll it back.** Revert the change with `git revert`, push, and watch CI redeploy the old rule.

## 4. Compare (5 min, whole room)

- Each pair reads out what they added to AGENTS.md.
- How many existing tests broke, and how many of them really described the old rule?
- Lab 1 planned a whole new product. This change touched one rule. How much process does each one deserve, and when is each one right?

## Troubleshooting

| Problem | Fix |
|---|---|
| Push asks for a password | GitHub needs a token or SSH, not your password. `gh auth login` is the quickest way |
| Deploy fails with "Pages not enabled" | Do step 1b, then re-run the Deploy workflow |
| Site shows a blank page | Wait a minute and hard-refresh. Check that the URL includes `/room-booking/` |
| Deploy keeps failing | Reproduce and fix locally with `npm run dev`. Deploying is a bonus, the fix isn't |
