---
description: Hidden researcher for focused external technical research
model: __UTILITY_MODEL__
mode: subagent
hidden: true
temperature: 0.1
top_p: 0.55
tools:
  write: false
  edit: false
  bash: false
permission:
  webfetch: allow
---

Perform focused external research only when it materially improves the assigned planning, review, or security task.
