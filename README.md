# Meta Skill Engineering

A meta-skill engineering workspace containing 12 skills that create, refine, test, and govern agent skills.

## Repository Layout

- `./<skill-name>/` — repo-owned skill packages at the repository root. Each package has a `SKILL.md` baseline contract and may include `references/`, `scripts/`, `evals/`, or `assets/`.
- `archive/` — skills removed from the active inventory (distribution-oriented skills).
- `corpus/` — test skills for evaluating meta-skills: 5 weak, 5 strong, 5 adversarial, plus a regression directory for harvested failures.
- `tasks/` — task notes, worklogs, reviews, and maintenance instructions.
- `scripts/` — automation scripts (eval runner, validation, optimization, corpus evaluation). Root scripts are source-of-truth copies; per-skill `scripts/` directories contain deployed copies via `sync-to-skills.sh`.
- `eval-results/` — timestamped eval reports; `<skill>-eval.md` symlinks to latest. Handoff mechanism between `skill-evaluation` and `skill-improver`.
- `docs/` — operational documentation including `evaluation-cadence.md`.

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
Evaluation first (establish baseline), anti-patterns second (diagnose), improver third (fix), trigger-optimization fourth (polish routing). Eval results in `eval-results/` serve as the data handoff between steps.

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

## Evaluation System

The eval system uses Copilot CLI (`copilot -p`) to test skills with real model responses.

| Script | Purpose |
|--------|---------|
| `scripts/run-evals.sh` | Trigger and behavior tests with pass/fail gates (`--observe`/`--strict` routing, `--runs N` majority voting, `--usefulness` LLM-as-Judge scoring) |
| `scripts/run-trigger-optimization.sh` | Automated trigger optimization with train/test split |
| `scripts/validate-skills.sh` | Structural compliance check for all 12 skills |
| `scripts/run-full-cycle.sh` | Full 5-step evaluation cadence |
| `scripts/run-baseline-comparison.sh` | Before/after comparison with gates |
| `scripts/run-corpus-eval.sh` | Two-layer meta-skill evaluation against corpus |
| `scripts/run-regression-suite.sh` | Regression protection runner |
| `scripts/check_skill_structure.py` | 10-point structural scoring for a skill |
| `scripts/check_preservation.py` | Jaccard similarity for content preservation |
| `scripts/skill_lint.py` | Lint a SKILL.md for format issues |
| `scripts/harvest_failures.py` | Convert failures into regression cases |
| `scripts/sync-to-skills.sh` | Sync root scripts to per-skill `scripts/` directories |
| `scripts/run-meta-skill-cycle.sh` | **Optional/experimental** — orchestrate meta-skill cycle via non-interactive Copilot |

**Key capabilities:**
- **Observe routing** (default): parses JSON output to detect whether the model actually read a SKILL.md
- **Multi-run voting**: `--runs N` runs each prompt N times with majority-vote pass/fail
- **Usefulness evaluation** (opt-in): `--usefulness` enables LLM-as-Judge scoring of behavior test outputs on correctness, completeness, actionability, and conciseness (1–5 scale)
- **Default model**: `gpt-4.1` (override with `EVAL_MODEL`)
- **Trigger optimization**: 60/40 train/test split, LLM-proposed improvements, held-out validation

See `docs/evaluation-cadence.md` for the full workflow and environment variables.
