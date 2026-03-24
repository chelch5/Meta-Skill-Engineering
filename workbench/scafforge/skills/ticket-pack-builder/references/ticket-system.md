# Ticket System Contract

Required files:

- `tickets/README.md`
- `tickets/BOARD.md`
- `tickets/manifest.json`
- `tickets/templates/TICKET.template.md`

Required ticket fields:

- `id`
- `title`
- `wave`
- `lane`
- `parallel_safe`
- `overlap_risk`
- `stage`
- `status`
- `depends_on`
- `summary`
- `acceptance`
- `artifacts`
- `decision_blockers`

Recommended statuses:

- `todo`
- `ready`
- `in_progress`
- `blocked`
- `review`
- `qa`
- `done`

Rules:

- keep queue status coarse and queue-oriented
- do not use ticket status for transient plan approval
- keep plan approval in workflow state or registered stage artifacts
- use `wave`, `lane`, `parallel_safe`, and `overlap_risk` to make cross-ticket concurrency explicit instead of implied
- keep `tickets/BOARD.md` human-readable only; do not turn it into a second state machine
- treat the manifest as the machine routing source and keep ticket files synchronized as detailed human-readable views
- keep artifact metadata on the owning ticket entry so the manifest acts as the artifact registry
- during bootstrap, detail the first execution wave only where blocking decisions are resolved
- convert unresolved major choices into explicit blocked, decision, or discovery tickets instead of fabricating implementation detail
