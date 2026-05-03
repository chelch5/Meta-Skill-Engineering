# Troubleshooting Guide

## Tauri Build Fails On Ubuntu

**Symptom:** `cargo check` or `npm run tauri -- build` fails while compiling WebKit or appindicator bindings.

**Fix:**

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf
```

Then rerun:

```bash
npm run build
(cd src-tauri && cargo check)
```

## Frontend Build Fails

**Symptom:** TypeScript or Vite fails during `npm run build`.

**Fix:**

```bash
npm install
npm run build
```

If the error references a changed CLI action, run:

```bash
python3 scripts/validate_cli_contract.py
python scripts/meta-skill-studio.py --mode cli --action list-actions --format json
```

## OpenCode SDK Bridge Times Out

**Symptom:** `scripts/meta_skill_studio/opencode_sdk_bridge.mjs` reports an assistant timeout.

**Fix:**

1. Confirm provider auth exists in the OpenCode auth config.
2. Confirm the requested provider/model appears in `python scripts/meta-skill-studio.py --mode cli --action list-models --format json`.
3. Retry with a longer `--timeout-seconds` value for large library-skill edits.

## Skill Validation Fails

**Symptom:** `./scripts/validate-skills.sh` reports missing sections or invalid frontmatter.

**Fix:**

1. Open the reported `SKILL.md`.
2. Restore required frontmatter fields.
3. Ensure the body includes `Purpose`, `When to use`, `Procedure`, `Output contract`, `Failure handling`, and `Next steps` when the package standard requires them.
4. Rerun `./scripts/validate-skills.sh`.

## CLI Contract Validation Fails

**Symptom:** `python3 scripts/validate_cli_contract.py` reports action mismatch.

**Fix:**

1. Run `python scripts/meta-skill-studio.py --mode cli --action list-actions --format json`.
2. Compare the result to `docs/cli/action-contract.md`.
3. Update the implementation or contract so the action inventory matches.

## Git Issues

### Branch Divergence

**Symptom:** `Your branch and 'origin/main' have diverged`.

**Fix:**

```bash
git fetch origin
git status
```

Choose a rebase or merge according to the active PR branch policy, then rerun the relevant validation.
