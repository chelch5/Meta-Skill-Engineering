# Pipeline Definitions

This skill-local reference keeps `skill-orchestrator` executable without loading repository-global docs. The repository-level source of truth is `../../references/pipeline-definitions.md`.

## Creation Pipeline

Purpose: create a new skill from a brief and carry it through validation, evaluation, safety, provenance, packaging, installation, and lifecycle review.

Phases:

1. `skill-creator`
2. `skill-testing-harness`
3. `skill-evaluation`
4. `skill-trigger-optimization`
5. `skill-safety-review`
6. `skill-provenance`
7. `skill-packaging`
8. `skill-installer`
9. `skill-lifecycle-management`

Required input: `--brief`.

## Improvement Pipeline

Purpose: improve an existing skill from a concrete goal or failed evaluation evidence.

Phases:

1. `skill-anti-patterns`
2. `skill-improver`
3. `skill-evaluation`
4. `skill-trigger-optimization`

Required input: `--skill`.

## Library Management Pipeline

Purpose: audit and maintain library tiers without confusing unverified material with verified production packages.

Phases:

1. `skill-catalog-curation`
2. `skill-lifecycle-management`

Required input: `--skill` for skill-scoped management or a catalog goal for broad audits.

## State Contract

Pipeline state is written under `tasks/pipelines/` and includes:

- `pipeline_id`
- `pipeline_type`
- `target_skill`
- `brief` when creation is selected
- `current_phase`
- `phases[]` with phase id, skill id, status, input, output, exit code, and timestamps
- `artifacts[]`
- `resume_possible`

Resume with:

```bash
python scripts/meta-skill-studio.py --mode cli --action resume-pipeline --run-id <pipeline-id> --format json
```
