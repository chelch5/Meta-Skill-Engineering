#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "scripts"))

from meta_skill_studio.cli_contract import ACTION_SPECS, REQUIRED_PLATFORM_DOCS  # noqa: E402


def main() -> int:
    errors: list[str] = []
    docs = REPO_ROOT / "docs" / "cli" / "action-contract.md"
    if not docs.is_file():
        errors.append(f"Missing CLI contract doc: {docs.relative_to(REPO_ROOT)}")
    else:
        text = docs.read_text(encoding="utf-8")
        text = text.split("## Canonical actions", 1)[-1]
        documented = set(re.findall(r"\|\s*`([^`]+)`\s*\|", text))
        expected = {spec.name for spec in ACTION_SPECS}
        missing = sorted(expected - documented)
        extra = sorted(documented - expected - {"test", "benchmarks"})
        if missing:
            errors.append("Actions missing from docs: " + ", ".join(missing))
        if extra:
            errors.append("Unknown actions documented: " + ", ".join(extra))

    for rel in REQUIRED_PLATFORM_DOCS:
        if not (REPO_ROOT / rel).is_file():
            errors.append(f"Missing required platform doc: {rel}")

    if errors:
        print("CLI contract validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"CLI contract validation passed: {len(ACTION_SPECS)} actions documented.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
