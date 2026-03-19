# AGENTS.md

This repository is a meta-skill engineering workspace. Treat each top-level skill directory as a first-class package with `SKILL.md` as the baseline contract.

## Working Rules

- Prefer direct, factual documentation and implementation notes.
- Keep the root skill inventory limited to the 12 repo-owned top-level skill packages.
- Update root docs when repo-owned skill packages are added, removed, renamed, or materially re-scoped.
- Do not conflate archived material in `skill creator/` with the active inventory.

## Skill Package Shape

- Every repo-owned skill package must contain `SKILL.md`.
- A richer package may also include `references/`, `scripts/`, `evals/`, or `assets/`.
- When a package has evals or scripts, treat them as support layers for the skill rather than as the skill itself.
- Skills are internal-only; do not add license, compatibility, or release metadata unless explicitly needed.

## Eval Suite Structure

Every skill package should include an `evals/` directory with these files:

```
evals/
├── trigger-positive.jsonl   # Prompts that SHOULD activate the skill
├── trigger-negative.jsonl   # Prompts that should NOT activate the skill
├── behavior.jsonl           # Output quality checks
└── README.md                # Optional: how to run and extend tests
```

**trigger-positive.jsonl** — one JSON object per line:
```json
{"prompt": "...", "expected": "trigger", "category": "core|indirect|paraphrase|edge", "notes": "..."}
```

**trigger-negative.jsonl** — one JSON object per line:
```json
{"prompt": "...", "expected": "no_trigger", "category": "anti-match|adjacent|out-of-scope", "notes": "..."}
```

**behavior.jsonl** — one JSON object per line:
```json
{"prompt": "...", "expected_sections": ["..."], "required_patterns": ["..."], "forbidden_patterns": ["..."], "min_output_lines": 15, "notes": "..."}
```

No other eval formats are active. Do not use `evals.json`, `output-tests.jsonl`, `triggers.yaml`, `outputs.yaml`, or `baselines.yaml`.

## SKILL.md Structure

All skills should follow this section order:
1. YAML frontmatter (name, description — these two fields only, no license/metadata/compatibility)
2. Purpose
3. When to use
4. When NOT to use (use this exact heading, not "Do NOT use when:")
5. Procedure (all procedural content goes under this heading, using ## subheadings)
6. Output contract
7. Failure handling
8. Next steps
9. References (optional)

## Pipelines

### Creation Pipeline
```
skill-creator → skill-testing-harness → skill-evaluation
    → skill-trigger-optimization → skill-safety-review → skill-lifecycle-management
```

### Improvement Pipeline
```
skill-evaluation → skill-anti-patterns → skill-improver → skill-trigger-optimization
```

### Library Management Pipeline
```
skill-catalog-curation → skill-lifecycle-management
```

## Entry Points

| Goal | Start here |
|------|-----------|
| Create a new skill | `skill-creator` |
| Improve an existing skill | `skill-evaluation` → `skill-anti-patterns` → `skill-improver` |
| Evaluate a skill | `skill-evaluation` |
| Audit the skill library | `skill-catalog-curation` |

## Inventory Boundaries

- Root inventory includes only the 12 skill packages at the repository root.
- `archive/` contains skills removed from the active inventory (distribution-oriented skills).
- `corpus/` contains test skills for evaluating meta-skills.
- `skill creator/` is archived source material from the pre-consolidation state.
- `tasks/` is documentation, worklogs, and reviews — not a skill package.
- `scripts/` contains automation scripts for running evals and orchestration.
