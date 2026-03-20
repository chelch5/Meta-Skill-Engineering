Key Findings Summary

After fully reading the repository, all 12 skills, all eval scripts, the agentskills.io reference docs, and comparing against the reference skill-creator, here are the headline findings:

🔴 Critical / High Issues

1\. Precision/Recall labels are inverted in run-evals.sh (lines 778–784 and gate table output)

The script calls the positive trigger pass rate "precision" and the negative trigger pass rate "recall." Both are wrong by the standard IR definitions. The variables and gate output labels report misleading metrics to anyone reading the eval reports. The gates still test the right things — they're just mislabelled.

2\. Threshold inconsistency — skill-evaluation/SKILL.md documents precision ≥ 95% / recall ≥ 90% as the quality bar, but run-evals.sh enforces 80%/80%. These two systems give different pass/fail verdicts on the same skill.

3\. Seven stale references to archived skills in eval files — community-skill-harvester, skill-packaging, skill-installer, and skill-provenance are all in archive/ but are still named as better\_skill targets in negative eval cases across 6 skills. validate-skills.sh doesn't catch these because it only checks SKILL.md body text, not JSONL fields.

🟡 Medium Issues

4\. Layer 2 of run-corpus-eval.sh is manual-only — The script only does static structural pre-scoring of corpus skills. The actual meta-skill invocation and post-improvement comparison requires manual steps. The documentation doesn't clearly communicate this limitation.

5\. Next-steps ordering in skill-creator conflicts — the finalization prose lists trigger-optimization before testing-harness, which is backwards relative to the canonical pipeline and would mean optimising triggers without any empirical test data.

🟢 What's Working Well



All 12 skills are under 500 lines and all descriptions under 1,024 characters ✓

Consistent canonical section ordering across all 12 skills ✓

The eval infrastructure (run-evals.sh) is genuinely sophisticated — multi-run majority voting, LLM-as-Judge with median scoring, JSON output mode, two routing detection modes ✓

The skill-improver eval-driven diagnosis table is excellent — maps precise eval signals to specific failure modes ✓

Cross-references between skills form a coherent, non-circular graph ✓

The 60/40 train/test split implementation in run-trigger-optimization.sh is mathematically correct ✓

sync-to-skills.sh prevents script drift with proper source-of-truth architecture ✓



The MSE skill-creator is substantially better structured than the reference Anthropic skill-creator — it has correct negative boundaries, phase-based procedure, and is scoped correctly (no scope overload). The reference skill's description has no "Do not use for..." clause, which violates the very rules its own skill defines.





Addendum: Three Additional Critical Bugs Found on Deeper Read

The continued investigation uncovered three more issues that weren't visible in the initial pass:



🔴 Critical: Regression Suite Completely Non-Functional

The entire automated regression loop is broken in a chain of three compounding failures:

Break 1 — harvest\_failures.py regex mismatch (line 32):

The script expects failure lines in the format \[expected=X, mentioned=Y]. run-evals.sh actually outputs \[expected=X, activated=Y (votes/N)]. The keyword is activated, not mentioned. The primary regex never matches any real output, so all harvested regression entries end up with "expected": "unknown", "actual": "unknown".

Break 2 — Regression JSON schema mismatch:

The three hand-crafted regression cases (boundaries-deleted-001, purpose-lost-001, references-broken-001) use fields original\_excerpt and modified\_excerpt (text strings). But run-regression-suite.sh reads .original and .modified as file paths to pass to check\_preservation.py. Result: all three cases print "⚠️ missing original/modified paths" and are silently skipped.

Break 3 — references-broken-001 has no skill field:

It has type: "structural\_failure" but lacks a skill field. The runner reads .skill and gets null, then looks for directory REPO\_ROOT/null/ which doesn't exist. It also skips.

Net effect: Running run-full-cycle.sh produces a PASS verdict from the regression suite with all cases silently skipped — giving false confidence.



🔴 Critical: run-meta-skill-cycle.sh Hardcodes claude-opus-4.6

This is a cosmetic issue today but worth flagging: run-meta-skill-cycle.sh hardcodes --model claude-opus-4.6 with no EVAL\_MODEL environment variable override path. Every other script defaults to gpt-4.1 with EVAL\_MODEL override. This one is hardcoded and inconsistent with the rest of the eval tooling pattern.

