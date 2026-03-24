import { tool } from "@opencode-ai/plugin"
import { defaultArtifactPath, getTicket, loadManifest, normalizeRepoPath, writeText } from "./_workflow"

export default tool({
  description: "Write the full body for a canonical planning, implementation, review, QA, or handoff artifact.",
  args: {
    ticket_id: tool.schema.string().describe("Ticket id that owns the artifact."),
    path: tool.schema.string().describe("Repo-relative canonical artifact path."),
    kind: tool.schema.string().describe("Artifact kind, for example plan, review, qa, handoff, or note."),
    stage: tool.schema.string().describe("Workflow stage associated with the artifact."),
    content: tool.schema.string().describe("Full markdown or text body to persist at the canonical artifact path."),
  },
  async execute(args) {
    const manifest = await loadManifest()
    const ticket = getTicket(manifest, args.ticket_id)
    const resolvedPath = normalizeRepoPath(args.path)
    const expectedPath = defaultArtifactPath(ticket.id, args.stage, args.kind)

    if (resolvedPath !== expectedPath) {
      throw new Error(`Artifact path must be the canonical path: ${expectedPath}`)
    }

    await writeText(resolvedPath, args.content)

    return JSON.stringify(
      {
        ticket_id: ticket.id,
        path: resolvedPath,
        bytes: Buffer.byteLength(args.content, "utf8"),
      },
      null,
      2,
    )
  },
})
