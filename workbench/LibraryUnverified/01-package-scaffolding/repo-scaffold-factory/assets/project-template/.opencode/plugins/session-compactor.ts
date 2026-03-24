import { type Plugin } from "@opencode-ai/plugin"
import { writeJson } from "../tools/_workflow"

export const SessionCompactor: Plugin = async () => {
  return {
    "experimental.session.compacting": async (input, output) => {
      const note = "Refresh .opencode/state/context-snapshot.md after compaction if ticket state changed."
      output.context.push(note)
      await writeJson(".opencode/state/last-compaction.json", {
        timestamp: new Date().toISOString(),
        session_id: input.sessionID,
        note,
      })
    },
  }
}
