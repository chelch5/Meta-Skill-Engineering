---
name: git-commit
description: Create git commits with conventional commit format and intelligent staging. Use when user says "commit changes", "create a commit", "git commit", or when committing staged changes. Supports auto-detection of commit type from file changes and interactive message refinement.
---

# Git Commit with Conventional Commits

## Purpose

Create standardized, semantic git commits following the Conventional Commits specification. This skill analyzes actual file diffs to determine appropriate commit type, scope, and generates meaningful commit messages that are human-readable and machine-parseable.

## When to use

- User explicitly asks to commit changes
- User says "git commit", "create a commit", "commit these changes"
- Working directory has unstaged changes and user wants to commit
- User has already staged files and wants to commit them
- User mentions conventional commits or semantic versioning

## When NOT to use

- User wants to undo changes (use git-revert or git-reset instead)
- User wants to view commit history (use git-log instead)
- User wants to push commits (use git-push instead)
- No git repository exists in the working directory
- User wants to squash or rewrite history (use git-rebase instead)

## Procedure

### 1. Analyze Repository State

Determine the current git state:

```bash
# Check if we're in a git repository
git rev-parse --git-dir

# Check current branch
git branch --show-current

# Check status of staged and unstaged changes
git status --porcelain

# View what changes would be committed
git diff --staged
```

If no repository exists, stop and report: "No git repository found. Initialize one with 'git init' or navigate to a repository."

### 2. Determine Staging Strategy

**Case A: Files already staged**
- Skip staging, proceed directly to commit message generation
- Use `git diff --staged` to analyze changes

**Case B: Nothing staged but unstaged changes exist**
- Analyze changes with `git diff`
- Stage files selectively by logical group
- Prioritize staging order: related files together, test files with code changes

**Case C: No changes at all**
- Report: "No changes to commit. Working tree is clean."
- Do not proceed with commit

### 3. Stage Files with Safety Checks

Stage files using appropriate method:

```bash
# Stage specific files individually
git add path/to/file1 path/to/file2

# Stage by pattern for grouped changes
git add src/components/*.tsx
git add tests/*.test.js

# Stage remaining unstaged changes
git add .
```

**Safety check before staging**: Scan file list for potential secrets
- If files match: `.env`, `credentials.json`, `*.key`, `*.pem`, `.aws/credentials`
- WARN the user: "Found potential credential files. Verify these should be committed: [list files]"
- Do NOT commit files containing: API keys, passwords, private keys, tokens

### 4. Analyze Changes for Commit Type

Classify the staged changes into conventional commit types:

| Type | Indicators in Diff |
|------|-------------------|
| `feat` | New functions, classes, routes, components, files |
| `fix` | Bug fixes, corrected logic, error handling improvements |
| `docs` | README updates, code comments, documentation files |
| `style` | Whitespace changes, semicolons, indentation, no logic |
| `refactor` | Reorganized code without behavior change |
| `perf` | Algorithm improvements, caching, optimization |
| `test` | New/modified test files, test utilities |
| `build` | Package.json, Cargo.toml, webpack.config, dependencies |
| `ci` | GitHub Actions, Travis, Jenkins config files |
| `chore` | Maintenance tasks, file renames without content change |
| `revert` | Undoing previous commits |

Determine scope from:
- Directory structure (e.g., `src/components/`, `api/`)
- Affected file types (e.g., `*.test.js` suggests scope is tests)
- Function/module names mentioned in diff

### 5. Generate Commit Message

Format the commit message:

```
<type>[(scope)]: <description>

[optional body with details]

[optional footer with references]
```

Message rules:
- **Type**: One of the 11 types from step 4
- **Scope**: Optional, lowercase, descriptive (module/component/area)
- **Description**: Present tense, imperative mood, under 72 characters
  - Good: "add user authentication endpoint"
  - Bad: "added user authentication endpoint"
  - Bad: "adds user authentication endpoint"

**Breaking changes** (either format):
```
feat(api)!: remove deprecated v1 endpoints

OR

feat(api): migrate to v2 endpoints

BREAKING CHANGE: API v1 endpoints are no longer available
```

### 6. Execute Commit

**Single line commit**:
```bash
git commit -m "<type>[(scope)]: <description>"
```

**Multi-line commit** (with body/footer):
```bash
git commit -m "<type>[(scope)]: <description>

<body lines>

<footer lines>"
```

**Alternative for complex messages**:
```bash
git commit -m "$(cat <<'EOF'
<type>[(scope)]: <description>

<body>

Closes #123
Refs #456
EOF
)"
```

### 7. Verify Commit Success

After committing, confirm:

```bash
# Show the just-created commit
git log -1 --oneline

# Show full commit details
git show --stat HEAD
```

Success indicators:
- Exit code 0 from git commit
- Commit appears in `git log`
- Commit hash is displayed

## Output Contract

**On success:**
- Commit created with conventional format message
- Output includes: commit hash, message, files changed, insertions/deletions count
- Working tree is clean (no remaining staged changes)

**On partial success** (commit created but issues remain):
- Commit hash shown
- Remaining unstaged files listed
- Suggestion to create additional commits for logical groupings

**On failure:**
- Clear error message explaining what went wrong
- Remedial action suggested
- No commit created or left in incomplete state

## Failure Handling

| Failure Scenario | Response |
|-----------------|----------|
| No git repository | "Error: Not a git repository. Navigate to one or run 'git init'." |
| No changes staged or unstaged | "Error: Nothing to commit. Working tree clean." |
| Commit hook failure | Fix the reported issue, create NEW commit. Never use `--amend` on pushed commits. |
| Invalid commit message format | Reject and regenerate with proper conventional format |
| Merge conflicts in working directory | "Error: Unresolved merge conflicts. Resolve before committing." |
| Empty commit attempted | "Error: No changes detected to commit." |
| Secrets detected in staged files | "Error: Potential secrets detected. Remove from staging: [list files]" |
| Commit hook rejects (pre-commit) | Fix the reported lint/test issues, then commit again |

**Git Safety Protocol - NEVER:**
- Update git config (name, email, editor)
- Run destructive commands (`--force`, hard reset) without explicit user request
- Skip hooks with `--no-verify` unless user explicitly asks
- Force push to main/master branch
- Amend a commit that has already been pushed (creates divergence)

## Next Steps

- After successful commit, user may want to: `git push` to publish
- Multiple related commits: continue staging and committing remaining changes
- Want to undo the commit: use `git reset --soft HEAD~1` (only if not pushed)

## Conventional Commit Quick Reference

| Type | Purpose | Example |
|------|---------|---------|
| `feat` | New feature | `feat(auth): add OAuth login` |
| `fix` | Bug fix | `fix(api): handle null pointer` |
| `docs` | Documentation | `docs(readme): update setup steps` |
| `style` | Code style | `style(lint): fix indentation` |
| `refactor` | Restructure | `refactor(utils): extract helper` |
| `perf` | Performance | `perf(query): add caching` |
| `test` | Tests | `test(auth): add login tests` |
| `build` | Dependencies | `build(deps): upgrade lodash` |
| `ci` | CI config | `ci(github): add test workflow` |
| `chore` | Maintenance | `chore(cleanup): remove logs` |
| `revert` | Undo commit | `revert: api changes` |

**Breaking change indicators:**
- `!` after type/scope: `feat(api)!: remove endpoint`
- `BREAKING CHANGE:` in footer

**Footer keywords:**
- `Closes #123` - Auto-close issue
- `Refs #456` - Reference without closing
- `BREAKING CHANGE:` - Mark breaking change
- `Co-authored-by: Name <email>` - Attribution

## References

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/) - Conventional commits enable automated versioning
- Best practices:
  - One logical change per commit
  - Keep description under 72 characters
  - Use body for explaining "what" and "why", not "how"
  - Reference issues and PRs in footer
