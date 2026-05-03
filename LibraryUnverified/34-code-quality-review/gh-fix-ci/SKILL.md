---
name: gh-fix-ci
description: "Debug and fix failing GitHub Actions CI checks on pull requests. Triggers when the user reports failing PR checks, CI failures, or asks to fix GitHub Actions workflows. Uses the gh CLI to inspect checks, fetch logs, summarize failures, and implement fixes after explicit approval. External CI providers (e.g., Buildkite, CircleCI) are out of scope."
---

> Source: local codex skill gh-fix-ci

# gh-fix-ci

## Purpose

Diagnose failing GitHub Actions CI checks on pull requests by inspecting check status, fetching and analyzing logs, identifying root causes, and implementing fixes with user approval. This skill bridges the gap between raw CI failure logs and actionable fix plans.

## When to use

Use this skill when:
- A user reports "CI is failing", "checks are red", or "GitHub Actions is broken" on a PR
- The user asks to "fix the build", "debug failing checks", or "investigate CI failures"
- A PR has failing GitHub Actions checks that need root cause analysis
- The user wants to understand why specific checks are failing before attempting fixes

## When NOT to use

Do NOT use this skill when:
- CI failures are from external providers (Buildkite, CircleCI, Travis CI, Azure Pipelines). For these, report only the details URL and stop.
- The user wants to modify CI workflow files without any failing checks to debug (use a general editing skill instead)
- The repository is not hosted on GitHub (gh CLI only works with GitHub)
- The user hasn't authenticated with gh CLI and cannot do so

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated with `repo` and `workflow` scopes
- Run `gh auth status` to verify authentication before starting
- If unauthenticated, instruct the user to run `gh auth login` before proceeding

## Procedure

### 1. Verify gh authentication
- Run `gh auth status` in the repository
- If unauthenticated, ask the user to run `gh auth login` (ensuring repo + workflow scopes) before proceeding
- Confirm the output shows the correct host and user with required scopes

### 2. Resolve the target PR
- If the user provided a PR number or URL, use that directly
- Otherwise, detect the PR for the current branch: `gh pr view --json number,url`
- Validate that the PR exists and has checks by running `gh pr checks <pr>`

### 3. Inspect failing checks (GitHub Actions only)
**Preferred method:** Use the bundled script for robust log fetching and field handling:
```bash
python "<skill-path>/scripts/inspect_pr_checks.py" --repo "." --pr "<number-or-url>"
```
- Add `--json` for machine-readable output suitable for automated analysis
- Add `--max-lines 200 --context 40` for longer log context if needed

**Manual fallback if script unavailable:**
1. List checks: `gh pr checks <pr> --json name,state,bucket,link,startedAt,completedAt,workflow`
2. If field errors occur, extract available fields from the error message and retry with compatible fields
3. For each failing check, extract the run ID from `detailsUrl`
4. Fetch run metadata: `gh run view <run_id> --json name,workflowName,conclusion,status,url,event,headBranch,headSha`
5. Fetch logs: `gh run view <run_id> --log`
6. If logs are pending, fetch directly via API: `gh api "/repos/<owner>/<repo>/actions/jobs/<job_id>/logs"`

### 4. Handle non-GitHub Actions checks
- Examine the `detailsUrl` field from each failing check
- If the URL is not a GitHub Actions run (does not contain `/actions/runs/`):
  - Label it as **external provider**
  - Report only the check name and details URL
  - Do not attempt to fetch logs or diagnose further
  - Continue processing GitHub Actions checks only

### 5. Summarize failures for the user
For each failing GitHub Actions check, provide:
- **Check name**: The exact name as shown in GitHub
- **Run URL**: Direct link to the GitHub Actions run
- **Failure snippet**: The most relevant 20-40 lines of log context around the failure
- **Root cause identification**: Clear statement of what failed (test assertion, build error, dependency issue, etc.)

If logs are unavailable or pending, explicitly state: "Logs not available yet — check may still be running or logs may have expired."

### 6. Draft a fix plan
- If a `create-plan` skill is available, invoke it with the failure summary
- Otherwise, draft a concise inline plan containing:
  1. Identified root cause
  2. Specific files to modify
  3. Expected changes
  4. Testing strategy
- Present the plan to the user and request explicit approval before implementation

### 7. Implement after approval
- Apply the approved plan to fix the identified issues
- Make minimal, focused changes addressing only the CI failure root cause
- Run relevant tests locally if possible to verify the fix

### 8. Verify the fix
- After implementation, run: `gh pr checks <pr>` to confirm checks are now passing
- If checks still fail, return to step 3 and analyze new failure patterns
- Summarize what was changed and ask if the user wants to push changes or open a new PR

## Output contract

**Success output:**
- List of analyzed checks with their status (passing/failing/external)
- For each failing GitHub Actions check:
  - Check name and run URL
  - Log snippet showing the failure context
  - Root cause summary (1-2 sentences)
- Approved fix plan with implementation summary
- Confirmation of resolved checks after fix

**Failure output:**
- Clear error message if gh CLI is not authenticated
- Explicit note if logs are unavailable or expired
- External provider checks listed with URLs only
- If fix implementation fails, detailed error message and suggestion to retry or seek help

## Failure handling

| Scenario | Response |
|----------|----------|
| `gh auth status` fails | Stop and instruct user to run `gh auth login` with repo + workflow scopes |
| PR not found for current branch | Ask user to specify PR number or URL explicitly |
| `gh pr checks` returns no checks | Inform user that PR has no checks or checks haven't started yet |
| All checks are external providers | Report URLs only and ask user to check external CI dashboard |
| Logs unavailable (expired/pending) | Note the limitation and proceed with metadata-only analysis |
| Script execution fails | Fall back to manual gh CLI commands per step 3 manual fallback |
| Fix plan rejected by user | Ask for clarification on concerns and revise plan |
| Implementation causes new failures | Roll back changes, re-analyze, and propose revised fix |

## Next steps

After completing this skill:
- If the fix is successful and pushed: Suggest monitoring the PR for check completion
- If external checks remain failing: Direct user to the external CI provider's dashboard
- If additional CI issues surface: Re-invoke this skill with the new failure context
- If workflow file changes are needed: Use a general file editing skill or create a dedicated workflow modification plan

## References

### scripts/inspect_pr_checks.py

Fetch failing PR checks, pull GitHub Actions logs, and extract a failure snippet. Exits non-zero when failures remain so it can be used in automation.

**Usage examples:**
```bash
python "<skill-path>/scripts/inspect_pr_checks.py" --repo "." --pr "123"
python "<skill-path>/scripts/inspect_pr_checks.py" --repo "." --pr "https://github.com/org/repo/pull/123" --json
python "<skill-path>/scripts/inspect_pr_checks.py" --repo "." --max-lines 200 --context 40
```

**Key features:**
- Auto-detects current branch PR if no PR specified
- Handles gh CLI field drift with automatic fallback
- Extracts run ID and job ID from check URLs
- Fetches logs via `gh run view` or direct API as needed
- Identifies failure context using markers: error, fail, traceback, exception, assert, panic, fatal
- Returns JSON with structured failure analysis
