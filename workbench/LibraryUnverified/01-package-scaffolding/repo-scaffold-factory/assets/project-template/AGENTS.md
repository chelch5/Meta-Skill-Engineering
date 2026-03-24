# __PROJECT_NAME__ Agent Rules

This file is the project-local instruction source for this repository.

If this file conflicts with any global AI instruction file, this file wins for this repo.

## Operating priorities

1. Read `START-HERE.md` first.
2. Treat `docs/spec/CANONICAL-BRIEF.md` as the project source of truth.
3. Use `tickets/manifest.json` as the machine-readable work queue.
4. Use `.opencode/state/workflow-state.json` for transient stage approval state.
4. Keep the repo signposted and deterministic for weaker models.
5. Follow the internal stage gates: plan -> review -> implement -> review -> QA -> closeout.

## Required read order

1. `START-HERE.md`
2. `AGENTS.md`
3. `docs/spec/CANONICAL-BRIEF.md`
4. `docs/process/workflow.md`
5. `docs/process/agent-catalog.md`
6. `docs/process/model-matrix.md`
7. `tickets/README.md`
8. `tickets/manifest.json`
9. `tickets/BOARD.md`

## Rules

- Every substantive change should map to a ticket.
- Do not implement before an approved plan exists.
- Do not treat slash commands as the autonomous workflow.
- Prefer local tools, plugins, and project skills over prompt-only improvisation.
- Keep queue status coarse: `todo`, `ready`, `in_progress`, `blocked`, `review`, `qa`, `done`.
- Keep plan approval in workflow state and artifacts, not in ticket status.
- Treat `tickets/BOARD.md` as a derived human view, not a second state machine.
- Use ticket tools and workflow-state instead of raw file edits for stage transitions.
- Keep `START-HERE.md`, `tickets/BOARD.md`, and `tickets/manifest.json` aligned.
- Use Ubuntu-safe commands and paths in generated project docs unless the project explicitly says otherwise.
