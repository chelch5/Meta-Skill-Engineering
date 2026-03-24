---
name: workflow-observability
description: Inspect bootstrap provenance, invocation tracking, and workflow state to explain which repo-local agents, tools, plugins, and skills are actually being exercised.
---

# Workflow Observability

Before auditing the setup, call `skill_ping` with `skill_id: "workflow-observability"` and `scope: "project"`.

Read these in order:

1. `.opencode/meta/bootstrap-provenance.json`
2. `.opencode/state/invocation-log.jsonl` if it exists
3. `.opencode/state/last-ticket-event.json` if it exists
4. `.opencode/state/workflow-state.json`
5. `tickets/manifest.json`

Return these sections:

1. `Bootstrap`
2. `Process Changes`
3. `Observed Usage`
4. `Missing Or Never-Seen Surfaces`
5. `Workflow Drift Risks`
6. `Next Fix`

If `.opencode/state/invocation-log.jsonl` does not exist yet, say `no invocation data yet` explicitly instead of implying the setup is healthy.
Treat `.opencode/meta/bootstrap-provenance.json` as the canonical source for `workflow_contract.process_version`; use `.opencode/state/workflow-state.json` to explain the active execution copy of that state.
If `pending_process_verification` is `true`, say so explicitly, list the affected done tickets from `ticket_lookup`, and call out the backlog verifier as the next required lane.
