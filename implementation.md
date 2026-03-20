# Review Validation & Implementation Plan

**Source:** `tasks/reviews/2026-03-20-meta-skill-engineering/1.md` (Annex A: Active Skills Review)
**Validated:** 2026-03-20
**Summary:** 33 raw findings consolidated into 19 unique issues — 17 valid, 1 invalid, 1 already solved. Top risks: stale eval schema (systemic), contract/reality mismatches in 4 skills, script portability (systemic).

---

## F-001 Stale Eval Schema in Testing Harness — **Valid (High)**

**Review claims:** skill-testing-harness teaches `better_skill`, `expected_files`, and `min_cases` fields that are not in the active AGENTS.md eval contract. skill-creator delegates schema to this stale harness.

**Why:** Confirmed. `skill-testing-harness/SKILL.md:83-86` teaches `better_skill` in negative-trigger examples. Lines 109-110 teach `expected_files` and `min_cases` in behavior.jsonl examples. The active contract in `AGENTS.md:45-58` specifies `category` for negatives and `expected_sections`/`min_output_lines` for behavior. The runner (`scripts/run-evals.sh`) has zero references to `expected_files` or `min_cases` — any behavior.jsonl using these fields would be silently ignored.

**Blast radius:** skill-testing-harness, skill-creator (delegated schema), any downstream skill whose eval harness was built using testing-harness guidance.

**Plan:**
1. Replace behavior.jsonl examples in `skill-testing-harness/SKILL.md:109-110` with canonical fields (`expected_sections`, `required_patterns`, `forbidden_patterns`, `min_output_lines`, `notes`).
2. Replace `min_cases` guidance at `skill-testing-harness/SKILL.md:105` with `min_output_lines`.
3. Replace `better_skill` in negative-trigger examples at lines 83-86 with `category` values (`anti-match|adjacent|out-of-scope`). Alternatively — see F-002 for contract decision.
4. Update field schema summary at line 140.
5. Run `mse_validate_skill skill-testing-harness` + `mse_lint_skill`.

**Risks:** Changing the taught schema means any agent that has already learned the old schema from this skill will produce stale harnesses. Rollback: `git checkout skill-testing-harness/SKILL.md`.
**Effort:** S (1–2 hours)

**Citations:** `skill-testing-harness/SKILL.md:83-86,93,105,109-110,140`; `AGENTS.md:45-58`; `scripts/run-evals.sh` (zero matches for `expected_files`, `min_cases`)

---

## F-002 trigger-negative.jsonl Contract Mismatch (Systemic) — **Valid (High)**

**Review claims:** testing-harness teaches `better_skill` in negative triggers. AGENTS.md says `category`.

**Why:** Confirmed — and the gap is far wider than the review states. ALL 12 skills use `better_skill` in their trigger-negative.jsonl files. ZERO use `category`. The runner at `scripts/run-evals.sh:393` handles both via `jq -r '.category // .better_skill // "unknown"'`, but the contract in `AGENTS.md:50-53` only documents `category`. This is a systemic documentation-reality mismatch affecting every skill.

**Blast radius:** All 12 skill packages, AGENTS.md, .github/copilot-instructions.md, skill-testing-harness.

**Plan:**
1. Decide: either (a) update all 12 trigger-negative.jsonl files to use `category` per the contract, or (b) update AGENTS.md and copilot-instructions.md to document `better_skill` as the field for negative triggers (since it has distinct semantic meaning — naming a redirect target, not just a classification).
2. Option (b) recommended: `better_skill` is more informative than generic `category` values. Update AGENTS.md:50-53 and copilot-instructions.md:28 to show: `{"prompt": "...", "expected": "no_trigger", "better_skill": "skill-name|null", "notes": "..."}`.
3. Update skill-testing-harness/SKILL.md examples to match chosen format.
4. If option (a): update all 96 trigger-negative entries (12 files × 8 entries) to replace `better_skill` with `category`.

**Risks:** Option (a) loses redirect-target semantics. Option (b) is a contract change. Rollback: git revert.
**Effort:** S for option (b), M for option (a) (1–3 hours)

**Citations:** `AGENTS.md:50-53`; `.github/copilot-instructions.md:28`; `scripts/run-evals.sh:393`; all 12 `*/evals/trigger-negative.jsonl` files (grep: 96 total `better_skill` entries, 0 `category` entries)

---

## F-003 Per-Skill run-evals.sh Not Portable — **Valid (Medium)**

**Review claims:** Bundled run-evals.sh copies expect repo-root paths; running from skill directory fails.

**Why:** Confirmed. All per-skill copies compute `REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"` (line 53). From `skill-creator/scripts/`, this resolves to `skill-creator/`, not the repo root. Line 798 then calls `python3 "${REPO_ROOT}/scripts/check_skill_structure.py"` which would look for `skill-creator/scripts/check_skill_structure.py` — a path that doesn't exist. Line 795 constructs `"${REPO_ROOT}/${skill}/SKILL.md"` which would be wrong.

**Blast radius:** All 8 skills with bundled `scripts/run-evals.sh` copies (skill-creator, skill-testing-harness, skill-evaluation, skill-trigger-optimization, skill-improver, skill-anti-patterns, skill-safety-review, skill-benchmarking).

**Plan:**
1. Add repo-root auto-detection to `scripts/run-evals.sh` (dev copy): walk up from `$0` looking for `.git/` or `AGENTS.md` marker.
2. Re-sync via `scripts/sync-to-skills.sh` to distribute fix to all 8 skill copies.
3. Test: run `skill-creator/scripts/run-evals.sh skill-creator` from within the skill directory.

**Risks:** Auto-detection could mis-fire if the skill package is installed in a non-git context. Rollback: `git checkout scripts/run-evals.sh && ./scripts/sync-to-skills.sh`.
**Effort:** S (1–2 hours)

**Citations:** `skill-creator/scripts/run-evals.sh:53-54,795,798,881`; `skill-testing-harness/scripts/run-evals.sh:53-54`

---

## F-004 Per-Skill run-baseline-comparison.sh Not Portable — **Valid (Medium)**

**Review claims:** Packaged baseline-comparison script expects repo-root helpers.

**Why:** Confirmed. `skill-benchmarking/scripts/run-baseline-comparison.sh:18-19` uses same `REPO_ROOT` pattern. Line 79 looks for `${REPO_ROOT}/scripts/run-evals.sh`. Line 130 constructs `${REPO_ROOT}/${skill_name}`. Same issue as F-003.

**Blast radius:** skill-benchmarking, skill-improver (both have bundled copies).

**Plan:**
1. Apply same repo-root auto-detection fix as F-003 to `scripts/run-baseline-comparison.sh`.
2. Re-sync via `scripts/sync-to-skills.sh`.

**Risks:** Same as F-003.
**Effort:** S (< 1 hour, same pattern as F-003)

**Citations:** `skill-benchmarking/scripts/run-baseline-comparison.sh:18-19,69-79,130,136`; `skill-improver/scripts/run-baseline-comparison.sh:18-19`

---

## F-005 Per-Skill validate-skills.sh Scopes to Wrong Root — **Valid (Medium)**

**Review claims:** validate-skills.sh when run from skill-safety-review discovers only local children.

**Why:** Confirmed. `skill-safety-review/scripts/validate-skills.sh:12` uses `REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"`. From the skill package, this resolves to `skill-safety-review/`, then line 22 iterates `"$REPO_ROOT"/*/` looking for SKILL.md — finding zero skills since `skill-safety-review/` has no nested skill dirs.

**Blast radius:** skill-safety-review.

**Plan:**
1. Apply same repo-root fix as F-003 to `scripts/validate-skills.sh`.
2. Re-sync.

**Risks:** Same as F-003.
**Effort:** XS (< 30 min, same pattern)

**Citations:** `skill-safety-review/scripts/validate-skills.sh:12,21-24`

---

## F-006 Behavior.jsonl Suites Under-Check Output Contracts (Systemic) — **Valid (Medium)**

**Review claims:** Behavior tests across all 12 skills don't fully verify the output structures their SKILL.md promises.

**Why:** Confirmed across all 12 skills. Detailed gap analysis:

| Skill | Alignment | Critical gap |
|-------|-----------|-------------|
| skill-creator | Good | Doesn't verify full package artifacts (evals/, scripts/) |
| skill-testing-harness | Partial | Missing case count validation (8–15), README.md |
| skill-evaluation | Partial | **Missing mandatory Handoff section test** |
| skill-trigger-optimization | Good | Minor: missing checklist format |
| skill-improver | Partial | Missing Changes table format, eval prompt count |
| skill-anti-patterns | Good | Minor: missing table format |
| skill-safety-review | Good | Minor: missing verdict enum |
| skill-benchmarking | Good | Missing Significance section |
| skill-catalog-curation | **Poor** | Tests only ~50% of required 6-section report |
| skill-lifecycle-management | Partial | Missing table formats, deprecation structure |
| skill-adaptation | Partial | Missing Changes table, Invariants section |
| skill-variant-splitting | Partial | Missing Coverage Map, Migration decision |

**Blast radius:** All 12 skills — behavior tests can pass while output contracts are violated.

**Plan:**
1. Prioritize worst gaps: skill-catalog-curation, skill-evaluation, skill-lifecycle-management.
2. For each, add 1–2 new behavior.jsonl entries with `required_patterns` and `expected_sections` matching the SKILL.md output contract sections that are currently untested.
3. Add `usefulness_criteria` to the 8 skills that lack it (only skill-creator, skill-evaluation, skill-improver, skill-trigger-optimization have it).
4. Run `./scripts/run-evals.sh --dry-run <skill>` for each to validate JSONL is parseable.

**Risks:** New behavior tests may fail against current skill behavior, revealing latent output gaps. This is the intended outcome. Rollback: remove added entries.
**Effort:** M (3–5 hours for all 12 skills)

**Citations:** All 12 `*/evals/behavior.jsonl` files; all 12 `*/SKILL.md` output contract sections

---

## F-007 skill-evaluation Output Contract vs Runner Mismatch — **Valid (High)**

**Review claims:** skill-evaluation promises Handoff and Baseline Comparison sections that run-evals.sh doesn't emit.

**Why:** Confirmed. `skill-evaluation/SKILL.md:132-141` documents a mandatory Handoff section with `eval_report_path`, `primary_failure`, `failing_cases`, and `recommended_next_skill`. `scripts/run-evals.sh` emits: Positive/Negative trigger tests, Behavior tests, optional Usefulness evaluation, Gates, Verdict, JSON summary — but NO Handoff section. Baseline Comparison lives in a separate `scripts/run-baseline-comparison.sh` with a different output format. The downstream consumer `skill-improver/SKILL.md:120-147` depends on this missing handoff data.

**Blast radius:** skill-evaluation, skill-improver (broken improvement loop), AGENTS.md pipeline documentation.

**Plan:**
1. Add a `--handoff` flag to `scripts/run-evals.sh` that appends a structured Handoff section to the report output, computing `primary_failure` from gate results and `recommended_next_skill` from failure type.
2. Update `skill-evaluation/SKILL.md` to clarify that Baseline Comparison requires running `run-baseline-comparison.sh` separately (or add `--baseline` flag to runner).
3. Update `skill-improver/SKILL.md:120-147` to document both paths: eval-report-with-handoff (automated) and manual eval reading.
4. Sync updated scripts.

**Risks:** Adding Handoff section may break consumers that parse runner output. Rollback: remove `--handoff` flag.
**Effort:** M (2–4 hours)

**Citations:** `skill-evaluation/SKILL.md:109-158`; `scripts/run-evals.sh:760-863,938-949`; `scripts/run-baseline-comparison.sh:243-348`; `skill-improver/SKILL.md:120-147`

---

## F-008 skill-improver References Banned Manifests/Metadata — **Valid (High)**

**Review claims:** skill-improver assumes manifests and metadata artifacts that the repo contract bans.

**Why:** Confirmed. `skill-improver/SKILL.md` references manifests at 6 locations: line 20 ("manifests exist where they help"), line 32 ("needs manifest"), line 105 ("improved SKILL.md, manifest"), line 165 ("add manifest/changelog/ownership metadata" in diagnostic table), line 178 ("Decide whether...manifest are warranted"), line 198 ("Add manifest/packaging when the skill is meant to persist or be shared"). The active contract in `AGENTS.md:67-78` and `.github/copilot-instructions.md:58-62` explicitly states "Do not create manifest.yaml — it is a stale distribution artifact."

Additionally, `skill-improver/evals/behavior.jsonl` line 3 has `"required_patterns": ["references/", "evals/", "manifest"]` — testing for manifest content in output.

**Blast radius:** skill-improver SKILL.md + behavior.jsonl.

**Plan:**
1. Remove manifest references from `skill-improver/SKILL.md` at lines 20, 32, 105, 165, 178, 198. Replace with repo-appropriate alternatives (changelog, ownership can go in README or SKILL.md frontmatter isn't needed).
2. Update `skill-improver/evals/behavior.jsonl` line 3: change `"manifest"` in `required_patterns` to something appropriate like `"scripts/"` or remove it.
3. Run `mse_validate_skill skill-improver` + `mse_check_preservation`.

**Risks:** May affect Mode 3 "Package upgrade" behavior. Rollback: `git checkout skill-improver/`.
**Effort:** S (1–2 hours)

**Citations:** `skill-improver/SKILL.md:20,32,105,165,178,198`; `skill-improver/evals/behavior.jsonl:3`; `AGENTS.md:67-78`; `.github/copilot-instructions.md:58-62`

---

## F-009 skill-catalog-curation Depends on Nonexistent Metadata Model — **Valid (High)**

**Review claims:** The skill asks for maturity counts, catalog consistency, tags, and catalog entry updates, but no such state exists.

**Why:** Confirmed. `skill-catalog-curation/SKILL.md:5` mentions "metadata, tags, and naming conventions". Line 75 requires "By maturity: draft: N, stable: N, deprecated: N" — but no maturity state is stored anywhere in the repo. Line 33 says "List every skill: name, category (inferred from pipeline membership), last-modified date" — categories are inferred but not stored. The repo has no catalog index file, no maturity metadata, no tag system.

**Blast radius:** skill-catalog-curation (its output contract is partly unexecutable).

**Plan:**
1. Rewrite `skill-catalog-curation/SKILL.md` output contract (lines 71-105) to use only information that actually exists: skill count, directory listing, description analysis, cross-reference analysis. Remove maturity counts (or replace with "inferred from commit history").
2. Update description (lines 4-6) to remove "metadata, tags" and focus on what the repo actually stores.
3. Adjust procedure (line 33) to remove non-existent fields.
4. Update behavior.jsonl to match revised contract.

**Risks:** Reduces skill scope. Consider whether a catalog index SHOULD be created (separate decision). Rollback: `git checkout skill-catalog-curation/`.
**Effort:** M (2–3 hours)

**Citations:** `skill-catalog-curation/SKILL.md:4-6,33,71-105,128`; `AGENTS.md:67-78,109-118`

---

## F-010 skill-lifecycle-management Depends on Nonexistent Lifecycle Artifacts — **Valid (High)**

**Review claims:** The skill tells users to record transitions in a lifecycle index that doesn't exist.

**Why:** Confirmed. `skill-lifecycle-management/SKILL.md:47-58` describes lifecycle states (draft → beta → stable → deprecated → retired) with transition criteria. Lines 107-111 tell users to "update lifecycle index" and "update catalog entries". No such index or catalog exists in the repo. There is no `lifecycle-index.md`, no `catalog.yaml`, no structured state tracking mechanism anywhere.

**Blast radius:** skill-lifecycle-management (central state-management step has no target).

**Plan:**
1. Decide: either (a) create a minimal lifecycle tracking mechanism (e.g., add an optional `status` field to SKILL.md frontmatter, or a top-level `CATALOG.md`), or (b) rewrite the skill to work without persistent state (audit git history, infer status from archive/ presence, etc.).
2. Option (b) recommended for consistency with current minimal-metadata approach: rewrite lines 47-58 to use implicit signals (git history, archive presence, README references) instead of explicit lifecycle index.
3. Remove references to nonexistent "lifecycle index" and "catalog entries" at lines 107-111, 165-170.
4. Update behavior.jsonl to match revised contract.

**Risks:** Option (b) reduces operational precision. Rollback: `git checkout skill-lifecycle-management/`.
**Effort:** M (2–3 hours)

**Citations:** `skill-lifecycle-management/SKILL.md:47-58,107-111,165-170`; `AGENTS.md:67-78,109-118`

---

## F-011 skill-lifecycle-management ARCHIVE/ Path Bug — **Valid (Critical)**

**Review claims:** Procedure uses uppercase `ARCHIVE/` but the actual directory is lowercase `archive/`.

**Why:** Confirmed. `skill-lifecycle-management/SKILL.md:98` says "move skill-name/ to ARCHIVE/skill-name/". Line 102: `mkdir -p ARCHIVE`. Line 103: `mv skill-name/ ARCHIVE/skill-name/`. The actual directory on disk is `archive/` (lowercase), confirmed by `ls -la`. On case-sensitive Linux filesystems, following this procedure would create a new `ARCHIVE/` directory alongside the existing `archive/`, splitting archived skills across two directories.

**Blast radius:** skill-lifecycle-management (archive/retirement procedure is broken).

**Plan:**
1. Replace `ARCHIVE` with `archive` at `skill-lifecycle-management/SKILL.md:98,102,103`.
2. Search for any other uppercase references: `grep -rn 'ARCHIVE' skill-lifecycle-management/`.

**Risks:** None — pure typo fix. Rollback: `git checkout skill-lifecycle-management/SKILL.md`.
**Effort:** XS (< 15 min)

**Citations:** `skill-lifecycle-management/SKILL.md:98,102,103`; `ls -la` confirms `archive/` (lowercase)

---

## F-012 skill-benchmarking Promises Metrics Tooling Can't Deliver — **Valid (High)**

**Review claims:** The skill promises token usage and blind win-rate comparison that current scripts don't support.

**Why:** Confirmed. `skill-benchmarking/SKILL.md:46-57` lists four metrics: pass rate, token usage, routing accuracy, win rate. The output contract (lines 78-104) promises a summary table with "Avg Tokens" and "Win Rate" columns. However, `scripts/run-evals.sh` does not track or report token usage — zero references to "token" in its output logic. Win rate exists only in the usefulness evaluation (LLM-as-Judge), not as a head-to-head A/B comparison. `scripts/run-baseline-comparison.sh` outputs structural gates, not the metrics table the skill promises.

**Blast radius:** skill-benchmarking (advertised benchmark report can't be produced).

**Plan:**
1. Option (a): Reduce skill-benchmarking's promised metrics to what tooling can deliver (pass rate, structural comparison, optional usefulness score). Remove token usage and redefine win rate.
2. Option (b): Add token tracking to `scripts/run-evals.sh` (Copilot CLI doesn't expose token counts natively — would need wrapper or API-level integration).
3. Option (a) recommended: update SKILL.md lines 46-57 and 78-104 to reflect achievable metrics.
4. Update behavior.jsonl to match revised contract.

**Risks:** Option (a) reduces benchmarking precision. Rollback: `git checkout skill-benchmarking/`.
**Effort:** S for option (a) (1–2 hours), L for option (b) (8+ hours)

**Citations:** `skill-benchmarking/SKILL.md:4-7,46-57,78-104`; `scripts/run-evals.sh` (zero "token" references in output); `scripts/run-baseline-comparison.sh:243-348`

---

## F-013 skill_lint.py Invocation Documented Wrong — **Valid (Medium)**

**Review claims:** Two skills document `python3 scripts/skill_lint.py <skill-dir>/SKILL.md` but the script expects a directory.

**Why:** Confirmed. `scripts/skill_lint.py:27` defines argument as `skill_dir` with help "Path to the skill directory". Line 30: `root = Path(args.skill_dir)`. Line 31: `skill_md = root / "SKILL.md"`. The extension at `.github/extensions/meta-skill-tools/extension.mjs:82-86` correctly extracts the directory with `dirname()`. But `skill-anti-patterns/SKILL.md:39` and `skill-safety-review/SKILL.md:70` both show `skill_lint.py <skill-dir>/SKILL.md` — passing a file path when a directory is expected.

**Blast radius:** skill-anti-patterns, skill-safety-review (documented baseline commands fail).

**Plan:**
1. Fix `skill-anti-patterns/SKILL.md:39`: change `scripts/skill_lint.py <skill-dir>/SKILL.md` to `scripts/skill_lint.py <skill-dir>`.
2. Fix `skill-safety-review/SKILL.md:70`: same change.
3. Check if any other skills have the same wrong invocation.

**Risks:** None. Rollback: `git checkout`.
**Effort:** XS (< 15 min)

**Citations:** `scripts/skill_lint.py:27,30-31`; `skill-anti-patterns/SKILL.md:39`; `skill-safety-review/SKILL.md:70`; `.github/extensions/meta-skill-tools/extension.mjs:82-86`

---

## F-014 Archived Skill References in trigger-negative.jsonl — **Valid (Low)**

**Review claims:** Evals reference archived skills (skill-packaging, skill-provenance) as `better_skill` targets.

**Why:** Confirmed. Five trigger-negative entries reference archived skills:
- `skill-packaging`: skill-adaptation:6, skill-catalog-curation:4, skill-creator:8, skill-lifecycle-management:4
- `skill-provenance`: skill-safety-review:4
- `skill-installer`: skill-catalog-curation:5

All three exist in `archive/` but not in the active inventory. The runner doesn't validate `better_skill` targets, so these don't break execution — but they're misleading boundary documentation.

**Blast radius:** 5 trigger-negative.jsonl files (6 entries total).

**Plan:**
1. Replace `"better_skill": "skill-packaging"` with `null` (no active equivalent exists).
2. Replace `"better_skill": "skill-provenance"` with `null`.
3. Replace `"better_skill": "skill-installer"` with `null`.
4. Add `"notes"` clarification where helpful.

**Risks:** None. Rollback: git checkout individual files.
**Effort:** XS (< 15 min)

**Citations:** `skill-adaptation/evals/trigger-negative.jsonl:6`; `skill-catalog-curation/evals/trigger-negative.jsonl:4,5`; `skill-creator/evals/trigger-negative.jsonl:8`; `skill-lifecycle-management/evals/trigger-negative.jsonl:4`; `skill-safety-review/evals/trigger-negative.jsonl:4`; `archive/README.md`

---

## F-015 run-trigger-optimization.sh Temporarily Mutates SKILL.md — **Valid (Medium)**

**Review claims:** Script says "does NOT auto-apply changes" but temporarily overwrites SKILL.md during execution.

**Why:** Partially valid. The script does temporarily modify `SKILL.md` (lines 377-409: backup → patch → evaluate → restore at lines 470-535). However, it always restores the original and outputs the proposed changes for manual review. The "no auto-apply" claim at lines 21-22 refers to the final state — the original is always restored. The finding is valid in that the working tree IS mutated during execution, which could cause issues if the script is interrupted (Ctrl+C between patch and restore).

**Blast radius:** skill-trigger-optimization, any concurrent git operations during script execution.

**Plan:**
1. Add a `trap` handler in `scripts/run-trigger-optimization.sh` to restore backup on EXIT/INT/TERM signals.
2. Update lines 21-22 comment to clarify: "The script temporarily patches SKILL.md during evaluation but always restores the original. Final application is manual."
3. Re-sync to skill-trigger-optimization/scripts/.

**Risks:** Trap handler adds minor complexity. Rollback: `git checkout scripts/run-trigger-optimization.sh`.
**Effort:** S (< 1 hour)

**Citations:** `scripts/run-trigger-optimization.sh:21-22,377-409,470-535`

---

## F-016 skill-anti-patterns AP-14 Recommends Frontmatter Tool Dependencies — **Invalid**

**Review claims:** AP-14 treats frontmatter/tool-dependency metadata as a current concept.

**Why:** Invalid. Re-reading `skill-anti-patterns/SKILL.md:123-127`, AP-14 addresses **capability assumptions** — procedures that assume tools the agent may not have. The "Fix" line says "Declare tool dependencies in frontmatter. Add fallback paths for optional capabilities." This is about adding fallback paths, not about adding metadata fields. The frontmatter mention is a minor wording issue, not a stale metadata concept. The anti-pattern itself (capability assumptions without fallbacks) is valid and useful.

**Plan:** No implementation needed. Optionally reword "Declare tool dependencies in frontmatter" to "Document tool requirements at the top of Procedure" to avoid confusion with the two-field-only rule.

**Citations:** `skill-anti-patterns/SKILL.md:123-127`

---

## F-017 skill-adaptation Under-Specifies Support Layer Adaptation — **Valid (Medium)**

**Review claims:** Procedure centers SKILL.md rewriting but under-specifies how to adapt scripts/, references/, evals/.

**Why:** Confirmed. `skill-adaptation/SKILL.md:65-81` focuses almost entirely on SKILL.md content adaptation (description, procedure, references, triggers). Support layers are mentioned briefly at line 84-106 in the output contract ("Adaptation summary" with Changes table), but the procedure has no explicit steps for adapting scripts, evals, or references to the target context. An adapted skill with stale support layers would look correct at the SKILL.md level but fail when scripts or evals are executed.

**Blast radius:** skill-adaptation (incomplete adaptation outputs).

**Plan:**
1. Add a new procedure step (e.g., Step 5.5 or expand Step 5) to `skill-adaptation/SKILL.md` covering support layer review: "For each file in scripts/, evals/, references/, check whether paths, tool references, or domain examples need target-context updates."
2. Add support layer items to the output contract's Changes table.
3. Add one behavior.jsonl entry testing support layer adaptation.

**Risks:** Increases procedure length. Rollback: `git checkout skill-adaptation/`.
**Effort:** S (1–2 hours)

**Citations:** `skill-adaptation/SKILL.md:65-81,84-106`; `AGENTS.md:15-17`

---

## F-018 skill-variant-splitting Output Stops at Report — **Valid (Medium)**

**Review claims:** Output contract only requires a planning artifact, not actual variant package drafts.

**Why:** Confirmed. `skill-variant-splitting/SKILL.md:65-69` says "write each variant" but the output contract (lines 84-110) only requires a markdown report (Split Axis, Variants table, Shared Core, Coverage Map, Migration recommendation). No actual SKILL.md files for the variants are required in the deliverable. The skill is an analysis/planning tool, not a creation tool — but the procedure language implies more than the output requires.

**Blast radius:** skill-variant-splitting (scope confusion between analysis and execution).

**Plan:**
1. Clarify in `skill-variant-splitting/SKILL.md` whether the skill produces (a) a split plan only, or (b) plan + draft variant packages.
2. If (a): adjust procedure language at lines 65-69 to say "document each variant" instead of "write each variant". Add explicit handoff to skill-creator for actual package creation.
3. If (b): add variant SKILL.md files to the output contract.
4. Update behavior.jsonl to match chosen scope.

**Risks:** Choosing (a) reduces scope; choosing (b) increases complexity significantly. Rollback: `git checkout skill-variant-splitting/`.
**Effort:** S for (a), M for (b) (1–3 hours)

**Citations:** `skill-variant-splitting/SKILL.md:65-69,84-110`

---

## F-019 quick_validate.py Allows Stale Frontmatter Fields — **Valid (High)**

**Review claims (from prior review X-1):** `scripts/quick_validate.py` line 42 allows `license`, `allowed-tools`, `metadata`, `compatibility` in frontmatter, contradicting the two-field-only rule.

**Why:** Confirmed. `scripts/quick_validate.py:42` has `ALLOWED_PROPERTIES = {'name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'}`. Lines 86-88 even validate the `compatibility` field specifically. Every other validation tool (`check_skill_structure.py`, `validate-skills.sh`, AGENTS.md, copilot-instructions.md) enforces name+description only. This script is stale and contradictory.

**Blast radius:** Anyone using quick_validate.py would get false passes for skills with extra frontmatter fields.

**Plan:**
1. Update `scripts/quick_validate.py:42` to `ALLOWED_PROPERTIES = {'name', 'description'}`.
2. Remove lines 86-88 (compatibility validation).
3. Remove line 44 comment about metadata nested keys.
4. Alternatively: remove the script entirely if `check_skill_structure.py` fully supersedes it.

**Risks:** None — aligns with all other tools. Rollback: `git checkout scripts/quick_validate.py`.
**Effort:** XS (< 15 min)

**Citations:** `scripts/quick_validate.py:42,44,86-88`; `scripts/check_skill_structure.py:9-26`; `AGENTS.md:67-78`

---

## Priority Summary

| Priority | ID | Title | Effort |
|----------|----|-------|--------|
| P0 Critical | F-011 | ARCHIVE/ path bug | XS |
| P0 Critical | F-019 | quick_validate.py stale frontmatter | XS |
| P1 High | F-001 | Stale eval schema in testing-harness | S |
| P1 High | F-002 | trigger-negative contract mismatch (systemic) | S–M |
| P1 High | F-007 | skill-evaluation output contract vs runner | M |
| P1 High | F-008 | skill-improver manifest references | S |
| P1 High | F-009 | skill-catalog-curation nonexistent metadata model | M |
| P1 High | F-010 | skill-lifecycle-management nonexistent artifacts | M |
| P1 High | F-012 | skill-benchmarking undeliverable metrics | S |
| P2 Medium | F-003 | Per-skill run-evals.sh portability | S |
| P2 Medium | F-004 | Per-skill run-baseline-comparison.sh portability | S |
| P2 Medium | F-005 | Per-skill validate-skills.sh scoping | XS |
| P2 Medium | F-006 | Behavior.jsonl under-checks (systemic) | M |
| P2 Medium | F-013 | skill_lint.py invocation wrong | XS |
| P2 Medium | F-015 | Trigger optimization script mutation safety | S |
| P2 Medium | F-017 | skill-adaptation support layer gap | S |
| P2 Medium | F-018 | skill-variant-splitting scope confusion | S |
| P3 Low | F-014 | Archived skill references in evals | XS |
| N/A | F-016 | AP-14 metadata (invalid) | — |

**Recommended execution order:**
1. Quick wins first: F-011, F-019, F-013, F-014 (all XS, < 1 hour total)
2. Schema alignment: F-001, F-002 (contract decision needed first)
3. Contract fixes: F-008, F-012, F-009, F-010 (skill-by-skill SKILL.md updates)
4. Runner improvements: F-007, F-015 (script changes)
5. Portability: F-003, F-004, F-005 (shared pattern, batch together)
6. Eval depth: F-006 (largest effort, do last)
7. Scope clarifications: F-017, F-018 (lower priority)

---

## Open Questions

1. **F-002 decision:** Should the trigger-negative contract adopt `better_skill` (matching all 96 existing entries) or should all files be migrated to `category`? Recommendation: adopt `better_skill`.
2. **F-010 decision:** Should the repo create a lifecycle tracking mechanism, or should skill-lifecycle-management work without persistent state? Recommendation: work without persistent state.
3. **F-018 decision:** Should skill-variant-splitting produce draft packages or only a split plan? Recommendation: split plan only, with explicit handoff to skill-creator.
