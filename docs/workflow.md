# Development Workflow Guide

This repo uses an autonomous, evidence-first workflow. Do not pause for approval when the required facts can be discovered locally and the change is within the active task scope.

## Before Editing

1. Read `AGENTS.md`.
2. Check the owning surface:
   - CLI/backend: `scripts/meta-skill-studio.py`, `scripts/meta_skill_studio/`
   - Tauri UI: `src/`, `src-tauri/`
   - root skills: top-level `skill-*` packages
   - library skills: `LibraryUnverified/`, `LibraryWorkbench/`, `Library/`
3. Run a narrow baseline command when practical.

## Standard Flow

1. Investigate with `rg` and targeted file reads.
2. Make the smallest coherent change in the owning surface.
3. Run focused validation for that surface.
4. Expand validation when the change touches shared contracts or runtime behavior.
5. Record changed paths and exact command evidence.

## Validation Matrix

Use these commands for broad changes:

```bash
python3 scripts/validate_cli_contract.py
./scripts/validate-skills.sh
./scripts/run-evals.sh --dry-run skill-creator
npm run build
(cd src-tauri && cargo check)
npm run tauri -- build --debug --no-bundle
```

Use `npm run library:improve -- --count N` only for deliberate autonomous library improvement runs. Review generated diffs before promotion.

## PR Flow

Every implementation slice should be reviewable:

1. Create a topic branch.
2. Commit only the slice-owned files.
3. Open a PR.
4. Run review and CI checks.
5. Fix blockers on the same branch.
6. Merge after checks pass.
7. Delete merged local and remote branches.
