# Prompt Anti-Patterns

## Status over evidence

Bad:

- `planned` means a planner output must already exist

Why it fails:

- weaker models route from labels even when the canonical artifact is missing

Safer pattern:

- keep status coarse
- require the actual planner artifact or full plan content before plan review

## Raw-file stage control

Bad:

- update the ticket file, board, and manifest directly to move stages

Why it fails:

- three surfaces drift
- read-only agents get impossible instructions

Safer pattern:

- use ticket tools and workflow state for stage control
- derive the board from manifest state

## Impossible read-only delegation

Bad:

- ask a planner or inspection agent to write repo files

Why it fails:

- the model either hallucinates success or routes around the missing capability

Safer pattern:

- persist artifacts only through write-capable tools
- make capability limits explicit in the prompt

## Broad command follow-on scope

Bad:

- a status or preflight command silently continues the whole workflow

Why it fails:

- the agent over-runs the user's requested scope

Safer pattern:

- keep human entrypoint commands narrow
- state the exact next internal stage and stop if the command is only a summary or preflight action

## Eager skill loading

Bad:

- tell a primary agent to `Load these skills:` before it resolves ticket or workflow state

Why it fails:

- weaker models may call the skill tool immediately with missing or malformed arguments
- the agent burns its first step on setup choreography instead of resolving the actual task state

Safer pattern:

- start from `ticket_lookup` or the canonical state tool first
- tell the agent to load a named skill only when it materially reduces ambiguity
- if the skill tool is used, load one explicit skill name at a time
