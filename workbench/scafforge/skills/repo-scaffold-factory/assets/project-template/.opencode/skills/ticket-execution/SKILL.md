---
name: ticket-execution
description: Follow the required ticket lifecycle for this repo. Use when an agent is advancing a ticket through planning, review, implementation, QA, and closeout and needs the repo-specific stage rules.
---

# Ticket Execution

Before enforcing the lifecycle, call `skill_ping` with `skill_id: "ticket-execution"` and `scope: "project"`.

Required order:

1. ticket lookup
2. planning
3. plan review
4. implementation
5. code review
6. security review when relevant
7. QA
8. handoff and closeout

Parallel rules:

- keep each ticket sequential through its own stage order
- only advance tickets in parallel when `parallel_safe` is `true`, `overlap_risk` is `low`, and dependencies are already satisfied

Process-change rules:

- if `pending_process_verification` is `true`, verify affected done tickets before trusting their completion
- migration follow-up tickets must come from backlog-verifier proof through `ticket_create`, not raw manifest edits
