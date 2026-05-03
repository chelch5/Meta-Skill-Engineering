# Evaluation Artifact Schema

This is the canonical JSONL contract for repo-owned skill eval fixtures.

## File Families

Each root skill may include `evals/` with these files:

- `trigger-positive.jsonl`: prompts that should activate the skill.
- `trigger-negative.jsonl`: prompts that should not activate the skill.
- `behavior.jsonl`: output-shape and workflow expectations after activation.

Each non-empty line must be one JSON object.

## Trigger Positive

Required fields:

```json
{
  "prompt": "User input that should trigger the skill",
  "expected": "trigger",
  "category": "core",
  "notes": "Why this should trigger"
}
```

Rules:

- `prompt` must be a non-empty string.
- `expected` must be exactly `trigger`.
- `category` and `notes` are optional strings.

## Trigger Negative

Required fields:

```json
{
  "prompt": "User input that should not trigger the skill",
  "expected": "no_trigger",
  "better_skill": "skill-evaluation",
  "notes": "Why this belongs elsewhere"
}
```

Rules:

- `prompt` must be a non-empty string.
- `expected` must be exactly `no_trigger`.
- `better_skill` may be a skill name string or `null`.
- `notes` is optional.

## Behavior

Required fields:

```json
{
  "prompt": "Task prompt that exercises the skill",
  "expected_sections": ["Section name"],
  "required_patterns": ["literal text that must appear"],
  "forbidden_patterns": ["literal text that must not appear"],
  "min_output_lines": 10,
  "notes": "What this case proves"
}
```

Rules:

- `prompt` must be a non-empty string.
- `expected_sections`, `required_patterns`, and `forbidden_patterns` are optional arrays of strings.
- `min_output_lines` is an optional non-negative integer.
- Matching is literal and case-insensitive in `scripts/run-evals.sh`.

## Validation

Run:

```bash
python3 scripts/validate_eval_schema.py
```

`./scripts/validate-skills.sh` runs the schema validator as part of the platform contract check.
