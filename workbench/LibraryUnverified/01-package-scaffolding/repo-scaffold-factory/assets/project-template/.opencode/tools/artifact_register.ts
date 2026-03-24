import { tool } from "@opencode-ai/plugin"
import { stat } from "node:fs/promises"
import { defaultArtifactPath, getTicket, loadManifest, normalizeRepoPath, saveManifest } from "./_workflow"

export default tool({
  description: "Register an existing canonical planning, implementation, review, QA, or handoff artifact.",
  args: {
    ticket_id: tool.schema.string().describe("Ticket id that owns the artifact."),
    path: tool.schema.string().describe("Repo-relative path to the artifact."),
    kind: tool.schema.string().describe("Artifact kind, for example plan, review, qa, handoff, or note."),
    stage: tool.schema.string().describe("Workflow stage associated with the artifact."),
    summary: tool.schema.string().describe("Short artifact summary.").optional(),
  },
  async execute(args) {
    const manifest = await loadManifest()
    const ticket = getTicket(manifest, args.ticket_id)
    const resolvedPath = normalizeRepoPath(args.path)
    const expectedPath = defaultArtifactPath(ticket.id, args.stage, args.kind)

    if (resolvedPath !== expectedPath) {
      throw new Error(`Artifact path must be the canonical path: ${expectedPath}`)
    }

    const fileInfo = await stat(resolvedPath).catch(() => undefined)
    if (!fileInfo?.isFile()) {
      throw new Error(`Artifact file does not exist at ${resolvedPath}. Write it with artifact_write before registering it.`)
    }

    ticket.artifacts.push({
      kind: args.kind,
      path: resolvedPath,
      stage: args.stage,
      summary: args.summary,
      created_at: new Date().toISOString(),
    })

    await saveManifest(manifest)

    return JSON.stringify(
      {
        ticket_id: ticket.id,
        artifact_count: ticket.artifacts.length,
        latest_artifact: ticket.artifacts[ticket.artifacts.length - 1],
      },
      null,
      2,
    )
  },
})
