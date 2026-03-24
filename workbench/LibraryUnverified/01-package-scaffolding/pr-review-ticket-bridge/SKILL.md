---
name: pr-review-ticket-bridge
description: "Review a pull request, validate review comments against the actual implementation, and generate follow-up tickets only for findings that survive evidence-based triage. Use after a PR review cycle when comments need to be triaged into actionable work items. Do not use during an in-progress review, when all comments were already addressed in the PR, or for discussions that aren't action items."
---

# PR Review Ticket Bridge

Use this skill when you need to inspect a pull request and turn valid findings into tracked work items.

This skill produces **canonical ticket proposals** — it does not bypass the repo's existing ticket lifecycle or create tickets through unguarded paths.

## Procedure

### 1. Gather the full PR surface

Review ALL of these before judging comments:
- PR title and summary
- Full diff
- Commit history
- Check runs or review status (if available)
- Review comments and discussion comments
- Any referenced issue or design context

Do not treat a single comment in isolation as sufficient evidence.

### 2. Perform a professional review first

Before triaging comments, evaluate the PR yourself:
- Correctness bugs and logic errors
- Behavior regressions
- Security or trust boundary issues
- Missing validation or tests
- Dependency risk
- Breaking API or interface changes
- Type-safety / compilation risk
- Performance implications (when diff changes core loops or concurrency)
- Credential / secret exposure
- Architectural drift from established patterns

### 3. Triage review comments

For each material review comment, assess:

| Field | Values |
|-------|--------|
| Severity | `critical`, `major`, `minor` |
| Validity | `valid`, `partially valid`, `outdated`, `invalid` |
| Evidence | Tie judgment to the actual diff and repo contract |

**Reject** comments that:
- Ask for invalid changes
- Duplicate existing follow-up work
- Conflict with accepted project decisions
- Are purely stylistic with no functional impact

**Narrow** partially valid comments to the specific surviving issue.

### 4. Validate findings against the code

For each potentially valid finding:
```markdown
### Comment: [summary]
**Reviewer claim:** [what they said]
**Code location:** [file:line]
**Validation:**
- [ ] Code at location still exists (not outdated)
- [ ] Issue described is actually present
- [ ] No subsequent commit addressed this
**Verdict:** [VALID | INVALID | OUTDATED]
```

### 5. Generate tickets for accepted findings

For each valid, actionable finding:
- Create a ticket proposal in the repo's ticket schema
- Keep the ticket narrow and implementation-ready
- Include: PR number, file reference, severity, reason the finding was accepted
- Do NOT generate tickets for already-fixed or duplicate work

Decision matrix:

| Impact | Effort | Blocks Release? | Action |
|--------|--------|----------------|--------|
| High | Small | Yes | Address in PR now |
| High | Large | Yes | Create P0 ticket |
| High | Any | No | Create P1 ticket |
| Medium | Small | No | Address now or defer |
| Low | Any | No | Defer or won't-fix |

### 6. Leave an explicit audit trail

Return:
1. PR review summary (your own findings + comment triage)
2. Valid findings with evidence
3. Rejected findings with rationale
4. Tickets proposed
5. Blockers needing human decision, with owner and reason

## Output contract

```markdown
# PR Review → Ticket Bridge Report
PR: #[NUMBER]
Date: [ISO date]

## Summary
- Comments received: N
- Validated as issues: N
- Tickets created: N
- Addressed in PR: N
- Deferred/Rejected: N

## Tickets Proposed
| ID | Title | Priority | Source Comment |
|----|-------|----------|---------------|

## Rejected Comments
| Comment | Reason |
|---------|--------|

## Blockers for Human Decision
| Finding | Why | Owner |
|---------|-----|-------|
```

## Rules

- Review the implementation first, THEN judge the comments
- Do not create tickets from invalid, stale, or purely stylistic comments
- Preserve the repo's existing ticket contract — do not invent a second backlog format
- If the repo already has a ticket covering the same issue, reference it instead of duplicating
- Keep this skill out of the default greenfield scaffold chain — it's for implementation cycles

## Failure handling

- **Cannot access PR comments**: Use `gh pr view` or extract from GitHub web UI
- **Comment references deleted code**: Mark as OUTDATED, do not create ticket
- **Disagreement with reviewer**: Create ticket but flag for discussion — don't silently won't-fix
- **Too many comments**: Batch by file or severity, process in multiple passes

## References

- GitHub PR reviews: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews
- Not part of scaffold-kickoff flow — used during implementation cycles
