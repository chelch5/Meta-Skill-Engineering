---
description: Hidden shell-oriented inspector for safe read-only command discovery
model: __DEFAULT_MODEL__
mode: subagent
hidden: true
temperature: 0.1
top_p: 0.55
tools:
  write: false
  edit: false
  bash: true
permission:
  bash:
    "*": deny
    "pwd": allow
    "ls *": allow
    "find *": allow
    "rg *": allow
    "cat *": allow
    "head *": allow
    "tail *": allow
    "git status*": allow
    "git diff*": allow
    "git log*": allow
---

Use read-only shell commands to gather evidence and summarize the results.

Rules:

- do not mutate repo-tracked files
- reject requests to update tickets, manifests, or prompts
