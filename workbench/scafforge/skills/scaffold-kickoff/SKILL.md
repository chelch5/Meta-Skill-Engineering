---
name: scaffold-kickoff
description: Orchestrate the full spec-to-repo kickoff flow for greenfield or early-stage projects. Use when asked to scaffold, generate, or bootstrap a new project repository from specs, plans, or requirements. This is the single entrypoint — it sequences all other Scafforge skills automatically.
---

# Scaffold Kickoff

This is the default entrypoint. When a user asks you to scaffold a project, use this skill.

## Decision tree

Before starting, classify the run type:

1. **Greenfield** — No repo exists yet, or the repo contains only specs/plans/notes. Follow the full workflow below.
2. **Retrofit** — A repo with code already exists but needs the OpenCode operating layer added. Run `spec-pack-normalizer` first if the project lacks a canonical brief, then skip to `opencode-team-bootstrap` (step 4), and continue from step 5.
3. **Refinement** — A scaffolded repo exists but needs its tickets, skills, or agents improved. Jump to the specific skill needed.

If the repo state and the user's request do not make the run type clear, ask the user before proceeding. Do not silently choose between greenfield, retrofit, and refinement when that choice would materially change scope.

## Full greenfield workflow

Follow these steps in order. Each step references a sibling skill — read it at the relative path shown.

### Step 1: Normalize the spec pack

Read `../spec-pack-normalizer/SKILL.md` and follow its procedure.

Scan the workspace for project inputs:
- Look for `*.md` files, `docs/`, `specs/`, `plans/`, `requirements/`, `notes/`, `design/` directories
- Look for pasted chats, informal notes, architecture docs, API specs
- Read everything you find

Produce a canonical brief at `docs/spec/CANONICAL-BRIEF.md` with the 12 sections defined in the spec-pack-normalizer schema.

### Step 2: Resolve ambiguities

Before proceeding, present the user with a **batched decision packet** for any blocking ambiguities:
- Project name, slug, destination path
- Agent prefix for generated agents
- Model provider and model choices (planner, implementer, utility)
- Stack/framework choices
- Any other materially divergent decisions

Do NOT guess at these. Ask the user explicitly. Do NOT proceed until blocking decisions are resolved.

### Step 3: Generate the base scaffold

Read `../repo-scaffold-factory/SKILL.md` and follow its procedure.

This has two phases:
- **Phase A**: Run the Python script to generate the template file tree with placeholder substitution
- **Phase B**: Customize the generated files with project-specific content from the canonical brief

### Step 4: Design and customize the agent team

Read `../opencode-team-bootstrap/SKILL.md` and follow its procedure.

The script generates generic agent templates. You must now customize them:
- Rewrite agent prompts to be project-specific
- Add or remove agents based on project type (UI app needs different agents than an MCP server)
- Create multiple implementer-type agents if the project spans different domains

### Step 5: Build the ticket backlog

Read `../ticket-pack-builder/SKILL.md` and follow its procedure in bootstrap mode.

Create implementation-ready tickets from the canonical brief:
- Break work into implementation waves
- Each ticket small enough for one agent session
- Unresolved decisions become blocked/decision tickets, not guesses

### Step 6: Bootstrap project-local skills

Read `../project-skill-bootstrap/SKILL.md` and follow its procedure.

- Foundation mode: populate baseline skills with actual project data
- Synthesis mode: create stack/domain-specific skills from project evidence and external research (reference only, never auto-install)

### Step 7: Harden agent prompts

Read `../agent-prompt-engineering/SKILL.md` and follow its procedure.

This pass is required in the standard greenfield scaffold flow.

Adjust the depth of hardening based on:
- The chosen models and any model-specific prompting quirks
- Agent prompts that need tighter scope or anti-doom-loop behavior
- Stage contracts that need project-specific hardening

### Step 8: Audit the generated repo

Read `../repo-process-doctor/SKILL.md` and follow its procedure.

Run the audit script against the freshly generated repo. Fix any safe-repair findings. Escalate intent-changing findings to the user.

### Step 9: Write the handoff surface

Read `../handoff-brief/SKILL.md` and follow its procedure.

Generate `START-HERE.md` with actual project state so the repo can be resumed by another agent or session.

### Step 10: Done

The scaffold is complete when ALL of these exist:
- `docs/spec/CANONICAL-BRIEF.md` with real project content
- `tickets/manifest.json` with implementation-ready tickets
- `tickets/BOARD.md` showing the work queue
- `.opencode/agents/` with project-specific agent prompts
- `.opencode/tools/`, `.opencode/plugins/`, `.opencode/commands/`
- `.opencode/skills/` with project-specific local skills
- `START-HERE.md` with current project state
- A clean audit from repo-process-doctor

## Required outputs

- A canonical brief that separates facts, assumptions, and open questions
- A decision packet that records blocking vs non-blocking ambiguities
- A scaffolded repo with README.md, AGENTS.md, START-HERE.md, docs, and tickets
- A structured truth hierarchy with clear ownership for facts, queue state, transient workflow state, artifacts, provenance, and handoff
- The OpenCode agent, command, tool, plugin, and local skill layer — customized for this specific project
- A process audit confirming the generated repo is clean
- A handoff surface that another machine or session can resume from

## Rules

- Prefer this umbrella flow for greenfield work instead of manually starting with lower-level skills.
- Keep generated docs and prompts weak-model friendly: short sections, explicit steps, obvious source-of-truth files.
- If the repo already exists and only needs the OpenCode layer, switch to opencode-team-bootstrap instead of forcing a full scaffold reset.
- When the stack is still unknown, keep the scaffold framework-agnostic and record unresolved choices in the canonical brief.
- Do not let ticket-pack-builder fabricate implementation detail for unresolved major decisions.
- Preserve exact model/provider strings and project names when the source material specifies them.
- Do not skip `agent-prompt-engineering` during the standard greenfield flow; vary the hardening depth instead.
- Do not ship a repo-local workflow until a doctor pass confirms it is clean.

## Review and QA

Leave implementation-review and QA procedure to the generated repo-local skills and review lanes after the scaffold is complete.
