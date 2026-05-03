# References: BigQuery Pipeline Audit

## BigQuery Python Client Documentation

- [BigQuery Python Client Library](https://cloud.google.com/python/docs/reference/bigquery/latest)
- [QueryJobConfig Reference](https://cloud.google.com/python/docs/reference/bigquery/latest/google.cloud.bigquery.job.QueryJobConfig)
- [Best Practices for BigQuery](https://cloud.google.com/bigquery/docs/best-practices-performance-overview)

## Cost Control

- [BigQuery Pricing](https://cloud.google.com/bigquery/pricing)
- [Controlling Query Costs](https://cloud.google.com/bigquery/docs/best-practices-costs)
- [Maximum Bytes Billed](https://cloud.google.com/bigquery/docs/best-practices-costs#maximum_bytes_billed)

## Idempotency and Safety

- [MERGE Statement](https://cloud.google.com/bigquery/docs/reference/standard-sql/dml-syntax#merge_statement)
- [Table Partitioning](https://cloud.google.com/bigquery/docs/partitioned-tables)
- [Time Travel and Snapshots](https://cloud.google.com/bigquery/docs/time-travel)

## Common Anti-patterns

### Cost Anti-patterns
- Looping over dates and running one query per date
- Running queries without `maximum_bytes_billed` in production
- Loading full tables when partitioned reads would suffice

### Safety Anti-patterns
- Plain INSERT without deduplication logic
- Using `run_id` as part of the merge key (prevents idempotent re-runs)
- Silent `except: pass` blocks that swallow errors

### Observability Anti-patterns
- Not logging job IDs for BigQuery operations
- Missing run summaries with cost/bytes metrics
- Inconsistent `run_id` across log lines
