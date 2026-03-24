import { type Plugin } from "@opencode-ai/plugin"
import { writeJson } from "../tools/_workflow"

const SYNCED_TOOLS = new Set([
  "ticket_update",
  "artifact_write",
  "artifact_register",
  "context_snapshot",
  "handoff_publish",
])

export const TicketSync: Plugin = async () => {
  return {
    "tool.execute.after": async (input) => {
      if (!SYNCED_TOOLS.has(input.tool)) {
        return
      }
      await writeJson(".opencode/state/last-ticket-event.json", {
        tool: input.tool,
        args: input.args,
        timestamp: new Date().toISOString(),
      })
    },
  }
}
