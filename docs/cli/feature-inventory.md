# Meta Skill Studio feature inventory

This inventory records the **actual suite surface** for plan 13. It is the audit baseline for headless coverage, not a marketing list.

## Inventory boundaries

- **Repo-owned root skills** are the 17 top-level packages with `SKILL.md`.
- **`LibraryUnverified/`, `LibraryWorkbench/`, and `Library/`** are library tiers, not additions to the root inventory.
- **The Python Studio CLI** is the authoritative headless execution surface.
- **TUI, tkinter GUI, and Tauri** are convenience shells layered on the same workflow truth.

## Repo-owned workflow inventory

| Area | What exists in-repo | Canonical headless surface | Primary artifacts |
| --- | --- | --- | --- |
| Authoring | Create new skills, improve existing skills | `create`, `improve` | `.meta-skill-studio/runs/<timestamp>-create.json`, `.meta-skill-studio/runs/<timestamp>-improve.json` |
| Evaluation | Structural validation, JSONL evals, combined judge summary, benchmark generation, run comparison, improvement briefs | `validate-skills`, `run-evals`, `evaluate-skill`, `benchmark-skill`, `compare-runs`, `improvement-brief` | `eval-results/`, `.meta-skill-studio/runs/*.json` |
| Library operations | External skill discovery, import, promote, demote, move, library/meta audit | `find-skills`, `import-skill`, `promote-skill`, `demote-skill`, `move-skill`, `meta-manage`, `catalog-audit` | `.meta-skill-studio/runs/*.json`, copied skill trees in library tiers |
| Governance | Safety review, provenance review, lifecycle review | `safety-review`, `provenance-review`, `lifecycle-review` | `.meta-skill-studio/runs/*.json` |
| Distribution | Packaging and install workflows | `package-skill`, `install-skill` | `.meta-skill-studio/runs/*.json` |
| Orchestration | Documented creation / improvement / library-management pipelines, Archive skill-fault ingestion, and deterministic autonomous library-improvement batches | `run-pipeline`, `resume-pipeline`, `ingest-skill-fault`, `run-library-improvement` | `tasks/pipelines/<id>-state.json`, `tasks/pipelines/<id>-final-report.json`, `tasks/worklogs/library-improvement-*.jsonl`, `.meta-skill-studio/runs/*.json` |
| Runtime introspection | Model/provider discovery, auth, runtime stats | `list-models`, `list-providers`, `auth-provider`, `opencode-stats` | JSON stdout, `.meta-skill-studio/config.json` |
| Platform introspection | Action inventory, root/library skill listing, run listing, run inspection | `list-actions`, `list-skills`, `list-runs`, `show-run` | JSON stdout, `.meta-skill-studio/runs/*.json` |

## Shared backend versus surface-only features

### Shared backend features

These are backed by `scripts/meta-skill-studio.py` plus `scripts/meta_skill_studio/app.py`, so they are reachable without Tauri:

- skill creation and improvement
- structural validation and eval execution
- benchmark fixture generation
- library import and tier movement
- deterministic library catalog audit with tier status metadata
- Archive skill-fault packet ingestion into tracked pipeline dispositions
- provider/model/runtime inspection
- run artifact persistence under `.meta-skill-studio/runs/`
- orchestrator pipeline execution via `skill-orchestrator/scripts/run_pipeline.py`
- autonomous 50-skill library improvement runs through the OpenCode SDK bridge with worker and judge model controls

### Tauri convenience-shell features

These remain useful, but they are **not** the authoritative workflow contract:

| Tauri UI feature | Status |
| --- | --- |
| Navigation rail, shell layout, assistant panel chrome, menu structure | Convenience UI only |
| Dashboard cards, inline analytics cards, model pickers, selection affordances | Convenience UI over shared backend/runtime data |
| Linux and Windows desktop bundles | Delivery layer only |

### Non-authoritative or intentionally limited surfaces

| Surface | Disposition |
| --- | --- |
| `scripts/run-meta-skill-cycle.sh` | Experimental orchestration helper; not part of the authoritative CLI contract |
| `scripts/meta_skill_studio/opencode_sdk_bridge.mjs` | Assistant-chat bridge only; not the workflow authority for create/improve/evaluate/library operations |

## Coverage notes from the plan-13 hardening pass

1. **Hidden CLI gaps closed:** the Python CLI now exposes pipeline execution, governance/distribution workflows, introspection actions, and run comparison/improvement-brief actions instead of stopping at partial UI parity.
2. **Blocking CLI behavior fixed:** runtime-free actions no longer force OpenCode role configuration, and missing required parameters now return explicit CLI errors instead of uncaught tracebacks.
3. **Stable artifact story added:** run-producing actions now emit versioned `meta-skill-studio-run` JSON artifacts with consistent top-level fields.

## Audit checklist

Use this inventory together with `docs/cli/action-contract.md`:

1. `python scripts/meta-skill-studio.py --mode cli --action list-actions --format json`
2. Confirm every row in the workflow table above has at least one canonical action.
3. Confirm run-producing actions write `.meta-skill-studio/runs/*.json` or a documented pipeline/eval artifact.
