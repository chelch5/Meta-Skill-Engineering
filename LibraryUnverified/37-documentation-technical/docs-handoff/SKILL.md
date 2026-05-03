---
name: docs-handoff
description: Synchronize README, AGENTS.md, changelogs, and handoff documents with the current codebase state after milestones complete. Use when documentation drift is detected or handoff artifacts are requested. Do not use for writing application code, verifying acceptance criteria, reviewing code quality, or planning future work.
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode]
metadata:
  owner: codex
  domain: docs-handoff
  maturity: draft
  risk: low
  tags: [docs, handoff]
---

# Purpose

Updates README, AGENTS.md, changelogs, and handoff documents after a milestone or ticket
completes. Ensures documentation surfaces stay synchronized with the actual state of the
codebase so the next person (or agent) can resume without re-discovery.

# When to use

- A milestone, sprint, or ticket just completed and docs may be stale
- Someone asks to update README, AGENTS.md, CHANGELOG, or a START-HERE document
- A handoff brief is needed for the next session, team, or agent
- A PR merged significant changes and no doc update accompanied it
- Documentation drift is detected between code state and written guides

# When NOT to use

- The task is writing or modifying application code — use an implementation skill appropriate for the codebase
- The task is verifying acceptance criteria or testing functionality — use a validation or testing skill
- The task is reviewing code quality or security — use a code review skill
- The user wants to plan future work or create a roadmap — use a planning skill
- The task is creating initial project scaffolding — use a project bootstrap skill

# Procedure

## Phase 1: Discovery

1. Build doc surface inventory: Run `find . -maxdepth 4 \( -name 'README*' -o -name 'AGENTS*' -o -name 'CHANGELOG*' -o -name 'START-HERE*' -o -name 'CONTRIBUTING*' -o -name 'LICENSE*' \) -type f 2>/dev/null | head -20` to locate documentation files. Group by directory to identify doc clusters.

2. Identify source directories: List code directories with `find . -type d \( -name 'node_modules' -o -name '.git' -o -name 'dist' -o -name 'build' -o -name 'venv' -o -name '__pycache__' -o -name '.venv' \) -prune -o -type d -print 2>/dev/null | grep -E '(src|lib|app|api|components|services|tests|docs)' | head -15`. These are "related source dirs" for change correlation.

3. Establish timeline: Run `git log --oneline --since="30 days ago" -- . 2>/dev/null | head -30` to get recent commits. If not a git repo, use `find <source-dirs> -type f -mtime -30 -exec ls -la {} \;` for file timestamps.

4. Correlate staleness: For each doc file, run `git log -1 --format='%ci' -- "<file>" 2>/dev/null || stat -c '%y' "<file>"` to get last modification. Compare against the most recent non-doc commit. A doc is **stale** if last modified more than 7 days before the most recent code change in its directory.

## Phase 2: Analysis

5. Identify drift scope: For each stale doc:
   - Determine its directory scope (same dir or sibling dirs)
   - Run `git log --oneline --since="<doc-last-modified-date>" -- "<related-source-dir>" 2>/dev/null | head -20` to list changes since doc was last touched
   - Run `git diff "<doc-last-modified-commit>"..HEAD --stat -- "<related-source-dir>" 2>/dev/null | head -30` to see what files changed
   - Look for patterns: new files (add to docs), deleted features (remove from docs), modified APIs (update examples), new dependencies (update install steps)

6. Check for broken references: Run `grep -nE '\[([^]]+)\]\(([^)]+)\)' "<doc-file>" 2>/dev/null | grep -v 'http' | cut -d'(' -f2 | cut -d')' -f1 | while read link; do test -f "$(dirname "<doc-file>")/$link" || echo "Broken: $link"; done` to identify invalid internal links.

## Phase 3: Content Updates

7. Draft updates by doc type:
   - **README**: Update project description, feature list (based on actual capabilities), quickstart steps (verify by checking package.json, requirements.txt, or similar), API/examples section, and installation instructions
   - **AGENTS.md**: Update agent role descriptions, tool lists, and capability summaries to match actual repository structure and scripts
   - **CHANGELOG**: Add entries since last doc update, grouped by type (Added/Changed/Fixed/Deprecated/Removed/Security). Each entry must reference a commit hash or PR number
   - **Other docs**: Update any sections referencing stale information, removing features that no longer exist and adding new capabilities with evidence

8. Create START-HERE if requested: Structure with:
   - Project purpose (1 paragraph, max 3 sentences)
   - Quickstart (numbered steps, each verifiable by running the command)
   - Architecture overview (file tree showing key directories with 1-line annotations)
   - Current state (what works now, what is in progress)
   - Next steps (immediate tasks or decisions needed)
   - Key files (list of 5-10 most important files with purpose)

## Phase 4: Validation & Handoff

9. Build handoff checklist table with columns: Doc | Status | Last Modified | Code Changes Since | Action Taken | Reviewer Needed

10. Present changes:
    - Show unified diff of each modified doc (`git diff --no-index` if not yet staged, or `git diff` if staged)
    - Display the handoff checklist
    - List any broken references found and resolution status
    - Note any assumptions made or information gaps identified

# Output contract

The output must include these five artifacts, each with specific content requirements:

1. **Doc Surface Inventory**: Table with columns `File Path | Type | Last Modified | Staleness Status | Related Source Dir`. Status values: `current` (modified within 7 days of last code change), `stale` (7-30 days behind), `critical` (>30 days behind), `orphaned` (references non-existent source files).

2. **Change Summary**: Bullet list grouped by documentation file. Each bullet must include: commit reference (hash or "N commits ago"), files changed count, and brief description of impact on documentation (e.g., "API endpoint added → update README examples").

3. **Updated Doc Content**: For each updated document, provide either:
   - Full rewritten document text if changes are substantial (>30% of lines modified)
   - Unified diff (`git diff` format) if changes are minimal
   - Clear before/after section comparison if changes are isolated to specific sections

4. **Handoff Checklist**: Table with columns `Doc | Status | Last Modified | Code Changes Since | Action Taken | Reviewer Needed`. Action Taken values: `updated`, `created`, `verified-current`, `flagged-orphaned`. Reviewer Needed is `yes` for critical docs or any new START-HERE documents, otherwise `no`.

5. **START-HERE Document** (if requested): Complete document with all required sections (purpose, quickstart, architecture, current state, next steps, key files) ready for immediate use. Include a validation note confirming each quickstart step was verified or explicitly marked as unverified with reason.

# References

- `references/handoff-contract.md` — Required sections for handoff documents (scope performed, evidence gathered, decision or recommendation, explicit handoff target)
- `references/success-criteria.md` — Quality criteria for strong outputs (evidence-backed, narrow scope, easy to continue from, free of adjacent-role drift)
- `references/anti-patterns.md` — Common mistakes to avoid (expanding into implementation, returning conclusions without evidence, replanning instead of serving assigned role, hiding blockers)
- Keep a Changelog format specification: https://keepachangelog.com/en/1.0.0/

# Next steps

- After documentation is updated, use a validation skill to verify the changes render correctly and links work
- If the docs update reveals significant architectural changes, use a planning skill to realign the project roadmap
- If the codebase lacks sufficient information to complete docs, use a research skill to find external templates or patterns
- For security-sensitive documentation updates, follow with a security review skill
- When handing off to another agent or team, include this skill's output (handoff checklist and diffs) in the handoff packet

# Failure handling

| Scenario | Detection | Response |
|----------|-----------|----------|
| Not a git repository | `git log` returns "not a git repository" or exit code 128 | Use `stat` for file modification timestamps. Cross-reference with filesystem dates only; note in output that timeline correlation is approximate. |
| Git history unavailable | `git log` shows only "Initial commit" or empty output | Proceed with file timestamp analysis. Set staleness threshold to 14 days instead of 7 due to lower precision. |
| No documentation files found | `find` returns empty for all doc patterns | Report "No documentation surface found" and suggest creating README.md and AGENTS.md. Provide template structure based on detected project type. |
| Doc references non-existent files | Link check identifies broken internal references | Flag as "orphaned reference" in checklist. Suggest removal if target has no replacement, or correction if replacement file exists with different name. Never invent replacement targets. |
| Massive change scope | >50 commits or >20 files changed since last doc update | Split by directory. Produce separate analysis for each major module (e.g., `src/`, `api/`, `docs/`). Present module-by-module handoff checklist with per-module prioritization. |
| Missing milestone context | User provides no ticket ID, date range, or PR reference | Ask: "What milestone or date range should I analyze for documentation updates?" Accept responses like "since last Monday", "after PR #123", or "ticket PROJ-456". Wait for answer before proceeding. |
| Source directory ambiguity | Cannot determine which source dirs relate to which docs | Use directory proximity: docs in root apply to all source dirs; docs in `docs/` apply to adjacent `src/` or root source files; docs in module folders apply only to that module. Document assumption in output. |
| All docs already current | No stale docs detected | Report "Documentation surface current" with inventory table showing all files marked `current`. List the most recent 5 commits that were analyzed to demonstrate coverage. |
| START-HERE sections incomplete | Cannot determine architecture or next steps from codebase | Mark sections as "TBD - requires maintainer input" in output. Do not invent architecture diagrams or future plans not evidenced by issues, TODOs, or roadmap files in the repo. |
