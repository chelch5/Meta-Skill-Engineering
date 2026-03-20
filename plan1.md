# Plan 1: Hub Anti-Pattern Remediation

## Problem

The 12 skills form a 55%-dense dependency graph (73/132 possible edges). `skill-improver` is referenced by all 11 other skills; `skill-evaluation` by 10/11. Descriptions spend 34% of their words on "Do not use" routing. 213 total cross-references create maintenance fragility and routing confusion.

---

## Phase 1: Strip Negative Routing from Descriptions

**Rationale**: Every description field contains "Do not use for X (use skill-Y)" text. This text is redundant — every skill already has a `# When NOT to use` section with the same (or better) content. The description is the primary routing signal for the host; overloading it with negative routing dilutes the positive signal.

**Rule**: Description field contains ONLY: action verb + what it does + positive trigger phrases. No "Do not use" text.

### Exact changes per skill:

#### skill-adaptation
**Current** (73 words):
```yaml
description: >-
  Adapt an existing skill to a different repository, stack, team, or project
  context while preserving the core pattern. Use when asked to "port this skill
  to Python/Vue/pnpm", "customize this library skill for our project", or
  "localize this skill for a different environment". Do not use for writing a
  new skill from scratch (use skill-creator), improving an existing
  project-specific skill without changing context (use skill-improver), or
  splitting one skill into stack-specific variants (use skill-variant-splitting).
```
**After** (42 words):
```yaml
description: >-
  Adapt an existing skill to a different repository, stack, team, or project
  context while preserving the core pattern. Use when asked to "port this skill
  to Python/Vue/pnpm", "customize this library skill for our project", or
  "localize this skill for a different environment".
```

#### skill-anti-patterns
**Current** (76 words):
```yaml
description: >-
  Audit a SKILL.md for structural anti-patterns that reduce routing accuracy,
  output quality, or maintainability. Use when a user says "check this skill
  for anti-patterns", "what's wrong with this skill", or "audit this skill
  before promotion". Also use for post-failure diagnostics when a skill
  misbehaves but the root cause is unclear. Do not use for full skill rewrites
  (use skill-creator), trigger-only fixes (use skill-trigger-optimization),
  surgical fixes to known problems (use skill-improver), or measuring
  routing precision/recall (use skill-evaluation).
```
**After** (50 words):
```yaml
description: >-
  Audit a SKILL.md for structural anti-patterns that reduce routing accuracy,
  output quality, or maintainability. Use when a user says "check this skill
  for anti-patterns", "what's wrong with this skill", or "audit this skill
  before promotion". Also use for post-failure diagnostics when a skill
  misbehaves but the root cause is unclear.
```

#### skill-benchmarking
**Current** (67 words):
```yaml
description: >-
  Compare skill variants head-to-head using pass rate, routing accuracy, and
  usefulness score to pick a winner. Use when choosing between two skill versions
  ("which is better?", "did the refinement help?", "benchmark these variants"),
  measuring whether a change improved quality, or deciding whether to keep or
  deprecate a variant. Do not use for evaluating a single skill in isolation (use
  skill-evaluation) or for building test infrastructure (use
  skill-testing-harness).
```
**After** (48 words):
```yaml
description: >-
  Compare skill variants head-to-head using pass rate, routing accuracy, and
  usefulness score to pick a winner. Use when choosing between two skill versions
  ("which is better?", "did the refinement help?", "benchmark these variants"),
  measuring whether a change improved quality, or deciding whether to keep or
  deprecate a variant.
```

#### skill-catalog-curation
**Current** (63 words):
```yaml
description: >-
  Audit a skill library for duplicates, category drift, and discoverability gaps;
  verify naming conventions, cross-references between SKILL.md files, and
  description quality across skill directories.
  Use when: "audit the skill library", "clean up overlapping skills",
  "organize the catalog", "find duplicate skills".
  Do not use for: improving a single skill (skill-improver), creating a new skill (skill-creator),
  promoting or deprecating individual skills through lifecycle states (skill-lifecycle-management).
```
**After** (40 words):
```yaml
description: >-
  Audit a skill library for duplicates, category drift, and discoverability gaps;
  verify naming conventions, cross-references between SKILL.md files, and
  description quality across skill directories.
  Use when: "audit the skill library", "clean up overlapping skills",
  "organize the catalog", "find duplicate skills".
```

#### skill-creator
**Current** (88 words):
```yaml
description: >-
  Create new agent skills from scratch and iteratively improve them through
  test-review-improve cycles. Use this for "create a skill for X", "write a
  skill that handles Y", "I need a new skill to do Z", "turn this workflow
  into a skill", or when a repeated task pattern should become a reusable
  agent procedure. Do not use for splitting a broad skill into variants
  (skill-variant-splitting), adapting a skill to a different environment
  (skill-adaptation), improving an existing skill without full iteration
  (skill-improver), or running standalone evaluations without creation
  intent (skill-evaluation).
```
**After** (53 words):
```yaml
description: >-
  Create new agent skills from scratch and iteratively improve them through
  test-review-improve cycles. Use this for "create a skill for X", "write a
  skill that handles Y", "I need a new skill to do Z", "turn this workflow
  into a skill", or when a repeated task pattern should become a reusable
  agent procedure.
```

#### skill-evaluation
**Current** (84 words):
```yaml
description: >-
  Evaluate whether a single skill routes correctly and produces better output
  than a no-skill baseline — measuring positive trigger rate, negative rejection
  rate, and output win rate. Use when someone says "is this skill working?", "validate before
  promoting", "does this skill still add value?", "run the eval suite", or
  "regression test this skill". Supports both ad-hoc evaluation and running
  existing eval suites. Do not use for comparing multiple variants head-to-head
  (skill-benchmarking), building test infrastructure or eval suites
  (skill-testing-harness), or fixing a broken skill (skill-improver).
```
**After** (62 words):
```yaml
description: >-
  Evaluate whether a single skill routes correctly and produces better output
  than a no-skill baseline — measuring positive trigger rate, negative rejection
  rate, and output win rate. Use when someone says "is this skill working?",
  "validate before promoting", "does this skill still add value?", "run the
  eval suite", or "regression test this skill". Supports both ad-hoc evaluation
  and running existing eval suites.
```

#### skill-improver
**Current** (80 words):
```yaml
description: >-
  Improve an existing skill package — tighten routing, sharpen procedure, add or
  prune support layers, upgrade packaging. Use when the user says "improve this
  skill", "this skill is weak/vague/bloated", "harden this SKILL.md", or "add
  evals/references to this skill package". Do not use for creating a new skill
  from scratch (use skill-creator), trigger-only fixes when the body is fine
  (use skill-trigger-optimization), porting a skill to a different stack or
  context (use skill-adaptation), or quick structural audits with no rewrite
  (use skill-anti-patterns).
```
**After** (39 words):
```yaml
description: >-
  Improve an existing skill package — tighten routing, sharpen procedure, add or
  prune support layers, upgrade packaging. Use when the user says "improve this
  skill", "this skill is weak/vague/bloated", "harden this SKILL.md", or "add
  evals/references to this skill package".
```

#### skill-lifecycle-management
**Current** (72 words):
```yaml
description: >-
  Manage skill lifecycle states (draft → beta → stable → deprecated → archived)
  including promotion criteria, deprecation procedures, and maturity audits. Use
  when a user says "deprecate this skill", "promote this to stable", "retire
  this", "this is replaced by X", "which skills are production-ready", or
  "audit maturity across the library". Do not use for creating new skills
  (use skill-creator), improving individual skill quality (use skill-improver),
  or reorganizing the library catalog (use skill-catalog-curation).
```
**After** (50 words):
```yaml
description: >-
  Manage skill lifecycle states (draft → beta → stable → deprecated → archived)
  including promotion criteria, deprecation procedures, and maturity audits. Use
  when a user says "deprecate this skill", "promote this to stable", "retire
  this", "this is replaced by X", "which skills are production-ready", or
  "audit maturity across the library".
```

#### skill-safety-review
**Current** (100 words):
```yaml
description: >-
  Audit a SKILL.md and its bundled scripts for safety hazards — destructive
  operations missing confirmation gates, excessive permissions, prompt injection
  vectors, scope creep, and description-behavior mismatches. Use when a user
  says "review this skill for safety", "is this skill safe to publish",
  "check for destructive operations", or "audit before sharing". Use before
  publishing to a shared registry, after importing from an untrusted source,
  or when a skill performs consequential operations (file deletion, API calls,
  deployments). Do not use for routing or output-quality evaluation (use
  skill-evaluation), structural anti-pattern detection (use skill-anti-patterns),
  or skills that are purely informational with no side effects.
```
**After** (75 words):
```yaml
description: >-
  Audit a SKILL.md and its bundled scripts for safety hazards — destructive
  operations missing confirmation gates, excessive permissions, prompt injection
  vectors, scope creep, and description-behavior mismatches. Use when a user
  says "review this skill for safety", "is this skill safe to publish",
  "check for destructive operations", or "audit before sharing". Use before
  publishing to a shared registry, after importing from an untrusted source,
  or when a skill performs consequential operations (file deletion, API calls,
  deployments).
```

#### skill-testing-harness
**Current** (60 words):
```yaml
description: >-
  Build trigger tests and behavior tests for a skill's evals/ directory.
  Use when "create tests for this skill", "set up evals", "build a test
  harness", a new skill needs test coverage, or a skill lacks an evals/
  directory. Do not use for running existing tests (use skill-evaluation),
  comparing skill variants (use skill-benchmarking), or updating tests that
  already exist (edit directly).
```
**After** (38 words):
```yaml
description: >-
  Build trigger tests and behavior tests for a skill's evals/ directory.
  Use when "create tests for this skill", "set up evals", "build a test
  harness", a new skill needs test coverage, or a skill lacks an evals/
  directory.
```

#### skill-trigger-optimization
**Current** (79 words):
```yaml
description: >-
  Fix skill routing by rewriting the description and trigger boundaries so the
  right skill fires on the right inputs. Use when "this skill never fires",
  "wrong skill fired", "fix the triggers", "why isn't this skill being used?",
  or when a skill's description reads as vague marketing copy instead of routing
  logic. Also use for batch-auditing descriptions before a library release.
  Do not use for fixing output quality when routing is correct
  (use skill-improver) or structural anti-pattern audits
  (use skill-anti-patterns).
```
**After** (60 words):
```yaml
description: >-
  Fix skill routing by rewriting the description and trigger boundaries so the
  right skill fires on the right inputs. Use when "this skill never fires",
  "wrong skill fired", "fix the triggers", "why isn't this skill being used?",
  or when a skill's description reads as vague marketing copy instead of routing
  logic. Also use for batch-auditing descriptions before a library release.
```

#### skill-variant-splitting
**Current** (68 words):
```yaml
description: >-
  Split a broad skill into focused variants along stack, platform, scope, or
  domain axes. Use when "this skill does too much", "split this skill",
  "create variants for X and Y", a skill has disjoint "For X" / "For Y"
  sections, triggers on unrelated inputs, or has a conditional-branch-heavy
  procedure. Do not use for porting a skill to a different context
  (skill-adaptation), trigger-only fixes (skill-trigger-optimization), or
  catalog-level reorganization (skill-catalog-curation).
```
**After** (49 words):
```yaml
description: >-
  Split a broad skill into focused variants along stack, platform, scope, or
  domain axes. Use when "this skill does too much", "split this skill",
  "create variants for X and Y", a skill has disjoint "For X" / "For Y"
  sections, triggers on unrelated inputs, or has a conditional-branch-heavy
  procedure.
```

### Phase 1 Summary

| Skill | Before (words) | After (words) | Words removed |
|-------|---------------|--------------|--------------|
| skill-adaptation | 73 | 42 | 31 |
| skill-anti-patterns | 76 | 50 | 26 |
| skill-benchmarking | 67 | 48 | 19 |
| skill-catalog-curation | 63 | 40 | 23 |
| skill-creator | 88 | 53 | 35 |
| skill-evaluation | 84 | 62 | 22 |
| skill-improver | 80 | 39 | 41 |
| skill-lifecycle-management | 72 | 50 | 22 |
| skill-safety-review | 100 | 75 | 25 |
| skill-testing-harness | 60 | 38 | 22 |
| skill-trigger-optimization | 79 | 60 | 19 |
| skill-variant-splitting | 68 | 49 | 19 |
| **Total** | **910** | **606** | **304 (33% reduction)** |

**No information is lost** — every "Do not use" routing statement already exists in the `# When NOT to use` section of each SKILL.md.

---

## Phase 2: Reduce In-Body Cross-References

**Rationale**: Procedure, Failure handling, and Next steps sections contain references to other skills. Some are genuine pipeline handoffs (keep). Others are redundant routing that duplicates "When NOT to use" or adds no procedural value (remove).

**Classification**:
- **KEEP**: References where one skill's output is the next skill's required input (pipeline edges)
- **KEEP**: References in Next steps that define the actual pipeline
- **REMOVE**: References in Procedure that say "for X, use skill-Y" (that's the host's routing job)
- **REWRITE**: References in Failure handling that say "route to skill-X" without explaining the recovery action

### Exact changes per skill:

#### skill-adaptation
- **Failure handling**: KEEP `skill-creator` ref (genuine: "skill may not be portable, recommend skill-creator to build from scratch instead" — this is a real fallback)
- **Next steps**: KEEP all 3 refs (evaluation, trigger-opt, safety-review — these are the post-adaptation pipeline)
- **Changes: None** — all refs are genuine pipeline edges

#### skill-anti-patterns
- **Procedure**: KEEP `skill-variant-splitting` ref in AP-5 definition — it's part of the anti-pattern's fix instruction, not routing
- **Failure handling**: KEEP `skill-creator` ref — genuine fallback for malformed skills
- **Next steps**: KEEP all 3 refs — these define the post-audit pipeline
- **Changes: None** — all refs are genuine

#### skill-benchmarking
- **Procedure**: REMOVE the inline ref to `skill-evaluation` in "For skill vs no-skill baseline evaluation, use skill-evaluation"
  - **Why remove**: This is routing advice, not a procedural step. The host handles this.
  - **Replace with**: "For skill vs no-skill baseline evaluation (single-skill, not variant comparison), use a different workflow."
- **Next steps**: KEEP both refs (improver, lifecycle-management — genuine pipeline)
- **Total refs removed: 1**

#### skill-catalog-curation
- **Next steps**: KEEP both refs (trigger-opt, lifecycle-management — genuine pipeline)
- **Changes: None**

#### skill-creator (heaviest — 11 outbound refs in procedure alone)
- **Procedure**: 
  - REMOVE "For details on field schemas, delegate to `skill-testing-harness`" → Replace with: "For details on field schemas, refer to AGENTS.md."
  - REMOVE "For comprehensive test suites (8+ cases, adversarial scenarios, edge coverage), route to `skill-testing-harness`" → Replace with: "For comprehensive test suites (8+ cases), build them separately after creation."
  - KEEP "Run `skill-testing-harness`" in Phase 5 iteration loop — it's a procedural instruction
  - KEEP "Run `skill-evaluation`" in Phase 5 — procedural instruction
  - KEEP "Run `skill-trigger-optimization`" in Phase 5 — procedural instruction
  - KEEP "Run `skill-safety-review`" in Phase 5 — procedural instruction
- **Failure handling**: KEEP `skill-variant-splitting` ref — genuine fallback for over-broad scope
- **Next steps**: KEEP all 6 refs — this is the creation pipeline definition
- **Total refs removed: 2** (the "delegate to" inline routing refs)

#### skill-evaluation
- **Procedure**: KEEP `skill-benchmarking` ref — it's part of a test-writing instruction ("add trigger phrases from skill-benchmarking"), not routing
- **Failure handling**: 
  - REWRITE: "Route to `skill-improver` with the eval report" → "Stop evaluation. The eval report at `eval-results/<skill>-eval.md` documents the specific failures for use by whoever fixes the skill."
  - REMOVE second `skill-improver` ref: "This enables `skill-improver` to use eval-driven diagnosis" → Remove entire sentence (it's explaining internal mechanics, not a procedure step)
- **Next steps**: KEEP all 5 refs — these define the post-evaluation pipeline
- **Total refs removed: 2** (failure handling rewrites)

#### skill-improver
- **Procedure**: KEEP `skill-anti-patterns` ref — it's a genuine decision gate ("if 3+ anti-patterns detected, use Mode 2")
- **Failure handling**:
  - KEEP `skill-anti-patterns` ref — genuine reference to the anti-pattern catalog
  - REWRITE: "Recommend the appropriate next action: `skill-variant-splitting` for splits, `skill-catalog-curation` for merges, `skill-lifecycle-management` for retirement" → "Recommend the appropriate next action: split the skill, merge it in the catalog, or retire it."
  - **Why**: The action (split/merge/retire) is what matters, not the skill names. The host will route.
- **Next steps**: KEEP all 3 refs — post-improvement pipeline
- **Total refs removed: 3** (variant-splitting, catalog-curation, lifecycle-management from failure handling)

#### skill-lifecycle-management
- **Procedure**: KEEP both `skill-evaluation` refs — they're promotion criteria ("formal evaluation via `skill-evaluation` returned a Pass verdict"), which is a genuine dependency
- **Failure handling**: KEEP `skill-evaluation` ref — genuine: "Block promotion; recommend running skill-evaluation"
- **Next steps**: KEEP both refs (safety-review, evaluation)
- **Changes: None** — all refs are genuine data dependencies

#### skill-safety-review
- **Next steps**: KEEP both refs (improver, lifecycle-management)
- **Changes: None**

#### skill-testing-harness
- **Procedure**: KEEP 3 refs (trigger-optimization, evaluation, benchmarking) — these are inside trigger-negative test examples showing `better_skill` fields, which is test data, not routing
- **Failure handling**:
  - REWRITE: "flag for `skill-trigger-optimization`" → "Flag the skill as not ready for test generation — its description needs trigger-level rewording first."
  - REWRITE: "flag for `skill-improver` to add output contract" → "Flag the skill as needing an output contract before tests can be written."
  - KEEP `skill-catalog-curation` ref — it's a genuine merge recommendation for narrow skills
- **Next steps**: KEEP both refs (evaluation, benchmarking)
- **Total refs removed: 2** (trigger-optimization, improver from failure handling)

#### skill-trigger-optimization
- **Procedure**: REMOVE inline ref to `skill-evaluation` and `skill-benchmarking`: "tests (skill-evaluation) or comparing variants (skill-benchmarking)" → "running tests or comparing variants"
  - **Why**: This is parenthetical routing info, not a procedure step
- **Failure handling**: 
  - REWRITE: "recommend `skill-variant-splitting`" → "recommend splitting the skill into narrower variants"
  - KEEP `skill-catalog-curation` ref — genuine escalation for boundary conflicts
- **Next steps**: KEEP all 3 refs (evaluation, testing-harness, catalog-curation)
- **Total refs removed: 3** (2 from procedure, 1 from failure handling)

#### skill-variant-splitting
- **Failure handling**: REWRITE: "Report that no beneficial split axis exists — improve the skill in place (via `skill-improver`)" → "Report that no beneficial split axis exists — improve the skill in place instead."
- **Next steps**: KEEP all 3 refs (catalog-curation, evaluation, lifecycle-management)
- **Total refs removed: 1** (improver from failure handling)

### Phase 2 Summary

| Skill | Refs before | Refs removed | Refs after |
|-------|------------|-------------|-----------|
| skill-adaptation | 4 | 0 | 4 |
| skill-anti-patterns | 5 | 0 | 5 |
| skill-benchmarking | 3 | 1 | 2 |
| skill-catalog-curation | 2 | 0 | 2 |
| skill-creator | 11 | 2 | 9 |
| skill-evaluation | 7 | 2 | 5 |
| skill-improver | 7 | 3 | 4 |
| skill-lifecycle-management | 5 | 0 | 5 |
| skill-safety-review | 2 | 0 | 2 |
| skill-testing-harness | 7 | 2 | 5 |
| skill-trigger-optimization | 7 | 3 | 4 |
| skill-variant-splitting | 4 | 1 | 3 |
| **Total** | **64** | **14** | **50** |

Note: Phase 2 only targets Procedure/Failure/Next-steps sections. Description refs are handled in Phase 1.

---

## Phase 3: Break Circular Routing Chains

**Current circular chains** (bidirectional edges where A→B and B→A both exist):

| Chain | A→B location | B→A location | Resolution |
|-------|-------------|-------------|------------|
| skill-improver ↔ skill-anti-patterns | improver procedure: "3+ from skill-anti-patterns scan" | anti-patterns next-steps: "Fix found issues → skill-improver" | **Keep both** — this is a genuine diagnostic→fix pipeline. Anti-patterns diagnoses, improver fixes. Not circular in purpose. |
| skill-evaluation ↔ skill-improver | evaluation failure: "Route to skill-improver" | improver next-steps: "Verify → skill-evaluation" | **Remove evaluation→improver** (already done in Phase 2 failure rewrite). The remaining direction is: evaluation feeds data, improver acts, then routes back to evaluation for verification. This is a legitimate re-test loop, not a circular routing trap. |
| skill-evaluation ↔ skill-benchmarking | evaluation procedure: "add trigger phrases from skill-benchmarking" | benchmarking procedure: "For baseline, use skill-evaluation" | **Remove benchmarking→evaluation** (already done in Phase 2). The remaining ref in evaluation's procedure is test-writing guidance, not routing. |
| skill-testing-harness ↔ skill-trigger-optimization | harness failure: "flag for skill-trigger-optimization" | trigger-opt next-steps: "Build trigger tests → skill-testing-harness" | **Remove harness→trigger-opt** (already done in Phase 2 failure rewrite). Remaining direction: trigger-opt routes to harness for test creation. |

**Result**: After Phase 2 rewrites, all circular chains are already broken. No additional Phase 3 changes needed — the Phase 2 rewrites were designed to resolve these.

---

## Phase 4: Add AP-17 to Anti-Patterns Checklist

**File**: `skill-anti-patterns/SKILL.md`
**Location**: After AP-16 (line ~139), before `# Output contract`

**Exact text to add**:

```markdown
**AP-17: Hub coupling** · `MEDIUM` — maintenance burden and routing confusion
- Pattern: Skill references 5+ other skills by name in its body, or description contains "Do not use" routing to 3+ alternatives
- Example before: `Do not use for creating (skill-creator), improving (skill-improver), evaluating (skill-evaluation), or testing (skill-testing-harness).`
- Example after: Description contains only positive routing. Negative routing lives in "When NOT to use" section. Body references only skills whose output is a direct input.
- Fix: Move "Do not use" out of description into "When NOT to use". In procedure, reference only skills whose output this skill consumes. In next-steps, reference only the immediate next pipeline step.
```

**Also update**:
- Output contract table: add row `| AP-17 | Hub coupling | ... |`
- Any reference to "AP-1 through AP-16" → "AP-1 through AP-17"
- Purpose line: "AP-1 through AP-16" → "AP-1 through AP-17"

---

## Verification

1. **Before**: Run `scripts/run-evals.sh --all` — record baseline trigger rates
2. **Execute**: Phases 1→4
3. **After**: Run `scripts/run-evals.sh --all` — compare trigger rates
4. **Structural**: Run `scripts/validate-skills.sh` — confirm 12/12 pass
5. **Graph metrics**: Re-run graph density analysis — target <40% density
6. **Description metrics**: Re-measure avg word count — target <55 words avg

## Risks

| Risk | Mitigation |
|------|-----------|
| Removing "Do not use" from descriptions hurts routing accuracy | Run trigger-negative evals before and after. The "When NOT to use" section body is still read by the host. |
| Removing procedure refs breaks handoff chains | Only removing routing refs, not data-dependency refs. Next-steps pipeline refs are all kept. |
| AP-17 is too strict for this repo (meta-skills are inherently coupled) | AP-17 is a detection pattern, not a hard rule. The audit output already uses PRESENT/ABSENT, not pass/fail. |
