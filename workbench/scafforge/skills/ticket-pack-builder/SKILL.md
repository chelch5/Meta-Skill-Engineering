---
name: ticket-pack-builder
description: Create a repo-local ticket system with an index, machine-readable manifest, board, and individual ticket files. Use when a repo needs task decomposition that autonomous agents can follow without re-planning the whole project each session.
---

# Ticket Pack Builder

Use this skill to create or refine the repo-local work queue.

## Modes

- **bootstrap**: generate the first implementation-ready backlog during the initial scaffold
- **refine**: regenerate, expand, or normalize an existing backlog later

## Mode selection

- If this skill is reached from `scaffold-kickoff` during greenfield scaffolding, use `bootstrap`.
- If this skill is reached from retrofit or later backlog maintenance work, use `refine`.
- If invoked directly and `tickets/manifest.json` does not exist yet, use `bootstrap`.
- If invoked directly and a backlog already exists, use `refine`.
- If the user request is ambiguous about whether to create the first backlog or revise an existing one, ask the user before choosing a mode.

## Bootstrap mode procedure

### 1. Read the canonical brief

Read `docs/spec/CANONICAL-BRIEF.md`. Identify:
- What features/capabilities need to be built
- What infrastructure/setup is required
- What the acceptance criteria are
- Which areas are blocked on unresolved decisions
- The backlog readiness signal

### 2. Break work into implementation waves

Organize tickets into waves based on dependency order:

- **Wave 0: Foundation** — repo setup, CI/CD, dependency installation, configuration
- **Wave 1: Core** — the primary functionality the project exists to provide
- **Wave 2: Secondary** — supporting features, integrations, secondary workflows
- **Wave 3: Polish** — error handling hardening, performance, documentation, UX refinement

### 3. Create individual tickets

For each piece of work, create a ticket with these fields:
- `id` — unique identifier (e.g., `SETUP-001`, `CORE-001`, `FEAT-001`)
- `title` — short descriptive title
- `wave` — which execution wave this belongs to
- `lane` — which project area or ownership lane this belongs to
- `parallel_safe` — whether this ticket can be advanced in parallel with other tickets when dependencies are satisfied
- `overlap_risk` — `low`, `medium`, or `high` expected overlap with other tickets
- `stage` — `planning` (all new tickets start here)
- `status` — `todo` or `blocked`
- `depends_on` — list of ticket IDs this depends on
- `summary` — one-paragraph description of what needs to be done
- `acceptance` — list of specific acceptance criteria
- `artifacts` — empty list (populated during execution)
- `decision_blockers` — list of unresolved decisions that block this ticket (empty if none)

### Ticket sizing rules

- Each ticket should be completable in ONE agent session
- If a ticket requires changes to more than 5-7 files, split it
- If a ticket has more than 5 acceptance criteria, consider splitting
- Prefer many small tickets over few large ones

### Parallel lane rules

- Mark `parallel_safe: true` only when the ticket has no unresolved dependency on another unfinished ticket and the expected overlap risk is low
- Use `overlap_risk` to make concurrency judgment explicit instead of assuming it from lane names
- Default to `parallel_safe: false` when the ownership boundary is unclear

### Handling unresolved decisions

- Do NOT fabricate implementation detail for work that depends on unresolved major choices
- Create explicit `blocked` tickets with `decision_blockers` listing what needs to be decided
- Create `decision` tickets for choices the team needs to make (e.g., "Choose database engine")
- Create `discovery` tickets for research that needs to happen before implementation

### 4. Write ticket files

For each ticket, write a markdown file to `tickets/<id>.md` using the template in `tickets/templates/TICKET.template.md`.

### 5. Update the manifest

Write `tickets/manifest.json` with the structure defined in `references/ticket-system.md`:
- `version`: 2
- `project`: project name from canonical brief
- `active_ticket`: first ticket in wave 0
- `tickets`: array of all ticket objects

### 6. Generate the board

Write `tickets/BOARD.md` as a human-readable view of the backlog organized by wave, showing:
- Ticket ID, title, status, dependencies
- Grouped by wave
- This is a DERIVED VIEW — the manifest is the source of truth

### 7. Align workflow state

Ensure `.opencode/state/workflow-state.json` reflects the first active ticket:
```json
{
  "active_ticket": "<first-ticket-id>",
  "stage": "planning",
  "status": "todo",
  "approved_plan": false,
  "ticket_state": {
    "<first-ticket-id>": {
      "approved_plan": false
    }
  },
  "process_version": 3,
  "process_last_changed_at": null,
  "process_last_change_summary": null,
  "pending_process_verification": false,
  "parallel_mode": "parallel-lanes"
}
```

## Refine mode

Use when expanding or normalizing an existing backlog:
1. Read the existing manifest
2. Identify gaps, unclear tickets, or new work from updated brief
3. Add/modify tickets following the same rules
4. Regenerate BOARD.md

## After this step

Continue to `../project-skill-bootstrap/SKILL.md` as directed by scaffold-kickoff.

## Rules

- Keep manifest machine-readable
- Keep board human-readable (derived from manifest)
- Keep queue status coarse: `todo`, `ready`, `in_progress`, `blocked`, `review`, `qa`, `done`
- Do NOT use ticket status for transient approval state (that's in workflow-state.json)
- Keep `wave`, `lane`, `parallel_safe`, and `overlap_risk` aligned with real execution boundaries
- Record dependencies explicitly
- Put acceptance criteria on every ticket

## References

- `references/ticket-system.md` for the contract
- `assets/templates/TICKET.template.md` for the ticket template
