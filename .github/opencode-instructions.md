# OpenCode Instructions

This repository uses OpenCode as the canonical agent runtime.

- Treat `scripts/meta-skill-studio.py --mode cli` as the authoritative workflow surface.
- Use `scripts/meta_skill_studio/opencode_sdk_bridge.mjs` for SDK-backed assistant or autonomous agent calls.
- Keep root skill inventory limited to the 17 repo-owned root skill packages.
- Keep `LibraryUnverified/` and `LibraryWorkbench/` out of the verified root inventory.
- Run `python scripts/validate_cli_contract.py` and `./scripts/validate-skills.sh` after workflow or skill-surface changes.
