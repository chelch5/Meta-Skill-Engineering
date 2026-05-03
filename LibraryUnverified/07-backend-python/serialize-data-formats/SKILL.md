---
name: serialize-data-formats
description: >-
  Serialize and deserialize data across JSON, XML, YAML, Protocol Buffers,
  MessagePack, and Apache Arrow/Parquet. Use when asked to "convert data to JSON",
  "serialize to protobuf", "choose a wire format for APIs", "optimize data storage",
  or implement format-specific encoding/decoding. Do not use for database-specific
  serialization (use database-access patterns), custom binary protocols without
  standard formats, or data format design without implementation.
---

## Purpose

Enable correct selection and implementation of data serialization formats for
API communication, persistent storage, and cross-system data exchange. Provides
concrete encoding/decoding patterns with performance trade-offs and schema
guidance for production use.

## When to use

- Converting data structures to/from JSON, XML, or YAML
- Implementing Protocol Buffers schemas and code generation
- Choosing between MessagePack, JSON, or binary formats for wire transfer
- Writing or reading Apache Parquet/Arrow for analytics workloads
- Comparing serialization format performance for specific payload sizes
- Migrating data from one serialization format to another
- Adding custom type handling (datetime, binary, decimal) to JSON/MsgPack

## When NOT to use

- Database-specific serialization (ORM models, SQL dumps) → database-access skill
- Custom binary protocols without standard format specs → custom-protocol skill
- Format selection without implementation → documentation request only
- Data compression without serialization (gzip, zstd on raw bytes) → compression skill
- Authentication/encryption encoding (base64 for auth tokens) → security-encoding skill

## Procedure

### Step 1: Select format based on requirements

Read the user's data structure and use case, then select from this decision matrix:

| Format | Human Readable | Schema Required | Size | Speed | Best For |
|--------|---------------|-----------------|------|-------|----------|
| JSON | Yes | Optional | Medium | Medium | REST APIs, config, broad interop |
| XML | Yes | Yes (XSD/DTD) | Large | Slow | Enterprise/legacy, SOAP, documents |
| YAML | Yes | Optional | Medium | Slow | Config files, CI/CD, Kubernetes |
| Protocol Buffers | No | Required | Small | Fast | gRPC, microservices, mobile APIs |
| MessagePack | No | None | Small | Fast | Real-time, embedded, Redis caching |
| Apache Parquet | No | Built-in | Very Small | Very Fast | Analytics, columnar queries, data lakes |
| Apache Arrow | No | Built-in | Medium | Fast | In-memory interchange, zero-copy |

Decision logic:
1. Human editing required + config use → YAML
2. Human readable + API use → JSON
3. Strict schema + fast RPC → Protocol Buffers
4. Smallest wire size + no schema → MessagePack
5. Columnar analytics + storage → Apache Parquet
6. In-memory columnar processing → Apache Arrow
7. Legacy enterprise integration → XML

**Selection output:** Document the chosen format with one-sentence rationale
matching the primary use case requirement.

### Step 2: Implement JSON encoding/decoding

For Python with complex types:

```python
import json
from datetime import datetime, date
from dataclasses import dataclass, asdict
from typing import Any

@dataclass
class Measurement:
    sensor_id: str
    value: float
    unit: str
    timestamp: datetime

class CustomEncoder(json.JSONEncoder):
    """Handles datetime, date, and bytes serialization."""
    def default(self, obj: Any) -> Any:
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, date):
            return obj.isoformat()
        if isinstance(obj, bytes):
            import base64
            return base64.b64encode(obj).decode('ascii')
        return super().default(obj)

# Serialize
data = Measurement("sensor-01", 23.5, "celsius", datetime.now())
json_output = json.dumps(asdict(data), cls=CustomEncoder, indent=2)

# Deserialize with type restoration
def json_decode(json_str: str) -> dict:
    """Decode JSON with ISO datetime parsing."""
    data = json.loads(json_str)
    if 'timestamp' in data and isinstance(data['timestamp'], str):
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
    return data
```

For R statistical computing:

```r
library(jsonlite)

# Serialize dataframe
df <- data.frame(sensor_id = "sensor-01", value = 23.5, unit = "celsius")
json_output <- jsonlite::toJSON(df, auto_unbox = TRUE, pretty = TRUE)

# Deserialize with type preservation
df_restored <- jsonlite::fromJSON(json_output)
```

**Verification:** Round-trip serialization must preserve all field names and
restore datetime/decimal types accurately.

### Step 3: Implement Protocol Buffers

Write the schema definition:

```protobuf
syntax = "proto3";
package sensors;

message Measurement {
  string sensor_id = 1;
  double value = 2;
  string unit = 3;
  int64 timestamp_ms = 4;  // Unix epoch milliseconds
}

message MeasurementBatch {
  repeated Measurement measurements = 1;
}
```

Generate language bindings:

```bash
# Python
protoc --python_out=. sensors.proto

# Go
protoc --go_out=. --go_opt=paths=source_relative sensors.proto

# Java
protoc --java_out=. sensors.proto
```

Implement serialization:

```python
from sensors_pb2 import Measurement, MeasurementBatch
import time

# Create and serialize single message
m = Measurement(
    sensor_id="sensor-01",
    value=23.5,
    unit="celsius",
    timestamp_ms=int(time.time() * 1000)
)
binary_data = m.SerializeToString()

# Deserialize
m2 = Measurement()
m2.ParseFromString(binary_data)
assert m2.value == 23.5  # Verify round-trip
```

**Verification:** Binary output should be 3-10x smaller than equivalent JSON.
Measure with `len(binary_data) / len(json.dumps(data).encode())`.

### Step 4: Implement MessagePack binary serialization

```python
import msgpack
from datetime import datetime
from typing import Any, Dict

def encode_extended(obj: Any) -> Any:
    """Handle datetime and bytes for MessagePack."""
    if isinstance(obj, datetime):
        return {"__type__": "datetime", "iso": obj.isoformat()}
    if isinstance(obj, bytes):
        return {"__type__": "bytes", "b64": base64.b64encode(obj).decode('ascii')}
    return obj

def decode_extended(obj: Dict) -> Any:
    """Restore extended types from MessagePack."""
    if obj.get("__type__") == "datetime":
        return datetime.fromisoformat(obj["iso"])
    if obj.get("__type__") == "bytes":
        return base64.b64decode(obj["b64"])
    return obj

data: Dict[str, Any] = {
    "sensor_id": "sensor-01",
    "value": 23.5,
    "ts": datetime.now()
}

# Serialize (typically 15-30% smaller than JSON)
packed = msgpack.packb(data, default=encode_extended, use_bin_type=True)

# Deserialize
unpacked = msgpack.unpackb(packed, object_hook=decode_extended, raw=False)
```

**Verification:** Compare sizes: `len(packed)` should be noticeably smaller than
`len(json.dumps(data).encode())` for typical payloads.

### Step 5: Implement Apache Parquet for analytics

```python
import pyarrow as pa
import pyarrow.parquet as pq
import pandas as pd

# Create sample tabular data
df = pd.DataFrame({
    "sensor_id": ["s-01", "s-02", "s-01", "s-03"] * 1000,
    "value": [23.5, 18.2, 24.1, 19.8] * 1000,
    "unit": ["celsius"] * 4000,
    "timestamp": pd.date_range("2025-01-01", periods=4000, freq="min")
})

# Write Parquet with Snappy compression
table = pa.Table.from_pandas(df, preserve_index=False)
pq.write_table(table, "measurements.parquet", compression="snappy")

# Read with column pruning (only reads selected columns from disk)
table_subset = pq.read_table("measurements.parquet", columns=["sensor_id", "value"])
df_filtered = table_subset.to_pandas()
```

For R:

```r
library(arrow)

# Write Parquet
write_parquet(df, "measurements.parquet", compression = "snappy")

# Read with column selection
df_filtered <- read_parquet("measurements.parquet", col_select = c("value"))
```

**Verification:** Parquet file size should be 5-20x smaller than equivalent CSV.

### Step 6: Benchmark and validate format choice

Create a benchmark script for the specific data:

```python
import json
import msgpack
import time
import sys

def benchmark_serialization(data: list, iterations: int = 1000) -> dict:
    """Compare JSON vs MessagePack performance."""
    results = {}

    # JSON benchmark
    start = time.perf_counter()
    for _ in range(iterations):
        json_bytes = json.dumps(data).encode()
        json.loads(json_bytes.decode())
    results["json_time_ms"] = (time.perf_counter() - start) * 1000
    results["json_size"] = len(json.dumps(data).encode())

    # MessagePack benchmark
    start = time.perf_counter()
    for _ in range(iterations):
        packed = msgpack.packb(data, use_bin_type=True)
        msgpack.unpackb(packed, raw=False)
    results["msgpack_time_ms"] = (time.perf_counter() - start) * 1000
    results["msgpack_size"] = len(msgpack.packb(data, use_bin_type=True))

    return results

# Run with representative payload
test_data = [{"id": i, "value": i * 0.1, "label": f"item-{i}"} for i in range(10000)]
metrics = benchmark_serialization(test_data)

print(f"Format    | Size (bytes) | Time (ms)")
print(f"JSON      | {metrics['json_size']:>12} | {metrics['json_time_ms']:>9.1f}")
print(f"MessagePack | {metrics['msgpack_size']:>12} | {metrics['msgpack_time_ms']:>9.1f}")
```

**Documentation:** Record benchmark results and size comparisons to validate
format selection for production use.

## Output contract

The skill produces:

1. **Format selection** — One-sentence rationale for chosen format matching use case
2. **Implementation code** — Working serialization/deserialization in requested language
3. **Benchmark comparison** — Size and timing metrics vs. alternative formats
4. **Edge case handling** — Documentation of datetime, binary, null, and large number handling

Example output structure:

```
Format selected: Protocol Buffers
Rationale: Strict schema required for gRPC API with mobile clients

Implementation: sensors.proto schema + Python generated code
Round-trip verified: ✓ (1000 test messages)
Size vs JSON: 2.3x smaller
Speed vs JSON: 4.1x faster deserialization

Edge cases handled:
- Unix epoch milliseconds for datetime (timestamp_ms field)
- Empty message batches return valid empty repeated field
- Unknown enum values default to 0 (first variant)
```

## Failure handling

- **Schema mismatch during deserialization**: Stop and report specific field/type
  mismatch. Provide the expected schema and the actual received structure.
- **Custom type not serializable**: Implement encoder/decoder hooks for datetime,
  bytes, Decimal, or UUID types. Document the encoding strategy (ISO 8601 for dates,
  base64 for binary).
- **protoc compiler unavailable**: Use pure-Python protobuf libraries (`betterproto`,
  `protobuf` with runtime reflection) or pre-generated code checked into version control.
- **MessagePack library unavailable in target language**: Use JSON with gzip
  compression as an alternative wire format; document the size/speed trade-off.
- **PyArrow/Parquet not available**: Use pandas `to_parquet` with `fastparquet`
  engine, or export to compressed CSV with documented column schema.
- **Floating-point precision loss in JSON**: Use string encoding for financial
  decimals or switch to Protocol Buffers with `double` precision documentation.
- **YAML security warning on load**: Always use `yaml.safe_load()` instead of
  `yaml.load()` to prevent arbitrary code execution from `!!python/object` tags.

## Validation checklist

Before completing, verify:

- [ ] Format choice documented with one-sentence rationale matching primary use case
- [ ] Round-trip serialization tested with actual data (all fields preserved)
- [ ] Datetime types encoded/decoded correctly (ISO 8601 or Unix epoch)
- [ ] Binary data handled (base64 for JSON, raw bytes for binary formats)
- [ ] Null/None values serialize without errors
- [ ] Empty collections (arrays, objects) handled gracefully
- [ ] Unicode strings round-trip correctly
- [ ] Large numbers (>2^53 for JSON) use string encoding or binary format
- [ ] Performance benchmarked with representative payload size
- [ ] Error handling tested with malformed input (graceful failure, clear message)
- [ ] Schema documented (JSON Schema, .proto file, or column definitions)

## Next steps

- Schema design and versioning → `design-serialization-schema`
- Database-specific data handling → `database-access`
- API design with format selection → `design-rest-api` or `design-graphql-api`
- Compression optimization → `optimize-data-transfer`
- Pharmaceutical serialization (different domain) → `implement-pharma-serialisation`

## References

- Protocol Buffers Language Guide: https://protobuf.dev/programming-guides/proto3/
- MessagePack specification: https://msgpack.org/
- Apache Arrow/Parquet docs: https://arrow.apache.org/docs/python/parquet.html
- JSON Schema: https://json-schema.org/
