---
name: snowflake-semanticview
description: Create, alter, drop, and validate Snowflake semantic views using Snowflake CLI. Triggers on CREATE SEMANTIC VIEW, ALTER SEMANTIC VIEW, or semantic layer modeling tasks requiring Snowflake CLI validation.
---

# Snowflake Semantic Views

## Purpose

Enable agents to build, modify, and validate Snowflake semantic views through the official Snowflake CLI. This skill bridges business-friendly semantic layer definitions with executable DDL that passes Snowflake validation.

## When to use

- User requests to create a new Snowflake semantic view
- User requests to alter an existing semantic view
- User needs to validate semantic view DDL before production deployment
- User asks to troubleshoot semantic view creation errors
- User needs guidance on Snowflake CLI setup for semantic layer work

## When NOT to use

- User is working with standard Snowflake views (not semantic views) — use standard SQL DDL skills instead
- User is modeling semantic layers outside Snowflake (e.g., dbt, Looker) — use the appropriate tool-specific skill
- User requests changes that require Snowflake accountadmin privileges beyond semantic view scope
- User asks about querying semantic views only (no DDL changes needed) — provide query syntax directly without invoking this skill

## Procedure

### 1. Prerequisites Check

Verify Snowflake CLI is installed and configured:

```bash
snow --help
snow connection list
```

If CLI is missing, direct the user to the installation guide and pause until they confirm completion.

### 2. Gather Target Configuration

Confirm these required values before writing DDL:
- Database name
- Schema name
- Target semantic view name
- Role with CREATE SEMANTIC VIEW privilege
- Warehouse for DDL execution

### 3. Validate Star Schema Structure

Verify the underlying data model follows star schema pattern:
- Fact tables contain measurable events with foreign keys to dimensions
- Dimension tables contain descriptive attributes
- Conformed dimensions shared across fact tables

If the schema is not star-shaped, warn the user that semantic views are designed for star schemas and may not function correctly with other patterns.

### 4. Draft Semantic View DDL

Write CREATE SEMANTIC VIEW or ALTER SEMANTIC VIEW following the official syntax:

```sql
CREATE SEMANTIC VIEW <name>
  DIMENSIONS (
    <dimension_table>.<column> [WITH SYNONYMS (...)] [COMMENT '...']
  )
  FACTS (
    <fact_table>.<column> [WITH SYNONYMS (...)] [COMMENT '...']
  )
  METRICS (
    <metric_name> AS <expression> [WITH SYNONYMS (...)] [COMMENT '...']
  );
```

Guidelines:
- Use Snowflake table/view/column comments as the primary source for synonyms and comments
- Query existing comments with: `SELECT * FROM <database>.information_schema.columns WHERE table_name = '<table>'`
- Never fabricate synonyms or comments without user approval
- If comments are missing, present a choice: auto-generate suggestions, use user-provided text, or proceed without

### 5. Create Temporary Validation Version

Generate a temporary semantic view name by appending `__tmp_validate_<timestamp>` to avoid naming conflicts:

```sql
CREATE SEMANTIC VIEW <original_name>__tmp_validate_<timestamp> ...
```

Keep the temporary view in the same database and schema for accurate validation.

### 6. Validate DDL via Snowflake CLI

Execute the temporary DDL against Snowflake:

```bash
snow sql -q "CREATE SEMANTIC VIEW <temporary_name> ..." --connection <connection_name> --database <database> --schema <schema> --role <role> --warehouse <warehouse>
```

Capture and analyze the CLI output. Success indicators:
- Exit code 0
- No error messages in stderr
- Confirmation message showing the semantic view was created

If validation fails, capture the full error message and proceed to failure diagnosis.

### 7. Diagnose Validation Failures

Common failure patterns and resolutions:

| Error Pattern | Likely Cause | Resolution |
|--------------|--------------|------------|
| `Semantic view must reference at least one fact` | No FACTS clause or empty facts list | Verify fact table columns are correctly referenced |
| `Dimension <name> not found` | Typo in dimension table/column name or missing privileges | Check table exists, verify column names, confirm role has SELECT privilege |
| `Metric <name> contains invalid expression` | SQL syntax error in metric expression | Validate metric expression runs as standalone SELECT |
| `Synonym '<word>' is reserved` | Using Snowflake reserved keywords as synonyms | Replace with non-reserved terms |
| `Insufficient privileges` | Role lacks CREATE SEMANTIC VIEW or SELECT on referenced tables | Verify role permissions or request elevated access |
| `Warehouse <name> not found` | Warehouse name typo or missing access | Confirm warehouse name and access |

After each fix, re-run validation with a new temporary name.

### 8. Execute Final DDL

Once validation succeeds, execute the production DDL:

```sql
CREATE SEMANTIC VIEW <final_name> ...
```

or for alterations:

```sql
ALTER SEMANTIC VIEW <existing_name> ...
```

### 9. Verify Final Semantic View

Run a sample query to confirm the semantic view functions:

```sql
SELECT * FROM SEMANTIC_VIEW(
    <semantic_view_name>
    DIMENSIONS <dimension_table>.<dimension_column>
    METRICS <metric_name>
)
ORDER BY <dimension_column>
LIMIT 10;
```

Verify the query:
- Returns results without errors
- Contains expected dimensions and metrics
- Returns reasonable row count (not empty unless expected)

### 10. Clean Up Temporary Artifacts

Drop the temporary validation semantic view:

```sql
DROP SEMANTIC VIEW IF EXISTS <temporary_name>;
```

Verify cleanup succeeded with no errors.

## Output contract

Upon successful completion, provide:

1. **Executed DDL**: The final CREATE SEMANTIC VIEW or ALTER SEMANTIC VIEW statement applied
2. **Validation evidence**: CLI output showing successful temporary validation
3. **Verification query results**: Output from the sample SEMANTIC_VIEW() query showing the view is queryable
4. **Cleanup confirmation**: Evidence the temporary validation view was dropped
5. **Synonym/comment summary**: List of all synonyms and comments applied to dimensions, facts, and metrics

If the request could not be completed, provide:
1. **Failure reason**: Specific error message or blocking issue
2. **Attempted resolution**: Steps taken to address the failure
3. **User decision point**: Clear options for next steps (fix schema issues, adjust privileges, modify requirements, etc.)

## Failure handling

### Validation failures

When Snowflake CLI returns errors during validation:

1. Capture the full error message from stderr
2. Match the error against the common patterns table in the Procedure section
3. Present the specific diagnosis and resolution to the user
4. Apply the fix and re-validate with a new temporary name
5. If the error does not match known patterns, search Snowflake documentation for the specific error code
6. Never proceed to production DDL with unvalidated syntax

### Connection and privilege failures

When CLI commands fail with connectivity or permission errors:

1. Verify the connection name exists: `snow connection list`
2. Verify the role has required privileges:
   - CREATE SEMANTIC VIEW on the schema
   - SELECT on all referenced tables
3. Verify the warehouse is running and accessible
4. If privileges are insufficient, provide the exact GRANT statements needed and ask the user to execute them

### Schema mismatch failures

When the semantic view definition does not match the underlying schema:

1. Query INFORMATION_SCHEMA to verify actual column names and data types
2. Identify the mismatch between DDL references and actual schema
3. Present corrected DDL to the user for approval
4. Do not assume column name mappings without verification

### Rollback procedure

If production DDL fails after successful validation:

1. Capture the error immediately
2. If the semantic view was partially created, drop it: `DROP SEMANTIC VIEW IF EXISTS <name>`
3. Preserve the temporary validation view for comparison (do not clean up yet)
4. Compare the temporary and production DDL character-by-character to identify differences
5. Only clean up temporary views after confirming production success

## Next steps

After completing semantic view work, consider:

- **skill-evaluation**: Test this semantic view skill against edge cases
- **skill-improver**: Refine the skill further based on observed failure patterns
- Query optimization guidance: Help users write efficient queries against their new semantic view
- Documentation generation: Create business-user documentation explaining the semantic layer

## References

### Snowflake Documentation

- [CREATE SEMANTIC VIEW syntax](https://docs.snowflake.com/en/sql-reference/sql/create-semantic-view)
- [ALTER SEMANTIC VIEW syntax](https://docs.snowflake.com/en/sql-reference/sql/alter-semantic-view)
- [DROP SEMANTIC VIEW syntax](https://docs.snowflake.com/en/sql-reference/sql/drop-semantic-view)
- [COMMENT syntax for adding table/column comments](https://docs.snowflake.com/en/sql-reference/sql/comment)
- [Querying semantic views](https://docs.snowflake.com/en/user-guide/views-semantic/querying)
- [Snowflake CLI installation](https://docs.snowflake.com/en/developer-guide/snowflake-cli/installation/installation)
- [Configure Snowflake CLI connections](https://docs.snowflake.com/en/developer-guide/snowflake-cli/connecting/configure-connections)

### Required Privileges

The executing role must have:
- CREATE SEMANTIC VIEW privilege on the target schema
- SELECT privilege on all referenced dimension and fact tables
- USAGE privilege on the target database and schema
- OPERATE privilege on the warehouse used for execution
