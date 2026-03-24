---
name: repo-process-doctor
description: Audit existing repositories for agent-workflow drift and repair opportunities. Use when a repo has custom OpenCode agents, commands, process docs, or ticket systems and you need to diagnose contradictory status semantics, raw-file stage control, missing workflow-state tools, unsafe read-only delegation, or other workflow smells.
---

# Repo Process Doctor

Use this skill to inspect and repair agent-workflow issues in an existing repository.

## Mode selection

- If this skill is reached from `scaffold-kickoff` on a freshly scaffolded repo, start in `audit` mode and apply safe repairs only when findings justify them.
- If the user explicitly asks to inspect or diagnose workflow issues without editing, use `audit`.
- If the user explicitly asks for a repair plan before edits, use `propose-repair`.
- If the user explicitly asks to repair, update, or fully refresh the managed workflow layer, use `apply-repair`.
- If it is unclear whether the user wants diagnosis only or repo edits, ask the user before choosing a mode.

## Procedure

### 1. Run the audit script

The audit script runs the current set of automated workflow checks. Run it:

```
python3 scripts/audit_repo_process.py <repo-root> --format both
```

The script is at `scripts/audit_repo_process.py` relative to this skill's directory.

The script produces:
- A markdown report with findings (problem, root cause, affected files, safer pattern)
- A JSON report with structured findings (code, severity, problem, files, evidence)

The script ONLY diagnoses — it does not modify any files.

### 2. Interpret findings

Map each finding to `references/process-smells.md` to understand:
- What the smell is
- Why it fails (especially with weaker models)
- What the safer pattern looks like

### 3. Choose a mode

**audit** — Report findings only. Use for initial inspection or post-scaffold verification.

**propose-repair** — Write a repair plan listing exact files to change and what to change. Present to the user for approval before making changes. Use when you're unsure whether repairs would change project intent.

**apply-repair** — Apply repairs directly. Use when findings are clearly safe to fix. You (the agent) make the changes, not the script.

When a repo has an older or conflicting OpenCode operating layer, treat managed-surface replacement as a form of `apply-repair`, not as a separate workflow. Replace the deterministic workflow-engine surfaces in one deliberate pass instead of mixing old and new process contracts together, then follow up on any project-specific agent-team drift explicitly.

For managed-surface replacement, prefer the deterministic repair runner:

```sh
python3 scripts/apply_repo_process_repair.py <repo-root>
```

If you are using the Scafforge package CLI directly, you can also run:

```sh
scafforge repair-process <repo-root>
```

Use manual edits for narrower safe repairs that do not require a full managed-surface pass, or for project-specific agent-team follow-up that cannot be regenerated mechanically from the base scaffold alone.

### Safe vs intent-changing repairs

Read `references/repair-playbook.md` for the boundary.

**Safe repairs (apply directly):**
- Regenerating derived docs from canonical state
- Aligning queue/workflow-state/artifact contracts to scaffold model
- Removing raw-file stage control where tool-backed alternatives exist
- Normalizing contradictory status semantics into the coarse queue contract
- Fixing read-only agents that have mutating shell commands
- Replacing clearly scaffold-managed OpenCode operating surfaces when audit evidence shows the repo is on an older Scafforge contract and durable project facts can be preserved

**Intent-changing repairs (escalate to user):**
- Changes that affect project scope or product intent
- Choosing between unresolved stack/runtime options
- Changing provider or model choices
- Deleting or rewriting curated human decisions
- Collapsing repo-specific patterns that aren't clearly broken

### 4. Apply repairs (if in apply-repair mode)

For each safe repair:
1. Read the finding
2. Read the safer pattern from `references/repair-playbook.md`
3. Read `references/safe-stage-contracts.md` for the target contract
4. If the finding indicates an older or conflicting operating layer, run the deterministic repair runner for the workflow-engine surfaces instead of patching them piecemeal
5. Apply any remaining targeted follow-up for project-specific agent or process-doc drift
6. Verify the change resolves the finding
7. Record the process change in `.opencode/meta/bootstrap-provenance.json` and `.opencode/state/workflow-state.json`
8. If the process layer materially changed, set `pending_process_verification: true` so the backlog verifier lane can re-check previously completed tickets
9. Leave an obvious repair trail (document what was changed and why)

For each intent-changing repair:
1. Present the finding and proposed repair to the user
2. Explain why this might change project intent
3. Wait for user decision before proceeding

### 5. Post-repair verification

Re-run the audit script to confirm findings are resolved:
```
python3 scripts/audit_repo_process.py <repo-root> --format both --fail-on warning
```

## How this differs from scaffold-kickoff

- `scaffold-kickoff` generates a fresh repo from templates
- `repo-process-doctor` diagnoses and fixes DRIFT in existing repos
- They are complementary: kickoff creates, doctor maintains

## After this step

Continue to `../handoff-brief/SKILL.md` as directed by `../scaffold-kickoff/SKILL.md`.

## Required outputs

- Concise diagnosis of each finding
- Root cause for each finding
- Chosen mode (audit / propose-repair / apply-repair)
- Exact files patched (if apply-repair)
- Target safer pattern for each repair
- Whether managed-surface replacement occurred
- Whether post-migration verification was left pending
- Post-repair verification results

## Rules

- Do not preserve contradictory status semantics just because they already exist
- Do not keep multi-surface workflow state if one surface can become derived
- Prefer deterministic migration to the current scaffold contract
- Treat read-only mutation paths as blockers
- Default to apply-repair for safe repairs, escalate intent-changing repairs
- Always leave an obvious repair trail — never silently fix without evidence
- Do not leave a repo in a mixed old/new workflow state across agents, tools, plugins, commands, and process docs; findings like `partial-workflow-layer-drift` and `missing-process-change-tracking` are explicit signs that the operating layer is still mixed

## References

- `references/process-smells.md` — the workflow smells covered by the audit
- `references/repair-playbook.md` — repair targets and safe/intent-changing boundary
- `references/safe-stage-contracts.md` — stage contract definitions
