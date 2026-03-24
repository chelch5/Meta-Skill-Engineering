# Ticket System Contract

Required files:

- `tickets/README.md`
- `tickets/BOARD.md`
- `tickets/manifest.json`
- `tickets/templates/TICKET.template.md`

Required ticket fields:

- `id`
- `title`
- `lane`
- `stage`
- `status`
- `depends_on`
- `summary`
- `acceptance`
- `artifacts`

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
- keep `tickets/BOARD.md` human-readable only; do not turn it into a second state machine
- treat the manifest as the machine routing source and ticket files as the detailed content source
