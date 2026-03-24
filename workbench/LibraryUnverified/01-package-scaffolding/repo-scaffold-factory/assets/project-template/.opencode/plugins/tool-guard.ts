import { type Plugin } from "@opencode-ai/plugin"

const DANGEROUS_BASH = /(rm\s+-|git\s+reset|git\s+clean|sudo\s+|chmod\s+777|dd\s+if=)/i

function extractFilePath(args: Record<string, unknown>): string {
  const pathValue = args.filePath || args.path || args.target
  return typeof pathValue === "string" ? pathValue : ""
}

function isEnvPath(pathValue: string): boolean {
  return pathValue.includes(".env") && !pathValue.endsWith(".env.example")
}

export const ToolGuard: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read" || input.tool === "write" || input.tool === "edit") {
        const filePath = extractFilePath(output.args)
        if (filePath && isEnvPath(filePath)) {
          throw new Error("Do not read or modify sensitive .env files.")
        }
      }

      if (input.tool === "bash") {
        const command = typeof output.args.command === "string" ? output.args.command : ""
        if (DANGEROUS_BASH.test(command)) {
          throw new Error("Dangerous shell commands are blocked by the project tool guard.")
        }
      }
    },
  }
}
