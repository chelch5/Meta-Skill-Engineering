#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]


def _is_str_list(value: Any) -> bool:
    return isinstance(value, list) and all(isinstance(item, str) for item in value)


def _validate_record(path: Path, line_number: int, record: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(record, dict):
        return [f"{path}:{line_number}: record must be an object"]

    rel = path.relative_to(REPO_ROOT).as_posix()
    name = path.name
    prompt = record.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip():
        errors.append(f"{rel}:{line_number}: prompt must be a non-empty string")

    if name == "trigger-positive.jsonl":
        if record.get("expected") != "trigger":
            errors.append(f"{rel}:{line_number}: expected must be 'trigger'")
        category = record.get("category")
        if category is not None and not isinstance(category, str):
            errors.append(f"{rel}:{line_number}: category must be a string when present")
    elif name == "trigger-negative.jsonl":
        if record.get("expected") != "no_trigger":
            errors.append(f"{rel}:{line_number}: expected must be 'no_trigger'")
        better_skill = record.get("better_skill")
        if better_skill is not None and not isinstance(better_skill, str):
            errors.append(f"{rel}:{line_number}: better_skill must be a string or null when present")
    elif name == "behavior.jsonl":
        for key in ("expected_sections", "required_patterns", "forbidden_patterns"):
            if key in record and not _is_str_list(record[key]):
                errors.append(f"{rel}:{line_number}: {key} must be an array of strings")
        min_output_lines = record.get("min_output_lines")
        if min_output_lines is not None and (
            not isinstance(min_output_lines, int) or min_output_lines < 0
        ):
            errors.append(f"{rel}:{line_number}: min_output_lines must be a non-negative integer")
    else:
        errors.append(f"{rel}:{line_number}: unsupported eval file name")

    notes = record.get("notes")
    if notes is not None and not isinstance(notes, str):
        errors.append(f"{rel}:{line_number}: notes must be a string when present")
    return errors


def main() -> int:
    errors: list[str] = []
    eval_files = sorted(
        path
        for skill_md in REPO_ROOT.glob("*/SKILL.md")
        for path in (skill_md.parent / "evals").glob("*.jsonl")
    )

    for path in eval_files:
        if path.name not in {"trigger-positive.jsonl", "trigger-negative.jsonl", "behavior.jsonl"}:
            errors.append(f"{path.relative_to(REPO_ROOT).as_posix()}: unsupported eval file name")
            continue
        for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            if not raw_line.strip():
                continue
            try:
                record = json.loads(raw_line)
            except json.JSONDecodeError as exc:
                errors.append(f"{path.relative_to(REPO_ROOT).as_posix()}:{line_number}: invalid JSON: {exc.msg}")
                continue
            errors.extend(_validate_record(path, line_number, record))

    if errors:
        print("Eval schema validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Eval schema validation passed: {len(eval_files)} files checked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
