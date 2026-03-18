---
name: overlay-generator
description: "Generate client-specific overlay files (metadata, permissions, manifests) from a canonical SKILL.md source for different AI agent clients. Use when publishing a skill to multiple ecosystems (Copilot, OpenCode, Codex, Gemini CLI), converting between overlay formats, or validating overlay consistency. Do not use when creating skills for a single client only or when editing skill content (edit SKILL.md first, then regenerate overlays)."
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode, github-copilot]
---

# Overlay Generator

Generates client-specific overlays from a canonical SKILL.md source. Each AI client has different metadata requirements — this skill produces the right format while keeping content authoritative in one place.

## Architecture

```
SKILL.md (canonical source of truth)
    │
    ├── metadata.json      (Copilot overlay)
    ├── permissions.yaml   (OpenCode overlay)
    ├── openai.yaml        (Codex overlay)
    └── manifest.json      (Universal cross-client index)
```

## Procedure

### 1. Parse SKILL.md frontmatter

Extract: `name`, `description`, `license`, `compatibility.clients`, and all metadata fields.

### 2. Generate overlays per target client

For each compatible client, generate the appropriate overlay format:

**Copilot (metadata.json):**
```json
{
  "name": "<name>",
  "version": "1.0.0",
  "description": "<description>",
  "main": "SKILL.md",
  "license": "<license>"
}
```

**OpenCode (permissions.yaml):**
```yaml
name: <name>
description: "<description>"
permissions:
  read: ["src/**/*", "tests/**/*", "docs/**/*"]
  write: ["src/**/*", "tests/**/*"]
```

**Codex (openai.yaml):**
```yaml
name: <name>
description: "<description>"
schema_version: "1.0"
capabilities: [file_read, file_write, shell_execute]
```

### 3. Validate consistency

```bash
# All overlays must reference the same name and description
grep -h "name" metadata.json permissions.yaml openai.yaml 2>/dev/null | sort -u
# Validate JSON/YAML syntax
cat metadata.json | jq . 2>/dev/null
```

### 4. Batch generation (for skill libraries)

```bash
for skill_dir in */; do
  if [ -f "$skill_dir/SKILL.md" ]; then
    # Generate overlays for each skill
  fi
done
```

## Output contract

Per skill:
```
skill-name/
├── SKILL.md           # Canonical source (unchanged)
├── metadata.json      # Copilot overlay (if compatible)
├── permissions.yaml   # OpenCode overlay (if compatible)
└── openai.yaml        # Codex overlay (if compatible)
```

At library root: `skills-manifest.json` indexing all skills and their overlays.

## Failure handling

- **Missing frontmatter field**: Use sensible defaults, log warning
- **Invalid YAML in frontmatter**: Stop, report parse error with line number
- **Client not in compatibility list**: Skip that overlay, log skip
- **Overlay already exists**: Backup existing, regenerate, show diff for review

## References

- Anthropic Skills format: https://github.com/anthropics/skills
- Overlay formats evolve with client releases — check client docs for current schema
