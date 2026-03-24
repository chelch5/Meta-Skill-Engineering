---
name: agent-prompt-engineering
description: "Design and harden agent, command, workflow, and tool prompts for reliable execution across different AI models. Use when creating or revising repo-local agents to apply model-specific prompting techniques, tighten scope, and prevent common agent failure modes like doom loops, status-over-evidence routing, and impossible read-only delegation. Do not use for one-off prompts or when agents are already working reliably."
---

# Agent Prompt Engineering

Use this skill when prompt wording controls how agents coordinate, route work, and use tools.

## Procedure

### 1. Analyze existing prompts

Read the existing prompt, command, or process doc and identify:
- **Authority**: what the agent owns
- **Scope**: what the agent does NOT own
- **Tool surface**: what tools it can use
- **Stage transitions**: what stages it moves between
- **Delegation boundaries**: who it can delegate to

### 2. Apply prompt contracts by role

Each agent type has specific prompt requirements:

| Role | Key contract |
|------|-------------|
| Orchestrator / Team Leader | Resolve state from tools first, verify artifacts before routing |
| Planner | Decision-complete plans for one ticket only |
| Implementer | Follow the approved plan, stop on missing requirements |
| Reviewer / QA | Stay read-only, return findings first — never praise before findings |
| Utility | Stay narrow and bounded, single-purpose |

### 3. Remove anti-patterns

Eliminate these common prompt failures:

**Status-over-evidence routing** — Routing based on labels instead of actual artifacts.
Fix: require tool-read proof before stage transitions.

**Raw-file stage control** — Editing state files directly instead of using tools.
Fix: route all state changes through workflow tools.

**Impossible read-only delegation** — Telling read-only agents to write files.
Fix: verify agent capabilities match task requirements before delegating.

```yaml
# BAD: Read-only agent told to write
agents:
  researcher:
    permissions: [read]
    task: "Read the code and update the docs"  # IMPOSSIBLE

# GOOD: Capability-matched delegation
agents:
  researcher:
    permissions: [read]
    task: "Read the code and report findings"
  implementer:
    permissions: [read, write]
    task: "Update the docs based on researcher findings"
```

**Broad command follow-on** — Commands that silently continue the whole workflow.
Fix: each command should have a clear stop point.

**Context amnesia** — Agent forgets earlier decisions.
Fix: load key constraints at task start, reference source-of-truth files.

### 4. Apply model-specific techniques

Different models have different prompting best practices:

**For capable models (Claude Sonnet 4+, GPT-4+):**
- Can handle nuanced instructions and self-correct
- Benefit from "think step by step" and structured reasoning
- Use XML tags for complex prompt structure

```yaml
system_prompt: |
  <role>You are an implementer for project-name.</role>
  <context>Stack: TypeScript, Node.js, Vitest</context>
  <instructions>
  1. Read the ticket fully
  2. Check for existing patterns in src/
  3. Write tests first, then implement
  4. Run full test suite before committing
  </instructions>
  <constraints>
  - No any types
  - All exports must be typed
  - Test coverage > 80%
  </constraints>
```

**For less capable models (Haiku, GPT-3.5, smaller models):**
- Need explicit step-by-step sequences — do not combine steps
- Benefit from few-shot examples over abstract rules
- Need guardrails against hallucination
- Keep outputs short but highly structured

```yaml
system_prompt: |
  Follow this exact sequence:
  
  STEP 1: Read file
  Command: cat [filename]
  
  STEP 2: Identify change location
  Output: "Line [N]: [current content]"
  
  STEP 3: Make edit
  Change: [old] → [new]
  
  Do not skip steps. Do not combine steps.
  If stuck after 3 attempts: STOP and report blocker.
```

**When hardening for a specific model:**
1. Check for local model documentation (if maintained in repo)
2. If none exists, web-search for "[model name] prompting best practices"
3. Apply discovered techniques
4. Document findings for future reference

### 5. Apply weak-model hardening

Ensure all prompts are safe for weaker models:
- Outputs are short but highly structured
- Exact required sections are stated
- Blocker returns are preferred over hidden guesswork
- Proof is required before stage transitions
- Next specialist or action is named explicitly
- Stable procedure lives in skills/tools, not long prose

### 6. Add self-verification

Every agent prompt should include a verification step:

```yaml
system_prompt: |
  Before completing any task, self-verify:
  □ Did I follow the stack standards?
  □ Did I write tests for new code?
  □ Did I run the linter?
  □ Does the output match the expected format?
  
  If any check fails, fix before proceeding.
```

### 7. Final verification

Re-read the final prompt and ask:
- Could a weaker model execute this without inventing hidden state?
- Are all tool permissions explicit?
- Are all delegation boundaries named?
- Is there a clear stop condition?
- Does the prompt say what TO do (not just what NOT to do)?

## Rules

- Prefer tool-backed state over raw file choreography
- Keep ticket status coarse and queue-oriented
- Require verification before stage changes
- Require explicit blocker return paths when material ambiguity remains
- Do not let prompts terminate with a summary when the workflow still has another stage
- Never instruct read-only agents to mutate repo-tracked files
- Never claim a file changed unless a write-capable tool actually wrote it
- Put transient approval state in workflow state or explicit artifacts, not ticket status

## Output contract

Improved agent definitions with:
- Clear role statement
- Explicit capabilities and limitations
- Step-by-step operating procedure
- Output format specification
- Self-verification checklist
- Stop conditions and blocker paths

## Failure handling

- **Agent still loops**: Add explicit loop counter and hard stop (max 3-5 attempts)
- **Agent ignores instructions**: Move critical instructions to top of prompt; use XML tags for structure
- **Model too weak for task**: Simplify task decomposition or upgrade model
- **Inconsistent behavior**: Add more few-shot examples of desired behavior
- **Status-over-evidence persists**: Add explicit "prove it" gates requiring tool output before state changes

## References

- Anthropic prompting best practices: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-prompting-best-practices
- XML tags for structure, examples for steering, explicit over implicit
- OpenAI prompt engineering guide: https://developers.openai.com/docs/guides/prompt-engineering
