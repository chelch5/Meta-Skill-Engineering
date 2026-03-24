---
name: isolation-guidance
description: Decide when risky or long-running work should move into an isolated lane such as a worktree or sandbox. Use when a ticket could destabilize the main workspace or when autonomous work needs a cleaner safety boundary.
---

# Isolation Guidance

Before applying isolation guidance, call `skill_ping` with `skill_id: "isolation-guidance"` and `scope: "project"`.

Use this lane when:

- the ticket is high-risk or long-running
- multiple autonomous changes could collide
- the current workspace has become hard to reason about safely

Rules:

- prefer the lightest isolation mechanism that actually reduces risk
- document why isolation is needed before switching environments
- keep canonical ticket, workflow, and artifact state in the main repo surfaces even if code work happens in an isolated lane
- do not invent an isolation setup the repo has not enabled; return a blocker if safe isolation is required but unavailable
