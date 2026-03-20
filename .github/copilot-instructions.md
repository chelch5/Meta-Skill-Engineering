# Meta-Skill-Engineering — Copilot Instructions

This is an internal meta-skill engineering workspace. The 12 skill packages at the repository root create, refine, test, and govern agent skills. This is not a distribution package or public library.

## Active Skill Inventory (12 packages)

skill-adaptation, skill-anti-patterns, skill-benchmarking, skill-catalog-curation, skill-creator, skill-evaluation, skill-improver, skill-lifecycle-management, skill-safety-review, skill-testing-harness, skill-trigger-optimization, skill-variant-splitting

## Canonical SKILL.md Format

Every SKILL.md must follow this structure exactly:

1. **YAML frontmatter** — `name` and `description` fields only. No license, maturity, compatibility, or other metadata.
2. `# Purpose`
3. `# When to use`
4. `# When NOT to use` — use this exact heading
5. `# Procedure` — all procedural content here, with `##` subheadings
6. `# Output contract`
7. `# Failure handling`
8. `# Next steps`
9. `# References` — optional, only when skill-specific references exist

## Eval Contract

Each skill has an `evals/` directory with exactly these JSONL files:

- `trigger-positive.jsonl` — `{"prompt": "...", "expected": "trigger", "category": "core|indirect|paraphrase|edge", "notes": "..."}`
- `trigger-negative.jsonl` — `{"prompt": "...", "expected": "no_trigger", "category": "anti-match|adjacent|out-of-scope", "notes": "..."}`
- `behavior.jsonl` — `{"prompt": "...", "expected_sections": [...], "required_patterns": [...], "forbidden_patterns": [...], "min_output_lines": 15, "notes": "..."}`

No other eval formats are active. Do not use `evals.json`, `output-tests.jsonl`, `triggers.yaml`, `outputs.yaml`, or `baselines.yaml`.

## Available Scripts

| Script | Purpose |
|--------|---------|
| `scripts/validate-skills.sh` | Validate all 12 skills for structural compliance |
| `scripts/run-evals.sh` | Run trigger and behavior tests (requires `copilot` CLI + `jq`) |
| `scripts/run-full-cycle.sh` | Full 5-step evaluation cadence |
| `scripts/run-baseline-comparison.sh` | Before/after comparison with gates |
| `scripts/run-corpus-eval.sh` | Two-layer meta-skill evaluation against corpus |
| `scripts/run-regression-suite.sh` | Regression protection runner |
| `scripts/check_skill_structure.py` | 10-point structural scoring for a skill |
| `scripts/check_preservation.py` | Jaccard similarity for content preservation |
| `scripts/skill_lint.py` | Lint a SKILL.md for format issues |
| `scripts/harvest_failures.py` | Convert failures into regression cases |

After editing any SKILL.md, run `scripts/validate-skills.sh` to confirm compliance.

## Key Rules

- Frontmatter must contain only `name` and `description`. No other fields.
- Do not create `manifest.yaml` in skill packages — it is a stale distribution artifact.
- Do not add license, compatibility, or release metadata to skills.
- `archive/` is read-only historical storage. Do not modify archived skills.
- `corpus/` contains test skills for meta-skill evaluation. Treat as test fixtures.
- `skill creator/` (with space) is pre-consolidation archive. Ignore it.
- `tasks/` is documentation and worklogs, not a skill package.

## Pipelines

- **Creation**: skill-creator → skill-testing-harness → skill-evaluation → skill-trigger-optimization → skill-safety-review → skill-lifecycle-management
- **Improvement**: skill-evaluation → skill-anti-patterns → skill-improver → skill-trigger-optimization
- **Library Management**: skill-catalog-curation → skill-lifecycle-management

## Entry Points

| Goal | Start here |
|------|-----------|
| Create a new skill | `skill-creator` |
| Improve a skill | `skill-evaluation` → `skill-anti-patterns` → `skill-improver` |
| Evaluate a skill | `skill-evaluation` |
| Audit the library | `skill-catalog-curation` |

## Extension Tools

This project includes a `meta-skill-tools` extension (`.github/extensions/meta-skill-tools/`) that provides:

- `mse_validate_skill` — validate a single skill's structural compliance
- `mse_validate_all` — validate all 12 skills at once
- `mse_lint_skill` — lint a SKILL.md for format issues
- `mse_check_preservation` — check content preservation between original and modified skill

These tools automatically run the appropriate Python/Bash scripts. Use them instead of invoking scripts manually.

The extension also auto-validates any SKILL.md after you edit it, injecting the validation result into context.
