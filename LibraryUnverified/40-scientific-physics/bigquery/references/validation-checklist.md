# Validation Checklist

## Pre-execution validation

Before running a BigQuery query or DDL:

- [ ] **Dry-run completed**: `bq query --dry_run` executed and bytes scanned reviewed
- [ ] **Partition filter present**: Query on partitioned table includes filter on partition column
- [ ] **Column selection minimal**: Only required columns selected (no `SELECT *`)
- [ ] **Cost estimate reasonable**: Estimated cost fits within project budget or reserved slots
- [ ] **Cross-region check**: Tables referenced are in same region as query execution

## Post-execution validation

After running BigQuery operations:

- [ ] **Actual bytes billed verified**: Check `INFORMATION_SCHEMA.JOBS_BY_PROJECT` for actual vs. estimated
- [ ] **Slot usage acceptable**: `total_slot_ms` within expected range for query complexity
- [ ] **Results validated**: Row counts, aggregations, and sample data match expectations
- [ ] **No duplicate effects**: For DML operations, verify idempotency or single-effect guarantee
- [ ] **Partition pruning confirmed**: Use `EXPLAIN` or query plan to verify partition elimination

## Table design validation

For new or modified table schemas:

- [ ] **Partition strategy appropriate**: Date partitioning for time-series; integer range for non-temporal
- [ ] **Cluster columns ordered by filter frequency**: Most-filtered column first, up to 4 columns
- [ ] **Expiration policy set**: `partition_expiration_days` or table expiration configured
- [ ] **Require partition filter enabled**: On large tables (>1GB) to prevent accidental full scans
- [ ] **Schema documented**: Column descriptions and purpose documented for team reference
