---
name: power-platform-mcp-connector-suite
description: 'Create or repair Power Platform custom connectors with MCP (Model Context Protocol) integration for Power Platform agent experiences. Handles connector file generation, schema validation for agent-runtime compliance, and troubleshooting MCP connectivity issues.'
---

# Power Platform MCP Connector Suite

Create or repair Power Platform custom connectors with Model Context Protocol integration for Power Platform agent experiences.

## When to use

Use this skill when:
- Building a new Power Platform custom connector that exposes MCP tools/resources to a Power Platform agent experience
- Converting an existing connector to support MCP protocol
- Troubleshooting why the agent runtime cannot discover or use connector tools
- Validating connector schemas fail Power Platform agent-runtime compliance checks (reference types, mixed types, missing protocol headers)
- Preparing a connector for Microsoft certification submission

## When NOT to use

Do NOT use this skill when:
- Building a generic API connector without MCP agent-runtime requirements
- Working with Power Automate flows or Power Apps canvas apps (no MCP integration needed)
- The connector is for internal use only without agent-runtime exposure
- You need help with the backend MCP server implementation (this skill covers the connector wrapper only)

## MCP Capabilities in Power Platform Agent Runtimes

**Currently Supported:**
- **Tools**: Functions that the LLM can call (with user approval)
- **Resources**: File-like data that agents can read (must be tool outputs)

**Not Yet Supported:**
- **Prompts**: Pre-written templates (prepare for future support)

## Procedure

### Phase 1: Determine generation mode

Based on the user's request, identify which mode applies:

| User situation | Mode |
|---------------|------|
| Starting from scratch, no existing connector | **Mode A: New Connector** |
| Has connector files, needs agent-runtime compliance fixes | **Mode B: Schema Validation** |
| Connector exists but the agent runtime cannot discover tools | **Mode C: Troubleshooting** |
| Has traditional connector, needs MCP capabilities added | **Mode D: Hybrid Migration** |
| Ready for Microsoft certification | **Mode E: Certification Prep** |

### Phase 2: Gather context

Collect these values before generating:
- **Connector Name**: Display name (e.g., "Contoso CRM MCP")
- **Server Purpose**: One-line description of what the MCP server enables
- **Tools Needed**: List of tool names with one-line descriptions each
- **Resources**: What data types will be exposed (must be tool outputs)
- **Authentication**: One of `none`, `api-key`, `oauth2`, `basic`
- **Host Environment**: Where the MCP server runs (Azure Function, Express.js, etc.)
- **Target APIs**: External APIs the connector integrates with

### Phase 3: Generate core connector files

Create these four required files in order:

**File 1: `apiDefinition.swagger.json`**
- Swagger 2.0 format with Microsoft extensions
- Include `POST /mcp` endpoint with header `x-ms-agentic-protocol: mcp-streamable-1.0`
- Define `McpResponse` and `McpErrorResponse` schemas using **primitive types only**:
  - Allowed: `string`, `number`, `integer`, `boolean`, `array`, `object`
  - Forbidden: `$ref` references, mixed types like `["string", "number"]`
- Use full URIs for all endpoints (no relative paths)
- Add clear descriptions for Power Platform agent understanding

**File 2: `apiProperties.json`**
- Connector metadata with `iconBrandColor` (hex format, e.g., `#0078D4`)
- Authentication configuration matching the selected auth type
- Policy templates for MCP request/response transformations
- Connection parameter definitions

**File 3: `script.csx`**
- JSON-RPC 2.0 message parsing and routing
- Request transformation: convert agent-runtime calls to MCP format
- Response transformation: convert MCP results to agent-runtime format
- Error handling with proper MCP error codes
- Input validation before forwarding to backend

**File 4: `readme.md`**
- Connector overview and capabilities
- Setup instructions for the MCP server backend
- Authentication configuration steps
- Tool usage examples for Power Platform agent authors

### Phase 4: Validate for Power Platform agent-runtime compliance

Run these checks on the generated files:

| Check | Validation | If failed |
|-------|-----------|-----------|
| Protocol header | `x-ms-agentic-protocol: mcp-streamable-1.0` present on `/mcp` endpoint | Add header to Swagger operation |
| No reference types | No `$ref` in any schema definition | Inline all referenced schemas manually |
| Single types only | No arrays in `type` fields | Pick dominant type, add validation logic |
| Resource location | Resources only appear as tool outputs, not standalone | Move resource schemas into tool output definitions |
| Full URIs | All `url`/`host` fields use complete URLs | Prefix with `https://` and actual domain |

### Phase 5: CLI validation (if tools available)

If the user has Power Platform CLI (`paconn`, `pac`) installed:
1. Run `paconn validate --api-def apiDefinition.swagger.json`
2. Fix any reported errors
3. Run `pac connector create` (test mode) to verify upload
4. Check `script.csx` passes automatic validation

### Phase 6: OAuth security hardening (if applicable)

If authentication type is `oauth2`:
1. Add token audience validation in `script.csx` to prevent passthrough attacks
2. Verify `securityDefinitions` in Swagger uses `accessCode` or `application` flow
3. Add state parameter validation for CSRF protection
4. Enforce HTTPS-only endpoints in production
5. Document the confused deputy prevention approach

## Output Contract

For a successful skill execution, deliver:

**Required files:**
1. `apiDefinition.swagger.json` — Swagger 2.0 with MCP endpoint and compliant schemas
2. `apiProperties.json` — Connector metadata and authentication config
3. `script.csx` — JSON-RPC 2.0 message handling and transformations
4. `readme.md` — Documentation for setup and usage

**Optional files (certification mode):**
5. `settings.json` — Product and service metadata for Microsoft certification
6. Icon files — PNG format, 230x230 or 500x500 pixels
7. `ConnectorPackageValidator.ps1` results — Validation output

**Quality gates:**
- All Power Platform agent-runtime compliance checks pass (no `$ref`, single types only, protocol header present)
- CLI validation passes without errors (if tools available)
- OAuth flows include security hardening (if applicable)
- Documentation includes at least 2 concrete tool usage examples

## Failure Handling

### If the agent runtime does not show connector tools

**Symptom**: Connector created but no tools appear in the target agent runtime
**Diagnosis**: Schema compliance issue
**Fix**:
1. Check `apiDefinition.swagger.json` for `$ref` usage — remove all references, inline the schemas
2. Check for mixed types like `{"type": ["string", "null"]}` — change to single type with validation
3. Verify `x-ms-agentic-protocol: mcp-streamable-1.0` header is present on `/mcp` endpoint
4. Ensure resources are defined only as tool outputs, not as standalone schemas

### If tools appear but fail to execute

**Symptom**: Tools visible but invocations fail
**Diagnosis**: `script.csx` transformation error
**Fix**:
1. Check JSON-RPC 2.0 format compliance in request/response handling
2. Verify error responses use proper MCP error codes (-32600 to -32603 for protocol, -32000 to -32099 for server)
3. Add logging to `script.csx` to trace request transformation

### If authentication fails

**Symptom**: Connection test fails or token rejected
**Diagnosis**: Auth configuration mismatch
**Fix**:
1. Verify `apiProperties.json` auth type matches Swagger `securityDefinitions`
2. For OAuth 2.0: check `tokenUrl` and `authorizationUrl` are HTTPS
3. Verify `script.csx` includes audience validation if using enhanced OAuth

### If certification submission rejected

**Symptom**: Microsoft certification fails
**Diagnosis**: Missing metadata or compliance gaps
**Fix**:
1. Ensure `settings.json` has complete `publisher` and `contact` sections
2. Verify icon is PNG format with correct dimensions
3. Check privacy policy URL is HTTPS and accessible
4. Run `ConnectorPackageValidator.ps1` and fix all warnings

## Next steps

- **Validate the connector**: Use `skill-evaluation` with Power Platform agent-runtime test prompts
- **Create eval suite**: Use `skill-testing-harness` if this connector needs regression testing
- **Package for distribution**: Use `skill-packaging` when ready to share the connector
- **Document provenance**: Use `skill-provenance` if this connector uses third-party schemas
- **Safety review**: Use `skill-safety-review` before publishing to a shared registry

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification)
- [Power Platform Connector Certification Guidelines](https://learn.microsoft.com/en-us/connectors/custom-connectors/certification)

## Example Usage

```yaml
Mode: New Connector
Connector Name: Customer Analytics MCP
Server Purpose: Customer data analysis and insights for sales teams
Tools Needed:
  - searchCustomers: Find customers by name, email, or company
  - getCustomerProfile: Retrieve full customer record with history
  - analyzeCustomerTrends: Generate 30/60/90 day trend analysis
Resources:
  - Customer profiles (returned as getCustomerProfile output)
  - Analysis reports (returned as analyzeCustomerTrends output)
Authentication: oauth2
Host Environment: Azure Function
Target APIs: CRM REST API v2
```
