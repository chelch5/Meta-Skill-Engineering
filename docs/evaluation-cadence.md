# Evaluation Cadence

How to test whether the meta-skill system is working correctly.

## Quick Check (2 minutes)

Run structural validation only:

```bash
./scripts/validate-skills.sh
```

This checks every skill package for:
- Valid YAML frontmatter (name + description)
- All six required section headings (Purpose, When to use, When NOT to use, Procedure, Output contract, Failure handling)
- Cross-reference integrity (skill references point to existing directories)
- No phantom file references (files mentioned in SKILL.md actually exist)
- Line count within the 500-line limit
- Valid JSONL format in eval files

## Standard Cycle (5–10 minutes)

Run the full evaluation cadence:

```bash
./scripts/run-full-cycle.sh
```

This runs all five steps in sequence: structural validation, trigger/behavior evals, corpus evaluation, regression suite, and produces an aggregate report in `eval-results/summary-<timestamp>.md`.

## Dry Run (instant)

Preview what would be tested without executing LLM calls:

```bash
./scripts/run-full-cycle.sh --dry-run
```

This runs structural validation (no LLM needed), lists all trigger and behavior test cases without executing them, and skips corpus evaluation and regression suite (which don't support dry-run mode).

## Individual Steps

### 1. Structural Validation

```bash
./scripts/validate-skills.sh
```

Run this after editing any SKILL.md to verify you haven't broken the required structure. Fast (no LLM calls), and the first thing the full cycle runs.

### 2. Trigger & Behavior Evals

```bash
./scripts/run-evals.sh --all              # All skills with evals/
./scripts/run-evals.sh skill-improver     # Single skill
./scripts/run-evals.sh --dry-run --all    # List cases without running
```

Runs JSONL test cases from each skill's `evals/` directory:
- **Trigger-positive tests** (`trigger-positive.jsonl`): Prompts that *should* activate the skill. Measures precision.
- **Trigger-negative tests** (`trigger-negative.jsonl`): Prompts that should *not* activate the skill. Measures recall (true negative rate).
- **Behavior tests** (`behavior.jsonl`): Prompts that test output format compliance — required patterns, forbidden patterns, minimum output length.

After running all tests for a skill, the script evaluates pass/fail gates and appends a verdict to the report.

### 3. Corpus Evaluation

```bash
./scripts/run-corpus-eval.sh skill-improver --all
./scripts/run-corpus-eval.sh skill-anti-patterns adversarial
```

Tests meta-skills against the target skill corpus (`corpus/weak/`, `corpus/strong/`, `corpus/adversarial/`). Layer 1 checks structural validity of corpus skills. Layer 2 (manual) compares before/after meta-skill output using `run-baseline-comparison.sh`.

### 4. Regression Suite

```bash
./scripts/run-regression-suite.sh
```

Runs regression test cases from `corpus/regression/`. Each `.json` file represents a previously-fixed failure. Verifies that structural checks and preservation checks remain passing.

## Reading Results

All results are saved to `eval-results/`. Key files:

| File pattern | Contents |
|---|---|
| `eval-results/summary-<timestamp>.md` | Aggregate report from the full cycle |
| `eval-results/summary-latest.md` | Symlink to the most recent aggregate report |
| `eval-results/<skill>-<timestamp>.md` | Per-skill eval results with gate verdicts |
| `eval-results/<skill>-eval.md` | Symlink to the latest per-skill report |
| `eval-results/corpus-<meta-skill>-<tier>-<timestamp>.md` | Corpus eval results per tier |

## Pass/Fail Gates

Each per-skill evaluation report includes a gates section with four checks:

| Gate | Threshold | What it measures |
|------|-----------|------------------|
| Trigger precision | ≥ 80% | Positive trigger test pass rate — does the skill activate when it should? |
| Trigger recall | ≥ 80% | Negative trigger test pass rate — does the skill stay quiet when it shouldn't activate? |
| Behavior pass rate | ≥ 80% | Behavior test pass rate — does the output match expected patterns and length? |
| Structural validity | valid = true | `check_skill_structure.py` result — does SKILL.md have frontmatter and all required sections? |

A skill passes only if **all four gates** pass. The overall cycle passes only if every skill passes its gates and every step exits cleanly.

## After a Failure

1. Read the failure details in the report (`eval-results/summary-latest.md` or the per-skill report)
2. Fix the underlying issue (SKILL.md structure, trigger wording, behavior output, etc.)
3. Re-run the full cycle to verify the fix: `./scripts/run-full-cycle.sh`
4. Failures from trigger and structural checks are automatically harvested into `corpus/regression/` by `scripts/harvest_failures.py` for future regression prevention
