---
name: migration-pack-builder
description: "Generate structured migration plans with inventory, risk-ranked sequence, rollback procedures, and acceptance criteria for major upgrades or framework migrations. Use when upgrading major dependencies (React 17→18, Python 3.9→3.12), migrating frameworks (Express→Fastify, CRA→Vite), or scoping 'modernize the codebase' initiatives. Do not use for patch-level dependency updates or greenfield projects."
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode, github-copilot]
---

# Migration Pack Builder

Turns "we need to upgrade X" into a methodical execution plan.

## Procedure

### 1. Create migration inventory

Identify all affected surfaces:

```markdown
## Inventory: [Migration Name]

### Direct Dependencies
| Package | Current | Target | Breaking Changes |
|---------|---------|--------|------------------|
| [name]  | [ver]   | [ver]  | [list]           |

### Affected Files
- [path pattern] ([N] files) — [why affected]

### Integration Points
- CI/CD: [changes needed]
- Testing: [framework upgrade required?]
- Build tooling: [changes needed]
```

### 2. Risk assessment per component

| Risk Level | Criteria | Examples |
|-----------|----------|---------|
| **High** | Core business logic, payment, auth, data persistence | Payment processing, auth flow |
| **Medium** | UI components, utilities with many dependents | Shared component library |
| **Low** | Dev tooling, test utilities, isolated features | Linter config, test helpers |

### 3. Define migration sequence

Order by: dependencies first, then risk (low → high):

```markdown
### Migration Sequence
1. [ ] Update build tooling (low risk, unblocks others)
2. [ ] Migrate test utilities (enables validation of later stages)
3. [ ] Low-risk leaf components (build confidence)
4. [ ] Core utilities (high dependency count)
5. [ ] High-risk business logic (with extra validation)
```

### 4. Define rollback procedure per stage

```markdown
### Rollback: Stage N
- Git: `git revert HEAD~N..HEAD`
- Dependencies: `npm ci` from lockfile at tag `pre-stage-N`
- Verification: `npm test && npm run e2e`
```

### 5. Define acceptance criteria

```markdown
### Acceptance Criteria
- [ ] All existing tests pass (or intentional updates documented)
- [ ] No type errors introduced
- [ ] Bundle size delta < 5%
- [ ] Performance metrics maintained
- [ ] Manual QA of critical user flows
```

## Output contract

```markdown
# Migration Pack: [Name] — [From] → [To]

## Summary
- Scope: [N] files, [N] packages
- Estimated effort: [X] days
- Risk level: [High/Medium/Low]

## Inventory
[tables from step 1]

## Migration Sequence
[ordered stages with checkboxes]

## Rollback Procedures
[per-stage rollback]

## Acceptance Criteria
[checklist]

## Known Issues & Workarounds
[documented blockers and solutions]
```

## Failure handling

- **Circular dependencies in migration order**: Identify cycle; create compatibility shim to break it
- **No test coverage for affected code**: Add characterization tests BEFORE migration
- **Breaking change not documented upstream**: Check GitHub issues and changelogs; document findings
- **Partial migration blocks progress**: Always use feature branches with atomic commits per stage
