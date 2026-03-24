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

- implementer starts only after `approved_plan` is true
- implementation artifact records what changed and validation run
- implementation proof uses the canonical `.opencode/state/artifacts/<ticket-id>/<stage>-<kind>.md` path

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
