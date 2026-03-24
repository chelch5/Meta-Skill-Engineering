import { tool } from "@opencode-ai/plugin"
import {
  contextSnapshotPath,
  getTicket,
  isPlanApprovedForTicket,
  loadManifest,
  loadWorkflowState,
  renderContextSnapshot,
  writeText,
} from "./_workflow"

export default tool({
  description: "Write a concise context snapshot for the active or requested ticket.",
  args: {
    ticket_id: tool.schema.string().describe("Optional ticket id. Defaults to the active ticket.").optional(),
    note: tool.schema.string().describe("Optional note to append to the snapshot.").optional(),
  },
  async execute(args) {
    const manifest = await loadManifest()
    const workflow = await loadWorkflowState()
    const ticket = getTicket(manifest, args.ticket_id)

    // Use a copy for snapshot rendering to avoid mutating shared state
    const snapshotState = args.ticket_id
      ? { ...workflow, active_ticket: ticket.id, stage: ticket.stage, status: ticket.status, approved_plan: isPlanApprovedForTicket(workflow, ticket.id) }
      : workflow

    const content = renderContextSnapshot(manifest, snapshotState, args.note)
    const path = contextSnapshotPath()
    await writeText(path, content)

    return JSON.stringify({ path, ticket_id: ticket.id }, null, 2)
  },
})
