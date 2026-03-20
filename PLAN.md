# Implementation Plan — Round 2: Review Remediation

## Status of Round 1

Round 1 (23 todos across 5 workstreams) is complete. The repo was leaned from 16→12 skills, all skills follow canonical format, structural validation passes, and a corpus + evaluation scaffolding exists.

## Round 2 Problem Statement

A code review identified 12 findings. All 12 are factually confirmed against the live repo. They fall into three categories:

- **4 partially addressed**: the plan touched the area but implementation was incomplete
- **3 acknowledged but deferred**: the plan noted them but chose to document rather than fix
- **5 genuine gaps**: real issues the original plan did not cover

## Finding-by-Finding Assessment

All 12 findings verified against the live repo. Assessment of each:

### P0-1: Unify the evaluation contract — VALID ✓

**Was it in the plan?** Partially. Plan fixed `init_eval_files.py` and `skill_lint.py` schemas but did not audit eval format references inside skill SKILL.md procedure text.

**What the review found:**
- `skill-creator/SKILL.md` Phase 3 still documents `evals/evals.json` with `{id, prompt, should_trigger}` — dead format
- `skill-testing-harness/SKILL.md` documents `output-tests.jsonl` but the live runner reads `behavior.jsonl`
- `skill-evaluation/SKILL.md` lists YAML formats (`triggers.yaml`, `outputs.yaml`, `baselines.yaml`) that no tooling supports
- `AGENTS.md` defines no eval contract at all

**Confirmed against repo:** All four claims verified. The toolchain (runner + validator + init script) agrees on `trigger-positive.jsonl`, `trigger-negative.jsonl`, `behavior.jsonl` with the JSONL schema. But three skill SKILL.md files document incompatible formats.

### P0-2: Replace the routing proxy — VALID ✓ (limited fix available)

**Was it in the plan?** Yes — intentionally deferred. Plan said "document this limitation."

**What the review found:** `run-evals.sh` line 138 uses `grep -qi "$skill"` on the response text to infer routing. This is acknowledged as unreliable.

**Assessment:** The review is right that this is weak. However, the Copilot CLI invocation (`copilot -p "$prompt" --model ... --allow-all --autopilot`) does not expose skill activation metadata. The review suggests "deterministic with-skill vs without-skill injection" — this is viable if we run each prompt twice (once with the skill present, once without) and compare outputs. That's expensive (doubles eval time) but credible. Alternative: inject a unique marker in the skill's output contract and check for it.

### P0-3: Lifecycle source of truth — VALID ✓

**Was it in the plan?** No. Plan removed `manifest.yaml` and set frontmatter to name+description only, but did not audit `skill-lifecycle-management` procedure text for conflicting instructions.

**What the review found:**
- `AGENTS.md` line 22: "these two fields only, no license/metadata/compatibility"
- `skill-lifecycle-management/SKILL.md` lines 47, 56: tells users to update `metadata.maturity` in frontmatter
- `skill-lifecycle-management/SKILL.md` lines 86-91: deprecation YAML example adds `metadata.maturity`, `metadata.deprecated_by`, `metadata.deprecated_reason`
- `validate-skills.sh` checks field presence but doesn't enforce strict two-field-only

**Confirmed:** Direct contradiction between AGENTS.md contract and lifecycle skill's procedure.

### P0-4: Align skill-creator to live eval stack — VALID ✓ (subset of P0-1)

Covered under P0-1. Specifically: skill-creator Phase 3 has the old `evals.json` format.

### P1-5: Implement real baseline comparison — VALID ✓

**Was it in the plan?** Yes — plan specified "Run `run-evals.sh` against baseline → capture scores" and "Run `run-evals.sh` against modified → capture scores." Implementation fell short.

**What actually shipped:** `run-baseline-comparison.sh` only compares structural scores from `check_skill_structure.py`. It does NOT run `run-evals.sh` against either version. No downstream performance measurement.

### P1-6: Make corpus operational — PARTIALLY VALID

**Was it in the plan?** Yes — plan built the corpus. Review wants more quantity.

**Current state:** 5 weak ✓, 3 strong (review wants 5), 4 adversarial (review wants 5), 0 regression (review wants 3 seeded). Also `README.md` line 9 still says corpus is "coming soon."

**Assessment:** The "coming soon" text is a legitimate miss. The quantity gaps are debatable — 3 strong and 4 adversarial are reasonable for an initial corpus. Seeding 3 regression cases is valid since the system needs something to regression-test against.

### P1-7: Make orchestration self-contained — VALID ✓

**Was it in the plan?** Acknowledged but not resolved. Plan fixed the hardcoded path and skill count but left the external dependency.

**Current state:** `run-meta-skill-cycle.sh` still requires `meta-skill-orchestrator` installed in `~/.copilot/skills/`. This skill is not in the repo.

### P1-8: Resolve evaluation vs benchmarking overlap — VALID ✓

**Was it in the plan?** No.

**What the review found:**
- `skill-evaluation` claims: routing accuracy, output quality, baseline comparison, win rate
- `skill-benchmarking` claims: pass rate, token usage, win rate, A/B and skill-vs-no-skill comparison
- Both claim baseline win rate and downstream comparison

### P2-9: Strengthen behavior evaluation — VALID ✓

**Was it in the plan?** No.

**Current state:** `run-evals.sh` behavior tests check only: min line count, required regex patterns, forbidden regex patterns. No semantic validation, no task completion check, no protocol vs usefulness distinction.

### P2-10: Add real regression harvesting — PARTIALLY VALID

**Was it in the plan?** Yes — `harvest_failures.py` was built. But it's manual-only with no workflow integration.

**Current state:** Script exists with proper JSON template output. Not called automatically from any workflow. No documented procedure in the eval cadence doc for when to run it.

### P2-11: Governance registry model — VALID ✓

**Was it in the plan?** No.

**What the review found:** `skill-catalog-curation/SKILL.md` line 33 expects to audit `name, category, maturity, last-modified date` per skill. But `maturity` has no defined storage location (frontmatter is restricted to name+description, manifests are removed).

### P2-12: Update root README — VALID ✓

**Was it in the plan?** Partially. Plan updated README for inventory/pipelines but missed the "coming soon" language for corpus.

---

## Round 2 Approach

Address all 12 findings in dependency order. Group into 4 workstreams.

---

## Workstream A: Unify the Eval Contract (covers P0-1, P0-4)

### A1. Define canonical eval contract in AGENTS.md

Add an "Eval Suite Structure" section to AGENTS.md specifying:
```
evals/
├── trigger-positive.jsonl   # {prompt, expected:"trigger", category, notes}
├── trigger-negative.jsonl   # {prompt, expected:"no_trigger", category, notes}
├── behavior.jsonl           # {prompt, expected_sections, required_patterns, forbidden_patterns, min_output_lines, notes}
└── README.md                # optional: how to run and extend
```

This matches what `run-evals.sh`, `validate-skills.sh`, and `init_eval_files.py` already use.

### A2. Fix skill-creator SKILL.md

Remove the Phase 3 `evals/evals.json` example with `{id, prompt, should_trigger}`. Replace with delegation to `skill-testing-harness` or direct reference to the canonical JSONL format from AGENTS.md.

### A3. Fix skill-testing-harness SKILL.md

Rename `output-tests.jsonl` references to `behavior.jsonl` throughout the Procedure and Output contract sections. This is the file the runner actually reads.

### A4. Fix skill-evaluation SKILL.md

Remove unsupported YAML format references (`triggers.yaml`, `outputs.yaml`, `baselines.yaml`) from the "Supported formats" list. Keep only the JSONL files the runner supports.

---

## Workstream B: Resolve Conflicts (covers P0-3, P1-8, P2-11)

### B1. Choose lifecycle metadata model

**Decision: Option B — de-scope lifecycle metadata for now.**

Rationale: The internal-only contract says frontmatter = name + description only. Adding a manifest or extra frontmatter fields re-introduces the complexity we just removed. The lifecycle skill should track state externally (git history, a registry index file, or catalog reports) rather than embedding it in frontmatter.

Action:
- Rewrite `skill-lifecycle-management/SKILL.md` to remove references to `metadata.maturity` in frontmatter
- Replace with: lifecycle state inferred from git history (last commit date), or tracked in a `CATALOG.md` / `lifecycle-index.yaml` if the operator wants explicit state
- The deprecation procedure should use a `# Deprecated` notice at the top of SKILL.md or moving to `archive/`, not frontmatter fields

### B2. Align skill-catalog-curation data expectations

`skill-catalog-curation` expects `category, maturity, last-modified date` per skill. After B1:
- `category`: derived from the pipeline the skill belongs to (creation, improvement, governance) — already implicit in README
- `maturity`: if tracked, lives in `lifecycle-index.yaml` or is inferred from git; not in frontmatter
- `last-modified date`: use `git log -1 --format=%ci -- <skill-dir>`

Update the Procedure to reflect where this data actually comes from.

### B3. Resolve skill-evaluation vs skill-benchmarking overlap

**Decision: Narrow skill-benchmarking to variant A/B comparison only.**

- `skill-evaluation` owns: single-skill validation (routing accuracy, output quality, does-it-add-value verdict)
- `skill-benchmarking` owns: multi-variant comparison (A vs B, before vs after, side-by-side metrics table)

Remove baseline/win-rate language from whichever skill doesn't own it. If `skill-evaluation` keeps "baseline comparison" (skill vs no-skill), then `skill-benchmarking` should not claim the same scope — it should only compare two skill variants, not skill vs no-skill.

### B4. Add strict frontmatter enforcement to validate-skills.sh

Currently the validator checks that `name` and `description` exist but doesn't enforce that no other top-level frontmatter fields exist. Add a check that warns on unexpected fields beyond `name` and `description`.

---

## Workstream C: Strengthen Evaluation (covers P0-2, P1-5, P2-9)

### C1. Improve routing measurement in run-evals.sh

The current `grep -qi "$skill"` is acknowledged as weak. The Copilot CLI doesn't expose skill activation metadata directly.

**Approach: Differential testing.**
- For each trigger-positive case: run the prompt once with the skill directory present, once with it temporarily renamed/hidden
- If the outputs differ meaningfully, the skill was activated
- This is slower (2x prompts) but credible
- Add `--fast` flag to keep the current grep proxy for quick checks
- Add `--strict` flag for differential testing

If differential testing is infeasible (CLI caches skill state or requires restart), fall back to:
- Injecting a unique canary string in the skill's output contract (e.g., "Begin output with: [skill-name] activated")
- Checking for that canary in the response

### C2. Make run-baseline-comparison.sh run actual evals

Current implementation only compares structural scores. Extend to:
1. Run `check_skill_structure.py` on both versions (existing — keep)
2. Run `check_preservation.py` on original vs modified (existing — keep)
3. Run `run-evals.sh` on the original skill → capture trigger/behavior scores
4. Run `run-evals.sh` on the modified skill → capture trigger/behavior scores
5. Compare scores: precision delta, recall delta, behavior pass rate delta
6. Apply gates: no metric may decrease

This requires `run-evals.sh` to support JSON output (not just markdown reports). Add a `--json` flag that emits structured results.

### C3. Split behavior evaluation into protocol vs usefulness

Current behavior tests only check output shape (line count, regex patterns). Add a second tier:

**Protocol compliance** (existing, keep):
- Required patterns present
- Forbidden patterns absent
- Minimum output length

**Outcome usefulness** (new, add to behavior.jsonl schema):
- `usefulness_criteria`: free-text description of what "good" looks like
- Evaluated by running the prompt, then asking a second LLM call: "Given this task and this output, rate usefulness 1-5"
- Add `--shallow` flag to skip usefulness checks for quick runs

This is aspirational — implement protocol checks first, add usefulness scoring as an opt-in extension.

---

## Workstream D: Operational Completeness (covers P1-6, P1-7, P2-10, P2-12)

### D1. Fix README.md "coming soon" and corpus description

Remove "coming soon" from README.md line 9. Replace with actual corpus description including tier counts.

### D2. Seed regression corpus

Create at least 3 regression cases in `corpus/regression/` by manually constructing known-failure scenarios:
- A skill that lost its purpose during rewrite
- A skill that had boundaries deleted
- A skill whose references were broken

These serve as the initial regression baseline so `run-regression-suite.sh` has something to test against.

### D3. Expand strong/adversarial corpus (optional)

Add 2 more strong skills and 1 more adversarial skill to reach 5/5/5 if the review requires it. Lower priority — the existing 3/4 are adequate for initial testing.

### D4. Mark orchestration as optional

`run-meta-skill-cycle.sh` depends on an external `meta-skill-orchestrator` skill. Two options:
- **Option A**: Mark it clearly as optional/experimental in the script header and README, exclude from `run-full-cycle.sh`
- **Option B**: Inline the orchestration logic into the script

**Decision: Option A.** The orchestrator is a complex external skill. Inlining it is impractical and would create maintenance burden. Mark it optional and ensure the core eval path (`run-full-cycle.sh`) works without it.

### D5. Integrate failure harvesting into eval cadence

Add `harvest_failures.py` call to `run-full-cycle.sh` after the eval step. When failures are detected, automatically harvest them into `corpus/regression/`. Update `docs/evaluation-cadence.md` to document when harvesting happens.

### D6. Final README/docs refresh

After all other workstream changes, update README.md and AGENTS.md to reflect:
- The canonical eval contract
- The actual corpus state
- The governance model
- The optional orchestration path
- The updated evaluation cadence

---

## Dependency Order

```
Workstream A (Eval contract)
    ↓
Workstream B (Resolve conflicts) ← parallel with A
    ↓
Workstream C (Strengthen evaluation) ← depends on A
    ↓
Workstream D (Operational completeness) ← depends on A, B, C
```

## Round 2 Todo Summary

| ID | Title | Status | Depends On |
|----|-------|--------|------------|
| r2-eval-contract-agents | Add canonical eval contract to AGENTS.md | ✅ Done | — |
| r2-fix-skill-creator-evals | Remove old evals.json format from skill-creator | ✅ Done | r2-eval-contract-agents |
| r2-fix-skill-harness-evals | Rename output-tests.jsonl → behavior.jsonl in skill-testing-harness | ✅ Done | r2-eval-contract-agents |
| r2-fix-skill-evaluation-evals | Remove unsupported YAML formats from skill-evaluation | ✅ Done | r2-eval-contract-agents |
| r2-lifecycle-descope | De-scope metadata.maturity from skill-lifecycle-management | ✅ Done | — |
| r2-catalog-data-model | Align skill-catalog-curation data expectations | ✅ Done | r2-lifecycle-descope |
| r2-eval-bench-overlap | Narrow skill-benchmarking scope, remove overlap with skill-evaluation | ✅ Done | — |
| r2-strict-frontmatter | Add strict frontmatter enforcement to validate-skills.sh | ✅ Done | r2-lifecycle-descope |
| r2-routing-improve | Improve routing measurement in run-evals.sh | ✅ Done | r2-eval-contract-agents |
| r2-baseline-real-evals | Make run-baseline-comparison.sh run actual evals | ✅ Done | r2-routing-improve |
| r2-behavior-split | Split behavior eval into protocol vs usefulness | ✅ Done | r2-eval-contract-agents |
| r2-readme-corpus | Fix README.md "coming soon" and corpus description | ✅ Done | — |
| r2-seed-regression | Seed 3 regression cases in corpus/regression/ | ✅ Done | r2-eval-contract-agents |
| r2-orchestration-optional | Mark run-meta-skill-cycle.sh as optional | ✅ Done | — |
| r2-harvest-integrate | Integrate harvest_failures.py into run-full-cycle.sh | ✅ Done | r2-seed-regression |
| r2-final-docs | Final README/AGENTS.md refresh | ✅ Done | r2-fix-skill-creator-evals, r2-fix-skill-harness-evals, r2-fix-skill-evaluation-evals, r2-lifecycle-descope, r2-eval-bench-overlap |

## Post-Round 2 Additions

Work done after Round 2 completion:

- **LLM-as-Judge usefulness evaluation** (`3d090bc`): Added `--usefulness` flag to `run-evals.sh` with judge function, 4-dimension scoring, per-case rubrics via `usefulness_criteria`, multi-run median voting, 5th gate, seeded criteria in 4 skills.
- **Script distribution model** (`e924c5d`): Created `sync-to-skills.sh` with manifest. Root `scripts/` = source-of-truth dev copies, per-skill `scripts/` = deployed copies. 19 scripts distributed to 8 skills. All 7 relevant SKILL.md procedures updated with concrete script references.
- **Eval-results loop** (`7718929`): Closed the write-only gap. `skill-evaluation` now produces structured Handoff blocks. `skill-improver` reads `eval-results/` in Phase 1 and uses eval-driven diagnosis in Phase 2.
- **Corpus expansion**: Added 2 strong skills (comprehensive-failure-handling, branching-procedure) and 1 adversarial skill (scope-explosion) to reach 5/5/5 parity.
