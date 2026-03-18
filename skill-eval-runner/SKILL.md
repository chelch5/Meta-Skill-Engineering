---
name: skill-eval-runner
description: "Run trigger tests, behavior tests, and baseline comparisons for a skill's eval suite, then produce a structured quality verdict. Use when a skill has been modified and needs regression testing, when CI/pre-release validation requires documented eval results, or when measuring quality before catalog inclusion. Do not use when no evals exist yet (build them first) or for manual evaluation without test files."
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode, github-copilot]
---

# Skill Eval Runner

Executes a skill's eval suite and produces a structured quality report.

## Procedure

### 1. Locate test suite

Check for eval files in the skill directory:
- `evals/triggers.yaml` — trigger accuracy tests
- `evals/outputs.yaml` — behavior correctness tests
- `evals/baselines.yaml` — baseline comparison tests

Note which exist and which are missing.

### 2. Run trigger tests

For each case in `triggers.yaml`:
- **Positive cases**: Does the skill fire? (expected: yes)
- **Negative cases**: Does the skill NOT fire? (expected: no)

Record: prompt, expected, actual, Pass/Fail.

### 3. Run output tests

For each case in `outputs.yaml`:
- Run the skill with the given input
- Check against `expected_sections`, `required_patterns`, `forbidden_patterns`

Record: test name, checks passed/total, Pass/Fail.

### 4. Run baseline comparison

For each case in `baselines.yaml`:
- Run with skill active vs without skill
- Does the skill add value? (Yes if 2+ elements baseline would lack)

### 5. Aggregate results

Calculate:
- **Trigger precision**: TP / (TP + FP)
- **Trigger recall**: TP / (TP + FN)
- **Output pass rate**: passed / total checks
- **Baseline win**: Yes/No

### 6. Issue verdict

| Verdict | Criteria |
|---------|----------|
| **Pass** | All rates ≥80% AND baseline win |
| **Pass with issues** | Any rate 60-79% |
| **Fail** | Any rate <60% OR baseline lose |

## Output contract

```markdown
## Eval Report: [skill-name]
Date: [YYYY-MM-DD]

### Trigger Tests
| Prompt | Type | Expected | Actual | Result |
|--------|------|----------|--------|--------|
Precision: X%  Recall: Y%

### Output Tests
| Test | Checks Passed | Result |
|------|--------------|--------|
Pass rate: X%

### Baseline Comparison
Skill adds value: [Yes/No]

### Verdict: [Pass | Pass with issues | Fail]
Issues: [list or "None"]
```

## Failure handling

- **Silent skill failure (no output)**: Record Fail, halt remaining tests for that case
- **Missing test files**: Report which are missing, run available ones, note incomplete coverage
- **Flaky results**: Run 3x, use majority result, note flakiness in report
- **All tests missing**: Cannot evaluate — report "No eval suite found" and recommend building one

## References

- Anthropic eval overview: https://docs.anthropic.com/en/docs/test-and-evaluate/eval-overview
- OpenAI evals: https://developers.openai.com/docs/evals/getting-started
