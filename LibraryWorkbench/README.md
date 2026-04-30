# LibraryWorkbench

Use this directory for candidate skills under active testing, benchmarking, normalization, and evaluation.

## Admission

A candidate may enter this tier only after basic source inspection confirms it has a usable `SKILL.md`, no obvious unsafe import behavior, and a clear category.

## Required Gates

- Normalize `SKILL.md` to the repository section order.
- Add or repair `evals/trigger-positive.jsonl`, `evals/trigger-negative.jsonl`, and `evals/behavior.jsonl`.
- Run structural validation and targeted evals.
- Run `skill-safety-review` when the skill touches execution, credentials, external services, or generated code.
- Run `skill-provenance` before release.
- Run `skill-packaging` and keep the verified archive path in the promotion record.

Only packages that pass these gates move to `Library/`.

