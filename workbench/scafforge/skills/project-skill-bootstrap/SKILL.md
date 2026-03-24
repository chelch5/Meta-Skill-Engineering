---
name: project-skill-bootstrap
description: Create project-local OpenCode skills populated with actual project data, stack-specific conventions, and domain-specific procedures. Use after scaffolding to replace generic skill placeholders with real project-aware guidance that helps agents work effectively in this specific repo.
---

# Project Skill Bootstrap

Use this skill to create the repo-local `.opencode/skills/` layer with actual project content.

## Goals

- Make project context easy to reload for any agent or session
- Encode actual stack and domain standards, not generic placeholders
- Reduce ambiguity for weaker models
- Keep prompts short by moving stable procedure into local skills
- Keep project-local skills aligned with ticket tools and workflow state

## Modes

- **foundation**: populate baseline skills with actual project data
- **synthesis**: add stack- or domain-specific skills based on project evidence

## Mode selection

- If this skill is reached from `scaffold-kickoff`, run `foundation` first.
- After `foundation`, run `synthesis` when the canonical brief and repo evidence justify additional project-specific skills.
- If invoked directly and the baseline `.opencode/skills/` files are still generic or placeholder-like, use `foundation`.
- If invoked directly and the baseline skills are already populated but the user wants additional stack- or domain-specific procedure, use `synthesis`.
- If it is unclear whether the user wants baseline rewrite work or additive synthesized skills, ask the user before choosing a mode.

## Foundation mode procedure

The base scaffold generates generic skill templates. You must populate them with actual project data.

### 1. Read the canonical brief

Read `docs/spec/CANONICAL-BRIEF.md` for project facts, stack decisions, and constraints.

### 2. Populate baseline skills

For each baseline skill in `.opencode/skills/`, rewrite the SKILL.md with actual project content:

**project-context** — Replace generic reading order with actual project-specific context:
- Actual project summary (what this project is)
- Actual canonical doc paths
- Current project state
- Key architectural decisions from the brief

**repo-navigation** — Replace generic paths with actual project structure:
- Actual directory layout (as generated)
- Key files and what they contain
- Common queries agents will need

**stack-standards** — Replace the `__STACK_LABEL__` placeholder with REAL rules:
- Actual framework/language conventions (e.g., "Use React functional components with TypeScript")
- Actual testing commands (e.g., "Run tests with `pnpm test`")
- Actual linting/formatting rules
- Code style preferences from the brief

**ticket-execution** — Keep the standard lifecycle but add project-specific notes:
- Any project-specific stage requirements
- Project-specific validation expectations

**review-audit-bridge** — Keep the evidence-first review order but add project-specific review and QA expectations:
- Repo-specific review commands, validation commands, and artifact paths
- Security-sensitive areas that need explicit attention
- Approval vs blocker rules for code review, security review, and QA

**docs-and-handoff** — Add project-specific doc paths and conventions

**workflow-observability** — Keep as-is (generic is fine for observability)

**research-delegation** — Keep as-is (generic is fine for research patterns)

**local-git-specialist** — Add project-specific branch conventions if specified in brief

**isolation-guidance** — Keep as-is unless brief specifies isolation requirements

### 3. Write updated skills

Write each updated skill to `.opencode/skills/<name>/SKILL.md`.
Each skill MUST have YAML frontmatter with `name` and `description`.

## Synthesis mode procedure

After foundation mode, evaluate whether the project needs additional stack- or domain-specific skills.

### 1. Analyze the stack

From the canonical brief, identify:
- What framework/runtime is being used
- What database/ORM is being used
- What API patterns are being used
- What deployment target exists
- Any domain-specific workflow requirements

### 2. Research external patterns (reference only)

Use web search or `/find-skill` to discover relevant skill patterns:
- Search for skills related to the project's stack
- Look at the [Anthropic skills repo](https://github.com/anthropics/skills) for patterns
- Look at the [awesome-copilot collection](https://github.com/github/awesome-copilot)
- Check framework documentation for conventions and best practices

**CRITICAL: Do NOT install external skills directly.** Use them as REFERENCE ONLY for synthesizing project-specific skills.

### 3. Synthesize project-specific skills

Based on research, create skills that are specific to THIS project:

Examples:
- For a React project: `component-patterns` skill with the project's component conventions
- For an API project: `api-contracts` skill with the project's schema format and validation rules
- For a database project: `migration-safety` skill with the project's DB engine specifics
- For a testing-heavy project: `test-patterns` skill with the project's test runner and fixture conventions
- For a deployment project: `deploy-safety` skill with the project's deployment path

### 4. Quality rules for synthesized skills

- Each skill must be repo-specific, not generic paraphrasing of docs
- Prefer procedure over reference dumping
- Each skill must justify its existence — don't create a skill just because you can
- Keep total skill count manageable (weaker models struggle with >12-15 skills)
- Every synthesized skill must have proper YAML frontmatter

### 5. Write synthesized skills

Write each to `.opencode/skills/<name>/SKILL.md` using the template in `assets/templates/SKILL.template.md` as a starting structure.

## After this step

Continue to `../agent-prompt-engineering/SKILL.md` as directed by scaffold-kickoff.

## Rules

- Use this after the main scaffold exists — it refines, not replaces
- When creating or revising skills, follow `../agent-prompt-engineering/SKILL.md` rules to avoid anti-patterns
- Start with the smallest useful pack; add only when project evidence justifies it
- Never auto-install external skills — synthesis from reference only

## References

- `references/local-skill-catalog.md` for the baseline skill list
- `assets/templates/SKILL.template.md` for the skill file template
