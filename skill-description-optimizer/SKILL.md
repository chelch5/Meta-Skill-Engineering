---
name: skill-description-optimizer
description: "Rewrite a skill's description field to fix routing problems — undertriggering, overtriggering, or passive language that fails to match user intent. Use when a skill isn't being found by agents, evaluation shows low trigger recall, or batch-auditing descriptions for a library release. Do not use when the skill's scope is the problem (not just description text) or when the description is already performing correctly."
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode, github-copilot]
---

# Skill Description Optimizer

The `description` field is routing logic — it determines when hosts invoke the skill. Bad descriptions cause undertriggering (skill never fires) or overtriggering (fires for wrong tasks).

## Procedure

### 1. Read current description

Assess:
- **Length**: Too short (< 20 words) → likely undertrigger. Too long (> 100 words) → likely diluted.
- **Style**: Capability statement ("This skill can...") vs trigger statement ("Use when...")
- **Discriminating power**: Could this description match 5 other skills? If yes, it's too broad.

### 2. Identify failure mode

| Mode | Symptoms | Cause |
|------|----------|-------|
| **Undertrigger** | Skill never fires for intended tasks | Description too narrow, technical, or missing user vocabulary |
| **Overtrigger** | Fires for unrelated tasks | Description too broad, overlaps siblings, no DO NOT USE boundary |
| **Passive** | Inconsistent triggering | Describes what skill *is*, not when to invoke it |

### 3. Extract discriminating signals

What words predict THIS skill and not siblings?
- Specific task verbs (scaffold, audit, deprecate, package)
- Domain terms (ticket, manifest, overlay)
- Explicit names the user would say

### 4. Write optimized description

**Structure (40-70 words):**
- Sentence 1: Action verb + most discriminating signal (lead with what the skill does)
- Sentence 2: Context or problem it solves
- Sentence 3: "Use when [specific trigger condition]"
- Sentence 4: "Do not use [explicit boundary]"

**Anti-patterns to avoid:**
- "This skill helps with..." (passive)
- "A comprehensive tool for..." (marketing copy)
- "Use this when creating, adapting, refining, installing, testing, or packaging..." (kitchen-sink — matches everything)

### 5. Check sibling conflicts

Read 2-3 similar skill descriptions. Does the new description discriminate correctly? Add a distinguishing clause if needed.

### 6. Validate with test prompts

| Prompt | Type | Should Match? |
|--------|------|---------------|
| "[specific task in scope]" | positive | YES |
| "[specific task in scope]" | positive | YES |
| "[task for a sibling skill]" | negative | NO |
| "[task for a sibling skill]" | negative | NO |

## Output contract

```markdown
## Description Optimization: [skill-name]

### Failure Mode
[Undertrigger | Overtrigger | Passive]

### Before
"[original description]"

### After
"[optimized description]"

### Discrimination Check
| Similar Skill | Differentiated By |
|---------------|-------------------|
| [sibling] | [distinguishing signal] |

### Test Prompts
| Prompt | Expected | Matches? |
|--------|----------|----------|
```

## Failure handling

- **Scope ambiguity at procedure level**: Description can't fix this — recommend scope narrowing or skill splitting
- **No discriminating signals**: Skill may be too generic — narrow scope first
- **Can't test routing**: Create synthetic test prompts based on intended use
