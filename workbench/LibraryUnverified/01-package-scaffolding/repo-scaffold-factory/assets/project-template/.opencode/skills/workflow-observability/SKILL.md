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
2. `Observed Usage`
3. `Missing Or Never-Seen Surfaces`
4. `Workflow Drift Risks`
5. `Next Fix`

If `.opencode/state/invocation-log.jsonl` does not exist yet, say `no invocation data yet` explicitly instead of implying the setup is healthy.
