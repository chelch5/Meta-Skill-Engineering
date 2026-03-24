---
description: Start the autonomous planning cycle for the current repo state
agent: __AGENT_PREFIX__-team-leader
model: __PLANNER_MODEL__
---

Read the canonical project docs in order, resolve the active ticket from `tickets/manifest.json`, and begin the internal lifecycle.

Rules:

- Treat this slash command as a human entrypoint only.
- Use agents, tools, plugins, and local skills for the internal autonomous cycle.
- Do not implement before a reviewed plan exists.
- Use `ticket_lookup`, `ticket_update`, and registered artifacts instead of raw file edits for stage control.
- Update ticket state and handoff artifacts as the cycle progresses.
