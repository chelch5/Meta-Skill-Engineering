---
name: bigquery
description: >-
  Write and optimize Google BigQuery SQL with partition pruning, clustering,
  cost estimation, and slot management. Trigger ONLY when the user explicitly
  mentions BigQuery, GCP BigQuery, Google BigQuery SQL, or when working with
  partitioned tables, slot contention, or bytes-billed optimization in a
  BigQuery context. Reject for PostgreSQL, MySQL, Snowflake, Redshift, or
  other data warehouses; reject for real-time OLTP workloads.
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode]
metadata:
  owner: codex
  domain: bigquery
  maturity: draft
  risk: low
  tags: [bigquery, sql, data]
---

# Purpose

Write efficient BigQuery SQL with proper partitioning, clustering, cost estimation, and query optimization.

# When to use this skill

- writing or optimizing BigQuery SQL queries
- designing tables with time-based partitioning and clustering
- estimating query cost before running with `--dry_run`
- debugging slow queries or slot contention in BigQuery

# Do not use this skill when

- working with PostgreSQL/MySQL — prefer `orm-patterns`
- building real-time OLTP systems — BigQuery is for analytics
- managing GCP infrastructure beyond BigQuery (Terraform, etc.)

# Procedure

## 1. Validate the context

Before applying BigQuery optimization:
- Confirm the user is working with BigQuery (dataset/project structure, `_PARTITIONTIME`, `INFORMATION_SCHEMA`)
- If the user mentions PostgreSQL, MySQL, Snowflake, Redshift, or OLTP: stop and redirect to appropriate skill
- Identify the specific task: query optimization, table design, cost debugging, or slot analysis

## 2. Estimate cost before running

Always dry-run queries to check bytes scanned:

```bash
bq query --dry_run --use_legacy_sql=false \
  'SELECT user_id, COUNT(*) FROM project.dataset.events
   WHERE event_date BETWEEN "2024-01-01" AND "2024-01-31"
   GROUP BY 1'
```

Cost formula: bytes scanned × $6.25/TB (on-demand) or slot-hours (reserved).

## 3. Apply partition pruning

- Always filter on the partition column in the `WHERE` clause
- Common partition columns: `_PARTITIONTIME`, `_PARTITIONDATE`, or explicit `DATE`/`TIMESTAMP` columns
- Use `require_partition_filter = true` on large tables to prevent full scans

## 4. Design with clustering

Cluster tables by high-cardinality filter columns (up to 4 columns in filter-frequency order):

```sql
CREATE TABLE project.dataset.events (
  event_date    DATE NOT NULL,
  event_name    STRING NOT NULL,
  user_id       STRING,
  properties    JSON,
  created_at    TIMESTAMP NOT NULL
)
PARTITION BY event_date
CLUSTER BY event_name, user_id
OPTIONS (
  partition_expiration_days = 365,
  require_partition_filter = true
);
```

## 5. Optimize query structure

- Select only needed columns — BigQuery is columnar; `SELECT *` scans all columns
- Use explicit `JOIN` keys — avoid cross joins
- For cardinality estimates on large tables, use `APPROX_COUNT_DISTINCT` (~2% error, 10x faster)
- Materialize repeated CTEs as temp tables — BigQuery evaluates CTEs multiple times
- For upserts, prefer `MERGE` over `DELETE + INSERT` — single-pass atomic operation

## 6. Monitor and debug

Check recent expensive queries:

```sql
SELECT
  job_id,
  query,
  total_bytes_billed / POW(1024, 4) AS tb_billed,
  total_slot_ms / 1000 AS slot_seconds,
  total_bytes_processed / POW(1024, 3) AS gb_processed
FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
  AND job_type = 'QUERY'
ORDER BY total_bytes_billed DESC
LIMIT 10;
```

# Table design

```sql
CREATE TABLE project.dataset.events (
  event_date    DATE NOT NULL,
  event_name    STRING NOT NULL,
  user_id       STRING,
  properties    JSON,
  created_at    TIMESTAMP NOT NULL
)
PARTITION BY event_date
CLUSTER BY event_name, user_id
OPTIONS (
  partition_expiration_days = 365,
  require_partition_filter = true
);
```

# Cost estimation

```bash
# Dry run to check bytes scanned (cost = bytes * $6.25/TB on-demand)
bq query --dry_run --use_legacy_sql=false \
  'SELECT user_id, COUNT(*) FROM project.dataset.events
   WHERE event_date BETWEEN "2024-01-01" AND "2024-01-31"
   GROUP BY 1'

# Check actual cost of recent queries
SELECT
  job_id,
  total_bytes_billed / POW(1024, 4) AS tb_billed,
  total_slot_ms / 1000 AS slot_seconds
FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
ORDER BY total_bytes_billed DESC
LIMIT 10;
```

# Output contract

When applying this skill, the response must include:

1. **System Surface** — Identify the BigQuery context (project, dataset, table structure) and current pain point (cost, latency, slot contention)
2. **Chosen Pattern** — Specify which optimization technique applies (partition pruning, clustering, query rewrite, slot reservation)
3. **SQL or Command** — Provide concrete, copy-pasteable BigQuery SQL or CLI commands
4. **Cost Impact** — Estimate bytes scanned or slot-hours before and after optimization
5. **Edge Cases** — Note when the pattern does NOT apply (e.g., small tables under 1GB, streaming inserts, external tables)
6. **Validation** — Give a specific query to verify the fix using `INFORMATION_SCHEMA.JOBS_BY_PROJECT` or dry-run

The response must stay in BigQuery domain — do not drift into generic SQL advice or other data warehouses.

# Failure handling

## BigQuery-specific failures and responses

| Failure | Cause | Immediate response |
|---------|-------|-------------------|
| Query exceeded limit for bytes billed | Missing partition filter or `SELECT *` on large table | Add partition filter; replace `SELECT *` with explicit columns; retry dry-run |
| Slot contention (high `total_slot_ms`) | Concurrent expensive queries or insufficient slots | Add `LIMIT` for exploration queries; request slot reservation; stagger batch jobs |
| CTE evaluated multiple times | Repeated reference to same CTE in query | Convert CTE to temp table with `CREATE OR REPLACE TABLE` |
| Cross-region data transfer costs | Querying data from different region | Use `region-` prefix in table references; replicate data to same region if query-heavy |
| Partition filter required | `require_partition_filter = true` without WHERE on partition column | Add filter on partition column; use `_PARTITIONTIME` or explicit partition column |
| Schema mismatch on MERGE | Source and target columns have different types or names | Explicitly cast columns in USING clause; verify column names match exactly |

## When to stop and escalate

- If the user needs data governance, IAM policies, or VPC controls: escalate to security/GCP admin
- If the query involves PII/PHI without proper masking: flag for compliance review
- If slot reservation changes are needed: involve capacity planning

# Next steps

After applying BigQuery optimization:
- If the user needs OLTP patterns: route to `orm-patterns`
- If the user needs API contract design: route to `api-contracts`
- If the user needs data modeling guidance: route to `data-model`
- If cost optimization requires infrastructure changes: escalate to capacity planning

# References

- https://cloud.google.com/bigquery/docs/best-practices-performance-overview
- https://cloud.google.com/bigquery/pricing
- https://cloud.google.com/bigquery/docs/querying-partitioned-tables
- https://cloud.google.com/bigquery/docs/clustered-tables
