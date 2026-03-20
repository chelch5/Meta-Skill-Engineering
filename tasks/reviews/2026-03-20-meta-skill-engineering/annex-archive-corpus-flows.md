# Annex C: Archive, Corpus, And Flow Matrix

Method note: archived skills are reviewed here as legacy/reference packages, not against the active two-field-frontmatter and current-eval-schema contract unless active materials still depend on them. Corpus findings combine static inspection, current script behavior, and live file counts from 2026-03-20 (`weak=5`, `strong=5`, `adversarial=5`, `regression=3`).

## Archived Skill Corpus

The archive rationale is internally coherent: these four packages were removed because they mainly serve external distribution, import, or provenance workflows rather than the active internal creation-improvement-evaluation suite (`archive/README.md:3-14`).

| Archived skill | Current reference value | Review | Active impact |
|---|---|---|---|
| `community-skill-harvester` | External discovery and adoption workflow | Coherent as a legacy specialist for GitHub/registry search, licensing, and import proposals (`archive/community-skill-harvester/SKILL.md:8-15,44-57,74-111`) | No current active package directly depends on it. |
| `skill-installer` | Local client-install workflow | Coherent as a distribution/install operator with client-path assumptions and safety checks (`archive/skill-installer/SKILL.md:13-20,29-47,75-87,89-120`) | Not part of active inventory; useful only if this repo returns to shipping distributable skills. |
| `skill-packaging` | Packaging, manifests, checksums, overlays | Clearly a legacy distribution package centered on manifest/checksum/overlay artifacts (`archive/skill-packaging/SKILL.md:14-17,43-75,76-110,117-140`) | Its manifest-heavy model is still leaking into active skills, especially `skill-improver` and some eval expectations. |
| `skill-provenance` | Origin/trust/license audit | Coherent as an external-trust specialist, especially for imported skills (`archive/skill-provenance/SKILL.md:15-25,37-42,58-60,77-95,96-120`) | One active negative-trigger suite still points to it, so it still affects active routing boundaries. |

### Archived-Skill Findings

1. Medium. Archived distribution concepts still bleed into the active inventory. `skill-packaging` centers manifests, checksums, compatibility metadata, and overlays, and `skill-improver` still talks as if manifests and metadata are live support-layer concepts. Impact: active skills inherit legacy distribution assumptions that the current repo contract rejects. Evidence: `archive/skill-packaging/SKILL.md:14-17,43-75`; `skill-improver/SKILL.md:16-21,101-105,165-198`; `.github/copilot-instructions.md:58-62`.

2. Medium. Archived skills still appear in active boundary tests. Impact: active routing examples are not fully normalized to the current 12-skill inventory. Evidence: `skill-adaptation/evals/trigger-negative.jsonl:6`; `skill-safety-review/evals/trigger-negative.jsonl:4`; `archive/README.md:11-14`.

## Corpus Review

The corpus design is directionally strong. It separates weak skills that should be repaired, strong skills that should be preserved, adversarial skills that should be handled safely, and regression fixtures seeded from known failure types (`corpus/README.md:3-36`). That is consistent with Agent Skills guidance to evaluate realistic prompts, assert concrete success conditions, and protect against regressions over time. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills), [Best practices](https://agentskills.io/skill-creation/best-practices).

### Corpus Strengths

1. The tier mix is balanced enough to support comparative review: five weak, five strong, and five adversarial fixtures creates a usable spread for structural and behavioral audits. Evidence: `corpus/README.md:10-28`; live file count on 2026-03-20.

2. The regression tier starts with named failure classes rather than blank placeholders. Evidence: `corpus/README.md:30-36`; live regression count on 2026-03-20 is `3`.

### Corpus Findings

1. High. The automated corpus evaluation only implements Layer 1 structural scoring. Layer 2, which should compare before/after quality after a meta-skill acts, is documented as manual follow-up only. Impact: the corpus currently measures "can we structurally score the fixtures?" more than "does the meta-skill improve them?". Evidence: `scripts/run-corpus-eval.sh:4-5,111-195`; `docs/evaluation-cadence.md:106-114`. Best-practice reference: [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

2. Medium. Regression coverage remains narrow because automatic harvesting does not reliably convert trigger failures into replayable protection. Impact: the regression tier is unlikely to grow along the most common routing-failure path without manual intervention. Evidence: `corpus/README.md:30-36`; `scripts/harvest_failures.py:31-35`; `scripts/run-regression-suite.sh:43-49`; `scripts/run-full-cycle.sh:153-175`.

3. Medium. Full-cycle automation only runs corpus evaluation for `skill-improver` and `skill-anti-patterns`, even though the corpus README frames the corpus as a shared test bed for `skill-evaluation`, `skill-safety-review`, and other meta-skills too. Impact: corpus coverage is narrower in practice than the corpus docs imply. Evidence: `corpus/README.md:4-6`; `scripts/run-full-cycle.sh:115-144`.

## Flow Matrix

Status meanings used below:

- `Implemented`: documented and materially supported by shipped tooling/artifacts.
- `Partial`: documented and partly tooled, but contract gaps or stale assumptions weaken the handoff.
- `Manual`: documented, but the handoff depends on human judgment rather than dedicated artifacts.
- `Broken`: the handoff depends on missing, incorrect, or contradictory artifacts.

### Creation Pipeline

| Edge | Status | Why | Evidence |
|---|---|---|---|
| `skill-creator -> skill-testing-harness` | Partial | The delegation is explicit, but the receiving skill still teaches dead eval schema. | `README.md:20-24`; `skill-creator/SKILL.md:194-200,305-309`; `skill-testing-harness/SKILL.md:83-110` |
| `skill-testing-harness -> skill-evaluation` | Partial | The harness is meant to emit the active eval directory, but stale fields make that handoff unreliable. | `skill-testing-harness/SKILL.md:140-164,174-178`; `AGENTS.md:33-65` |
| `skill-evaluation -> skill-trigger-optimization` | Manual | Evaluation can expose routing problems and the pipeline names trigger optimization next, but no structured routing-specific artifact is emitted. | `README.md:20-24`; `skill-evaluation/SKILL.md:160-166`; `skill-trigger-optimization/SKILL.md:123-130`; `scripts/run-evals.sh:760-863,938-949` |
| `skill-evaluation -> skill-improver` | Broken | The documented `eval-results/<skill>-eval.md` handoff with primary failure and failing cases is not produced by the runner. | `AGENTS.md:93`; `skill-evaluation/SKILL.md:132-155`; `skill-improver/SKILL.md:120-147`; `scripts/run-evals.sh:938-949` |
| `skill-trigger-optimization -> skill-safety-review` | Manual | The flow is documented, but there is no dedicated handoff artifact beyond human review of the optimization output. | `README.md:20-24`; `skill-trigger-optimization/SKILL.md:123-130`; `skill-safety-review/SKILL.md:20-25,120-123` |
| `skill-safety-review -> skill-lifecycle-management` | Broken | The pipeline claims this edge, but `skill-safety-review` does not hand off there explicitly and `skill-lifecycle-management` lacks the state/index targets it expects. | `README.md:20-24`; `skill-safety-review/SKILL.md:120-123`; `skill-lifecycle-management/SKILL.md:47-58,107-111` |

### Improvement Pipeline

| Edge | Status | Why | Evidence |
|---|---|---|---|
| `skill-evaluation -> skill-anti-patterns` | Manual | The pipeline is documented and the anti-pattern skill can take a target SKILL directly, but there is no dedicated structured handoff between them. | `README.md:27-30`; `AGENTS.md:88-93`; `skill-anti-patterns/SKILL.md:35-40,169-174` |
| `skill-anti-patterns -> skill-improver` | Manual | This is a clear diagnosis-to-repair path, but it is mediated by human interpretation rather than a machine-readable artifact. | `skill-anti-patterns/SKILL.md:169-174`; `skill-improver/SKILL.md:120-147,325-330` |
| `skill-improver -> skill-trigger-optimization` | Manual | The handoff is explicitly named and the optimization tool exists, but the bridge is a reviewer decision rather than an artifact contract. | `skill-improver/SKILL.md:325-330`; `skill-trigger-optimization/SKILL.md:123-130` |

### Library Management Pipeline

| Edge | Status | Why | Evidence |
|---|---|---|---|
| `skill-catalog-curation -> skill-lifecycle-management` | Broken | The edge is documented, but both sides assume catalog and lifecycle state artifacts that do not exist in the active repo. | `README.md:32-35`; `skill-catalog-curation/SKILL.md:71-105,128-135`; `skill-lifecycle-management/SKILL.md:47-58,107-111`; `AGENTS.md:95-98` |

## Flow Assessment

The strongest practical flow in the repo today is the human-guided diagnosis-and-repair path: `skill-evaluation` for signal gathering, `skill-anti-patterns` for structural diagnosis, `skill-improver` for package repair, and `skill-trigger-optimization` for routing polish. The weakest flows are the ones that depend on shared state or machine-readable handoff artifacts: `skill-evaluation -> skill-improver` and `skill-catalog-curation -> skill-lifecycle-management`. Those are the places where the repo's design intent is clearest, but the implementation gap is also the largest.
