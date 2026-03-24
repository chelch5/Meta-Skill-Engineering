---
name: opencode-team-bootstrap
description: "Design and generate a project-specific agent team with specialized agents, tools, plugins, commands, and skills tailored to the project type and stack. Use after the base scaffold exists to customize generic agent templates into project-aware specialists. Do not use before a scaffold exists (run scaffold-kickoff first) or when the project is too simple for agent specialization."
---

# OpenCode Team Bootstrap

Use this skill to design the agent team for the project. This is creative work — you analyze the project and customize the agents, tools, and plugins to match.

## Context

The `repo-scaffold-factory` generates a BASE set of generic agent templates. These are a starting structure, not the final output. Your job is to read the canonical brief and customize these agents to be project-specific.

## Procedure

### 1. Read the canonical brief

Read the project brief to understand:
- What kind of project this is (web app, API, MCP server, CLI tool, library, etc.)
- What stack/framework is being used
- What domains the project spans (UI, backend, database, infrastructure, etc.)
- What the acceptance criteria are

### 2. Plan the agent team

Decide which agents this project needs. Start from the baseline and add/modify based on project type.

**Baseline agents (always present):**

| Agent | Role | Permissions |
|-------|------|------------|
| Team Leader / Orchestrator | Visible orchestrator, delegates to specialists | Read + delegate |
| Planner | Turns tickets into implementation plans | Read only |
| Plan Reviewer | Approves/rejects plans before implementation | Read only |
| Implementer (1+) | Implements the approved plan | Read + write + execute |
| Code Reviewer | Reviews for correctness and regressions | Read only |
| Security Reviewer | Reviews for trust boundaries and secrets | Read only |
| QA / Tester | Validates and checks closeout readiness | Read only |
| Docs / Handoff | Closeout artifact synchronization | Read + write |

**Project-specific agents (add based on project type):**

| Project Type | Additional Agents |
|-------------|------------------|
| UI / Frontend | Component implementer, accessibility reviewer |
| API | API implementer with schema awareness, contract validator |
| MCP Server | Protocol implementer, tool definition specialist |
| Database-heavy | Migration specialist, schema reviewer |
| CLI / Library | API surface reviewer, documentation specialist |
| Full-stack | Separate frontend + backend + infra implementers |

You may create MULTIPLE implementer-type agents for different domains. Default to one visible team leader with explicit safe parallel lanes. Only add a hierarchy when the project has strong non-overlapping domains.

**Utility agents (include based on need):**
- Repo evidence gathering, GitHub research, read-only shell inspection
- Evidence compression, ticket/state consistency, external research

Omit utility agents that aren't useful for the project.

### 3. Customize agent prompts

For EVERY agent, rewrite the generic prompt to be project-specific:

**What to customize:**
- **Description**: mention the actual project and what the agent does for it
- **First instruction**: state the agent's role in the context of THIS project
- **Tool permissions**: adjust based on what the agent actually needs
- **Skill references**: reference project-specific skills
- **Delegation targets**: reference the actual agents that exist

**What NOT to change:**
- Model assignments (use provided model strings)
- Hidden/visible settings (only the orchestrator should be visible)
- The fundamental stage-gate workflow (planning → review → implement → review → QA → handoff)

**Example customization for a React web app:**

Generic: "You produce decision-complete plans for a single ticket."

Customized: "You produce decision-complete plans for a single ticket in the Example App React frontend. Plans must specify which components are affected, what state management changes are needed, and what test scenarios to cover."

### 4. Write agent files

Write each agent definition to the appropriate config directory. Verify:
- Every agent has description, model, permissions
- Tool permissions are explicit (deny by default, allow specifically)
- Skill references point to skills that exist
- Delegation targets reference agents that exist
- Read-only agents have NO write permissions
- Only implementer and docs agents have write access

### 5. Review project-specific tools

Keep standard workflow tools (artifact write, ticket lookup, ticket update, workflow state, etc.). Consider adding project-specific tools only when genuinely needed:
- Database projects might need a migration status tool
- API projects might need a schema validation tool
- Component projects might need a component scaffolding tool

### 6. Review plugins and commands

Keep standard enforcement plugins (stage-gate enforcer, tool guard, invocation tracker). Customize commands (kickoff, resume) to reference project-specific agents and skills.

## Team design principles

- One visible orchestrator, all specialists hidden
- No `ask` permissions — agents don't prompt the user during autonomous work
- Explicit delegation allowlists — agents can only delegate to named agents
- Commands are for humans; tools/plugins handle autonomous internal flow
- Workflow tools for stage control, not raw file edits

## Output contract

```
<agent-config-dir>/
├── agents/           # One file per agent with project-specific prompts
├── skills/           # Project-local skills (populated by project-skill-bootstrap)
├── tools/            # Standard + project-specific tools
├── plugins/          # Standard enforcement plugins
├── commands/         # Human-facing commands (kickoff, resume)
└── config/           # Stage-gate and workflow configuration
```

## Failure handling

- **No canonical brief**: Generate generic agents, flag for customization later
- **Stack not supported**: Create generic implementer/reviewer, note stack-specific gaps
- **Agent client not installed**: Generate files anyway — they're valid for future use
- **Conflicting agent names**: Use project prefix (e.g., `myproj-implementer`)

## References

- This is step 4 of the scaffold-kickoff flow — continue to `../ticket-pack-builder/SKILL.md`
- Apply `../agent-prompt-engineering/SKILL.md` rules when hardening prompts
