# Meta Skill Engineering

A meta-skill engineering workspace containing 12 skills that create, refine, test, and govern agent skills.

## Repository Layout

- `./<skill-name>/` — repo-owned skill packages at the repository root. Each package has a `SKILL.md` baseline contract and may include `references/`, `scripts/`, `evals/`, or `assets/`.
- `archive/` — skills removed from the active inventory (distribution-oriented skills).
- `corpus/` — test skills for evaluating meta-skills: 5 weak, 3 strong, 4 adversarial, plus a regression directory for harvested failures.
- `skill creator/` — archived source material from the pre-consolidation state.
- `tasks/` — task notes, worklogs, reviews, and maintenance instructions.
- `scripts/` — automation scripts (eval runner, validation, corpus evaluation). `run-meta-skill-cycle.sh` is optional and requires an external orchestrator skill.

## Pipelines

Three built-in flows connect the skills:

### Creation Pipeline
```
skill-creator → skill-testing-harness → skill-evaluation
    → skill-trigger-optimization → skill-safety-review → skill-lifecycle-management
```

### Improvement Pipeline
```
skill-evaluation → skill-anti-patterns → skill-improver → skill-trigger-optimization
```
Evaluation first (establish baseline), anti-patterns second (diagnose), improver third (fix), trigger-optimization fourth (polish routing).

### Library Management Pipeline
```
skill-catalog-curation → skill-lifecycle-management
```

## Entry Points

| Goal | Start here |
|------|-----------|
| Create a new skill | `skill-creator` |
| Improve an existing skill | `skill-evaluation` (baseline) → `skill-anti-patterns` (diagnose) → `skill-improver` (fix) |
| Evaluate a skill | `skill-evaluation` |
| Audit the skill library | `skill-catalog-curation` |

## Skill Inventory

| Folder | Purpose |
| --- | --- |
| `skill-adaptation` | Rewrite a skill's context-dependent references for a new environment. |
| `skill-anti-patterns` | Scan SKILL.md for concrete anti-patterns and report fixes. |
| `skill-benchmarking` | Compare skill variants on the same test cases. |
| `skill-catalog-curation` | Audit library for duplicates and gaps; maintain catalog index. |
| `skill-creator` | Create new agent skills from scratch and iterate through test-review-improve cycles. |
| `skill-evaluation` | Evaluate a single skill's routing accuracy, output quality, and baseline value. |
| `skill-improver` | Improve an existing skill package — routing, procedure, support layers. |
| `skill-lifecycle-management` | Manage skills through lifecycle states; execute deprecation and retirement. |
| `skill-safety-review` | Audit a skill for safety hazards before publication or import. |
| `skill-testing-harness` | Build test infrastructure (JSONL eval suites) for a skill. |
| `skill-trigger-optimization` | Fix skill routing by rewriting description and boundary text. |
| `skill-variant-splitting` | Split a broad skill into focused variants. |

## Skill Categories

**Creation & Improvement**
- `skill-creator` — create new skills
- `skill-improver` — improve existing skills (includes reference extraction)

**Quality & Testing**
- `skill-testing-harness` — build test infrastructure
- `skill-evaluation` — evaluate routing and output quality
- `skill-benchmarking` — compare skill variants
- `skill-anti-patterns` — audit for structural anti-patterns
- `skill-trigger-optimization` — fix routing descriptions

**Safety**
- `skill-safety-review` — audit for safety hazards

**Library Management**
- `skill-catalog-curation` — audit library, maintain catalog index
- `skill-lifecycle-management` — manage lifecycle states, deprecation, and retirement

**Transformation**
- `skill-adaptation` — port skills to new environments
- `skill-variant-splitting` — split broad skills into focused variants
