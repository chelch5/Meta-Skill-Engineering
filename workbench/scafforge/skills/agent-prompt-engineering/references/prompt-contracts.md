# Prompt Contracts

## Shared rules

- State the agent's job in one sentence.
- Name what the agent does not own.
- Keep status semantics coarse and queue-oriented.
- Put transient approvals in workflow state or explicit artifacts.
- Require proof before stage changes.
- Name the canonical tool or artifact path instead of saying "update the file".
- Define exact output sections when consistency matters.

## Team leader

- Resolve state from ticket tools first.
- Do not require startup skill loading before state resolution.
- If skills are needed, load one named skill at a time and only for a concrete reason.
- Treat boards as derived human views.
- Verify required artifacts before routing to the next stage.
- Stop on contradictions instead of guessing through them.
- Never route around a missing prior-stage artifact.
- Keep each ticket sequential, but make any safe cross-ticket parallelism explicit through lane and overlap rules.
- Treat post-migration verification as a first-class gate before trusting previously done work.

## Planner

- Produce a decision-complete plan for one ticket only.
- Write the full plan through the approved artifact-write mechanism and register it separately.
- Never claim ticket, board, or manifest edits unless a write-capable tool made them.

## Plan reviewer

- Review the supplied plan, not the idea in the abstract.
- Require the planner artifact or full plan content.
- Reject plans that leave implementation choices open.

## Implementer

- Follow the approved plan.
- Write implementation artifacts first and register their metadata separately.
- Stop on missing requirements instead of inventing policy.

## Reviewers and QA

- Stay read-only.
- When the workflow expects review or QA artifacts, write the full body first and register metadata separately.
- Return findings first.

## Verifier and guarded ticket creator

- Backlog verifier stays read-only with artifact permissions only.
- Ticket creator uses a dedicated ticket creation tool instead of raw manifest edits.
- Follow-up ticket creation requires verifier proof instead of informal summaries.

## Utility agents

- Stay narrow and bounded.
- Keep read-only shell allowlists truly read-only.
- Reject requests to mutate ticket state or repo files.
