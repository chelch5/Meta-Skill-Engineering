# Evaluation Tests for Excalidraw Diagram Generator

This directory contains evaluation tests for validating the `excalidraw-diagram-generator` skill.

## Test Files

### trigger-positive.jsonl and trigger-negative.jsonl
20 trigger tests covering positive and negative routing decisions.

**Categories:**
- **Should trigger (10 tests)**: Explicit diagram creation requests
- **Should NOT trigger (10 tests)**: Editing, conversion, explanation, wrong tool

**Run trigger tests:**
```bash
# Using skill-evaluation skill
python -m opencode.skill-evaluation \
  --skill LibraryUnverified/37-documentation-technical/excalidraw-diagram-generator \
  --tests evals/trigger-positive.jsonl \
  --mode trigger
```

### behavior.jsonl
12 behavior tests validating output quality and correctness.

**Test coverage:**
- Basic flowchart generation (beh_001)
- Mind map with radial layout (beh_002)
- Relationship diagram with labeled arrows (beh_003)
- Complexity management (beh_004 - oversized request handling)
- Minimal diagram (beh_005)
- Class diagram with UML notation (beh_006)
- Sequence diagram with lifelines (beh_007)
- ER diagram with keys and cardinality (beh_008)
- Data flow diagram (beh_009)
- Swimlane diagram (beh_010)
- Decision diamond in flowchart (beh_011)
- Architecture diagram with multiple components (beh_012)

**Success criteria for all tests:**
1. Valid Excalidraw JSON structure
2. All text elements use `fontFamily: 5` (Excalifont)
3. No overlapping elements (minimum 200px horizontal spacing)
4. Unique IDs for all elements
5. Consistent color scheme
6. Delivery summary with element count

**Run behavior tests:**
```bash
# Using skill-evaluation skill
python -m opencode.skill-evaluation \
  --skill LibraryUnverified/37-documentation-technical/excalidraw-diagram-generator \
  --tests evals/behavior.jsonl \
  --mode behavior
```

## Scoring

- **all_or_nothing**: All criteria must pass for test to count as success
- **weighted**: Criteria weighted by importance (see individual test weights)

## Validation Thresholds

Minimum required scores for skill acceptance:
- **Trigger accuracy**: ≥ 90% (18/20 correct)
- **Behavior quality**: ≥ 80% (10/12 criteria met across tests)
- **No critical failures**: All "all_or_nothing" tests must pass

## Adding New Tests

To add a new test:

1. Choose appropriate file (trigger or behavior)
2. Assign unique test_id (prefix with `trig_` or `beh_`)
3. Define input and expected outcomes
4. Run full suite to verify no regressions
