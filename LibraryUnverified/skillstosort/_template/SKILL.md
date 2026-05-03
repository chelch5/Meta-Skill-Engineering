---
name: skill-creator-template
description: >
  Scaffold a new agent skill from this template when you need to create
  reusable automation instructions. Use when: building a new SKILL.md from
  scratch, standardizing an ad-hoc workflow into a shareable skill, or
  preparing a skill for contribution to a library. This template provides
  the canonical structure and section ordering for OpenCode/Codex-style agents.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Meta Skill Engineering
  version: "1.1"
  domain: meta
  complexity: intermediate
  language: multi
  tags: skill, template, scaffold, skill-creator, meta
---

# Create Skill from Template

Scaffold a new agent skill by copying this template and filling in domain-specific content. Produces a complete SKILL.md following the canonical repository structure with all required sections in correct order.

## When to Use

- Creating a brand new skill from scratch with no existing template
- Converting an ad-hoc automation workflow into a reusable, documented skill
- Standardizing a skill to meet repository structural requirements
- Preparing a skill for evaluation, packaging, or distribution

## When NOT to Use

- Modifying an existing skill (use `skill-improver` instead)
- Adapting a skill to a different stack or context (use `skill-adaptation`)
- Splitting a broad skill into variants (use `skill-variant-splitting`)
- Quick one-off tasks that do not need reusable documentation

## Procedure

### Step 1: Copy Template and Set Frontmatter

Create the skill directory and copy this template as SKILL.md.

```bash
mkdir -p /path/to/skill-name
cp /path/to/_template/SKILL.md /path/to/skill-name/SKILL.md
```

**Expected:** File exists at target path, frontmatter contains placeholder values.

**On failure:** Verify source template exists; check directory permissions; retry with absolute paths.

### Step 2: Populate Required Frontmatter Fields

Edit the YAML frontmatter to describe the skill's purpose and discovery triggers.

- `name`: Kebab-case identifier (e.g., `docker-compose-setup`)
- `description`: 1-3 sentences starting with a verb, include key activation triggers
- `allowed-tools`: List tools the skill will use
- `metadata`: Set domain, complexity, language, and 3-6 lowercase tags

**Expected:** All frontmatter fields contain concrete values, not placeholders.

**On failure:** Review repository SKILL.md examples for reference values; ensure YAML syntax is valid.

### Step 3: Write Purpose and Trigger Sections

Fill in the body sections following the canonical order.

1. **Purpose**: One paragraph describing what the skill accomplishes
2. **When to Use**: Bullet list of concrete activation scenarios
3. **When NOT to Use**: Bullet list of scenarios where this skill should not activate

**Expected:** Sections contain domain-specific content, no placeholder text remains.

**On failure:** If content is vague, add specific tool names, file patterns, or command examples.

### Step 4: Define Procedure Steps

Write numbered procedure steps with:

- Clear action titles in imperative form
- Context sentence explaining the step's goal
- Concrete code blocks with executable commands
- **Expected:** specific success indicators (file created, exit code 0, output pattern)
- **On failure:** specific recovery actions (check permissions, retry with flag, abort)

**Expected:** Each step has all five components; commands are copy-paste runnable.

**On failure:** Add error handling for common failure modes (missing dependencies, permission denied, network errors).

### Step 5: Add Output Contract and Failure Handling

Document what the skill produces and how it handles errors.

**Output Contract** section:
- List files created or modified
- Describe console output or return values
- State side effects (services started, state changed)

**Failure Handling** section:
- Recovery procedures for each failure mode
- Conditions under which to abort vs retry
- How to report partial success or degraded output

**Expected:** User can predict exactly what happens on success and failure.

**On failure:** Review procedure steps and extract failure modes into dedicated section.

### Step 6: Add Next Steps and References

Complete the skill with workflow integration.

**Next Steps** section:
- Pointer to `skill-testing-harness` for creating evals
- Pointer to `skill-evaluation` for validating the skill
- Pointer to `skill-packaging` for distribution

**References** section (optional):
- Links to external documentation
- Examples in `references/EXAMPLES.md` if needed

**Expected:** Skill user knows what to do after execution completes.

**On failure:** Check related skill names against repository inventory.

## Output Contract

Upon completion:

- **File Created**: `SKILL.md` at the specified path with valid YAML frontmatter
- **Structure**: All required sections present in canonical order (Purpose, When to Use, When NOT to Use, Procedure, Output Contract, Failure Handling, Next Steps, References)
- **Content**: No placeholder text remains; all examples are domain-specific
- **Validation**: File passes structural validation (frontmatter parseable, sections present)

## Failure Handling

### Template Not Found
- **Recovery**: Verify template path; use `find` or `glob` to locate template
- **Abort Condition**: If no template exists, abort and request skill-creator skill

### Invalid YAML Frontmatter
- **Recovery**: Validate YAML syntax with online tool or Python yaml module
- **Retry**: Fix syntax errors and re-write frontmatter

### Incomplete Content
- **Detection**: Check for placeholder strings: "skill-name-here", "Your Name", "tag1"
- **Recovery**: Replace all placeholders before marking complete
- **Abort Condition**: If domain expertise is missing, request user input

## Next Steps

After creating the skill:

- Run `skill-testing-harness` to build trigger and behavior tests
- Run `skill-evaluation` to validate routing accuracy and output quality
- Run `skill-anti-patterns` to audit for structural issues
- Run `skill-packaging` when ready to distribute

## Validation

- [ ] Frontmatter contains valid YAML with all required fields populated
- [ ] `name` uses kebab-case, no spaces or underscores
- [ ] `description` starts with a verb and includes activation triggers
- [ ] All placeholder text replaced with domain-specific content
- [ ] Procedure steps include Expected and On failure for every step
- [ ] When NOT to Use section has at least 2 scenarios
- [ ] Output Contract section lists concrete deliverables
- [ ] Failure Handling section covers common error modes
- [ ] Next Steps section points to at least 3 related skills
- [ ] No TODO, placeholder, or tool-specific compatibility language remains
- [ ] Total length under 500 lines (extract long examples to references/)

## Common Pitfalls

- **Vague descriptions**: Using marketing language instead of routing triggers. Fix: Start with "Use when..." and list concrete conditions.
- **Missing failure handling**: Only documenting happy path. Fix: Add On failure to every procedure step and a Failure Handling section.
- **Template placeholders slipping through**: Publishing with "skill-name-here" or "Your Name". Fix: Search for common placeholder strings before completion.
- **Wrong section order**: Putting Validation before Procedure. Fix: Follow the canonical order specified in this skill.
- **Omitting When NOT to Use**: Leading to false positive activations. Fix: Always include this section with 2+ negative triggers.

## References

- Repository SKILL.md structure requirements in `AGENTS.md`
- Example skills in repository root for reference implementations
- Extended examples: `references/EXAMPLES.md` (if present)
