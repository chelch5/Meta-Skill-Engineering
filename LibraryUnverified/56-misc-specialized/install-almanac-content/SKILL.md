---
name: install-almanac-content
description: |
  Install skills, agents, and teams from the agent-almanac registry into supported
  agentic frameworks (Claude Code, Cursor, OpenCode, etc.) using the agent-almanac CLI.
  Triggers on: "install from agent-almanac", "agent-almanac install", "setup skills
  from almanac", "install agent skills", "setup agentic framework", "sync agent-almanac.yml",
  "gather team", "campfire commands". Covers framework detection, content search,
  dependency resolution, health auditing, and manifest-based syncing.
license: MIT
allowed-tools:
  - Bash
  - Read
  - Glob
metadata:
  author: Philipp Thoss
  version: "1.1"
  domain: general
  complexity: basic
  language: multi
  tags:
    - cli
    - installation
    - framework-integration
    - discovery
---

# Install Almanac Content

Use the `agent-almanac` CLI to install skills, agents, and teams into any supported agentic framework.

## When to Use

- Setting up a new project and need to install agentic skills, agents, or teams
- Installing all skills from a specific domain (e.g., `r-packages`, `devops`)
- Targeting multiple frameworks simultaneously (Claude Code, Cursor, OpenCode, etc.)
- Creating or syncing a declarative `agent-almanac.yml` manifest for reproducible setups
- Auditing installed content for broken symlinks or stale references

## When NOT to Use

- Installing skills from a different registry (not agent-almanac) — use the registry-specific installation method instead
- Manually copying skill files without dependency resolution — use `agent-almanac install` to ensure dependencies are included
- One-off skill evaluation without installation — read the skill directly rather than installing
- Installing system packages or language runtimes — use the appropriate package manager (npm, pip, cargo, etc.)
- Configuring agent framework settings unrelated to skill content — refer to framework-specific documentation

## Inputs

- **Required**: Content to install -- one or more skill, agent, or team IDs (e.g., `create-skill`, `r-developer`, `r-package-review`)
- **Optional**: `--domain <domain>` -- install all skills from a domain instead of naming individual IDs
- **Optional**: `--framework <id>` -- target a specific framework (default: auto-detect all)
- **Optional**: `--with-deps` -- also install agent skills and team agents+skills
- **Optional**: `--dry-run` -- preview changes without writing to disk
- **Optional**: `--global` -- install to global scope instead of project scope
- **Optional**: `--force` -- overwrite existing content
- **Optional**: `--source <path>` -- explicit path to agent-almanac root (default: auto-detect)

## Procedure

### Step 1: Detect Frameworks

Run framework detection to see which agentic tools are present in the current project:

```bash
agent-almanac detect
```

This scans the working directory for configuration files and directories (`.claude/`, `.cursor/`, `.opencode/`, `.agents/`, etc.) and reports which frameworks are active.

**Expected:** Output lists one or more detected frameworks with their adapter status. If no frameworks are detected, the universal adapter (`.agents/skills/`) is used as fallback.

**On failure:** If the CLI is not found, ensure it is installed and on PATH. If detection returns nothing and you know a framework is present, use `--framework <id>` to specify it explicitly. Run `agent-almanac list --domains` to verify the CLI can reach the registries.

### Step 2: Search for Content

Find skills, agents, or teams by keyword:

```bash
agent-almanac search <keyword>
```

To browse by category:

```bash
agent-almanac list --domains          # List all domains with skill counts
agent-almanac list -d r-packages      # List skills in a specific domain
agent-almanac list --agents           # List all agents
agent-almanac list --teams            # List all teams
```

**Expected:** Search results or filtered lists display matching content with IDs and descriptions.

**On failure:** If no results appear, try broader keywords. Verify the almanac root is reachable: `agent-almanac list` should show the full skill count. If it cannot find the root, pass `--source /path/to/agent-almanac`.

### Step 3: Install Content

Install one or more items by name:

```bash
# Install specific skills
agent-almanac install create-skill write-testthat-tests

# Install all skills from a domain
agent-almanac install --domain devops

# Install an agent with its skills
agent-almanac install --agent r-developer --with-deps

# Install a team with its agents and their skills
agent-almanac install --team r-package-review --with-deps

# Target a specific framework
agent-almanac install create-skill --framework cursor

# Preview without writing
agent-almanac install --domain esoteric --dry-run

# Install to global scope
agent-almanac install create-skill --global
```

The CLI resolves the content from the registries, selects the appropriate adapter for each detected framework, and writes files to the framework-specific paths (e.g., `.claude/skills/` for Claude Code, `.cursor/rules/` for Cursor).

**Expected:** Output confirms the number of items installed and the target framework(s). Installed content appears in the correct framework directory.

**On failure:**
- If items are not found: Run `agent-almanac list` to see available IDs, or check the registry files (`skills/_registry.yml`, `agents/_registry.yml`, `teams/_registry.yml`) to verify the exact ID spelling
- If files already exist: Run `agent-almanac install <id> --force` to overwrite
- If installation reports "0 items installed": Check that the ID exists with `agent-almanac search <partial-id>`, then retry with the exact registry name
- If dependency resolution fails: Run `agent-almanac audit` to check for broken references, then reinstall with `--force`

### Step 4: Verify Installation

Run a health check on all installed content:

```bash
agent-almanac audit
```

To audit a specific framework or scope:

```bash
agent-almanac audit --framework claude-code
agent-almanac audit --global
```

To see what is currently installed:

```bash
agent-almanac list --installed
```

**Expected:** Audit reports all installed items as healthy with no broken references. The `--installed` listing shows each item with its type and framework.

**On failure:** If the audit reports broken items, reinstall them with `--force`. If symlinks are broken, verify the almanac source path has not moved. Run `agent-almanac install <broken-id> --force` to repair.

### Step 5: Manage with a Manifest (Optional)

For reproducible setups, use a declarative `agent-almanac.yml` manifest:

```bash
# Generate a starter manifest
agent-almanac init
```

This creates `agent-almanac.yml` in the current directory with detected frameworks and placeholder content lists. Edit the file to declare desired content:

1. Open `agent-almanac.yml` in a text editor
2. Verify or update the `source` path to your agent-almanac installation
3. List framework IDs under `frameworks:` (run `agent-almanac list --frameworks` to see available options)
4. Add skill IDs under `skills:` (prefix with `domain:` to install entire domains)
5. Add agent IDs under `agents:` if needed
6. Add team IDs under `teams:` if needed
7. Save the file

Example manifest:

```yaml
source: /path/to/agent-almanac
frameworks:
  - claude-code
  - cursor
skills:
  - create-skill
  - domain:r-packages
agents:
  - r-developer
teams:
  - r-package-review
```

Then install everything declared in the manifest:

```bash
agent-almanac install
```

To reconcile installed state with the manifest (install missing, remove extra):

```bash
agent-almanac sync
agent-almanac sync --dry-run  # Preview first
```

**Expected:** Running `install` with no arguments reads the manifest and installs all declared content. Running `sync` brings the installed state into alignment with the manifest, adding missing items and removing undeclared ones.

**On failure:**
- If `sync` reports "No agent-almanac.yml found": Run `agent-almanac init` in the current directory, then edit the generated file before retrying
- If the manifest resolves to 0 items: Run `agent-almanac list` to verify exact IDs, then update the manifest with correct names (IDs are case-sensitive)
- If `install` without arguments reports "nothing to install": Check that `agent-almanac.yml` exists in the current directory and contains at least one of `skills:`, `agents:`, or `teams:` sections
- If sync wants to remove unexpected items: Run `agent-almanac sync --dry-run` to preview, then either update the manifest to include those items or confirm the removal

### Step 6: Manage Teams as Campfires (Optional)

The campfire commands provide a warm, team-oriented alternative to `install --team`:

```bash
# Browse all available team circles
agent-almanac campfire --all

# Inspect a specific circle (members, practices, pattern)
agent-almanac campfire tending

# See shared agents between teams (hearth-keepers)
agent-almanac campfire --map

# Gather a team (install with arrival ceremony)
agent-almanac gather tending
agent-almanac gather tending --ceremonial    # Show each skill arriving
agent-almanac gather tending --only mystic,gardener  # Partial gathering

# Check fire health (burning / embers / cold)
agent-almanac tend

# Scatter a team (uninstall with farewell)
agent-almanac scatter tending
```

Campfire state is tracked in `.agent-almanac/state.json` (git-ignored, local to the project). Fires have thermal states: **burning** (used within 7 days), **embers** (within 30 days), **cold** (30+ days). Running `tend` warms all fires and reports their health.

Shared skills are protected during scatter — if a skill is needed by another gathered fire, it remains installed. Shared agents walk between fires rather than being duplicated.

All campfire commands support `--quiet` (standard reporter output) and `--json` (machine-parseable) for scripting.

**Expected:** Teams are gathered and managed with state tracking. `campfire --all` shows fire states. `tend` reports health.

**On failure:** If campfire state is corrupted, delete `.agent-almanac/state.json` and re-gather teams. If `gather` fails, check that the team name matches an entry in `teams/_registry.yml`.

## Output Contract

After completing this skill:

1. **Installed Content**: Skills, agents, or teams are installed to framework-specific directories (e.g., `.claude/skills/`, `.cursor/rules/`, `.agents/skills/`)
2. **Verified State**: `agent-almanac audit` reports all items as healthy with no broken references
3. **Resolvable References**: Installed skills are accessible via their framework's skill resolution (e.g., `/skill-name` in Claude Code)
4. **Manifest Alignment**: If using `agent-almanac.yml`, the installed state matches the manifest declarations
5. **Team State (if applicable)**: Gathered teams track thermal state in `.agent-almanac/state.json`

## Validation

Run these commands to verify successful completion:

- [ ] Run `agent-almanac detect` and confirm it lists the intended framework(s)
- [ ] Run `agent-almanac list --installed` and verify all declared content appears in the output
- [ ] Run `agent-almanac audit` and confirm output shows "0 broken items" or "all healthy"
- [ ] Test a single installed skill: Run the framework's skill invocation (e.g., in Claude Code: `/create-skill` should resolve to the installed skill)
- [ ] If using a manifest: Run `agent-almanac sync --dry-run` and confirm output shows "0 changes needed" or "already in sync"

## Next Steps

- After installing skills: Use `create-skill` to author new skills for the almanac registry if the installed skills do not meet your needs
- After installing agents: Use `configure-mcp-server` to set up any MCP servers the agents require
- If audit reports broken items: Use `audit-discovery-symlinks` to diagnose and repair symlink issues
- If creating reproducible setups: Use `design-cli-output` patterns for consistent terminal reporting in custom scripts

## Common Pitfalls

- **Forgetting `--with-deps` for agents and teams**: Installing an agent without `--with-deps` installs only the agent definition, not its referenced skills. The agent will be present but unable to follow its skill procedures. Always use `--with-deps` for agents and teams unless you have already installed the dependencies separately.
- **Manifest drift**: After manually installing or removing content, the manifest falls out of sync with the actual installed state. Run `agent-almanac sync` periodically, or always install through the manifest to keep them aligned.
- **Scope confusion (project vs global)**: Content installed with `--global` goes to `~/.claude/skills/` (or equivalent), while project-scope content goes to `.claude/skills/` in the current directory. If a skill is not found, check whether it was installed in the wrong scope.
- **Stale source path**: If the agent-almanac repository is moved or renamed, the `--source` path in manifests and auto-detection will break. Update the `source` field in `agent-almanac.yml` or re-run `agent-almanac init`.
- **Framework not detected**: The detector looks for specific files and directories. A freshly initialized project may not have these yet. Use `--framework <id>` explicitly until the project has the expected structure, or rely on the universal adapter.
- **Campfire thermal state confusion**: Fires go cold after 30 days without use. Running `agent-almanac tend` resets the timer for all gathered fires. If a fire shows as "cold," it is still fully installed — the thermal state reflects recency of use, not installation health.

## Related Skills

- `create-skill` -- author new skills to add to the almanac before installing them
- `configure-mcp-server` -- set up MCP servers that agents may need after installation
- `write-claude-md` -- configure CLAUDE.md to reference installed skills
- `audit-discovery-symlinks` -- diagnose symlink issues for Claude Code skill discovery
- `design-cli-output` -- terminal output patterns used by the CLI's reporter and campfire ceremony
