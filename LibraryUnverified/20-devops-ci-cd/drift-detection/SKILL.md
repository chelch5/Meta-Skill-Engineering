---
name: drift-detection
description: |
  Detects when implementation or repository state has diverged from an approved plan, specification, or brief.

  Trigger on: "has this drifted from the plan", "check for drift", "compare implementation to spec",
  "audit against the brief", "does the code match requirements", "verify compliance with design",
  "are we still following the spec", "detect spec-to-code divergence".

  Skip when: No baseline plan or specification exists to compare against; both documents are planning
  artifacts with no implementation; comparing two versions of the same document (use git diff instead).
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode]
metadata:
  owner: codex
  domain: drift-detection
  maturity: draft
  risk: low
  tags: [drift, detection, compliance, audit]
---

# Purpose
Compares current implementation or repository state against the approved plan, brief, or specification and identifies where the two have diverged. This is configuration drift detection applied to agent workflows and software projects: the canonical source of truth defines what should exist, and this skill finds where reality has deviated—whether through intentional undocumented changes, accidental omissions, or misinterpretation.

# When to use this skill

Use when:
- The user says "has this drifted from the spec?", "check for drift", "does the code match the plan?", or "audit against the brief"
- A project is midway through execution and compliance with the original brief needs verification
- An agent has been running autonomously and its output needs auditing against its instructions
- A repo is being handed off and actual state needs reconciliation with documentation
- Periodic health checks to ensure implementation stays aligned with design
- After significant changes to verify the implementation still matches approved architecture

Do NOT use when:
- Both documents being compared are planning artifacts—no implementation exists yet (use `contradiction-finder`)
- The user wants general consistency checking without a canonical reference
- The plan was intentionally changed—this skill detects unintentional or undocumented deviation
- The user wants to compare two versions of the same document (use git diff)
- The task is a simple typo fix or single-file edit without spec implications
- The request is purely informational with no implementation to audit (e.g., "what is drift detection?")

# Procedure

## 1. Establish the canonical reference
Identify the authoritative source of truth. If multiple candidates exist, ask which is canonical before proceeding. There must be exactly one source of truth.

Common canonical sources:
- The brief, spec, or approved plan document
- AGENTS.md or agent instructions file
- Architecture Decision Record (ADR) or decision record
- Contract or API specification
- Design document or PRD
- Regulatory or compliance requirements document

**Validation step**: Confirm with the user which document is the single source of truth before proceeding if ambiguity exists.

## 2. Extract canonical commitments
List every explicit commitment in the canonical reference:
- Deliverables and features (what must be built)
- Behavioral specifications (how it must work)
- Conventions and patterns to follow (coding standards, architecture patterns)
- Constraints and boundaries (performance limits, security requirements, scope limits)
- Explicitly excluded scope (what must NOT be built)
- Quality requirements (test coverage, documentation, review gates)

**Document each commitment with**: Source location (line/section), exact text, and category from above.

## 3. Examine current state
Inspect the actual implementation, file structure, code, or agent outputs against each commitment. For each item, verify:
- Does it exist? (file, function, configuration, test)
- Does it behave as specified? (actual behavior matches spec)
- Does it follow stated conventions? (naming, patterns, structure)

**Evidence collection**: Gather file paths, code snippets, configuration values, or log outputs as proof of current state.

## 4. Classify each item
Mark each commitment with one status:
- **Compliant**: Implementation matches the commitment exactly
- **Partial**: Implementation partially satisfies but is incomplete or incorrect
- **Drifted**: Implementation contradicts or ignores the commitment
- **Added (undocumented)**: Something exists in implementation that was not in the canonical reference

## 5. Sub-classify Added items
For items marked "Added", determine type:
- **Acceptable addition**: Reasonable implementation detail not requiring spec-level documentation (e.g., helper function, internal constant)
- **Potential scope creep**: Feature or behavior that should have been discussed before adding
- **Legacy to remove**: Old artifact that no longer belongs and should be deleted

**Decision rule**: If the addition changes user-facing behavior, API contracts, or maintenance burden, flag as "Potential scope creep".

## 6. Assess severity of each drift
Classify each drift by impact:
- **Critical**: Breaks a core requirement, violates a constraint, or introduces security/correctness issues (requires immediate action)
- **Significant**: Reduces quality, creates technical debt, or diverges from stated patterns (should be addressed in next sprint/cycle)
- **Minor**: Cosmetic, stylistic, or low-impact divergence (address when convenient)

**Severity test**: Ask "If we ship without fixing this, what breaks or degrades?"

## 7. Identify root cause for major drifts
For each Critical or Significant drift, determine why it occurred:
- Intentional deviation needing retrospective approval? (decision made but not documented)
- Accidental omission during implementation? (developer oversight)
- Misinterpretation of the spec? (implementation diverged due to unclear understanding)
- Spec ambiguity that led to wrong assumption? (spec unclear, implementation guessed)

**Output**: One-sentence root cause per drift, with evidence supporting the classification.

## 8. Produce findings in decision-ready format
Structure output for immediate action:

1. **Executive Summary**: Total counts (Compliant: X, Partial: Y, Drifted: Z, Added: W)
2. **Critical Drifts**: Table with Commitment | Status | Severity | Evidence | Root Cause
3. **Significant Drifts**: Same format as Critical
4. **Minor Drifts**: Bulleted list (brief)
5. **Undocumented Additions**: Table with Item | Type (Acceptable/Scope Creep/Legacy) | Recommendation
6. **Remediation Plan**: Prioritized list of actions to bring into compliance, with "fix implementation" or "update spec" decision per item
7. **Verification Steps**: Specific commands, tests, or reviews to confirm fixes work
8. **Open Questions**: Any ambiguities discovered during analysis that need resolution

# Output contract

The skill MUST produce:

1. **Compliance Table** with columns: Commitment | Status (Compliant/Partial/Drifted/Added) | Severity | Evidence Reference

2. **Drift Summary** with counts: X compliant, Y partial, Z drifted, W added; plus severity breakdown

3. **Remediation Required** list for all Critical and Significant drifts, with:
   - The drift described in one sentence
   - Evidence (file path, line number, or configuration value)
   - Whether to fix implementation or update spec
   - Specific action to bring into compliance
   - Estimated effort (quick/medium/large)

4. **Verification Steps** for each remediation:
   - How to verify the fix worked
   - Test commands or inspection points

5. **Open Questions** section listing any ambiguities found in the spec or during analysis

**Output quality standards** (per references/output-shape.md and references/failure-signals.md):
- Lead with findings, not narrative
- Attach one concrete evidence line or file/log reference per important claim
- End with the smallest corrective action that would materially reduce risk
- Keep open questions explicit instead of hiding them in prose
- Avoid broad commentary with no evidence
- Do not give equal weighting to minor and major risks
- Ensure recommendations map to concrete next steps

# Failure handling

## Missing canonical reference
If the canonical reference cannot be determined or is absent:
1. State explicitly: "Drift detection requires a canonical reference. None was found or specified."
2. List available documents that might serve as reference
3. Ask the user: "Which document is the authoritative source of truth?"
4. Do not proceed with analysis until a clear reference is identified

## Incomplete reference
If the reference exists but is missing sections:
1. Perform partial analysis only on documented areas
2. Note explicitly which areas could not be checked ("Section X not analyzed—spec incomplete")
3. Flag the gaps as potential risk areas

## Ambiguous commitments
If the spec contains contradictory or unclear requirements:
1. Flag each ambiguous commitment separately
2. Document the conflicting interpretations
3. Request clarification from the user before classifying as "drifted"
4. Do not guess—mark as "needs clarification"

## Cannot access implementation
If files, code, or configurations cannot be read:
1. List what was inaccessible
2. Note which commitments could not be verified due to access issues
3. Recommend how to gain access or alternative verification methods

## Large drift volume
If more than 20 drifts are found:
1. Focus first on Critical and Significant drifts
2. Provide summary counts for Minor drifts
3. Offer to drill into Minor drifts if needed
4. Suggest root cause analysis for why drift volume is high

# Named failure modes of this method

- **Wrong canonical reference**: Comparing against an outdated or unauthorized version of the spec. Fix: confirm which document is the single source of truth before starting.
- **Completeness illusion**: Checking only the items that are easy to verify (file existence, naming) while skipping behavioral compliance (does it do what the spec says?). Fix: verify behavior, not just structure.
- **False drift from ambiguity**: Flagging implementation choices as drift when the spec was genuinely ambiguous and the implementation made a reasonable interpretation. Fix: classify ambiguous-spec cases separately from clear-spec violations.
- **Missing undocumented additions**: Focusing only on what's missing or wrong while ignoring scope creep—things that exist but were never specified. Fix: always scan for additions, not just omissions.
- **Snapshot bias**: Checking drift at one point in time without considering whether drift is accelerating or being corrected. Fix: note the trend when historical data is available.

# Next steps

After drift detection completes:
- If remediation is needed → Use `skill-improver` or standard code editing to fix implementation
- If the spec needs updating → Use documentation editing to align spec with intentional changes
- If scope creep is detected → Use `tradeoff-analysis` to evaluate whether to keep or remove
- If architectural issues found → Use `architecture-review` for deeper structural analysis
- If many blockers discovered → Use `blocker-extraction` to prioritize and sequence fixes
- If acceptance criteria need strengthening → Use `acceptance-criteria-hardening` to prevent future drift

# References
- Configuration drift in infrastructure (Terraform, Ansible drift detection patterns)
- Contract testing (Pact, consumer-driven contracts)
- Continuous compliance monitoring practices
- See `references/output-shape.md` for output formatting guidance
- See `references/failure-signals.md` for weak pattern detection
- See `references/evidence-rubric.md` for evidence collection standards
