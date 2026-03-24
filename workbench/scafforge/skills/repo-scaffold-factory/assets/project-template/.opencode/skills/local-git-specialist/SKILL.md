---
name: local-git-specialist
description: Follow the repo's local-git-only workflow safely. Use when an OpenCode agent needs to inspect history, create local commits, or reason about diff state without assuming GitHub access.
---

# Local Git Specialist

Before using local git workflow guidance, call `skill_ping` with `skill_id: "local-git-specialist"` and `scope: "project"`.

Use this lane when:

- checking local status or diff state
- preparing a local commit
- verifying what changed for the current ticket

Rules:

- treat git work as local read/write unless the repo explicitly enables more
- do not assume GitHub APIs, PR automation, or remote pushes are available
- keep commit scope aligned with the active ticket
- use git state as supporting evidence, not as a substitute for ticket, workflow-state, or artifact updates
