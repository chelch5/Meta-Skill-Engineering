# Failure Modes

## BigQuery-specific failure modes

### Query execution failures
- **Bytes billed limit exceeded**: Query scans more data than allowed by project limits or budget constraints
- **Slot quota exhausted**: Concurrent queries exceed available slot capacity, causing queueing or timeouts
- **Partition filter missing**: Query on partitioned table lacks required partition filter, triggering full scan
- **Schema evolution conflict**: MERGE or INSERT fails due to added/removed columns or type mismatches

### Performance degradation
- **CTE materialization failure**: Repeated CTE references cause same subquery to execute multiple times
- **Cross-join explosion**: Cartesian product from missing JOIN conditions exhausts memory/slots
- **Inefficient clustering**: Clustering on low-cardinality columns provides minimal pruning benefit
- **Hotspotting**: Time-series data clustered only by timestamp creates single-slot bottlenecks

### Cost and billing issues
- **Cross-region egress charges**: Query reads data from different region than where it executes
- **On-demand cost spikes**: Large scans without reserved slots incur unpredictable $6.25/TB charges
- **Streaming insert costs**: High-frequency streaming writes exceed expected budget
- **Storage costs from retention**: Tables without `partition_expiration_days` accumulate indefinite storage

### Data quality and consistency
- **Duplicate rows from retries**: Client-side retry logic without idempotency creates duplicates
- **Eventual consistency lag**: Streaming buffer data not immediately visible in partition queries
- **Time-travel window exceeded**: Query references data outside 7-day time-travel retention
