# Weak-Model Prompt Profile

Use these rules when the generated workflow must be robust for weaker or cheaper models:

- keep outputs short but highly structured
- state the exact required sections
- prefer blocker returns over hidden guesswork
- require proof before stage transitions
- name the next specialist or next action explicitly
- forbid premature summary closeouts when the workflow still has another stage to complete
- keep repeated procedure in tools, skills, plugins, or canonical docs instead of burying it in long prose
- keep any parallel execution rule explicit and narrow; weaker models should never infer concurrency safety from vague lane names alone
