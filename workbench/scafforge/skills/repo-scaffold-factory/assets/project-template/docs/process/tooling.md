# Tooling Layers

Use the project-local surfaces this way:

- `.opencode/commands/` for human entrypoints only
- `.opencode/tools/` for structured repo operations agents can call directly
- `.opencode/plugins/` for guardrails, synchronization, and compaction context
- `.opencode/skills/` for local deterministic guidance
- `mcp` in `opencode.jsonc` for external services and richer integrations

Important workflow tools:

- `ticket_lookup` resolves the active ticket and current workflow state, and when process verification is pending it also reports which done tickets still require backlog verification; it can also return the latest artifact bodies for the resolved ticket when a verifier needs to inspect them
- `ticket_update` changes coarse queue state and workflow approval state
- `artifact_write` writes the full body for a canonical stage artifact in the stage-specific directory for that stage
- `artifact_register` records metadata for an artifact that was already written at the canonical path
- `context_snapshot` refreshes the compact restart surface
- `handoff_publish` refreshes the top-level handoff
- `skill_ping` records explicit local or global skill use in `.opencode/state/invocation-log.jsonl`
- `ticket_create` creates guarded follow-up tickets from backlog-verifier proof during a process-verification window

Tracking surfaces:

- `tickets/manifest.json` stores queue state and registered artifact metadata for each ticket
- `.opencode/state/artifacts/registry.json` stores the cross-ticket artifact registry
- `.opencode/state/workflow-state.json` stores transient approval and current-stage state
- `.opencode/plugins/invocation-tracker.ts` logs chat, command, and tool execution events
- `.opencode/meta/bootstrap-provenance.json` records how the OpenCode layer was generated or retrofitted and owns the canonical workflow-contract version metadata
- `.opencode/state/workflow-state.json` also records the active process version and whether post-migration verification is still pending
