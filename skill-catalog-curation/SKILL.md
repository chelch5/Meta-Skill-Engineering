---
name: skill-catalog-curation
description: >-
  Audit a skill library for duplicates, category drift, and discoverability gaps.
  Use when: "audit the skill library", "clean up overlapping skills", "organize the catalog before release".
  Do not use for: improving a single skill (skill-improver), creating a new skill (skill-authoring),
  promoting or deprecating individual skills through lifecycle states (skill-lifecycle-management).
license: Apache-2.0
compatibility:
  clients: [opencode, copilot, codex, gemini-cli, claude-code]
---

# Purpose

Detect duplicates, enforce category consistency, flag deprecation candidates, and verify discoverability across an entire skill library. Produces a structured curation report with prioritized action items.

# When to use

- Library has grown past ~20 skills and overlaps or inconsistencies have appeared
- Before a major release or after a bulk import
- Periodic maintenance pass (monthly for active libraries)
- User asks to "audit the library", "clean up skills", or "find duplicate skills"

# When NOT to use

- Improving or refining a single skill → `skill-improver`
- Creating a new skill from scratch → `skill-authoring`
- Promoting, deprecating, or archiving individual skills through lifecycle gates → `skill-lifecycle-management`
- Installing or packaging skills → `skill-installer` / `skill-packaging`

# Procedure

## 1. Build inventory

- List every skill: name, category, maturity, last-modified date
- Count skills per category; flag uncategorized or miscategorized entries

## 2. Detect duplicates and overlaps

- **Extract action signatures**: For each skill, extract the first verb+object phrase from the description (e.g., "Audit a skill library" → `audit library`, "Compare skill variants" → `compare variants`). This is the skill's action signature.
- **Group by action signature**: Skills with the same or synonymous action signature (e.g., `audit library` ≈ `review catalog`) are potential duplicates. Compare trigger phrases within each group — if >50% of one skill's trigger phrases also appear in or paraphrase the other, flag as duplicate.
- **Check cross-references**: For skills not grouped by action signature, inspect "Do not use for" sections. Mutual cross-references (A says "not for X, use B" and B says "not for Y, use A") suggest related scopes that may overlap or have ambiguous boundaries.
- Flag identical names at different paths.
- For each flagged pair, recommend one of: **merge**, **differentiate** (rewrite boundaries), or **keep** (with rationale).

## 3. Audit categories

- Verify each skill's category matches its actual function (read the procedure, not just the name)
- Categories with ≤ 2 skills → propose merge into a neighbor
- Categories with > 15 skills → propose a split axis

## 4. Check discoverability

- Does each description start with an action verb?
- Are negative boundaries present and naming the correct neighbor skills?
- Would a user with a realistic task phrase find this skill via keyword match?

Flag concrete defects using these thresholds:
- **Too terse**: Description under 20 words → insufficient for reliable routing. Recommend expanding to at least one sentence with verb, scope, and context.
- **No trigger phrases**: Description lacks quoted example phrases (e.g., `"audit the library"`) → routing relies entirely on keyword overlap, which is fragile. Recommend adding 2–3 realistic trigger phrases.
- **Weak boundaries**: "Do not use" section names fewer than 2 alternative skills → the skill's scope edges are undefined. Check the catalog for the most likely confused neighbors and add them.

## 5. Flag deprecation candidates

- Superseded by a newer skill with the same coverage
- Targets a tool or framework no longer in the stack
- If usage metrics exist, flag skills with zero invocations over the review window

## 6. Compile report

Output the curation report using the structure in **Output contract** below.

# Output contract

The report MUST contain all six sections. Omit rows only when a section has zero findings; keep the heading with "None found."

```markdown
## Catalog Curation Report

### Inventory
- Total skills: <N>
- By maturity: <draft: N, stable: N, deprecated: N>
- Categories: <N>

### Duplicates / Overlaps
| Skill A | Skill B | Overlap evidence | Recommendation |
|---------|---------|-----------------|----------------|
| ...     | ...     | <shared trigger phrases or purpose text> | merge / differentiate / keep |

### Category Issues
| Issue | Affected skills | Recommended action |
|-------|----------------|--------------------|

### Discoverability Gaps
| Skill | Problem | Fix |
|-------|---------|-----|
| ...   | description starts with noun, no negative boundaries | rewrite description |

### Deprecation Candidates
| Skill | Reason | Replacement |
|-------|--------|-------------|

### Prioritized Actions
1. **[High]** <action> — <reason>
2. **[Medium]** <action> — <reason>
3. **[Low]** <action> — <reason>
```

# Failure handling

- **Cannot compare descriptions meaningfully** (e.g., descriptions are one-word stubs): report the skill as "unassessable — description too short to evaluate" and recommend a description rewrite before the next curation pass.
- **Category scheme is incoherent** (no consistent axis): propose a replacement taxonomy with explicit grouping criteria and flag it as a blocking action before other category fixes.
- **No usage metrics available**: fall back to last-modified date and whether the skill's target tool/framework still exists in the stack.
- **Findings exceed 30 action items**: split into phases — Phase 1: duplicates and broken boundaries (high), Phase 2: category restructuring (medium), Phase 3: discoverability polish (low). Do not emit an unprioritized list.
