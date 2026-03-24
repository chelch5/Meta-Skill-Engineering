---
name: ticket-pack-builder
description: "Create a repo-local ticket system with an index, machine-readable manifest, board, and individual ticket files. Use when a repo needs task decomposition that autonomous agents can follow without re-planning the whole project each session. Do not use for executing tickets (use ticket-execution) or quick fixes that don't warrant formal tickets."
---

# Ticket Pack Builder

Use this skill to create or refine the repo-local work queue.

## Modes

- **bootstrap**: Generate the first implementation-ready backlog during initial scaffold
- **refine**: Regenerate, expand, or normalize an existing backlog later

## Bootstrap mode procedure

### 1. Read the canonical brief

Read the project brief. Identify:
- What features/capabilities need to be built
- What infrastructure/setup is required
- What the acceptance criteria are
- Which areas are blocked on unresolved decisions
- The backlog readiness signal

### 2. Break work into implementation waves

Organize tickets into waves based on dependency order:

| Wave | Purpose | Examples |
|------|---------|---------|
| Wave 0: Foundation | Repo setup, CI/CD, configuration | Project init, dependency install, CI pipeline |
| Wave 1: Core | Primary functionality | Core business logic, main features |
| Wave 2: Secondary | Supporting features, integrations | Secondary workflows, integrations |
| Wave 3: Polish | Hardening, performance, docs | Error handling, performance, UX refinement |

### 3. Create individual tickets

For each piece of work, create a ticket with these fields:
- **id** — unique identifier (e.g., `SETUP-001`, `CORE-001`, `FEAT-001`)
- **title** — short descriptive title
- **wave** — which execution wave
- **status** — `todo` or `blocked` (all new tickets start in planning stage)
- **depends_on** — list of ticket IDs this depends on
- **summary** — one-paragraph description
- **acceptance** — list of specific, verifiable acceptance criteria
- **decision_blockers** — unresolved decisions that block this ticket (empty if none)

Optional fields for parallel execution:
- **lane** — which project area or ownership lane
- **parallel_safe** — whether this can advance in parallel when dependencies are met
- **overlap_risk** — `low`, `medium`, or `high` expected overlap with other tickets

#### Ticket sizing rules
- Each ticket should be completable in ONE agent session
- If a ticket requires changes to more than 5-7 files, split it
- If a ticket has more than 5 acceptance criteria, consider splitting
- Prefer many small tickets over few large ones

#### Handling unresolved decisions
- Do NOT fabricate implementation detail for work that depends on unresolved major choices
- Create explicit `blocked` tickets with `decision_blockers` listing what needs to be decided
- Create `decision` tickets for choices the team needs to make
- Create `discovery` tickets for research that needs to happen before implementation

### 4. Write ticket files

For each ticket, write a markdown file to `tickets/<id>.md`:

```markdown
---
id: SETUP-001
title: Initialize project structure
wave: 0
status: todo
depends_on: []
---

# SETUP-001: Initialize project structure

## Summary
Set up the base repository structure with package manager, build tooling, and test framework.

## Acceptance Criteria
- [ ] Package manager configured with lock file
- [ ] Build command produces output without errors
- [ ] Test command runs (even with zero tests)
- [ ] Linter configured and passing
```

### 5. Write the manifest

Write `tickets/manifest.json` with structured ticket data:
```json
{
  "version": 2,
  "project": "<project-name>",
  "active_ticket": "<first-ticket-id>",
  "tickets": [ ... ]
}
```

### 6. Generate the board

Write `tickets/BOARD.md` as a human-readable view organized by wave:
- Ticket ID, title, status, dependencies
- Grouped by wave
- This is a DERIVED VIEW — the manifest is the source of truth

### 7. Validate

- No circular dependencies in the dependency graph
- Every `depends_on` reference points to a real ticket
- Every ticket has at least one acceptance criterion
- No ticket is both `todo` and has unresolved `decision_blockers` (should be `blocked`)
- Critical path is identifiable

## Refine mode

Use when expanding or normalizing an existing backlog:
1. Read the existing manifest
2. Identify gaps, unclear tickets, or new work from updated brief
3. Add/modify tickets following the same rules
4. Regenerate BOARD.md from manifest

## Output contract

```
tickets/
├── manifest.json          # Machine-readable ticket data (source of truth)
├── BOARD.md               # Human-readable board (derived view)
├── SETUP-001.md           # Individual ticket files
├── CORE-001.md
└── ...
```

## Rules

- Keep manifest machine-readable; keep board human-readable
- Keep status coarse: `todo`, `ready`, `in_progress`, `blocked`, `review`, `qa`, `done`
- Do NOT use ticket status for transient approval state (that belongs in workflow state)
- Record dependencies explicitly
- Put acceptance criteria on every ticket
- Mark `parallel_safe: true` only when overlap risk is genuinely low

## Failure handling

- **Brief too vague**: Cannot decompose "build the app" into tickets. Request specific features first.
- **Ticket too large**: Split into sub-tickets. Use `-a`, `-b` suffixes if needed.
- **Circular dependencies**: Refactor to break cycle — extract shared prerequisite as separate ticket.
- **No clear acceptance criteria**: Do not create ticket. Flag as needing clarification.

## References

- This is step 5 of the scaffold-kickoff flow — continue to `../project-skill-bootstrap/SKILL.md`
- Shape Up "Map the Scopes": https://basecamp.com/shapeup
