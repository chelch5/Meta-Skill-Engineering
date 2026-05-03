---
name: skill-installer
description: Install skills from GitHub repositories into the agent's skills directory. Use when a user explicitly asks to install a skill by name, install from a GitHub repo/path, or list available installable skills. Do NOT use for creating new skills, modifying existing skills, or local file operations.
metadata:
  short-description: Install skills from GitHub repos into agent skills directory
---

# Skill Installer

Installs skills from GitHub repositories into `$CODEX_HOME/skills` (defaults to `~/.codex/skills`). Supports installing from curated lists, experimental collections, or arbitrary GitHub repo paths.

## Purpose

Enable users to extend agent capabilities by installing pre-built skills from GitHub repositories.

## When to use

- User asks to "install skill X" by name
- User asks to install a skill from a GitHub repo/path (e.g., "install skill from owner/repo/path")
- User asks to list available installable skills
- User asks about curated or experimental skills from the openai/skills repo

## When NOT to use

- Creating a new skill from scratch (use skill-creator)
- Improving an existing skill (use skill-improver)
- Installing from local filesystem paths (not supported)
- Modifying already-installed skills (use skill-improver or edit directly)

## Procedure

1. Determine what the user wants:
   - If they ask to list skills → Run `scripts/list-skills.py`
   - If they ask to install by name → Determine source repo/path, then install
   - If they provide a GitHub URL/path → Parse and install from that location

2. For listing skills:
   - Default: `scripts/list-skills.py` (shows `.curated` from openai/skills)
   - For experimental: `scripts/list-skills.py --path skills/.experimental`
   - For JSON output: `scripts/list-skills.py --format json`
   - Parse output and present numbered list to user
   - Mark already-installed skills with "(already installed)"

3. For installing from curated list by name:
   - Run `scripts/install-skill-from-github.py --repo openai/skills --path skills/.curated/<skill-name>`
   - If user mentioned "experimental": use `skills/.experimental/<skill-name>` instead

4. For installing from arbitrary GitHub repo:
   - Parse the repo path from user input (owner/repo format or full URL)
   - Run `scripts/install-skill-from-github.py --repo <owner>/<repo> --path <path/to/skill>`
   - For full URLs: `scripts/install-skill-from-github.py --url <github-url>`

5. Handle authentication if needed:
   - Check for `GITHUB_TOKEN` or `GH_TOKEN` environment variable
   - Scripts will use these automatically for private repos
   - If auth fails, inform user to set GITHUB_TOKEN and retry

6. After successful installation:
   - Confirm: "Installed <skill-name> to <destination-path>"
   - Inform: "Restart the agent to load the newly installed skill"
   - If installation failed, report the specific error from the script output

## Output contract

- On success: Skill directory exists at `$CODEX_HOME/skills/<skill-name>` containing SKILL.md
- On list: Numbered list displayed with installation status annotations
- On failure: Clear error message explaining why (network, auth, path not found, or already exists)

## Failure handling

- **Network unavailable**: Report network error; suggest checking connection
- **404/Path not found**: Verify the repo/path exists; suggest checking spelling
- **Authentication failure**: Prompt user to set GITHUB_TOKEN or GH_TOKEN environment variable
- **Already exists**: Report that skill is already installed; suggest updating instead
- **Script not found**: Verify working directory is the skill-installer package root
- **Invalid repo format**: Guide user to provide owner/repo format or full GitHub URL

## Notes

- Curated listing is fetched from `https://github.com/openai/skills/tree/main/skills/.curated` via GitHub API
- Experimental skills are at `skills/.experimental` in the same repo
- System skills (`.system`) are preinstalled; if user asks, explain they're already included
- Scripts default to `main` branch but support `--ref <branch/tag>`
- Install method: tries direct download first, falls back to git sparse checkout if auth fails
- Multiple skills can be installed in one run with multiple `--path` arguments

## Scripts reference

- `scripts/list-skills.py [--repo <repo>] [--path <path>] [--ref <ref>] [--format text|json]`
- `scripts/install-skill-from-github.py --repo <owner>/<repo> --path <path> [--ref <ref>] [--dest <path>] [--method auto|download|git]`
- `scripts/install-skill-from-github.py --url <github-url>`
