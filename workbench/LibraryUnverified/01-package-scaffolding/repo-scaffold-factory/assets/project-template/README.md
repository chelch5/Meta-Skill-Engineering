# __PROJECT_NAME__

## Overview

This repository was scaffolded for a deterministic, ticketed, agent-friendly workflow.

## Start Here

1. Read `START-HERE.md`
2. Read `AGENTS.md`
3. Read `docs/spec/CANONICAL-BRIEF.md`
4. Read `docs/process/workflow.md`
5. Read `tickets/BOARD.md`

## Repository Layout

- `docs/` for canonical process and spec material
- `tickets/` for the work queue and machine-readable state
- `.opencode/` for project-local OpenCode agents, tools, plugins, commands, and skills
- `opencode.jsonc` for project-local OpenCode configuration
- `.opencode/state/workflow-state.json` for transient stage state such as plan approval

## Workflow Notes

- `tickets/manifest.json` is the machine source of queue state.
- `tickets/BOARD.md` is a derived human board.
- Ticket `status` stays coarse and queue-oriented.
- Plan approval lives in workflow state plus registered stage artifacts, not in ticket status.
