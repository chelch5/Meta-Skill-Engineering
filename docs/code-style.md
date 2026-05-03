# Code Style

## General

- Prefer small, typed modules with explicit inputs and outputs.
- Keep UI state in TypeScript objects or Rust command payloads, not hidden globals.
- Use deterministic scripts for validation and repeatable library operations.
- Preserve provider/model strings exactly when they are user or config input.
- Redact secrets in logs, run artifacts, and UI snapshots.

## TypeScript

- Use `strict` TypeScript.
- Keep DOM event binding near the rendered view that owns the action.
- Validate external JSON before using it as UI state.
- Prefer `async` functions that return explicit result objects.
- Keep command names stable and route mutations through backend or Tauri commands.

```ts
type RunState = 'idle' | 'running' | 'failed' | 'complete';

interface SkillRunSummary {
  id: string;
  state: RunState;
  model: string;
  score: number;
}
```

## Rust

- Keep Tauri commands narrow and serializable.
- Return `Result<T, String>` for command failures that should reach the UI.
- Normalize settings before writing them.
- Keep filesystem paths under app-owned config or artifact directories.

```rust
#[tauri::command]
fn app_info() -> AppInfo {
    AppInfo {
        name: "Meta Skill Studio",
        version: env!("CARGO_PKG_VERSION"),
        platform: std::env::consts::OS,
    }
}
```

## Scripts

- Use Node for cross-platform orchestration scripts.
- Use shell scripts only for Linux-specific validation wrappers.
- Keep provider calls behind OpenCode SDK or documented provider SDK adapters.
- Emit JSONL or JSON when downstream agents need to consume the result.

## Tauri UI

### Naming

| Element | Convention | Example |
| --- | --- | --- |
| TypeScript modules | kebab-case or domain name | `skill-library.ts` |
| DOM ids | kebab-case | `skill-list` |
| CSS classes | kebab-case | `primary-button` |
| Rust commands | snake_case | `load_settings` |

### Controls

```html
<button class="primary-button" data-action="create-skill" aria-label="Create skill">
  Create skill
</button>
```

### Accessibility

- Every icon-only button has an accessible name.
- Focus states are visible.
- Status is not color-only.
- Long names wrap or truncate intentionally.
- Keyboard navigation reaches every primary action.

## SKILL.md Conventions

### Structure

1. YAML frontmatter with `name` and `description`.
2. Purpose.
3. When to use.
4. When NOT to use.
5. Procedure.
6. Output contract.
7. Failure handling.
8. Next steps.
9. References when useful.

### Writing Rules

- Make routing descriptions concrete and trigger-oriented.
- Keep procedures executable by a downstream agent.
- Put validation commands and expected artifacts in the output contract.
- Use references for long examples or domain-specific lookup tables.
