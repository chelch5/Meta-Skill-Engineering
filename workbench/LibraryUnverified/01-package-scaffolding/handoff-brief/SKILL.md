---
name: handoff-brief
description: "Create concise project handoff artifacts, especially a top-level START-HERE document and short resume context for the next session or machine. Use when scaffolding finishes, a milestone closes, or long-running autonomous work needs a compact restart surface. Do not use when work is fully complete with nothing pending, or for loading context at session start."
---

# Handoff Brief

Use this skill to create a restartable handoff surface with actual project state.

## Procedure

### 1. Gather current state

Read these sources to understand current project state:

**Always check:**
- Git state: `git branch --show-current && git log --oneline -5 && git status --short`
- Test state: run test command and capture result
- README.md and AGENTS.md for project context

**If available, also check:**
- Canonical brief (`docs/spec/CANONICAL-BRIEF.md` or `docs/BRIEF.md`)
- Ticket manifest (`tickets/manifest.json`) and board (`tickets/BOARD.md`)
- Workflow state (`workflow-state.json` or equivalent)

### 2. Write START-HERE.md

Populate with ACTUAL project state — never template placeholders:

```markdown
# START-HERE

Generated: [ISO timestamp]

## What This Repo Is
[Actual project summary from canonical brief or README]

## Current State
- What has been completed
- What is in progress
- What is blocked

## Read In This Order
1. This file (START-HERE.md)
2. README.md
3. AGENTS.md
4. [Canonical brief path]
5. [Ticket board path]

## Current Or Next Ticket
[The actual active ticket or recommended next ticket]

## Test Status
[PASSING | FAILING: N failures | NOT RUN]

## Blockers
| Blocker | Impact | Resolution |
|---------|--------|------------|
| [Description] | [What it blocks] | [What's needed] |

## Known Risks
[Actual risks and open questions]

## Next Action
[The exact next useful action for whoever opens this repo next]

## Commands to Resume
```bash
[Exact commands to verify state and continue]
```
```

### 3. Place handoff correctly

```bash
# For session handoffs (repo root, temporary)
# Write START-HERE.md to repo root

# For milestone handoffs (persistent archive)
mkdir -p docs/handoffs
# Write to docs/handoffs/[milestone]-[date].md
```

### 4. Validate

Verify the handoff:
- [ ] START-HERE.md exists with all sections populated with real content
- [ ] Referenced tickets actually exist
- [ ] Reading order files all exist
- [ ] Next action is specific and actionable (not "continue working")
- [ ] Commands to resume actually work
- [ ] Test status is current, not assumed

### 5. Commit handoff (if appropriate)

```bash
git add START-HERE.md
git commit -m "docs: handoff brief for [milestone/session]

State: [brief summary]
Next: [primary next action]"
```

## Output contract

A `START-HERE.md` file at repo root containing:
- Project summary (what this repo is)
- Current state (done / in progress / blocked)
- Reading order with actual file paths
- Active or next ticket
- Test status
- Blockers with resolution paths
- Next action (specific and actionable)
- Resume commands (exact, working commands)

## Rules

- This skill is a closeout and restart refiner, not a scaffold entrypoint
- Populate with actual project state, not template placeholders
- Keep it concise — this is a restart surface, not comprehensive documentation
- Better to handoff with noted gaps than no handoff at all

## Failure handling

- **Incomplete information**: Document what's known, explicitly note gaps
- **Tests failing**: Document which tests fail and why — don't hide failures
- **Uncommitted changes**: Either commit or explicitly list what's uncommitted and why
- **Unclear next steps**: At minimum, state "Needs planning before continuing"

## References

- This is step 9 of the scaffold-kickoff flow — return to `../scaffold-kickoff/SKILL.md` step 10 for the done checklist
- Complement to project-context (load context) and ticket-execution (do work)
