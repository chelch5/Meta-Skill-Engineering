---
name: provenance-audit
description: "Audit a skill or artifact's origin chain: where it came from, who authored it, what license applies, what modifications were made, and what trust level to assign. Use when evaluating external skills for adoption, auditing existing skills for license compliance, or establishing trust levels before execution. Do not use when creating new skills from scratch (provenance is 'authored here') or for trusted internal sources."
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode, github-copilot]
---

# Provenance Audit

Audits a skill's origin chain and assigns a trust level.

## Procedure

### 1. Identify origin type

| Origin Type | Description | Default Trust |
|-------------|-------------|---------------|
| `authored` | Created in this repo | High |
| `forked` | Copied from external, modified | Medium |
| `imported` | Copied from external, unmodified | Medium |
| `generated` | AI-generated from requirements | Low |
| `unknown` | Origin unclear | Untrusted |

### 2. Extract provenance metadata

From SKILL.md frontmatter: `name`, `source`, `license`.

From git history:
```bash
# First commit of skill
git log --follow --format="%H %an %ad %s" -- SKILL.md | tail -1
# All modifications
git log --follow --oneline -- SKILL.md
```

### 3. Verify source claims

If `source` claims external origin:
```bash
# Fetch and compare original
curl -s "<original-raw-url>" > /tmp/original.md
diff SKILL.md /tmp/original.md
# If different → forked (not imported)
```

### 4. Check license compatibility

| License | Category | Action |
|---------|----------|--------|
| Apache-2.0, MIT, BSD-* | Permissive | OK for any use |
| GPL-3.0, AGPL-3.0 | Copyleft | Check derivative work implications |
| (none) | Unknown | Do not adopt — flag for manual review |

### 5. Assign trust level

| Origin | License OK | Source Verified | Mods Reviewed | Trust |
|--------|-----------|----------------|---------------|-------|
| authored | N/A | N/A | N/A | HIGH |
| forked | YES | YES | YES | HIGH |
| forked | YES | YES | NO | MEDIUM |
| imported | YES | YES | N/A | MEDIUM |
| generated | N/A | N/A | YES | MEDIUM |
| unknown | * | * | * | UNTRUSTED |

### 6. Document provenance in skill

Add provenance section to SKILL.md:
```markdown
# Provenance
- Origin: [type] from [URL or "this repo"]
- License: [SPDX]
- Modifications: [list or "none"]
- Last audit: [ISO date]
- Trust level: [HIGH|MEDIUM|LOW|UNTRUSTED]
```

## Output contract

```markdown
# Provenance Audit: [skill-name]

## Origin
- Type: [authored|forked|imported|generated|unknown]
- Source: [URL or "this repo"]
- License: [SPDX]

## Trust Assessment
- License: [PASS|WARN|FAIL]
- Source verified: [YES|NO|UNABLE]
- Modifications reviewed: [YES|NO|N/A]
- Overall trust: [HIGH|MEDIUM|LOW|UNTRUSTED]

## Recommendation
[Action to take]
```

## Failure handling

- **Cannot reach source URL**: Mark "source unverified", lower trust level
- **License unclear**: Flag for manual review, do not auto-adopt
- **Conflicting provenance claims**: Report conflict, require manual resolution
- **Skill has no frontmatter**: Treat as unknown origin, untrusted

## References

- SPDX license identifiers: https://spdx.org/licenses/
