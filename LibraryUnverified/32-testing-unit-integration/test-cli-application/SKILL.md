---
name: test-cli-application
description: >
  Triggers when asked to write integration tests for a Node.js CLI application,
  add tests to an existing CLI, verify CLI commands work correctly, or set up
  CI testing for CLI tools. Use when the project uses Node.js 18+ and you need
  subprocess-based integration testing with the built-in node:test module.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.1"
  domain: cli
  complexity: intermediate
  language: TypeScript
  tags:
    - cli
    - testing
    - nodejs
    - node-test
    - integration
---

# Test a CLI Application

Write integration tests for a Node.js CLI using the built-in `node:test` module with `execSync`.

## Purpose

This skill provides a complete testing pattern for CLI applications that runs the actual CLI binary as a subprocess, validates outputs via regex matching, manages filesystem state with cleanup hooks, and handles error cases and JSON outputs. The resulting tests are self-contained, require no external test runners, and can run in CI environments.

## When to use

- User asks to add tests to an existing CLI application
- User asks to test a newly created CLI command
- User asks to verify adapter or plugin behavior across target frameworks
- User asks to set up CI validation for CLI correctness
- User asks to catch regressions after refactoring CLI internals
- User asks to test CLI output formats (human-readable, JSON, dry-run)
- User asks to verify error handling in CLI commands
- User asks to test CLI lifecycle operations (install, update, uninstall)

## When NOT to use

- The target is a library or API with no CLI entry point (use unit testing instead)
- The project uses Node.js below version 18 (node:test is not available)
- Testing requires mocking internal functions rather than subprocess execution
- The CLI is written in a language other than JavaScript/TypeScript
- Tests need to verify GUI behavior or interactive terminal features
- Testing involves external services that cannot be mocked or stubbed
- The goal is performance benchmarking rather than functional correctness

## Procedure

### Step 1: Set Up Test Infrastructure

Read the CLI entry point to determine the correct path:

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';

const CLI = 'node cli/index.js';
const ROOT = process.cwd();

function run(args) {
  return execSync(`${CLI} ${args}`, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 10000,
  });
}
```

Key design decisions:
- `node:test` is built-in — no test runner dependency needed
- `execSync` runs the CLI as a subprocess — tests the actual binary, not internal functions
- 10-second timeout prevents hanging on interactive prompts
- `encoding: 'utf8'` gives string output for regex matching
- All paths relative to `ROOT` for reproducibility

**Expected:** A test file that imports from `node:test` and has a working `run()` helper.

**On failure:** If `node:test` is not available, your Node.js version is below 18. Upgrade Node.js to version 18 or later, or use a polyfill like `node-test-polyfill`.

### Step 2: Write Smoke Tests

Smoke tests verify the CLI starts, parses arguments, and produces expected output shapes:

```javascript
describe('meta', () => {
  it('shows version', () => {
    const out = run('--version');
    assert.match(out, /\d+\.\d+\.\d+/);
  });

  it('shows help with all commands', () => {
    const out = run('--help');
    assert.match(out, /install/);
    assert.match(out, /list/);
    assert.match(out, /detect/);
  });
});

describe('registry', () => {
  it('list shows expected counts', () => {
    const out = run('list --domains');
    assert.match(out, /\d+ domains/);
  });

  it('search finds known items', () => {
    const out = run('search "docker"');
    assert.match(out, /result\(s\) for "docker"/);
  });

  it('search returns 0 for nonsense', () => {
    const out = run('search "xyzzy-nonexistent"');
    assert.match(out, /0 result/);
  });
});
```

Smoke test patterns:
- `--version` and `--help` always work
- Registry loading validates data integrity
- Search with known and unknown terms

**Expected:** Smoke tests confirm the CLI is functional and data is loaded.

**On failure:** If registry counts change frequently, use `\d+` regex patterns instead of hardcoded numbers. If `--help` output changes, update the assertion strings to match the new command names.

### Step 3: Write Lifecycle Tests

Lifecycle tests verify create → verify → delete sequences with cleanup:

```javascript
describe('install', () => {
  const testPath = resolve(ROOT, '.agents/skills/commit-changes');

  after(() => {
    // Always clean up, even if tests fail
    try { rmSync(testPath); } catch {}
    try { rmSync(resolve(ROOT, '.agents/skills'), { recursive: true }); } catch {}
    try { rmSync(resolve(ROOT, '.agents'), { recursive: true }); } catch {}
  });

  it('dry-run does not create files', () => {
    const out = run('install commit-changes --dry-run');
    assert.match(out, /DRY RUN/);
    assert.ok(!existsSync(testPath));
  });

  it('installs creates the target', () => {
    run('install commit-changes');
    assert.ok(existsSync(testPath));
  });

  it('skips already installed', () => {
    const out = run('install commit-changes');
    assert.match(out, /skipped/);
  });

  it('uninstall removes the target', () => {
    run('uninstall commit-changes');
    assert.ok(!existsSync(testPath));
  });
});
```

Cleanup rules:
- Use `after()` hooks, not `afterEach()` — lifecycle tests build on each other
- Wrap cleanup in `try/catch` — cleanup must not fail the test suite
- Clean from leaf to root (file → parent dir → grandparent dir)
- If the test modifies shared state (symlinks, config files), restore it

**Expected:** Tests run in sequence within the describe block, cleanup runs even on failure.

**On failure:** If tests run in parallel (non-default in node:test), force sequential execution by adding `{ concurrency: 1 }` as the second argument to `describe()`.

### Step 4: Write Dry-Run Tests for Each Adapter

Test each adapter's target path without making changes:

```javascript
describe('adapter: cursor (dry-run)', () => {
  it('targets .cursor/skills/ path', () => {
    const out = run('install commit-changes --framework cursor --dry-run');
    assert.match(out, /\.cursor\/skills/i);
  });
});

describe('adapter: opencode (dry-run)', () => {
  it('targets .opencode/ path', () => {
    const out = run('install commit-changes --framework opencode --dry-run');
    assert.match(out, /\.opencode/i);
  });
});
```

This pattern scales to any number of adapters. Each test:
- Uses `--framework` to bypass auto-detection
- Uses `--dry-run` so no files are created
- Asserts the target path appears in output

**Expected:** One describe block per adapter, each with at least a path assertion.

**On failure:** If the adapter doesn't exist in the project, the test will fail with "Unknown framework." This is correct — adapter tests should only exist for implemented adapters. Remove tests for adapters that don't exist yet.

### Step 5: Write Error Case Tests

```javascript
describe('errors', () => {
  it('rejects unknown items', () => {
    assert.throws(
      () => run('install nonexistent-skill-xyz'),
      /No matching items|Unknown/,
    );
  });

  it('rejects unknown framework', () => {
    assert.throws(
      () => run('install commit-changes --framework nonexistent'),
      /Unknown framework/,
    );
  });

  it('handles missing state gracefully', () => {
    assert.throws(
      () => run('scatter nonexistent-team'),
      /not burning|Unknown/,
    );
  });
});
```

Error testing patterns:
- `assert.throws` catches non-zero exit codes from `execSync`
- Regex match on the error message (captured from stderr)
- Test both "item not found" and "invalid option" errors
- Verify error messages suggest corrective actions

**Expected:** All error paths produce non-zero exit codes and helpful messages.

**On failure:** `execSync` throws on non-zero exit. The error's `stderr` or `stdout` contains the message. If `assert.throws` regex doesn't match, check `error.stdout` in addition to `error.message`.

### Step 6: Write JSON Output Tests

```javascript
describe('json output', () => {
  it('campfire --json outputs valid JSON', () => {
    const out = run('campfire --json');
    const data = JSON.parse(out);
    assert.ok(typeof data.totalTeams === 'number');
    assert.ok(Array.isArray(data.fires));
  });

  it('gather --dry-run --json outputs structured data', () => {
    const out = run('gather tending --dry-run --json');
    // JSON may follow a DRY RUN header — extract from first '{'
    const jsonStart = out.indexOf('{');
    assert.ok(jsonStart >= 0, 'Should contain JSON');
    const data = JSON.parse(out.slice(jsonStart));
    assert.equal(data.team, 'tending');
  });
});
```

JSON testing gotchas:
- Some commands prefix JSON with human-readable text (e.g., DRY RUN header)
- Extract JSON by finding the first `{` character
- Validate structure (key presence, types), not exact values
- Values like counts may change as content is added

**Expected:** JSON output is parseable and contains expected keys.

**On failure:** If `JSON.parse` fails, the command may be mixing human text with JSON. Either fix the command to output pure JSON in `--json` mode, or extract the JSON substring by finding the first `{` character.

### Step 7: Handle Cleanup and State Restoration

```javascript
describe('stateful commands', () => {
  const stateDir = resolve(ROOT, '.agent-almanac');

  after(() => {
    // Remove state file created by tests
    try { rmSync(stateDir, { recursive: true }); } catch {}
  });

  // Tests that create/modify state...
});

// Restore symlinks that destructive tests may remove
describe('destructive tests', () => {
  after(() => {
    // Restore symlinks that scatter/uninstall removed
    const skills = ['heal', 'meditate', 'remote-viewing'];
    for (const skill of skills) {
      const link = resolve(ROOT, `.claude/skills/${skill}`);
      if (!existsSync(link)) {
        try {
          execSync(`ln -s ../../skills/${skill} ${link}`, { cwd: ROOT });
        } catch {}
      }
    }
  });
});
```

State restoration rules:
- State files (`.agent-almanac/state.json`) must be cleaned after tests
- Symlinks removed by `scatter`/`uninstall` must be restored
- Manifest files (`agent-almanac.yml`) created by `init` must be removed
- Order: `after()` hooks run in reverse declaration order — declare restore hooks last

**Expected:** The test suite leaves the project in the same state it found it.

**On failure:** If CI reports leftover files after test runs, add the cleanup to `after()`. Use `git status` after test runs to detect leaked state. If cleanup fails silently, add assertions to verify files were actually removed.

## Output contract

When this skill completes successfully, the following deliverables are produced:

- **Test file created**: A `.test.js` file in the project's test directory containing:
  - `node:test` imports and `execSync` helper
  - Smoke tests covering `--version`, `--help`, and registry loading
  - Lifecycle tests with proper `after()` cleanup hooks
  - Adapter dry-run tests for each implemented framework adapter
  - Error case tests using `assert.throws` with message regex
  - JSON output tests that parse and validate structure
  - State restoration hooks for any modified filesystem state

- **Validation checklist**:
  - [ ] Test file runs successfully with `node --test cli/test/cli.test.js`
  - [ ] All tests pass with 0 failures
  - [ ] Smoke tests confirm CLI starts and basic commands work
  - [ ] Lifecycle tests verify create → verify → delete sequences
  - [ ] Cleanup hooks execute and restore project state
  - [ ] Error tests confirm non-zero exit codes and helpful messages
  - [ ] JSON tests parse output without errors
  - [ ] Running tests leaves no uncommitted files (`git status` shows clean)

## Failure handling

When this skill encounters problems, follow these recovery procedures:

**Node.js version below 18**
- Error: `Cannot find module 'node:test'` or similar
- Resolution: Check Node.js version with `node --version`. Upgrade to Node.js 18 or later. If upgrade is not possible, use the `node-test-polyfill` package or switch to an alternative test runner like Vitest or Jest with subprocess testing.

**Tests hang or timeout**
- Symptom: `execSync` timeout after 10 seconds
- Resolution: The CLI command likely has an interactive prompt. Add `--yes` flag to auto-confirm prompts, or use `--dry-run` mode. For commands that always prompt, pipe input: `echo "y" | node cli/index.js command`.

**Registry counts cause flaky tests**
- Symptom: Tests pass locally but fail in CI due to changing numbers
- Resolution: Replace hardcoded counts with regex patterns like `/\d+ domains/` or read the actual count dynamically from the CLI output before asserting.

**Cleanup doesn't restore state**
- Symptom: `git status` shows uncommitted files after tests
- Resolution: Verify `after()` hooks are in the correct `describe` block. Add explicit assertions in tests to verify cleanup worked. For symlinks, check if the target exists before trying to recreate it.

**Parallel test execution breaks sequencing**
- Symptom: Lifecycle tests fail intermittently
- Resolution: Add `{ concurrency: 1 }` as the second argument to `describe()` for lifecycle test suites. This forces sequential execution within that suite.

**Error message regex doesn't match**
- Symptom: `assert.throws` fails even though the CLI shows the expected message
- Resolution: Check `error.stdout` in addition to `error.message`. Some CLIs write errors to stdout instead of stderr. Adjust the regex or check the correct stream.

**JSON parsing fails**
- Symptom: `JSON.parse` throws `Unexpected token`
- Resolution: The CLI may prefix JSON with human-readable text. Extract JSON by finding the first `{` character: `const jsonStart = out.indexOf('{'); const data = JSON.parse(out.slice(jsonStart));`

## Next steps

After completing this skill, consider these follow-up actions:

- **scaffold-cli-command** — Build additional CLI commands that these tests can verify
- **build-cli-plugin** — Create more framework adapters to extend the adapter test coverage in Step 4
- **design-cli-output** — Improve output patterns that the tests assert against
- **skill-testing-harness** — Set up automated test running in CI/CD pipelines
- **skill-evaluation** — Validate that these tests provide meaningful coverage and catch regressions
