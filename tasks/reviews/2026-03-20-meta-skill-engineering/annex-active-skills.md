# Annex A: Active Skills Review

Method note: structural compliance in this annex refers to a local 2026-03-20 run of `python scripts/check_skill_structure.py <skill>/SKILL.md` for all 12 active skills. Every active skill returned `valid: true` and `score: 10/10`; the checker enforces the current two-field frontmatter and heading-order contract in `scripts/check_skill_structure.py:9-26,54-67`.

Comparison baseline: where findings depend on Agent Skills guidance rather than only repo-local contract, this annex cites [What are skills](https://agentskills.io/what-are-skills), [Quickstart](https://agentskills.io/skill-creation/quickstart), [Best practices](https://agentskills.io/skill-creation/best-practices), [Optimizing descriptions](https://agentskills.io/skill-creation/optimizing-descriptions), [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills), and [Using scripts](https://agentskills.io/skill-creation/using-scripts).

## Creation And Improvement Pipeline

### `skill-creator`

#### Purpose/Current Role

Structural compliance: yes, `10/10`, 329 lines. This is the repo's front-door creation skill: it defines the new-skill authoring flow, explicitly delegates eval authoring to `skill-testing-harness`, and then routes the created package toward evaluation, trigger optimization, safety review, and lifecycle handling (`skill-creator/SKILL.md:15,194-200,272,276-286,303-309`).

#### Strengths

The skill aims at full package creation rather than a `SKILL.md`-only rewrite, and its output contract correctly expects a complete deliverable with support layers (`skill-creator/SKILL.md:276-286`).

#### Findings

1. High. The creation flow delegates schema details to `skill-testing-harness`, but that downstream skill still teaches inactive eval fields such as `better_skill`, `expected_files`, and `min_cases`. Impact: the canonical creation pipeline can emit eval suites that violate the active repo contract before first execution. Evidence: `skill-creator/SKILL.md:194-200,305-309`; `skill-testing-harness/SKILL.md:83-93,105,109-110,140,153-164`; `AGENTS.md:33-65`; `.github/copilot-instructions.md:23-33`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills), [Best practices](https://agentskills.io/skill-creation/best-practices).

2. Medium. The skill tells users to run a bundled `./scripts/run-evals.sh`, but the deployed script copy still resolves helpers and result paths as if it were living under the repository root. Impact: the package is not reliably executable as a self-contained skill package when invoked from the skill directory. Evidence: `skill-creator/SKILL.md:200`; `skill-creator/scripts/run-evals.sh:53-54,795,798,881`; `AGENTS.md:20-31`. Best-practice reference: [Using scripts](https://agentskills.io/skill-creation/using-scripts).

3. Medium. The behavior eval does not test the documented package deliverable. Impact: a passing behavior suite would not prove that the skill actually produced the full package promised in the output contract. Evidence: `skill-creator/SKILL.md:276-286`; `skill-creator/evals/behavior.jsonl:1-3`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

#### Eval Alignment

Procedure executable as written: partial. The document is internally coherent, but the delegated harness is stale and the bundled eval runner is not portable from the package directory.

Behavior suite checks documented contract: no. It checks generic response structure, not the presence and quality of the created package artifacts promised by the skill.

#### Flow/Handoff Notes

`skill-creator -> skill-testing-harness` is implemented in text but degraded in practice because it hands users into a dead schema. The later route into `skill-evaluation` is therefore only partial.

### `skill-testing-harness`

#### Purpose/Current Role

Structural compliance: yes, `10/10`, 179 lines. This skill is supposed to author the evaluation support layer for another skill, including trigger-positive, trigger-negative, and behavior suites, then hand that skill into evaluation and benchmarking (`skill-testing-harness/SKILL.md:140-149,153-164,174-178`).

#### Strengths

Its core role is appropriate for this repo: it treats evals as a support layer around the skill package instead of as a replacement for the skill (`skill-testing-harness/SKILL.md:153-164`).

#### Findings

1. High. The negative-trigger schema still uses `better_skill`, and the behavior-schema examples still use `expected_files` and `min_cases`, all of which are explicitly inactive under the current repo contract. Impact: the skill teaches users to generate eval files that the active tooling and docs no longer recognize. Evidence: `skill-testing-harness/SKILL.md:83-93,105,109-110,140`; `AGENTS.md:33-65`; `.github/copilot-instructions.md:23-33`.

2. Medium. Like `skill-creator`, it tells users to run a bundled `./scripts/run-evals.sh`, but the deployed copy expects repo-root helper paths and an `eval-results/` directory above the package root. Impact: package-local execution is unreliable. Evidence: `skill-testing-harness/SKILL.md:148`; `skill-testing-harness/scripts/run-evals.sh:53-54,795,798,881`; `AGENTS.md:20-31`. Best-practice reference: [Using scripts](https://agentskills.io/skill-creation/using-scripts).

3. Medium. Its own behavior eval is not aligned to its output contract. Impact: the behavior suite can pass without proving that the generated eval harness follows the active JSONL schema. Evidence: `skill-testing-harness/SKILL.md:153-164`; `skill-testing-harness/evals/behavior.jsonl:1-3`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

#### Eval Alignment

Procedure executable as written: partial. The skill can describe the intended files, but the documented field set is stale and the packaged runner is non-portable.

Behavior suite checks documented contract: no. It does not verify the current JSONL contract that the repo documents in `AGENTS.md` and `.github/copilot-instructions.md`.

#### Flow/Handoff Notes

`skill-testing-harness -> skill-evaluation` is aspirationally correct, but the handoff package it generates is currently at risk of being off-contract before evaluation starts.

### `skill-evaluation`

#### Purpose/Current Role

Structural compliance: yes, `10/10`, 167 lines. This skill is the measurement node for the repo: it promises quantitative evidence about routing, output quality, and performance versus a no-skill baseline, and it claims to produce a structured report with a downstream Handoff section (`skill-evaluation/SKILL.md:16,58,93-105,109-158,160-166`).

#### Strengths

The skill correctly centers measurement before improvement and explicitly names downstream consumers, especially `skill-improver` (`skill-evaluation/SKILL.md:132-155`).

#### Findings

1. High. The promised output contract is richer than the actual runner. `skill-evaluation` requires a Baseline Comparison section and a Handoff section consumed by downstream skills, but `scripts/run-evals.sh` only emits trigger, behavior, structural, and optional usefulness gates plus a compact JSON summary. Impact: the main improvement handoff in `AGENTS.md` is broken because the canonical runner does not emit the artifact the skill promises. Evidence: `skill-evaluation/SKILL.md:109-158`; `AGENTS.md:93,117`; `README.md:30`; `scripts/run-evals.sh:547-578,760-863,938-949`.

2. Medium. The skill claims no-skill baseline comparison as part of standard evaluation, but the main runner contains no baseline execution path; that functionality lives in a separate script with a different contract. Impact: the skill overstates what a standard evaluation run will prove. Evidence: `skill-evaluation/SKILL.md:16,58,93-105,125-132`; `scripts/run-evals.sh:547-578,760-863`; `scripts/run-baseline-comparison.sh:128-228`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

3. Medium. The behavior eval is not aligned to the report contract in the SKILL. Impact: passing behavior cases would not establish that the produced report contains the promised Handoff and Baseline Comparison sections. Evidence: `skill-evaluation/SKILL.md:109-158`; `skill-evaluation/evals/behavior.jsonl:1-3`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

#### Eval Alignment

Procedure executable as written: partial. The runner can produce routing and behavior evidence, but not the full report shape the skill requires.

Behavior suite checks documented contract: no. It under-checks the skill's own output contract.

#### Flow/Handoff Notes

`skill-evaluation -> skill-improver` is only partial today. The textual contract is clear, but the report artifacts described in `AGENTS.md` and the skill itself are not emitted by the main runner.

### `skill-trigger-optimization`

#### Purpose/Current Role

Structural compliance: yes, `10/10`, 131 lines. This skill sits after evaluation or improvement to tighten routing language and report before/after routing performance (`skill-trigger-optimization/SKILL.md:89-114,123-130`).

#### Strengths

Its role matches Agent Skills guidance around making descriptions specific, action-led, and boundary-aware, and the associated runner uses a held-out train/test split instead of purely hand-wavy prompt tuning (`skill-trigger-optimization/SKILL.md:89-114`; `scripts/run-trigger-optimization.sh:10-22,97-118`). Best-practice reference: [Optimizing descriptions](https://agentskills.io/skill-creation/optimizing-descriptions).

#### Findings

1. Medium. The automation script says it "does NOT auto-apply changes", but it does temporarily overwrite the tracked `SKILL.md` during evaluation and only restores it later. Impact: the repo presents the tool as proposal-only, but the implementation still mutates tracked working-tree content during execution. Evidence: `scripts/run-trigger-optimization.sh:21-22,377-409,470-535`.

2. Medium. The skill's own behavior eval is too generic for the report it promises. Impact: the suite does not prove that the output contains the full optimization report and decision structure the skill describes. Evidence: `skill-trigger-optimization/SKILL.md:89-114`; `skill-trigger-optimization/evals/behavior.jsonl:1-3`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

#### Eval Alignment

Procedure executable as written: mostly yes at repo root, not as a package-local portable workflow. The optimization logic itself is implemented, but the "no auto-apply" framing is too strong for the current script behavior.

Behavior suite checks documented contract: no. It does not verify the full report and recommendation structure.

#### Flow/Handoff Notes

`skill-evaluation -> skill-trigger-optimization` and `skill-improver -> skill-trigger-optimization` are the strongest implemented automation edges in the repo. The train/test evaluator is real, but its working-tree mutation behavior should be treated as a caveat.

### `skill-improver`

#### Purpose/Current Role

Structural compliance: yes, `10/10`, 331 lines. This skill is the repo's main repair engine: it consumes evaluation results when present, diagnoses failure modes, improves the package, and can benchmark the result afterward (`skill-improver/SKILL.md:16-21,29-33,120-147,217-223,232-263,325-330`).

#### Strengths

It is the most complete package-level improvement skill in the repo: it explicitly considers routing, procedure quality, support layers, and failure handling rather than only prompt wording (`skill-improver/SKILL.md:16-21,232-263`).

#### Findings

1. High. The skill still assumes a support model that includes manifests and metadata artifacts, even though the active repo contract explicitly bans extra frontmatter metadata and treats manifests as stale distribution artifacts. Impact: the improver can recommend or preserve artifacts the active inventory no longer supports. Evidence: `skill-improver/SKILL.md:16-21,29-33,101-105,165-198`; `AGENTS.md:67-78`; `.github/copilot-instructions.md:13,58-62`.

2. High. Phase 1 depends on structured eval handoff data that the current `skill-evaluation` runner does not emit. Impact: the repo's headline eval-driven improvement loop is not actually closed; `skill-improver` falls back to heuristics because the promised handoff artifact is missing. Evidence: `skill-improver/SKILL.md:120-147`; `skill-evaluation/SKILL.md:132-155`; `AGENTS.md:93`; `scripts/run-evals.sh:938-949`.

3. Medium. The packaged baseline-comparison script is not self-contained when shipped inside the skill package because it still expects repo-root helpers and `eval-results/`. Impact: the procedure is reliable only when run from the monorepo, not when the skill package is treated as its own unit. Evidence: `skill-improver/SKILL.md:217-223`; `skill-improver/scripts/run-baseline-comparison.sh:18-19,69-79,130,136`; `AGENTS.md:20-31`. Best-practice reference: [Using scripts](https://agentskills.io/skill-creation/using-scripts).

4. Medium. One behavior case still requires manifest content. Impact: the skill's own eval suite encodes stale expectations that conflict with the active contract. Evidence: `skill-improver/SKILL.md:101-105,232-263`; `skill-improver/evals/behavior.jsonl:3`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

#### Eval Alignment

Procedure executable as written: partial. The diagnosis workflow is coherent, but the promised eval handoff is missing and the benchmark helper assumes repo-root context.

Behavior suite checks documented contract: no. It still expects manifest-shaped output that the active repo should no longer produce.

#### Flow/Handoff Notes

`skill-anti-patterns -> skill-improver` is a real and useful human handoff. `skill-evaluation -> skill-improver` is only partial because the structured `eval-results/<skill>-eval.md` contract is not implemented end-to-end.

## Diagnostics, Safety, And Transformation Pipeline

### `skill-anti-patterns`

#### Purpose/Current Role

Structural compliance: yes, `10/10`, 175 lines. This skill audits a target `SKILL.md` against an anti-pattern checklist and recommends fixes, making it the repo's primary structural diagnosis tool (`skill-anti-patterns/SKILL.md:16,35-40,141-159,169-174`).

#### Strengths

Its anti-pattern framing is concrete and useful, especially around overly broad triggers, buried critical steps, and routing-confusing structures (`skill-anti-patterns/SKILL.md:75-80,119-121`).

#### Findings

1. Medium. The baseline command examples invoke `python3 scripts/skill_lint.py <skill-dir>/SKILL.md`, but the actual lint script expects the skill directory, not the file path. Impact: the first automated check the skill recommends is wrong as written. Evidence: `skill-anti-patterns/SKILL.md:38-39`; `scripts/skill_lint.py:25-32`; `.github/extensions/meta-skill-tools/extension.mjs:80-87`.

2. Medium. AP-14 still treats frontmatter/tool-dependency metadata as a current concept even though the active contract limits frontmatter to `name` and `description`. Impact: the anti-pattern catalog can steer users toward preserving or adding data the repo explicitly rejects. Evidence: `skill-anti-patterns/SKILL.md:123-127`; `AGENTS.md:67-78`; `.github/copilot-instructions.md:13,58-62`.

3. Low. The skill spots split-worthy over-broad skills, but its Next steps stop at reporting and do not formalize `skill-variant-splitting` as the default downstream specialist. Impact: broad-scope diagnoses are less operationally connected than they could be. Evidence: `skill-anti-patterns/SKILL.md:75-80,169-174`.

#### Eval Alignment

Procedure executable as written: partial. The checklist itself is usable, but one baseline command is wrong and the metadata guidance is stale.

Behavior suite checks documented contract: no. `skill-anti-patterns/evals/behavior.jsonl:1-3` checks a generic report shape rather than the full anti-pattern report promised in `skill-anti-patterns/SKILL.md:141-159`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

#### Flow/Handoff Notes

`skill-evaluation -> skill-anti-patterns -> skill-improver` is one of the repo's clearest conceptual flows. The missing piece is not diagnosis quality; it is the incomplete automation and a few stale sub-checks.

### `skill-safety-review`

#### Purpose/Current Role

Structural compliance: yes, `10/10`, 124 lines. This skill audits destructive operations, excessive permissions, injection risks, scope creep, and description-behavior mismatch before publication, import, or promotion (`skill-safety-review/SKILL.md:16-18,34-84,86-123`).

#### Strengths

The safety taxonomy is strong. It explicitly separates destructive operations, permission tiers, prompt injection, and partial-failure safety, which is exactly the kind of consequential-operation review a meta-skill library should include (`skill-safety-review/SKILL.md:36-78`).

#### Findings

1. Medium. Its structural-baseline commands repeat the same incorrect `skill_lint.py <skill-dir>/SKILL.md` invocation seen in `skill-anti-patterns`. Impact: the safety review's initial automated check is not executable as documented. Evidence: `skill-safety-review/SKILL.md:66-72`; `scripts/skill_lint.py:25-32`; `.github/extensions/meta-skill-tools/extension.mjs:80-87`.

2. Medium. One negative trigger case still routes users to archived `skill-provenance`. Impact: the skill's boundary examples still rely on a removed active neighbor. Evidence: `skill-safety-review/evals/trigger-negative.jsonl:4`; `archive/README.md:11-14`.

3. Medium. The deployed `validate-skills.sh` copy scopes `REPO_ROOT` to the package root and then discovers skills under that local root. Impact: when run from the package, the script quietly validates only local children rather than the full active inventory the SKILL describes. Evidence: `skill-safety-review/SKILL.md:71`; `skill-safety-review/scripts/validate-skills.sh:12,21-24,28,31`; `AGENTS.md:20-31`. Best-practice reference: [Using scripts](https://agentskills.io/skill-creation/using-scripts).

#### Eval Alignment

Procedure executable as written: partial. The analytic framework is good, but one lint command is wrong and the shipped full-repo validator is not really package-portable.

Behavior suite checks documented contract: no. `skill-safety-review/evals/behavior.jsonl:1-3` does not fully verify the report structure promised in `skill-safety-review/SKILL.md:86-112`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

#### Flow/Handoff Notes

`skill-trigger-optimization -> skill-safety-review` is a sensible policy gate, but it remains mostly manual. The review criteria are solid; the packaged tool ergonomics and stale boundary examples are the weak points.

### `skill-benchmarking`

#### Purpose/Current Role

Structural compliance: yes, `10/10`, 118 lines. This skill is intended to compare variants head-to-head on pass rate, token usage, and win rate, then recommend which variant to keep (`skill-benchmarking/SKILL.md:15-16,34-77,78-117`).

#### Strengths

It correctly frames comparison as same-cases-only and includes a useful blind judging rubric instead of reducing the task to a single score (`skill-benchmarking/SKILL.md:39-73`).

#### Findings

1. High. The documented metric set is broader than the tooling actually supports. The skill promises token usage and blind win-rate comparison, but the referenced scripts only provide structural deltas, trigger/behavior gates, and optional usefulness scoring. Impact: the advertised benchmark report cannot be produced automatically with the repo's current tooling. Evidence: `skill-benchmarking/SKILL.md:4-7,15-16,46-57,78-104`; `scripts/run-evals.sh:547-578,760-863,938-949`; `scripts/run-baseline-comparison.sh:159-228`.

2. Medium. The packaged `run-baseline-comparison.sh` copy is not self-contained because it still expects repo-root helpers and `eval-results/`. Impact: the skill's scripted workflow only works reliably from the monorepo root, not from the package in isolation. Evidence: `skill-benchmarking/SKILL.md:48-52`; `skill-benchmarking/scripts/run-baseline-comparison.sh:18-19,69-79,130,136`; `AGENTS.md:20-31`. Best-practice reference: [Using scripts](https://agentskills.io/skill-creation/using-scripts).

3. Medium. The behavior eval is too generic for the promised benchmark report. Impact: the suite does not verify that the output includes pass rate, token usage, win rate, significance, and recommendation in the exact structure the skill claims. Evidence: `skill-benchmarking/SKILL.md:78-104`; `skill-benchmarking/evals/behavior.jsonl:1-3`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

#### Eval Alignment

Procedure executable as written: partial. The comparison concepts are sound, but the tooling cannot deliver the full metric set the SKILL promises.

Behavior suite checks documented contract: no. It under-checks the benchmark report shape.

#### Flow/Handoff Notes

This skill is more conceptual than operational right now. It points to useful tooling, but the actual scripts implement a lighter comparison contract than the SKILL advertises.

### `skill-adaptation`

#### Purpose/Current Role

Structural compliance: yes, `10/10`, 121 lines. This skill ports an existing skill into a new repository, stack, team, or project context while preserving core procedure and safety constraints (`skill-adaptation/SKILL.md:15-17,35-83,84-120`).

#### Strengths

Its distinction between adaptation points and invariants is strong, and it properly blocks on missing target-context information instead of guessing (`skill-adaptation/SKILL.md:37-38,39-63,72-83`).

#### Findings

1. Medium. The procedure centers `SKILL.md` rewriting but under-specifies how to adapt support layers such as `scripts/`, `references/`, and `evals/` when those assets are context-bound too. Impact: adapted packages can look correct at the top level while their support layers remain stale. Evidence: `skill-adaptation/SKILL.md:65-81,84-106`; `AGENTS.md:15-17`. Best-practice reference: [What are skills](https://agentskills.io/what-are-skills), [Best practices](https://agentskills.io/skill-creation/best-practices).

2. Low. One negative trigger case still names archived `skill-packaging` as the alternative. Impact: boundary examples still lean on a legacy distribution-era skill rather than the active inventory. Evidence: `skill-adaptation/evals/trigger-negative.jsonl:6`; `archive/README.md:11-14`.

#### Eval Alignment

Procedure executable as written: mostly yes for `SKILL.md` adaptation, partial for full-package adaptation. The skill needs clearer support-layer instructions to match the repo's package model.

Behavior suite checks documented contract: no. `skill-adaptation/evals/behavior.jsonl:1-3` does not fully prove that both required artifacts in `skill-adaptation/SKILL.md:86-106` were produced. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

#### Flow/Handoff Notes

`skill-adaptation -> skill-evaluation -> skill-trigger-optimization -> skill-safety-review` is a coherent manual flow. The main weakness is package-depth coverage, not routing between specialists.

### `skill-variant-splitting`

#### Purpose/Current Role

Structural compliance: yes, `10/10`, 125 lines. This skill identifies a clean split axis for an over-broad skill, defines variants, and recommends what to do with the original (`skill-variant-splitting/SKILL.md:15,36-83,84-124`).

#### Strengths

The split-axis selection rules are disciplined and useful. The skill rightly prioritizes few variants, distinct trigger vocabularies, and branch elimination over superficial categorization (`skill-variant-splitting/SKILL.md:42-53`).

#### Findings

1. Medium. The output contract stops at a planning/report artifact and does not require actual variant package drafts, even though the procedure says "write each variant". Impact: the skill is stronger at split analysis than at executing the split. Evidence: `skill-variant-splitting/SKILL.md:65-69,84-110`.

2. Medium. The behavior eval is too shallow for the documented report. Impact: passing behavior cases would not prove that the coverage map, shared-core decision, and migration recommendation were all produced at the required level. Evidence: `skill-variant-splitting/SKILL.md:84-110`; `skill-variant-splitting/evals/behavior.jsonl:1-3`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

#### Eval Alignment

Procedure executable as written: partial. The analysis process is clear, but the deliverable is less concrete than the procedure implies.

Behavior suite checks documented contract: no. It does not fully assert the promised split report structure.

#### Flow/Handoff Notes

`skill-variant-splitting -> skill-catalog-curation` and `skill-variant-splitting -> skill-lifecycle-management` are explicit and sensible. The missing step is a concrete package-creation handoff for the generated variants.

## Library Management Pipeline

### `skill-catalog-curation`

#### Purpose/Current Role

Structural compliance: yes, `10/10`, 136 lines. This skill audits the whole library for duplicates, category drift, discoverability gaps, and deprecation candidates, then emits a prioritized curation report (`skill-catalog-curation/SKILL.md:14,31-69,71-135`).

#### Strengths

The duplicate-detection heuristics are more concrete than a generic "review the library" prompt, especially around action signatures and mutual cross-references (`skill-catalog-curation/SKILL.md:36-43`).

#### Findings

1. High. The skill depends on a metadata-and-index model that does not exist in the active repo. It asks for maturity counts, catalog consistency, tags, naming conventions, and catalog entry updates, but the current repo contract explicitly limits frontmatter to `name` and `description` and does not define a separate library index. Impact: the skill's main output asks reviewers to reason over state the repository does not actually store. Evidence: `skill-catalog-curation/SKILL.md:4-6,33,71-105,128`; `AGENTS.md:67-78,109-118`; `.github/copilot-instructions.md:13,58-62`.

2. Medium. Category heuristics are only loosely grounded in the actual inventory model. "Category" is inferred from pipeline membership, but the repo stores no canonical category field or generated catalog artifact. Impact: repeated audits can produce inconsistent categorization decisions. Evidence: `skill-catalog-curation/SKILL.md:33-35,44-49`; `README.md:63-85`.

3. Medium. The behavior eval does not verify the six-section report the skill requires. Impact: passing tests would not prove that inventory, duplicates, category issues, discoverability gaps, deprecation candidates, and prioritized actions were all present. Evidence: `skill-catalog-curation/SKILL.md:71-105`; `skill-catalog-curation/evals/behavior.jsonl:1-3`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

#### Eval Alignment

Procedure executable as written: partial. The review heuristics are usable, but the skill depends on library state that the repo does not currently persist.

Behavior suite checks documented contract: no. It under-checks the required six-section report.

#### Flow/Handoff Notes

`skill-catalog-curation -> skill-lifecycle-management` is conceptually correct but operationally weak because both sides assume lifecycle/catalog state artifacts that are absent.

### `skill-lifecycle-management`

#### Purpose/Current Role

Structural compliance: yes, `10/10`, 181 lines. This skill is supposed to manage lifecycle transitions, deprecation, and retirement across the library, including reference updates and archive movement (`skill-lifecycle-management/SKILL.md:15-16,35-58,60-111,113-180`).

#### Strengths

Its state model is explicit and its deprecation procedure correctly insists on updating dependents before retirement takes effect (`skill-lifecycle-management/SKILL.md:37-58,73-92`).

#### Findings

1. High. The skill depends on nonexistent lifecycle and catalog artifacts. It tells users to record transitions in a lifecycle index and update catalog entries, but no such active index exists in the repo. Impact: the central state-management step of the skill has nowhere authoritative to land. Evidence: `skill-lifecycle-management/SKILL.md:47-58,107-111,165-170`; `AGENTS.md:67-78,109-118`.

2. High. The deprecation procedure has a path bug: it tells users to move packages into `ARCHIVE/`, while the repository's actual archive directory is lowercase `archive/`. Impact: following the procedure as written would create or target the wrong path. Evidence: `skill-lifecycle-management/SKILL.md:94-105`; `README.md:8`; `AGENTS.md:112`; local top-level listing on 2026-03-20 shows `archive/` and no `ARCHIVE/`.

3. Medium. The behavior eval still expects metadata-oriented output. Impact: the skill's own eval suite encodes a stale model that conflicts with the active frontmatter and inventory rules. Evidence: `skill-lifecycle-management/SKILL.md:92,107-111,113-160`; `skill-lifecycle-management/evals/behavior.jsonl:1-3`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

#### Eval Alignment

Procedure executable as written: partial. The transition logic is sensible, but the key persistence targets do not exist and one archive path is wrong.

Behavior suite checks documented contract: no. It still expects metadata-state language rather than the repo's actual state model.

#### Flow/Handoff Notes

This is the most broken downstream operator in the active inventory. Many skills point to it, but the repo has not implemented the lifecycle index or catalog state it assumes.
