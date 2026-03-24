---
name: research-delegation
description: Use read-only delegation and persistent artifacts for research-heavy work. Use when an OpenCode agent needs background investigation, reference gathering, or comparative analysis without mutating the repo.
---

# Research Delegation

Before delegating, call `skill_ping` with `skill_id: "research-delegation"` and `scope: "project"`.

Use this lane when:

- the task is exploratory or comparative
- the result should survive compaction
- the delegate does not need to mutate repo files

Rules:

- keep delegated research read-only
- persist useful findings into canonical artifacts or context snapshots before relying on them later
- convert unresolved research outcomes into blockers or follow-up tickets instead of pretending they are settled facts
- do not use research delegation as a loophole for write-capable background implementation
