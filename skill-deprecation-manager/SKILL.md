---
name: skill-deprecation-manager
description: "Safely deprecate, retire, or merge obsolete skills while preserving backward references and library clarity. Use when a user says 'deprecate this skill', 'retire this', or 'this is replaced by X', when a catalog audit identifies a skill for retirement, or when a skill is causing harm and needs immediate pull. Do not use when the skill needs improvement (use skill-improver) or when the repo doesn't support deprecation (just delete)."
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode, github-copilot]
---

# Skill Deprecation Manager

Safely deprecates a skill: updates state, adds notices, redirects references, preserves content for history.

## Procedure

### 1. Confirm deprecation decision

Determine the reason:
- **Superseded**: Replaced by a better skill
- **Merged**: Functionality absorbed into another skill
- **Unused**: No invocations over N cycles
- **Failing**: Consistently poor evaluation results
- **Harmful**: Misfiring or producing wrong outputs — pull immediately

### 2. Find all references

```bash
# Search across repo
grep -r "<skill-name>" AGENTS.md **/SKILL.md skills-lock.json docs/ 2>/dev/null
# Check "Do NOT use when" sections in sibling skills
grep -r "Do NOT use" **/SKILL.md | grep -i "<skill-name>"
```

### 3. Update each reference

Replace with replacement skill pointer, or note "no replacement available".

### 4. Update frontmatter

```yaml
metadata:
  maturity: deprecated
  deprecated_by: replacement-skill  # or "none"
  deprecated_reason: "Superseded by newer version"
```

### 5. Add deprecation notice

At top of SKILL.md body:
```markdown
> ⚠️ DEPRECATED as of [date]. Use [replacement] instead.
> Reason: [one sentence]. Kept for reference only.
```

### 6. Move to archive (if exists)

```bash
mkdir -p ARCHIVE
mv skill-name/ ARCHIVE/skill-name/
```
Do NOT delete — preserve for reference and provenance.

### 7. Update registry

- Mark `deprecated: true` in `skills-lock.json`
- Remove from active catalog
- Add to "Deprecated" section of index

## Output contract

```markdown
## Deprecation: [skill-name]

**Reason**: [superseded | merged | unused | failing | harmful]
**Replacement**: [skill] or "none"
**Date**: [YYYY-MM-DD]

### References Updated
| File | Change |
|------|--------|
| [file] | [old → new] |

### Verification
- [x] All references updated
- [x] Deprecation notice added
- [x] Archived
- [x] Registry updated
```

## Failure handling

- **Active dependencies, no replacement**: Don't deprecate — document gap, build replacement first
- **Replacement incomplete**: Create migration path with limitations noted
- **Urgent harm**: Deprecate immediately, create follow-up ticket for replacement
