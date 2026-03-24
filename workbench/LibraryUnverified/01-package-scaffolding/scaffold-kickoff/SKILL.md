---
name: scaffold-kickoff
description: "Orchestrate the full spec-to-repo kickoff flow for greenfield or early-stage projects. Use when asked to scaffold, generate, or bootstrap a new project repository from specs, plans, or requirements. This is the single entrypoint — it sequences all sibling skills automatically. Do not use for adding features to an already-scaffolded repo (use ticket execution) or for normalizing specs alone (use spec-pack-normalizer)."
---

# Scaffold Kickoff

This is the default entrypoint for project scaffolding. When a user asks to scaffold a project, start here.

## Decision tree

Before starting, classify the run type:

1. **Greenfield** — No repo exists yet, or the repo contains only specs/plans/notes. Follow the full 10-step workflow below.
2. **Retrofit** — A repo with code already exists but needs the agent operating layer added. Run `spec-pack-normalizer` first if the project lacks a canonical brief, then skip to step 4 (agent team bootstrap), and continue from step 5.
3. **Refinement** — A scaffolded repo exists but needs its tickets, skills, or agents improved. Jump directly to the specific sibling skill needed.

## Full greenfield workflow

Follow these steps in order. Each step references a sibling skill — read it at the relative path shown.

### Step 1: Normalize the spec pack

Read `../spec-pack-normalizer/SKILL.md` and follow its procedure.

Scan the workspace for project inputs:
- Look for `*.md` files, `docs/`, `specs/`, `plans/`, `requirements/`, `notes/`, `design/` directories
- Look for pasted chats, informal notes, architecture docs, API specs
- Read everything you find

Produce a canonical brief at `docs/spec/CANONICAL-BRIEF.md` (or `docs/BRIEF.md` for non-OpenCode repos) with all required sections defined in the spec-pack-normalizer schema.

**Gate:** Canonical brief must exist with all required sections populated.

### Step 2: Resolve ambiguities

Before proceeding, present the user with a **batched decision packet** for any blocking ambiguities:
- Project name, slug, destination path
- Agent configuration prefix (if applicable)
- Model provider and model choices (planner, implementer, utility)
- Stack/framework choices
- Any other materially divergent decisions

Do NOT guess at these. Ask the user explicitly. Do NOT proceed until blocking decisions are resolved.

**Gate:** All blocking decisions resolved or explicitly recorded.

### Step 3: Generate the base scaffold

Read `../repo-scaffold-factory/SKILL.md` and follow its procedure.

This produces the repository file tree:
- README.md, AGENTS.md, docs skeleton, .github templates
- Agent configuration directory (`.opencode/`, `.copilot/`, `.codex/`, or equivalent)
- Ticket directory structure

For clients that support script-assisted generation (e.g., OpenCode with Scafforge), this has two phases:
- **Phase A**: Run the scaffold script to generate template files with placeholder substitution
- **Phase B**: Customize generated files with project-specific content from the canonical brief

**Gate:** Repository structure exists with README.md, AGENTS.md, and docs skeleton.

### Step 4: Design and customize the agent team

Read `../opencode-team-bootstrap/SKILL.md` and follow its procedure.

Customize the agent team for this specific project:
- Rewrite agent prompts to be project-specific
- Add or remove agents based on project type
- Create multiple implementer-type agents if the project spans different domains
- Set appropriate permissions, tool access, and delegation boundaries

**Gate:** Agent definitions exist with project-specific prompts and permissions.

### Step 5: Build the ticket backlog

Read `../ticket-pack-builder/SKILL.md` and follow its procedure in bootstrap mode.

Create implementation-ready tickets from the canonical brief:
- Break work into implementation waves (foundation → core → secondary → polish)
- Each ticket small enough for one agent session
- Unresolved decisions become blocked/decision tickets, not guesses

**Gate:** Ticket manifest exists with at least one actionable ticket.

### Step 6: Bootstrap project-local skills

Read `../project-skill-bootstrap/SKILL.md` and follow its procedure.

- Foundation mode: populate baseline skills with actual project data
- Synthesis mode: create stack/domain-specific skills from project evidence and external research (reference only, never auto-install)

**Gate:** Project-local skills exist with real content, no placeholders.

### Step 7: Harden agent prompts (if needed)

Read `../agent-prompt-engineering/SKILL.md` and follow its procedure.

Apply when:
- The chosen models need specific prompting techniques
- Agent prompts need tighter scope or anti-doom-loop behavior
- Stage contracts need project-specific hardening

Skip if the agent team is already robust for the chosen models.

### Step 8: Audit the generated repo

Read `../repo-process-doctor/SKILL.md` and follow its procedure.

Run the audit against the freshly generated repo. Fix any safe-repair findings. Escalate intent-changing findings to the user.

**Gate:** Audit passes clean or all findings addressed.

### Step 9: Write the handoff surface

Read `../handoff-brief/SKILL.md` and follow its procedure.

Generate `START-HERE.md` with actual project state so the repo can be resumed by another agent or session.

**Gate:** START-HERE.md exists with all sections populated with real content.

### Step 10: Done checklist

The scaffold is complete when ALL of these exist:
- Canonical brief with real project content (not template placeholders)
- Ticket manifest with implementation-ready tickets
- Board view showing the work queue
- Agent definitions with project-specific prompts and permissions
- Agent tools, plugins, and commands (if applicable to the client)
- Project-local skills with real content
- START-HERE.md with current project state
- A clean audit from repo-process-doctor

## Output contract

- A canonical brief that separates facts, assumptions, and open questions
- A decision packet that records blocking vs non-blocking ambiguities
- A scaffolded repo with README.md, AGENTS.md, START-HERE.md, docs, and tickets
- A structured truth hierarchy with clear ownership for facts, queue state, transient workflow state, artifacts, provenance, and handoff
- The agent operating layer — customized for this specific project and client
- A process audit confirming the generated repo is clean
- A handoff surface that another machine or session can resume from

## Rules

- Prefer this umbrella flow for greenfield work instead of manually starting with lower-level skills
- Keep generated docs and prompts weak-model friendly: short sections, explicit steps, obvious source-of-truth files
- If the repo already exists and only needs the agent layer, switch to the relevant team-bootstrap skill instead of forcing a full scaffold reset
- When the stack is still unknown, keep the scaffold framework-agnostic and record unresolved choices in the canonical brief
- Do not let ticket-pack-builder fabricate implementation detail for unresolved major decisions
- Preserve exact model/provider strings and project names when the source material specifies them
- Do not ship a repo-local workflow until a doctor pass confirms it is clean
- Leave review-audit-bridge for later implementation and QA cycles — it is not part of the initial scaffold flow

## Failure handling

- **Missing specs**: Stop and request minimum viable input (problem statement + target users + rough scope)
- **Ambiguous stack**: Emit stack profile with `confidence: low` flag and list alternatives; proceed with most likely choice but document uncertainty
- **Partial completion**: Commit whatever was generated with `WIP:` prefix; log which phase failed
- **Conflicting constraints**: Surface as decision items in the canonical brief rather than making silent choices
- **Gate failure at any step**: Stop, report which gate failed and what's missing, do not proceed past a failed gate
