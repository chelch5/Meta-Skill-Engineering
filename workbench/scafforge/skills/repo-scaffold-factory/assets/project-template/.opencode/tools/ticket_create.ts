import { tool } from "@opencode-ai/plugin"
import {
  assertValidTicketId,
  DEFAULT_OVERLAP_RISK,
  getTicket,
  loadManifest,
  loadWorkflowState,
  saveManifest,
  saveWorkflowState,
  setPlanApprovedForTicket,
  syncWorkflowSelection,
  ticketFilePath,
} from "./_workflow"

export default tool({
  description: "Create a guarded follow-up ticket from a verified backlog-verifier finding during a process-verification window.",
  args: {
    id: tool.schema.string().describe("New ticket id."),
    title: tool.schema.string().describe("New ticket title."),
    lane: tool.schema.string().describe("Owning lane or project area."),
    wave: tool.schema.number().int().describe("Execution wave number."),
    summary: tool.schema.string().describe("Ticket summary."),
    acceptance: tool.schema.array(tool.schema.string()).describe("Acceptance criteria list."),
    depends_on: tool.schema.array(tool.schema.string()).describe("Dependency ticket ids.").optional(),
    decision_blockers: tool.schema.array(tool.schema.string()).describe("Unresolved blockers for this ticket.").optional(),
    parallel_safe: tool.schema.boolean().describe("Whether the ticket can be advanced in a parallel lane when dependencies are satisfied.").optional(),
    overlap_risk: tool.schema.enum(["low", "medium", "high"]).describe("Expected overlap risk with other tickets.").optional(),
    source_ticket_id: tool.schema.string().describe("Done ticket that produced the verification finding."),
    verification_artifact_path: tool.schema.string().describe("Canonical backlog-verification artifact path from the verifier."),
    activate: tool.schema.boolean().describe("Whether to make the new ticket active immediately.").optional(),
  },
  async execute(args) {
    const manifest = await loadManifest()
    const workflow = await loadWorkflowState()
    const ticketId = assertValidTicketId(args.id.trim())
    const title = args.title.trim()
    const lane = args.lane.trim()
    const summary = args.summary.trim()
    const sourceTicketId = args.source_ticket_id.trim()
    const acceptance = args.acceptance.map((item) => item.trim()).filter(Boolean)
    const dependsOn = [...new Set((args.depends_on || []).map((item) => item.trim()).filter(Boolean))]
    const decisionBlockers = (args.decision_blockers || []).map((item) => item.trim()).filter(Boolean)
    const verificationArtifactPath = args.verification_artifact_path.trim()

    if (!workflow.pending_process_verification) {
      throw new Error("Guarded ticket creation is only available while post-migration verification is pending.")
    }

    if (!title) {
      throw new Error("Ticket title must not be empty.")
    }

    if (!lane) {
      throw new Error("Ticket lane must not be empty.")
    }

    if (!summary) {
      throw new Error("Ticket summary must not be empty.")
    }

    if (args.wave < 0) {
      throw new Error(`Ticket wave must be zero or greater: ${args.wave}`)
    }

    if (acceptance.length === 0) {
      throw new Error("At least one acceptance criterion is required.")
    }

    if (dependsOn.includes(ticketId)) {
      throw new Error(`Ticket ${ticketId} cannot depend on itself.`)
    }

    if (manifest.tickets.some((ticket) => ticket.id === ticketId)) {
      throw new Error(`Ticket already exists: ${ticketId}`)
    }

    for (const dependency of dependsOn) {
      getTicket(manifest, dependency)
    }

    const sourceTicket = getTicket(manifest, sourceTicketId)
    if (sourceTicket.status !== "done") {
      throw new Error(`Source ticket ${sourceTicket.id} must be done before creating a migration follow-up ticket.`)
    }
    const verificationArtifact = sourceTicket.artifacts.find(
      (artifact) =>
        artifact.path === verificationArtifactPath &&
        artifact.stage === "review" &&
        artifact.kind === "backlog-verification",
    )
    if (!verificationArtifact) {
      throw new Error(
        `Source ticket ${sourceTicket.id} does not have a registered review/backlog-verification artifact at ${verificationArtifactPath}.`,
      )
    }

    const ticket = {
      id: ticketId,
      title,
      wave: args.wave,
      lane,
      parallel_safe: args.parallel_safe ?? false,
      overlap_risk: args.overlap_risk ?? DEFAULT_OVERLAP_RISK,
      stage: "planning",
      status: decisionBlockers.length > 0 ? "blocked" : "todo",
      depends_on: dependsOn,
      summary,
      acceptance,
      decision_blockers: decisionBlockers,
      artifacts: [],
    }

    manifest.tickets.push(ticket)
    if (args.activate) {
      setPlanApprovedForTicket(workflow, ticket.id, false)
      manifest.active_ticket = ticket.id
      syncWorkflowSelection(workflow, manifest)
    }

    await saveManifest(manifest)
    if (args.activate) {
      await saveWorkflowState(workflow)
    }
    const path = ticketFilePath(ticket.id)

    return JSON.stringify(
      {
        created_ticket: ticket.id,
        path,
        status: ticket.status,
        source_ticket_id: sourceTicket.id,
        verification_artifact_path: verificationArtifact.path,
        activated: Boolean(args.activate),
      },
      null,
      2,
    )
  },
})
