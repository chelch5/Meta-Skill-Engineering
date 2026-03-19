# Meta Skill Engineering

This repository is a working area for repo-owned meta-skills that create, refine, test, package, and govern agent skills.

Current state:

- 20 repo-owned skill packages at the repository root
- The `skill creator/` workspace contains archived source material that was consolidated into `skill-creator/`
- The imported `foundskills/` corpus has been removed from the active tree

## Repository Layout

- `./<skill-name>/` — repo-owned skill packages at the repository root. Each package has a `SKILL.md` baseline contract and may include supporting files such as `manifest.yaml`, `references/`, `scripts/`, `evals/`, `assets/`, `agents/`, or `overlays/`.
- `skill creator/` — archived workspace containing the original source material for the skill-creator consolidation. Not part of the active inventory.
- `tasks/` — task notes, worklogs, and repo maintenance instructions.

## Skill Inventory

| Folder | Purpose |
| --- | --- |
| `community-skill-harvester` | Find external skills from public registries and evaluate them for adoption. |
| `skill-adaptation` | Rewrite a skill's context-dependent references for a new environment. |
| `skill-anti-patterns` | Scan SKILL.md for concrete anti-patterns and report fixes. |
| `skill-benchmarking` | Compare skill variants on the same test cases. |
| `skill-catalog-curation` | Detect duplicates, enforce category consistency, and verify discoverability. |
| `skill-creator` | Create new agent skills from scratch and iterate through test-review-improve cycles. |
| `skill-deprecation-manager` | Safely deprecate, retire, or merge obsolete skills. |
| `skill-evaluation` | Evaluate a single skill's routing accuracy, output quality, and baseline value. |
| `skill-improver` | Improve an existing skill package. |
| `skill-installer` | Install a skill package into a local agent client skill directory. |
| `skill-lifecycle-management` | Manage skills through draft, beta, stable, deprecated, and archived states. |
| `skill-packager` | Build distributable bundles for one or more skills in a release. |
| `skill-packaging` | Bundle a finished skill into a versioned archive with manifest, checksums, and overlays. |
| `skill-provenance` | Audit and record origin, authorship, license, and trust level for a skill. |
| `skill-reference-extraction` | Split large reference material out of a SKILL.md. |
| `skill-registry-manager` | Maintain the skill library catalog and generate the index. |
| `skill-safety-review` | Audit a skill for safety hazards before publication or import. |
| `skill-testing-harness` | Build test infrastructure for a skill. |
| `skill-trigger-optimization` | Fix skill routing by rewriting description and boundary text. |
| `skill-variant-splitting` | Split a broad skill into focused variants. |
