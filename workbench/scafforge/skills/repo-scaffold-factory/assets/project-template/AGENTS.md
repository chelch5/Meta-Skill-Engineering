# __PROJECT_NAME__ Agent Rules

This file is the project-local instruction source for this repository.

If this file conflicts with any global AI instruction file, this file wins for this repo.

## Operating priorities

1. Read `START-HERE.md` first.
2. Treat `docs/spec/CANONICAL-BRIEF.md` as the project source of truth.
3. Use `tickets/manifest.json` as the machine-readable work queue.
4. Use `.opencode/state/workflow-state.json` for transient stage approval state.
5. Treat the stage-specific artifact directories as the canonical stage-proof body locations.
6. Use the process version and verification state in `.opencode/state/workflow-state.json` before trusting old completed work.
7. Keep the repo signposted and deterministic for weaker models.
8. Follow the internal stage gates: plan -> review -> implement -> review -> QA -> closeout.

## Truth hierarchy

- `docs/spec/CANONICAL-BRIEF.md` owns durable project facts and decisions
- `tickets/manifest.json` owns machine queue state and registered artifact metadata
- `tickets/BOARD.md` is the derived human queue board
- `.opencode/state/workflow-state.json` owns the transient foreground stage, per-ticket approval state, and the active process-version plus post-migration verification state
- `.opencode/state/plans/`, `.opencode/state/implementations/`, `.opencode/state/reviews/`, `.opencode/state/qa/`, and `.opencode/state/handoffs/` own stage artifact bodies
- `.opencode/state/artifacts/registry.json` owns the cross-stage artifact registry
- `.opencode/meta/bootstrap-provenance.json` owns bootstrap and repair provenance
- `START-HERE.md` is the derived restart surface

## Required read order

1. `START-HERE.md`
2. `AGENTS.md`
3. `docs/spec/CANONICAL-BRIEF.md`
4. `docs/process/workflow.md`
5. `docs/process/agent-catalog.md`
6. `docs/process/model-matrix.md`
7. `docs/process/git-capability.md`
8. `tickets/README.md`
9. `tickets/manifest.json`
10. `tickets/BOARD.md`

## Rules

- Every substantive change should map to a ticket.
- Do not implement before an approved plan exists.
- Do not treat slash commands as the autonomous workflow.
- Prefer local tools, plugins, and project skills over prompt-only improvisation.
- Keep queue status coarse: `todo`, `ready`, `in_progress`, `blocked`, `review`, `qa`, `done`.
- Keep plan approval in workflow state and artifacts, not in ticket status.
- Treat `tickets/BOARD.md` as a derived human view, not a second state machine.
- Use ticket tools and workflow-state instead of raw file edits for stage transitions.
- Keep `START-HERE.md`, `tickets/BOARD.md`, and `tickets/manifest.json` aligned with the canonical sources that feed them.
- Use Ubuntu-safe commands and paths in generated project docs unless the project explicitly says otherwise.
- Keep the default orchestration shape as one visible team leader with explicit safe parallel lanes rather than many overlapping leaders.
- Treat manager or section-leader hierarchies as advanced project-specific customization, not a first-class scaffold profile.
- Treat `.opencode/meta/bootstrap-provenance.json` as the canonical source for the repo's process-contract version; workflow state mirrors that contract for active execution and verification routing.
- Only create migration follow-up tickets from backlog-verifier findings during an active process-verification window.
