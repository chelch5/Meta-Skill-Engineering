import { tool } from "@opencode-ai/plugin"
import { getTicket, hasArtifact, hasReviewArtifact, latestArtifact, latestReviewArtifact, loadManifest, loadWorkflowState } from "./_workflow"

export default tool({
  description: "Resolve the active ticket or a requested ticket from tickets/manifest.json.",
  args: {
    ticket_id: tool.schema.string().describe("Optional ticket id to resolve. Defaults to the active ticket.").optional(),
  },
  async execute(args) {
    const manifest = await loadManifest()
    const workflow = await loadWorkflowState()
    const ticket = getTicket(manifest, args.ticket_id)

    const artifactSummary = {
      has_plan: hasArtifact(ticket, { stage: "planning" }),
      has_implementation: hasArtifact(ticket, { stage: "implementation" }),
      has_review: hasReviewArtifact(ticket),
      has_qa: hasArtifact(ticket, { stage: "qa" }),
      latest_plan: latestArtifact(ticket, { stage: "planning" }) || null,
      latest_review: latestReviewArtifact(ticket) || null,
      latest_qa: latestArtifact(ticket, { stage: "qa" }) || null,
    }

    return JSON.stringify(
      {
        project: manifest.project,
        active_ticket: manifest.active_ticket,
        workflow,
        ticket,
        artifact_summary: artifactSummary,
      },
      null,
      2,
    )
  },
})
