---
name: bigquery-pipeline-audit
description: Audit Python + BigQuery ELT pipelines for cost overruns, idempotency gaps, and production failures. Triggers when reviewing data pipelines that use BigQuery client libraries (google.cloud.bigquery), scheduling backfills, or inspecting job safety before deployment. Requires Python code with visible BQ client calls.
---

# BigQuery Pipeline Audit

Audit Python + BigQuery ELT pipelines for cost overruns, idempotency gaps, and production failures before deployment.

## When to use

Use this skill when:
- Reviewing a Python data pipeline script that calls BigQuery
- Scheduling a backfill or production run and need safety verification
- Inspecting BigQuery job safety before deployment to prod
- Evaluating cost exposure of a new or modified pipeline
- Checking idempotency guarantees for rerun safety

## When NOT to use

Do NOT use this skill when:
- The pipeline uses a different data warehouse (Snowflake, Redshift, Databricks) - use warehouse-specific guidance
- The code is SQL-only without Python orchestration (use static SQL linters instead)
- The task is general Python code review without BigQuery concerns
- You need to write a new pipeline from scratch (use skill-creator)
- The review is post-incident root cause analysis (use incident-specific skills)

## Procedure

You are a senior data engineer reviewing Python + BigQuery pipeline code. Your goals: catch runaway costs before they happen, ensure reruns do not corrupt data, and make failures visible.

### Phase 1: Load and scope
1. Read the target Python file(s)
2. Identify all BigQuery client instantiations (`bigquery.Client()`)
3. List all BQ job trigger methods: `client.query`, `load_table_from_*`, `extract_table`, `copy_table`
4. If code cannot be parsed, stop and report `INCOMPLETE REVIEW` per Failure Handling

### Phase 2: Cost exposure scan (Section A)
For each BQ job trigger found:
- Check if inside a loop, retry block, or async gather
- Calculate worst-case call count
- Verify `QueryJobConfig.maximum_bytes_billed` is set for all queries
- Flag repeated identical queries (suggest query hashing + temp table caching)

Stop and report FAIL if:
- Any BQ query runs once per date or once per entity in a loop
- Worst-case BQ job count exceeds 20
- `maximum_bytes_billed` is missing on any `client.query` call

### Phase 3: Execution safety check (Section B)
Verify a `--mode` flag exists with at least `dry_run` and `execute` options:
- `dry_run` must print plan and estimated scope with zero billed BQ execution
- `execute` requires explicit confirmation for prod (`--env=prod --confirm`)
- Prod must not be the default environment

If missing, propose a minimal `argparse` patch with safe defaults.

Stop and report FAIL if `--mode=execute` runs against prod without `--confirm`.

### Phase 4: Backfill design review (Section C)
Check that date-range backfills use ONE of:
1. Single set-based query with `GENERATE_DATE_ARRAY`
2. Staging table loaded with all dates then one join query
3. Explicit chunks with hard `MAX_CHUNKS` cap

Also verify:
- Date range bounded by default (suggest 14 days max without `--override`)
- Crash recovery is safe (re-run will not double-write)
- Backdated simulations read from time-consistent snapshots

Stop and report FAIL if the script runs one BQ query per date or per entity in a loop.

### Phase 5: Query safety audit (Section D)
For each query, verify:
- Partition filter on raw column (not `DATE(ts)`, `CAST(...)`)
- No `SELECT *` - only columns used downstream
- Join keys are unique or appropriately scoped (flag potential many-to-many)
- Expensive operations (`REGEXP`, `JSON_EXTRACT`, UDFs) run after partition filtering

Stop and report FAIL if a query lacks partition filter and would scan > 10 GB.

### Phase 6: Write safety check (Section E)
Identify every write operation. Flag plain `INSERT`/append with no dedup logic.
Each write must use ONE of:
1. `MERGE` on deterministic key (e.g., `entity_id + date + model_version`)
2. Write to staging table scoped to run, then swap or merge into final
3. Append-only with dedupe view: `QUALIFY ROW_NUMBER() OVER (PARTITION BY <key>) = 1`

Also check:
- Re-run safety (will it create duplicates?)
- Write disposition (`WRITE_TRUNCATE` vs `WRITE_APPEND`) is intentional
- `run_id` is NOT part of merge/dedup key (should be metadata only)

Stop and report FAIL if a write is append-only with no dedup mechanism and no documented justification.

### Phase 7: Observability verification (Section F)
Verify:
- Failures raise exceptions and abort (no silent `except: pass` or warn-only)
- Each BQ job logs: job ID, bytes processed/billed, slot milliseconds, duration
- Run summary logged/written at end with: `run_id, env, mode, date_range, tables written, total BQ jobs, total bytes`
- `run_id` present and consistent across all log lines

If `run_id` missing, propose: `run_id = run_id or datetime.utcnow().strftime('%Y%m%dT%H%M%S')`

Stop and report FAIL if any `except: pass`, bare `except Exception`, or warn-only error handling present.

### Phase 8: Compile and output
Reference exact function names and line locations. Suggest minimal fixes, not rewrites. Respond using the Output Contract structure below.

---

## A) COST EXPOSURE: What will actually get billed?

Locate every BigQuery job trigger (`client.query`, `load_table_from_*`,
`extract_table`, `copy_table`, DDL/DML via query) and every external call
(APIs, LLM calls, storage writes).

For each, answer:
- Is this inside a loop, retry block, or async gather?
- What is the realistic worst-case call count?
- For each `client.query`, is `QueryJobConfig.maximum_bytes_billed` set?
  For load, extract, and copy jobs, is the scope bounded and counted against MAX_JOBS?
- Is the same SQL and params being executed more than once in a single run?
  Flag repeated identical queries and suggest query hashing plus temp table caching.

**Hard fail if:**
- Any BQ query runs once per date or once per entity in a loop
- Worst-case BQ job count exceeds 20
- `maximum_bytes_billed` is missing on any `client.query` call

---

## B) DRY RUN AND EXECUTION MODES

Verify a `--mode` flag exists with at least `dry_run` and `execute` options.

- `dry_run` must print the plan and estimated scope with zero billed BQ execution
  (BigQuery dry-run estimation via job config is allowed) and zero external API or LLM calls
- `execute` requires explicit confirmation for prod (`--env=prod --confirm`)
- Prod must not be the default environment

If missing, propose a minimal `argparse` patch with safe defaults.

**Hard fail if:** `--mode=execute` runs against prod without `--confirm`.

---

## C) BACKFILL AND LOOP DESIGN

**Hard fail if:** the script runs one BQ query per date or per entity in a loop.

Check that date-range backfills use one of:
1. A single set-based query with `GENERATE_DATE_ARRAY`
2. A staging table loaded with all dates then one join query
3. Explicit chunks with a hard `MAX_CHUNKS` cap

Also check:
- Is the date range bounded by default (suggest 14 days max without `--override`)?
- If the script crashes mid-run, is it safe to re-run without double-writing?
- For backdated simulations, verify data is read from time-consistent snapshots
  (`FOR SYSTEM_TIME AS OF`, partitioned as-of tables, or dated snapshot tables).
  Flag any read from a "latest" or unversioned table when running in backdated mode.

Suggest a concrete rewrite if the current approach is row-by-row.

---

## D) QUERY SAFETY AND SCAN SIZE

For each query, check:
- **Partition filter** is on the raw column, not `DATE(ts)`, `CAST(...)`, or
  any function that prevents pruning
- **No `SELECT *`**: only columns actually used downstream
- **Joins will not explode**: verify join keys are unique or appropriately scoped
  and flag any potential many-to-many
- **Expensive operations** (`REGEXP`, `JSON_EXTRACT`, UDFs) only run after
  partition filtering, not on full table scans

Provide a specific SQL fix for any query that fails these checks.

**Hard fail if:** a query lacks a partition filter and would scan more than 10 GB.

---

## E) SAFE WRITES AND IDEMPOTENCY

Identify every write operation. Flag plain `INSERT`/append with no dedup logic.

Each write should use one of:
1. `MERGE` on a deterministic key (e.g., `entity_id + date + model_version`)
2. Write to a staging table scoped to the run, then swap or merge into final
3. Append-only with a dedupe view:
   `QUALIFY ROW_NUMBER() OVER (PARTITION BY <key>) = 1`

Also check:
- Will a re-run create duplicate rows?
- Is the write disposition (`WRITE_TRUNCATE` vs `WRITE_APPEND`) intentional
  and documented?
- Is `run_id` being used as part of the merge or dedupe key? If so, flag it.
  `run_id` should be stored as a metadata column, not as part of the uniqueness
  key, unless you explicitly want multi-run history.

State the recommended approach and the exact dedup key for this codebase.

**Hard fail if:** a write is append-only with no dedup mechanism and no documented justification.

---

## F) OBSERVABILITY: Can you debug a failure?

Verify:
- Failures raise exceptions and abort with no silent `except: pass` or warn-only
- Each BQ job logs: job ID, bytes processed or billed when available,
  slot milliseconds, and duration
- A run summary is logged or written at the end containing:
  `run_id, env, mode, date_range, tables written, total BQ jobs, total bytes`
- `run_id` is present and consistent across all log lines

If `run_id` is missing, propose a one-line fix:
`run_id = run_id or datetime.utcnow().strftime('%Y%m%dT%H%M%S')`

**Hard fail if:** any `except: pass`, bare `except Exception`, or warn-only error handling is present.

---

## Output Contract

Respond using this exact structure:

```
## Audit Result: [PASS | FAIL]

### A) Cost Exposure: [PASS | FAIL]
Reason: <one-line verdict>. <specific findings with line numbers>

### B) Dry Run and Execution Modes: [PASS | FAIL]
Reason: <one-line verdict>. <specific findings with line numbers>

### C) Backfill and Loop Design: [PASS | FAIL]
Reason: <one-line verdict>. <specific findings with line numbers>

### D) Query Safety and Scan Size: [PASS | FAIL]
Reason: <one-line verdict>. <specific findings with line numbers>

### E) Safe Writes and Idempotency: [PASS | FAIL]
Reason: <one-line verdict>. <specific findings with line numbers>

### F) Observability: [PASS | FAIL]
Reason: <one-line verdict>. <specific findings with line numbers>

### Patch List (ordered by risk - highest first)
1. <file>:<line> — <function>: <risk> — fix: <minimal patch>
2. ...

### Top Cost Risks (only if overall FAIL)
1. <risk description>: worst-case job count / cost estimate
2. ...
```

Requirements:
- Every [PASS] or [FAIL] must include a one-line reason followed by specifics
- Patch list entries must name the specific file, line, and function
- Patches should be copy-paste ready, not pseudocode
- If section cannot be analyzed (unreachable code), state `UNVERIFIED` and fail conservatively

---

## Failure Handling

### Code parsing failures
If the script under review cannot be loaded or parsed:
1. State which file or import failed with the specific error
2. Report what partial analysis is still possible based on visible code
3. Flag the pipeline as `## Audit Result: INCOMPLETE REVIEW`
4. Do not emit PASS; list which sections (A-F) could not be evaluated

### Unreachable methods
If a required BigQuery client method is not reachable for inspection:
- Note it as `UNVERIFIED: <method>` in the relevant section (A, D, or E)
- Do not assume safety; fail conservatively for that section
- If the method is critical to safety (e.g., `client.query`), FAIL the section

### Missing required information
If the codebase lacks information needed for a complete audit:
- Document what is missing and where it should be found
- Provide analysis based on available information
- Mark affected sections as conditional/assumed

### Contradictory code patterns
If the codebase contains contradictory patterns (e.g., dry_run flag exists but still executes queries):
- Flag the contradiction explicitly
- FAIL the relevant section
- Explain which pattern takes precedence and why

---

## Next steps

After completing the audit:

### If audit PASSED
- Document the approved configuration for production deployment
- Consider scheduling regular re-audits when the pipeline changes significantly
- Store this audit result as evidence of safety review

### If audit FAILED
1. **Immediate actions:**
   - Do not deploy to production until critical cost or safety issues are resolved
   - Prioritize fixes in the Patch List order (highest risk first)

2. **Follow-up workflows:**
   - Use `skill-improver` if the skill itself needs refinement based on edge cases encountered
   - Use `skill-safety-review` if you need to verify safety of the proposed fixes
   - Use `skill-evaluation` to validate that your fixes address the audit findings

3. **Escalation paths:**
   - If the pipeline uses a different data warehouse than expected, switch to warehouse-specific guidance
   - If you need to create a new skill for a different pipeline pattern, use `skill-creator`

### Related skills for extended workflows
- **skill-safety-review** - Verify safety of proposed patches before implementation
- **skill-improver** - Refine this audit skill based on new edge cases discovered
- **skill-creator** - Create new skills for pipeline patterns not covered here
- **skill-evaluation** - Validate that fixes actually resolve the reported issues
