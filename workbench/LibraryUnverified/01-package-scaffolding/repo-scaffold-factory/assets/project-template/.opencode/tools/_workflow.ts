import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

export type Artifact = {
  kind: string
  path: string
  stage: string
  summary?: string
  created_at: string
}

export type Ticket = {
  id: string
  title: string
  lane: string
  stage: string
  status: string
  depends_on: string[]
  summary: string
  acceptance: string[]
  artifacts: Artifact[]
}

export type Manifest = {
  version: number
  project: string
  active_ticket: string
  tickets: Ticket[]
}

export type WorkflowState = {
  active_ticket: string
  stage: string
  status: string
  approved_plan: boolean
}

export type InvocationEvent = {
  event: string
  timestamp: string
  session_id?: string
  message_id?: string
  agent?: string
  tool?: string
  command?: string
  scope?: string
  skill_id?: string
  note?: string
  args?: unknown
  metadata?: unknown
}

export const COARSE_STATUSES = new Set([
  "todo",
  "ready",
  "in_progress",
  "blocked",
  "review",
  "qa",
  "done",
])

export const ARTIFACT_ROOT = ".opencode/state/artifacts"
export const LEGACY_REVIEW_STAGES = new Set(["code_review", "security_review"])
export const START_HERE_MANAGED_START = "<!-- CODEXSETUP:START_HERE_BLOCK START -->"
export const START_HERE_MANAGED_END = "<!-- CODEXSETUP:START_HERE_BLOCK END -->"

export function rootPath(): string {
  return process.cwd()
}

export function normalizeRepoPath(pathValue: string): string {
  return pathValue.replace(/\\/g, "/").replace(/^\.\//, "")
}

export function ticketsManifestPath(root = rootPath()): string {
  return join(root, "tickets", "manifest.json")
}

export function ticketsBoardPath(root = rootPath()): string {
  return join(root, "tickets", "BOARD.md")
}

export function workflowStatePath(root = rootPath()): string {
  return join(root, ".opencode", "state", "workflow-state.json")
}

export function invocationLogPath(root = rootPath()): string {
  return join(root, ".opencode", "state", "invocation-log.jsonl")
}

export function bootstrapProvenancePath(root = rootPath()): string {
  return join(root, ".opencode", "meta", "bootstrap-provenance.json")
}

export function contextSnapshotPath(root = rootPath()): string {
  return join(root, ".opencode", "state", "context-snapshot.md")
}

export function latestHandoffPath(root = rootPath()): string {
  return join(root, ".opencode", "state", "latest-handoff.md")
}

export function startHerePath(root = rootPath()): string {
  return join(root, "START-HERE.md")
}

export function artifactDirectory(ticketId: string): string {
  return `${ARTIFACT_ROOT}/${ticketId}`
}

export function slugForPath(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function defaultArtifactPath(ticketId: string, stage: string, kind: string): string {
  return `${artifactDirectory(ticketId)}/${slugForPath(stage)}-${slugForPath(kind)}.md`
}

export async function readJson<T>(path: string, fallback?: T): Promise<T> {
  try {
    const raw = await readFile(path, "utf-8")
    return JSON.parse(raw) as T
  } catch (error) {
    if (fallback !== undefined) {
      return fallback
    }
    throw error
  }
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8")
}

export async function appendJsonl(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await appendFile(path, `${JSON.stringify(value)}\n`, "utf-8")
}

export async function writeText(path: string, value: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, value, "utf-8")
}

export async function loadManifest(root = rootPath()): Promise<Manifest> {
  return readJson<Manifest>(ticketsManifestPath(root))
}

export async function saveManifest(manifest: Manifest, root = rootPath()): Promise<void> {
  await writeJson(ticketsManifestPath(root), manifest)
  await writeText(ticketsBoardPath(root), renderBoard(manifest))
}

export async function loadWorkflowState(root = rootPath()): Promise<WorkflowState> {
  const fallback: WorkflowState = {
    active_ticket: "UNKNOWN",
    stage: "planning",
    status: "ready",
    approved_plan: false,
  }
  return readJson<WorkflowState>(workflowStatePath(root), fallback)
}

export async function saveWorkflowState(state: WorkflowState, root = rootPath()): Promise<void> {
  await writeJson(workflowStatePath(root), state)
}

export function getTicket(manifest: Manifest, ticketId?: string): Ticket {
  const resolvedId = ticketId || manifest.active_ticket
  const ticket = manifest.tickets.find((item) => item.id === resolvedId)
  if (!ticket) {
    throw new Error(`Ticket not found: ${resolvedId}`)
  }
  return ticket
}

export function latestArtifact(ticket: Ticket, options: { kind?: string; stage?: string }): Artifact | undefined {
  return [...ticket.artifacts]
    .reverse()
    .find((artifact) => {
      if (options.kind && artifact.kind !== options.kind) {
        return false
      }
      if (options.stage && artifact.stage !== options.stage) {
        return false
      }
      return true
    })
}

export function hasArtifact(ticket: Ticket, options: { kind?: string; stage?: string }): boolean {
  return latestArtifact(ticket, options) !== undefined
}

export function latestReviewArtifact(ticket: Ticket): Artifact | undefined {
  return latestArtifact(ticket, { stage: "review" }) || [...LEGACY_REVIEW_STAGES].map((stage) => latestArtifact(ticket, { stage })).find(Boolean)
}

export function hasReviewArtifact(ticket: Ticket): boolean {
  return latestReviewArtifact(ticket) !== undefined
}

export function renderBoard(manifest: Manifest): string {
  const rows = manifest.tickets
    .map((ticket) => {
      const dependsOn = ticket.depends_on.length > 0 ? ticket.depends_on.join(", ") : "-"
      return `| ${ticket.id} | ${ticket.title} | ${ticket.stage} | ${ticket.status} | ${dependsOn} |`
    })
    .join("\n")
  return `# Ticket Board\n\n| ID | Title | Stage | Status | Depends On |\n| --- | --- | --- | --- | --- |\n${rows}\n`
}

export function renderContextSnapshot(manifest: Manifest, workflow: WorkflowState, note?: string): string {
  const ticket = getTicket(manifest, workflow.active_ticket)
  const artifactLines =
    ticket.artifacts.length > 0
      ? ticket.artifacts
          .slice(-5)
          .map((artifact) => `- ${artifact.kind}: ${artifact.path} (${artifact.stage})`)
          .join("\n")
      : "- No artifacts recorded yet"

  const noteBlock = note ? `\n## Note\n\n${note}\n` : ""

  return `# Context Snapshot\n\n## Project\n\n${manifest.project}\n\n## Active Ticket\n\n- ID: ${ticket.id}\n- Title: ${ticket.title}\n- Stage: ${ticket.stage}\n- Status: ${ticket.status}\n- Approved plan: ${workflow.approved_plan ? "yes" : "no"}\n\n## Ticket Summary\n\n${ticket.summary}\n\n## Recent Artifacts\n\n${artifactLines}${noteBlock}\n## Next Useful Step\n\nUse the team leader or the next required specialist for the current stage.\n`
}

export function renderStartHere(manifest: Manifest, workflow: WorkflowState, nextAction?: string): string {
  const ticket = getTicket(manifest, workflow.active_ticket)
  return `# START HERE\n\n${START_HERE_MANAGED_START}\n## Project\n\n${manifest.project}\n\n## Current State\n\nThe repo is operating with a ticketed OpenCode workflow.\n\n## Read In This Order\n\n1. README.md\n2. AGENTS.md\n3. docs/spec/CANONICAL-BRIEF.md\n4. docs/process/workflow.md\n5. tickets/BOARD.md\n6. tickets/manifest.json\n\n## Current Ticket\n\n- ID: ${ticket.id}\n- Title: ${ticket.title}\n- Stage: ${ticket.stage}\n- Status: ${ticket.status}\n\n## Validation Status\n\nUpdate this section with project-specific validation results.\n\n## Known Risks\n\n- Replace with live risks as the project evolves.\n\n## Next Action\n\n${nextAction || "Continue the required internal lifecycle from the current ticket stage."}\n${START_HERE_MANAGED_END}\n`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function mergeStartHere(existing: string, rendered: string): string {
  const pattern = new RegExp(`${escapeRegExp(START_HERE_MANAGED_START)}[\\s\\S]*?${escapeRegExp(START_HERE_MANAGED_END)}`, "m")
  const renderedBlock = rendered.match(pattern)
  if (!renderedBlock) {
    return rendered
  }
  if (!existing.trim()) {
    return rendered
  }
  if (!existing.includes(START_HERE_MANAGED_START) || !existing.includes(START_HERE_MANAGED_END)) {
    return existing
  }
  return existing.replace(pattern, renderedBlock[0])
}
