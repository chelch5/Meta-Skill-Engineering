# Canonical Brief Schema

Use this structure when normalizing a spec pack or opportunistically scanned input repo.

## 1. Project Summary

- One paragraph.
- State what is being built and why.

## 2. Goals

- Flat bullet list of desired outcomes.

## 3. Non-Goals

- Flat bullet list of explicit exclusions.

## 4. Constraints

- Platform/runtime constraints
- Model/provider constraints
- Repository/process constraints
- Integration/tooling constraints

## 5. Required Outputs

- Required repo structure
- Required docs
- Required agent/tool/plugin outputs
- Required validation expectations

## 6. Tooling and Model Constraints

- provider expectations
- primary model
- optional helper model
- runtime or host constraints

## 7. Canonical Truth Map

- canonical facts file
- canonical queue state
- canonical transient workflow state
- canonical artifact/proof locations
- canonical provenance surface
- derived handoff surfaces

## 8. Blocking Decisions

- unresolved choices that materially change implementation
- grouped into a batched decision packet

## 9. Non-Blocking Open Questions

- unresolved questions that do not prevent the first execution wave

## 10. Backlog Readiness

- whether the first execution wave can be detailed now
- which areas are still blocked on decisions

## 11. Acceptance Signals

- What must be true for the result to be considered usable

## 12. Assumptions

- Only include non-blocking assumptions that do not silently decide major project behavior
