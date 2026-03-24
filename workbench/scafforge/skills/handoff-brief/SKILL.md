---
name: handoff-brief
description: Create concise project handoff artifacts, especially a top-level START-HERE document and resume context for the next session or machine. Use when scaffolding finishes, a milestone closes, or long-running autonomous work needs a compact restart surface.
---

# Handoff Brief

Use this skill to create a restartable handoff surface with actual project state.

## Procedure

### 1. Gather current state

Read these files to understand current project state:
- `docs/spec/CANONICAL-BRIEF.md` — what the project is
- `tickets/manifest.json` — current ticket state
- `tickets/BOARD.md` — work queue overview
- `.opencode/state/workflow-state.json` — current workflow state
- `.opencode/meta/bootstrap-provenance.json` — how the scaffold was generated

### 2. Write START-HERE.md

Use the template in `assets/templates/START-HERE.template.md` as a starting structure, but populate it with ACTUAL project state:

**What This Repo Is** — actual project summary from the canonical brief

**Current State** — actual current state:
- What has been completed
- What is in progress
- What is blocked

**Read In This Order** — actual reading order for this project:
1. README.md
2. AGENTS.md
3. docs/spec/CANONICAL-BRIEF.md
4. docs/process/workflow.md
5. tickets/BOARD.md
6. tickets/manifest.json

**Current Or Next Ticket** — the actual active ticket or recommended next ticket from the manifest

**Validation Status** — results of the last repo-process-doctor audit

**Known Risks** — actual risks and open questions from the canonical brief

**Next Action** — the exact next useful action for whoever opens this repo next

### 3. Validate

Verify the handoff:
- START-HERE.md exists and has all sections populated with real content
- The referenced ticket actually exists in the manifest
- The reading order files all exist
- The next action is specific and actionable

## After this step

The scaffold flow is complete. Return to `../scaffold-kickoff/SKILL.md` step 10 for the done checklist.

## Rules

- This skill is a closeout and restart refiner, not a scaffold entrypoint
- Populate with actual project state, not template placeholders
- Keep it concise — this is a restart surface, not comprehensive documentation

## References

- `references/handoff-checklist.md` for the required sections
- `assets/templates/START-HERE.template.md` for the base template
