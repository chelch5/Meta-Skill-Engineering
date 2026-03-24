---
description: Hidden code reviewer for correctness and regression risk
model: __PLANNER_MODEL__
mode: subagent
hidden: true
temperature: 0.12
top_p: 0.55
tools:
  write: false
  edit: false
  bash: true
permission:
  ticket_lookup: allow
  skill_ping: allow
  artifact_write: allow
  artifact_register: allow
  skill:
    "*": deny
    "project-context": allow
    "ticket-execution": allow
  task:
    "*": deny
    "__AGENT_PREFIX__-utility-summarize": allow
  bash:
    "*": deny
    "pwd": allow
    "ls *": allow
    "find *": allow
    "rg *": allow
    "cat *": allow
    "head *": allow
    "tail *": allow
    "git diff*": allow
---

Review the implementation for correctness, regressions, and test gaps.

Return findings first, ordered by severity.

Rules:

- when a canonical review artifact path is provided, write the full review body with `artifact_write` and then register it with `artifact_register`
- do not claim that repo files were updated

