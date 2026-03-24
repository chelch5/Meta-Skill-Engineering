import { tool } from "@opencode-ai/plugin"
import { appendJsonl, invocationLogPath } from "./_workflow"

export default tool({
  description: "Record that a project or global skill was intentionally invoked in this repo.",
  args: {
    skill_id: tool.schema.string().describe("The skill identifier or slug."),
    scope: tool.schema.enum(["project", "global"]).describe("Whether the skill is local to the repo or part of a global pack."),
    note: tool.schema.string().describe("Optional context about why the skill was loaded.").optional(),
  },
  async execute(args, context) {
    const event = {
      event: "skill_ping",
      timestamp: new Date().toISOString(),
      session_id: context.sessionID,
      message_id: context.messageID,
      agent: context.agent,
      skill_id: args.skill_id,
      scope: args.scope,
      note: args.note ?? null,
    }

    const path = invocationLogPath(context.directory)
    await appendJsonl(path, event)

    return JSON.stringify(
      {
        recorded: true,
        path,
        event,
      },
      null,
      2,
    )
  },
})
