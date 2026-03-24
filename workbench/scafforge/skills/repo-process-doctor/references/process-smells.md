# Process Smells

## Stage-like backlog statuses

- ticket status tries to encode planner approval or other transient workflow state
- result: agents infer missing artifacts from labels alone

## Contradictory status semantics

- the same status means different things in `docs/process/`, `tickets/README.md`, and `manifest.json`
- result: weak models follow whichever definition they read most recently

## Raw-file stage choreography

- team leader or commands coordinate workflow by editing ticket files, the board, and the manifest directly
- result: drift, loops, and impossible delegation

## Missing workflow-state layer

- no `ticket_lookup`, `ticket_update`, or workflow-state file
- result: the workflow has no explicit transient approval state

## Overloaded artifact tools

- `artifact_register` both writes artifact bodies and registers metadata
- result: weaker models pass a summary string and overwrite the canonical artifact body

## Artifact path drift

- prompts, docs, or skills disagree about canonical artifact paths
- result: agents write proof to the wrong location or treat missing proof as complete

## Workflow vocabulary drift

- tools, workflow-state defaults, and docs use different stage or status terms such as `ready_for_planning` or `code_review`
- result: stage gates and proof checks disagree about whether work may advance

## Workflow-state desync

- `ticket_update` mirrors a background ticket into workflow-state without activating it
- result: stage gates read approval or queue state for the wrong active ticket

## Handoff overwrite

- `handoff_publish` replaces curated `START-HERE.md` content with a generic generated summary
- result: the canonical restart surface loses repo-specific read order, validation, or risk guidance

## Unsafe read-only shell allowlists

- read-only agents still allow commands like `sed *` or `gofmt *`
- result: mutation sneaks through "inspection" roles

## Over-scoped session commands

- a preflight or status command also instructs the agent to continue the entire lifecycle
- result: the agent skips the expected stopping point

## Process change blindness

- the repo cannot tell whether its operating process was replaced or materially upgraded
- result: completed tickets continue to be trusted even after the workflow contract changed

## Missing post-migration verification lane

- the repo can replace its process layer but has no explicit backlog verifier or gated follow-up path
- result: migration issues are either missed or turned into ad hoc tickets with no proof trail
