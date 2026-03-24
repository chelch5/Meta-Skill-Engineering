---
name: stack-profile-detector
description: "Detect a project's language, framework, runtime, testing setup, and deployment target from repository contents and produce a structured STACK-PROFILE.md. Use when scaffolding a new project and need to determine stack from code evidence, onboarding to an existing repo with unknown stack, or generating stack-specific skills. Do not use when stack is already documented in STACK-PROFILE.md or for repos with no code (infer from specs instead)."
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode, github-copilot]
---

# Stack Profile Detector

Detects a project's stack profile from repository contents and produces a structured document.

## Procedure

### 1. Scan for manifest files

```bash
ls -la package.json Cargo.toml pyproject.toml setup.py go.mod pom.xml \
       build.gradle *.csproj Gemfile composer.json 2>/dev/null
```

Priority (if multiple exist): package.json > Cargo.toml > pyproject.toml > go.mod > pom.xml

### 2. Detect primary language

| Evidence | Language | Confidence |
|----------|----------|------------|
| package.json + tsconfig.json | TypeScript | High |
| package.json (no tsconfig) | JavaScript | High |
| Cargo.toml | Rust | High |
| pyproject.toml / requirements.txt | Python | High |
| go.mod | Go | High |
| pom.xml / build.gradle | Java/Kotlin | High |
| *.csproj / *.sln | C# | High |
| Only source files, no manifest | (inferred) | Medium |

### 3. Detect framework

**Node.js/TypeScript:**
```bash
deps=$(cat package.json 2>/dev/null | jq -r '(.dependencies + .devDependencies) | keys[]')
# next → Next.js, react → React, express → Express, fastify → Fastify, etc.
```

**Python:** Check for fastapi, django, flask in requirements/pyproject.

**Rust:** Check for axum, actix, rocket in Cargo.toml.

### 4. Detect testing, build, and deployment

| Category | Evidence | Result |
|----------|----------|--------|
| Test framework | vitest/jest/pytest/cargo test in config | Named framework |
| Build tool | Next.js/Vite/Webpack/Cargo in config | Named tool |
| Cloud target | vercel.json/serverless.yml/Dockerfile | Named platform |
| Package manager | pnpm-lock/yarn.lock/Cargo.lock | Named manager |

### 5. Generate STACK-PROFILE.md

```markdown
# Stack Profile
Generated: [ISO date]
Confidence: [HIGH | MEDIUM | LOW]

## Primary Stack
- **Language:** [detected]
- **Runtime:** [detected]
- **Framework:** [detected]
- **Package Manager:** [detected]

## Testing
- **Framework:** [detected]
- **Command:** [detected]

## Build
- **Tool:** [detected]
- **Command:** [detected]

## Deployment
- **Target:** [detected or "unknown"]

## Evidence
Detection based on: [list of files examined]
```

### 6. Handle ambiguous cases

If detection is uncertain (confidence LOW):
```markdown
## Unresolved
- [Question 1]: [Options found]
- [Question 2]: [Options found]

## Action Required
Please confirm: [specific questions]
```

## Output contract

File: `docs/STACK-PROFILE.md` (or path specified by scaffolding flow)

Contains: language, runtime, framework, package manager, test setup, build config, deployment target, confidence level, and evidence list.

## Failure handling

- **No manifest files**: Check for source files (.ts, .py, .rs), infer language, mark confidence LOW
- **Multiple conflicting manifests**: Likely monorepo — detect per package/workspace
- **Empty repository**: Cannot detect. Require specs from user or canonical brief.
- **Unusual setup**: Document what was found, flag for manual review
