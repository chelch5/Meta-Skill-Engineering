# Review Validation & Implementation Plan

> **Re-verified:** 2026-03-20T09:40Z. All 47 findings (F-001–F-047) re-verified against the live codebase with exact line-number and content confirmation. Every citation was checked; all remain accurate. Nuances discovered during re-verification are noted inline with `⚠️ VERIFICATION NOTE` markers. Enhanced implementation instructions added with exact old→new text, dependency chains, and test commands.

---

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

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. Lines 109-110 still contain `expected_files` and `min_cases`. `scripts/run-evals.sh` still has zero references to either field. `run-evals.sh:547-578` (behavior check logic) only reads `expected_sections`, `required_patterns`, `forbidden_patterns`, `min_output_lines`. Any behavior.jsonl entry using the stale fields is silently ignored — no warning, no error.

**Exact changes required:**
```
# Line 109 — Replace this:
{"prompt": "Create trigger tests for skill-authoring", "expected_files": ["evals/trigger-positive.jsonl", "evals/trigger-negative.jsonl"], "required_patterns": ["\"expected\": \"trigger\"", "\"expected\": \"no_trigger\""], "forbidden_patterns": ["TODO", "placeholder", "consider adding"], "min_cases": 5}

# With this:
{"prompt": "Create trigger tests for skill-authoring", "expected_sections": ["trigger-positive", "trigger-negative"], "required_patterns": ["\"expected\": \"trigger\"", "\"expected\": \"no_trigger\""], "forbidden_patterns": ["TODO", "placeholder", "consider adding"], "min_output_lines": 15, "notes": "Must produce both positive and negative trigger files"}

# Line 110 — Replace this:
{"prompt": "Build a full test harness for the pdf-extraction skill", "expected_files": ["evals/trigger-positive.jsonl", "evals/trigger-negative.jsonl", "evals/behavior.jsonl", "evals/README.md"], "required_patterns": ["\"category\""], "forbidden_patterns": ["may want to", "could potentially"], "min_cases": 8}

# With this:
{"prompt": "Build a full test harness for the pdf-extraction skill", "expected_sections": ["trigger-positive", "trigger-negative", "behavior"], "required_patterns": ["\"category\"", "\"expected_sections\""], "forbidden_patterns": ["may want to", "could potentially"], "min_output_lines": 20, "notes": "Full harness must include all three eval files plus README"}
```

**Dependency:** Blocked on F-002 decision (whether negative-trigger examples at lines 83-86 should use `category` or `better_skill`).

**Risks:** Changing the taught schema means any agent that has already learned the old schema from this skill will produce stale harnesses. Rollback: `git checkout skill-testing-harness/SKILL.md`.
**Effort:** S (1–2 hours)

**Citations:** `skill-testing-harness/SKILL.md:83-86,93,105,109-110,140`; `AGENTS.md:45-58`; `scripts/run-evals.sh` (zero matches for `expected_files`, `min_cases`); `scripts/run-evals.sh:547-578` (behavior check logic)

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

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified counts: ALL 12 skills × 8 entries = 96 total `better_skill` occurrences, 0 `category` occurrences. The fallback at `run-evals.sh:393` (`jq -r '.category // .better_skill // "unknown"'`) means the runner works regardless of which field is used, but the documentation is authoritative and says `category`.

**Exact changes for Option (b) — recommended:**
```
# AGENTS.md:50-53 — Replace this:
{"prompt": "...", "expected": "no_trigger", "category": "anti-match|adjacent|out-of-scope", "notes": "..."}

# With this:
{"prompt": "...", "expected": "no_trigger", "better_skill": "skill-name-or-null", "notes": "..."}

# .github/copilot-instructions.md:28 — Make same change

# Also update run-evals.sh:393 — flip fallback order for clarity:
# From: jq -r '.category // .better_skill // "unknown"'
# To:   jq -r '.better_skill // .category // "unknown"'
```

**Exact changes for Option (a) — if chosen instead:**
For each of the 12 `*/evals/trigger-negative.jsonl` files, in every entry:
```
# Replace: "better_skill": "skill-name"
# With:    "category": "adjacent"  (when referring to a specific skill)
# Or:      "category": "out-of-scope"  (when better_skill was null)
# Or:      "category": "anti-match"  (when prompt mirrors a "When NOT to use" bullet)
```

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

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. Root copy and all 8 per-skill copies use identical `REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"` at line 53. From `skill-creator/scripts/`, this resolves to `skill-creator/` which then breaks line 54 (`RESULTS_DIR="${REPO_ROOT}/eval-results"`), line 795 (`"${REPO_ROOT}/${skill}/SKILL.md"`), and line 798 (`python3 "${REPO_ROOT}/scripts/check_skill_structure.py"`).

**Exact change — Replace line 53 in `scripts/run-evals.sh`:**
```bash
# OLD (line 53):
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# NEW (line 53-59):
# Auto-detect repo root: walk up from script location looking for AGENTS.md
_script_dir="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$_script_dir"
while [[ "$REPO_ROOT" != "/" ]]; do
  [[ -f "$REPO_ROOT/AGENTS.md" ]] && break
  REPO_ROOT="$(dirname "$REPO_ROOT")"
done
[[ ! -f "$REPO_ROOT/AGENTS.md" ]] && { echo "Error: cannot find repo root (no AGENTS.md found)"; exit 1; }
```

**After applying:**
1. Run `./scripts/sync-to-skills.sh` to distribute to all 8 per-skill copies
2. Test from skill dir: `cd skill-creator && bash scripts/run-evals.sh --dry-run skill-creator`
3. Test from repo root: `bash scripts/run-evals.sh --dry-run skill-creator`

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

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. Handoff is triply orphaned: (1) `skill-evaluation/SKILL.md:132-141` promises it, (2) `run-evals.sh` has zero references to "Handoff", (3) `skill-improver/SKILL.md:120-127` reads eval results but parses generic gate pass/fail data, not the structured Handoff fields. The Handoff format is well-designed but completely unimplemented. Resolution should either add `--handoff` to the runner or acknowledge that skill-improver reads raw eval reports directly.

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

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified all 6 locations. Important nuance: `AGENTS.md` itself uses "manifest" in 3 places (lines 27, 31, 133) — but there it refers to the **sync-to-skills.sh internal mapping** (which scripts go to which skills), NOT to per-skill `manifest.yaml` files. The ban at `AGENTS.md:67` (`"Do not create manifest.yaml in skill packages"`) is specifically about skill-level distribution manifests. skill-improver's references at lines 20, 32, 105, 165, 178, 198 all treat "manifest" as a per-skill packaging artifact, which IS what's banned. The distinction matters for the fix: don't remove all references to "manifest" — remove references to per-skill manifest.yaml as a deliverable.

**Blast radius:** skill-improver SKILL.md + behavior.jsonl + references/.

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

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. Lines 98, 102, 103 still contain uppercase `ARCHIVE`. `ls -la` confirms the directory is `archive/` (lowercase).

**Exact changes required:**
```
# Line 98 — Replace:
About to move skill-name/ to ARCHIVE/skill-name/. Proceed? [y/N]
# With:
About to move skill-name/ to archive/skill-name/. Proceed? [y/N]

# Line 102 — Replace:
mkdir -p ARCHIVE
# With:
mkdir -p archive

# Line 103 — Replace:
mv skill-name/ ARCHIVE/skill-name/
# With:
mv skill-name/ archive/skill-name/
```

**Test:** `grep -rn 'ARCHIVE' skill-lifecycle-management/` should return zero results after fix.

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

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. The situation is **worse** than originally assessed. There IS a trap at line 92 (`trap 'rm -rf "$TMPDIR"' EXIT`), but it only cleans the temp directory — which contains the SKILL.md backup. An interrupted run between line 404 (patch) and line 471 (restore) would: (1) leave SKILL.md in its patched state, AND (2) delete the backup via the trap. The only recovery would be `git checkout`. See enhanced plan below.

**Blast radius:** skill-trigger-optimization, any concurrent git operations during script execution.

**Plan:**
1. Add a `trap` handler in `scripts/run-trigger-optimization.sh` to restore backup on EXIT/INT/TERM signals.
2. Update lines 21-22 comment to clarify: "The script temporarily patches SKILL.md during evaluation but always restores the original. Final application is manual."
3. Re-sync to skill-trigger-optimization/scripts/.

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. Discovered critical nuance: there IS a trap at line 92 (`trap 'rm -rf "$TMPDIR"' EXIT`) — but it only cleans `$TMPDIR`, NOT the mutated SKILL.md. The mutation flow is: line 378 (backup to `$TMPDIR/SKILL.md.backup`), line 404 (overwrite SKILL.md with patched content), line 471 (restore from backup). If the script is killed between lines 404 and 471, the trap fires, deletes `$TMPDIR` (including the backup!), and leaves SKILL.md in its mutated state with no way to restore. This is worse than originally assessed.

**Exact change required — Replace line 92:**
```bash
# OLD (line 92):
trap 'rm -rf "$TMPDIR"' EXIT

# NEW (line 92):
trap '
  # Restore SKILL.md from backup if it exists (safety net for interruption)
  if [[ -n "${SKILL_MD:-}" ]] && [[ -f "$TMPDIR/SKILL.md.backup" ]]; then
    cp "$TMPDIR/SKILL.md.backup" "$SKILL_MD" 2>/dev/null || true
  fi
  rm -rf "$TMPDIR"
' EXIT
```

**Test:** Run `scripts/run-trigger-optimization.sh skill-creator --dry-run`, then `kill -INT` the process mid-run. Verify `skill-creator/SKILL.md` is unchanged from its git state: `git diff skill-creator/SKILL.md` should show no changes.

**Risks:** Trap handler adds minor complexity. The `${SKILL_MD:-}` guard prevents errors if the trap fires before SKILL_MD is set. Rollback: `git checkout scripts/run-trigger-optimization.sh`.
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

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. Line 42 still has all 6 fields. `check_skill_structure.py:26` has `ALLOWED_FRONTMATTER_FIELDS = {"name", "description"}`. Recommendation: **Option 4 (remove the script)** is preferred — `check_skill_structure.py` provides a superset of `quick_validate.py`'s checks, plus scoring, plus the 1024-char warning. `quick_validate.py` is not referenced by any other script, not in the sync manifest, and not called by any skill. It exists only as a standalone quick-check that is now redundant and dangerously permissive.

**Exact changes for Option 1 (keep but fix):**
```python
# Line 42 — Replace:
    ALLOWED_PROPERTIES = {'name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'}
# With:
    ALLOWED_PROPERTIES = {'name', 'description'}

# Lines 86-88 — Delete entirely:
    if 'compatibility' in fm:
        if not isinstance(fm['compatibility'], str) or len(fm['compatibility']) > 500:
            issues.append("compatibility must be a string ≤ 500 chars")

# Line 44 — Delete:
    # Note: metadata may have nested keys; we only check top-level presence
```

**Exact steps for Option 4 (remove — recommended):**
```bash
git rm scripts/quick_validate.py
# Verify no references exist:
grep -rn 'quick_validate' scripts/ skill-*/ AGENTS.md README.md .github/
```

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

---

# Annex C: Archive, Corpus, And Flow Matrix — Validation

**Source:** `tasks/reviews/2026-03-20-meta-skill-engineering/2.md`
**Validated:** 2026-03-20
**Summary:** 15 raw findings (2 archive, 3 corpus, 10 flow-matrix edges) — 5 new valid, 6 already logged, 4 valid-but-by-design. Top risks: corpus Layer 2 gap, broken safety→lifecycle pipeline edge.

---

### Already-Logged Findings (cross-reference to Task 1)

| Review finding | Status | Task 1 ref | Rationale |
|---|---|---|---|
| Archive-1: Manifest concepts bleed into active inventory | Already logged | **F-008** | Identical finding: skill-improver references manifests at 6 locations |
| Archive-2: Archived skills in active boundary tests | Already logged | **F-014** | Identical finding: skill-packaging (4 files), skill-provenance (1), skill-installer (1) |
| Creation: skill-creator → skill-testing-harness Partial | Already logged | **F-001** | Stale eval schema is the root cause |
| Creation: skill-testing-harness → skill-evaluation Partial | Already logged | **F-001** | Same root cause: stale fields make handoff unreliable |
| Creation: skill-evaluation → skill-improver Broken | Already logged | **F-007** | Handoff section not emitted by runner |
| Library: skill-catalog-curation → skill-lifecycle-management Broken | Already logged | **F-009, F-010** | Both skills depend on nonexistent state artifacts |

---

## F-020 Corpus Layer 2 Evaluation Is Manual-Only — **Valid (High)**

**Review claims:** The automated corpus evaluation only implements Layer 1 (structural scoring). Layer 2 (before/after quality comparison after meta-skill acts) is documented as manual follow-up only.

**Why:** Confirmed. `scripts/run-corpus-eval.sh:4-5` explicitly labels the two layers: "Layer 1: Did the meta-skill produce valid output? (structural checks)" and "Layer 2: Does the rewritten skill perform better? (eval comparison)". Lines 188-194 show Layer 2 is a comment block with manual instructions: "To complete the eval loop manually: 1. Run the meta-skill on working.md, 2. Run run-baseline-comparison.sh". `docs/evaluation-cadence.md:113` confirms: "Layer 2 (manual) compares before/after meta-skill output using run-baseline-comparison.sh."

This is the core corpus evaluation gap: the system can check whether corpus fixtures are valid skills, but cannot automatically verify whether a meta-skill actually _improved_ them.

**Blast radius:** scripts/run-corpus-eval.sh, scripts/run-full-cycle.sh (inherits the gap), the corpus evaluation system as a whole.

**Plan:**
1. Add a `--layer2` flag to `scripts/run-corpus-eval.sh` that automates the manual steps: invokes the meta-skill via `copilot -p` on each corpus fixture, then runs `run-baseline-comparison.sh` on original vs modified.
2. Gate on `copilot` CLI availability — skip Layer 2 with a warning if not installed.
3. Record Layer 2 results alongside Layer 1 in `eval-results/corpus/`.
4. Update `docs/evaluation-cadence.md:113` to document the automated path.
5. Update `scripts/run-full-cycle.sh` to pass `--layer2` when available.

**Risks:** Layer 2 requires `copilot` CLI and is slow (LLM invocations per corpus fixture). Make it opt-in only. Rollback: `git checkout scripts/run-corpus-eval.sh`.
**Effort:** M (3–5 hours)

**Citations:** `scripts/run-corpus-eval.sh:4-5,188-194`; `docs/evaluation-cadence.md:106-113`; `scripts/run-full-cycle.sh:128-132`

---

## F-021 Regression Harvesting Limited to Trigger Failures — **Valid (Medium)**

**Review claims:** Automatic harvesting does not reliably convert trigger failures into replayable protection.

**Why:** Confirmed. `scripts/harvest_failures.py:31-35` uses regex to parse FAIL lines into `trigger_failure` records. `scripts/run-regression-suite.sh:43-47` then encounters these records but _skips_ them: "trigger_failure — logged for next eval run" with `skip=$((skip + 1))`. Only `structural_failure` cases (lines 50-59) are actually re-validated via `skill_lint.py`. So the harvest→regression loop works for structural issues but is a no-op for the most common failure type (trigger routing).

**Blast radius:** scripts/harvest_failures.py, scripts/run-regression-suite.sh, corpus/regression/.

**Plan:**
1. Add trigger-failure replay to `scripts/run-regression-suite.sh`: for `trigger_failure` cases, invoke `copilot -p` with the prompt and check whether the skill file was read (same routing detection as `run-evals.sh`).
2. Gate on `copilot` CLI availability — skip with warning if not installed.
3. Update harvest_failures.py to also capture behavior failures (currently only trigger failures).
4. Update corpus/README.md to document the expanded regression types.

**Risks:** Requires `copilot` CLI for trigger replay. Rollback: `git checkout scripts/run-regression-suite.sh`.
**Effort:** S (2–3 hours)

**Citations:** `scripts/harvest_failures.py:31-35,42`; `scripts/run-regression-suite.sh:43-49,50-59`

---

## F-022 Full-Cycle Corpus Eval Limited to 2 Meta-Skills — **Valid (Medium)**

**Review claims:** run-full-cycle.sh only runs corpus evaluation for skill-improver and skill-anti-patterns, even though the corpus README says it tests more meta-skills.

**Why:** Confirmed. `scripts/run-full-cycle.sh:128` hardcodes: `for meta_skill in skill-improver skill-anti-patterns; do`. Meanwhile, `corpus/README.md:4-5` names four meta-skills: "skill-improver, skill-evaluation, skill-anti-patterns, skill-safety-review, and others". The corpus is designed to test whether meta-skills detect/repair issues, so `skill-evaluation` and `skill-safety-review` are logical candidates that are documented but not included in the automation.

**Blast radius:** scripts/run-full-cycle.sh, corpus evaluation coverage.

**Plan:**
1. Expand the meta-skill list in `scripts/run-full-cycle.sh:128` to include `skill-evaluation` and `skill-safety-review`.
2. Verify that `run-corpus-eval.sh` can handle these skills (it should, since Layer 1 is skill-agnostic structural scoring).
3. Optionally add `skill-creator` (test whether it can assess corpus fixtures).

**Risks:** More skills = longer full-cycle runtime. Rollback: revert line 128.
**Effort:** XS (< 30 min)

**Citations:** `scripts/run-full-cycle.sh:128-132`; `corpus/README.md:4-6`

---

## F-023 skill-safety-review → skill-lifecycle-management Pipeline Edge Broken — **Valid (Medium)**

**Review claims:** The creation pipeline claims skill-safety-review → skill-lifecycle-management, but skill-safety-review doesn't hand off there and lifecycle-management lacks its expected state targets.

**Why:** Confirmed. `README.md` documents the creation pipeline as `...skill-safety-review → skill-lifecycle-management`. But `skill-safety-review/SKILL.md:120-123` only lists `skill-improver` in its Next steps — it never mentions `skill-lifecycle-management`. This means the documented pipeline edge has no implementation: the upstream skill doesn't reference the downstream, and the downstream (per F-010) lacks the state artifacts it would need anyway.

**Blast radius:** README.md pipeline documentation, skill-safety-review Next steps, skill-lifecycle-management.

**Plan:**
1. Add `skill-lifecycle-management` to `skill-safety-review/SKILL.md` Next steps: "If approved for promotion → `skill-lifecycle-management`".
2. This depends on F-010 being resolved first (lifecycle-management needs to work without persistent state artifacts).
3. Update README.md if the pipeline edge is intentionally removed instead.

**Risks:** Adding a Next steps entry to a broken downstream is misleading until F-010 is fixed. Sequence: fix F-010 first. Rollback: `git checkout skill-safety-review/SKILL.md`.
**Effort:** XS (< 15 min, but blocked on F-010)

**Citations:** `README.md:20-24`; `skill-safety-review/SKILL.md:120-123`; `skill-lifecycle-management/SKILL.md:47-58,107-111`

---

## F-024 Manual Pipeline Edges Lack Structured Handoffs — **Valid (Low)**

**Review claims:** Five pipeline edges (skill-evaluation → skill-trigger-optimization, skill-trigger-optimization → skill-safety-review, skill-evaluation → skill-anti-patterns, skill-anti-patterns → skill-improver, skill-improver → skill-trigger-optimization) are human-mediated with no machine-readable handoff artifact.

**Why:** Confirmed as factually accurate, but this is largely by-design. Each of these edges follows the pattern: Skill A produces a human-readable report, human reads it, decides which Skill B to invoke next. The Next steps sections in each skill correctly name the downstream targets:
- `skill-evaluation/SKILL.md:163`: "If routing fails → skill-trigger-optimization"
- `skill-anti-patterns/SKILL.md:172`: "Fix found issues → skill-improver"
- `skill-improver/SKILL.md:328-330`: "Verify → skill-evaluation, Optimize triggers → skill-trigger-optimization"
- `skill-trigger-optimization/SKILL.md:126`: "Verify routing → skill-evaluation"

These are reasonable manual handoffs for a meta-skill library where human judgment selects the next action. The one exception — skill-evaluation → skill-improver — is already logged as F-007 because that edge _should_ have a structured handoff (the improvement loop needs eval data).

**Blast radius:** Pipeline documentation only — functional impact is low.

**Plan:**
1. No immediate code changes needed. The manual edges are working as designed.
2. Optional future improvement: add a `--recommend-next` flag to eval/diagnosis scripts that outputs a structured JSON recommendation (next_skill, reason, evidence) to reduce manual interpretation.

**Risks:** None. This is a low-priority enhancement.
**Effort:** N/A (no immediate action) or M (if structured recommendations are added later)

**Citations:** `skill-evaluation/SKILL.md:160-166`; `skill-anti-patterns/SKILL.md:169-174`; `skill-improver/SKILL.md:325-330`; `skill-trigger-optimization/SKILL.md:123-130`; `skill-safety-review/SKILL.md:120-123`

---

## Annex C Priority Summary

| Priority | ID | Title | Effort | Dependency |
|----------|----|-------|--------|------------|
| P1 High | F-020 | Corpus Layer 2 manual-only | M | None |
| P2 Medium | F-021 | Regression harvesting limited scope | S | None |
| P2 Medium | F-022 | Full-cycle corpus eval limited to 2 skills | XS | None |
| P2 Medium | F-023 | Safety→lifecycle pipeline edge broken | XS | F-010 |
| P3 Low | F-024 | Manual pipeline edges (by-design) | N/A | None |

**Recommended execution order:**
1. Quick win: F-022 (expand full-cycle skill list, XS)
2. Corpus depth: F-020 (Layer 2 automation), F-021 (regression replay)
3. Pipeline fix: F-023 (after F-010 from Task 1)
4. Optional: F-024 (structured recommendations — future enhancement)

## Updated Open Questions

4. **F-020 decision:** Should Layer 2 corpus evaluation invoke `copilot -p` directly, or should it prepare artifacts and document a one-command manual step? Recommendation: direct invocation behind `--layer2` flag.
5. **F-022 decision:** Which additional meta-skills should be included in full-cycle corpus eval? Recommendation: add `skill-evaluation` and `skill-safety-review` at minimum.

---

# Annex B: Shared Tooling And Documentation — Validation

**Source:** `tasks/reviews/2026-03-20-meta-skill-engineering/3.md`
**Validated:** 2026-03-20
**Summary:** 14 raw findings — 3 new valid, 10 already logged, 1 valid-but-by-design. Top risks: harvest format mismatch (breaks regression pipeline), phantom directory in docs, preservation script heading-level bug.

---

### Already-Logged Findings (cross-reference to Tasks 1–2)

| Review finding | Status | Prior ref | Rationale |
|---|---|---|---|
| Root docs eval-results handoff overstated | Already logged | **F-007** | Identical: runner doesn't emit Handoff section |
| Stale contracts in helpers (quick_validate.py) | Already logged | **F-019** | Identical: 4 extra frontmatter fields |
| Script portability (REPO_ROOT resolves wrong) | Already logged | **F-003, F-004, F-005** | Identical: all per-skill copies affected |
| run-evals.sh doesn't implement baseline/handoff | Already logged | **F-007** | Same root finding, different angle |
| Behavior suites don't map to output contracts | Already logged | **F-006** | Identical systemic issue |
| run-baseline-comparison.sh not a benchmark engine | Already logged | **F-012** | skill-benchmarking promises metrics tooling can't deliver |
| run-trigger-optimization.sh mutates SKILL.md | Already logged | **F-015** | Temporary mutation during scoring |
| Layer 2 corpus eval manual-only | Already logged | **F-020** | Identical finding |
| Corpus runner limited to 2 meta-skills | Already logged | **F-022** | Identical: hardcoded skill-improver + skill-anti-patterns |
| copilot-instructions.md repeats broken handoff | Already logged | **F-007** | Same handoff story at line 71 |

### By-Design Finding

| Review finding | Status | Rationale |
|---|---|---|
| Extension hardcodes python3/bash, Ubuntu-specific | By-design | Review itself acknowledges "intentional rather than a defect". README:89 and docs/evaluation-cadence.md:9-11 explicitly state Ubuntu+Copilot CLI environment. |

---

## F-025 Phantom `skill creator/` Directory in Root Docs — **Valid (High)**

**Review claims:** Root docs reference `skill creator/` (with space) as an archived directory, but it is absent from the current filesystem.

**Why:** Confirmed. Three root documentation files reference `skill creator/` as if it exists on disk:
- `AGENTS.md:11` — "Do not conflate archived material in `skill creator/` with the active inventory."
- `AGENTS.md:114` — "`skill creator/` is archived source material from the pre-consolidation state."
- `.github/copilot-instructions.md:65` — "`skill creator/` (with space) is pre-consolidation archive. Ignore it."
- `README.md` also references it in the layout section.

A filesystem listing confirms: no directory named `skill creator/` (with space) exists. Only `skill-creator/` (with hyphen) is present. The docs instruct readers to "ignore" a directory that doesn't exist, which undermines trust in the layout documentation.

**Blast radius:** README.md, AGENTS.md, .github/copilot-instructions.md — all three root governance docs.

**Plan:**
1. Remove all references to `skill creator/` (with space) from `README.md`, `AGENTS.md:11,114`, and `.github/copilot-instructions.md:65`.
2. If the directory was intentionally deleted, remove the references. If it should exist, restore it from git history.
3. Verify with `git log --all --diff-filter=D -- 'skill creator/'` whether it was ever committed.

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. `skill creator/` does NOT exist on disk. Only `skill-creator/` (with hyphen) exists.

**Exact changes required:**
```
# AGENTS.md:11 — Delete this line entirely:
- Do not conflate archived material in `skill creator/` with the active inventory.

# AGENTS.md:114 — Delete this line entirely:
- `skill creator/` is archived source material from the pre-consolidation state.

# .github/copilot-instructions.md:65 — Delete this line entirely:
- `skill creator/` (with space) is pre-consolidation archive. Ignore it.

# README.md — Search for and delete any `skill creator/` reference in the layout section.
```

**Test:** `grep -rn 'skill creator/' README.md AGENTS.md .github/copilot-instructions.md` should return zero results after fix.

**Risks:** None — removing stale references. Rollback: `git checkout` each file.
**Effort:** XS (< 15 min)

**Citations:** `AGENTS.md:11,114`; `.github/copilot-instructions.md:65`; `README.md` layout section; filesystem listing confirms absence

---

## F-026 check_preservation.py Extracts Wrong Heading Level — **Valid (Medium)**

**Review claims:** `check_preservation.py` extracts `##` headings, but the active SKILL.md contract uses `#` headings for canonical sections.

**Why:** Confirmed. `scripts/check_preservation.py:13` uses regex `r"^##\s+" + re.escape(heading)` — matching only second-level (`##`) headings. But the canonical SKILL.md format defined in `AGENTS.md:69-78` and `.github/copilot-instructions.md:13-21` uses first-level (`#`) headings for all required sections: `# Purpose`, `# When to use`, `# When NOT to use`, `# Procedure`, `# Output contract`, `# Failure handling`, `# Next steps`, `# References`.

This means the preservation checker cannot detect changes to any of the 8 canonical sections. It would only catch changes to `## subsection` headings within `# Procedure`. A skill modification that rewrites `# Purpose` entirely would report 100% preservation — a false negative.

**Blast radius:** scripts/check_preservation.py, .github/extensions/meta-skill-tools/extension.mjs (mse_check_preservation tool), any workflow that relies on preservation scoring.

**Plan:**
1. Change `scripts/check_preservation.py:13` regex from `r"^##\s+"` to `r"^#{1,2}\s+"` to match both `#` and `##` headings.
2. Update the section list (if hardcoded) to include the 8 canonical `#`-level sections.
3. Test against a known skill: `python3 scripts/check_preservation.py skill-creator/SKILL.md skill-creator/SKILL.md` should return 100% on all sections.
4. Run `mse_check_preservation` via the extension to confirm it works end-to-end.

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. Line 13 regex is `r"^##\s+" + re.escape(heading)` which ONLY matches `## heading` (h2). But canonical sections use `# heading` (h1): `# Purpose`, `# When to use`, `# When NOT to use`, `# Procedure`, `# Output contract`, `# Failure handling`, `# Next steps`, `# References`. The `## subheadings` within `# Procedure` ARE matched, but all 8 top-level sections are invisible to the checker. This means a skill modification that completely rewrites `# Purpose` would show 100% preservation — a dangerous false negative.

**Exact change required — `scripts/check_preservation.py:13`:**
```python
# OLD (line 13):
    pattern = re.compile(
        r"^##\s+" + re.escape(heading) + r"\s*\n(.*?)(?=^##\s|\Z)",
        re.MULTILINE | re.DOTALL,
    )

# NEW (line 13):
    pattern = re.compile(
        r"^#{1,2}\s+" + re.escape(heading) + r"\s*\n(.*?)(?=^#{1,2}\s|\Z)",
        re.MULTILINE | re.DOTALL,
    )
```

**Also check:** Does the caller pass heading names with or without `#` prefix? Check `check_preservation.py` lines 20-30 for how `heading` is constructed. The headings should be plain text like `"Purpose"`, `"When to use"`, etc. — the regex prepends the `#` pattern.

**Test after fix:**
```bash
# Should report 100% for all sections:
python3 scripts/check_preservation.py skill-creator/SKILL.md skill-creator/SKILL.md

# Should report <100% if a section differs:
cp skill-creator/SKILL.md /tmp/test-skill.md
sed -i 's/# Purpose/# Purpose\nCOMPLETELY CHANGED/' /tmp/test-skill.md
python3 scripts/check_preservation.py skill-creator/SKILL.md /tmp/test-skill.md
rm /tmp/test-skill.md
```

**Risks:** Changing heading extraction may surface previously hidden differences. This is the intended outcome. Rollback: `git checkout scripts/check_preservation.py`.
**Effort:** S (1–2 hours)

**Citations:** `scripts/check_preservation.py:10-17,13`; `AGENTS.md:69-78`; `.github/copilot-instructions.md:13-21`

---

## F-027 Harvest Failures Format Mismatch — **Valid (Critical)**

**Review claims:** run-evals.sh prints `activated=` in failure output, but harvest_failures.py regex looks for `mentioned=`. The trigger-failure regression loop never closes.

**Why:** Confirmed. This is a **silent pipeline break**:
- `scripts/run-evals.sh:431` prints: `[expected=${expected}, activated=${skill_activated}...]`
- `scripts/harvest_failures.py:31` comment says: `# Pattern: ❌ [N] FAIL (category): prompt... [expected=X, mentioned=Y]`
- `scripts/harvest_failures.py:33` regex matches: `\[expected=(\w+),\s*mentioned=(\w+)\]`

The runner outputs `activated=` but the harvester expects `mentioned=`. The regex will **never match**, meaning zero trigger failures are ever harvested into regression cases. Combined with F-021 (regression suite skips trigger failures anyway), the entire trigger-failure regression pipeline is a no-op: failures are printed, never harvested, and even if manually created, never replayed.

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. Important nuance discovered: there IS a fallback pattern at `harvest_failures.py:45-51`. When the structured regex at line 33 fails (which it always will due to `mentioned` vs `activated`), the fallback at line 45 (`m2 = re.search(r"FAIL[:\s]*(.*)", stripped)`) catches the line but **loses all structured fields**: `expected` is set to `"unknown"`, `actual` is set to `"unknown"`, and only the raw prompt text is preserved. So failures ARE harvested, but with **degraded quality** — the regression records lack the expected/actual routing data needed for meaningful replay. The pipeline is **partially broken** (harvests occur, but structured data is lost), not **totally broken** (as originally stated). This makes the fix even more important: the fallback masks the bug by producing incomplete records.

**Blast radius:** scripts/harvest_failures.py (structured parsing completely broken, fallback produces degraded records), scripts/run-regression-suite.sh (F-021 — skips them anyway), the entire failure→regression→protection loop.

**Plan:**
1. Fix `scripts/harvest_failures.py:31,33`: change `mentioned` to `activated` in both the comment and the regex pattern.
2. This fixes harvesting. Combine with F-021 (add trigger replay to regression suite) to close the full loop.
3. Test: run `./scripts/run-evals.sh skill-creator 2>&1 | python3 scripts/harvest_failures.py` and verify failures are captured.
4. Sync updated script if harvest_failures.py is distributed to any skill package.

**Exact changes required:**
```python
# Line 31 — Replace comment:
        # Pattern: ❌ [N] FAIL (category): prompt... [expected=X, mentioned=Y]
# With:
        # Pattern: ❌ [N] FAIL (category): prompt... [expected=X, activated=Y]

# Line 33 — Replace regex:
            r"\[(\d+)\]\s*FAIL\s*\(([^)]*)\):\s*(.*?)\s*\[expected=(\w+),\s*mentioned=(\w+)\]",
# With:
            r"\[(\d+)\]\s*FAIL\s*\(([^)]*)\):\s*(.*?)\s*\[expected=(\w+),\s*activated=(\w+)",
```

Note: The regex replacement also drops the trailing `\]` since `run-evals.sh:431` appends `${vote_info}]` which may add additional content before the closing bracket. Using a non-greedy match without `\]` is more robust.

**Test after fix:**
```bash
# Create a synthetic failure line matching run-evals.sh format:
echo '    ❌ [1] FAIL (core): Test prompt here... [expected=trigger, activated=false]' | python3 scripts/harvest_failures.py --skill test
# Should output JSON with expected="trigger", actual="no_trigger" (not "unknown")
```

**Risks:** None — pure bug fix aligning two scripts. Rollback: `git checkout scripts/harvest_failures.py`.
**Effort:** XS (< 15 min for the fix itself; combine with F-021 for full loop closure)

**Citations:** `scripts/run-evals.sh:431` (prints `activated=`); `scripts/harvest_failures.py:31,33` (expects `mentioned=`)

---

## Annex B Priority Summary

| Priority | ID | Title | Effort | Dependency |
|----------|----|-------|--------|------------|
| P0 Critical | F-027 | Harvest format mismatch (pipeline broken) | XS | None |
| P1 High | F-025 | Phantom `skill creator/` in docs | XS | None |
| P2 Medium | F-026 | check_preservation.py wrong heading level | S | None |

**Recommended execution order:**
1. F-027 first — critical bug fix, XS effort, closes a broken pipeline
2. F-025 — doc cleanup, XS effort
3. F-026 — functional fix for preservation checker

---

## Cumulative Finding Count (Tasks 1–3)

| Task | Source | New | Already Logged | By-Design/Invalid | Running Total |
|------|--------|-----|----------------|-------------------|---------------|
| 1 | Annex A | 19 | — | 1 invalid (F-016) | 19 |
| 2 | Annex C | 5 | 6 | 1 by-design (F-024) | 24 |
| 3 | Annex B | 3 | 10 | 1 by-design | 27 |

**Total unique findings: 27** (F-001 through F-027). 23 valid actionable, 2 by-design, 1 invalid, 1 low/optional.

---

# Task 4/9 — Annex D: Key Findings Summary (Deep Read)

**Source:** `tasks/reviews/2026-03-20-meta-skill-engineering/4.md`
**Validated:** 2026-03-20
**Summary:** 7 top-level findings (with 3 sub-findings under "Regression Suite") — 3 already logged, 5 new. Top risks: mislabeled metrics, threshold drift, broken regression schema.

### Cross-references to already-logged findings

| Review Finding | Existing | Status |
|---------------|----------|--------|
| Stale archived skill references in eval files | F-014 | Already logged (Low) |
| Layer 2 of run-corpus-eval.sh manual-only | F-020 | Already logged (High) |
| harvest_failures.py regex mismatch (Break 1) | F-027 | Already logged (Critical) |

---

## F-028 Precision/Recall Labels Mislabeled in Eval Gates — **Valid (High)**

**Review claims:** Lines 778-784 of run-evals.sh label the positive trigger pass rate as "precision" and the negative trigger pass rate as "recall." Both are wrong by standard IR definitions.

**Why:** Confirmed. The script computes two metrics:
- Line 776-780: "Precision: positive trigger pass rate" = `GATE_POS_PASS / GATE_POS_TOTAL`. This measures: "Of all prompts that SHOULD trigger the skill, how many actually did?" = TP/(TP+FN) = **Recall** (sensitivity) in IR terms.
- Line 782-786: "Recall: negative trigger pass rate" = `GATE_NEG_PASS / GATE_NEG_TOTAL`. This measures: "Of all prompts that should NOT trigger, how many correctly stayed silent?" = TN/(TN+FP) = **Specificity** (true negative rate) in IR terms. This is neither precision nor recall.

The labels are used throughout: gate output at lines 853-854, the header comment at line 12, and propagate to skill-evaluation/SKILL.md lines 103, 117-118. The gates themselves test the right things (pass rates ≥ 80%) — only the labels are wrong.

**Blast radius:** `scripts/run-evals.sh` (variable names, comments, gate table), `skill-evaluation/SKILL.md` (description, output contract table), eval-results reports, any documentation referencing these metrics.

**Plan:**
1. Rename variables in `run-evals.sh`: `precision` → `pos_trigger_rate` (or `sensitivity`), `recall` → `neg_reject_rate` (or `specificity`).
2. Update gate table labels at lines 853-854 to: "Positive trigger rate ≥ 80%" and "Negative rejection rate ≥ 80%".
3. Update header comment at line 12.
4. Update `skill-evaluation/SKILL.md` lines 103, 117-118 to use consistent labels.
5. Decide: either use descriptive names (positive trigger rate / negative rejection rate) or standard IR terms (sensitivity / specificity). Descriptive names recommended for clarity.

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. Lines 776-786 confirmed. The formulas themselves compute the right things — only the labels are wrong. The variable `precision` at line 778 computes `GATE_POS_PASS * 100 / GATE_POS_TOTAL` which is "of prompts that SHOULD trigger, how many DID" = TP/(TP+FN) = sensitivity/recall in IR terms. The variable `recall` at line 784 computes `GATE_NEG_PASS * 100 / GATE_NEG_TOTAL` which is "of prompts that should NOT trigger, how many correctly didn't" = TN/(TN+FP) = specificity. Neither is precision (TP/(TP+FP)). Recommendation: use descriptive names to avoid further IR terminology confusion.

**Exact changes required in `scripts/run-evals.sh`:**
```bash
# Line 12 (header comment) — Update metric names throughout

# Lines 771-773 (variable declarations) — Replace:
  local precision=0 recall=0 beh_rate=0
  local precision_status="FAIL" recall_status="FAIL" beh_status="FAIL"
# With:
  local pos_trigger_rate=0 neg_reject_rate=0 beh_rate=0
  local pos_trigger_status="FAIL" neg_reject_status="FAIL" beh_status="FAIL"

# Lines 776-780 — Replace:
  # Precision: positive trigger pass rate
  if [[ $GATE_POS_TOTAL -gt 0 ]]; then
    precision=$((GATE_POS_PASS * 100 / GATE_POS_TOTAL))
  fi
  [[ $precision -ge 80 ]] && precision_status="PASS"
# With:
  # Positive trigger rate (sensitivity): of prompts that SHOULD trigger, how many did?
  if [[ $GATE_POS_TOTAL -gt 0 ]]; then
    pos_trigger_rate=$((GATE_POS_PASS * 100 / GATE_POS_TOTAL))
  fi
  [[ $pos_trigger_rate -ge 80 ]] && pos_trigger_status="PASS"

# Lines 782-786 — Replace:
  # Recall: negative trigger pass rate (true negative rate)
  if [[ $GATE_NEG_TOTAL -gt 0 ]]; then
    recall=$((GATE_NEG_PASS * 100 / GATE_NEG_TOTAL))
  fi
  [[ $recall -ge 80 ]] && recall_status="PASS"
# With:
  # Negative rejection rate (specificity): of prompts that should NOT trigger, how many were correctly rejected?
  if [[ $GATE_NEG_TOTAL -gt 0 ]]; then
    neg_reject_rate=$((GATE_NEG_PASS * 100 / GATE_NEG_TOTAL))
  fi
  [[ $neg_reject_rate -ge 80 ]] && neg_reject_status="PASS"

# Lines 853-854 (gate table) — Replace:
  echo "| Precision (positive trigger) | ${precision}% | ≥ 80% | ${precision_status} |"
  echo "| Recall (negative trigger) | ${recall}% | ≥ 80% | ${recall_status} |"
# With:
  echo "| Positive trigger rate | ${pos_trigger_rate}% | ≥ 80% | ${pos_trigger_status} |"
  echo "| Negative rejection rate | ${neg_reject_rate}% | ≥ 80% | ${neg_reject_status} |"
```

**Also update these files for consistency:**
- `skill-evaluation/SKILL.md:103` — Replace "precision ≥ 95% and recall ≥ 90%" with "positive trigger rate ≥ 95% and negative rejection rate ≥ 90%"
- `skill-evaluation/SKILL.md:117-118` — Update output contract table column headers
- Search for `precision` and `recall` throughout `run-evals.sh` for any other references (JSON summary, etc.)

**Test:** `./scripts/run-evals.sh --dry-run skill-creator` — verify new labels appear in gate table output.

**Risks:** Any tooling or documentation referencing old labels will need updating. Eval reports already generated use old labels. Rollback: `git checkout scripts/run-evals.sh skill-evaluation/SKILL.md`.
**Effort:** S (1–2 hours)

**Citations:** `scripts/run-evals.sh:12,776-786,853-854`; `skill-evaluation/SKILL.md:5,56,58,80,103,106,117-118`

---

## F-029 Threshold Inconsistency Between Skill Documentation and Gate Implementation — **Valid (Medium)**

**Review claims:** skill-evaluation/SKILL.md documents precision ≥ 95% / recall ≥ 90% as the quality bar, but run-evals.sh enforces 80%/80%.

**Why:** Confirmed. `skill-evaluation/SKILL.md:103` states: "Routing target: precision ≥ 95% and recall ≥ 90%". The output contract table at lines 117-118 repeats these thresholds. However, `run-evals.sh` enforces 80% for all three gates (lines 780, 786, 792). Line 106 of the SKILL.md does caveat: "These are targets, not bright lines" — so there's an argument for two tiers (aspirational targets vs minimum gates). But the 15-percentage-point gap on "precision" (which is actually sensitivity — see F-028) and 10-point gap on "recall" creates confusion about the actual quality bar. A skill scoring 85% would PASS the gate but FAIL the documented target with no clear guidance on which governs.

**Blast radius:** `skill-evaluation/SKILL.md` (quality bar documentation), `scripts/run-evals.sh` (gate thresholds), any skill team using the evaluation to judge quality.

**Plan:**
1. Option A (recommended): Make the two-tier system explicit. In `skill-evaluation/SKILL.md`, clearly separate "minimum gate" (80%) from "quality target" (95%/90%). Add a note that the script enforces the minimum gate and reports distance to target.
2. Option B: Raise script thresholds to match documentation (95%/90%). Risk: many skills may currently fail.
3. Option C: Lower documentation targets to match script (80%). Risk: lowers quality bar.
4. Whichever option: update gate table labels in `run-evals.sh:853-854` to show which tier is being enforced.
5. Consider adding `--strict-gates` flag that enforces the higher targets.

**Risks:** Option B may break existing passing skills. Option A is safest. Rollback: `git revert`.
**Effort:** S (1 hour)

**Citations:** `skill-evaluation/SKILL.md:103,106,117-118`; `scripts/run-evals.sh:780,786,792,853-855`

---

## F-030 Next-Steps Ordering Conflict in skill-creator — **Valid (Medium)**

**Review claims:** The finalization prose lists trigger-optimization before testing-harness, which is backwards relative to the canonical pipeline.

**Why:** Confirmed — two issues found:

1. **Procedure section (lines 270-274):** The "After finalization, recommend next steps" list puts `skill-trigger-optimization` BEFORE `skill-testing-harness`:
   ```
   - Run skill-trigger-optimization to optimize the description for routing
   - Run skill-testing-harness to build a formal eval suite
   ```
   This is backwards — you cannot meaningfully optimize triggers without empirical test data from the harness.

2. **Next steps section (lines 305-310):** The formal Next steps list has the correct order (testing-harness first at position 1, trigger-optimization at position 4) but inserts `skill-benchmarking` at position 3, which is not in the canonical creation pipeline per `AGENTS.md:82-86`.

The canonical pipeline from AGENTS.md is: `skill-creator → skill-testing-harness → skill-evaluation → skill-trigger-optimization → skill-safety-review → skill-lifecycle-management`. No benchmarking step.

**Blast radius:** `skill-creator/SKILL.md` — agents following the finalization prose will optimize triggers without test data.

**Plan:**
1. In the Procedure section (lines 270-274), reorder to match canonical pipeline: testing-harness → evaluation → trigger-optimization → safety-review.
2. In the Next steps section (lines 305-310), either remove benchmarking or add a note: "Optional: compare variants if multiple drafts → skill-benchmarking (not part of the standard creation pipeline)."
3. Validate both lists match the canonical pipeline in AGENTS.md.

**Risks:** Minimal — ordering change only. Rollback: `git checkout skill-creator/SKILL.md`.
**Effort:** XS (30 min)

**Citations:** `skill-creator/SKILL.md:270-274,305-310`; `AGENTS.md:82-86`

---

## F-031 Regression Corpus JSON Schema Mismatch — **Valid (Critical)**

**Review claims:** The regression JSON files use `original_excerpt` and `modified_excerpt` (text strings), but `run-regression-suite.sh` reads `.original` and `.modified` (as file paths). Also, `references-broken-001.json` has no `.skill` field.

**Why:** Confirmed in full. All three regression files in `corpus/regression/` have the same schema problem:

**Corpus files use:**
- `original_excerpt` (inline text string, e.g., `"# When NOT to use\n..."`)
- `modified_excerpt` (inline text string)
- `check_type` (e.g., `"boundary_preservation"`)
- `type` (e.g., `"preservation_failure"`, `"structural_failure"`)
- NO `.skill` field in any of the three files
- NO `.original` or `.modified` fields (as file paths)

**Script reads (`run-regression-suite.sh`):**
- Line 41: `skill=$(jq -r '.skill' "$case_file")` → returns `null` for all 3 files
- Line 52: `skill_dir="${REPO_ROOT}/${skill}"` → resolves to `REPO_ROOT/null/`
- Line 70: `original=$(jq -r '.original // ""' "$case_file")` → returns `""` (field doesn't exist)
- Line 71: `modified=$(jq -r '.modified // ""' "$case_file")` → returns `""` (field doesn't exist)
- Line 72: `check_name=$(jq -r '.check // ""' "$case_file")` → returns `""` (field is `check_type`, not `check`)

**Result:** For `boundaries-deleted-001` and `purpose-lost-001` (type: `preservation_failure`): lines 74-77 print "⚠️ missing original/modified paths" and skip. For `references-broken-001` (type: `structural_failure`): line 41 reads null skill, line 53 checks `REPO_ROOT/null/` which doesn't exist, line 54 prints "⚠️ skill directory not found: null" and skips.

Combined with F-027 (harvest can't produce valid entries) and F-021 (trigger_failure cases skipped), the entire regression suite is non-functional: **100% of cases are silently skipped, the suite reports PASS, and gives false confidence**.

**Blast radius:** `scripts/run-regression-suite.sh`, `scripts/run-full-cycle.sh` (step 5), all 3 regression corpus files, any quality assurance relying on regression protection.

**Plan:**
1. Fix regression JSON files to include fields the runner expects:
   - Add `.skill` field to all 3 files (even if set to a representative skill like `skill-catalog-curation`)
   - For preservation_failure type: Either (a) add `.original` and `.modified` as file paths pointing to fixture SKILL.md files, or (b) update the runner to accept inline `_excerpt` fields
   - Add `.check` field (or rename `check_type` → `check`)
2. Option (b) recommended: update `run-regression-suite.sh` to handle inline excerpt comparison:
   - Read `original_excerpt` and `modified_excerpt` from JSON
   - Write to temp files, pass to `check_preservation.py`
   - Clean up temp files
3. For `structural_failure` type: update the runner to handle cases without a `.skill` field (use a test fixture directory, or perform the cross-reference check inline).
4. Add a test that runs `run-regression-suite.sh` and asserts `skip == 0` to prevent silent regressions.

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. All 3 corpus files confirmed to have wrong schema. The runner's jq extractions at lines 41, 70-72 all return empty/null because the field names don't match. Every single regression case is silently skipped. The suite reports "PASS" with 0 failures and 3 skips, giving false confidence. Combined with F-027 (harvest produces degraded records) and F-021 (trigger_failure skipped), the entire regression system is non-functional.

**Exact changes — Option (b) for `scripts/run-regression-suite.sh`:**
```bash
# Lines 69-84 — Replace the preservation_failure handler:

        preservation_failure)
            # Try file paths first, fall back to inline excerpts
            original=$(jq -r '.original // ""' "$case_file")
            modified=$(jq -r '.modified // ""' "$case_file")
            check_name=$(jq -r '.check // .check_type // ""' "$case_file")

            # If file paths are empty, try inline excerpts
            if [[ -z "$original" ]] || [[ -z "$modified" ]]; then
                original_excerpt=$(jq -r '.original_excerpt // ""' "$case_file")
                modified_excerpt=$(jq -r '.modified_excerpt // ""' "$case_file")

                if [[ -z "$original_excerpt" ]] || [[ -z "$modified_excerpt" ]]; then
                    echo "  ⚠️  [${case_id}] missing original/modified data"
                    skip=$((skip + 1))
                    continue
                fi

                # Write excerpts to temp files for check_preservation.py
                local orig_tmp="$TMPDIR/original_${case_id}.md"
                local mod_tmp="$TMPDIR/modified_${case_id}.md"
                echo "$original_excerpt" > "$orig_tmp"
                echo "$modified_excerpt" > "$mod_tmp"
                original="$orig_tmp"
                modified="$mod_tmp"
            fi

            if [[ ! -f "$original" ]] || [[ ! -f "$modified" ]]; then
                echo "  ⚠️  [${case_id}] referenced files not found"
                skip=$((skip + 1))
                continue
            fi
            # ... rest of preservation check ...
```

**Also add TMPDIR setup near the top of the script:**
```bash
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
```

**Also fix the `.skill` extraction at line 41:**
```bash
# OLD:
skill=$(jq -r '.skill' "$case_file")

# NEW — allow null/missing .skill:
skill=$(jq -r '.skill // "unknown"' "$case_file")
```

**And fix the structural_failure handler to skip gracefully when skill is "unknown":**
```bash
        structural_failure)
            if [[ "$skill" == "unknown" ]] || [[ "$skill" == "null" ]]; then
                echo "  ⏭  [${case_id}] no .skill field — cannot validate structurally"
                skip=$((skip + 1))
                continue
            fi
            # ... rest of handler ...
```

**Risks:** Changing the JSON schema may break any other tooling reading these files (none found). Rollback: `git checkout corpus/regression/ scripts/run-regression-suite.sh`.
**Effort:** M (2–3 hours)

**Citations:** `corpus/regression/boundaries-deleted-001.json` (full file); `corpus/regression/purpose-lost-001.json` (full file); `corpus/regression/references-broken-001.json` (full file); `scripts/run-regression-suite.sh:41,52-57,69-84`

---

## F-032 run-meta-skill-cycle.sh Hardcodes Model Without Override — **Valid (Medium)**

**Review claims:** `run-meta-skill-cycle.sh` hardcodes `--model claude-opus-4.6` with no `EVAL_MODEL` environment variable override, inconsistent with all other eval scripts.

**Why:** Confirmed. `scripts/run-meta-skill-cycle.sh:37` hardcodes `--model claude-opus-4.6` and line 26 prints `"Model: claude-opus-4.6 (high reasoning)"`. There is no `EVAL_MODEL` environment variable check or `--model` CLI override. Every other eval script uses `MODEL="${EVAL_MODEL:-gpt-4.1}"` (e.g., `run-evals.sh:58`, `run-trigger-optimization.sh`, `run-corpus-eval.sh`). This means: (1) users can't switch models for cost or availability reasons, (2) the script silently uses a different (premium) model than all other tooling which defaults to gpt-4.1, (3) if claude-opus-4.6 becomes unavailable, the script hard-fails.

**Blast radius:** `scripts/run-meta-skill-cycle.sh`, any automation invoking it.

**Plan:**
1. Add `MODEL="${EVAL_MODEL:-claude-opus-4.6}"` at the top of the script (keep claude-opus-4.6 as default since orchestration benefits from stronger reasoning).
2. Replace hardcoded `--model claude-opus-4.6` with `--model "$MODEL"`.
3. Update the info echo to show the actual model being used.
4. Optionally add `--model` CLI flag parsing to match `run-evals.sh` pattern.

**⚠️ VERIFICATION NOTE (2026-03-20T09:40Z):** Re-verified. Line 26 prints `"Model: claude-opus-4.6 (high reasoning)"` and line 37 uses `--model claude-opus-4.6`. No `EVAL_MODEL` check exists. All other eval scripts use `MODEL="${EVAL_MODEL:-gpt-4.1}"`.

**Exact changes required:**
```bash
# Add after the shebang/set lines (around line 10):
MODEL="${EVAL_MODEL:-claude-opus-4.6}"

# Line 26 — Replace:
echo "Model: claude-opus-4.6 (high reasoning)"
# With:
echo "Model: ${MODEL}"

# Line 37 — Replace:
  --model claude-opus-4.6 \
# With:
  --model "$MODEL" \
```

**Risks:** Minimal — adding flexibility, not changing default behavior. Rollback: `git checkout scripts/run-meta-skill-cycle.sh`.
**Effort:** XS (15 min)

**Citations:** `scripts/run-meta-skill-cycle.sh:26,37`; `scripts/run-evals.sh:58,92,97,143-144`

---

## Task 4 Priority Summary

| Priority | ID | Title | Effort | Blocked By |
|----------|----|-------|--------|------------|
| P0 Critical | F-031 | Regression JSON schema mismatch (all cases skip) | M | None |
| P1 High | F-028 | Precision/Recall labels mislabeled in eval gates | S | None |
| P2 Medium | F-029 | Threshold inconsistency (95/90 vs 80) | S | F-028 (labels) |
| P2 Medium | F-030 | Next-steps ordering conflict in skill-creator | XS | None |
| P2 Medium | F-032 | run-meta-skill-cycle.sh hardcodes model | XS | None |

**Recommended execution order:**
1. F-031 first — critical, completes the regression pipeline repair (with F-027 and F-021)
2. F-028 — high, fixes misleading metrics throughout the eval system
3. F-029 — medium, depends on F-028 label fix for clarity
4. F-030, F-032 — quick fixes, no dependencies

---

## Cumulative Finding Count (Tasks 1–4)

| Task | Source | New | Already Logged | By-Design/Invalid | Running Total |
|------|--------|-----|----------------|-------------------|---------------|
| 1 | Annex A | 19 | — | 1 invalid (F-016) | 19 |
| 2 | Annex C | 5 | 6 | 1 by-design (F-024) | 24 |
| 3 | Annex B | 3 | 10 | 1 by-design | 27 |
| 4 | Annex D | 5 | 3 | — | 32 |

**Total unique findings: 32** (F-001 through F-032). 28 valid actionable, 2 by-design, 1 invalid, 1 low/optional.

---

# Task 5/9 — Annex E: Executive Summary Review (Full Repo Assessment)

**Source:** `tasks/reviews/2026-03-20-meta-skill-engineering/5.md`
**Validated:** 2026-03-20
**Summary:** 11 numbered findings + pipeline assessment + evaluation-system assessment — 11 already logged, 3 new. Top risks: baseline comparison gap, missing pipeline edge, scope overlap.

### Cross-references to already-logged findings

| Review Finding # | Topic | Existing Finding(s) |
|-----------------|-------|-------------------|
| 1 | eval→improver handoff (Handoff section) | F-007 |
| 2 | Dead eval schema in testing-harness | F-001 |
| 3 | Per-skill scripts not self-contained | F-003, F-004, F-005 |
| 4 | skill-improver manifest assumptions | F-008 |
| 5 | catalog/lifecycle artifacts + ARCHIVE bug | F-009, F-010, F-011 |
| 6 | behavior.jsonl misaligned with output contracts | F-006 |
| 7 | Corpus Layer 2 manual-only | F-020 |
| 8 | harvest_failures.py + regression loop broken | F-021, F-027, F-031 |
| 9 | run-trigger-optimization.sh mutates SKILL.md | F-015 |
| 10 | Root docs mention nonexistent `skill creator/` | F-025 |
| 11 | Stale manifest refs + archived skill refs | F-008, F-014 |

The review's overall score of **3/5** and evaluation-system score of **2.1/5** are consistent with the pattern of findings in F-001 through F-032. The strongest areas are structural discipline (4/5) and routing measurement; the weakest are baseline/benchmark methodology (1/5) and regression protection (1/5).

---

## F-033 Baseline Comparison Output Contract Not Implemented — **Valid (High)**

**Review claims:** `skill-evaluation/SKILL.md` promises a "Baseline Comparison" section with win rate in its output contract, and a Step 5 procedure for running baseline comparison. Neither `run-evals.sh` nor `run-baseline-comparison.sh` actually computes win rates.

**Why:** Confirmed. Three pieces form the gap:

1. **Output contract** (`skill-evaluation/SKILL.md:125-126`): Promises `### Baseline Comparison\nWin rate: X/N (Y%)` as a required section in the eval report.
2. **Procedure Step 5** (`skill-evaluation/SKILL.md:93-99`): Describes a manual baseline comparison workflow — remove SKILL.md, re-run cases without skill, blind-compare, compute win rate. This is a documented procedure, not an automated one.
3. **run-evals.sh** (`scripts/run-evals.sh:938-949`): JSON summary contains only timestamp, model, routing_mode, runs_per_prompt, overall verdict, skills_failed, skills_tested, results_dir. No baseline data, no win rate.
4. **run-baseline-comparison.sh** (`scripts/run-baseline-comparison.sh:128-228`): Despite the name, this script compares two SKILL.md versions (original vs modified) structurally. It runs 5 quality gates: section count preservation, no section deletions, line count < 500, name preserved, eval regression (pass/fail exit code only). It does NOT compute win rate, token accounting, or skill-vs-no-skill quality comparison.

This is distinct from F-007 (which covers the missing Handoff section). The Baseline Comparison is a separate output contract section that requires different tooling — comparing skill-active vs skill-absent output quality.

**Blast radius:** `skill-evaluation/SKILL.md` (output contract + procedure), `scripts/run-baseline-comparison.sh` (misleading name), evaluation credibility (no way to answer "is this skill actually better than no skill?").

**Plan:**
1. Option A (recommended): Implement baseline comparison in `run-evals.sh` behind a `--baseline` flag:
   - Temporarily rename the target SKILL.md to disable the skill
   - Re-run behavior test cases without the skill active
   - Compare outputs pairwise (LLM judge: "Which response is better?")
   - Compute win rate = skill-wins / total-cases
   - Emit the `### Baseline Comparison` section in the eval report
2. Option B: Remove the Baseline Comparison section from the output contract and Step 5 from the procedure. Mark as future enhancement.
3. Rename `run-baseline-comparison.sh` to `run-skill-diff.sh` or `run-modification-comparison.sh` to accurately reflect what it does (compares two versions of a SKILL.md, not skill-vs-baseline).
4. Update `skill-evaluation/SKILL.md` to clarify what's automated vs manual.

**Risks:** Option A requires LLM calls (cost/time). Option B reduces contract scope. Rollback: `git revert`.
**Effort:** L for Option A (4–6 hours), XS for Option B (30 min)

**Citations:** `skill-evaluation/SKILL.md:93-99,125-126`; `scripts/run-evals.sh:938-949`; `scripts/run-baseline-comparison.sh:128-228,249-337`

---

## F-034 skill-creator and skill-testing-harness Overlapping Eval-Creation Scope — **Valid (Low)**

**Review claims:** skill-creator already creates eval files in Phase 3, but also delegates to skill-testing-harness. The pipeline edge is partial because ownership is blurry.

**Why:** Confirmed. `skill-creator/SKILL.md:177-200` (Phase 3) instructs the agent to create all three eval files (`trigger-positive.jsonl`, `trigger-negative.jsonl`, `behavior.jsonl`) directly, with 2–5 test prompts each. Line 194 then says "For details on field schemas, delegate to `skill-testing-harness` or refer to AGENTS.md." Meanwhile, `skill-testing-harness/SKILL.md` describes itself as "Build test infrastructure for a skill" and its entire purpose is creating these same files.

The implicit delineation is: skill-creator produces seed/initial eval files (2–5 cases), skill-testing-harness produces comprehensive formal suites (8+ cases per file, adversarial edges, etc.). But this is never stated explicitly. An agent using skill-creator already gets eval files, so routing to skill-testing-harness afterward may produce confusion about whether to extend or replace them.

**Blast radius:** Pipeline clarity between skill-creator and skill-testing-harness. Low severity — the current behavior works, but the boundary is implicit.

**Plan:**
1. Add a note to `skill-creator/SKILL.md:194` clarifying: "Phase 3 creates seed eval files (2–5 cases). For comprehensive test suites (8+ cases, adversarial scenarios, edge coverage), route to `skill-testing-harness` afterward."
2. Add a note to `skill-testing-harness/SKILL.md` in the "When to use" section: "When a skill already has seed eval files (from skill-creator) and needs comprehensive test coverage."
3. Clarify in both: testing-harness extends seed evals, it does not replace them.

**Risks:** None — clarification only. Rollback: `git revert`.
**Effort:** XS (30 min)

**Citations:** `skill-creator/SKILL.md:177-200,194`; `skill-testing-harness/SKILL.md:4-6`; `AGENTS.md:82-86`

---

## F-035 skill-evaluation Missing Route to skill-anti-patterns — **Valid (Medium)**

**Review claims:** The canonical improvement pipeline in AGENTS.md includes `skill-evaluation → skill-anti-patterns → skill-improver`, but `skill-evaluation/SKILL.md` itself does not route to skill-anti-patterns.

**Why:** Confirmed. `skill-evaluation/SKILL.md:160-166` (Next steps section) lists four downstream routes:
```
- If routing fails → skill-trigger-optimization
- If output quality fails → skill-improver
- If comparing variants → skill-benchmarking
- Before promotion to stable → skill-safety-review
```

`skill-anti-patterns` is not mentioned anywhere in skill-evaluation's Next steps. However, the canonical improvement pipeline in `AGENTS.md:89-91` specifies: `skill-evaluation → skill-anti-patterns → skill-improver → skill-trigger-optimization`. The anti-patterns step is supposed to diagnose pattern violations before routing to skill-improver for the actual fix.

The failure handling table at `skill-evaluation/SKILL.md:145-151` also routes output quality failures directly to `skill-improver` without an intermediate anti-patterns diagnosis step.

This is analogous to F-023 (safety→lifecycle edge missing from skill-safety-review) — a documented pipeline edge that the originating skill doesn't actually reference.

**Blast radius:** skill-evaluation (Next steps), improvement pipeline flow. When output quality fails, the agent goes directly to skill-improver without first diagnosing which anti-pattern caused the failure, reducing fix accuracy.

**Plan:**
1. Add a routing entry to `skill-evaluation/SKILL.md:160-166`:
   ```
   - If output quality fails with pattern issues → `skill-anti-patterns` (diagnose) then `skill-improver` (fix)
   ```
2. Update the failure handling table at lines 145-151 to include an anti-patterns diagnosis step before routing to skill-improver.
3. Alternatively: decide that the direct route to skill-improver is intentional (skill-improver already has its own eval-driven diagnosis table). In that case, update AGENTS.md to remove skill-anti-patterns from the improvement pipeline.
4. Option 1 recommended: anti-patterns diagnosis before improvement produces better-targeted fixes.

**Risks:** Adding a step to the pipeline increases complexity. Rollback: `git revert`.
**Effort:** XS (30 min)

**Citations:** `skill-evaluation/SKILL.md:145-151,160-166`; `AGENTS.md:89-91`; `skill-anti-patterns/SKILL.md:169-174`

---

## Task 5 Priority Summary

| Priority | ID | Title | Effort | Blocked By |
|----------|----|-------|--------|------------|
| P1 High | F-033 | Baseline comparison output not implemented | L (full) or XS (descope) | None |
| P2 Medium | F-035 | skill-evaluation missing route to skill-anti-patterns | XS | None |
| P3 Low | F-034 | skill-creator / testing-harness scope overlap | XS | None |

**Recommended execution order:**
1. F-033 Option B first (descope output contract) — quick fix to close documentation/reality gap
2. F-035 — add anti-patterns route to skill-evaluation's Next steps
3. F-034 — clarify scope boundaries (low priority)
4. F-033 Option A later (implement baseline comparison) — larger enhancement

### Review Meta-Assessment

The review's evaluation-system scores confirm the pattern across prior annexes:

| Area | Score | Key Existing Findings |
|------|-------|-----------------------|
| Routing measurement | 3/5 | F-028 (mislabeled metrics) |
| Behavior/protocol checks | 2/5 | F-006 (misaligned behavior.jsonl) |
| Usefulness assessment | 3/5 | Working (implemented in run-evals.sh) |
| Baseline/benchmark | 1/5 | F-033 (new), F-012 |
| Corpus design | 3/5 | F-020 (Layer 2 manual) |
| Regression protection | 1/5 | F-021, F-027, F-031 |
| Operational reliability | 2/5 | F-003, F-004, F-005 |

---

## Cumulative Finding Count (Tasks 1–5)

| Task | Source | New | Already Logged | By-Design/Invalid | Running Total |
|------|--------|-----|----------------|-------------------|---------------|
| 1 | Annex A | 19 | — | 1 invalid (F-016) | 19 |
| 2 | Annex C | 5 | 6 | 1 by-design (F-024) | 24 |
| 3 | Annex B | 3 | 10 | 1 by-design | 27 |
| 4 | Annex D | 5 | 3 | — | 32 |
| 5 | Annex E | 3 | 11 | — | 35 |

**Total unique findings: 35** (F-001 through F-035). 31 valid actionable, 2 by-design, 1 invalid, 1 low/optional.

---

# Task 6/9 — Annex F: Comprehensive Review Report (agentskills.io Alignment)

**Source:** `tasks/reviews/2026-03-20-meta-skill-engineering/6.md` (503 lines)
**Validated:** 2026-03-20
**Summary:** 20+ distinct findings (using IDs X-1, S-1/2, D-1/2, B-1, SC-1/2, E-1/2/3, CR-1/2/3, P-1, DOC-1/2/3, TH-1, SR-1, LM-1, EV-1, IM-1) — 6 already logged, 3 new actionable, remainder are enhancement recommendations or minor observations. Top risks: usefulness testing coverage, description limit enforcement.

### Cross-references to already-logged findings

| Review ID | Topic | Existing Finding |
|-----------|-------|-----------------|
| X-1 | quick_validate.py allows extra frontmatter fields | F-019 |
| CR-1 | skill-creator/testing-harness Phase 3 overlap | F-034 |
| TH-1 | behavior template uses `expected_files` field | F-001 |
| P-1 | Pipelines advisory only, no automated chaining | F-024 (by-design) |
| LM-1 | Lifecycle states before deprecation have no tracking | F-010 |
| EV-1 | Baseline comparison manual SKILL.md removal | F-033 |

### Findings confirmed as positive (no action needed)

| Review ID | Topic | Assessment |
|-----------|-------|------------|
| D-1 | Boundaries in description (all 12 skills) | Smart routing optimization for coexisting meta-skills — by design |
| Section 1.1 | Canonical format 12/12 | ✅ All pass |
| Section 1.2 | All under 500 lines | ✅ Largest: 330 lines |
| Section 2.1 | All descriptions under 1024 chars | ✅ Largest: safety-review at 736 chars (my measurement) |
| Section 6.3 | Cross-reference integrity 12/12 | ✅ No broken references |
| Section 9 | Corpus 5/5/5/3 tiers | ✅ Well-structured |

---

## F-036 Usefulness Criteria Coverage Gap — 8/12 Skills Untested — **Valid (Medium)**

**Review claims (E-1):** Behavior test count is low at 3 per skill, and usefulness_criteria is only seeded in 4/12 skills. 8/12 skills have no mechanism to judge whether output is actually useful.

**Why:** Confirmed. Verified by scanning all 12 `evals/behavior.jsonl` files:

| Skill | Behavior Cases | With usefulness_criteria |
|-------|---------------|-------------------------|
| skill-creator | 3 | 2 |
| skill-evaluation | 3 | 2 |
| skill-improver | 4 | 2 |
| skill-trigger-optimization | 3 | 2 |
| skill-adaptation | 3 | 0 |
| skill-anti-patterns | 3 | 0 |
| skill-benchmarking | 3 | 0 |
| skill-catalog-curation | 3 | 0 |
| skill-lifecycle-management | 3 | 0 |
| skill-safety-review | 3 | 0 |
| skill-testing-harness | 3 | 0 |
| skill-variant-splitting | 3 | 0 |

The `--usefulness` flag in `run-evals.sh` (lines 607-748) is well-implemented but can only score cases that include `usefulness_criteria`. For 8 skills, the only quality checks are structural regex patterns (`required_patterns`, `forbidden_patterns`, `min_output_lines`). This means 67% of skills have no semantic output quality testing — they can produce correct-looking but unhelpful output and still pass all gates.

This is distinct from F-006 (which covers misalignment between behavior.jsonl patterns and output contracts). F-036 is about the total absence of usefulness testing for most skills.

**Blast radius:** 8 skill packages' behavior.jsonl files, evaluation credibility for those skills.

**Plan:**
1. Add `usefulness_criteria` to at least 1 behavior case per skill for the 8 uncovered skills.
2. For each skill, the criteria should test the core value proposition:
   - skill-adaptation: "Does the adapted skill preserve functional identity while changing environment-specific details?"
   - skill-anti-patterns: "Does the report identify genuine anti-patterns with severity ratings and specific citations?"
   - skill-benchmarking: "Does the comparison use consistent methodology and produce a clear winner recommendation?"
   - skill-catalog-curation: "Does the audit identify real duplicates/gaps with actionable remediation?"
   - skill-lifecycle-management: "Does the transition follow documented criteria and produce correct state changes?"
   - skill-safety-review: "Does the review identify actual safety hazards with severity and remediation?"
   - skill-testing-harness: "Are generated test cases realistic, diverse, and testing distinct scenarios?"
   - skill-variant-splitting: "Are the split variants genuinely orthogonal with clear boundaries?"
3. Run `./scripts/run-evals.sh --usefulness --all` to verify the new criteria work.

**Risks:** Usefulness criteria are subjective — different judge models may score differently. Use USEFULNESS_MODEL to avoid self-evaluation bias. Rollback: `git checkout */evals/behavior.jsonl`.
**Effort:** M (2–3 hours for all 8 skills)

**Citations:** All 12 `*/evals/behavior.jsonl` files; `scripts/run-evals.sh:607-748` (usefulness implementation)

---

## F-037 1024-Character Description Limit Not Taught in Skill-Creator — **Valid (Medium)**

**Review claims (D-2):** Neither `skill-creator/SKILL.md` nor any validation script enforces or mentions the 1024-character description limit from the Agent Skills specification.

**Why:** Partially valid. The review is wrong that no script checks — `check_skill_structure.py:155-156` does check `len(desc_val) > 1024` and adds a warning. However:

1. The check is a **non-blocking warning** — it doesn't reduce the 10-point score or cause a validation failure. A skill with a 2000-char description would still score 10/10.
2. `skill-creator/SKILL.md` does NOT mention the 1024 limit anywhere. Phase 2 Step 3 (frontmatter template, lines 70-79) shows the `description` field but gives no length guidance.
3. All 12 current descriptions are well under the limit (largest: skill-safety-review at 736 chars), so the gap hasn't caused problems yet.
4. Per [agentskills.io spec](https://agentskills.io/skill-creation/optimizing-descriptions): the 1024-char limit is a hard specification constraint.

**Blast radius:** `skill-creator/SKILL.md` (teaching gap), `check_skill_structure.py` (unenforced check), any externally-targeted skill created using skill-creator.

**Plan:**
1. Add description length guidance to `skill-creator/SKILL.md` Phase 2 Step 3 (around line 75): "Keep the description under 1024 characters (hard limit per the Agent Skills specification). Current repo skills average ~530 chars."
2. Upgrade the `check_skill_structure.py:155-156` warning to a scored check: add a `"description_length"` key to `checks` dict with pass/fail, and adjust max_score accordingly.
3. Alternatively: keep as warning but add it to `validate-skills.sh` output so it's visible during validation runs.

**Risks:** Upgrading to a scored check changes the 10-point scale to 11 points. Rollback: `git revert`.
**Effort:** S (1 hour)

**Citations:** `check_skill_structure.py:155-156`; `skill-creator/SKILL.md:70-79`; `scripts/validate-skills.sh` (no description length in output)

---

## F-038 Missing --help Flags in validate-skills.sh and run-regression-suite.sh — **Valid (Low)**

**Review claims (SC-1):** Two scripts lack `--help` flags. Per agentskills.io: "`--help` output is the primary way an agent learns your script's interface."

**Why:** Confirmed. `scripts/validate-skills.sh` has no `--help` flag and no usage function (grep returns zero matches for `help`, `usage`, `-h`). `scripts/run-regression-suite.sh` has a comment header `# Usage:` at line 8 but no runtime `--help` flag parser. All 13 other scripts in the repo support `--help` or have usage functions.

**Blast radius:** Agent discoverability — an agent invoking `validate-skills.sh --help` or `run-regression-suite.sh --help` would get either an error or unexpected behavior instead of usage instructions.

**Plan:**
1. Add a `show_help()` function and `--help`/`-h` flag parsing to both scripts, following the pattern in `run-evals.sh:85-107`.
2. Include: purpose, usage syntax, examples, environment variables, exit codes.

**Risks:** None — additive change. Rollback: `git revert`.
**Effort:** XS (30 min)

**Citations:** `scripts/validate-skills.sh` (zero matches for help/usage); `scripts/run-regression-suite.sh:8` (comment only, no runtime flag)

---

## Task 6 Enhancement Recommendations (Not Assigned F-Numbers)

The following review observations are legitimate gaps relative to agentskills.io best practices but represent new feature development rather than fixes to existing functionality:

| Review ID | Topic | Assessment | Priority |
|-----------|-------|------------|----------|
| E-2 | Token/cost tracking (`timing.json`) | agentskills.io recommends capturing `total_tokens` and `duration_ms`. No tracking exists in the repo. Would help identify expensive evals and detect token regressions. | Nice-to-have |
| E-3 | Iteration workspace structure | agentskills.io recommends `iteration-N/` directories. Repo uses flat timestamped files. Makes iteration comparison difficult but doesn't break anything. | Nice-to-have |
| S-1 | skill-creator could extract Phase 2 to references/ | At 328 lines with only 1 reference file, more progressive disclosure is possible. Not a bug — readability suggestion. | Nice-to-have |
| S-2 | Conditional reference loading | Both skill-creator and skill-improver use generic "see references/" pointers instead of conditional "Read X if [condition]" patterns. | Nice-to-have |
| SC-2 | Sync manifest has no reverse-check | `sync-to-skills.sh --check` verifies existing mappings but doesn't detect new script references in SKILL.md files not yet in the manifest. | Low |
| B-1 | Some skills include explanatory text agent already knows | Minor context waste in skill-evaluation (line 16) and skill-lifecycle-management (lines 38-60). | Low |
| IM-1 | skill-improver diagnosis table over-maps usefulness failures | "Usefulness score < 3/5 → prompt-blob syndrome" conflates multiple possible causes. The judge rationale provides better diagnosis. | Low |
| DOC-1 | README script table doesn't list Python utils | Intentional (high-level view) but could confuse users. | Informational |
| SR-1 | skill-safety-review has longest description (736 chars) | Still under 1024 limit. Could be trimmed but not required. | Informational |

---

## Task 6 Priority Summary

| Priority | ID | Title | Effort | Blocked By |
|----------|----|-------|--------|------------|
| P2 Medium | F-036 | Usefulness criteria coverage gap (8/12 skills) | M | None |
| P2 Medium | F-037 | 1024-char description limit not taught/enforced | S | None |
| P3 Low | F-038 | Missing --help in 2 scripts | XS | None |

**Recommended execution order:**
1. F-036 — highest impact: enables semantic quality testing for 8 more skills
2. F-037 — spec compliance: teach the limit and enforce it in scoring
3. F-038 — quick fix: add --help to 2 scripts

---

## Cumulative Finding Count (Tasks 1–6)

| Task | Source | New | Already Logged | By-Design/Invalid | Running Total |
|------|--------|-----|----------------|-------------------|---------------|
| 1 | Annex A | 19 | — | 1 invalid (F-016) | 19 |
| 2 | Annex C | 5 | 6 | 1 by-design (F-024) | 24 |
| 3 | Annex B | 3 | 10 | 1 by-design | 27 |
| 4 | Annex D | 5 | 3 | — | 32 |
| 5 | Annex E | 3 | 11 | — | 35 |
| 6 | Annex F | 3 | 6 | 1 by-design (D-1) | 38 |

**Total unique findings: 38** (F-001 through F-038). 34 valid actionable, 2 by-design, 1 invalid, 1 low/optional.

---

# Task 7/9 — Annex G: Library Management Skill Review

**Source:** `tasks/reviews/2026-03-20-meta-skill-engineering/7.md` (502 lines)
**Validated:** 2026-03-20
**Summary:** 7 findings focused on skill-catalog-curation and skill-lifecycle-management — 4 already logged, 3 new. Top risks: lifecycle vocabulary mismatch, over-aggressive category merge heuristic, fallback inference incompatible with repo rules.

### Cross-references to already-logged findings

| Review Finding # | Topic | Existing Finding |
|-----------------|-------|-----------------|
| 1 | Missing lifecycle index and catalog-state artifact | F-010 |
| 2 | Wrong archive path (ARCHIVE/ vs archive/) | F-011 |
| 3 | Behavior evals don't match output contracts | F-006 (additional evidence below) |
| 4 | Catalog-curation claims unsupported metadata/tag/index | F-009 |

### Additional evidence for F-006 (behavior eval misalignment)

The review provides concrete section-level mismatches for both library-management skills that strengthen F-006:

**skill-catalog-curation:**
- Output contract (`SKILL.md:71-105`) requires: `Inventory`, `Duplicates / Overlaps`, `Category Issues`, `Discoverability Gaps`, `Deprecation Candidates`, `Prioritized Actions`
- Behavior evals check for: `Scan results`, `Duplicates`, `Recommendations`, `Index`, `Categories`, `Naming audit`
- Mismatch: 4 of 6 contract sections have no eval coverage. Eval checks for `Naming audit` and `Index` which are not in the contract at all.

**skill-lifecycle-management:**
- Output contract (`SKILL.md:113-163`) requires: `State Summary`, `Recommended Transitions`, `Dependency Impact`, `Actions`
- Behavior evals check for: `Current state`, `Promotion criteria`, `Decision`, `Updated metadata`, `Deprecation notice`, `Migration`, `Updated state`, `Maturity audit`, `Summary`
- Mismatch: `Updated metadata` is explicitly banned by the repo's two-field frontmatter rule (`AGENTS.md:69-78`). 3 of 4 contract sections use different names in evals.

---

## F-039 Lifecycle Fallback Inference Incompatible With Repo Rules — **Valid (Medium)**

**Review claims (Finding 5):** The lifecycle skill's fallback logic — "has evals → beta; passes evaluation → stable; no evals → draft" — conflicts with the repo rule that every skill package must include an evals/ directory.

**Why:** Confirmed. `skill-lifecycle-management/SKILL.md:169` defines fallback inference:
```
| Skills with unknown lifecycle state | Infer from evidence (has evals → beta; passes evaluation → stable; no evals → draft) and record in lifecycle index |
```

But `AGENTS.md:35-42` mandates: "Every skill package should include an `evals/` directory with these files: trigger-positive.jsonl, trigger-negative.jsonl, behavior.jsonl". `.github/copilot-instructions.md:25-29` reiterates: "Each skill has an `evals/` directory with exactly these JSONL files."

Since every active skill in the repo is required to have evals/, the "no evals → draft" branch is unreachable — all 12 skills have evals. The discriminator reduces to "has evals" (always true, → beta) and "passes evaluation" (→ stable). This means the fallback logic either classifies everything as beta or stable, never draft. The heuristic is not grounded in repo reality.

**Blast radius:** `skill-lifecycle-management/SKILL.md` (failure handling), lifecycle inference accuracy.

**Plan:**
1. Replace the eval-presence heuristic with a more meaningful fallback. Options:
   - Use eval pass rates: "eval gate pass rate ≥ 80% → stable; eval gate pass rate < 80% → beta; no eval results yet → draft"
   - Use repo signals: "has been reviewed by skill-safety-review → stable; has eval results → beta; no eval results → draft"
2. Update `skill-lifecycle-management/SKILL.md:169` with the chosen heuristic.
3. Ensure the fallback references artifacts that actually exist (eval-results/ reports, not evals/ directory presence).

**Risks:** Changing the heuristic alters lifecycle classification. Rollback: `git checkout skill-lifecycle-management/SKILL.md`.
**Effort:** XS (30 min)

**Citations:** `skill-lifecycle-management/SKILL.md:169`; `AGENTS.md:35-42`; `.github/copilot-instructions.md:25-29`

---

## F-040 Catalog-Curation Category Merge Threshold Too Aggressive — **Valid (Medium)**

**Review claims (Finding 6):** The category merge rule "categories with ≤ 2 skills → propose merge into a neighbor" would pressure the repo to collapse intentionally distinct groups.

**Why:** Confirmed. `skill-catalog-curation/SKILL.md:47` instructs: "Categories with ≤ 2 skills → propose merge into a neighbor."

The repo's own category taxonomy (`README.md:63-85`) defines 5 categories. Four of them meet or violate this threshold:
- **Safety**: 1 skill (skill-safety-review) — below threshold
- **Creation & Improvement**: 2 skills — at threshold
- **Library Management**: 2 skills — at threshold
- **Transformation**: 2 skills — at threshold

Only **Quality & Testing** (5 skills) is safely above. Applying this rule would recommend merging 4 of 5 categories, collapsing the taxonomy from 5 categories to ~2. These categories represent genuinely distinct capability areas (safety auditing is not the same as library management), so merging them would harm discoverability rather than improve it.

Per agentskills.io best practices: skills should represent coherent task boundaries, not arbitrary size targets.

**Blast radius:** `skill-catalog-curation/SKILL.md` (procedure), catalog audit recommendations.

**Plan:**
1. Remove or soften the ≤ 2 merge threshold at `skill-catalog-curation/SKILL.md:47`.
2. Replace with a qualitative criterion: "Flag categories with only 1 skill for review — consider whether the skill truly needs its own category or whether it fits naturally in an existing one. Do not merge categories that represent distinct capability areas solely based on count."
3. Alternatively, lower the threshold to ≤ 1 (only flag singleton categories).

**Risks:** Relaxing the threshold may allow category proliferation. Rollback: `git checkout skill-catalog-curation/SKILL.md`.
**Effort:** XS (15 min)

**Citations:** `skill-catalog-curation/SKILL.md:47`; `README.md:63-85` (4 of 5 categories at or below threshold)

---

## F-041 Incompatible Lifecycle Vocabularies Between Curation and Lifecycle Skills — **Valid (Medium)**

**Review claims (Finding 7):** The two library-management skills use different lifecycle state vocabularies, making the pipeline handoff lossy.

**Why:** Confirmed. `skill-lifecycle-management/SKILL.md:37-43` defines 5 lifecycle states: `draft`, `beta`, `stable`, `deprecated`, `archived`.

`skill-catalog-curation/SKILL.md:78-80` (output contract, Inventory section) only uses 3 states: `<draft: N, stable: N, deprecated: N>`.

Missing from curation output: `beta` and `archived`. This means:
1. A curation report cannot represent beta-state skills — they would be classified as either draft or stable.
2. Archived skills are invisible in curation reports, despite being relevant for the deprecation → archival flow.
3. When curation hands off to lifecycle management, the lifecycle skill receives an incomplete picture of current states.

The two skills are the only members of the library-management pipeline. Their data models should be compatible.

**Blast radius:** `skill-catalog-curation/SKILL.md` (output contract), library-management pipeline handoff.

**Plan:**
1. Update `skill-catalog-curation/SKILL.md:80` to include all 5 lifecycle states:
   ```
   - By maturity: <draft: N, beta: N, stable: N, deprecated: N, archived: N>
   ```
2. Update the corresponding behavior.jsonl to include `beta` and `archived` in required_patterns for the inventory case.
3. Verify the handoff: curation output should use the same 5-state vocabulary that lifecycle management expects.

**Risks:** Minimal — additive change to output contract. Rollback: `git checkout skill-catalog-curation/SKILL.md`.
**Effort:** XS (15 min)

**Citations:** `skill-lifecycle-management/SKILL.md:37-43` (5 states); `skill-catalog-curation/SKILL.md:78-80` (3 states)

---

## Task 7 Priority Summary

| Priority | ID | Title | Effort | Blocked By |
|----------|----|-------|--------|------------|
| P2 Medium | F-041 | Incompatible lifecycle vocabularies | XS | None |
| P2 Medium | F-040 | Category merge threshold too aggressive | XS | None |
| P2 Medium | F-039 | Lifecycle fallback inference incompatible with repo rules | XS | None |

**Recommended execution order:**
1. F-041 first — vocabulary alignment is prerequisite for a working pipeline handoff
2. F-040 — fix the merge heuristic to avoid destructive category merges
3. F-039 — fix fallback inference to use meaningful signals

All three are quick fixes that collectively close the library-management pipeline gaps identified alongside F-009, F-010, and F-011 from Task 1.

---

## Cumulative Finding Count (Tasks 1–7)

| Task | Source | New | Already Logged | By-Design/Invalid | Running Total |
|------|--------|-----|----------------|-------------------|---------------|
| 1 | Annex A | 19 | — | 1 invalid (F-016) | 19 |
| 2 | Annex C | 5 | 6 | 1 by-design (F-024) | 24 |
| 3 | Annex B | 3 | 10 | 1 by-design | 27 |
| 4 | Annex D | 5 | 3 | — | 32 |
| 5 | Annex E | 3 | 11 | — | 35 |
| 6 | Annex F | 3 | 6 | 1 by-design (D-1) | 38 |
| 7 | Annex G | 3 | 4 | — | 41 |

**Total unique findings: 41** (F-001 through F-041). 37 valid actionable, 2 by-design, 1 invalid, 1 low/optional.

---

# Task 8/9 — Annex H: Comprehensive Audit Report (agentskills.io + Reference Comparison)

**Source:** `tasks/reviews/2026-03-20-meta-skill-engineering/8.md` (531 lines)
**Validated:** 2026-03-20
**Summary:** 10 remediation items across 7 distinct findings — 8 already logged, 2 new (both low severity). Top risks: all previously identified. This review is the most thorough single-pass audit and largely confirms the finding inventory from Tasks 1–7.

### Cross-references to already-logged findings

| Review Section | Topic | Existing Finding(s) |
|---------------|-------|-------------------|
| 3.1 [CRITICAL] | Precision/recall inverted in run-evals.sh | F-028 |
| 3.2 [HIGH] | Threshold inconsistency (95/90 vs 80) | F-029 |
| 3.3 [HIGH] | Stale archived skill references in eval files | F-014 |
| 3.4 [MEDIUM] | Layer 2 corpus eval manual-only | F-020 |
| 3.5 [MEDIUM] | quick_validate.py not in sync manifest | F-019 (additional context) |
| 3.6 [LOW] | Behavior test coverage + usefulness gap | F-036 + F-006 |
| §2.3 skill-creator | Next-steps ordering discrepancy | F-030 |
| §2.3 skill-testing-harness | Script path assumption | F-003 |
| §4.4 | validate-skills.sh should check better_skill | F-014 (part of remedy) |
| §9 P2-4 | Add quick_validate.py to manifest or remove | F-019 |

### Additional context for existing findings

**F-019 (quick_validate.py):** The review confirms this script is also absent from the sync manifest (`scripts/sync-to-skills.sh:22-32`). Currently no skill references it, so the missing manifest entry is a secondary concern — the primary issue remains the 4 stale frontmatter fields. Resolution of F-019 (fix or remove the script) will inherently resolve the manifest gap.

**F-014 (stale archived refs):** The review provides the exact line-by-line inventory of all 7 stale references across 6 files and recommends extending `validate-skills.sh` to scan `better_skill` fields. This validator extension should be part of the F-014 remediation plan.

**F-036 (usefulness coverage):** The review notes that the `--usefulness` mode is "effectively a no-op for 11 of 12 skills" — only `skill-creator` has usefulness_criteria (2/3 cases). My Task 6 data shows 4/12 skills actually have usefulness_criteria (skill-creator: 2/3, skill-evaluation: 2/3, skill-improver: 2/4, skill-trigger-optimization: 2/3). The review undercounts, but the core observation is valid — 8/12 skills are uncovered.

### Positive confirmations

The review confirms several repo strengths not captured in findings:

- All 12 skills pass structural checker at 10/10
- All descriptions are under 1024 chars and use imperative phrasing
- Cross-references form a coherent, non-circular graph
- Multi-run majority voting formula is correct: `MAJORITY_THRESHOLD=$(( (RUNS + 1) / 2 ))`
- 60/40 train/test split interleaving preserves category diversity
- eval-driven diagnosis table in skill-improver is "the kind of concrete, actionable guidance that elevates the skill above generic advice"
- MSE skill-creator is better scoped than the reference Anthropic skill-creator (which overloads creation + improvement + benchmarking and lacks negative boundaries)

---

## F-042 Description Extraction in run-trigger-optimization.sh Is Fragile — **Valid (Low)**

**Review claims (3.7):** The description extraction uses a 7-stage sed pipeline that assumes `>-` folded block scalar format. If a description uses a different valid YAML format (plain scalar, quoted string, `|` block), extraction fails silently.

**Why:** Confirmed. `scripts/run-trigger-optimization.sh:299`:
```bash
CURRENT_DESC=$(sed -n '/^---$/,/^---$/p' "$SKILL_MD" | grep -A 100 'description:' | \
  tail -n +1 | sed '/^---$/d' | sed '/^name:/d' | sed 's/^  //' | tr '\n' ' ' | \
  sed 's/description: *>- *//' | sed 's/description: *//' | xargs)
```

This pipeline: (1) extracts frontmatter between `---` markers, (2) greps for `description:`, (3) removes `---` and `name:` lines, (4) strips leading spaces, (5) joins lines, (6) strips `description: >- ` prefix, (7) trims whitespace.

The `sed 's/description: *>- *//'` specifically handles `>-` format. All 12 current descriptions use `>-`, so this works today. But if a description were written as `description: "A quoted string"` or `description: |`, the pipeline would either fail to strip the format indicator or mangle the content. The Python-based patching later in the script (around line 470) uses regex substitution rather than a YAML parser, compounding the fragility.

**Blast radius:** `scripts/run-trigger-optimization.sh` — only affects trigger optimization workflow.

**Plan:**
1. Replace the sed pipeline at line 299 with a Python YAML extraction:
   ```bash
   CURRENT_DESC=$(python3 -c "
   import yaml, sys
   with open('$SKILL_MD') as f:
       text = f.read().split('---')
       if len(text) >= 3:
           fm = yaml.safe_load(text[1])
           print(fm.get('description', ''))
   ")
   ```
2. Replace the regex-based frontmatter patching (around line 470) with a proper YAML load/modify/dump cycle.
3. The project already uses Python 3 for `check_skill_structure.py`, so `import yaml` is available.

**Risks:** Minimal — improves robustness. If `pyyaml` is not installed, the Python call would fail. Rollback: `git checkout scripts/run-trigger-optimization.sh`.
**Effort:** S (1 hour)

**Citations:** `scripts/run-trigger-optimization.sh:299,470-535`

---

## F-043 skill-catalog-curation Missing Variant-Splitting Boundary — **Valid (Low)**

**Review claims (§5.4):** `skill-catalog-curation` does not mention `skill-variant-splitting` in its "When NOT to use" section. A user wanting to "clean up" a broad skill could invoke catalog curation when variant splitting is the correct tool.

**Why:** Confirmed. `skill-catalog-curation/SKILL.md:23-27` lists three alternatives:
```
- Improving or refining a single skill → skill-improver
- Creating a new skill from scratch → skill-creator
- Promoting, deprecating, or archiving individual skills → skill-lifecycle-management
```

Missing: a boundary for "splitting a broad skill into focused variants → skill-variant-splitting." The confusion scenario is specific (user says "this skill catalog has a bloated skill, clean it up" → routes to catalog-curation instead of variant-splitting), but it's a valid routing edge case. Other skills like skill-creator and skill-improver already include variant-splitting as a boundary.

**Blast radius:** `skill-catalog-curation/SKILL.md` — minor routing edge case.

**Plan:**
1. Add to `skill-catalog-curation/SKILL.md:27`:
   ```
   - Splitting a broad skill into focused variants → `skill-variant-splitting`
   ```
2. Optionally add a corresponding trigger-negative entry for a prompt like "This skill in the catalog is too broad, split it into variants."

**Risks:** None — additive boundary. Rollback: `git checkout skill-catalog-curation/SKILL.md`.
**Effort:** XS (10 min)

**Citations:** `skill-catalog-curation/SKILL.md:23-27`; comparison with `skill-creator/SKILL.md:8-11` and `skill-improver/SKILL.md:24-28` (both include variant-splitting boundary)

---

## Task 8 Priority Summary

| Priority | ID | Title | Effort | Blocked By |
|----------|----|-------|--------|------------|
| P3 Low | F-042 | Description extraction fragile in trigger-opt script | S | None |
| P3 Low | F-043 | Catalog-curation missing variant-splitting boundary | XS | None |

**Recommended execution order:**
1. F-043 first — trivial additive change, closes a routing edge case
2. F-042 — robustness improvement, not urgent since all current descriptions use `>-`

### Review Meta-Assessment

This is the most comprehensive single-pass audit across all annexes. It confirms the overall pattern: the repo is structurally excellent (9/10 format compliance) but has systemic evaluation reliability issues. The comparison to the reference Anthropic skill-creator validates MSE's architectural decisions (separate skills, clear boundaries, JSONL format). No new critical or high-severity findings — the remaining gaps are all at the margins.

---

## Cumulative Finding Count (Tasks 1–8)

| Task | Source | New | Already Logged | By-Design/Invalid | Running Total |
|------|--------|-----|----------------|-------------------|---------------|
| 1 | Annex A | 19 | — | 1 invalid (F-016) | 19 |
| 2 | Annex C | 5 | 6 | 1 by-design (F-024) | 24 |
| 3 | Annex B | 3 | 10 | 1 by-design | 27 |
| 4 | Annex D | 5 | 3 | — | 32 |
| 5 | Annex E | 3 | 11 | — | 35 |
| 6 | Annex F | 3 | 6 | 1 by-design (D-1) | 38 |
| 7 | Annex G | 3 | 4 | — | 41 |
| 8 | Annex H | 2 | 8 | — | 43 |

**Total unique findings: 43** (F-001 through F-043). 39 valid actionable, 2 by-design, 1 invalid, 1 low/optional.

---

# Task 9/9 — Annex I: Full Repository Review

**Source:** `tasks/reviews/2026-03-20-meta-skill-engineering/9.md` (1381 lines)
**Scope:** Comprehensive full-repository review covering all scripts, all 12 active skills, corpus, flows, reference files, and evaluation system effectiveness rating.

## Summary

**47 raw findings** across scripts (13), skills (12), references (2), flows (3), evaluation system (4), and priorities (12). After cross-referencing against F-001 through F-043:

- **4 genuinely new findings** (F-044 through F-047)
- **35 already logged** (map directly to existing F-xxx)
- **1 invalid** (CRLF — zip-export artifact, not a repo issue)
- **1 uncertain** (validate-skills.sh hang — environment-specific, not reproducible)
- **6 confirmations** of existing findings with additional evidence

## Cross-Reference Table

| Review Item | Maps To | Status |
|-------------|---------|--------|
| CRLF line endings in scripts | — | **Invalid** (repo uses LF; `.gitattributes:2` `* text=auto`; hex confirms `0a` not `0d0a`) |
| validate-skills.sh hang/timeout | — | **Uncertain** (reviewer saw hang on CRLF-normalized copy; not reproducible with native LF) |
| skill-testing-harness stale Step 4 (expected_files, min_cases) | F-001 | Already logged |
| category vs better_skill schema conflict | F-002 | Already logged |
| Per-skill script REPO_ROOT wrong | F-003, F-004, F-005 | Already logged |
| Behavior.jsonl under-checks output contracts | F-006 | Already logged |
| skill-evaluation handoff section gap | F-007 | Already logged |
| skill-improver manifest references | F-008 | Already logged |
| skill-catalog-curation abstract governance | F-009 | Already logged |
| skill-lifecycle-management missing lifecycle index | F-010 | Already logged |
| skill-benchmarking overclaims token/win-rate | F-012 | Already logged |
| run-trigger-optimization mutates SKILL.md | F-015 | Already logged |
| skill-adaptation under-specifies support layers | F-017 | Already logged |
| skill-variant-splitting output stops at report | F-018 | Already logged |
| quick_validate.py stale frontmatter allowance | F-019 | Already logged |
| Corpus Layer 2 manual-only | F-020 | Already logged |
| Regression cases not executable by runner | F-031 | Already logged (combines F-021 + F-031) |
| harvest_failures.py broken loop | F-027 | Already logged |
| Precision/recall labels inverted | F-028 | Already logged |
| Threshold inconsistency 95/90 vs 80 | F-029 | Already logged |
| Baseline comparison not implemented | F-033 | Already logged |
| Usefulness criteria gap (8/12 skills) | F-036 | Already logged |
| run-meta-skill-cycle hardcoded model | F-032 | Already logged |
| Lifecycle fallback inference unreachable | F-039 | Already logged |
| run-full-cycle hardcodes 2 meta-skills | F-022 | Already logged |
| README safety→lifecycle edge missing | F-023 | Already logged |
| skill-creator procedure ordering conflict | F-030 | Already logged |
| Category merge threshold too aggressive | F-040 | Already logged |
| Vocabulary mismatch curation→lifecycle | F-041 | Already logged |
| Description extraction fragile sed | F-042 | Already logged |
| Missing variant-splitting boundary in curation | F-043 | Already logged |
| skill-evaluation missing anti-patterns route | F-035 | Already logged |
| 1024-char limit not taught | F-037 | Already logged |
| "Do NOT use when" prose wording drift (6 skills) | — | **NEW → F-044** |
| skill-variant-splitting stale "overlays" language | — | **NEW → F-045** |
| skill-creator/references/schemas.md broader artifacts | — | **NEW → F-046** |
| run-evals.sh strict mode coarseness | — | **NEW → F-047** |

---

## F-044 Cross-Skill "Do NOT Use When" Prose Wording Drift — **Valid (Low)**

**Why:** Six skills reference the "When NOT to use" section using the phrase "Do NOT use when" in prose text. The canonical heading is `# When NOT to use` (per AGENTS.md:73), but prose instructions tell agents to look for "Do NOT use when" — an agent following skill-evaluation's guidance literally would search for a section that doesn't exist under that name.

**Affected files (8 occurrences across 6 skills):**
- `skill-adaptation/SKILL.md:55` — `"Do NOT use when" boundaries — these define the skill's identity`
- `skill-anti-patterns/SKILL.md:87` — `AP-7: Missing "Do NOT use when" section`
- `skill-anti-patterns/SKILL.md:89` — `Format: "Do NOT use when [scenario]..."`
- `skill-creator/SKILL.md:104` — `confusion cases as "Do NOT use when:"`
- `skill-evaluation/SKILL.md:77` — `Read the skill's "Do NOT use when" section`
- `skill-testing-harness/SKILL.md:36` — `Negative cases from "Do NOT use when" section`
- `skill-testing-harness/SKILL.md:75` — `Prompts that directly mirror a "Do NOT use when" bullet`
- `skill-variant-splitting/SKILL.md:72` — `Each variant's "Do NOT use when" references siblings`

**Plan:**
1. Replace all 8 occurrences: `"Do NOT use when"` → `"When NOT to use"` in prose references
2. For AP-7 in skill-anti-patterns, update the anti-pattern name to match: `AP-7: Missing "When NOT to use" section`
3. For skill-creator line 104, update the template guidance
4. Run `scripts/validate-skills.sh` to confirm no structural breakage

**Risks:** Minimal — prose-only changes, no heading modifications.
**Effort:** XS (~15 min)
**Citations:** `skill-adaptation/SKILL.md:55`; `skill-anti-patterns/SKILL.md:87,89`; `skill-creator/SKILL.md:104`; `skill-evaluation/SKILL.md:77`; `skill-testing-harness/SKILL.md:36,75`; `skill-variant-splitting/SKILL.md:72`; `AGENTS.md:73` (canonical heading)

---

## F-045 Skill-variant-splitting Stale "Overlays" Language — **Valid (Low)**

**Why:** `skill-variant-splitting/SKILL.md:28` uses "overlays" as a concept in its "When NOT to use" section: `Variations are minor enough for overlays`. Overlays were part of the pre-archive distribution architecture and are no longer an active concept in the internal-only repo. This gives agents a false alternative path.

**Validation evidence:**
- `skill-variant-splitting/SKILL.md:28` — `- Variations are minor enough for overlays`
- No `overlay` concept exists in any active skill, script, or doc
- `archive/` contains distribution-era artifacts; overlays were retired with them

**Plan:**
1. Replace line 28: `- Variations are minor enough for overlays` → `- Variations are minor enough to handle with conditional logic in one skill`
2. Verify no other active references to "overlays" remain: `grep -r overlay skill-*/SKILL.md`

**Risks:** None — single line in "When NOT to use" section.
**Effort:** XS (~5 min)
**Citations:** `skill-variant-splitting/SKILL.md:28`

---

## F-046 Skill-creator References Document Non-Active Eval Artifacts — **Valid (Medium)**

**Why:** `skill-creator/references/schemas.md` documents four JSON artifact schemas (`history.json`, `grading.json`, `timing.json`, `benchmark.json`) that are not part of the active canonical eval system. The active system uses only three JSONL files (`trigger-positive.jsonl`, `trigger-negative.jsonl`, `behavior.jsonl`). A skill-creator invocation following this reference will produce artifacts the eval runner cannot consume, recreating eval-system drift.

**Validation evidence:**
- `skill-creator/references/schemas.md:30` — `## history.json` (Improve mode tracking)
- `skill-creator/references/schemas.md:77` — `## grading.json` (grader agent output)
- `skill-creator/references/schemas.md:188` — `## timing.json` (wall clock timing)
- `skill-creator/references/schemas.md:210` — `## benchmark.json` (Benchmark mode output)
- None of these 4 artifacts are referenced in `scripts/run-evals.sh`, `AGENTS.md`, or `.github/copilot-instructions.md`
- The JSONL eval section (lines 1-27) IS correctly aligned with the active contract

**Plan:**
1. Add a clear header after the JSONL section: `## Future / Optional Artifacts` with a note that these are not part of the current active eval system
2. Or move them to a separate `schemas-future.md` reference file
3. Preferred: option 1 (simpler, preserves content for future use)

**Risks:** Low — reference file only, not the SKILL.md itself.
**Effort:** S (~20 min)
**Citations:** `skill-creator/references/schemas.md:30,77,188,210`; `AGENTS.md:44-64` (active eval contract)

---

## F-047 Run-evals.sh Strict Mode Removes ALL Custom Instructions — **Valid (Medium)**

**Why:** The `--strict` mode in `run-evals.sh` uses `--no-custom-instructions` (line 246) which disables ALL project-level instructions (AGENTS.md, copilot-instructions.md, and ALL SKILL.md files), not just the target skill being tested. This makes the differential comparison imprecise: it detects whether *any* custom instruction influenced the response, not whether the *specific target skill* was activated. A positive trigger result in strict mode could be caused by AGENTS.md guidance or a different skill entirely.

**Validation evidence:**
- `scripts/run-evals.sh:32-36` — Comment explicitly states: `--no-custom-instructions (disabling AGENTS.md and all project instructions)`
- `scripts/run-evals.sh:246` — `response_without=$(run_copilot_prompt "$prompt" --no-custom-instructions)`
- `scripts/run-evals.sh:248-256` — Differential check: if outputs differ >20% in character count, skill is considered "activated"
- The `copilot` CLI `--no-custom-instructions` flag is all-or-nothing; there is no per-skill disable

**Plan:**
1. Document this limitation in the script header comments and in `docs/evaluation-cadence.md`
2. Add a note in the `--strict` help text: `Note: disables ALL custom instructions, not just the target skill. Use --observe for per-skill detection.`
3. Consider adding `--observe` as a secondary check within strict mode: if strict says "activated" but observe doesn't find the specific SKILL.md file read, flag as "likely influenced by project instructions, not target skill"
4. Long-term: explore whether `copilot` CLI supports per-file instruction exclusion

**Risks:** Documentation-only changes are safe. Step 3 (hybrid check) adds complexity but improves accuracy.
**Effort:** S (~30 min for docs + help text), M (~2 hours for hybrid approach)
**Citations:** `scripts/run-evals.sh:32-36,246,248-256`

---

## Invalid / Uncertain Findings

### CRLF Line Endings in Scripts — **Invalid**

**Why invalid:** The reviewer noted CRLF line endings in the zip snapshot, but the actual Git repository uses LF endings. `.gitattributes:2` sets `* text=auto`, and hex inspection of `scripts/validate-skills.sh` confirms `0a` (LF) not `0d0a` (CRLF) byte sequences. This is a zip-export artifact, not a repository defect.

**Evidence:** `.gitattributes:2`; `xxd scripts/validate-skills.sh | head -5` shows `0a` terminators

### validate-skills.sh Hang / Timeout — **Uncertain**

**Why uncertain:** The reviewer reported the script "stalled/timed out" after normalizing line endings in a temp copy. In the actual repo (native LF), this is not reproducible. The script does contain loops with `python3 -c` subshell calls (lines 131-140) that theoretically could hang on malformed input, but there is no evidence this occurs under normal conditions. The reviewer's environment may have had additional factors (corrupted JSONL from line-ending normalization, Python path issues).

**Evidence:** `scripts/validate-skills.sh:131-140` (JSONL validation loop with python3 subshell)

---

## Task 9 Priority Summary

| Priority | ID | Title | Severity | Effort |
|----------|----|-------|----------|--------|
| P3 Low | F-044 | Cross-skill "Do NOT use when" prose wording drift | Low | XS |
| P3 Low | F-045 | Stale overlay language in variant-splitting | Low | XS |
| P2 Medium | F-046 | Creator reference schemas document non-active artifacts | Medium | S |
| P2 Medium | F-047 | Strict mode removes ALL custom instructions | Medium | S–M |

**Recommended execution order:**
1. F-044 first — mechanical find/replace across 6 files, fixes a routing confusion risk
2. F-045 — single-line edit, removes stale concept
3. F-046 — add "Future/Optional" header in reference file
4. F-047 — documentation first, hybrid approach later if needed

---

## Cumulative Finding Count (Tasks 1–9) — FINAL

| Task | Source | New | Already Logged | Invalid/Uncertain | Running Total |
|------|--------|-----|----------------|-------------------|---------------|
| 1 | Annex A: Active Skills | 19 | — | 1 invalid (F-016) | 19 |
| 2 | Annex C: Archive/Corpus/Flow | 5 | 6 | 1 by-design (F-024) | 24 |
| 3 | Annex B: Shared Tooling/Docs | 3 | 10 | 1 by-design | 27 |
| 4 | Annex D: Key Findings | 5 | 3 | — | 32 |
| 5 | Annex E: Executive Summary | 3 | 11 | — | 35 |
| 6 | Annex F: Comprehensive Report | 3 | 6 | 1 by-design (D-1) | 38 |
| 7 | Annex G: Library Management | 3 | 4 | — | 41 |
| 8 | Annex H: Comprehensive Audit | 2 | 8 | — | 43 |
| 9 | Annex I: Full Repository Review | 4 | 35 | 1 invalid + 1 uncertain | 47 |

---

# Final Summary — All 9 Review Annexes Complete

## Overall Statistics

- **47 unique findings** (F-001 through F-047)
- **42 valid actionable** findings requiring implementation
- **2 by-design** (working as intended)
- **1 invalid** (F-016: AP-14 metadata claim is about capability assumptions)
- **1 low/optional** (F-034: overlapping eval creation scope)
- **1 CRLF invalid** (zip artifact)
- **Across 9 annexes, 96 already-logged cross-references** were detected and deduplicated

## Severity Distribution

| Severity | Count | IDs |
|----------|-------|-----|
| **P0 Critical** | 4 | F-011, F-019, F-027, F-031 |
| **P1 High** | 9 | F-001, F-002, F-007, F-008, F-009, F-010, F-012, F-020, F-028, F-033 |
| **P2 Medium** | 22 | F-003–F-006, F-013, F-015, F-017, F-018, F-021–F-023, F-025, F-026, F-029, F-030, F-032, F-035–F-037, F-039–F-041, F-046, F-047 |
| **P3 Low** | 8 | F-014, F-034, F-038, F-042, F-043, F-044, F-045 |
| **Invalid/By-Design** | 4 | F-016, F-024, CRLF, validate-hang |

## Top Systemic Themes

1. **Eval contract drift** (F-001, F-002, F-006, F-019, F-031, F-046) — Schema mismatches between what skills teach, what scripts expect, and what docs say
2. **Broken regression pipeline** (F-021, F-027, F-031) — harvest→regress→rerun loop produces zero protection
3. **Overclaimed automation** (F-012, F-020, F-033, F-047) — Skills and docs describe capabilities the tooling doesn't implement
4. **Stale distribution-era concepts** (F-008, F-009, F-010, F-045) — Manifests, overlays, lifecycle indices from pre-archive era
5. **Metric mislabeling** (F-028, F-029) — Precision/recall inverted; threshold inconsistency

## Recommended Implementation Waves

**Wave 1 — Critical Fixes (4 items, ~4 hours):**
F-011 (ARCHIVE/ case), F-019 (quick_validate stale fields), F-027 (harvest regex), F-031 (regression JSON schema)

**Wave 2 — High-Priority Alignment (10 items, ~16 hours):**
F-001, F-002, F-007, F-008, F-009, F-010, F-012, F-028, F-033, F-020

**Wave 3 — Medium Cleanup (22 items, ~24 hours):**
F-003–F-006, F-013, F-015, F-017, F-018, F-021–F-023, F-025, F-026, F-029, F-030, F-032, F-035–F-037, F-039–F-041, F-046, F-047

**Wave 4 — Polish (8 items, ~4 hours):**
F-014, F-034, F-038, F-042, F-043, F-044, F-045

## Open Decisions (carried from Task 1)

1. **F-002:** Adopt `better_skill` in contract or migrate 96 entries to `category`?
2. **F-010:** Create lifecycle tracking mechanism or rewrite skill without persistent state?
3. **F-018:** Should skill-variant-splitting produce draft packages or only split plan?
4. **F-020:** Should Layer 2 invoke `copilot -p` directly behind `--layer2` flag?
5. **F-022:** Which additional meta-skills for full-cycle corpus eval?

## Reviewer's Overall Assessment (from Annex I)

> **Rating:** 7.7/10 for ordinary skill creation/testing; 5.8/10 for a serious end-state meta-skill benchmark system.
>
> "This is now a strong beta-quality internal meta-skill engineering repository, but not yet a fully complete or fully trustworthy end-state system. The repository is worth finishing."

This assessment aligns with the implementation findings: the architecture is sound, the structural compliance is excellent (12/12 skills pass validation), and the trigger-testing mindset is strong. The gaps are in eval reliability, regression protection, and documentation honesty about what is automated vs. manual.

---

# Addendum: Re-Verification Observations (2026-03-20T09:40Z)

## Verification Methodology

All 47 findings were re-verified against the live codebase using parallel exploration agents checking exact file paths, line numbers, and content. Every citation was confirmed accurate — no line-number drift detected since original logging.

## Corrections and Nuances Discovered

### 1. F-027 Severity Adjustment: Partial Break, Not Total Break

**Original assessment:** "The regex will **never match**, meaning zero trigger failures are ever harvested into regression cases."

**Corrected assessment:** The structured regex at line 33 never matches (confirmed), BUT there IS a fallback pattern at `harvest_failures.py:45-51`:
```python
m2 = re.search(r"FAIL[:\s]*(.*)", stripped)
if m2:
    failure["prompt"] = m2.group(1).strip().rstrip(".")
else:
    failure["prompt"] = stripped
failure["type"] = "trigger_failure"
failure["expected"] = "unknown"
failure["actual"] = "unknown"
```

This means failures ARE harvested, but with **degraded quality** — `expected` and `actual` are both `"unknown"`, and the category/prompt structured data is lost. The fix is still critical (structured data loss breaks downstream analysis), but the pipeline is "partially broken" rather than "completely broken."

### 2. F-008 Context: AGENTS.md Also Uses "Manifest"

**Nuance:** `AGENTS.md` itself uses "manifest" in 3 places (lines 27, 31, 133) — but there it refers to the `sync-to-skills.sh` internal script-to-skill mapping, NOT per-skill `manifest.yaml` distribution files. The ban at `AGENTS.md:67` is specifically: "Do not create `manifest.yaml` in skill packages." The fix for F-008 should distinguish between these two uses: remove references to per-skill `manifest.yaml` as a deliverable, but don't confuse the sync manifest (which is legitimate infrastructure).

### 3. F-015 Trap Is Inadequate (Worse Than Assessed)

**Nuance:** The existing trap at line 92 (`trap 'rm -rf "$TMPDIR"' EXIT`) is actually **counterproductive** in failure scenarios. If the script is killed between the SKILL.md patch (line 404) and restore (line 471), the trap fires and deletes `$TMPDIR` — which contains the only backup of the original SKILL.md. This means an interrupted run would leave SKILL.md modified AND destroy the backup. The enhanced trap in the plan addresses this by restoring SKILL.md before cleaning $TMPDIR.

### 4. F-007 Handoff Section Is Completely Orphaned

**Nuance:** Re-verification confirms the Handoff section is triply orphaned:
1. `skill-evaluation/SKILL.md:132-141` promises it as mandatory output
2. `scripts/run-evals.sh` never generates it (zero references to "Handoff")
3. `skill-improver/SKILL.md:120-127` describes reading eval results but parses generic gate data, not the structured Handoff format

The Handoff format (eval_report_path, primary_failure, failing_cases, recommended_next_skill) is a well-designed contract — the issue is that nobody produces or consumes it. Resolution should either implement it in the runner or acknowledge that `skill-improver` reads raw eval reports instead.

## Dependency Chain Analysis

Several findings form dependency chains where the order of implementation matters:

```
F-002 (schema decision) ──blocks──> F-001 (testing harness examples)
                                 └──> F-014 (archived skill refs)

F-010 (lifecycle state mechanism) ──blocks──> F-023 (safety→lifecycle edge)
                                           └──> F-039 (fallback inference)
                                           └──> F-041 (vocabulary alignment)

F-028 (metric labels) ──blocks──> F-029 (threshold documentation)

F-027 (harvest regex) ──combines with──> F-021 (trigger replay)
                      ──combines with──> F-031 (regression JSON schema)
  (All three must be fixed together to close the regression loop)

F-003 (run-evals.sh portability) ──shares pattern with──> F-004, F-005
  (Fix F-003 first, then sync resolves F-004 and F-005)
```

## Cross-Cutting Implementation Groups

For efficient implementation, findings should be batched by the files they touch:

### Group A: `scripts/run-evals.sh` (6 findings)
F-003 (REPO_ROOT), F-007 (add --handoff), F-028 (rename precision/recall), F-029 (document two-tier thresholds), F-033 (add --baseline), F-047 (document strict mode limitation)

### Group B: `skill-testing-harness/SKILL.md` (2 findings)
F-001 (stale schema), F-002 (better_skill → category decision)

### Group C: Regression pipeline (3 findings — must be done together)
F-027 (harvest regex), F-021 (trigger replay), F-031 (JSON schema)

### Group D: Library management skills (5 findings)
F-009 (curation metadata), F-010 (lifecycle index), F-039 (fallback inference), F-040 (merge threshold), F-041 (vocabulary)

### Group E: Root docs (3 findings)
F-025 (phantom dir), F-044 (prose wording drift), + update docs for any other changes

### Group F: Per-skill script portability (3 findings — one fix resolves all)
F-003, F-004, F-005 (fix root copy + sync)

### Group G: Distribution-era cleanup (3 findings)
F-008 (improver manifests), F-045 (variant-splitting overlays), F-046 (creator schemas)

## Risk Assessment: What Breaks If Nothing Is Fixed

The findings are not just documentation issues — several represent **silent failures** that produce false confidence:

1. **Regression suite reports PASS with 100% skip rate** (F-031): The suite runs, reports success, and gives the impression that all regression cases pass. In reality, every case is silently skipped due to schema mismatch. Anyone relying on regression results for quality assurance is making decisions based on non-data.

2. **Harvest produces degraded records** (F-027): The fallback masks the bug — failures appear in regression files but lack the structured data needed for meaningful replay or analysis. A human checking "are failures being harvested?" would see records and assume the pipeline works.

3. **Eval gate labels are misleading** (F-028): Teams discussing "precision" and "recall" are talking past each other — the numbers measure different things than the labels suggest. This erodes trust in the evaluation methodology when the mismatch is eventually discovered.

4. **check_preservation.py misses all top-level sections** (F-026): A skill modification that completely rewrites `# Purpose` or `# Output contract` would report 100% preservation. Anyone using preservation scoring to gate modifications is unprotected against the most important changes.

5. **Trigger optimization can corrupt SKILL.md on interrupt** (F-015): The trap deletes the backup before restoring the file. A Ctrl+C during optimization leaves a modified SKILL.md with no recovery path other than `git checkout`.
