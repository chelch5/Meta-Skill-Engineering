# Architecture Guide

Meta Skill Studio is a headless-first skill-engineering platform with a Tauri desktop shell.

## System Overview

- Python Studio CLI: authoritative workflow contract for create, improve, evaluate, package, install, and library governance.
- Python Studio backend: shared implementation in `scripts/meta_skill_studio/app.py`.
- OpenCode SDK bridge: model-backed assistant and autonomous-agent execution helper.
- Tauri shell: cross-platform desktop UI in `src/` and `src-tauri/`.
- TUI/tkinter shells: local convenience surfaces layered over the same backend.

```text
Tauri UI / TUI / tkinter
        |
        v
Python Studio CLI contract
        |
        v
scripts/meta_skill_studio/app.py
        |
        v
Root skills, library tiers, evals, worklogs, and pipeline artifacts
```

## Authority Boundaries

The Python CLI remains the source of workflow truth. Desktop UI work must call or mirror documented CLI actions instead of inventing separate action semantics.

Use these checks when changing architecture:

1. `python3 scripts/validate_cli_contract.py`
2. `./scripts/validate-skills.sh`
3. `./scripts/run-evals.sh --dry-run skill-creator`
4. `npm run build`
5. `(cd src-tauri && cargo check)`

## Tauri Shell

The Tauri shell owns desktop layout, navigation, local settings, and operator ergonomics. It does not own skill evaluation semantics.

Primary paths:

- `src/main.ts`
- `src/styles.css`
- `src-tauri/src/lib.rs`
- `src-tauri/tauri.conf.json`

Expected commands:

```bash
npm install
npm run build
(cd src-tauri && cargo check)
npm run tauri -- dev
```

## OpenCode SDK Bridge

`scripts/meta_skill_studio/opencode_sdk_bridge.mjs` uses `@opencode-ai/sdk` to run assistant prompts and autonomous agent prompts through configured providers.

The bridge is a runtime helper, not the canonical skill lifecycle contract. The CLI and `StudioCore` remain the durable contract.
