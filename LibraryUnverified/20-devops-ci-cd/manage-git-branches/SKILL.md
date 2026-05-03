---
name: manage-git-branches
description: Handle Git branch lifecycle operations including creating feature/fix/docs branches from a base branch, switching between branches with uncommitted change handling via stash, setting up remote tracking for push/pull, syncing feature branches with main via rebase or merge, and cleaning up merged branches locally and remotely. Use when the user asks to create a new branch, switch branches, update a branch with latest main changes, push a branch and set upstream, or delete branches after merge.
---

# Manage Git Branches

Create, switch, sync, and clean up Git branches following consistent naming conventions.

## Purpose

Enable safe and consistent Git branch management across the entire branch lifecycle—from creation through synchronization to cleanup—while preserving work in progress during context switches.

## When to use

- Creating a new feature, fix, or docs branch from main or another base branch
- Switching between tasks on different branches when work is in progress
- Keeping a feature branch synchronized with the latest main changes
- Setting up remote tracking for a new branch before first push
- Cleaning up local and remote branches after pull requests are merged
- Listing all branches and checking their merge/tracking status

## When NOT to use

- DO NOT use for initial repository setup (use `configure-git-repository` instead)
- DO NOT use for committing changes to the current branch (use `commit-changes` instead)
- DO NOT use for creating or reviewing pull requests (use `create-pull-request` instead)
- DO NOT use for complex conflict resolution during merges or rebases (use `resolve-git-conflicts` instead)
- DO NOT use for advanced Git history rewriting like interactive rebase (use specialized history tools)

## Procedure

### Step 1: Create a feature branch

Use the `type/description` naming convention:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New functionality | `feature/add-weighted-mean` |
| `fix/` | Bug fix | `fix/null-pointer-in-parser` |
| `docs/` | Documentation | `docs/update-api-reference` |
| `refactor/` | Code restructuring | `refactor/extract-validation` |
| `chore/` | Maintenance | `chore/update-dependencies` |
| `test/` | Test additions | `test/add-edge-case-coverage` |

Create from the base branch (default: `main`, remote: `origin`):

```bash
# Fetch latest base branch first to avoid stale starting point
git fetch origin main

# Create and switch to new branch from fetched main
git checkout -b feature/add-weighted-mean origin/main

# Or using modern syntax
git switch -c feature/add-weighted-mean origin/main
```

**Validation**: Run `git branch --show-current` to confirm the new branch is active. Run `git log --oneline -3` to verify it branched from the correct base commit.

**Failure handling**: If the base branch does not exist locally, the fetch command will create the tracking reference. If the branch name already exists, choose a unique name or delete the old branch first.

### Step 2: Set up remote tracking

Push the new branch and establish upstream tracking in one command:

```bash
# Push and set upstream (use exact remote and branch names)
git push -u origin feature/add-weighted-mean
```

Verify the tracking relationship is established:

```bash
# Check upstream tracking with verbose output
git branch -vv
```

To work with a remote branch created by another developer:

```bash
# Fetch all remote branches first
git fetch origin

# Checkout the remote branch (creates local tracking branch automatically)
git checkout feature/their-branch
```

**Validation**: Run `git rev-parse --abbrev-ref --symbolic-full-name @{upstream}` to confirm upstream is set. The command should output `origin/feature/add-weighted-mean` or similar.

**Failure handling**: If push fails due to authentication, check remote URL with `git remote -v`. If upstream is not set automatically, manually configure it: `git branch --set-upstream-to=origin/feature/add-weighted-mean feature/add-weighted-mean`.

### Step 3: Switch branches safely

Always check working tree status before switching:

```bash
# Check for uncommitted changes (staged, unstaged, and untracked)
git status
```

If uncommitted changes exist, choose one path:

**Path A - Commit the work:**
```bash
git add -A
git commit -m "wip: save progress before switching branches"
git checkout main
```

**Path B - Stash temporarily:**
```bash
# Stash including untracked files
git stash push -u -m "validation work in progress"

# Switch to target branch
git checkout main

# Later, return and restore
git checkout feature/add-weighted-mean
git stash pop
```

Manage multiple stashes:

```bash
# List all stashes with descriptions
git stash list

# Apply specific stash without removing from list
git stash apply stash@{1}

# Remove specific stash after applying
git stash drop stash@{1}

# Clear all stashes (destructive)
git stash clear
```

**Validation**: After switching, run `git status` to confirm working tree is clean on the new branch. Run `git branch --show-current` to verify the correct branch is active.

**Failure handling**: If `git checkout` fails with "error: Your local changes would be overwritten", stash or commit first. If stashed changes conflict when popping, Git will prompt for conflict resolution—abort with `git stash pop --index` if needed.

### Step 4: Sync with upstream

Keep feature branches current with the base branch to minimize merge conflicts:

```bash
# Fetch latest changes from remote
git fetch origin

# Rebase onto latest main (creates linear history)
git rebase origin/main

# Alternative: merge main into feature branch (creates merge commit)
git merge origin/main
```

**Validation**: Run `git log --oneline --graph -10` to verify the branch history includes recent main commits. Run `git status` to confirm working tree is clean.

**Failure handling**: If rebase encounters conflicts, Git pauses with conflict markers. Resolve each file, then `git add <file>` and `git rebase --continue`. If conflicts are too complex, abort with `git rebase --abort` and switch to merge strategy instead. For extensive conflict resolution, use `resolve-git-conflicts` skill.

### Step 5: Clean up merged branches

After pull requests merge, remove stale branches to reduce clutter:

```bash
# Delete local branch that has been merged (safe delete)
git branch -d feature/add-weighted-mean

# Force delete local branch even if not merged (destructive)
git branch -D feature/abandoned-experiment

# Delete remote branch on origin
git push origin --delete feature/add-weighted-mean

# Prune stale remote-tracking references
git fetch --prune
```

**Validation**: Run `git branch -a` to verify deleted branches no longer appear. Run `git branch --merged main` to confirm no merged branches remain that should be deleted.

**Failure handling**: If `git branch -d` refuses deletion, the branch has unmerged commits. Verify with `git log main..feature/add-weighted-mean` to see unmerged commits. If work is preserved elsewhere (e.g., squash merged via GitHub), force delete with `-D`. If remote deletion fails, verify write permissions to the repository.

### Step 6: List and inspect branches

Use these commands to audit branch state:

```bash
# List local branches only
git branch

# List all branches including remote-tracking
git branch -a

# Show branches with last commit and upstream info
git branch -vv

# List branches already merged into main (candidates for cleanup)
git branch --merged main

# List branches NOT yet merged into main (preserve these)
git branch --no-merged main
```

**Validation**: Cross-reference `git branch --merged main` against active work to identify cleanup candidates. Verify `git branch -vv` shows expected upstream tracking for all active branches.

**Failure handling**: If remote branches appear stale after teammate deletions, run `git fetch --prune` to synchronize remote-tracking references. If a branch should exist but is missing, run `git fetch origin` to update remote references.

## Output contract

On successful execution, the agent MUST confirm:

1. **Branch creation**: `git branch --show-current` returns the new branch name; `git log --oneline -3` shows commits from the base branch
2. **Remote tracking**: `git rev-parse --abbrev-ref --symbolic-full-name @{upstream}` returns the correct upstream reference
3. **Branch switch**: `git status` shows working tree clean; `git branch --show-current` shows target branch
4. **Sync completion**: `git log --oneline --graph -10` shows feature branch contains latest base branch commits
5. **Cleanup completion**: `git branch -a` no longer lists deleted branches; `git branch --merged main` excludes deleted branches
6. **Working tree state**: No uncommitted changes unless explicitly requested; no orphaned stashes from failed operations

## Failure handling

| Failure mode | Cause | Resolution |
|--------------|-------|------------|
| Base branch does not exist | Never fetched or wrong remote name | Run `git fetch origin <branch>` first |
| Branch name already exists | Previous branch not cleaned up | Delete old branch or use unique name |
| Push authentication fails | Wrong remote URL or missing credentials | Check `git remote -v`, verify access |
| Switch blocked by uncommitted changes | Working tree dirty | Stash or commit before switching |
| Stash pop conflicts | Changes on branch conflict with stash | Resolve conflicts or abort with `git reset --hard` |
| Rebase conflicts | Feature and base branches modified same lines | Resolve with `resolve-git-conflicts` or abort with `git rebase --abort` |
| Safe delete refused | Branch has unmerged commits | Check `git log main..branch`, use `-D` if work preserved |
| Remote delete fails | Insufficient permissions or branch protected | Verify repository access, check branch protection rules |
| Stale remote references | Teammates deleted remote branches | Run `git fetch --prune` to sync |

**Critical safety rule**: Before any destructive operation (`-D`, `stash clear`, `push --delete`), verify the work is preserved elsewhere. Use `git log` to audit commits before deletion.

## Next steps

- After creating and switching to a feature branch: use `commit-changes` to commit work on the branch
- After syncing a feature branch with main: use `create-pull-request` to open a pull request from the feature branch
- When rebase or merge produces conflicts: use `resolve-git-conflicts` for step-by-step conflict resolution
- For repository setup and branch protection rules: use `configure-git-repository`

## References

- Git Branching documentation: https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging
- Git Stash documentation: https://git-scm.com/docs/git-stash
- Git Remote documentation: https://git-scm.com/docs/git-remote
