# Implementation Patterns

## BigQuery optimization patterns

### Partition pruning patterns
- Always include partition column in `WHERE` clause before other filters
- Use `require_partition_filter = true` for large tables to enforce at DDL level
- For time-series, partition by date; filter with `event_date BETWEEN '2024-01-01' AND '2024-01-31'`
- Use `_PARTITIONTIME` pseudo-column for ingestion-time partitioning

### Clustering best practices
- Cluster by high-cardinality columns that appear frequently in filters (user_id, event_name, device_id)
- Order cluster columns by query frequency: most-filtered column first
- Maximum 4 cluster columns; additional columns provide diminishing returns
- Clustering benefits both filtering and JOIN performance

### Cost control patterns
- Use `APPROX_COUNT_DISTINCT` for exploration queries; exact `COUNT(DISTINCT)` for financial reports
- Materialize expensive CTEs: `CREATE OR REPLACE TABLE temp.results AS (WITH cte AS ...)`
- Add `LIMIT 1000` to exploration queries on large tables
- Use reserved slots for predictable workloads; on-demand for sporadic queries

### Query optimization patterns
- Select only needed columns: BigQuery charges by bytes scanned, not rows returned
- Avoid cross joins: always specify JOIN conditions explicitly
- Use `MERGE` for upserts: single atomic operation vs. DELETE + INSERT
- Prefer `QUALIFY` window functions over self-joins for ranking/row selection

### Slot management patterns
- Monitor slot contention via `INFORMATION_SCHEMA.JOBS_BY_PROJECT.total_slot_ms`
- Schedule heavy ETL jobs during low-traffic hours
- Break large queries into smaller batches for better slot sharing
- Consider flat-rate pricing if consistent high slot usage
