# AGENTS.md

This repository is a meta-skill engineering workspace. Treat each top-level skill directory as a first-class package with `SKILL.md` as the baseline contract.

## Working Rules

- Prefer direct, factual documentation and implementation notes.
- Keep the root skill inventory limited to the 12 repo-owned top-level skill packages.
- **Keep root docs current with every commit.** When a commit changes scripts, eval capabilities, skill contracts, or repo structure, update `AGENTS.md`, `README.md`, and `.github/copilot-instructions.md` in the same commit so they never drift from the implemented system.
- Update root docs when repo-owned skill packages are added, removed, renamed, or materially re-scoped.
- Do not conflate archived material in `skill creator/` with the active inventory.

## Skill Package Shape

- Every repo-owned skill package must contain `SKILL.md`.
- A richer package may also include `references/`, `scripts/`, `evals/`, or `assets/`.
- When a package has evals or scripts, treat them as support layers for the skill rather than as the skill itself.
- Skills are internal-only; do not add license, compatibility, or release metadata unless explicitly needed.

## Script Distribution Model

Root `scripts/` contains the **source-of-truth** copies of all automation scripts. Per-skill `scripts/` directories contain **deployed copies** — identical files, same names. Each skill gets only the scripts its procedure actually references.

**Workflow**: Edit a script in root `scripts/` → run `scripts/sync-to-skills.sh` → copies propagate to all skills that use them.

**Sync modes**:
- `./scripts/sync-to-skills.sh` — copy all scripts per manifest
- `./scripts/sync-to-skills.sh --dry-run` — show what would be copied
- `./scripts/sync-to-skills.sh --check` — verify per-skill copies match root (CI-friendly)

The manifest mapping (which scripts go to which skills) is defined at the top of `sync-to-skills.sh`. When adding a new script or changing which skills use it, update the manifest and re-run sync.

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

Optional usefulness evaluation fields (for `--usefulness` mode):
```json
{"prompt": "...", "expected_sections": ["..."], "required_patterns": ["..."], "forbidden_patterns": ["..."], "min_output_lines": 15, "notes": "...", "usefulness_criteria": "What 'good' looks like for this case", "usefulness_dimensions": ["correctness", "completeness", "actionability", "conciseness"], "usefulness_threshold": 3}
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
- `corpus/` contains test skills for evaluating meta-skills (5 weak, 3 strong, 4 adversarial, 3 regression).
- `skill creator/` is archived source material from the pre-consolidation state.
- `tasks/` is documentation, worklogs, and reviews — not a skill package.
- `scripts/` contains automation scripts for running evals, validation, and optimization.
- `docs/` contains operational documentation (evaluation cadence, workflows).

## Evaluation Tooling

The eval system uses Copilot CLI (`copilot -p`) with structured JSON output for routing detection.

| Script | Purpose |
|--------|---------|
| `scripts/run-evals.sh` | Trigger and behavior tests with pass/fail gates (`--observe`/`--strict` routing, `--runs N` majority voting, `--usefulness` LLM-as-Judge scoring) |
| `scripts/run-trigger-optimization.sh` | Automated trigger optimization with 60/40 train/test split and held-out validation |
| `scripts/validate-skills.sh` | Structural compliance check for all 12 skills |
| `scripts/run-full-cycle.sh` | Full 5-step evaluation cadence |
| `scripts/run-baseline-comparison.sh` | Before/after comparison with gates |
| `scripts/run-corpus-eval.sh` | Two-layer meta-skill evaluation against corpus |
| `scripts/run-regression-suite.sh` | Regression protection runner |
| `scripts/sync-to-skills.sh` | Sync root scripts to per-skill `scripts/` directories per manifest |

**Default model:** `gpt-4.1`. Override with `EVAL_MODEL` env var.

**Routing modes:** `--observe` (default) parses JSON output to detect actual SKILL.md file reads. `--strict` runs with and without `--no-custom-instructions` for differential comparison (2x slower).

See `docs/evaluation-cadence.md` for the full evaluation workflow.

## Copilot CLI Integration

- `.github/copilot-instructions.md` provides project-level instructions for Copilot CLI sessions.
- `.github/extensions/meta-skill-tools/` provides validation tools (`mse_validate_skill`, `mse_validate_all`, `mse_lint_skill`, `mse_check_preservation`) and an auto-validation hook that runs after SKILL.md edits.
