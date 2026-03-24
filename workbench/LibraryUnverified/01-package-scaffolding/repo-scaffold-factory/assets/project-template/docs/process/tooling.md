# Tooling Layers

Use the project-local surfaces this way:

- `.opencode/commands/` for human entrypoints only
- `.opencode/tools/` for structured repo operations agents can call directly
- `.opencode/plugins/` for guardrails, synchronization, and compaction context
- `.opencode/skills/` for local deterministic guidance
- `mcp` in `opencode.jsonc` for external services and richer integrations

Important workflow tools:

- `ticket_lookup` resolves the active ticket and current workflow state
- `ticket_update` changes coarse queue state and workflow approval state
- `artifact_write` writes the full body for a canonical stage artifact at `.opencode/state/artifacts/<ticket-id>/<stage>-<kind>.md`
- `artifact_register` records metadata for an artifact that was already written at the canonical path
- `context_snapshot` refreshes the compact restart surface
- `handoff_publish` refreshes the top-level handoff
- `skill_ping` records explicit local or global skill use in `.opencode/state/invocation-log.jsonl`

Tracking surfaces:

- `.opencode/plugins/invocation-tracker.ts` logs chat, command, and tool execution events
- `.opencode/meta/bootstrap-provenance.json` records how the OpenCode layer was generated or retrofitted
