# Meta-Skill-Engineering Repository Review

Date: 2026-03-20

Scope: all 12 active skill packages, 4 archived skill packages, root docs, `.github` instructions and extension, root `scripts/`, `docs/`, `corpus/`, and pipeline handoffs.

Method: static repository inspection, targeted line-by-line review, local runs of `python scripts/check_skill_structure.py` and `python scripts/skill_lint.py`, root-to-deployed script hash checks, and parallel review passes over the active skill groups and shared infrastructure. Bash-based automation was not executed end-to-end in this Windows session because WSL/bash was unavailable; bash-path findings are therefore based on direct source inspection.

## Executive Summary

The repository is structurally disciplined but operationally incomplete. The active skill inventory is cleanly bounded to 12 root packages, every active `SKILL.md` currently passes the shipped structural checker at `10/10`, and the script distribution model is internally consistent: the manifest in `scripts/sync-to-skills.sh:20-32` matches the deployed per-skill copies, and the deployed files are hash-identical to their root sources.

The main problems are not format errors but execution closure and evaluation honesty. Several active skills promise outputs, artifacts, or state transitions that the shipped scripts do not actually produce. The evaluation stack is the largest gap: `skill-evaluation` promises baseline-comparison and downstream handoff artifacts that `scripts/run-evals.sh` does not emit (`skill-evaluation/SKILL.md:48-59`, `skill-evaluation/SKILL.md:109-158`, `scripts/run-evals.sh:760-863`, `scripts/run-evals.sh:938-949`); many `behavior.jsonl` suites check for headings that the corresponding output contracts never require; and the corpus/regression tooling remains only partially closed.

Against Agent Skills guidance, the repo is strong on coherent skill scoping, action-led descriptions, and progressive-disclosure intent, but weak on end-to-end evaluation rigor and on self-contained scripted workflows. The best-practice documents emphasize coherent units, concise active instructions, and evals that measure whether a skill actually improves outcomes, not just whether a report contains expected words ([What are skills](https://agentskills.io/what-are-skills), lines 96-104; [Best practices](https://agentskills.io/skill-creation/best-practices), lines 99-147; [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills), lines 72-145 and 280-318; [Using scripts](https://agentskills.io/skill-creation/using-scripts), lines 162-205). This repo only partially meets that bar.

## Overall Rating

Overall repository health: 3/5.

Breakdown:

| Dimension | Score | Rationale |
|---|---:|---|
| Structural discipline | 4/5 | Active inventory is clearly bounded; active skills pass the structural checker; root contract is explicit in `AGENTS.md:67-78` and `.github/copilot-instructions.md:9-33`. |
| Documentation accuracy | 3/5 | Core flows are documented consistently, but root docs still mention a nonexistent `skill creator/` directory (`README.md:10`, `AGENTS.md:11`, `.github/copilot-instructions.md:65`). |
| Skill-contract quality | 3/5 | Most active skills are reasonably scoped and concise, but several still depend on stale `manifest`/metadata concepts or nonexistent lifecycle/catalog artifacts. |
| Evaluation credibility | 2/5 | The runner measures routing/behavior/usefulness gates, but not the baseline and handoff artifacts many skills claim to depend on. |
| Operational reliability | 2/5 | Root scripts are coherent, but deployed-script pathing, optional external dependencies, and generated-output assumptions reduce trust in the workflow. |

## Top Findings

1. Severity: High. Claim: `skill-evaluation` promises a richer eval artifact than the shipped runner produces, so the `skill-evaluation` -> `skill-improver` handoff is not closed. Impact: the repo documents eval-driven improvement, but the main runner only emits gates and top-level JSON metadata, not the baseline section or structured Handoff block that downstream skills expect. Repo evidence: `skill-evaluation/SKILL.md:48-59`, `skill-evaluation/SKILL.md:109-158`, `skill-improver/SKILL.md:120-147`, `scripts/run-evals.sh:760-863`, `scripts/run-evals.sh:938-949`. External baseline: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills), lines 72-145 and 280-318.
2. Severity: High. Claim: `skill-testing-harness` teaches dead eval schema, and `skill-creator` delegates to it. Impact: the creation pipeline can generate eval suites that the live runner does not actually honor. Repo evidence: `skill-testing-harness/SKILL.md:80-110`, `skill-creator/SKILL.md:188-200`, `AGENTS.md:45-65`, `scripts/run-evals.sh:553-578`. External baseline: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills), lines 72-145.
3. Severity: High. Claim: deployed per-skill script copies are not reliably self-contained when invoked from the skill package. Impact: several active skills document `./scripts/...` usage that breaks when run relative to the skill root, undermining the script-backed workflow model. Repo evidence: `skill-creator/SKILL.md:198-200`, `skill-testing-harness/SKILL.md:145-149`, `skill-evaluation/SKILL.md:48-53`, `skill-trigger-optimization/SKILL.md:130`, `skill-improver/SKILL.md:217-223`, `scripts/sync-to-skills.sh:20-32`, deployed copies such as `skill-creator/scripts/run-evals.sh:53-54`, `skill-creator/scripts/run-evals.sh:795-881`, and `skill-improver/scripts/run-baseline-comparison.sh:18-19`. External baseline: [Using scripts](https://agentskills.io/skill-creation/using-scripts), lines 162-205.
4. Severity: High. Claim: `skill-improver` still assumes manifest/metadata support removed by the active repo contract. Impact: one of the central improvement skills is still steering users toward a package model the repo explicitly rejects. Repo evidence: `skill-improver/SKILL.md:16-21`, `skill-improver/SKILL.md:29-33`, `skill-improver/SKILL.md:101-105`, `skill-improver/SKILL.md:165-198`, `skill-improver/evals/behavior.jsonl:3`, `AGENTS.md:65-78`, `.github/copilot-instructions.md:58-66`. External baseline: [What are skills](https://agentskills.io/what-are-skills), lines 96-104.
5. Severity: High. Claim: `skill-catalog-curation` and `skill-lifecycle-management` depend on nonexistent lifecycle/catalog artifacts, and lifecycle contains a real `ARCHIVE` vs `archive` path bug. Impact: the library-management pipeline is conceptually clear but not executable as written. Repo evidence: `skill-catalog-curation/SKILL.md:33-34`, `skill-catalog-curation/SKILL.md:76-81`, `skill-lifecycle-management/SKILL.md:56-58`, `skill-lifecycle-management/SKILL.md:96-104`, `skill-lifecycle-management/SKILL.md:107-111`, `skill-lifecycle-management/SKILL.md:169`, `README.md:8`, `README.md:32-35`, `AGENTS.md:95-117`. External baseline: [Best practices](https://agentskills.io/skill-creation/best-practices), lines 135-147.
6. Severity: High. Claim: behavior evals are widely misaligned with their skills' output contracts. Impact: the eval layer can pass outputs that violate the documented contract and fail outputs that satisfy it. Repo evidence: `skill-evaluation/SKILL.md:111-139` vs `skill-evaluation/evals/behavior.jsonl:1-3`; `skill-improver/SKILL.md:232-263` vs `skill-improver/evals/behavior.jsonl:1-4`; `skill-trigger-optimization/SKILL.md:89-114` vs `skill-trigger-optimization/evals/behavior.jsonl:1-3`; `skill-benchmarking/SKILL.md:78-104` vs `skill-benchmarking/evals/behavior.jsonl:1-3`; `skill-catalog-curation/SKILL.md:71-105` vs `skill-catalog-curation/evals/behavior.jsonl:1-3`; `skill-lifecycle-management/SKILL.md:113-160` vs `skill-lifecycle-management/evals/behavior.jsonl:1-3`.
7. Severity: High. Claim: `run-corpus-eval.sh` documents two-layer corpus evaluation but only automates Layer 1. Impact: the repo presents a stronger corpus-evaluation story than the tooling currently implements. Repo evidence: `scripts/run-corpus-eval.sh:4-5`, `scripts/run-corpus-eval.sh:111-194`, `docs/evaluation-cadence.md:99-114`. External baseline: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills), lines 280-318.
8. Severity: High. Claim: `harvest_failures.py` and `run-regression-suite.sh` do not close the loop for trigger failures. Impact: failures can be harvested but still never re-tested. Repo evidence: `scripts/harvest_failures.py:31-35`, `scripts/run-evals.sh:431`, `scripts/run-regression-suite.sh:43-49`, `scripts/run-full-cycle.sh:153-175`, `docs/evaluation-cadence.md:149-154`.
9. Severity: Medium. Claim: `run-trigger-optimization.sh` temporarily mutates tracked `SKILL.md` even though it says it does not auto-apply changes. Impact: the automation is reversible, but it is not mutation-free and should be documented that way. Repo evidence: `scripts/run-trigger-optimization.sh:14-21`, `scripts/run-trigger-optimization.sh:377-409`, `scripts/run-trigger-optimization.sh:470-535`.
10. Severity: Low. Claim: root docs still mention a nonexistent `skill creator/` directory. Impact: readers get stale layout information, and inventory boundary docs are slightly untrustworthy. Repo evidence: `README.md:10`, `AGENTS.md:11`, `.github/copilot-instructions.md:65`.
11. Severity: Medium. Claim: active skills still contain stale `manifest` assumptions and some stale archived-skill references. Impact: the active inventory still points partially at a distribution-era package model and neighbors that are no longer active. Repo evidence: `skill-improver/SKILL.md:16-21`, `skill-improver/SKILL.md:165-198`, `skill-adaptation/evals/trigger-negative.jsonl:6`, `skill-safety-review/evals/trigger-negative.jsonl:4`, `archive/README.md:11-14`.

## Evaluation-System Effectiveness Assessment

| Area | Score | Assessment | Evidence |
|---|---:|---|---|
| Routing measurement | 3/5 | Better than a naive keyword proxy because `--observe` checks actual `view` reads of `SKILL.md`, but the runner still does not validate skill-vs-no-skill value. | `scripts/run-evals.sh:27-32`, `scripts/run-evals.sh:220-227`, `scripts/run-evals.sh:243-261` |
| Behavior/protocol checks | 2/5 | The runner checks patterns, forbidden strings, expected headings, and minimum length, but many suites assert the wrong protocol. | `scripts/run-evals.sh:547-578`, examples in the Top Findings list above |
| Usefulness assessment | 3/5 | There is a meaningful opt-in second-pass judge with configurable thresholds, but coverage is sparse and it sits on top of already-misaligned behavior suites. | `scripts/run-evals.sh:607-748`, `AGENTS.md:60-63` |
| Baseline/benchmark methodology | 1/5 | Baseline comparison is promised across skills, but the main runner does not compute it, and the comparison helper does not provide win rate or token accounting. | `skill-evaluation/SKILL.md:93-99`, `scripts/run-baseline-comparison.sh:128-228`, `scripts/run-evals.sh:760-863` |
| Corpus design | 3/5 | The corpus has realistic weak/strong/adversarial/regression tiers, but only Layer 1 is automated. | `corpus/README.md:1-36`, `scripts/run-corpus-eval.sh:4-5`, `scripts/run-corpus-eval.sh:187-194` |
| Regression protection | 1/5 | The repo seeds three regression cases, but harvested trigger failures are skipped rather than replayed, and preservation checking is unreliable for active skill headings. | `corpus/README.md:30-36`, `scripts/run-regression-suite.sh:43-49`, `scripts/check_preservation.py:10-17`, `scripts/check_preservation.py:97-117` |
| Operational reliability | 2/5 | Sync integrity is strong, but deployed-script pathing, optional external dependencies, and generated-output assumptions reduce trust in the workflow. | `scripts/sync-to-skills.sh:20-32`, `scripts/run-meta-skill-cycle.sh:1-13`, `scripts/run-full-cycle.sh:48-50` |

Overall evaluation-system score: 2.1/5.

## Pipeline Assessment

| Edge | Status | Assessment | Evidence |
|---|---|---|---|
| `skill-creator -> skill-testing-harness` | Partial | The flow is documented, but `skill-creator` already creates eval files itself, so ownership is blurry. | `README.md:20-24`, `skill-creator/SKILL.md:177-200`, `skill-creator/SKILL.md:270-274` |
| `skill-testing-harness -> skill-evaluation` | Partial | Intended flow is clear, but the harness teaches schema the runner does not honor. | `README.md:20-24`, `skill-testing-harness/SKILL.md:166-178`, `scripts/run-evals.sh:553-578` |
| `skill-evaluation -> skill-trigger-optimization` | Partial | Routing-failure route is correct, but downstream evidence is thinner than promised. | `skill-evaluation/SKILL.md:153-166`, `scripts/run-evals.sh:760-863` |
| `skill-evaluation -> skill-improver` | Broken | `skill-improver` expects a structured Handoff and failing-prompt evidence that the runner does not produce. | `AGENTS.md:93`, `skill-evaluation/SKILL.md:132-158`, `skill-improver/SKILL.md:120-147`, `scripts/run-evals.sh:938-949` |
| `skill-trigger-optimization -> skill-evaluation` | Partial | The route is right, but the optimization script mutates the tracked skill during analysis and the packaged copy is not self-contained. | `skill-trigger-optimization/SKILL.md:123-130`, `scripts/run-trigger-optimization.sh:377-409` |
| `skill-improver -> skill-evaluation` | Partial | Good intent, but improvement relies on stale manifest assumptions and a weak comparison helper. | `skill-improver/SKILL.md:215-223`, `scripts/run-baseline-comparison.sh:128-228` |
| `skill-improver -> skill-trigger-optimization` | Implemented | Trigger-change follow-up is clearly documented. | `skill-improver/SKILL.md:327-330` |
| `skill-anti-patterns -> skill-improver` | Implemented | The diagnostic-to-rewrite handoff is clear. | `skill-anti-patterns/SKILL.md:169-174` |
| `skill-evaluation -> skill-anti-patterns` | Manual | The improvement pipeline in root docs includes it, but `skill-evaluation` itself routes failures to trigger optimization, improver, benchmarking, or safety. | `README.md:26-30`, `skill-evaluation/SKILL.md:160-166` |
| `skill-catalog-curation -> skill-lifecycle-management` | Broken | Intent is clear, but lifecycle-state artifacts and update locations do not exist. | `README.md:32-35`, `skill-catalog-curation/SKILL.md:33-34`, `skill-lifecycle-management/SKILL.md:56-58`, `skill-lifecycle-management/SKILL.md:107-111` |

## Remediation Order

1. Unify the live eval contract and all `behavior.jsonl` suites around what the runner actually checks.
2. Make `skill-evaluation` emit the baseline and Handoff artifacts that `skill-improver` and the root docs claim exist.
3. Remove stale `manifest`, metadata, and nonexistent lifecycle/catalog-index assumptions from active skills.
4. Decide whether deployed per-skill scripts are meant to be runnable from the package root; if yes, make them self-contained, and if not, rewrite the procedures to call root scripts explicitly.
5. Repair the corpus/regression loop:
   - make harvest parsing match current fail-line format,
   - make regression replay trigger failures,
   - fix `check_preservation.py` for active `#` headings.
6. Clean root-doc drift:
   - remove `skill creator/`,
   - clarify `eval-results/` as generated output,
   - document which scripts are optional or experimental.

## Pointers

- Active-skill detail: `annex-active-skills.md`
- Shared tooling/docs detail: `annex-shared-tooling-and-docs.md`
- Archive/corpus/flow detail: `annex-archive-corpus-flows.md`
