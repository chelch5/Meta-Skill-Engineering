# Safe Stage Contracts

## Planning

- planner owns a decision-complete plan
- planner writes the full artifact body before registration
- planning artifact must exist before plan review

## Plan review

- reviewer sees the actual plan artifact or full plan content
- review output uses write-then-register when persisted
- approval flips workflow-state, not ticket status

## Implementation

- implementer starts only after the assigned ticket shows `approved_plan: true` in workflow-state
- implementation artifact records what changed and validation run
- implementation proof uses the canonical stage-specific artifact path plus registration in `.opencode/state/artifacts/registry.json`

## Review

- reviewer stays read-only
- review artifact records findings or acceptance

## QA

- QA stays read-only
- QA artifact records checks run and closeout readiness

## Closeout

- closeout uses the ticket tools and handoff tools
- handoff publication updates the managed START-HERE block without overwriting curated repo-specific sections
- derived views are regenerated instead of hand-edited

## Process migration

- managed-surface replacement records a repair entry in bootstrap provenance
- workflow state records the active process version and whether post-migration verification is still pending
- previously completed tickets are not assumed valid after a process replacement until the backlog verifier checks them

## Guarded follow-up ticket creation

- follow-up tickets created because of a process migration must point at a backlog-verifier artifact
- ticket creation is gated to the verification window instead of being generally available
- the team leader approves whether a verifier finding becomes a new ticket
