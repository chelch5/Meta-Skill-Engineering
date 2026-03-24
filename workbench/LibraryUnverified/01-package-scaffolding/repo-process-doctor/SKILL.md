---
name: repo-process-doctor
description: "Audit existing repositories for agent-workflow drift and repair opportunities. Use when a repo has custom agents, commands, process docs, or ticket systems and you need to diagnose contradictory status semantics, raw-file stage control, missing workflow-state tools, unsafe read-only delegation, or other workflow smells. Do not use for setting up a new repo (use scaffold-kickoff) or when issues are with code logic, not process."
---

# Repo Process Doctor

Use this skill to inspect and repair agent-workflow issues in an existing repository.

## Modes

- **audit** — Report findings only. Use for initial inspection or post-scaffold verification.
- **propose-repair** — Write a repair plan for user approval. Use when unsure if repairs change project intent.
- **apply-repair** — Apply repairs directly. Use when findings are clearly safe to fix.

## Procedure

### 1. Inventory process artifacts

Scan for all process-related files:
```bash
find . -name "AGENTS.md" -o -name "BOARD.md" -o -name "manifest.json" -path "*/tickets/*" \
  -o -name "workflow*.json" -o -name "*.yaml" -path "*agents*" \
  -o -name "*.md" -path "*/tickets/*" 2>/dev/null
```

### 2. Check for workflow smells

**Contradictory status semantics** — Different files define different status values.
```bash
grep -r "status:" tickets/ docs/ AGENTS.md 2>/dev/null | sort -u
```
Red flag: "done" vs "completed" vs "closed" in different files.

**Missing state tools** — Tickets exist but no tools to read/update them programmatically.
```bash
ls **/tools/*ticket* **/tools/*state* **/tools/*status* 2>/dev/null
```

**Unsafe read-only delegation** — Read-only agents with write permissions or write tasks.
```bash
grep -r "permissions:" **/agents/ 2>/dev/null
grep -rn "write\|edit\|create\|modify" **/agents/*review* **/agents/*research* 2>/dev/null
```

**Orphaned tickets** — In-progress tickets with no recent activity.

**Circular dependencies** — Tickets that depend on each other.

**Stale board** — BOARD.md older than latest ticket modification.

**Raw-file stage control** — Agents editing state files directly instead of using tools.

### 3. Generate diagnosis report

```markdown
# Process Doctor Report
Generated: [timestamp]

## Summary
- Files scanned: N
- Issues found: N (X critical, Y warnings)

## Critical Issues
| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| [smell name] | [file] | [what breaks] | [safer pattern] |

## Warnings
| Issue | Location | Recommendation |
|-------|----------|----------------|
| [smell name] | [file] | [suggestion] |

## Health Score
[GREEN | YELLOW | RED] — [explanation]
```

### 4. Choose repair approach

**Safe repairs (apply directly):**
- Regenerating derived docs (BOARD.md) from canonical state (manifest)
- Aligning status values to canonical set
- Removing raw-file stage control where tool-backed alternatives exist
- Fixing read-only agents that have mutating permissions
- Normalizing contradictory status semantics

**Intent-changing repairs (escalate to user):**
- Changes that affect project scope or product intent
- Choosing between unresolved stack/runtime options
- Changing provider or model choices
- Deleting or rewriting curated human decisions

### 5. Apply repairs (if in apply-repair mode)

For each safe repair:
1. Read the finding and identify the safer pattern
2. Apply the fix
3. Verify the change resolves the finding
4. Leave an obvious repair trail (document what was changed and why)

For each intent-changing repair:
1. Present the finding and proposed repair to the user
2. Explain why this might change project intent
3. Wait for user decision before proceeding

### 6. Post-repair verification

Re-run the audit to confirm findings are resolved. All safe repairs should produce a clean pass.

## Output contract

- Concise diagnosis of each finding with root cause
- Chosen mode (audit / propose-repair / apply-repair)
- Exact files patched (if apply-repair)
- Target safer pattern for each repair
- Post-repair verification results

## Rules

- Do not preserve contradictory status semantics just because they already exist
- Do not keep multi-surface workflow state if one surface can become derived
- Treat read-only mutation paths as blockers
- Default to apply-repair for safe repairs, escalate intent-changing repairs
- Always leave an obvious repair trail — never silently fix without evidence
- Do not leave a repo in a mixed old/new workflow state

## Failure handling

- **No process artifacts found**: Report "No agent infrastructure detected. Use scaffold-kickoff to create."
- **Conflicts in repair**: If auto-fix would lose data, stop and list conflicting files for manual resolution
- **Unable to parse ticket format**: Flag specific files as malformed, continue with parseable files

## References

- This is step 8 of the scaffold-kickoff flow — continue to `../handoff-brief/SKILL.md`
- Complements scaffold-kickoff: kickoff creates, doctor maintains
