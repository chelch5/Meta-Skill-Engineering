---
name: skill-reference-extraction
description: >-
  Extract large reference material (schemas, examples, lookup tables, API docs) from a
  bloated SKILL.md into a references/ directory for progressive disclosure. Use when a
  SKILL.md exceeds 500 lines or 10KB, contains large code blocks or schemas not needed
  every invocation, or the user says "this skill is too long", "slim it down", or
  "extract references". Do not use for skills already concise under 200 lines (use
  skill-improver for general tightening), when the candidate material is core procedure
  rather than reference (use skill-improver), or when the total extractable content is
  under 50 lines (not worth the indirection).
license: Apache-2.0
compatibility:
  clients: [opencode, copilot, codex, gemini-cli, claude-code]
---

# Purpose

Split large reference material out of a SKILL.md into a `references/` directory so the core skill stays concise and detail is available on demand.

# When to use

- SKILL.md exceeds 500 lines or 10 KB
- Contains code examples, schemas, or lookup tables over ~20 lines that are not needed every invocation
- User says "this is too long", "extract references", "slim down"
- Multiple skills could share the same reference material

# When NOT to use

- Skill is already under 200 lines — use **skill-improver** for general tightening
- Candidate material is core procedure, not reference — use **skill-improver**
- Total extractable content is under 50 lines — indirection cost exceeds benefit
- Extraction would break the skill's procedural flow

# Procedure

1. **Identify candidates** — scan for blocks that are reference, not procedure:
   - Code examples > 20 lines
   - Schema definitions or lookup tables
   - API documentation excerpts
   - Configuration templates
   - Extended case studies
   - Example collections with >3 examples of the same pattern
   - Format specifications (JSONL schemas, YAML structures, etc.)

2. **Classify each block** using these rules:

   **Reference material → extract:**
   - Lookup tables, enum listings, API schema dumps
   - Example collections (>3 examples demonstrating the same pattern)
   - Configuration templates and boilerplate
   - Format specifications the agent consults only for specific sub-cases

   **Core procedure → keep inline:**
   - Decision logic and conditional branches
   - Ordered steps the agent must follow every time
   - Output format definitions (the contract, not examples of it)
   - Failure handling tables

   **Heuristic:** If the content is consulted on every invocation → keep inline. If consulted only for specific sub-cases → extract.

   **Size rule:** Any individual reference block >20 lines should be extracted unless it IS the skill's primary procedure. A 40-line lookup table is an extraction candidate; a 40-line decision tree is not.

3. **Create `references/` directory** with descriptive filenames:
   ```
   skill-name/
   ├── SKILL.md
   └── references/
       ├── README.md          ← index table
       ├── schema.json
       └── examples.md
   ```

4. **Extract** — move each block, preserve formatting, name files by content not sequence.

5. **Add inline pointers** in SKILL.md — replace each extracted block with a one-line summary and a path reference:
   ```
   Full schema: see references/schema.json
   ```

6. **Write `references/README.md`** — a table mapping each file to its contents and when an agent should read it.

7. **Verify**:
   - SKILL.md is understandable without reading any reference file
   - All procedure steps remain inline
   - Every reference file is signposted from SKILL.md
   - **Reference link quality check:** Read SKILL.md top-to-bottom. For every line that says "see references/X.md", verify it tells the agent (a) WHEN to consult it (what condition or sub-case triggers the lookup) and (b) WHAT to look for (a one-line summary of what the reference contains). If either is missing, the reference link is broken — add a summary line. Bad: `Full schema: see references/schema.json`. Good: `When validating output format, consult the full JSON schema: references/schema.json (defines required fields, types, and nesting for the trigger-test JSONL format).`

# Output contract

Produce a summary in this format:

```
## Reference Extraction: [skill-name]

### Extracted
| Block | Original location | Destination | Size |
|-------|-------------------|-------------|------|

### Reduction
- Before: [lines], [KB]
- After: [lines], [KB]
- Reduction: [%]

### Verification
- [ ] Procedure intact
- [ ] All references signposted
- [ ] references/README.md created
```

# Failure handling

- **Cannot decide whether material is procedure or reference** → keep it inline; false-negative extraction is safer than breaking the skill
- **Extraction would fragment a coherent procedure section** → leave inline, note in summary
- **Circular cross-references between extracted files** → flatten into a single reference file
- **Two skills want the same reference** → create a skill-specific copy; shared references are fragile
