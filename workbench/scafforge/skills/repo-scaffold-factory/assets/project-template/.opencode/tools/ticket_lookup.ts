import { tool } from "@opencode-ai/plugin"
import { readFile } from "node:fs/promises"
import {
  getTicket,
  hasArtifact,
  hasReviewArtifact,
  isPlanApprovedForTicket,
  latestArtifact,
  latestReviewArtifact,
  loadManifest,
  loadWorkflowState,
  ticketNeedsProcessVerification,
  ticketsNeedingProcessVerification,
} from "./_workflow"

export default tool({
  description: "Resolve the active ticket or a requested ticket from tickets/manifest.json.",
  args: {
    ticket_id: tool.schema.string().describe("Optional ticket id to resolve. Defaults to the active ticket.").optional(),
    include_artifact_contents: tool.schema.boolean().describe("Whether to include the latest artifact bodies for the resolved ticket.").optional(),
  },
  async execute(args) {
    const manifest = await loadManifest()
    const workflow = await loadWorkflowState()
    const ticket = getTicket(manifest, args.ticket_id)
    const resolvedWorkflow = args.ticket_id
      ? {
          ...workflow,
          active_ticket: ticket.id,
          stage: ticket.stage,
          status: ticket.status,
          approved_plan: isPlanApprovedForTicket(workflow, ticket.id),
        }
      : workflow
    const latestPlan = latestArtifact(ticket, { stage: "planning" }) || null
    const latestImplementation = latestArtifact(ticket, { stage: "implementation" }) || null
    const latestReview = latestReviewArtifact(ticket) || null
    const latestBacklogVerification = latestArtifact(ticket, { stage: "review", kind: "backlog-verification" }) || null
    const latestQa = latestArtifact(ticket, { stage: "qa" }) || null

    const artifactSummary = {
      has_plan: hasArtifact(ticket, { stage: "planning" }),
      has_implementation: hasArtifact(ticket, { stage: "implementation" }),
      has_review: hasReviewArtifact(ticket),
      has_qa: hasArtifact(ticket, { stage: "qa" }),
      latest_plan: latestPlan,
      latest_implementation: latestImplementation,
      latest_review: latestReview,
      latest_backlog_verification: latestBacklogVerification,
      latest_qa: latestQa,
    }
    const affectedDoneTickets = ticketsNeedingProcessVerification(manifest, workflow).map((item) => ({
      id: item.id,
      title: item.title,
      latest_qa: latestArtifact(item, { stage: "qa" }) || null,
      latest_backlog_verification: latestArtifact(item, { stage: "review", kind: "backlog-verification" }) || null,
    }))
    const artifactBodies = args.include_artifact_contents
      ? {
          latest_plan: latestPlan
            ? { ...latestPlan, content: await readFile(latestPlan.path, "utf-8").catch(() => null) }
            : null,
          latest_implementation: latestImplementation
            ? { ...latestImplementation, content: await readFile(latestImplementation.path, "utf-8").catch(() => null) }
            : null,
          latest_review: latestReview
            ? { ...latestReview, content: await readFile(latestReview.path, "utf-8").catch(() => null) }
            : null,
          latest_backlog_verification: latestBacklogVerification
            ? { ...latestBacklogVerification, content: await readFile(latestBacklogVerification.path, "utf-8").catch(() => null) }
            : null,
          latest_qa: latestQa
            ? { ...latestQa, content: await readFile(latestQa.path, "utf-8").catch(() => null) }
            : null,
        }
      : undefined

    return JSON.stringify(
      {
        project: manifest.project,
        active_ticket: manifest.active_ticket,
        workflow: resolvedWorkflow,
        ticket,
        artifact_summary: artifactSummary,
        artifact_bodies: artifactBodies,
        process_verification: {
          pending: workflow.pending_process_verification,
          process_changed_at: workflow.process_last_changed_at,
          current_ticket_requires_verification: ticketNeedsProcessVerification(ticket, workflow),
          affected_done_tickets: affectedDoneTickets,
        },
      },
      null,
      2,
    )
  },
})
