# Annex B: Shared Tooling And Documentation

Method note: this annex combines static inspection of root docs and scripts, local validator runs, local hash comparisons between root scripts and deployed copies, and a targeted filesystem check of the top-level tree on 2026-03-20.

## Root Docs Accuracy Vs Actual Tree

1. High. Root docs still describe `skill creator/` as an archived top-level directory, but that path is absent from the current tree. Impact: the repo's own layout docs are not fully trustworthy about what exists on disk. Evidence: `README.md:7-14`; `AGENTS.md:11,109-118`; local top-level listing on 2026-03-20 contains `archive/`, `corpus/`, `docs/`, `scripts/`, the 12 active skills, and `tasks/`, but not `skill creator/`.

2. High. The root docs and Copilot instructions still present `eval-results/<skill>-eval.md` as a structured handoff artifact between `skill-evaluation` and `skill-improver`, but the main runner does not emit the promised Handoff section or baseline-comparison block. Impact: the most important documented repo pipeline is overstated in all three top-level guidance files. Evidence: `README.md:13,30`; `AGENTS.md:93,117`; `.github/copilot-instructions.md:71`; `docs/evaluation-cadence.md:125-154`; `scripts/run-evals.sh:547-578,760-863,938-949`.

3. Medium. The root governance rule says docs must stay current with every contract or tooling change, but multiple shipped helpers still encode stale contracts. Impact: contributors can comply with the root docs and still get conflicting guidance from repo-maintained tooling. Evidence: `AGENTS.md:7-10`; `.github/copilot-instructions.md:58-66`; `scripts/quick_validate.py:41-50`; `scripts/check_preservation.py:10-17`.

## Script Distribution Model

Positive observation: the sync model itself is coherent. Root `scripts/` is explicitly the source of truth, the manifest is visible at the top of `scripts/sync-to-skills.sh`, and a local 2026-03-20 hash comparison found the deployed copies matched their root sources for the referenced packages. Evidence: `AGENTS.md:20-31`; `scripts/sync-to-skills.sh:20-32`.

1. High. Identical deployed copies are not the same thing as portable deployed copies. Several shipped script copies still resolve `REPO_ROOT` relative to the copied package and then look for repo-level helpers or sibling skill directories under that local root. Impact: the documented "live/deployed copy" model works for monorepo development, but not for package-local execution from the copied skill. Evidence: `skill-creator/scripts/run-evals.sh:53-54,795,798,881`; `skill-improver/scripts/run-baseline-comparison.sh:18-19,69-79,130,136`; `skill-safety-review/scripts/validate-skills.sh:12,21-24,28,31`; `AGENTS.md:20-31`. Best-practice reference: [Using scripts](https://agentskills.io/skill-creation/using-scripts).

2. Medium. `scripts/check_preservation.py` only extracts `##` headings, but the active repo contract requires canonical sections as `#` headings. Impact: preservation checks against active skills can miss real section content or misclassify modifications. Evidence: `scripts/check_preservation.py:10-17,97-117`; `.github/copilot-instructions.md:13-21`; `AGENTS.md:69-78`.

3. Medium. `scripts/quick_validate.py` still allows legacy frontmatter fields such as `license`, `allowed-tools`, `metadata`, and `compatibility`, which conflicts with the active two-field contract. Impact: anyone using the quick validator can receive a false green light for off-contract files. Evidence: `scripts/quick_validate.py:41-50`; `AGENTS.md:69-78`; `.github/copilot-instructions.md:13,58-62`.

## Evaluation Runner And Comparison Scripts

1. High. `scripts/run-evals.sh` is strong at routing detection and lightweight format checks, but it does not implement the repo's advertised baseline-comparison and structured-handoff contract. Impact: a "passing" evaluation run is narrower than the repo's docs and `skill-evaluation` skill text claim. Evidence: `scripts/run-evals.sh:27-35,220-261,547-578,760-863,938-949`; `skill-evaluation/SKILL.md:109-158`; `AGENTS.md:93`.

2. Medium. The behavior runner checks `expected_sections`, `required_patterns`, `forbidden_patterns`, and `min_output_lines`, which is appropriate as a generic harness, but many shipped behavior suites do not map those checks to each skill's actual output contract. Impact: the evaluation system can report "behavior pass" while missing material contract failures. Evidence: `scripts/run-evals.sh:547-578`; `skill-creator/evals/behavior.jsonl:1-3`; `skill-evaluation/evals/behavior.jsonl:1-3`; `skill-improver/evals/behavior.jsonl:3`; `skill-catalog-curation/evals/behavior.jsonl:1-3`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

3. Medium. `scripts/run-baseline-comparison.sh` is useful as a structural/regression gate, but it is not a full benchmark engine despite the way `skill-evaluation` and `skill-benchmarking` lean on it. Impact: "baseline comparison" in this repo means structural delta plus pass/fail comparison, not token-usage or blind quality win-rate benchmarking. Evidence: `scripts/run-baseline-comparison.sh:128-228`; `skill-evaluation/SKILL.md:93-105,125-132`; `skill-benchmarking/SKILL.md:46-57,78-104`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

4. Medium. `scripts/run-trigger-optimization.sh` uses a sound held-out evaluation design, but it still mutates the tracked `SKILL.md` during scoring despite its proposal-only framing. Impact: repo users should treat it as a temporary write workflow rather than a pure read-only analysis step. Evidence: `scripts/run-trigger-optimization.sh:10-22,377-409,470-535`; `docs/evaluation-cadence.md:96-105`. Best-practice reference: [Optimizing descriptions](https://agentskills.io/skill-creation/optimizing-descriptions).

## Corpus Eval, Regression Harvesting, And Failure Closure

1. High. `scripts/run-corpus-eval.sh` documents a two-layer meta-skill evaluation, but only Layer 1 is automated; Layer 2 is left as manual follow-up instructions. Impact: the corpus system currently measures structural pre-scores and harness preparation much more than end-to-end improvement quality. Evidence: `scripts/run-corpus-eval.sh:4-5,111-195`; `docs/evaluation-cadence.md:106-114`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

2. High. The trigger-failure regression loop does not close. `run-evals.sh` prints failures with `activated=...`, `harvest_failures.py` looks for `mentioned=...`, and `run-regression-suite.sh` then skips `trigger_failure` cases anyway. Impact: the repo claims automatic harvesting and regression protection for trigger failures, but the implemented path does not actually re-protect them. Evidence: `scripts/run-evals.sh:431`; `scripts/harvest_failures.py:31-35`; `scripts/run-regression-suite.sh:43-49`; `scripts/run-full-cycle.sh:153-175`; `docs/evaluation-cadence.md:29-30,149-154`.

3. Medium. The current corpus runner only evaluates `skill-improver` and `skill-anti-patterns` in the full-cycle script. Impact: corpus evaluation is valuable, but it is presently a narrow audit of only two meta-skills rather than a library-wide check. Evidence: `scripts/run-full-cycle.sh:115-144`; `docs/evaluation-cadence.md:23-30,106-114`.

## `.github/copilot-instructions.md` And Extension Review

Positive observation: the extension layer improves one important paper cut. `mse_lint_skill` converts a `SKILL.md` path into the containing directory before invoking `skill_lint.py`, which corrects the path-shape mistake still present in two SKILL files. Evidence: `.github/extensions/meta-skill-tools/extension.mjs:80-87`; `skill-anti-patterns/SKILL.md:38-39`; `skill-safety-review/SKILL.md:69-70`.

1. Medium. `.github/copilot-instructions.md` is mostly aligned with the active frontmatter and eval contract, but it repeats the broken `eval-results` handoff story. Impact: the repo's strongest user-facing instruction file still encodes a key pipeline behavior that the tooling does not provide. Evidence: `.github/copilot-instructions.md:13-33,71`; `scripts/run-evals.sh:938-949`.

2. Medium. The extension hardcodes `python3` and `bash`, and the repo's operational docs assume an Ubuntu-style environment. In context this is intentional rather than a defect, but it means the extension should be evaluated as environment-specific tooling, not as generally portable repo automation. Evidence: `.github/extensions/meta-skill-tools/extension.mjs:40-46,58-61,84-86`; `README.md:89`; `docs/evaluation-cadence.md:9-11,25-27`.

## Shared Assessment

The shared infrastructure has a clear internal architecture: root docs define the active contract, `scripts/sync-to-skills.sh` distributes source-of-truth automation, `run-evals.sh` provides a credible routing/behavior harness, and the extension offers a useful shell over the validators. The main weakness is not absence of intent; it is contract drift. The repo currently has three parallel truths: the active docs, the automation actually shipped, and a set of legacy helper assumptions that still preserve metadata, manifest, or package-portability expectations no longer supported by the active inventory.
