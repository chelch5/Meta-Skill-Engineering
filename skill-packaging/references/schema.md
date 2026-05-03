# Skill Package Schema

`skill-packaging` creates a `tar.gz` archive containing one skill folder plus a generated `manifest.yaml`. The archive is verified immediately after creation.

## Required Source Layout

```text
skill-name/
  SKILL.md
  manifest.yaml
  evals/
    trigger-positive.jsonl
    trigger-negative.jsonl
    behavior.jsonl
  references/
  scripts/
```

Only `SKILL.md` is universally required. `manifest.yaml`, `evals/`, `references/`, and `scripts/` are included when present. Files under `.git/`, `node_modules/`, `__pycache__/`, `dist/`, and `.pytest_cache/` are excluded.

## Generated Manifest

```yaml
schema_version: 1
name: skill-name
version: 0.1.0
description: "Skill description from SKILL.md frontmatter"
license: MIT
compatibility:
  clients:
    - opencode
files:
  - SKILL.md
  - manifest.yaml
checksums:
  SKILL.md: <sha256>
```

## Validation Rules

- `SKILL.md` must have frontmatter with `name` matching the folder and a meaningful `description`.
- Every `references/...` and `scripts/...` path mentioned in `SKILL.md` must exist inside the skill package.
- Every packaged file receives a SHA-256 checksum.
- The archive is extracted into a temporary directory and each checksum is recomputed before success is reported.

## CLI

```bash
python scripts/meta-skill-studio.py --mode cli --action package-skill --skill skill-packaging --destination dist/skills --format json
```
