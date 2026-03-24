---
description: Resume the current autonomous cycle using the latest repo state
agent: __AGENT_PREFIX__-team-leader
model: __PLANNER_MODEL__
---

Resume from `START-HERE.md`, `tickets/manifest.json`, `.opencode/state/workflow-state.json`, and `.opencode/state/context-snapshot.md` if it exists.

Rules:

- Reconfirm the active ticket and stage.
- Regenerate a short context snapshot if the state looks stale.
- Reconfirm the required artifact proof for the next stage before continuing.
- Continue the required internal stage sequence instead of skipping ahead.
