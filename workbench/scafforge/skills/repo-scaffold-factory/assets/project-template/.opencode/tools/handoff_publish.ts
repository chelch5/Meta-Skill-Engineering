import { tool } from "@opencode-ai/plugin"
import {
  bootstrapProvenancePath,
  mergeStartHere,
  latestHandoffPath,
  loadManifest,
  loadWorkflowState,
  readJson,
  renderStartHere,
  startHerePath,
  writeText,
} from "./_workflow"
import { readFile } from "node:fs/promises"

export default tool({
  description: "Publish the top-level START-HERE handoff and the latest handoff copy in .opencode/state.",
  args: {
    next_action: tool.schema.string().describe("Optional explicit next action.").optional(),
  },
  async execute(args) {
    const manifest = await loadManifest()
    const workflow = await loadWorkflowState()
    const provenance = await readJson<{
      workflow_contract?: {
        post_migration_verification?: {
          backlog_verifier_agent?: string
        }
      }
    }>(bootstrapProvenancePath(), {})
    const backlogVerifierAgent = provenance.workflow_contract?.post_migration_verification?.backlog_verifier_agent
    const content = renderStartHere(manifest, workflow, {
      nextAction: args.next_action,
      backlogVerifierAgent: typeof backlogVerifierAgent === "string" ? backlogVerifierAgent : undefined,
    })

    const startHere = startHerePath()
    const handoffCopy = latestHandoffPath()
    const existingStartHere = await readFile(startHere, "utf-8").catch(() => "")
    await writeText(startHere, mergeStartHere(existingStartHere, content))
    await writeText(handoffCopy, content)

    return JSON.stringify({ start_here: startHere, latest_handoff: handoffCopy }, null, 2)
  },
})
