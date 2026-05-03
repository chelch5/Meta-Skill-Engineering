---
name: flowstudio-power-automate-mcp
description: Operate Microsoft Power Automate cloud flows through a FlowStudio MCP server. Use for listing flows, reading flow definitions, checking run history, inspecting action outputs, resubmitting failed runs, canceling running flows, managing connections, retrieving trigger URLs, and monitoring flow health. Requires FlowStudio MCP subscription or compatible server (https://mcp.flowstudio.app).
---

# Power Automate via FlowStudio MCP

Operate Microsoft Power Automate cloud flows programmatically through a FlowStudio MCP server without browser automation or UI interaction.

**Prerequisites:**
- FlowStudio MCP subscription or compatible Power Automate MCP server
- MCP endpoint: `https://mcp.flowstudio.app/mcp`
- API key / JWT token (`x-api-key` header — NOT Bearer format)
- Power Platform environment name (e.g., `Default-<tenant-guid>`)

## Purpose

Enable AI agents to interact with Power Automate cloud flows through standardized MCP tooling. Supports flow discovery, monitoring, debugging, and operational control without manual portal navigation.

## When to use

- **Flow discovery:** List flows, environments, or connections in a Power Platform tenant
- **Flow inspection:** Read flow definitions, inspect action configurations, or retrieve trigger URLs
- **Run monitoring:** Check run history, view run status, or get aggregated flow statistics
- **Debugging:** Inspect action outputs, retrieve error details, trace failed actions
- **Run control:** Resubmit failed runs or cancel currently running executions
- **HTTP trigger operations:** Get HTTP schemas, trigger flows programmatically, view response definitions
- **Environment management:** Discover environments, list makers/developers, view connection health

## When NOT to use

- **Building new flows from scratch** — use the `power-automate-build` skill instead
- **Complex debugging requiring root cause analysis** — use the `power-automate-debug` skill for end-to-end failure diagnosis
- **Desktop flows (RPA)** — this skill operates on cloud flows only
- **Power Apps or Power BI operations** — limited to canvas app listing via store tools only
- **Non-MCP Power Automate access** — requires FlowStudio MCP subscription or compatible MCP server

---

## Source of Truth

| Priority | Source | Covers |
|----------|--------|--------|
| 1 | **Real API response** | Always trust what the server actually returns |
| 2 | **`tools/list`** | Tool names, parameter names, types, required flags |
| 3 | **SKILL docs & reference files** | Response shapes, behavioral notes, workflow recipes |

> **Start every new session with `tools/list`.**
> It returns the authoritative, up-to-date schema for every tool — parameter names,
> types, and required flags. The SKILL docs cover what `tools/list` cannot tell you:
> response shapes, non-obvious behaviors, and end-to-end workflow patterns.
>
> If any documentation disagrees with `tools/list` or a real API response,
> the API wins.

---

## Procedure

Follow these steps to interact with Power Automate via FlowStudio MCP:

### Step 1 — Initialize Connection and Discover Tools

Start every session by confirming server reachability and discovering available tools. This returns authoritative, up-to-date schemas for all tool parameters.

**Recommended approach:** Use Python with `urllib.request` (stdlib, no installation required) or Node.js 18+ with native `fetch`. Both provide clean JSON handling without additional dependencies.

| Language | Suitability | Reason |
|---|---|---|
| **Python** | ✅ Preferred | All examples use this; clean JSON handling |
| **Node.js ≥ 18** | ✅ Valid | Native `fetch` and async/await pattern fits MCP well |
| PowerShell | ⚠️ Avoid for operations | `ConvertTo-Json -Depth` truncates nested definitions |
| cURL / Bash | ⚠️ Fragile | Shell-escaping JSON is error-prone |

**Discover tools:**

```python
import json, urllib.request

TOKEN = "<YOUR_JWT_TOKEN>"
MCP   = "https://mcp.flowstudio.app/mcp"

def mcp_raw(method, params=None, cid=1):
    payload = {"jsonrpc": "2.0", "method": method, "id": cid}
    if params:
        payload["params"] = params
    req = urllib.request.Request(MCP, data=json.dumps(payload).encode(),
        headers={"x-api-key": TOKEN, "Content-Type": "application/json",
                 "User-Agent": "FlowStudio-MCP/1.0"})
    try:
        resp = urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"MCP HTTP {e.code} — check token and endpoint") from e
    return json.loads(resp.read())

raw = mcp_raw("tools/list")
if "error" in raw:
    print("ERROR:", raw["error"]); raise SystemExit(1)
for t in raw["result"]["tools"]:
    print(t["name"], "—", t["description"][:60])
```

**Validation:** Confirm `raw["result"]["tools"]` contains expected tools like `list_live_flows`, `get_live_flow`, `get_live_flow_runs`. If empty or missing, verify token validity and endpoint URL.

### Step 2 — Initialize MCP Helper

Use one of these helpers for all subsequent tool calls. Both handle JSON-RPC framing, authentication, response parsing, and error handling.

**Python helper:**

```python
import json, urllib.request

TOKEN = "<YOUR_JWT_TOKEN>"
MCP   = "https://mcp.flowstudio.app/mcp"

def mcp(tool, args, cid=1):
    payload = {"jsonrpc": "2.0", "method": "tools/call", "id": cid,
               "params": {"name": tool, "arguments": args}}
    req = urllib.request.Request(MCP, data=json.dumps(payload).encode(),
        headers={"x-api-key": TOKEN, "Content-Type": "application/json",
                 "User-Agent": "FlowStudio-MCP/1.0"})
    try:
        resp = urllib.request.urlopen(req, timeout=120)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"MCP HTTP {e.code}: {body[:200]}") from e
    raw = json.loads(resp.read())
    if "error" in raw:
        raise RuntimeError(f"MCP error: {json.dumps(raw['error'])}")
    text = raw["result"]["content"][0]["text"]
    return json.loads(text)
```

**Node.js helper (18+):**

```js
const TOKEN = "<YOUR_JWT_TOKEN>";
const MCP   = "https://mcp.flowstudio.app/mcp";

async function mcp(tool, args, cid = 1) {
  const payload = {
    jsonrpc: "2.0",
    method: "tools/call",
    id: cid,
    params: { name: tool, arguments: args },
  };
  const res = await fetch(MCP, {
    method: "POST",
    headers: {
      "x-api-key": TOKEN,
      "Content-Type": "application/json",
      "User-Agent": "FlowStudio-MCP/1.0",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MCP HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const raw = await res.json();
  if (raw.error) throw new Error(`MCP error: ${JSON.stringify(raw.error)}`);
  return JSON.parse(raw.result.content[0].text);
}
```

**Validation:** Test with `mcp("tools/list", {})` to confirm helper functions correctly and returns tool catalog.

### Step 3 — List Flows and Discover Environment

```python
ENV = "Default-<tenant-guid>"

result = mcp("list_live_flows", {"environmentName": ENV})
# Returns wrapper object:
# {"mode": "owner", "flows": [{"id": "0757041a-...", "displayName": "My Flow",
#   "state": "Started", "triggerType": "Request", ...}], "totalCount": 42, "error": null}
for f in result["flows"]:
    FLOW_ID = f["id"]   # plain UUID — use directly as flowName
    print(FLOW_ID, "|", f["displayName"], "|", f["state"])
```

**Environment discovery (if environment name unknown):**

```python
envs = mcp("list_live_environments", {})
ENV = envs[0]["id"]  # Use first environment or select by displayName
```

**Validation:** Confirm `result["flows"]` is non-empty and contains expected flow structure with `id`, `displayName`, and `state` fields.

### Step 4 — Read Flow Definition

```python
FLOW = "<flow-uuid>"

flow = mcp("get_live_flow", {"environmentName": ENV, "flowName": FLOW})

# Display name and state
print(flow["properties"]["displayName"])
print(flow["properties"]["state"])

# List all action names
actions = flow["properties"]["definition"]["actions"]
print("Actions:", list(actions.keys()))

# Inspect one action's expression
print(actions["Compose_Filter"]["inputs"])
```

**Validation:** Confirm `flow["properties"]["definition"]` exists and contains `actions` dictionary. Check `flow["properties"]["state"]` is "Started" or "Stopped".

### Step 5 — Check Run History

```python
# Most recent runs (newest first)
runs = mcp("get_live_flow_runs", {"environmentName": ENV, "flowName": FLOW, "top": 5})
# Returns direct array:
# [{"name": "08584296068667933411438594643CU15",
#   "status": "Failed",
#   "startTime": "2026-02-25T06:13:38.6910688Z",
#   "endTime": "2026-02-25T06:15:24.1995008Z",
#   "triggerName": "manual",
#   "error": {"code": "ActionFailed", "message": "An action failed..."}},
#  {"name": "08584296028664130474944675379CU26",
#   "status": "Succeeded", "error": null, ...}]

for r in runs:
    print(r["name"], r["status"])

# Get the name of the first failed run
run_id = next((r["name"] for r in runs if r["status"] == "Failed"), None)
```

**Validation:** Confirm `runs` is a list with run objects containing `name`, `status`, `startTime`. Verify status values are one of: "Succeeded", "Failed", "Running", "Cancelled".

### Step 6 — Inspect Action Output or Error Details

**Option A — Inspect specific action output:**

```python
run_id = runs[0]["name"]

out = mcp("get_live_flow_run_action_outputs", {
    "environmentName": ENV,
    "flowName": FLOW,
    "runName": run_id,
    "actionName": "Get_Customer_Record"   # exact action name from the definition
})
print(json.dumps(out, indent=2))
```

**Option B — Get structured error breakdown:**

```python
err = mcp("get_live_flow_run_error", {
    "environmentName": ENV,
    "flowName": FLOW,
    "runName": run_id
})
# Returns:
# {"runName": "08584296068...",
#  "failedActions": [
#    {"actionName": "HTTP_find_AD_User_by_Name", "status": "Failed",
#     "code": "NotSpecified", "startTime": "...", "endTime": "..."},
#    {"actionName": "Scope_prepare_workers", "status": "Failed",
#     "error": {"code": "ActionFailed", "message": "An action failed..."}}
#  ],
#  "allActions": [...]}

# The ROOT cause is usually the deepest entry in failedActions:
root = err["failedActions"][-1]
print(f"Root failure: {root['actionName']} → {root['code']}")
```

**Validation:** For action outputs, confirm response is array with `actionName`, `status`, `inputs`, `outputs` fields. For errors, confirm `failedActions` array exists and is ordered outer-to-inner (root cause at last index).

### Step 7 — Resubmit or Cancel Runs (as needed)

**Resubmit a failed run:**

```python
result = mcp("resubmit_live_flow_run", {
    "environmentName": ENV,
    "flowName": FLOW,
    "runName": run_id
})
print(result)   # {"resubmitted": true, "triggerName": "..."}
```

**Cancel a running run:**

```python
mcp("cancel_live_flow_run", {
    "environmentName": ENV,
    "flowName": FLOW,
    "runName": run_id
})
```

**Validation:** For resubmit, confirm `result["resubmitted"]` is `true`. For cancel, verify the run status changes to "Cancelled" in subsequent run history queries.

> **Warning:** Do NOT cancel a run showing `Running` status when waiting for an adaptive card response. This status is normal while a Teams card awaits user input; canceling discards the pending card.

---

## Output Contract

Every MCP tool call returns a JSON response conforming to one of these patterns:

| Tool Pattern | Response Structure | Key Validation Fields |
|---|---|---|
| **List flows** | Wrapper with `flows` array | `result["flows"]`, `result["totalCount"]` |
| **Get flow** | Object with `properties` | `properties["displayName"]`, `properties["state"]`, `properties["definition"]` |
| **List runs** | Direct array | Array elements with `name`, `status`, `startTime`, `endTime` |
| **Run error** | Object with `failedActions` | `failedActions` ordered outer-to-inner, `allActions` status map |
| **Action outputs** | Array of action detail objects | `actionName`, `status`, `inputs`, `outputs` per element |
| **Resubmit/Cancel** | Object with operation result | `resubmitted` boolean or verify via subsequent run query |
| **Update flow** | Object with `error` key | `error` is `null` on success, object on failure |

**Response Parsing Rule:** All responses require parsing `result["content"][0]["text"]` as JSON, then inspecting the inner data structure.

**Success Indicators:**
- HTTP 200 from MCP server
- No `error` key in outer JSON-RPC response
- For `update_live_flow`: `error` field in parsed body is `null`
- For `resubmit_live_flow_run`: `resubmitted` field is `true`

---

## Failure Handling

### Common Error Patterns and Resolution

| Error | Cause | Resolution |
|---|---|---|
| HTTP 401/403 | Missing, expired, or malformed JWT token | Obtain fresh token from https://mcp.flowstudio.app |
| HTTP 400 | Malformed JSON-RPC payload | Verify `Content-Type: application/json`, proper JSON structure, required fields present |
| MCP error -32602 | Missing or invalid tool arguments | Check `tools/list` for required parameters; verify `environmentName`, `flowName` formats |
| `MissingEnvironmentFilter` | `environmentName` omitted from tool requiring it | Pass `environmentName` to all tools except global discovery tools |
| `ConnectionAuthorizationFailed` (403) | Connection reference owned by different user | Use connection belonging to the token's account; copy from user's existing flow |
| `only HTTP Request triggers can be invoked` | Attempted `trigger_live_flow` on non-HTTP trigger | Verify trigger type via `get_live_flow`; use `get_live_flow_trigger_url` + direct HTTP POST instead |
| `FlowNotFound` | Flow ID does not exist in environment | Verify flow ID via `list_live_flows`; check correct environment |
| `RunNotFound` | Run ID does not exist for flow | Verify run ID via `get_live_flow_runs`; runs expire after retention period |
| 50 MB+ response timeout | Large action outputs exceeding timeout | Increase timeout to 120s+ for `get_live_flow_run_action_outputs` |

### Diagnostic Procedure for Failures

1. **Verify connectivity:** Call `tools/list` to confirm token and endpoint validity
2. **Check environment:** Ensure `environmentName` matches value from `list_live_environments`
3. **Validate flow ID:** Confirm flow exists via `list_live_flows`
4. **Inspect error structure:** For tool errors, parse `raw["error"]` for code and message
5. **Check run status:** Failed runs retain history; cancelled runs may disappear quickly
6. **Review connection references:** For update failures, verify connection ownership and GUIDs

### Safety Constraints

- Never cancel runs waiting for adaptive card responses
- Always verify `error` is `null` (not just missing) after `update_live_flow`
- Use 120s+ timeout for action output inspection on flows with bulk data operations
- Connection references are user-scoped; sharing flows requires connection remapping

---

## Tool Catalog Reference

### Live Tools (Available to All MCP Subscribers)

| Tool | Purpose |
|---|---|
| `list_live_flows` | List flows from PA API (wrapper with `flows` array) |
| `list_live_environments` | List environments (direct array) |
| `list_live_connections` | List connections (wrapper with `connections` array) |
| `get_live_flow` | Fetch complete flow definition |
| `get_live_flow_http_schema` | Inspect HTTP trigger request/response schemas |
| `get_live_flow_trigger_url` | Get HTTP trigger callback URL |
| `trigger_live_flow` | POST to HTTP-triggered flow |
| `update_live_flow` | Create new flow or patch existing |
| `add_live_flow_to_solution` | Migrate non-solution flow to solution |
| `get_live_flow_runs` | List run history (direct array) |
| `get_live_flow_run_error` | Get per-action error breakdown |
| `get_live_flow_run_action_outputs` | Inspect action inputs/outputs |
| `resubmit_live_flow_run` | Re-run failed execution |
| `cancel_live_flow_run` | Cancel running execution |

### Store Tools (FlowStudio for Teams Subscribers Only)

| Tool | Purpose |
|---|---|
| `list_store_flows` | Cached flow search with governance metadata |
| `get_store_flow` | Cached flow details with run stats |
| `get_store_flow_runs` | Cached run history with remediation hints |
| `get_store_flow_errors` | Cached failed runs with hints |
| `get_store_flow_summary` | Aggregated statistics |
| `set_store_flow_state` | Start/stop flow via API + cache sync |
| `update_store_flow` | Update governance metadata |
| `list_store_environments` | Cached environment list |
| `list_store_makers` | List citizen developers |
| `get_store_maker` | Maker details |
| `list_store_power_apps` | List canvas apps |
| `list_store_connections` | Cached connections |

---

## Next Steps

- **Diagnose failing flows end-to-end** → Load `power-automate-debug` skill
- **Build and deploy new flows** → Load `power-automate-build` skill
- **Understand action types** → See `references/action-types.md`
- **Connection reference patterns** → See `references/connection-references.md`
- **Response shape details** → See `references/tool-reference.md`
- **Authentication and protocol** → See `references/MCP-BOOTSTRAP.md`

---

## References

- [MCP-BOOTSTRAP.md](references/MCP-BOOTSTRAP.md) — Endpoint, authentication, request/response format
- [tool-reference.md](references/tool-reference.md) — Response shapes and behavioral notes
- [action-types.md](references/action-types.md) — Power Automate action type patterns
- [connection-references.md](references/connection-references.md) — Connector reference patterns
