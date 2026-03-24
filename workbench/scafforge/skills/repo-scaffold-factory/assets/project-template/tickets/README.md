# Ticket System

This repo uses:

- `tickets/manifest.json` as the machine-readable source of truth
- `tickets/BOARD.md` as the human board
- `tickets/templates/TICKET.template.md` as the ticket file template
- the stage-specific directories under `.opencode/state/` for canonical stage artifact bodies

Rules:

- keep ticket `status` coarse: `todo`, `ready`, `in_progress`, `blocked`, `review`, `qa`, `done`
- keep `wave`, `lane`, `parallel_safe`, and `overlap_risk` aligned with the real ownership and concurrency boundaries
- keep plan approval in `.opencode/state/workflow-state.json`
- treat `tickets/BOARD.md` as a derived human board, not a second state machine
- use registered artifacts for stage proof instead of inferring state from raw ticket text
- keep artifact metadata on the owning ticket entry in `tickets/manifest.json`
- keep `tickets/<id>.md` synchronized with manifest-backed ticket state; use the Notes section for durable human context
- mirror artifact metadata into `.opencode/state/artifacts/registry.json`
- create migration follow-up tickets through the guarded `ticket_create` tool instead of raw manifest edits
