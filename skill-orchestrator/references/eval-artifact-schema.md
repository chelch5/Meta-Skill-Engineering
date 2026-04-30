# Evaluation Artifact Schema

This skill-local reference is the orchestrator-facing contract for evaluation artifacts. The repository-level source of truth is `../../references/eval-artifact-schema.md`; this file keeps the `skill-orchestrator` package self-contained for agents that load only the skill folder.

## Run Artifact Contract

Every orchestrated evaluation run records:

- `skill_id`: skill folder name.
- `skill_version`: value from `manifest.yaml` when present, otherwise `0.0.0-dev`.
- `commit`: current git commit or `unknown` when git metadata is unavailable.
- `test_suite_id`: `trigger-positive`, `trigger-negative`, `behavior`, or a combined suite id.
- `runtime`: runtime command used for execution.
- `model`: model identifier or `auto`.
- `trigger_positive_score`: pass rate from `evals/trigger-positive.jsonl`.
- `trigger_negative_score`: pass rate from `evals/trigger-negative.jsonl`.
- `behavior_score`: pass rate from `evals/behavior.jsonl`.
- `failure_examples`: representative failing cases with prompt, expected behavior, and observed behavior.
- `improvement_recommendations`: ordered remediation items suitable for `skill-improver`.

## Eval File Families

- `evals/trigger-positive.jsonl`: prompts that should activate the skill.
- `evals/trigger-negative.jsonl`: prompts that should not activate the skill.
- `evals/behavior.jsonl`: output-shape and workflow expectations after activation.

Each line must be valid JSON. The structural validator rejects invalid JSONL and broken referenced resources before pipeline execution.

## Retention And Comparison

- Store run artifacts under `.meta-skill-studio/runs/`.
- Store eval result summaries under `eval-results/`.
- Compare runs with `python scripts/meta-skill-studio.py --mode cli --action compare-runs --before-run <file> --after-run <file> --format json`.
- Convert failed cases into an improvement brief with `--action improvement-brief`.
