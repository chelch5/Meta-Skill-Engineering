# Implementation Plan: Make Meta-Skill-Engineering a Working Internal System

## Problem Statement

The repo has 16 well-structured meta-skills but several systemic issues prevent it from being a reliable, measurable, internal-use system:

1. **Distribution baggage** — Every skill carries `manifest.yaml` with multi-client compatibility, overlays, provenance, security metadata, and versioning fields designed for public package distribution. The skills `skill-packaging`, `skill-installer`, `skill-provenance`, and `community-skill-harvester` exist primarily to support an external publish/distribute/import workflow that isn't the goal.
2. **Evaluation is shallow** — The eval system (`run-evals.sh`) checks whether the copilot CLI mentions the skill name in response to prompts. It doesn't evaluate whether meta-skills actually produce good rewritten skills, or whether those rewritten skills perform better.
3. **No target corpus** — There are no test skills to run meta-skills against. Evaluation is self-referential (the orchestrator scores its own work 5/5).
4. **No baseline comparison** — No mechanism to compare before/after when a skill is changed. Changes are judged in isolation.
5. **No regression protection** — Nothing prevents an "improvement" from damaging already-good skills.
6. **Format inconsistencies** — The lint script (`skill_lint.py`) checks for `# When to use this skill` but the canonical heading is `# When to use`. The eval template (`init_eval_files.py`) generates `{id, prompt, should_trigger}` but actual evals use `{prompt, expected, category, notes}`. Two skills use `Do not use when:` (plain text) instead of `# When NOT to use` (heading). `skill-improver` is missing the negative-boundary heading entirely.
7. **Scripts are fragile** — `run-meta-skill-cycle.sh` has a hardcoded path (`/home/rowan/`), references a `meta-skill-orchestrator` skill not in the repo, and claims "20 skills" when only 16 exist. Scripts lack dependency checks for Python packages (`yaml`).
8. **Docs disagree with reality** — Cycle reports reference 4 phantom skills (skill-packager, skill-deprecation-manager, skill-registry-manager, skill-reference-extraction). README and AGENTS.md say 16 skills, but the pipelines list skills in an order that includes distribution steps.
9. **No failure harvesting** — Failures during eval or improvement cycles are logged but not converted into regression test cases.
10. **No pass/fail gates** — The orchestrator assigns subjective 5/5 scores. There's no automated threshold that blocks a bad change.

## Approach

Reorganize into 5 workstreams executed in dependency order.

---

## Workstream 1: Lean the Inventory and Remove Distribution Baggage

### 1A. Demote distribution-only skills

These skills exist primarily for external publish/distribute workflows. They should be archived, not active:

- **`skill-packaging`** — Bundles skills into .skill archives with overlays and checksums for distribution. Internal use doesn't need this.
- **`skill-installer`** — Installs skills from GitHub repos. Internal skills are already in the repo. Contains LICENSE.txt, image assets, and 3 distribution scripts.
- **`skill-provenance`** — Audits origin, authorship, and license for trust assessment. Internal skills have known provenance.
- **`community-skill-harvester`** — Finds and imports skills from external registries. Has overlays/ for 4 clients, agents/ directory, and registry-oriented workflow.

Action: Move these 4 directories to `archive/` with a one-line README explaining why. Update the inventory to 12 active skills. If useful concepts from these skills (e.g., provenance checks for skill-safety-review, install validation for skill-creator) should be folded into surviving skills, do that before archiving.

### 1B. Remove manifest.yaml from all active skills

Every skill has a `manifest.yaml` with schema_version, version (semver), compatibility.clients, security metadata, provenance fields, and artifact manifests. This is packaging metadata for distribution. Internal skills don't need it.

Action: Delete `manifest.yaml` from all 12 remaining skill directories.

### 1C. Remove overlays and agents directories

`community-skill-harvester` has `overlays/` (4 client-specific subdirectories) and `agents/` (openai.yaml). These are distribution artifacts.

Action: Delete these as part of archiving the skill.

### 1D. Remove other distribution artifacts

- `skill-installer/LICENSE.txt` (Apache 2.0 license file)
- `skill-installer/assets/` (images)
- `skill-lifecycle-management/CHANGELOG.md` and `README.md` (release-oriented docs)

Action: Delete or archive with parent skills.

### 1E. Clean up skill-catalog-curation

This skill currently includes "Registry operations" (register, update metadata, generate skills-lock.json/CATALOG.md, naming conventions). The registry operations are distribution-oriented. The audit/curation parts are useful internally.

Action: Remove the registry operations section. Keep the audit, duplicate-detection, and gap-analysis procedure.

### 1F. Update pipelines

The Creation Pipeline currently ends with `→ skill-packaging → skill-installer → skill-lifecycle-management`. With packaging and installer archived, the pipeline shortens. `skill-lifecycle-management` stays but loses its distribution focus.

**Revised Creation Pipeline:**
```
skill-creator → skill-testing-harness → skill-evaluation
    → skill-trigger-optimization → skill-safety-review → skill-lifecycle-management
```

**Improvement Pipeline stays the same:**
```
skill-evaluation → skill-anti-patterns → skill-improver → skill-trigger-optimization
```

**Library Management Pipeline stays the same:**
```
skill-catalog-curation → skill-lifecycle-management
```

---

## Workstream 2: Enforce Consistent Skill Format

### 2A. Define the canonical format

Lock in this section order (from AGENTS.md, with minor fixes):

```
---
name: <kebab-case>
description: >-
  <multi-line routing description with trigger phrases and negative boundaries>
---

# Purpose

# When to use

# When NOT to use

# Procedure

# Output contract

# Failure handling

# Next steps

# References (optional)
```

Rules:
- YAML frontmatter has exactly 2 fields: `name` and `description`. No `license`, `metadata`, `compatibility`, or `allowed-tools`.
- `# When NOT to use` is the canonical heading (not `Do NOT use when:` or `Do not use when:`).
- Procedure may use `##` subheadings but is always under `# Procedure`.
- No `# Improvement modes` or `# Workflow` as top-level sections (these go under `# Procedure`).

### 2B. Normalize all 12 active skills to canonical format

Audit each SKILL.md against the canonical format. Fix:

- `skill-improver`: Has `# Improvement modes` and `# Workflow` as top-level — restructure under `# Procedure`. Has `Do not use when:` as plain text — promote to `# When NOT to use`.
- `skill-installer` (if kept): Has `Do NOT use when:` as plain text.
- `skill-lifecycle-management`: Has `Do NOT use when:` as plain text.
- `skill-creator`: Has extra `# Skill structure reference` section — merge into Procedure or References.
- `skill-catalog-curation`: Has extra `# Merge procedure` and `# Registry operations` sections — merge into Procedure.
- `skill-evaluation`: Has `# Entry mode selection` as a heading pattern that doesn't match — restructure.

### 2C. Fix the lint script to match canonical format

`scripts/skill_lint.py` (moved from skill-improver) checks for `# When to use this skill` which doesn't match any actual heading. Update to check for the canonical headings:
- `# Purpose`
- `# When to use`
- `# When NOT to use`
- `# Procedure`
- `# Output contract`
- `# Failure handling`

### 2D. Fix the eval template to match actual eval format

`scripts/init_eval_files.py` (moved from skill-improver) generates `{id, prompt, should_trigger}` but actual evals use `{prompt, expected, category, notes}`. Update the template to generate the correct schema.

### 2E. Move shared scripts to root

`skill_lint.py` and `init_eval_files.py` have been moved to `scripts/` at the root. `quick_validate.py` has also been moved to `scripts/`. The `package_skill.py` script was archived to `archive/skill-packaging/scripts/`.

---

## Workstream 3: Build a Real Evaluation System

### 3A. Build a target skill corpus

Create `corpus/` at the repo root with test skills designed to exercise the meta-skills:

**Weak skills** (should be improved by skill-improver):
- `corpus/weak/vague-procedure.md` — Skill with hand-wavy procedure steps
- `corpus/weak/missing-boundaries.md` — No "When NOT to use" section
- `corpus/weak/bloated-inline.md` — Everything crammed into one file, 600+ lines
- `corpus/weak/bad-triggers.md` — Description that triggers on wrong inputs
- `corpus/weak/no-output-contract.md` — Missing output contract

**Strong skills** (should be preserved, not damaged):
- `corpus/strong/well-formed.md` — Follows canonical format perfectly
- `corpus/strong/rich-references.md` — Has justified references/ and scripts/
- `corpus/strong/tight-routing.md` — Precise triggers with clean boundaries

**Adversarial/problematic skills** (should be handled gracefully):
- `corpus/adversarial/contradictory-purpose.md` — Purpose conflicts with procedure
- `corpus/adversarial/circular-references.md` — Skills referencing each other in loops
- `corpus/adversarial/injection-attempt.md` — Description contains prompt injection
- `corpus/adversarial/format-traps.md` — YAML that almost parses but breaks

### 3B. Two-layer evaluation

**Layer 1 — Meta-skill output quality:** Did the meta-skill (e.g., skill-improver) produce a valid, well-structured rewrite? Measured by:
- Structural compliance (canonical format check)
- All required sections present
- No content loss (purpose, constraints, references preserved)
- No hallucinated additions

**Layer 2 — Downstream performance:** Does the rewritten skill actually work better? Measured by:
- Run the original skill's eval suite against the original → get baseline scores
- Run the same eval suite against the rewritten version → get post scores
- Compare: trigger precision/recall change, behavior pass rate change
- Net regression count: how many previously-passing cases now fail

### 3C. Baseline comparison system

New script: `scripts/run-baseline-comparison.sh`

Workflow:
1. Copy the original skill to a temp directory (the baseline)
2. Run the meta-skill (e.g., skill-improver) to produce a modified version
3. Run `run-evals.sh` against the baseline → capture scores
4. Run `run-evals.sh` against the modified version → capture scores
5. Produce a comparison report:
   - Metric-by-metric delta table
   - Net regression count
   - Pass/fail verdict based on gates

### 3D. Pass/fail gates

Define hard gates that must pass for a change to be accepted:

| Gate | Threshold | Blocks on |
|------|-----------|-----------|
| Structural validity | 100% sections present | Any missing section |
| Trigger precision | ≥ baseline | Any decrease |
| Trigger recall | ≥ baseline | Any decrease |
| Behavior pass rate | ≥ baseline | Any decrease |
| Content preservation | Purpose, boundaries, references intact | Any deletion of protected content |
| Line count | < 500 lines | Exceeding limit |

### 3E. Regression protection

New file: `corpus/regression/` — Contains skills that previously failed and were fixed. Each entry includes:
- The original (broken) skill
- The expected fix
- The eval suite that caught the problem

The regression suite runs automatically as part of every eval cycle. If a regression case starts failing again, the gate blocks.

### 3F. Content preservation checks

When a meta-skill rewrites a skill, verify these are preserved (unless the user explicitly asked to change them):
- Purpose statement (semantic equivalence, not exact match)
- Negative boundaries (all "When NOT to use" entries)
- References to external files (references/, scripts/)
- Tool/script integrity (if the skill references scripts, they must still exist)
- Cross-references to other skills (must point to real skills)

Implementation: Add a `scripts/check-preservation.sh` or Python script that diffs original vs rewritten and flags deletions of protected content.

---

## Workstream 4: Failure Harvesting and Reporting

### 4A. Failure harvesting

New script: `scripts/harvest-failures.sh`

When an eval run produces failures:
1. Extract each failing test case
2. Create a regression entry: `corpus/regression/<skill>-<failure-id>.json` with the prompt, expected behavior, actual behavior, and the skill version that failed
3. Add the case to the skill's eval suite so it's tested in future runs

### 4B. Clear reporting

Standardize eval output format. Every eval run produces:

```
eval-results/<skill>-<timestamp>.md
```

Contains:
- Summary table (pass/fail/skip counts per test type)
- Gate results (each gate with PASS/FAIL status)
- Regression delta (vs previous run)
- Failure details (each failing case with expected vs actual)
- Overall verdict: PASS or FAIL with reasons

### 4C. Aggregate reporting

After `--all` runs, produce:
```
eval-results/summary-<timestamp>.md
```

Contains:
- Per-skill pass/fail status
- System-wide metrics (total pass rate, regression count)
- Skills that degraded since last run
- Skills that improved since last run

---

## Workstream 5: Fix Tooling and Docs

### 5A. Fix broken scripts

**`run-meta-skill-cycle.sh`:**
- Remove hardcoded `/home/rowan/` path — use `REPO_ROOT` like the other scripts
- Remove reference to `meta-skill-orchestrator` (external skill not in repo) — either inline the orchestration logic or document clearly that it requires an external skill
- Fix "20 skills" to match actual count

**`validate-skills.sh`:**
- Add check for canonical section headings (not just frontmatter)
- Add check that `manifest.yaml` does NOT exist (post-cleanup)

**`run-evals.sh`:**
- Works but the skill-mention-in-response check is fragile — document this limitation and plan for improvement

### 5B. Align all documentation

**README.md:**
- Update inventory table to 12 skills
- Update pipelines (remove packaging/installer/provenance)
- Update categories (remove "Packaging & Distribution", "Safety & Provenance" becomes just "Safety")
- Remove `community-skill-harvester` from entry points
- Add entry point for evaluation: `skill-evaluation` (run evals) → `skill-benchmarking` (compare versions)

**AGENTS.md:**
- Update skill count
- Update pipelines
- Update SKILL.md Structure to match canonical format exactly
- Remove mention of `manifest.yaml` from package shape
- Remove `overlays/` from package shape
- Add `corpus/` to inventory boundaries

### 5C. Clean up tasks/worklogs

The worklogs reference 20 skills, phantom skill names, and pre-consolidation history. They're historical records. Keep them but:
- Add a `tasks/README.md` noting these are historical and may reference skills that no longer exist
- Do not update them to match current state (they're accurate records of past work)

### 5D. Evaluation cadence

Document a repeatable eval cycle:

1. Run `scripts/validate-skills.sh` — structural check
2. Run `scripts/run-evals.sh --all` — trigger and behavior tests
3. Run corpus tests against meta-skills — Layer 1 + Layer 2 evaluation
4. Check regression suite — no regressions
5. Review aggregate report — pass/fail gates
6. If pass: commit. If fail: fix and re-run.

Add a `scripts/run-full-cycle.sh` that runs steps 1-5 in sequence and produces the aggregate report.

---

## Dependency Order

```
Workstream 1 (Lean)
    ↓
Workstream 2 (Format)
    ↓
Workstream 3 (Evaluation) ← parallel with Workstream 5A-B (Fix scripts/docs)
    ↓
Workstream 4 (Failure harvesting & reporting)
    ↓
Workstream 5C-D (Final docs & cadence)
```

## Todo Summary

| ID | Title | Depends On |
|----|-------|------------|
| lean-archive | Archive 4 distribution-only skills | — |
| lean-manifests | Remove manifest.yaml from all active skills | lean-archive |
| lean-distro-artifacts | Remove overlays, agents, LICENSE, assets, CHANGELOG | lean-archive |
| lean-catalog | Strip registry operations from skill-catalog-curation | lean-archive |
| lean-pipelines | Update pipeline definitions | lean-archive |
| format-canonical | Define and document canonical SKILL.md format | lean-archive |
| format-normalize | Normalize all 12 skills to canonical format | format-canonical |
| format-lint | Fix skill_lint.py to check canonical headings | format-canonical |
| format-eval-template | Fix init_eval_files.py to generate correct schema | format-canonical |
| format-scripts-root | Move shared scripts to scripts/ | format-normalize |
| eval-corpus | Build target skill corpus (weak/strong/adversarial) | format-normalize |
| eval-two-layer | Implement Layer 1 + Layer 2 evaluation | eval-corpus |
| eval-baseline | Build baseline comparison script | eval-two-layer |
| eval-gates | Define and implement pass/fail gates | eval-baseline |
| eval-regression | Build regression protection system | eval-gates |
| eval-preservation | Build content preservation checks | eval-gates |
| harvest-failures | Build failure harvesting script | eval-regression |
| report-format | Standardize eval report format | eval-gates |
| report-aggregate | Build aggregate reporting | report-format |
| fix-scripts | Fix broken/fragile scripts | lean-pipelines |
| fix-docs | Align README.md, AGENTS.md with reality | lean-pipelines, format-normalize |
| fix-tasks-readme | Add historical note to tasks/ | fix-docs |
| eval-cadence | Document eval cadence and build run-full-cycle.sh | harvest-failures, report-aggregate |
