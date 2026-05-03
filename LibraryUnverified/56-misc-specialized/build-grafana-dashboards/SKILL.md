---
name: build-grafana-dashboards
description: >
  Create Grafana dashboards as code with template variables, reusable panels, and provisioning configuration.
  Triggers on: "grafana dashboard", "provision grafana", "dashboard as code", "grafana json",
  "template variable grafana", "grafana panel", "grafana provisioning", "observability dashboard".
  Use for version-controlled dashboard deployment and operational visualization.
  Do NOT use for general data visualization, BI reporting, or non-Grafana tools.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: observability
  complexity: intermediate
  language: multi
  tags: grafana, dashboards, visualization, panels, provisioning
---

# Build Grafana Dashboards

Design and deploy Grafana dashboards with best practices for maintainability, reusability, and version control.

## Purpose

Enable version-controlled, reusable Grafana dashboard creation that supports operational monitoring,
SRE workflows, and SLO compliance reporting through infrastructure-as-code practices.

## When to Use

- Creating visual representations of Prometheus, Loki, or other data source metrics
- Building operational dashboards for SRE teams and incident responders
- Establishing executive-level reporting dashboards for SLO compliance
- Migrating dashboards from manual creation to version-controlled provisioning
- Standardizing dashboard layouts across teams with template variables
- Creating drill-down experiences from high-level overviews to detailed metrics
- Implementing dashboards that require multi-environment or multi-service views

## When NOT to Use

- General data visualization or business intelligence reporting (use dedicated BI tools like Tableau, Power BI)
- Ad-hoc exploratory data analysis without intent to deploy
- Non-Grafana visualization needs (Kibana, Datadog native dashboards, New Relic dashboards)
- Simple one-off dashboards that do not require version control or templating
- Dashboards with no operational or monitoring purpose
- Cases where the data source is not yet configured or accessible

## Inputs

- **Required**: Data source configuration (Prometheus, Loki, Tempo, etc.)
- **Required**: Metrics or logs to visualize with their query patterns
- **Optional**: Template variables for multi-service or multi-environment views
- **Optional**: Existing dashboard JSON for migration or modification
- **Optional**: Annotation queries for event correlation (deployments, incidents)

## Procedure

### Step 1: Design Dashboard Structure

Plan dashboard layout and organization before building panels.

Create a dashboard specification document:

```markdown
# Service Overview Dashboard

## Purpose
Real-time operational view for on-call engineers monitoring the API service.

## Rows
1. High-Level Metrics (collapsed by default)
   - Request rate, error rate, latency (RED metrics)
   - Service uptime, instance count
2. Detailed Metrics (expanded by default)
   - Per-endpoint latency breakdown
   - Error rate by status code
   - Database connection pool status
3. Resource Utilization
   - CPU, memory, disk usage per instance
   - Network I/O rates
4. Logs (collapsed by default)
   - Recent errors from Loki
   - Alert firing history

## Variables
- `environment`: production, staging, development
- `instance`: all instances or specific instance selection
- `interval`: aggregation window (5m, 15m, 1h)

## Annotations
- Deployment events from CI/CD system
- Alert firing/resolving events
```

Key design principles:
- **Most important metrics first**: Critical metrics at the top, details below
- **Consistent time ranges**: Synchronize time across all panels
- **Drill-down paths**: Link from high-level to detailed dashboards
- **Responsive layout**: Use rows and panel widths that work on various screens

**Expected:** Clear dashboard structure documented, stakeholders aligned on metrics and layout priorities.

**On failure:**
- Conduct dashboard design review with end users (SREs, developers)
- Benchmark against industry standards (USE method, RED method, Four Golden Signals)
- Review existing dashboards in team for consistency patterns

### Step 2: Create Dashboard with Template Variables

Build the dashboard foundation with reusable variables for filtering.

Create dashboard JSON structure (or use UI, then export):

```json
{
  "dashboard": {
    "title": "API Service Overview",
    "uid": "api-service-overview",
    "version": 1,
    "timezone": "browser",
    "editable": true,
    "graphTooltip": 1,
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "refresh": "30s",
    "templating": {
      "list": [
        {
          "name": "environment",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(up{job=\"api-service\"}, environment)",
          "multi": false,
          "includeAll": false,
          "refresh": 1,
          "sort": 1,
          "current": {
            "selected": false,
            "text": "production",
            "value": "production"
          }
        },
        {
          "name": "instance",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(up{job=\"api-service\",environment=\"$environment\"}, instance)",
          "multi": true,
          "includeAll": true,
          "refresh": 1,
          "allValue": ".*",
          "current": {
            "selected": true,
            "text": "All",
            "value": "$__all"
          }
        },
        {
          "name": "interval",
          "type": "interval",
          "options": [
            {"text": "1m", "value": "1m"},
            {"text": "5m", "value": "5m"},
            {"text": "15m", "value": "15m"},
            {"text": "1h", "value": "1h"}
          ],
          "current": {
            "text": "5m",
            "value": "5m"
          },
          "auto": false
        }
      ]
    },
    "annotations": {
      "list": [
        {
          "name": "Deployments",
          "datasource": "Prometheus",
          "enable": true,
          "expr": "changes(app_version{job=\"api-service\",environment=\"$environment\"}[5m]) > 0",
          "step": "60s",
          "iconColor": "rgba(0, 211, 255, 1)",
          "tagKeys": "version"
        }
      ]
    }
  }
}
```

Variable types and use cases:
- **Query variables**: Dynamic lists from data source (`label_values()`, `query_result()`)
- **Interval variables**: Aggregation windows for queries
- **Custom variables**: Static lists for non-metric selections
- **Constant variables**: Shared values across panels (data source names, thresholds)
- **Text box variables**: Free-form input for filtering

**Expected:** Variables populate correctly from data source, cascading filters work (environment filters instances), default selections appropriate.

**On failure:**
- Test variable queries independently in Prometheus UI
- Check for circular dependencies (variable A depends on B depends on A)
- Verify regex patterns in `allValue` field for multi-select variables
- Review variable refresh settings (on dashboard load vs on time range change)

### Step 3: Build Visualization Panels

Create panels for each metric with appropriate visualization types.

**Time series panel** (request rate):

```json
{
  "type": "timeseries",
  "title": "Request Rate",
  "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
  "targets": [
    {
      "expr": "sum(rate(http_requests_total{job=\"api-service\",environment=\"$environment\",instance=~\"$instance\"}[$interval])) by (method)",
      "legendFormat": "{{method}}",
      "refId": "A"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "reqps",
      "color": {
        "mode": "palette-classic"
      },
      "custom": {
        "drawStyle": "line",
        "lineInterpolation": "smooth",
        "fillOpacity": 10,
        "spanNulls": true
      },
      "thresholds": {
        "mode": "absolute",
        "steps": [
          {"value": null, "color": "green"},
          {"value": 1000, "color": "yellow"},
          {"value": 5000, "color": "red"}
        ]
      }
    }
  },
  "options": {
    "tooltip": {
      "mode": "multi",
      "sort": "desc"
    },
    "legend": {
      "displayMode": "table",
      "placement": "right",
      "calcs": ["mean", "max", "last"]
    }
  }
}
```

**Stat panel** (error rate):

```json
{
  "type": "stat",
  "title": "Error Rate",
  "gridPos": {"h": 4, "w": 6, "x": 12, "y": 0},
  "targets": [
    {
      "expr": "sum(rate(http_requests_total{job=\"api-service\",environment=\"$environment\",status=~\"5..\"}[$interval])) / sum(rate(http_requests_total{job=\"api-service\",environment=\"$environment\"}[$interval])) * 100",
      "refId": "A"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "percent",
      "decimals": 2,
      "thresholds": {
        "mode": "absolute",
        "steps": [
          {"value": null, "color": "green"},
          {"value": 0.1, "color": "yellow"},
          {"value": 1, "color": "red"}
        ]
      }
    }
  },
  "options": {
    "reduceOptions": {
      "values": false,
      "calcs": ["lastNotNull"]
    },
    "orientation": "auto",
    "textMode": "value_and_name",
    "colorMode": "background",
    "graphMode": "area"
  }
}
```

**Heatmap panel** (latency distribution):

```json
{
  "type": "heatmap",
  "title": "Request Duration Heatmap",
  "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
  "targets": [
    {
      "expr": "sum(rate(http_request_duration_seconds_bucket{job=\"api-service\",environment=\"$environment\",instance=~\"$instance\"}[$interval])) by (le)",
      "format": "heatmap",
      "legendFormat": "{{le}}",
      "refId": "A"
    }
  ],
  "options": {
    "calculate": true,
    "calculation": {
      "xBuckets": {
        "mode": "size",
        "value": "1m"
      }
    },
    "color": {
      "mode": "scheme",
      "scheme": "Spectral"
    },
    "cellGap": 2,
    "yAxis": {
      "unit": "s",
      "decimals": 2
    }
  }
}
```

Panel selection guide:
- **Time series**: Trends over time (rates, counts, durations)
- **Stat**: Single current value with threshold coloring
- **Gauge**: Percentage values (CPU, memory, disk usage)
- **Bar gauge**: Comparing multiple values at a point in time
- **Heatmap**: Distribution of values over time (latency percentiles)
- **Table**: Detailed breakdown of multiple metrics
- **Logs**: Raw log lines from Loki with filtering

**Expected:** Panels render correctly with data, visualizations match intended metric types, legends descriptive, thresholds highlight problems.

**On failure:**
- Test queries in Explore view with same time range and variables
- Check for metric name typos or incorrect label filters
- Verify aggregation functions match metric type (rate for counters, avg for gauges)
- Review unit configurations (bytes, seconds, requests per second)
- Enable "Show query inspector" to debug empty results

### Step 4: Configure Rows and Layout

Organize panels into collapsible rows for logical grouping.

```json
{
  "panels": [
    {
      "type": "row",
      "title": "High-Level Metrics",
      "collapsed": false,
      "gridPos": {"h": 1, "w": 24, "x": 0, "y": 0},
      "panels": [
        {
          "type": "stat",
          "title": "Request Rate",
          "gridPos": {"h": 4, "w": 6, "x": 0, "y": 1},
          "targets": []
        },
        {
          "type": "stat",
          "title": "Error Rate",
          "gridPos": {"h": 4, "w": 6, "x": 6, "y": 1},
          "targets": []
        }
      ]
    },
    {
      "type": "row",
      "title": "Detailed Metrics",
      "collapsed": true,
      "gridPos": {"h": 1, "w": 24, "x": 0, "y": 5},
      "panels": [
        {
          "type": "timeseries",
          "title": "Latency by Endpoint",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 6},
          "targets": []
        }
      ]
    }
  ]
}
```

Layout best practices:
- Grid is 24 units wide, each panel specifies `w` (width) and `h` (height)
- Use rows to group related panels, collapse less critical sections by default
- Place most critical metrics in first visible area (y=0-8)
- Maintain consistent panel heights within rows (typically 4, 8, or 12 units)
- Use full width (24) for time series, half width (12) for comparisons

**Expected:** Dashboard layout organized logically, rows collapse/expand correctly, panels align visually without gaps.

**On failure:**
- Validate gridPos coordinates don't overlap
- Check that row panels array contains panels (not null)
- Verify y-coordinates increment logically down the page
- Use Grafana UI "Edit JSON" to inspect grid positions

### Step 5: Add Links and Drill-Downs

Create navigation paths between related dashboards.

Dashboard-level links in JSON:

```json
{
  "links": [
    {
      "title": "Service Details",
      "type": "link",
      "icon": "external link",
      "url": "/d/service-details?var-service=$service&var-environment=$environment&$__url_time_range",
      "tooltip": "Detailed metrics for selected service",
      "targetBlank": false
    },
    {
      "title": "Database Dashboard",
      "type": "dashboards",
      "tags": ["database"],
      "icon": "dashboard",
      "tooltip": "All database-related dashboards",
      "asDropdown": true,
      "includeVars": true,
      "keepTime": true
    }
  ]
}
```

Panel-level data links:

```json
{
  "fieldConfig": {
    "defaults": {
      "links": [
        {
          "title": "View Logs for ${__field.labels.instance}",
          "url": "/explore?left={\"datasource\":\"Loki\",\"queries\":[{\"refId\":\"A\",\"expr\":\"{instance=\\\"${__field.labels.instance}\\\"}\"}],\"range\":{\"from\":\"${__from}\",\"to\":\"${__to}\"}}",
          "targetBlank": true
        },
        {
          "title": "View Traces",
          "url": "/explore?left={\"datasource\":\"Tempo\",\"queries\":[{\"refId\":\"A\",\"query\":\"${__field.labels.trace_id}\"}]}"
        }
      ]
    }
  }
}
```

Link variables:
- `$service`, `$environment`: Dashboard template variables
- `${__field.labels.instance}`: Label value from clicked data point
- `${__from}`, `${__to}`: Current dashboard time range
- `$__url_time_range`: Encoded time range for URL

**Expected:** Clicking panel elements or dashboard links navigates to related views with context preserved (time range, variables).

**On failure:**
- URL encode special characters in query parameters
- Test links with various variable selections (All vs specific value)
- Verify target dashboard UIDs exist and are accessible
- Check that `includeVars` and `keepTime` flags work as expected

### Step 6: Set Up Dashboard Provisioning

Version control dashboards as code for reproducible deployments.

Create provisioning directory structure:

```bash
mkdir -p /etc/grafana/provisioning/{dashboards,datasources}
```

Datasource provisioning (`/etc/grafana/provisioning/datasources/prometheus.yml`):

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    jsonData:
      timeInterval: "15s"
      queryTimeout: "60s"
      httpMethod: POST
    editable: false

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    jsonData:
      maxLines: 1000
    editable: false
```

Dashboard provisioning (`/etc/grafana/provisioning/dashboards/default.yml`):

```yaml
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: 'Services'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: true
```

Store dashboard JSON files in `/var/lib/grafana/dashboards/`:

```
/var/lib/grafana/dashboards/
├── api-service/
│   ├── overview.json
│   └── details.json
├── database/
│   └── postgres.json
└── infrastructure/
    ├── nodes.json
    └── kubernetes.json
```

Using Docker Compose:

```yaml
version: '3.8'
services:
  grafana:
    image: grafana/grafana:10.2.0
    ports:
      - "3000:3000"
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
```

**Expected:** Dashboards automatically loaded on Grafana startup, changes to JSON files reflected after update interval, version control tracks dashboard changes.

**On failure:**
- Check Grafana logs: `docker logs grafana | grep -i provisioning`
- Verify JSON syntax: `python -m json.tool dashboard.json`
- Ensure file permissions allow Grafana to read: `chmod 644 *.json`
- Test with `allowUiUpdates: false` to prevent UI modifications
- Validate provisioning config: `curl http://localhost:3000/api/admin/provisioning/dashboards/reload -X POST -H "Authorization: Bearer $GRAFANA_API_KEY"`

## Output Contract

A successfully completed Grafana dashboard deliverable must meet these criteria:

### Functional Requirements
- [ ] Dashboard loads without errors in Grafana UI
- [ ] All template variables populate with expected values from data source
- [ ] Variable cascading works correctly (selecting environment filters instances)
- [ ] All panels display data for configured time ranges
- [ ] Panel queries use template variables (no hardcoded environment or instance values)
- [ ] Thresholds highlight problem states appropriately (green/yellow/red progression)

### Visual Requirements
- [ ] Legend formatting is descriptive and not cluttered (uses legendFormat)
- [ ] Annotations appear for relevant events (deployments, alerts)
- [ ] Links navigate to correct dashboards with context preserved (time range, variables)
- [ ] Responsive layout works on different screen sizes
- [ ] Tooltip and hover interactions provide useful context

### Operational Requirements
- [ ] Dashboard is provisioned from JSON file (version controlled, not manual UI creation)
- [ ] File structure follows provisioning conventions
- [ ] Datasource provisioning configuration is in place
- [ ] Update interval configured appropriately for the use case

## Failure Handling

### Variable Population Failures
- **Symptom**: Variables show "None" or empty lists
- **Action**: Test queries directly in data source (Prometheus/Loki); verify metric names and label keys exist; check variable refresh timing settings

### Empty Panel Failures
- **Symptom**: Panels show "No data" or empty charts
- **Action**: Verify time range includes data; check metric name spelling; test query in Explore view; confirm aggregation window matches scrape interval

### Layout/Rendering Failures
- **Symptom**: Panels overlap, rows don't collapse, or layout is broken
- **Action**: Validate gridPos coordinates are unique and non-overlapping; verify row panels contain valid panel arrays; check y-coordinate progression

### Link Navigation Failures
- **Symptom**: Dashboard or data links result in 404 or lose context
- **Action**: URL-encode special characters; verify target dashboard UIDs exist; test with "All" variable selection; confirm includeVars and keepTime settings

### Provisioning Failures
- **Symptom**: Dashboards not loading on Grafana startup
- **Action**: Check Grafana logs for provisioning errors; validate JSON syntax; verify file permissions; test manual reload via API; ensure provisioning config paths match volume mounts

### Performance Failures
- **Symptom**: Dashboard loads slowly or times out
- **Action**: Reduce query cardinality; add recording rules for expensive aggregations; limit time range; optimize variable queries; check data source response times

## Next Steps

After completing this skill, consider these related workflows:

- **setup-prometheus-monitoring** — Configure Prometheus data sources that feed Grafana dashboards; use when the metrics collection layer needs setup
- **configure-log-aggregation** — Set up Loki for log panel queries and log-based annotations; use when adding logs to dashboards
- **define-slo-sli-sla** — Visualize SLO compliance and error budgets with Grafana stat and gauge panels; use when building executive reporting
- **instrument-distributed-tracing** — Add trace ID links from metrics panels to Tempo trace views; use when implementing observability correlation

## References

See [references/EXAMPLES.md](references/EXAMPLES.md) for complete, production-ready configuration templates.

## Common Pitfalls

- **Variable not updating panels**: Ensure queries use `$variable` syntax, not hardcoded values. Check variable refresh settings.
- **Empty panels with correct query**: Verify time range includes data points. Check scrape interval vs aggregation window (5m rate needs >5m of data).
- **Legend too verbose**: Use `legendFormat` to show only relevant labels, not full metric name. Example: `{{method}} - {{status}}` instead of default.
- **Inconsistent time ranges**: Set dashboard time sync so all panels share the same time window. Use "Sync cursor" for correlated investigation.
- **Performance issues**: Avoid queries returning high cardinality series (>1000). Use recording rules or pre-aggregation. Limit time ranges for expensive queries.
- **Dashboard drift**: Without provisioning, manual UI changes create version control conflicts. Use `allowUiUpdates: false` in production.
- **Missing data links**: Data links require exact label names. Use `${__field.labels.labelname}` carefully, verify label exists in query result.
- **Annotation overload**: Too many annotations clutter the view. Filter annotations by importance or use separate annotation tracks.
