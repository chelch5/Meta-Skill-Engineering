# Examples

## Team leader routing

Before:

- "status is planned, so plan review must be next"

After:

- "resolve the ticket through `ticket_lookup`, confirm the planning artifact exists, and only then route to plan review"

## Planner persistence

Before:

- "update the ticket file with the detailed plan"

After:

- "write the full plan with `artifact_write`, then register it with `artifact_register` at the canonical planning artifact path and return that same path in the handoff"

## Read-only shell utility

Before:

- allow `sed *` on a read-only inspection agent

After:

- keep the allowlist to `pwd`, `ls`, `find`, `rg`, `cat`, `head`, `tail`, and safe git inspection commands

## Ticket status model

Before:

- `planned`, `approved`, `in_progress`, `done`

After:

- ticket status: `todo`, `ready`, `in_progress`, `blocked`, `review`, `qa`, `done`
- workflow state: `approved_plan: true|false`
- stage proof: registered artifacts
