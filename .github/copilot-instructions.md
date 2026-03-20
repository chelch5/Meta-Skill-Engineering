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
- `trigger-negative.jsonl` — `{"prompt": "...", "expected": "no_trigger", "better_skill": "skill-name-or-null", "notes": "..."}`
- `behavior.jsonl` — `{"prompt": "...", "expected_sections": [...], "required_patterns": [...], "forbidden_patterns": [...], "min_output_lines": 15, "notes": "..."}`

Optional usefulness fields for `--usefulness` mode: `"usefulness_criteria": "...", "usefulness_dimensions": [...], "usefulness_threshold": N`

No other eval formats are active. Do not use `evals.json`, `output-tests.jsonl`, `triggers.yaml`, `outputs.yaml`, or `baselines.yaml`.

## Available Scripts

| Script | Purpose |
|--------|---------|
| `scripts/validate-skills.sh` | Validate all 12 skills for structural compliance |
| `scripts/run-evals.sh` | Run trigger and behavior tests; `--observe`/`--strict` routing, `--runs N` for majority voting, `--usefulness` for LLM-as-Judge scoring (requires `copilot` CLI + `jq`) |
| `scripts/run-trigger-optimization.sh` | Automated trigger optimization with 60/40 train/test split and held-out validation |
| `scripts/run-full-cycle.sh` | Full 5-step evaluation cadence |
| `scripts/run-baseline-comparison.sh` | Before/after comparison with gates |
| `scripts/run-corpus-eval.sh` | Two-layer meta-skill evaluation against corpus |
| `scripts/run-regression-suite.sh` | Regression protection runner |
| `scripts/check_skill_structure.py` | 10-point structural scoring for a skill |
| `scripts/check_preservation.py` | Jaccard similarity for content preservation |
| `scripts/skill_lint.py` | Lint a SKILL.md for format issues |
| `scripts/harvest_failures.py` | Convert failures into regression cases |
| `scripts/sync-to-skills.sh` | Sync root scripts to per-skill `scripts/` directories per manifest |
| `scripts/run-meta-skill-cycle.sh` | **Optional/experimental** — orchestrate meta-skill cycle via non-interactive Copilot |

After editing any SKILL.md, run `scripts/validate-skills.sh` to confirm compliance.

After editing any script in root `scripts/`, run `scripts/sync-to-skills.sh` to propagate changes to per-skill copies.

## Key Rules

- Frontmatter must contain only `name` and `description`. No other fields.
- **Keep root docs current with every commit.** When a commit changes scripts, eval capabilities, skill contracts, or repo structure, update `AGENTS.md`, `README.md`, and `.github/copilot-instructions.md` in the same commit so they never drift from the implemented system.
- **Script distribution**: Root `scripts/` = source-of-truth dev copies. Per-skill `scripts/` = deployed copies. Edit in root, then run `scripts/sync-to-skills.sh` to propagate. Never edit per-skill copies directly.
- Do not create `manifest.yaml` in skill packages — it is a stale distribution artifact.
- Do not add license, compatibility, or release metadata to skills.
- `archive/` is read-only historical storage. Do not modify archived skills.
- `corpus/` contains test skills for meta-skill evaluation (5 weak, 5 strong, 5 adversarial, 3 regression). Treat as test fixtures.
- `eval-results/` contains timestamped eval reports with `<skill>-eval.md` symlinks to latest. Handoff between `skill-evaluation` and `skill-improver`.
- `docs/` contains operational documentation (evaluation cadence, workflows).
- `tasks/` is documentation and worklogs, not a skill package.

## Implementation Integrity Rules

These rules exist because an agent previously substituted documentation edits for planned code changes, wrote TODO comments and marked them as completed, and claimed files were clean without reading them.

- **Do what the plan says.** If a plan specifies adding a CLI flag, writing a function, or changing code — do that. Rewriting documentation to describe current behavior as intentional is not a fix.
- **Never mark a TODO comment as completed work.** Writing `# TODO: implement X` is not implementing X.
- **Verify before claiming "already done."** Read the file. Grep for the patterns. Show evidence.
- **Do not silently downgrade scope.** If you choose a simpler approach than planned, flag the deviation explicitly and get approval before marking it done.
- **Do not batch shortcuts into large commits** alongside genuinely completed items.
- **If a task is too complex, say so.** Report it as blocked or deferred. Do not pretend a doc change satisfies a code change requirement.

## Pipelines

- **Creation**: skill-creator → skill-testing-harness → skill-evaluation → skill-trigger-optimization → skill-safety-review → skill-lifecycle-management
- **Improvement**: skill-evaluation → skill-anti-patterns → skill-improver → skill-trigger-optimization. Eval results in `eval-results/` are the handoff: skill-evaluation writes structured reports, skill-improver reads them to drive diagnosis.
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
