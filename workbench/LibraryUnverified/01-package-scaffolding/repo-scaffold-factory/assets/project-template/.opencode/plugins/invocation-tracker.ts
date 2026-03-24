import { type Plugin } from "@opencode-ai/plugin"
import { appendJsonl, invocationLogPath } from "../tools/_workflow"

export const InvocationTracker: Plugin = async (pluginInput) => {
  const path = invocationLogPath(pluginInput.directory)
  const timestamp = () => new Date().toISOString()

  return {
    "chat.message": async (input, output) => {
      await appendJsonl(path, {
        event: "chat.message",
        timestamp: timestamp(),
        session_id: input.sessionID,
        agent: input.agent ?? null,
        message_id: input.messageID ?? null,
        model: input.model ?? null,
        variant: input.variant ?? null,
        part_count: output.parts.length,
      })
    },
    "command.execute.before": async (input) => {
      await appendJsonl(path, {
        event: "command.execute.before",
        timestamp: timestamp(),
        session_id: input.sessionID,
        command: input.command,
        arguments: input.arguments,
      })
    },
    "tool.execute.before": async (input, output) => {
      await appendJsonl(path, {
        event: "tool.execute.before",
        timestamp: timestamp(),
        session_id: input.sessionID,
        tool: input.tool,
        call_id: input.callID,
        args: output.args,
      })
    },
    "tool.execute.after": async (input, output) => {
      await appendJsonl(path, {
        event: "tool.execute.after",
        timestamp: timestamp(),
        session_id: input.sessionID,
        tool: input.tool,
        call_id: input.callID,
        args: input.args,
        title: output.title,
        metadata: output.metadata ?? null,
      })
    },
  }
}
