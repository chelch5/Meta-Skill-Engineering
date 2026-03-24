---
name: opencode-team-bootstrap
description: Design and generate a project-specific OpenCode agent team with specialized agents, tools, plugins, commands, and skills tailored to the project type and stack. Use after the base scaffold exists to customize the generic agent templates into project-aware specialists.
---

# OpenCode Team Bootstrap

Use this skill to design the agent team for the project. This is creative work — you analyze the project and customize the agents, tools, and plugins to match.

## Mode selection

- If this skill is reached from `scaffold-kickoff` after a fresh scaffold render, use the design path for a new project-specific team.
- If the repo already exists and the goal is to add or repair the `.opencode/` operating layer, use the retrofit path.
- If it is unclear whether the user wants a fresh team design pass or repair of an existing operating layer, ask the user before choosing a mode.

## Context

The `repo-scaffold-factory` script generates a BASE set of generic agent templates. These are a starting structure, not the final output. Your job is to read the canonical brief and customize these agents to be project-specific.

## Procedure

### 1. Read the canonical brief

Read `docs/spec/CANONICAL-BRIEF.md` to understand:
- What kind of project this is (web app, API, MCP server, CLI tool, library, etc.)
- What stack/framework is being used
- What domains the project spans (UI, backend, database, infrastructure, etc.)
- What the acceptance criteria are

### 2. Plan the agent team

Decide which agents this project needs. Start from the baseline and add/modify based on project type.

**Baseline agents (always present):**
- `team-leader` — visible orchestrator, delegates to specialists
- `planner` — turns tickets into implementation plans
- `plan-review` — approves/rejects plans before implementation
- `implementer` — implements the approved plan (at least one, may have multiple)
- `reviewer-code` — code review for correctness and regressions
- `reviewer-security` — security review for trust boundaries and secrets
- `tester-qa` — QA validation and closeout readiness
- `docs-handoff` — closeout artifact synchronization
- `backlog-verifier` — re-checks completed tickets after a workflow or process upgrade
- `ticket-creator` — creates guarded follow-up tickets only from verifier proof

**Project-specific agents (add based on project type):**

For UI/frontend projects:
- Additional implementer for component work (e.g., `implementer-ui`)
- Accessibility reviewer
- Visual regression agent

For API projects:
- API implementer with schema awareness
- Contract validation agent

For MCP server projects:
- Protocol implementer with MCP spec knowledge
- Tool definition specialist

For database-heavy projects:
- Migration specialist
- Schema reviewer

For CLI/library projects:
- API surface reviewer
- Documentation specialist

You may create MULTIPLE implementer-type agents for different domains within a single project. For example, a full-stack app might have `implementer-frontend`, `implementer-backend`, and `implementer-infra`.

Default to one visible team leader with explicit safe parallel lanes. Only introduce a manager or section-leader hierarchy when the canonical brief shows strong non-overlapping domains that justify the extra coordination layer. Treat that hierarchy as advanced project-specific customization, not as a first-class scaffold profile.

**Utility agents (include based on need):**
- `utility-explore` — repo evidence gathering
- `utility-github-research` — GitHub-focused research
- `utility-shell-inspect` — read-only shell commands
- `utility-summarize` — evidence compression
- `utility-ticket-audit` — ticket/state consistency
- `utility-web-research` — external technical research

Omit utility agents that aren't useful for the project.

### 3. Customize agent prompts

For EVERY agent, rewrite the generic prompt to be project-specific:

**What to customize:**
- **Description**: mention the actual project and what the agent does for it
- **First instruction**: state the agent's role in the context of THIS project
- **Tool permissions**: adjust based on what the agent actually needs
- **Skill allowlists**: reference project-specific skills
- **Task allowlists**: reference the actual agents that exist (including any new ones)
- **Bash allowlists**: add project-specific commands (e.g., `cargo test*` for Rust, `flutter test*` for Flutter)

**What NOT to change:**
- Model assignments (`__PLANNER_MODEL__`, etc. are already substituted by the script)
- Hidden/visible settings (only team-leader should be visible)
- The fundamental stage-gate workflow (planning → review → implement → review → QA → handoff)

**Example customization for a React web app:**

The generic planner says: "You produce decision-complete plans for a single ticket."

Customize to: "You produce decision-complete plans for a single ticket in the Example App React frontend. Plans must specify which components are affected, what state management changes are needed, and what test scenarios to cover. Reference the component tree in docs/spec/CANONICAL-BRIEF.md."

### 4. Write agent files

Write each agent to `.opencode/agents/<prefix>-<role>.md` with proper YAML frontmatter.

Verify:
- Every agent has `description`, `model`, `mode`, `hidden`, `temperature`, `top_p`
- Tool permissions are explicit (deny by default, allow specifically)
- Skill allowlists reference only skills that exist in `.opencode/skills/`
- Task allowlists reference only agents that exist in `.opencode/agents/`
- Read-only agents (planner, reviewers, QA) have `write: false, edit: false`
- Only implementer and docs-handoff have `write: true, edit: true`

### 5. Review project-specific tools

The base scaffold generates these standard tools (keep them all):
- `artifact_write.ts` — write canonical artifacts
- `artifact_register.ts` — register artifact metadata
- `context_snapshot.ts` — generate context snapshots
- `handoff_publish.ts` — publish START-HERE handoff
- `skill_ping.ts` — record skill invocations
- `ticket_create.ts` — guarded follow-up ticket creation from verifier proof
- `ticket_lookup.ts` — resolve tickets from manifest
- `ticket_update.ts` — update ticket state with stage gates
- `_workflow.ts` — shared types and utilities

Consider whether the project needs additional tools:
- Database projects might need a migration status tool
- API projects might need a schema validation tool
- Component projects might need a component scaffolding tool

If additional tools are warranted, create them following the patterns in `_workflow.ts`.

### 6. Review plugins

The base scaffold generates these standard plugins (keep them all):
- `invocation-tracker.ts` — audit logging
- `session-compactor.ts` — context preservation on compaction
- `stage-gate-enforcer.ts` — blocks unsafe operations before plan approval
- `ticket-sync.ts` — records ticket state changes
- `tool-guard.ts` — blocks dangerous operations

These are generic and work for any project. Only add project-specific plugins if genuinely needed.

### 7. Review commands

The base scaffold generates:
- `kickoff.md` — start the autonomous planning cycle
- `resume.md` — resume from the latest state

Customize these to reference project-specific agents and skills.

## Team design principles

- One visible team leader, all specialists hidden
- No `ask` permissions — agents don't prompt the user
- Explicit `permission.task` allowlists — agents can only delegate to named agents
- Commands are for humans only
- Tools/plugins handle autonomous internal flow
- Workflow state and ticket tools for stage control, not raw file edits

## After this step

Continue to `../ticket-pack-builder/SKILL.md` as directed by `../scaffold-kickoff/SKILL.md`.

## References

- `references/agent-system.md` for the team structure
- `references/tools-plugins-mcp.md` for the tool/plugin/command layer
- `../repo-scaffold-factory/assets/project-template/` for the base templates
- `../agent-prompt-engineering/SKILL.md` for prompt hardening rules
