# Tools, Plugins, and MCP

Use the layers this way:

- `.opencode/commands/` for human entrypoints such as `/kickoff` and `/resume`
- `.opencode/tools/` for structured repo operations agents can call directly
- `.opencode/plugins/` for enforcement, guardrails, and session automation
- `mcp` in `opencode.jsonc` for external services and richer integrations

Do not use slash commands as the internal autonomous workflow.
