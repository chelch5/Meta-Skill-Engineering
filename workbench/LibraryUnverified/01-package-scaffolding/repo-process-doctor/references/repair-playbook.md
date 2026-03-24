# Repair Playbook

## Target architecture

- manifest: machine-readable queue state
- board: derived human board
- ticket files: detailed ticket content
- workflow-state: transient approval and current stage state
- artifact-write tool: writes canonical stage artifact bodies
- registered artifacts: proof for stage transitions

## Migration order

1. simplify ticket status vocabulary
2. add workflow-state and ticket tools
3. remove raw-file stage control from prompts and commands
4. split artifact writing from artifact registration and unify canonical artifact paths
5. keep workflow-state synchronized only from the active ticket
6. preserve curated START-HERE content during handoff publication
7. harden read-only shell agents
8. add artifact proofs for planning, implementation, review, and QA
9. rerun the audit

## DeepHat-style migration notes

- replace `planned` and `approved` ticket statuses with coarse queue status
- move plan approval into workflow state
- replace manual board/manifest synchronization language with ticket-tool language
- write full artifacts through a dedicated artifact-write tool and keep `artifact_register` register-only
- align all artifact guidance on `.opencode/state/artifacts/<ticket-id>/<stage>-<kind>.md`
- update workflow-state from the active ticket only; background ticket edits must not rewrite active stage/status
- merge managed START-HERE handoff blocks instead of overwriting curated repo-specific content
- remove mutating shell loopholes from inspection roles
- narrow preflight commands so they stop at the intended stage
