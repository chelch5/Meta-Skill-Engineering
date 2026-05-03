---
name: transmute
description: >-
  Transform a single function, module, or data structure from one form to another
  while preserving behavior. Triggers on "convert this function to [language]",
  "migrate from [API v1] to [v2]", "replace [dependency] with [alternative]",
  and "refactor to [paradigm]". Use for targeted conversions of one function,
  class, or module, not full system transformations.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.1"
  domain: alchemy
  complexity: intermediate
  language: multi
  tags: alchemy, transmutation, conversion, refactoring, transformation, targeted
---

# Transmute

Transform a specific piece of code or data from one form to another — language translation, paradigm shift, format conversion, or API migration — while preserving essential behavior and semantics.

## When to Use

- Converting a function from one language to another (Python to R, JavaScript to TypeScript)
- Shifting a module from one paradigm (class-based to functional, callbacks to async/await)
- Migrating an API consumer from v1 to v2 of an external service
- Converting data between formats (CSV to Parquet, REST to GraphQL schema)
- Replacing a dependency with an equivalent (moment.js to date-fns, jQuery to vanilla JS)
- When the transformation scope is a single function, class, or module (not a full system)

## When NOT to Use

- **Full system transformations** — use `athanor` for system-wide architectural changes
- **Creating new code from scratch** — use appropriate creation skills; transmute requires existing source material
- **Complex multi-file dependencies** — when the change spans 5+ tightly coupled files, the scope is too large
- **When source behavior is undefined** — if the source has no tests, documentation, or clear inputs/outputs, analyze it first before attempting transmutation
- **Runtime environment changes** — deployment, infrastructure, or configuration migrations (use infrastructure-specific skills)
- **UI/UX redesigns** — visual or interaction changes without underlying logic transformation

## Inputs

- **Required**: Source material (file path, function name, or data sample)
- **Required**: Target form (language, paradigm, format, or API version)
- **Optional**: Behavioral contract (tests, type signatures, or expected I/O pairs)
- **Optional**: Constraints (must maintain backward compatibility, performance budget)

## Procedure

### Step 1: Analyze the Source Material

Understand exactly what the source does before attempting transformation.

1. Read the source completely — every branch, edge case, and error path
2. Identify the **behavioral contract**:
   - What inputs does it accept? (types, ranges, edge cases)
   - What outputs does it produce? (return values, side effects, error signals)
   - What invariants does it maintain? (ordering, uniqueness, referential integrity)
3. Catalog dependencies: what does the source import, call, or rely on?
4. If tests exist, read them to understand expected behavior
5. If no tests exist, write behavioral characterization tests before transmuting

**Expected:** A complete understanding of what the source does (not how it does it). The behavioral contract is explicit and testable.

**On failure:**
- If source complexity exceeds ~100 lines or 3+ nested logic levels: Stop, identify the smallest extractable function, and transmute that first. Escalate remainder to `athanor`.
- If behavior is ambiguous (unclear what inputs/outputs mean): Ask the user explicitly: "What should happen when input X is Y?" — do not guess.
- If no source file exists at the specified path: Verify path with `Glob` or `Bash ls`, then ask user for corrected path.

### Step 2: Map Source to Target Form

Design the transformation mapping.

1. For each element in the source, identify the target equivalent:
   - Language constructs: loops → map/filter, classes → closures, etc.
   - API calls: old endpoint → new endpoint, request/response shape changes
   - Data types: data frame columns → schema fields, nested JSON → flat tables
2. Identify elements with **no direct equivalent**:
   - Source features missing in target (e.g., pattern matching in a language without it)
   - Target idioms that don't exist in source (e.g., R's vectorization vs. Python loops)
3. For each gap, choose an adaptation strategy:
   - Emulate: reproduce the behavior with target-native constructs
   - Simplify: if the source construct was a workaround, use the target's native solution
   - Document: if behavior changes slightly, note the difference explicitly
4. Write the **transformation map**: source element → target element, for every piece

**Expected:** A complete mapping where every source element has a target destination. Gaps are identified and adaptation strategies chosen.

**On failure:**
- If >30% of source elements lack direct target equivalents: Stop and reconsider. Either (a) select a different target form with better feature parity, or (b) escalate to `athanor` for architectural redesign.
- If fundamental paradigm mismatch detected (e.g., OOP to purely functional): Document the paradigm tension explicitly and ask user whether to (a) emulate OOP in target, (b) redesign to native paradigm, or (c) abort.

### Step 3: Execute the Transformation

Write the target form following the map.

1. Create the target file(s) with appropriate structure and boilerplate
2. Transmute each element following the map from Step 2:
   - Preserve the behavioral contract — same inputs produce same outputs
   - Use target-native idioms rather than literal translations
   - Maintain or improve error handling
3. Handle dependencies:
   - Replace source dependencies with target equivalents
   - If a dependency has no equivalent, implement a minimal adapter
4. Add inline comments only where the transformation was non-obvious

**Expected:** A complete target implementation that follows the transformation map. The code reads like it was written natively in the target form, not mechanically translated.

**On failure:**
- If a specific element resists transformation: Isolate it, mark it with `// TRANSMUTE-FOLLOWUP`, transform remaining elements, then return to the resistant element with focused attention.
- If target syntax/compilation fails: Run target language compiler/interpreter, capture error output, fix syntax errors iteratively until clean build succeeds.
- If dependency has no equivalent after 10 min search: Document the gap, implement minimal viable adapter (max 50 lines), or ask user to suggest alternative dependency.

### Step 4: Verify Behavioral Equivalence

Confirm the transmuted form preserves the original's behavior.

1. Run the behavioral contract tests against the target implementation
2. For each test case, verify:
   - Same inputs → same outputs (within acceptable tolerance for numeric conversions)
   - Same error conditions → equivalent error signals
   - Side effects (if any) are preserved or documented as changed
3. Check edge cases explicitly:
   - Null/NA/undefined handling
   - Empty collections
   - Boundary values (max int, empty string, zero-length arrays)
4. If the target form adds capabilities (e.g., type safety), verify those too

**Expected:** All behavioral contract tests pass. Edge cases are handled equivalently. Any behavioral differences are documented and intentional.

**On failure:**
- If tests fail: Run source and target side-by-side on failing inputs. Diff outputs precisely. Fix target until outputs match within acceptable tolerance.
- If source has no tests to run against: Create minimal characterization tests now — 3-5 cases covering normal, edge, and error paths — then verify target against these.
- If divergence is intentional (e.g., fixing source bug): Document in behavioral divergence log with rationale: "Changed from X to Y because [reason]."
- If >20% of tests fail: Consider whether source contract was misunderstood. Return to Step 1 for re-analysis.

## Validation Checklist

Validate the transmutation before marking complete:

- [ ] Source material fully analyzed with explicit behavioral contract documented in writing
- [ ] Transformation map covers every source element with no unmapped items
- [ ] Gaps identified with adaptation strategies documented in code comments or separate ADR
- [ ] Target implementation uses native idioms (not literal translation) — verify by reading code aloud
- [ ] All behavioral contract tests pass against target — run the test suite and confirm 100% pass rate
- [ ] Edge cases verified (null, empty, boundary values) — test each explicitly with concrete inputs
- [ ] Dependencies resolved with target equivalents — verify imports/requires resolve without errors
- [ ] Any behavioral differences documented and intentional — add explicit behavioral-change notes to output

**Stop condition:** If 2+ checklist items fail, pause and reassess the transmutation scope or approach.

## Output Contract

A successful transmutation produces:

1. **Target implementation file(s)** — Complete, idiomatic code in the target form that compiles/parses without errors
2. **Behavioral contract documentation** — Explicit documentation of inputs, outputs, and invariants preserved (can be inline comments or separate file)
3. **Test verification report** — Evidence that behavioral contract tests pass (test output, exit codes, or explicit test results)
4. **Dependency mapping** — List of source dependencies and their target equivalents or adapters
5. **Behavioral divergence log** — Documented list of any intentional behavioral changes with rationale

**Quality gate:** The target code must be reviewable by a native speaker of the target language/stack without requiring knowledge of the source form.

## Common Pitfalls

- **Literal translation**: Writing Python-in-R or Java-in-JavaScript instead of using target idioms. The result should look native
- **Skipping behavioral tests**: Transmuting without tests means you can't verify equivalence. Write characterization tests first
- **Ignoring edge cases**: The happy path transmutes easily; edge cases are where bugs hide
- **Over-engineering the adapter**: If a dependency needs a 200-line adapter, the transmutation scope is too large
- **Transmuting comments verbatim**: Comments should explain the target code, not echo the source. Rewrite them

## Next Steps

- `athanor` — Full four-stage transformation for systems too large for a single transmute
- `chrysopoeia` — Optimizing transmuted code for maximum value extraction
- `review-software-architecture` — Post-transmutation architecture review for larger conversions
- `serialize-data-formats` — Specialized data format conversion procedures
- `skill-evaluation` — Verify transmutation quality after completion
- `skill-testing-harness` — Build test infrastructure if behavioral contract tests are missing
