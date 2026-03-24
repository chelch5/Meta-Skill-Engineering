import { type Plugin } from "@opencode-ai/plugin"
import { getTicket, hasArtifact, isPlanApprovedForTicket, loadManifest, loadWorkflowState } from "../tools/_workflow"

const SAFE_BASH = /^(pwd|ls|find|rg|grep|cat|head|tail|git status|git diff|git log)\b/i

function extractFilePath(args: Record<string, unknown>): string {
  const pathValue = args.filePath || args.path || args.target
  return typeof pathValue === "string" ? pathValue : ""
}

function isDocPath(pathValue: string): boolean {
  return (
    pathValue.startsWith("docs/") ||
    pathValue.startsWith("tickets/") ||
    pathValue.startsWith(".opencode/") ||
    pathValue.endsWith("README.md") ||
    pathValue.endsWith("AGENTS.md") ||
    pathValue.endsWith("START-HERE.md")
  )
}

export const StageGateEnforcer: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      const workflow = await loadWorkflowState().catch(() => undefined)
      if (!workflow) {
        return
      }
      const activeApprovedPlan = isPlanApprovedForTicket(workflow, workflow.active_ticket)

      if (input.tool === "bash") {
        const command = typeof output.args.command === "string" ? output.args.command : ""
        if (!activeApprovedPlan && !SAFE_BASH.test(command)) {
          throw new Error("The active ticket needs an approved plan before running implementation-oriented shell commands.")
        }
      }

      if (input.tool === "write" || input.tool === "edit") {
        const filePath = extractFilePath(output.args)
        if (!activeApprovedPlan && (!filePath || !isDocPath(filePath))) {
          throw new Error("The active ticket needs an approved plan before editing implementation files.")
        }
      }

      if (input.tool === "ticket_update") {
        const manifest = await loadManifest()
        const ticketId = typeof output.args.ticket_id === "string" ? output.args.ticket_id : manifest.active_ticket
        const ticket = getTicket(manifest, ticketId)
        const nextStatus = typeof output.args.status === "string" ? output.args.status : ""
        const approving = typeof output.args.approved_plan === "boolean" ? output.args.approved_plan : undefined

        if (approving && !hasArtifact(ticket, { stage: "planning" })) {
          throw new Error("Planning artifact required before marking the workflow as approved.")
        }

        if (nextStatus === "in_progress" && !isPlanApprovedForTicket(workflow, ticket.id) && approving !== true) {
          throw new Error(`Approved plan required before moving ${ticket.id} to in_progress.`)
        }
      }
    },
  }
}
