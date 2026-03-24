---
name: project-skill-bootstrap
description: "Create project-local skills populated with actual project data, stack-specific conventions, and domain-specific procedures. Use after scaffolding to replace generic skill placeholders with real project-aware guidance that helps agents work effectively in this specific repo. Do not use before the project has established patterns (scaffold first) or for universal skills that belong in a skill library."
---

# Project Skill Bootstrap

Use this skill to create the repo-local skills layer with actual project content.

## Goals

- Make project context easy to reload for any agent or session
- Encode actual stack and domain standards, not generic placeholders
- Reduce ambiguity for weaker models
- Keep prompts short by moving stable procedure into local skills

## Modes

- **foundation**: Populate baseline skills with actual project data
- **synthesis**: Add stack- or domain-specific skills based on project evidence

## Foundation mode procedure

### 1. Read the canonical brief

Read the project brief for project facts, stack decisions, and constraints.

### 2. Gather project signals

Extract concrete facts from the repo:

```bash
# Stack evidence
cat package.json | jq '{name, scripts, dependencies}' 2>/dev/null
cat Cargo.toml 2>/dev/null | head -30
cat pyproject.toml 2>/dev/null | head -30

# Structure
tree -L 2 -I 'node_modules|dist|target|.git'

# Patterns (sample real code)
head -50 src/index.* src/main.* 2>/dev/null
ls tests/**/* 2>/dev/null | head -10
```

### 3. Populate baseline skills

For each baseline skill, rewrite with actual project content:

| Skill | What to populate |
|-------|-----------------|
| **project-context** | Actual project summary, canonical doc paths, key architectural decisions |
| **repo-navigation** | Actual directory layout, key files, common agent queries |
| **stack-standards** | Real framework/language conventions, testing commands, linting rules |
| **ticket-execution** | Standard lifecycle + any project-specific stage requirements |
| **docs-and-handoff** | Project-specific doc paths and conventions |

Keep generic skills (workflow-observability, research-delegation, isolation-guidance) as-is unless the project has specific requirements.

### 4. Write updated skills

Write each skill with YAML frontmatter (`name` and `description` required). Every skill must reference real files, real commands, and have no placeholder text.

## Synthesis mode procedure

### 1. Analyze the stack

From the canonical brief, identify:
- Framework/runtime in use
- Database/ORM in use
- API patterns in use
- Deployment target
- Domain-specific workflow requirements

### 2. Research external patterns (reference only)

Look for relevant patterns from:
- Anthropic skills repo, awesome-copilot collection
- Framework documentation and best practices
- Community skill registries

**CRITICAL: Do NOT install external skills directly.** Use them as REFERENCE ONLY for synthesizing project-specific skills.

### 3. Synthesize project-specific skills

Create skills specific to THIS project. Examples:
- React project → `component-patterns` with project's component conventions
- API project → `api-contracts` with project's schema format
- Database project → `migration-safety` with project's DB engine specifics
- Testing-heavy → `test-patterns` with project's test runner and fixture conventions

### 4. Quality rules for synthesized skills

- Each skill must be repo-specific, not generic paraphrasing of docs
- Prefer procedure over reference dumping
- Each skill must justify its existence — don't create skills just because you can
- Keep total skill count manageable (weaker models struggle with >12-15 skills)
- Every skill must have proper YAML frontmatter

## Output contract

Skills written to the project-local skills directory with:
- Project name in metadata
- Real file references (verified to exist)
- Real commands (verified to work)
- No placeholder text (`[...]`, `TODO`, etc.)

## Rules

- Use this after the main scaffold exists — it refines, not replaces
- Follow agent-prompt-engineering rules when creating skills to avoid anti-patterns
- Start with the smallest useful pack; add only when project evidence justifies it
- Never auto-install external skills — synthesis from reference only

## Failure handling

- **No stack profile exists**: Run stack-profile-detector first
- **Referenced file doesn't exist**: Remove reference or note "planned: [file]"
- **Command doesn't exist**: Check package.json/Makefile; if truly missing, note gap
- **Domain too complex to summarize**: Create multiple domain skills (domain-glossary, domain-rules, domain-workflows)

## References

- This is step 6 of the scaffold-kickoff flow — continue to `../agent-prompt-engineering/SKILL.md`
