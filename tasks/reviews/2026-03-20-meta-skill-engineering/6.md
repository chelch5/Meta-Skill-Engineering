# Meta-Skill-Engineering — Comprehensive Review Report

**Date**: 2026-03-20  
**Reviewer**: Copilot (Claude Opus 4.6)  
**Methodology**: Cross-referenced every skill, script, and document against the [Agent Skills specification](https://agentskills.io/) and its best-practice guides. All claims cite specific files and line numbers.

---

## Executive Summary

This repository contains 12 meta-skills for creating, improving, evaluating, and governing agent skills. The overall quality is **strong** — skills follow a consistent canonical format, the evaluation infrastructure is extensive, and the documentation is thorough. However, several gaps exist relative to the [agentskills.io best practices](https://agentskills.io/skill-creation/best-practices) and [evaluation guide](https://agentskills.io/skill-creation/evaluating-skills), and one script contradicts the repo's own rules.

**Overall Rating: 7.5/10**

| Category | Rating | Summary |
|----------|--------|---------|
| Skill structure & format | 9/10 | All 12 conform to canonical format, well under size limits |
| Description quality | 8/10 | Strong trigger phrases and boundaries; missing 1024-char limit enforcement |
| Best practices alignment | 7/10 | Good procedures and progressive disclosure; low reference usage |
| Script design | 8/10 | Non-interactive, structured output, dry-run support; 2 missing --help |
| Evaluation system | 7/10 | Excellent trigger testing; weak on iteration workflow and cost tracking |
| Pipeline & flow design | 8/10 | Clear handoffs; no automated chaining |
| Documentation accuracy | 8/10 | Consistent across 4 root docs; minor table gaps |

---

## 1. Skill Structure & Format Compliance

### 1.1 Canonical Format Adherence

All 12 skills follow the canonical structure defined in `AGENTS.md` lines 69-78:

| Check | Result | Evidence |
|-------|--------|----------|
| YAML frontmatter: name + description only | ✅ 12/12 | `validate-skills.sh` enforces; all pass |
| Required sections in order | ✅ 12/12 | Purpose → When to use → When NOT to use → Procedure → Output contract → Failure handling |
| Under 500 lines | ✅ 12/12 | Largest: skill-improver at 330 lines |
| Eval suite present | ✅ 12/12 | All have trigger-positive, trigger-negative, behavior JSONL |

### 1.2 Size Distribution

The [specification recommends](https://agentskills.io/skill-creation/best-practices) keeping SKILL.md under 500 lines and 5,000 tokens.

| Skill | Lines | Assessment |
|-------|-------|------------|
| skill-benchmarking | 117 | ✅ Well-scoped |
| skill-adaptation | 120 | ✅ Well-scoped |
| skill-safety-review | 123 | ✅ Well-scoped |
| skill-variant-splitting | 124 | ✅ Well-scoped |
| skill-trigger-optimization | 130 | ✅ Well-scoped |
| skill-catalog-curation | 135 | ✅ Well-scoped |
| skill-evaluation | 166 | ✅ Good |
| skill-anti-patterns | 174 | ✅ Good |
| skill-testing-harness | 178 | ✅ Good |
| skill-lifecycle-management | 180 | ✅ Good |
| skill-creator | 328 | ⚠️ Large — consider extracting more to references/ |
| skill-improver | 330 | ⚠️ Large — already uses references/ (4 files), acceptable |

**Finding S-1**: `skill-creator` (328 lines) has only 1 reference file (`references/schemas.md`). Its Phase 2 contains 7 detailed sub-steps that could be extracted to a reference. Compare with `skill-improver` (330 lines) which already offloads to 4 reference files. Per [best practices](https://agentskills.io/skill-creation/best-practices): "Move detailed reference material to separate files in `references/`... telling the agent _when_ to load each file."

### 1.3 Progressive Disclosure Usage

| Skill | references/ | scripts/ | Conditionally loaded? |
|-------|-------------|----------|-----------------------|
| skill-creator | 1 file | 4 files | No — Phase 6 says "see `references/schemas.md`" without a condition |
| skill-improver | 4 files | 2 files | Partially — Phase 3 says "see `references/resource-decision-guide.md`" |
| 10 other skills | 0 files | 0-3 files | N/A |

**Finding S-2**: Per [agentskills.io](https://agentskills.io/skill-creation/best-practices): "'Read `references/api-errors.md` if the API returns a non-200 status code' is more useful than a generic 'see references/ for details.'" Both skill-creator and skill-improver use the generic "see references/" pattern rather than conditional loading.

---

## 2. Description Quality

### 2.1 Compliance with agentskills.io Guidelines

The [optimizing descriptions guide](https://agentskills.io/skill-creation/optimizing-descriptions) recommends:
- Use imperative phrasing ("Use this skill when…")
- Focus on user intent, not implementation
- Err on being pushy — list contexts
- Under 1024 characters (hard limit per [spec](https://agentskills.io/specification))

| Skill | Chars | Imperative? | Trigger phrases? | Boundaries in desc? |
|-------|-------|-------------|-------------------|---------------------|
| skill-testing-harness | 300 | ✅ | ✅ 4 phrases | ✅ 3 alternatives |
| skill-catalog-curation | 329 | ✅ | ✅ 4 phrases | ✅ 3 alternatives |
| skill-benchmarking | 349 | ✅ | ✅ 3 phrases | ✅ 2 alternatives |
| skill-variant-splitting | 361 | ✅ | ✅ 3 phrases | ✅ 3 alternatives |
| skill-adaptation | 367 | ✅ | ✅ 3 phrases | ✅ 3 alternatives |
| skill-improver | 367 | ✅ | ✅ 4 phrases | ✅ 4 alternatives |
| skill-trigger-optimization | 382 | ✅ | ✅ 5 phrases | ✅ 2 alternatives |
| skill-creator | 383 | ✅ | ✅ 5 phrases | ✅ 4 alternatives |
| skill-anti-patterns | 393 | ✅ | ✅ 3 phrases | ✅ 4 alternatives |
| skill-lifecycle-management | 401 | ✅ | ✅ 6 phrases | ✅ 3 alternatives |
| skill-evaluation | 404 | ✅ | ✅ 5 phrases | ✅ 3 alternatives |
| skill-safety-review | 502 | ✅ | ✅ 4 phrases | ✅ 3 alternatives |

All descriptions are well under the 1024-character hard limit. All use imperative phrasing and include concrete trigger phrases. **This is excellent.**

### 2.2 Description Design Choice: Boundaries in Description

**Finding D-1**: All 12 skills embed "Do not use for X (use skill-Y)" boundaries directly in the `description` field. The agentskills.io spec defines the description as "when to use this skill" — negative boundaries are typically body content. However, for this repo where 12 similar meta-skills coexist, including boundaries in the description is a **smart routing optimization** — the agent sees them during discovery (before loading the body), reducing mis-routing between adjacent skills. This is an intentional design choice that works well for this use case.

### 2.3 Missing: 1024-Character Limit Enforcement

**Finding D-2**: Neither `skill-creator/SKILL.md` (the authoring skill) nor any validation script enforces or mentions the [1024-character description limit](https://agentskills.io/skill-creation/optimizing-descriptions) from the specification. `skill-creator` Step 3 (line 70-79) shows the frontmatter template but doesn't mention the limit. `check_skill_structure.py` validates description presence but not length. `quick_validate.py` line 61 does check `len(desc) > 1024` but this script contradicts other repo rules (see Finding X-1).

---

## 3. Best Practices Alignment

### 3.1 Patterns Used Well

Cross-referencing against the [patterns from agentskills.io](https://agentskills.io/skill-creation/best-practices):

| Pattern | Usage | Example |
|---------|-------|---------|
| Templates for output format | ✅ 12/12 skills | All have Output contract with markdown templates |
| Checklists for multi-step workflows | ✅ 4/12 | skill-creator (6 phases), skill-improver (7 phases), skill-evaluation (6 steps), skill-testing-harness (7 steps) |
| Validation loops | ✅ 3/12 | skill-improver Phase 6 self-review, skill-creator Phase 4 test-review, skill-safety-review step 6 structural check |
| Plan-validate-execute | ✅ 2/12 | skill-improver (understand → diagnose → improve → verify), skill-creator (capture → write → test → iterate) |
| Gotchas sections | ✅ 1/12 | skill-anti-patterns (16 anti-patterns = gotchas catalog) |
| Bundling reusable scripts | ✅ 8/12 | Scripts distributed via sync-to-skills.sh |
| Favor procedures over declarations | ✅ 12/12 | All skills use numbered steps, decision tables, workflow phases |
| Match specificity to fragility | ✅ 2/12 | skill-creator Step 5 explicitly teaches this; skill-improver Phase 4 |

### 3.2 Pattern: Calibrating Control

**Strong**: `skill-creator` Step 5 (lines 123-133) directly teaches the "match specificity to fragility" principle from agentskills.io, including the freedom spectrum (high/medium/low) and the reasoning-over-imperatives guidance. This is one of the best-aligned sections in the entire repo.

### 3.3 Missing: "Add what the agent lacks, omit what it knows"

**Finding B-1**: Several skills include explanatory text the agent already knows. Examples:

- `skill-evaluation/SKILL.md` line 16: "Produce quantitative evidence that a single skill adds value: it triggers on the right inputs, stays silent on wrong inputs, and improves output quality over the no-skill baseline." — This explains what evaluation _is_, which the agent knows. The space would be better used for the specific methodology.
- `skill-lifecycle-management/SKILL.md` lines 38-60 (lifecycle state descriptions): "Draft — initial creation... Beta — functional..." — Agents understand lifecycle states. The value is in the promotion criteria and procedures, which are also present.

Per [best practices](https://agentskills.io/skill-creation/best-practices): "Ask yourself about each piece of content: 'Would the agent get this wrong without this instruction?' If the answer is no, cut it."

---

## 4. Script Design

### 4.1 Compliance with agentskills.io Script Guidelines

Cross-referencing against [using-scripts guide](https://agentskills.io/skill-creation/using-scripts):

| Requirement | Status | Details |
|-------------|--------|---------|
| Avoid interactive prompts | ✅ 15/15 | All scripts are fully non-interactive |
| --help documentation | ⚠️ 13/15 | Missing: `validate-skills.sh`, `run-regression-suite.sh` |
| Helpful error messages | ✅ 15/15 | Scripts report what went wrong and what was expected |
| Structured output | ✅ 12/15 | Python scripts emit JSON; bash scripts emit markdown; 3 emit plain text only |
| Idempotency | ✅ 14/15 | `sync-to-skills.sh` skips unchanged files; eval scripts overwrite reports |
| Dry-run support | ⚠️ 5/15 | `run-evals.sh`, `run-trigger-optimization.sh`, `run-full-cycle.sh`, `sync-to-skills.sh`, `run-baseline-comparison.sh` (passes through) |
| Meaningful exit codes | ✅ 15/15 | 0=pass, 1=fail, 2=usage error (consistent) |
| Separate data from diagnostics | ✅ 12/15 | Python scripts: JSON to stdout, errors to stderr |

**Finding SC-1**: `validate-skills.sh` (161 lines) and `run-regression-suite.sh` (127 lines) lack `--help` flags. Per [agentskills.io](https://agentskills.io/skill-creation/using-scripts): "`--help` output is the primary way an agent learns your script's interface."

### 4.2 Critical: Contradictory Validation Rules

**Finding X-1 (CRITICAL)**: `scripts/quick_validate.py` line 42 defines:
```python
ALLOWED_PROPERTIES = {'name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'}
```

This directly contradicts:
- `AGENTS.md` line 57 (post-update): "YAML frontmatter (name, description — these two fields only)"
- `scripts/check_skill_structure.py` which warns on any field beyond name and description
- `scripts/validate-skills.sh` which enforces the two-field rule
- `.github/copilot-instructions.md` line 58: "Frontmatter must contain only `name` and `description`"

`quick_validate.py` allows 4 extra frontmatter fields (`license`, `allowed-tools`, `metadata`, `compatibility`) that every other tool in the repo rejects. A skill passing `quick_validate.py` could fail `check_skill_structure.py` and `validate-skills.sh`. **This script is stale and should be updated or removed.**

### 4.3 Script Distribution Model

The root → per-skill sync model (`sync-to-skills.sh`) is sound:
- Manifest-driven (line 22-31): explicit mapping of which script goes where
- Three modes: sync, --dry-run, --check (CI-friendly)
- Idempotent: skips unchanged files

**Finding SC-2**: The manifest in `sync-to-skills.sh` is the only place the mapping is defined. If it drifts from reality (e.g., a skill starts using a new script but the manifest isn't updated), there's no automated check. The `--check` mode only verifies existing mappings are in sync, not that all referenced scripts are in the manifest.

---

## 5. Evaluation System

### 5.1 Comparison with agentskills.io Evaluation Guide

The [agentskills.io evaluation guide](https://agentskills.io/skill-creation/evaluating-skills) describes a comprehensive eval workflow. Here's how this repo compares:

| agentskills.io Recommends | Repo Status | Details |
|---------------------------|-------------|---------|
| Test cases with prompt + expected output | ✅ Implemented | JSONL format with prompt, expected_sections, required_patterns, forbidden_patterns |
| With-skill vs without-skill baseline | ⚠️ Partial | `skill-evaluation/SKILL.md` Step 5 describes the approach; `run-baseline-comparison.sh` compares two SKILL.md versions, not skill-present vs skill-absent |
| Assertions (pass/fail checks) | ✅ Implemented | required_patterns, forbidden_patterns, min_output_lines |
| Timing/token data capture | ❌ Missing | No timing.json or token tracking anywhere |
| LLM-based grading | ✅ Implemented | `--usefulness` flag with 4-dimension scoring |
| Human review formalization | ❌ Missing | No feedback.json or structured review capture |
| Iteration workspace (iteration-N/) | ❌ Missing | Flat timestamped files in eval-results/ |
| Train/validation split | ✅ Implemented | `run-trigger-optimization.sh` uses 60/40 split |
| Benchmarking/aggregation | ✅ Implemented | `run-full-cycle.sh` produces summary reports |
| Regression prevention | ✅ Implemented | `harvest_failures.py` → corpus/regression/ → `run-regression-suite.sh` |

### 5.2 Test Case Coverage

**Trigger tests** (from explore agent data):

| Metric | Count | Assessment |
|--------|-------|------------|
| trigger-positive cases | 8-10 per skill | ✅ Good — matches agentskills.io recommendation of 8-10 |
| trigger-negative cases | 8 per skill | ✅ Good |
| behavior cases | 3-4 per skill | ⚠️ Low — agentskills.io says "start with 2-3" but expects expansion |

**Finding E-1**: Behavior test count is low at 3 per skill (except skill-improver with 4). These test structural compliance (patterns, line counts) but only 4/12 skills have `usefulness_criteria` for semantic quality judging. This means 8/12 skills have **no mechanism to judge whether their output is actually useful** — only that it matches expected regex patterns.

Skills with usefulness_criteria seeded:
- skill-creator (2/3 cases)
- skill-evaluation (2/3 cases)
- skill-improver (4/4 cases)
- skill-trigger-optimization (2/3 cases)

Skills without usefulness testing: skill-adaptation, skill-anti-patterns, skill-benchmarking, skill-catalog-curation, skill-lifecycle-management, skill-safety-review, skill-testing-harness, skill-variant-splitting.

### 5.3 Missing: Token/Cost Tracking

**Finding E-2**: The [agentskills.io evaluation guide](https://agentskills.io/skill-creation/evaluating-skills) explicitly recommends capturing `timing.json` with `total_tokens` and `duration_ms` for each run, and computing cost deltas in `benchmark.json`. This repo tracks none of this. For meta-skills that invoke LLMs (trigger optimization, usefulness scoring), cost tracking would help identify which skills are expensive to evaluate and whether changes affect token consumption.

### 5.4 Missing: Iteration Workspace Structure

**Finding E-3**: agentskills.io recommends organizing eval results by iteration:
```
workspace/iteration-1/eval-case-1/with_skill/...
workspace/iteration-2/eval-case-1/with_skill/...
```

The repo uses flat timestamped files:
```
eval-results/skill-creator-20260320-035859.md
eval-results/skill-creator-eval.md (symlink to latest)
```

This makes it difficult to compare results across improvement iterations. When a skill is improved and re-evaluated, the old report is still there but there's no structured way to diff iteration N vs N+1.

### 5.5 Strength: Regression Harvesting Loop

The pipeline `run-full-cycle.sh` → `harvest_failures.py` → `corpus/regression/` → `run-regression-suite.sh` is a **genuinely excellent pattern** not described in agentskills.io. It automatically converts eval failures into regression test cases, ensuring fixed issues stay fixed. This is more sophisticated than the agentskills.io approach of manual test case curation.

### 5.6 Strength: Multi-Run Variance Reduction

`run-evals.sh` supports `--runs N` with majority voting, which directly implements the [agentskills.io recommendation](https://agentskills.io/skill-creation/optimizing-descriptions): "Run each query multiple times (3 is a reasonable starting point) and compute a trigger rate." The implementation is well-done — it computes trigger rates and uses configurable thresholds.

### 5.7 Evaluation System Rating

| Aspect | Rating | Notes |
|--------|--------|-------|
| Trigger testing | 9/10 | Excellent: positive/negative split, multi-run voting, differential testing |
| Behavior testing | 6/10 | Structural checks solid; low case count; usefulness only 4/12 skills |
| Baseline comparison | 7/10 | Compares SKILL.md versions well; doesn't automate skill-present vs skill-absent |
| Regression prevention | 9/10 | Automatic harvesting + re-testing is best-in-class |
| Iteration workflow | 4/10 | Flat file structure; no iteration comparison; no timing data |
| Cost tracking | 2/10 | Not implemented at all |
| **Overall** | **7/10** | Strong foundation; needs iteration tooling and deeper behavior coverage |

---

## 6. Pipeline & Flow Analysis

### 6.1 Creation Pipeline

```
skill-creator → skill-testing-harness → skill-evaluation
    → skill-trigger-optimization → skill-safety-review → skill-lifecycle-management
```

| Step | Handoff Mechanism | Assessment |
|------|-------------------|------------|
| creator → testing-harness | skill-creator Phase 3 delegates: "For details on field schemas, delegate to `skill-testing-harness`" | ✅ Clear delegation |
| testing-harness → evaluation | testing-harness Next steps: "Run evaluation → `skill-evaluation`" | ✅ Clear pointer |
| evaluation → trigger-opt | evaluation Next steps: "If routing fails → `skill-trigger-optimization`" | ✅ Conditional handoff |
| trigger-opt → safety-review | trigger-optimization Next steps: "After optimization → `skill-safety-review`" | ✅ Clear pointer |
| safety-review → lifecycle | safety-review Next steps: "If safe → `skill-lifecycle-management` for promotion" | ✅ Clear pointer |

**Finding P-1**: The pipeline is documented in skills' "Next steps" sections but **there's no automation that chains them**. Each step requires manual invocation. This is acceptable for a skill-level approach (skills don't orchestrate other skills by design), but means the pipeline is advisory only.

### 6.2 Improvement Pipeline

```
skill-evaluation → skill-anti-patterns → skill-improver → skill-trigger-optimization
```

| Handoff | Mechanism | Assessment |
|---------|-----------|------------|
| evaluation → anti-patterns | `eval-results/<skill>-eval.md` Handoff section + routing recommendation | ✅ Structured data handoff |
| evaluation → improver | skill-improver Phase 1 reads `eval-results/<skill>-eval.md` | ✅ Eval-driven diagnosis |
| improver → trigger-opt | skill-improver Next steps: "Optimize triggers if routing changed" | ✅ Conditional |

**This pipeline has the strongest handoff mechanism** — the eval-results loop (commit `7718929`) ensures quantitative data flows from evaluation to improvement. skill-improver's Phase 2 has an eval-driven diagnosis table that maps scores to failure modes, which is well-designed.

### 6.3 Cross-Skill Reference Integrity

Every skill's "When NOT to use" section names alternative skills. I verified all cross-references:

| Skill | References | All valid? |
|-------|------------|------------|
| skill-adaptation | skill-creator, skill-improver, skill-variant-splitting | ✅ |
| skill-anti-patterns | skill-creator, skill-trigger-optimization, skill-improver, skill-evaluation | ✅ |
| skill-benchmarking | skill-evaluation, skill-testing-harness | ✅ |
| skill-catalog-curation | skill-improver, skill-creator, skill-lifecycle-management | ✅ |
| skill-creator | skill-variant-splitting, skill-adaptation, skill-improver, skill-evaluation | ✅ |
| skill-evaluation | skill-benchmarking, skill-testing-harness, skill-improver | ✅ |
| skill-improver | skill-creator, skill-trigger-optimization, skill-adaptation, skill-anti-patterns | ✅ |
| skill-lifecycle-management | skill-creator, skill-improver, skill-catalog-curation | ✅ |
| skill-safety-review | skill-evaluation, skill-anti-patterns | ✅ |
| skill-testing-harness | skill-evaluation, skill-benchmarking | ✅ |
| skill-trigger-optimization | skill-improver, skill-anti-patterns | ✅ |
| skill-variant-splitting | skill-adaptation, skill-trigger-optimization, skill-catalog-curation | ✅ |

All cross-references point to existing skills. No broken references. **Excellent.**

---

## 7. Documentation Accuracy

### 7.1 Consistency Across Root Documents

| Fact | README.md | AGENTS.md | copilot-instructions.md | Consistent? |
|------|-----------|-----------|-------------------------|-------------|
| Skill count | 12 | 12 | 12 | ✅ |
| Corpus tiers | 5/5/5 | 5/5/5 | "test fixtures" (no counts) | ✅ |
| Frontmatter rule | (not stated) | name + description only | name + description only | ✅ |
| Pipelines | 3 (creation, improvement, library) | 3 (same) | 3 (same) | ✅ |
| Eval scripts | 8 listed | 9 listed (+ sync) | 11 listed (+ Python utils + sync) | ✅ (different detail levels) |
| Default model | gpt-4.1 | gpt-4.1 | (not stated) | ✅ |

### 7.2 Documentation Gaps

**Finding DOC-1**: `README.md` script table (lines 90-99) doesn't list Python utility scripts (`check_skill_structure.py`, `skill_lint.py`, etc.), while `.github/copilot-instructions.md` (lines 46-49) does. This is intentional (README is high-level), but could confuse users looking for the full script inventory.

**Finding DOC-2**: `skill-creator/SKILL.md` does not mention the 1024-character description limit from the [Agent Skills specification](https://agentskills.io/skill-creation/optimizing-descriptions). Since this skill teaches users how to write descriptions, this is a notable omission. The spec states: "The specification enforces a hard limit of 1024 characters."

**Finding DOC-3**: `docs/evaluation-cadence.md` is comprehensive and accurate. All 5 evaluation steps are documented with exact commands, environment variables, routing modes, and gate thresholds. The corpus tier mentions (line 113) should be updated from implicit counts to explicit 5/5/5.

---

## 8. Specific Skill Reviews

### 8.1 skill-creator (328 lines)

**Strengths**:
- Phase 2 (Write the SKILL.md) is the most thorough authoring guide in the repo
- Step 5 (Calibrate instruction depth) directly teaches agentskills.io best practices
- Step 7 (Validate against common mistakes) provides a concrete checklist
- References scripts for validation (`check_skill_structure.py`, `run-evals.sh --dry-run`)

**Issues**:
- **Finding CR-1**: Phase 3 (Create test cases, line 180-197) partially overlaps with `skill-testing-harness`. The skill says "delegate to `skill-testing-harness`" but also includes inline instructions for test creation. An agent may be confused about whether to delegate or follow the inline steps.
- **Finding CR-2**: No mention of the 1024-character description limit (see DOC-2).
- **Finding CR-3**: At 328 lines, this is the 2nd largest skill with only 1 reference file. Phase 2's 7 sub-steps could be extracted to `references/authoring-guide.md` with conditional loading.

### 8.2 skill-improver (330 lines)

**Strengths**:
- Mode selection guide (lines 50-68) is excellent — teaches "choose the lightest mode"
- Phase 2 has both eval-driven diagnosis (quantitative) and heuristic diagnosis (qualitative) paths
- References 4 files in `references/` for progressive disclosure
- Comprehensive failure handling (7 failure modes with specific recovery)
- Phase 7 integrates `run-baseline-comparison.sh` for automated verification

**Issues**:
- **Finding IM-1**: The eval-driven diagnosis table (Phase 2) maps "Usefulness score < 3/5" to "prompt-blob syndrome or missing branching." This conflates two different problems. A low usefulness score could indicate many issues; the mapping should be less prescriptive or note that the judge rationale provides the actual diagnosis.

### 8.3 skill-evaluation (166 lines)

**Strengths**:
- Entry mode selection (suite vs ad-hoc) is well-designed
- Step 0 references `scripts/run-evals.sh` with concrete command examples
- Structured Handoff section in output contract enables downstream consumption
- Failure handling table maps situations to specific actions

**Issues**:
- **Finding EV-1**: Step 5 (Run baseline comparison, lines 93-99) describes manually removing/renaming the SKILL.md to create a no-skill baseline. This is a sound methodology but fragile in practice — an agent might forget to restore the file. The skill should reference `run-baseline-comparison.sh` which handles this safely with temp directories.

### 8.4 skill-anti-patterns (174 lines)

**Strengths**:
- 16 concrete anti-patterns with severity levels (CRITICAL/HIGH/MEDIUM)
- Quick scan priority guide (lines 37-40) for time-constrained audits
- References `check_skill_structure.py` for quantitative baseline

**Issues**: No significant issues found. Well-scoped and actionable.

### 8.5 skill-testing-harness (178 lines)

**Strengths**:
- Clear 7-step procedure for building eval suites
- Category taxonomy for trigger tests (core, indirect, paraphrase, edge)
- Step 7 adds verification via `run-evals.sh --dry-run`

**Issues**:
- **Finding TH-1**: The behavior test template (Step 4) uses `expected_files` field which is not in the canonical eval contract (`AGENTS.md` lines 46-50). The contract specifies `expected_sections`, `required_patterns`, `forbidden_patterns`, `min_output_lines`. The `expected_files` field appears to be a testing-harness-specific extension that `run-evals.sh` may not support.

### 8.6 skill-safety-review (123 lines)

**Strengths**: Clear 9-step audit procedure covering destructive operations, permissions, injection, description mismatch, scripts, and partial-failure safety.

**Issues**:
- **Finding SR-1**: The description is the longest at 502 characters. While still under the 1024 limit, it's notably longer than the average (370 chars). Some of the description content ("Use before publishing to a shared registry, after importing from an untrusted source") could move to the "When to use" body section to keep the description leaner for discovery.

### 8.7 skill-lifecycle-management (180 lines)

**Strengths**: Clear lifecycle state definitions, promotion criteria, and deprecation procedure with 6 explicit steps.

**Issues**:
- **Finding LM-1**: The deprecation procedure Step 4 (line 86-92) correctly notes "Do NOT add lifecycle metadata to YAML frontmatter." However, the skill still describes lifecycle states (draft → beta → stable → deprecated → archived) without specifying where this state is tracked. The procedure says to add a deprecation notice as a markdown blockquote at the top of SKILL.md, which is pragmatic, but earlier lifecycle states (draft, beta, stable) have no tracking mechanism at all.

### 8.8 Remaining Skills (no significant issues)

- **skill-benchmarking** (117 lines): Well-scoped to variant comparison. Clear "For skill vs no-skill baseline evaluation, use `skill-evaluation` instead" boundary.
- **skill-catalog-curation** (135 lines): Clean 6-step audit procedure. Merge procedure in failure handling is practical.
- **skill-adaptation** (120 lines): Focused scope. No cross-cutting issues.
- **skill-trigger-optimization** (130 lines): References `scripts/run-trigger-optimization.sh` correctly.
- **skill-variant-splitting** (124 lines): Clear splitting criteria and procedure.

---

## 9. Corpus Assessment

| Tier | Count | Quality | Notes |
|------|-------|---------|-------|
| weak/ | 5 | ✅ Good | Each targets a specific defect class: bad-triggers, bloated-inline, missing-boundaries, no-output-contract, vague-procedure |
| strong/ | 5 | ✅ Good | Well-formed exemplars with different strengths: references, routing, failure handling, branching |
| adversarial/ | 5 | ✅ Good | Stress tests: contradictions, circular refs, format traps, injection, scope explosion |
| regression/ | 3 | ✅ Adequate | Covers 3 failure types: purpose-lost, boundaries-deleted, references-broken |

The corpus is well-structured for meta-skill testing. The weak/strong/adversarial tiers enable both "detect problems" and "preserve quality" testing. The scope-explosion adversarial case (description: "Comprehensive full-lifecycle application management skill covering architecture design, implementation, testing, deployment, monitoring...") is an excellent test for skills that should flag overbroad scope.

---

## 10. Findings Summary

### Critical (1)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| X-1 | `quick_validate.py` allows 4 extra frontmatter fields (`license`, `allowed-tools`, `metadata`, `compatibility`) that all other tools reject | `scripts/quick_validate.py:42` | Skills could pass validation with this script but fail with `check_skill_structure.py` and `validate-skills.sh` |

### Significant (5)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| E-1 | Behavior test count is low (3 per skill) and usefulness criteria only seeded in 4/12 skills | All `evals/behavior.jsonl` files | 8/12 skills have no semantic output quality testing |
| E-2 | No token/duration/cost tracking in the evaluation system | `scripts/run-evals.sh` | Cannot measure eval cost or detect token regressions |
| E-3 | No iteration workspace structure for tracking improvement over time | `eval-results/` | Cannot compare iteration N vs N+1 systematically |
| D-2 | 1024-character description limit not enforced or mentioned | `skill-creator/SKILL.md`, `check_skill_structure.py` | Skills for external use could exceed spec limit without warning |
| CR-1 | skill-creator Phase 3 partially overlaps with skill-testing-harness | `skill-creator/SKILL.md:180-197` | Agent unclear whether to delegate or follow inline steps |

### Moderate (5)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| S-1 | skill-creator (328 lines) has few reference files for its size | `skill-creator/` | Large skill body could be trimmed via progressive disclosure |
| S-2 | Progressive disclosure uses generic "see references/" instead of conditional loading | `skill-creator/SKILL.md`, `skill-improver/SKILL.md` | Agent loads reference files unconditionally, consuming context |
| SC-1 | `validate-skills.sh` and `run-regression-suite.sh` lack --help flags | `scripts/` | Agents can't learn the script interface via --help |
| EV-1 | skill-evaluation Step 5 describes manual SKILL.md removal for baseline | `skill-evaluation/SKILL.md:93-99` | Fragile; should reference run-baseline-comparison.sh |
| LM-1 | Lifecycle states before deprecation have no tracking mechanism | `skill-lifecycle-management/SKILL.md` | Draft/beta/stable status is implicit only |

### Minor (5)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| B-1 | Some skills include explanatory text the agent already knows | Various SKILL.md files | Minor context waste |
| SR-1 | skill-safety-review description is longest at 502 chars | `skill-safety-review/SKILL.md` frontmatter | Could be trimmed for discovery efficiency |
| TH-1 | behavior test template uses `expected_files` field not in canonical eval contract | `skill-testing-harness/SKILL.md` Step 4 | Non-standard field may confuse eval tooling |
| SC-2 | Sync manifest is single source of truth with no reverse-check | `scripts/sync-to-skills.sh:22-31` | New script references in SKILL.md could be missed by sync |
| DOC-1 | README script table doesn't list Python utility scripts | `README.md:90-99` | Intentional but could confuse users |
| IM-1 | Eval-driven diagnosis over-maps usefulness < 3/5 to specific failure modes | `skill-improver/SKILL.md` Phase 2 | Judge rationale is more diagnostic than the table mapping |
| P-1 | Pipelines are advisory only; no automated chaining | All pipeline docs | Manual invocation required between steps |

---

## 11. Recommendations (Prioritized)

### Must Fix
1. **Update or remove `quick_validate.py`** to align with the two-field frontmatter rule (X-1)
2. **Add 1024-character description limit** to `check_skill_structure.py` and mention it in `skill-creator` Step 3 (D-2)

### Should Fix
3. **Seed `usefulness_criteria`** in behavior.jsonl for the remaining 8 skills (E-1)
4. **Add `--help`** to `validate-skills.sh` and `run-regression-suite.sh` (SC-1)
5. **Resolve skill-creator/testing-harness Phase 3 overlap** — either fully delegate or fully inline, not both (CR-1)
6. **Reference `run-baseline-comparison.sh`** in skill-evaluation Step 5 instead of manual SKILL.md removal (EV-1)

### Nice to Have
7. **Add token tracking** to `run-evals.sh` — capture tokens used per prompt for cost analysis (E-2)
8. **Extract skill-creator Phase 2** into `references/authoring-guide.md` for progressive disclosure (S-1)
9. **Use conditional reference loading** — "Read `references/X.md` if [condition]" instead of generic pointers (S-2)
10. **Define lifecycle state tracking** — where draft/beta/stable status lives if not in frontmatter (LM-1)

---

*Report generated by cross-referencing 12 skill packages, 15 scripts, 4 root documents, 37 behavior test cases, and 18 corpus files against the [Agent Skills specification](https://agentskills.io/) and its [best practices](https://agentskills.io/skill-creation/best-practices), [evaluation](https://agentskills.io/skill-creation/evaluating-skills), [description optimization](https://agentskills.io/skill-creation/optimizing-descriptions), and [script design](https://agentskills.io/skill-creation/using-scripts) guides.*
