# Active Skill Review Batch 1

**Date**: 2026-03-20
**Scope**: `skill-anti-patterns`, `skill-safety-review`, `skill-benchmarking`, `skill-adaptation`, `skill-variant-splitting`
**Reviewer**: Codex

---

## Review Basis

This review used:

- Repository contracts and support layers in each target package
- Root repository rules in `AGENTS.md`
- Agent Skills reference material:
  - [What are skills?](https://agentskills.io/what-are-skills)
  - [Best practices for skill creators](https://agentskills.io/skill-creation/best-practices)
  - [Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)
  - [Evaluating skill output quality](https://agentskills.io/skill-creation/evaluating-skills)
  - [Using scripts in skills](https://agentskills.io/skill-creation/using-scripts)

Relevant external guidance used in this review:

- Skills are folder-based packages built around `SKILL.md`, with optional `scripts/`, `references/`, and `assets/`, and they rely on progressive disclosure where only `name` and `description` load initially ([What are skills?](https://agentskills.io/what-are-skills), lines 43-48, 63-68).
- Good skills should be coherent units, concise, procedure-oriented, and should move large detail to references when needed ([Best practices](https://agentskills.io/skill-creation/best-practices), lines 135-147, 213-231, 262-288).
- Descriptions should use imperative phrasing, focus on user intent, stay concise, and be validated with realistic should-trigger and should-not-trigger eval queries run multiple times ([Optimizing descriptions](https://agentskills.io/skill-creation/optimizing-descriptions), lines 67-75, 92-115, 127-136, 176-207).
- The canonical Agent Skills eval workflow centers on `evals/evals.json`, baseline comparison against no-skill or prior-skill runs, timing capture, and assertions with explicit evidence ([Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills), lines 61-72, 98-108, 113-145, 172-233).
- Bundled scripts should be referenced with relative paths from the skill root, and the script-design guidance emphasizes clear `--help`, non-interactive interfaces, helpful errors, and structured output ([Using scripts](https://agentskills.io/skill-creation/using-scripts), lines 156-159, 162-200; see also the "Designing scripts for agentic use" section).

---

## Validation Evidence

### Structural checks

Each target `SKILL.md` was checked with the repository's bundled structural checker and linter.

| Skill | Structural score | Lint result | Line count |
|------|------------------|-------------|------------|
| `skill-anti-patterns` | 10/10 | pass | 174 |
| `skill-safety-review` | 10/10 | pass | 123 |
| `skill-benchmarking` | 10/10 | pass | 117 |
| `skill-adaptation` | 10/10 | pass | 120 |
| `skill-variant-splitting` | 10/10 | pass | 124 |

Evidence sources:

- `skill-anti-patterns/SKILL.md`
- `skill-safety-review/SKILL.md`
- `skill-benchmarking/SKILL.md`
- `skill-adaptation/SKILL.md`
- `skill-variant-splitting/SKILL.md`
- `skill-anti-patterns/scripts/check_skill_structure.py`
- `skill-anti-patterns/scripts/skill_lint.py`

### Script sync evidence

For the shipped scripts used by this batch, the deployed per-skill copies match the root source-of-truth copies by file hash:

- `skill-anti-patterns/scripts/check_skill_structure.py` == `scripts/check_skill_structure.py`
- `skill-anti-patterns/scripts/skill_lint.py` == `scripts/skill_lint.py`
- `skill-safety-review/scripts/check_skill_structure.py` == `scripts/check_skill_structure.py`
- `skill-safety-review/scripts/skill_lint.py` == `scripts/skill_lint.py`
- `skill-safety-review/scripts/validate-skills.sh` == `scripts/validate-skills.sh`
- `skill-benchmarking/scripts/run-evals.sh` == `scripts/run-evals.sh`
- `skill-benchmarking/scripts/run-baseline-comparison.sh` == `scripts/run-baseline-comparison.sh`

This matters because the script issues below are source issues, not copy drift.

---

## Findings

### 1. `skill-benchmarking` promises a true benchmark workflow, but the bundled tooling does not implement the advertised metrics

Severity: High

Why this matters:

- The skill claims to compare variants on pass rate, token usage, and win rate, then recommend a winner.
- The bundled scripts are the execution path named in the procedure.
- If the scripts do not compute those metrics, the skill's central behavior claim is overstated.

Evidence:

- `skill-benchmarking/SKILL.md:15-16` defines the purpose as comparing variants and producing pass rate, token usage, and win rate.
- `skill-benchmarking/SKILL.md:44-57` instructs the agent to use `./scripts/run-evals.sh` and `./scripts/run-baseline-comparison.sh` for metric collection.
- `skill-benchmarking/SKILL.md:59-67` adds a blind judging method, tie handling, and round-robin pairwise comparison for more than two variants.
- `skill-benchmarking/scripts/run-baseline-comparison.sh:78-83, 144-156, 214-227, 249-337` only compares structural scores and eval pass/fail outcomes. It does not calculate token usage, win rate, blind judgments, or round-robin results.
- `skill-benchmarking/scripts/run-evals.sh:938-948` emits only timestamp, model, routing mode, run count, overall status, failed count, tested count, and results dir in JSON summary. There is no token or win-rate summary output.
- `scripts/run-evals.sh:172-233, 508-578` shows routing/behavior checks, but no token accounting or comparison logic.
- `scripts/run-evals.sh` contains no `win rate`, `winner`, `pairwise`, `round-robin`, or token aggregation code.

Best-practice comparison:

- This conflicts with the Agent Skills evaluation guidance that recommends explicit baseline comparison and timing capture for tradeoff measurement ([Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills), lines 108-145, 172-188).

Conclusion:

- As implemented, `skill-benchmarking` behaves more like "structural before/after comparison plus eval gate status" than the head-to-head benchmark its contract describes.

### 2. `skill-benchmarking`'s deployed scripts are path-broken when used from the skill package the way the skill documents them

Severity: High

Why this matters:

- Agent Skills guidance says bundled scripts are referenced with relative paths from the skill root, and agents execute them from there.
- If the deployed copies assume repository-root paths instead, the skill package is not self-consistent.

Evidence:

- Agent Skills script guidance says relative script paths are resolved from the skill directory root ([Using scripts](https://agentskills.io/skill-creation/using-scripts), lines 162-200).
- `skill-benchmarking/SKILL.md:48-52` tells the agent to run `./scripts/run-evals.sh` and `./scripts/run-baseline-comparison.sh`.
- `skill-benchmarking/scripts/run-evals.sh:53-54` derives `REPO_ROOT` as `$(cd "$(dirname "$0")/.." && pwd)`, which resolves to `.../skill-benchmarking` for the deployed copy.
- `skill-benchmarking/scripts/run-evals.sh:795, 881, 896, 921` then looks for skills under `${REPO_ROOT}/${skill}/SKILL.md` and writes results under `${REPO_ROOT}/eval-results`, which would mean `skill-benchmarking/<skill>/SKILL.md` and `skill-benchmarking/eval-results/`.
- `skill-benchmarking/scripts/run-baseline-comparison.sh:18-19` resolves `CHECK_SCRIPT` to `${REPO_ROOT}/scripts/check_skill_structure.py`, which from the deployed copy means `skill-benchmarking/scripts/check_skill_structure.py`.
- That file does not exist in `skill-benchmarking/scripts/`; only `run-evals.sh` and `run-baseline-comparison.sh` are present in the package.

Conclusion:

- The deployed copies are not runnable from the skill root with the paths their own `SKILL.md` advertises.

### 3. `skill-safety-review`'s repo-validation step is unreliable from the deployed skill package

Severity: High

Why this matters:

- The safety review procedure explicitly tells the agent to run a full repo compliance check.
- If the deployed script only scans the skill package itself, the review can report a false-clean repo.

Evidence:

- `skill-safety-review/SKILL.md:66-74` defines structural compliance as a review step and tells the agent to run `./scripts/validate-skills.sh`.
- `skill-safety-review/scripts/validate-skills.sh:12, 21-31` derives `REPO_ROOT` from the deployed script location and scans `"$REPO_ROOT"/*/` for skill packages.
- From the deployed copy, `REPO_ROOT` resolves to `.../skill-safety-review`, not the repository root.
- `skill-safety-review/` contains only `SKILL.md`, `evals/`, and `scripts/`, so the validator would find zero sibling skill packages to inspect.

Conclusion:

- One of the core review steps in `skill-safety-review` is not reliable when executed from the packaged skill, despite the package looking structurally valid.

### 4. `skill-anti-patterns` and `skill-safety-review` document the wrong `skill_lint.py` invocation

Severity: Medium

Why this matters:

- These two skills both instruct the reviewer to establish a quantitative baseline with the bundled linter before auditing.
- The documented command fails because the script interface does not match the example.

Evidence:

- `skill-anti-patterns/SKILL.md:37-40` tells the reviewer to run `python3 scripts/skill_lint.py <skill-dir>/SKILL.md`.
- `skill-safety-review/SKILL.md:68-72` uses the same form.
- `skill-anti-patterns/scripts/skill_lint.py:26-31` takes a skill directory, then appends `SKILL.md` internally.
- Running the documented form against a `SKILL.md` path returns `ERROR: missing SKILL.md`.

Best-practice comparison:

- Agent Skills recommends clear script interfaces, helpful errors, and `--help`-discoverable usage ([Using scripts](https://agentskills.io/skill-creation/using-scripts), lines 363-390).

Conclusion:

- The procedure text and the actual script interface are out of sync.

### 5. The behavior eval suites do not match the skills' own output contracts

Severity: Medium

Why this matters:

- A behavior suite should validate the documented output contract.
- If the eval suite expects different sections or language than the contract requires, the package can fail compliant outputs or reward undocumented ones.

Evidence by skill:

- `skill-anti-patterns/SKILL.md:141-159` specifies an audit table, `Summary`, and `Priority Fixes`, but `skill-anti-patterns/evals/behavior.jsonl:1-3` expects `Findings`, `Scan results`, or `Diagnosis`, plus `severity`, which the contract does not require.
- `skill-safety-review/SKILL.md:86-112` defines `Destructive Operations`, `Permissions`, `Injection Risks`, `Scope / Description Mismatch`, and `Required Changes`, but `skill-safety-review/evals/behavior.jsonl:1-3` expects `Permission scope`, `Prompt injection`, `Confirmation gates`, and `Rollback`.
- `skill-benchmarking/SKILL.md:78-104` defines `Summary`, `Breakdown`, `Significance`, and `Recommendation`, but `skill-benchmarking/evals/behavior.jsonl:1-3` expects `Setup`, `Results`, `Summary table`, `Metrics`, and the word `statistical`.
- `skill-adaptation/SKILL.md:84-106` requires `Adaptation Summary` plus the full adapted `SKILL.md`, but `skill-adaptation/evals/behavior.jsonl:1-3` expects `Context analysis`, `Adaptation plan`, `Analysis`, `Changes`, and `Result`.
- `skill-variant-splitting/SKILL.md:84-110` defines a split report structure, but `skill-variant-splitting/evals/behavior.jsonl:1-3` expects `Analysis`, `Diagnosis`, `Variant A`, `Variant B`, and wording like `definitely split` / `definitely keep` that does not map to the contract.

Best-practice comparison:

- The Agent Skills evaluation guide centers on realistic prompts plus assertions tied to observable outputs and evidence, not a parallel undocumented contract ([Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills), lines 191-233).

Conclusion:

- The eval layer is not consistently validating the written contract for these five packages.

### 6. `skill-anti-patterns` is internally inconsistent about frontmatter policy and line-count severity

Severity: Medium

Why this matters:

- A diagnostic skill should not recommend changes that violate the repository contract it is supposed to enforce.

Evidence:

- `skill-anti-patterns/SKILL.md:123-127` says AP-14 should be fixed by declaring tool dependencies in frontmatter.
- `skill-anti-patterns/scripts/check_skill_structure.py:26, 134-143` allows only `name` and `description` in frontmatter and flags all additional fields as unexpected.
- `skill-anti-patterns/SKILL.md:118-121` treats `>400` lines as a high-severity anti-pattern.
- `skill-anti-patterns/scripts/check_skill_structure.py:195-202` only warns for 401-500 lines and still marks `line_count` as passing below 500.

Conclusion:

- The skill's narrative guidance and the repository's automated enforcement are not fully aligned.

### 7. `skill-adaptation` and `skill-variant-splitting` under-spec package-level changes

Severity: Medium

Why this matters:

- These skills are package-transformation skills, not just `SKILL.md` editing skills.
- If they do not say what happens to `scripts/`, `evals/`, `references/`, and `assets/`, execution quality will vary by operator.

Evidence:

- `skill-adaptation/SKILL.md:15-17, 35-83` correctly focuses on context-dependent references and invariants, but `skill-adaptation/SKILL.md:84-106` only requires an adaptation summary and adapted `SKILL.md`.
- `skill-variant-splitting/SKILL.md:54-82` describes defining variants and shared core, but `skill-variant-splitting/SKILL.md:84-110` outputs only a planning/report artifact, not concrete variant package outputs.
- Both skills have `evals/` directories, but neither contract explains how support layers should be migrated, split, or regenerated.

Best-practice comparison:

- Agent Skills packages are folder-level units, not standalone markdown files ([What are skills?](https://agentskills.io/what-are-skills), lines 43-48).

Conclusion:

- Both skills have strong reasoning procedures, but their output contracts under-specify package-complete execution.

### 8. Two eval suites contain stale references to archived skills rather than the active inventory

Severity: Low

Why this matters:

- The repository's root inventory is explicitly limited to the active top-level packages.
- Routing guidance that points to archived packages weakens the current package graph.

Evidence:

- `skill-safety-review/evals/trigger-negative.jsonl:4` recommends `skill-provenance`, which exists only under `archive/skill-provenance/`.
- `skill-adaptation/evals/trigger-negative.jsonl:6` recommends `skill-packaging`, which exists only under `archive/skill-packaging/`.
- Neither `skill-provenance/` nor `skill-packaging/` exists at the repository root.

Conclusion:

- The negative-routing evals are partially anchored to the old inventory, not the active one.

### 9. `skill-anti-patterns` names `skill-variant-splitting` in the anti-pattern catalog but omits it from `Next steps`

Severity: Low

Why this matters:

- This weakens the handoff path for overloaded-purpose failures.

Evidence:

- `skill-anti-patterns/SKILL.md:75-80` says overloaded-purpose skills may need splitting and explicitly names `skill-variant-splitting`.
- `skill-anti-patterns/SKILL.md:169-174` routes only to `skill-improver`, `skill-trigger-optimization`, and `skill-creator`.

Conclusion:

- The skill's own handoff map is incomplete for one of its stated anti-pattern remedies.

---

## Per-Skill Assessment

### `skill-anti-patterns`

Strengths:

- Clear routing boundaries in description and `When NOT to use`
- Strong checklist orientation with concrete fixes
- Good package size for progressive disclosure
- Strong diagnostic role upstream of improvement work

Primary issues:

- Wrong `skill_lint.py` invocation in the procedure
- Internal conflict between AP-14's frontmatter advice and the repo's frontmatter contract
- AP-13 severity threshold does not match the shipped checker
- `Next steps` omits `skill-variant-splitting`

Net assessment:

- Conceptually strong and useful, but not fully self-consistent.

### `skill-safety-review`

Strengths:

- Best procedural taxonomy of this batch
- Concrete destructive-op, permission-tier, injection, mismatch, and verdict logic
- Good fit with best-practice emphasis on precise procedures and explicit outputs

Primary issues:

- Wrong `skill_lint.py` invocation in the procedure
- Deployed `validate-skills.sh` is repo-root sensitive and unreliable from the packaged skill
- Mentions `repo-process-doctor` in `When to use`, but that package is not present in the active repo
- Behavior eval sections do not map cleanly to the output contract

Net assessment:

- The strongest review methodology in the batch, but undermined by deployment-path assumptions.

### `skill-benchmarking`

Strengths:

- Clear purpose and downstream lifecycle hooks
- Good distinction from `skill-evaluation`
- Reasonable thresholds and explicit tie handling in the text

Primary issues:

- The text describes metrics and methods the tooling does not implement
- Deployed scripts are not runnable from the skill root as documented
- Behavior evals validate a different output shape than the contract

Net assessment:

- Best written as a policy document, weakest as an executable skill package.

### `skill-adaptation`

Strengths:

- Strong invariants-vs-adaptation-points framing
- Clear "do not guess" stance
- Good downstream handoff to `skill-evaluation`, `skill-trigger-optimization`, and `skill-safety-review`

Primary issues:

- Output contract only guarantees an adapted `SKILL.md`, not a full package adaptation
- Negative evals still point to archived `skill-packaging`
- Behavior evals use section names not present in the output contract

Net assessment:

- A strong reasoning skill with under-specified package-completion behavior.

### `skill-variant-splitting`

Strengths:

- Best decision heuristics in this batch
- Strong split-axis selection logic
- Good coverage and migration framing
- Good downstream flow to catalog, evaluation, and lifecycle work

Primary issues:

- Output contract is report-oriented rather than package-oriented
- Behavior evals expect sections and deliverables not promised by the contract

Net assessment:

- Strong design logic, but the execution contract stops short of "write the actual variants."

---

## Cross-Skill Flow Review

Observed intended handoffs in this batch:

- `skill-anti-patterns` -> `skill-improver`
- `skill-anti-patterns` -> `skill-trigger-optimization`
- `skill-anti-patterns` -> `skill-creator`
- `skill-safety-review` -> `skill-improver`
- `skill-benchmarking` -> `skill-improver`
- `skill-benchmarking` -> `skill-lifecycle-management`
- `skill-adaptation` -> `skill-evaluation`
- `skill-adaptation` -> `skill-trigger-optimization`
- `skill-adaptation` -> `skill-safety-review`
- `skill-variant-splitting` -> `skill-catalog-curation`
- `skill-variant-splitting` -> `skill-evaluation`
- `skill-variant-splitting` -> `skill-lifecycle-management`

Flow quality:

- The reasoning-level flow is coherent.
- The biggest gap is that `skill-anti-patterns` does not formally hand off overloaded-purpose cases to `skill-variant-splitting` in `Next steps`.
- `skill-adaptation` and `skill-variant-splitting` both have clean downstream flow, but their output contracts do not fully specify how support layers move with those flows.

---

## Overall Verdict

These five active skill packages are structurally compliant and generally well-scoped. Their main weaknesses are not gross bloat or vague routing. The main weaknesses are execution drift between contract and tooling:

- `skill-benchmarking` is over-claimed relative to the scripts it ships.
- `skill-safety-review` and `skill-benchmarking` both rely on repo-root assumptions that do not hold for deployed per-skill script copies.
- Multiple behavior eval suites are validating a different output shape than the skills actually promise.
- `skill-adaptation` and `skill-variant-splitting` are stronger at reasoning than at specifying package-complete execution.

Relative effectiveness by package:

1. `skill-safety-review` — strongest methodology, weakened by script path assumptions
2. `skill-variant-splitting` — strongest decision logic
3. `skill-adaptation` — strong transformation reasoning, under-specified package outputs
4. `skill-anti-patterns` — useful diagnostic skill with a few internal consistency gaps
5. `skill-benchmarking` — clearest mismatch between documented behavior and actual tooling

---

## Limitations

- Python-based structural tools were executed directly.
- Bash-based scripts were reviewed statically in this Windows session.
- A direct `bash skill-safety-review/scripts/validate-skills.sh` run was blocked by a local WSL attach error before script execution, so bash findings in this review are based on source inspection and repository layout rather than a live bash run.
