# Setup: detailed instructions

The [README](../README.md) has the short version. This page covers each requirement, what `npm run check` reports, and common problems.

## What you need

| Requirement | Minimum | Notes |
|---|---|---|
| Laptop | Any OS from the last ~10 years | You need permission to install software on it |
| Node.js | **24.15** (or 22.22.2) | Install the current LTS (24). npm comes with it |
| git | Any recent version | Name and email configured (see below) |
| uv | Any recent version | Runs the Python scripts the planning framework uses |
| Python | **3.10** | uv installs it for you (see below) |
| GitHub account | Free | Used in Lab 3 to push and deploy |
| AI coding agent | Signed in and working | Any one: Claude Code, Codex, GitHub Copilot, Cursor, Gemini CLI, OpenCode, or similar |
| A programming language | Working knowledge of one | Any language. In Labs 1 and 2 you can work in your own stack |

## Installing

### Node.js

Download the **LTS** installer from [nodejs.org](https://nodejs.org), or use a version manager:

| OS | Command |
|---|---|
| macOS (Homebrew) | `brew install node@24` |
| Windows (winget) | `winget install OpenJS.NodeJS.LTS` |
| Linux / macOS (nvm) | `nvm install 24` |

Check with `node --version`. It must print `v24.15.0` or higher (`v22.22.2` or higher also works).

### git

| OS | How |
|---|---|
| macOS | `xcode-select --install`, or `brew install git` |
| Windows | Installer from [git-scm.com](https://git-scm.com), or `winget install Git.Git` |
| Linux | Your package manager, e.g. `sudo apt install git` |

Then set your identity once:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### uv and Python

uv is a Python package and version manager. Install it:

| OS | Command |
|---|---|
| macOS / Linux | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| macOS (Homebrew) | `brew install uv` |
| Windows | `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 \| iex"` |
| Windows (winget) | `winget install --id=astral-sh.uv -e` |

Then let uv install a recent Python. This doesn't touch any Python you already have:

```bash
uv python install 3.12
```

Check with `uv --version`. Open a new terminal first if the command isn't found.

### AI coding agent

Bring whichever one you already use. What matters is that it is **installed, signed in, and can edit files in a folder you open**. Test it before Saturday by opening this repo in it and asking it to explain `AGENTS.md`.

| Agent | Get it | Notes |
|---|---|---|
| Claude Code | [claude.com/claude-code](https://claude.com/claude-code) | Needs a Claude Pro/Max/Team plan or an API key |
| Codex CLI | [github.com/openai/codex](https://github.com/openai/codex) | Works with a ChatGPT plan or an API key |
| GitHub Copilot | VS Code extension or Copilot CLI | Agent mode needs a Copilot plan |
| Cursor | [cursor.com](https://cursor.com) | Use the Agent panel |
| Gemini CLI / OpenCode / other | Their own docs | Any agent that reads `AGENTS.md` and runs commands works |

Free tiers change often and can hit rate limits mid-workshop. A paid plan you already have is the safest option.

### OpenSpec

```bash
npm install -g @fission-ai/openspec@1.14.3
```

Use exactly this version so everyone sees the same commands on the day.

BMAD needs no install now. It is set up inside each project during Lab 1.

## Reading `npm run check`

| Symbol | Meaning | Action |
|---|---|---|
| ✓ | OK | None |
| ! | Warning | Fix it if you can. The check prints the command to run |
| ✗ | Problem | Must be fixed before the workshop |

"No coding agent CLI found" is fine if your agent runs inside an editor (Cursor, Copilot in VS Code). The check can only see command-line agents.

## Common problems

| Problem | Fix |
|---|---|
| `EACCES` / permission denied on `npm install -g` (macOS/Linux) | Don't use `sudo`. Install Node through Homebrew or nvm instead of the .pkg installer, then retry |
| `npm`, `node` or `uv` not found right after installing | Close and reopen the terminal |
| "Python 3.10+ not found" | Run `uv python install 3.12`. The Python that ships with macOS is too old |
| `git clone` asks for a password | The repository is public, so this means a typo in the URL. Copy it from the README |
| PowerShell blocks scripts (Windows) | Use Command Prompt or Git Bash, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Node version too old | Install the LTS again; on nvm run `nvm use 24` |
| Corporate laptop blocks installs | Bring a personal laptop if you can. Company-managed agents often can't be used outside work |

Still stuck? Bring the output of `npm run check` and we'll sort it out at the start of the day.

## Optional

- **GitHub CLI** (`gh`): handy for pull requests in Lab 3, not required.
- A quick test of the app: `npm run dev` and open the link it prints. You should see a page titled *Room Booking*.
