# Agent Catalog

Prefix: `__AGENT_PREFIX__`

Visible entrypoint:

- `__AGENT_PREFIX__-team-leader`

Core hidden specialists:

- `__AGENT_PREFIX__-planner`
- `__AGENT_PREFIX__-plan-review`
- `__AGENT_PREFIX__-implementer`
- `__AGENT_PREFIX__-reviewer-code`
- `__AGENT_PREFIX__-reviewer-security`
- `__AGENT_PREFIX__-tester-qa`
- `__AGENT_PREFIX__-docs-handoff`

Utility hidden specialists:

- `__AGENT_PREFIX__-utility-explore`
- `__AGENT_PREFIX__-utility-shell-inspect`
- `__AGENT_PREFIX__-utility-summarize`
- `__AGENT_PREFIX__-utility-ticket-audit`
- `__AGENT_PREFIX__-utility-github-research`
- `__AGENT_PREFIX__-utility-web-research`

Workflow contract:

- the team leader advances stages through ticket tools and workflow state, not by manually editing ticket files
- each major stage must leave a canonical artifact before the next stage begins
- read-only specialists return findings, artifacts, or blockers instead of mutating repo files
