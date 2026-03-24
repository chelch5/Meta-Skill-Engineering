import { tool } from "@opencode-ai/plugin"
import {
  contextSnapshotPath,
  getTicket,
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

    if (args.ticket_id) {
      workflow.active_ticket = ticket.id
      workflow.stage = ticket.stage
      workflow.status = ticket.status
    }

    const content = renderContextSnapshot(manifest, workflow, args.note)
    const path = contextSnapshotPath()
    await writeText(path, content)

    return JSON.stringify({ path, ticket_id: ticket.id }, null, 2)
  },
})
