---
name: spec-pack-normalizer
description: "Normalize one or more source specs, notes, pasted chats, and Markdown planning documents into a single canonical brief, decision packet, and constraints summary. Use when given messy or multi-file project requirements that need to become a clean source of truth before scaffolding, ticketing, or implementation. Do not use when a canonical brief already exists and is current."
---

# Spec Pack Normalizer

Use this skill to convert messy project inputs into a deterministic brief that weaker models can follow safely.

## Procedure

### 1. Scan the workspace for project inputs

Search for spec-like files opportunistically. Look for:
- `*.md` files in the root, `docs/`, `specs/`, `plans/`, `requirements/`, `notes/`, `design/`
- `README.md`, `SPEC.md`, `REQUIREMENTS.md`, `PRD.md`, `DESIGN.md`
- Any directory that looks like it contains project planning material
- Pasted chat logs, informal notes, architecture documents
- API specifications (OpenAPI, GraphQL schemas, etc.)
- Existing code if this is a retrofit (scan for structure, not implementation)

Read primary specs first, then supporting material.

### 2. Extract durable facts

From everything you read, extract ONLY:
- **Durable facts**: what is being built, why, for whom
- **Constraints**: platform, runtime, model, process, integration
- **Desired outcomes**: goals and success criteria
- **Explicit non-goals**: what is NOT being built
- **Stated preferences**: stack choices, model choices, tooling

Separate facts from assumptions. Mark each clearly.

### 3. Identify contradictions and ambiguities

- Resolve obvious duplication by preferring the most specific or latest source
- Do NOT smooth over meaningful disagreements — call them out
- Create a **batched decision packet** for all blocking ambiguities:
  - **Blocking**: choices that materially change implementation (stack, provider, model, architecture)
  - **Non-blocking**: open questions that don't prevent the first execution wave

### 4. Present the decision packet

Present ALL blocking ambiguities to the user at once. Do not ask one at a time. Include:
- What the ambiguity is
- What the options are (if known)
- What the implications of each option are
- Which option you recommend and why (if you have enough information)

Wait for user decisions before proceeding.

### 5. Write the canonical brief

Write to `docs/spec/CANONICAL-BRIEF.md` (or `docs/BRIEF.md` for simpler repos).

Required sections (all 12 must be present):

1. **Project Summary** — one paragraph, what and why
2. **Goals** — flat bullet list of desired outcomes
3. **Non-Goals** — flat bullet list of explicit exclusions
4. **Constraints** — platform, runtime, model, process, integration
5. **Required Outputs** — repo structure, docs, agent/tool outputs, validation
6. **Tooling and Model Constraints** — provider, models, runtime, host
7. **Canonical Truth Map** — which file owns which kind of state
8. **Blocking Decisions** — resolved choices from the decision packet
9. **Non-Blocking Open Questions** — things that don't block the first wave
10. **Backlog Readiness** — whether ticketing can proceed, which areas are blocked
11. **Acceptance Signals** — what must be true for the result to be usable
12. **Assumptions** — non-blocking assumptions that don't silently decide major behavior

### 6. Validate

Verify the brief:
- All 12 sections are present and non-empty
- Facts and assumptions are separated
- Blocking decisions are all resolved (or explicitly recorded as blocked)
- Backlog readiness clearly states whether the first execution wave can be detailed
- Exact product names, provider strings, and model identifiers are preserved
- Brief is concise enough for weaker models to load

## Output contract

A single `CANONICAL-BRIEF.md` file containing all 12 sections, plus a decision packet log if ambiguities were resolved during the run.

## Rules

- Prefer opportunistic intake over rigid required input structure
- Do not invent implementation detail for work that depends on unresolved choices
- Do not hide contradictions — call them out in Open Questions
- Keep the brief concise enough for weaker models to load
- Preserve exact names, providers, and model strings when specified
- Separate facts from assumptions explicitly

## Failure handling

- **No source material found**: Stop. Request minimum viable input (problem statement + target users + rough scope)
- **Contradictions between sources**: Call out in Open Questions; do not silently pick a winner
- **Source material is a single vague paragraph**: Extract what exists, mark everything else as Open Questions, present decision packet
- **Too many blocking decisions**: Prioritize by impact; present the top 3-5 most critical first

## References

- Brief schema: defined in this skill's `references/brief-schema.md` (if available)
- This is step 1 of the scaffold-kickoff flow — return to `../scaffold-kickoff/SKILL.md` step 2 after completion
