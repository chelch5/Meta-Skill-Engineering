# PR Review Ticket Bridge Contract

## Inputs

- pull request diff
- commits in the PR
- review comments and discussion comments
- current repo ticket contract
- current repo workflow and source-of-truth docs

## Output contract

- separate `valid`, `partially_valid`, `outdated`, and `invalid` findings
- assign each surviving finding a severity: `critical`, `major`, or `minor`
- explain why each accepted finding survives review
- cite the concrete file, hunk, comment, or commit that supports the decision
- include a rejection rationale for every non-accepted finding
- list any human blockers with a clear owner and reason

## Canonical ticket proposal contract

Unless the repo explicitly exposes a safe non-migration intake tool for review work, return ticket **proposals** instead of mutating the repo backlog directly.

For generated-repo v2 ticket contracts, each proposed ticket should include:

- `id`
- `title`
- `wave`
- `lane`
- `parallel_safe`
- `overlap_risk`
- `stage`
- `status`
- `depends_on`
- `summary`
- `acceptance`
- `decision_blockers`
- `artifacts`

Defaults for ordinary PR-review follow-up:

- `stage: planning`
- `status: todo` unless blocked by an unresolved decision
- `artifacts: []`

## Ticket quality rules

- one clear issue per ticket
- actionable summary
- explicit acceptance criteria
- link back to the originating PR evidence
- no duplicate tickets for already-tracked work
- do not route ordinary PR-review findings through migration-only backlog-verifier / `ticket_create` flows
