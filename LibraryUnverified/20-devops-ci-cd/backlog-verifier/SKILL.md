---
name: backlog-verifier
description: |
  Verify that tickets, backlog items, and task packs are coherent, actionable, non-duplicative, and correctly sequenced for execution.

  Triggers on: requests to check a backlog, verify ticket readiness, validate task boards before agent consumption, find duplicate or overlapping work items, or assess backlog quality.

  Does NOT trigger on: code review requests, writing new plans from scratch, or general project planning without an existing backlog surface.
---

# Purpose

Transform an unvalidated backlog into an executable one by identifying blockers, duplicates, gaps, and sequencing issues before work begins. This skill acts as a quality gate that prevents agents from starting on ill-defined or conflicting work.

# When to use

- A user explicitly asks to verify, check, or validate a backlog, task board, or ticket set
- Before agents begin consuming items from a task board or backlog
- When tickets may overlap or duplicate each other
- When the sequence of work is unclear or potentially wrong
- When preparing a sprint or iteration and readiness is uncertain

# When NOT to use

- The request is to review code, diffs, or implementations
- The user wants to create a new backlog or plan from scratch
- The task is general project planning without an existing backlog surface to verify
- The request is to write or generate new tickets (this skill validates; it does not author)

# Procedure

## 1. Read the backlog surface

Locate and load the backlog from the user's context:
- Ticket trackers (GitHub Issues, Jira, Linear, etc.)
- Task boards or project boards
- Markdown files listing work items
- Agent task packs or job queues

Capture each item with: ID/title, current description, assigned owner (if any), and stated status.

## 2. Check each item for readiness

Apply the readiness criteria from `references/readiness-checks.md` to every item:

| Criterion | Validation |
|-----------|------------|
| Clear objective | Can a neutral observer understand what success looks like? |
| Observable done-state | Is there a concrete, verifiable condition that marks completion? |
| Dependencies named | Are prerequisite items explicitly listed and trackable? |
| No hidden prerequisites | Is there implied work not captured in any ticket? |
| Validation path exists | Can completion be verified without subjective judgment? |

Flag any item failing two or more criteria as "Blocked or Weak."

## 3. Detect duplicates and overlap

Compare all items pairwise using signals from `references/overlap-signals.md`:

- Same files or subsystem: Items targeting identical code areas or components
- Same objective with different wording: Items describing the same goal using different terminology
- Accidental satisfaction: One ticket's completion would unintentionally fulfill another

When overlap is found:
- Mark as duplicate if one item fully subsumes another
- Mark as overlap if items partially intersect but have distinct aspects
- Note the specific files/subsystems involved

## 4. Identify gaps and sequencing conflicts

Analyze dependencies and ordering:
- Items claiming dependencies that do not exist in the backlog (missing prerequisites)
- Items sequenced to start before their dependencies complete
- Circular dependency chains
- Missing exploratory or spike work when implementation details are unclear

## 5. Generate the minimum fix set

Using repair patterns from `references/repair-patterns.md`, derive the smallest set of actions that would make the backlog executable:

| Pattern | When to apply |
|---------|---------------|
| Split by observable outcome | One ticket has multiple distinct done-states |
| Insert missing prerequisite | A dependency exists but is not tracked |
| Merge duplicate tickets | Two tickets accomplish the same thing |
| Rewrite unclear done-state | Completion criteria are subjective or vague |

Prioritize by blocker severity: missing prerequisites first, then duplicates, then clarity issues.

## 6. Produce the verification report

Return findings in this structure:

```
## Ready Items
List items passing all readiness criteria with no overlap.

## Blocked or Weak Items
List items failing readiness criteria, noting:
- Which criteria failed
- Specific evidence from the item description
- Blocking severity (critical/blocking vs. warning)

## Duplicates or Overlap
List overlapping items with:
- Item IDs/names involved
- Nature of overlap (duplicate vs. partial)
- Affected files/subsystems
- Recommended resolution (merge/split/keep separate)

## Backlog Repair
List the minimum fixes required:
- Specific actions to take (split, merge, rewrite, insert)
- Target items for each action
- Expected outcome after fix
- Remaining uncertainty requiring follow-up validation
```

# Output contract

Every verification report must include:

1. **Ready Items**: Items fully ready for execution with no blockers
2. **Blocked or Weak Items**: Items needing work before execution, with specific reasons
3. **Duplicates or Overlap**: Conflicting or redundant items, with resolution guidance
4. **Backlog Repair**: The minimum set of concrete fixes required to make the backlog executable

Optional: **Assigned Scope**, **Evidence Collected**, **Recommended Action**, **Handoff Notes** when the evaluation context requires it.

# Failure handling

| Scenario | Response |
|----------|----------|
| Backlog surface cannot be located | State the search locations attempted, ask user to provide the backlog explicitly |
| Backlog has no items | Report empty backlog, skip remaining steps |
| Readiness criteria are ambiguous for a specific item | Flag uncertainty, document the ambiguity, proceed with best-effort assessment |
| References files are missing | Fall back to in-procedure criteria (steps 2 and 5), note the fallback |
| Circular dependency detected | Report the cycle as a critical blocker, identify the smallest break point |
| Too many items to evaluate exhaustively | Sample systematically (by priority or sequence), note coverage and confidence |

Never fabricate missing backlog items or invent details not present in the source material. When evidence is incomplete, call out the uncertainty explicitly.

# Next steps

After completing backlog verification:

- If repairs are needed: Suggest the user apply `Backlog Repair` fixes before agents begin work
- If items are ready: Confirm the backlog is executable; agents may begin consumption
- If uncertainty remains: Recommend follow-up validation after additional information is gathered

Workflow pointers to related skills:
- For creating the actual tickets after verification: use `skill-creator` or domain-specific ticket authoring
- For planning a new project from scratch: use appropriate planning skill (not this one)
- For validating implementations against tickets: use code review or validation skills (not this one)

# References

- `references/readiness-checks.md` — Five criteria for determining if a backlog item is executable
- `references/overlap-signals.md` — Signals for detecting duplicate or overlapping work items
- `references/repair-patterns.md` — Four standard patterns for fixing backlog quality issues
