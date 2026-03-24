import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

export type OverlapRisk = "low" | "medium" | "high"
export type ParallelMode = "parallel-lanes" | "sequential"

export type Artifact = {
  kind: string
  path: string
  stage: string
  summary?: string
  created_at: string
}

export type ArtifactRegistryEntry = Artifact & {
  ticket_id: string
}

export type Ticket = {
  id: string
  title: string
  wave: number
  lane: string
  parallel_safe: boolean
  overlap_risk: OverlapRisk
  stage: string
  status: string
  depends_on: string[]
  summary: string
  acceptance: string[]
  decision_blockers: string[]
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
  ticket_state: Record<string, TicketWorkflowState>
  process_version: number
  process_last_changed_at: string | null
  process_last_change_summary: string | null
  pending_process_verification: boolean
  parallel_mode: ParallelMode
}

export type TicketWorkflowState = {
  approved_plan: boolean
}

export type ArtifactRegistry = {
  version: number
  artifacts: ArtifactRegistryEntry[]
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

const TICKET_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

export const COARSE_STATUSES = new Set([
  "todo",
  "ready",
  "in_progress",
  "blocked",
  "review",
  "qa",
  "done",
])

export const ARTIFACT_REGISTRY_ROOT = ".opencode/state/artifacts"
export const LEGACY_REVIEW_STAGES = new Set(["code_review", "security_review"])
export const START_HERE_MANAGED_START = "<!-- SCAFFORGE:START_HERE_BLOCK START -->"
export const START_HERE_MANAGED_END = "<!-- SCAFFORGE:START_HERE_BLOCK END -->"
export const DEFAULT_OVERLAP_RISK: OverlapRisk = "high"
export const DEFAULT_PARALLEL_MODE: ParallelMode = "parallel-lanes"

const TICKET_DEFAULTS = {
  wave: 0,
  parallel_safe: false,
  overlap_risk: DEFAULT_OVERLAP_RISK,
  decision_blockers: [] as string[],
}

type StartHereOptions = {
  nextAction?: string
  backlogVerifierAgent?: string
}

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

export function isValidTicketId(ticketId: string): boolean {
  return TICKET_ID_PATTERN.test(ticketId)
}

export function assertValidTicketId(ticketId: string): string {
  if (!isValidTicketId(ticketId)) {
    throw new Error(`Invalid ticket id: ${ticketId}. Use letters, numbers, hyphens, or underscores only.`)
  }
  return ticketId
}

export function ticketFilePath(ticketId: string, root = rootPath()): string {
  return join(root, "tickets", `${assertValidTicketId(ticketId)}.md`)
}

export function workflowStatePath(root = rootPath()): string {
  return join(root, ".opencode", "state", "workflow-state.json")
}

export function artifactRegistryPath(root = rootPath()): string {
  return join(root, ".opencode", "state", "artifacts", "registry.json")
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

export function artifactStageDirectory(stage: string): string {
  const bucket = slugForPath(stage)
  if (bucket === "planning") return ".opencode/state/plans"
  if (bucket === "implementation") return ".opencode/state/implementations"
  if (bucket === "qa") return ".opencode/state/qa"
  if (bucket === "handoff") return ".opencode/state/handoffs"
  if (bucket === "review" || LEGACY_REVIEW_STAGES.has(stage)) return ".opencode/state/reviews"
  return ".opencode/state/artifacts"
}

export function slugForPath(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function defaultArtifactPath(ticketId: string, stage: string, kind: string): string {
  const directory = artifactStageDirectory(stage)
  return `${directory}/${slugForPath(ticketId)}-${slugForPath(stage)}-${slugForPath(kind)}.md`
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

async function readText(path: string, fallback = ""): Promise<string> {
  try {
    return await readFile(path, "utf-8")
  } catch {
    return fallback
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

function expectObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

function expectNonEmptyString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key]
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is missing required field: ${key}`)
  }
  return value.trim()
}

function expectStringArray(record: Record<string, unknown>, key: string, label: string): string[] {
  const value = record[key]
  if (!Array.isArray(value)) {
    throw new Error(`${label} is missing required list field: ${key}`)
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      throw new Error(`${label}.${key}[${index}] must be a non-empty string`)
    }
    return item.trim()
  })
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.flatMap((item) => (typeof item === "string" && item.trim() ? [item.trim()] : []))
}

function normalizeNullableString(value: unknown): string | null {
  if (value == null) {
    return null
  }
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeOverlapRisk(value: unknown): OverlapRisk {
  return value === "low" || value === "medium" || value === "high" ? value : DEFAULT_OVERLAP_RISK
}

function normalizeParallelMode(value: unknown): ParallelMode {
  return value === "parallel-lanes" || value === "sequential" ? value : DEFAULT_PARALLEL_MODE
}

function normalizeTicketWorkflowState(value: unknown): TicketWorkflowState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { approved_plan: false }
  }
  const state = value as Record<string, unknown>
  return {
    approved_plan: typeof state.approved_plan === "boolean" ? state.approved_plan : false,
  }
}

function normalizeTicketStateMap(value: unknown): Record<string, TicketWorkflowState> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }
  const map = value as Record<string, unknown>
  const normalized: Record<string, TicketWorkflowState> = {}
  for (const [ticketId, rawState] of Object.entries(map)) {
    if (!isValidTicketId(ticketId)) {
      continue
    }
    normalized[ticketId] = normalizeTicketWorkflowState(rawState)
  }
  return normalized
}

function normalizeArtifact(value: unknown, index: number): Artifact {
  const artifact = expectObject(value, `ticket.artifacts[${index}]`)
  const kind = expectNonEmptyString(artifact, "kind", `ticket.artifacts[${index}]`)
  const path = expectNonEmptyString(artifact, "path", `ticket.artifacts[${index}]`)
  const stage = expectNonEmptyString(artifact, "stage", `ticket.artifacts[${index}]`)
  const createdAt = expectNonEmptyString(artifact, "created_at", `ticket.artifacts[${index}]`)
  const summary = normalizeNullableString(artifact.summary) ?? undefined
  return {
    kind,
    path,
    stage,
    summary,
    created_at: createdAt,
  }
}

function migrateTicket(raw: unknown): Ticket {
  const ticket = expectObject(raw, "Ticket")
  const id = assertValidTicketId(expectNonEmptyString(ticket, "id", "Ticket"))

  return {
    id,
    title: expectNonEmptyString(ticket, "title", `Ticket ${id}`),
    wave: typeof ticket.wave === "number" && Number.isInteger(ticket.wave) && ticket.wave >= 0 ? ticket.wave : TICKET_DEFAULTS.wave,
    lane: expectNonEmptyString(ticket, "lane", `Ticket ${id}`),
    parallel_safe: typeof ticket.parallel_safe === "boolean" ? ticket.parallel_safe : TICKET_DEFAULTS.parallel_safe,
    overlap_risk: normalizeOverlapRisk(ticket.overlap_risk),
    stage: expectNonEmptyString(ticket, "stage", `Ticket ${id}`),
    status: expectNonEmptyString(ticket, "status", `Ticket ${id}`),
    depends_on: expectStringArray(ticket, "depends_on", `Ticket ${id}`),
    summary: expectNonEmptyString(ticket, "summary", `Ticket ${id}`),
    acceptance: expectStringArray(ticket, "acceptance", `Ticket ${id}`),
    decision_blockers: normalizeStringArray(ticket.decision_blockers),
    artifacts: Array.isArray(ticket.artifacts) ? ticket.artifacts.map((artifact, index) => normalizeArtifact(artifact, index)) : [],
  }
}

export async function loadManifest(root = rootPath()): Promise<Manifest> {
  const rawManifest = await readJson<unknown>(ticketsManifestPath(root))
  const manifest = expectObject(rawManifest, "Manifest")
  const ticketsRaw = manifest.tickets
  if (!Array.isArray(ticketsRaw)) {
    throw new Error("tickets/manifest.json is missing a tickets array.")
  }

  return {
    version: typeof manifest.version === "number" && manifest.version >= 2 ? manifest.version : 2,
    project: typeof manifest.project === "string" && manifest.project.trim() ? manifest.project.trim() : "UNKNOWN",
    active_ticket: typeof manifest.active_ticket === "string" && manifest.active_ticket.trim() ? manifest.active_ticket.trim() : "UNKNOWN",
    tickets: ticketsRaw.map((ticket) => migrateTicket(ticket)),
  }
}

export async function loadArtifactRegistry(root = rootPath()): Promise<ArtifactRegistry> {
  const fallback: ArtifactRegistry = {
    version: 1,
    artifacts: [],
  }
  return readJson<ArtifactRegistry>(artifactRegistryPath(root), fallback)
}

function extractTicketNotes(existing: string): string {
  const match = existing.match(/\n## Notes\n\n?([\s\S]*)$/)
  return match ? match[1].trimEnd() : ""
}

function renderArtifactLines(ticket: Ticket): string {
  if (ticket.artifacts.length === 0) {
    return "- None yet"
  }

  return ticket.artifacts
    .map((artifact) => {
      const summary = artifact.summary ? ` - ${artifact.summary}` : ""
      return `- ${artifact.kind}: ${artifact.path} (${artifact.stage})${summary}`
    })
    .join("\n")
}

export async function syncTicketFile(ticket: Ticket, root = rootPath()): Promise<void> {
  const path = ticketFilePath(ticket.id, root)
  const existing = await readText(path)
  const notes = extractTicketNotes(existing)
  await writeText(path, renderTicketDocument(ticket, notes))
}

export async function saveManifest(manifest: Manifest, root = rootPath()): Promise<void> {
  await writeJson(ticketsManifestPath(root), manifest)
  await writeText(ticketsBoardPath(root), renderBoard(manifest))
  for (const ticket of manifest.tickets) {
    await syncTicketFile(ticket, root)
  }
}

export async function saveArtifactRegistry(registry: ArtifactRegistry, root = rootPath()): Promise<void> {
  await writeJson(artifactRegistryPath(root), registry)
}

export async function loadWorkflowState(root = rootPath()): Promise<WorkflowState> {
  const fallback: WorkflowState = {
    active_ticket: "UNKNOWN",
    stage: "planning",
    status: "todo",
    approved_plan: false,
    ticket_state: {},
    process_version: 3,
    process_last_changed_at: null,
    process_last_change_summary: null,
    pending_process_verification: false,
    parallel_mode: DEFAULT_PARALLEL_MODE,
  }
  const loaded = await readJson<unknown>(workflowStatePath(root), fallback)
  if (!loaded || typeof loaded !== "object" || Array.isArray(loaded)) {
    return fallback
  }

  const state = loaded as Record<string, unknown>
  const activeTicket = typeof state.active_ticket === "string" && state.active_ticket.trim() ? state.active_ticket.trim() : fallback.active_ticket
  const ticketState = normalizeTicketStateMap(state.ticket_state)
  const legacyApprovedPlan = typeof state.approved_plan === "boolean" ? state.approved_plan : fallback.approved_plan
  if (isValidTicketId(activeTicket) && !ticketState[activeTicket]) {
    ticketState[activeTicket] = { approved_plan: legacyApprovedPlan }
  }
  const hasProcessVersion = typeof state.process_version === "number" && Number.isInteger(state.process_version) && state.process_version > 0
  const processLastChangeSummary = normalizeNullableString(state.process_last_change_summary)
  return {
    active_ticket: activeTicket,
    stage: typeof state.stage === "string" && state.stage.trim() ? state.stage.trim() : fallback.stage,
    status: typeof state.status === "string" && state.status.trim() ? state.status.trim() : fallback.status,
    approved_plan: ticketState[activeTicket]?.approved_plan ?? legacyApprovedPlan,
    ticket_state: ticketState,
    process_version:
      hasProcessVersion ? (state.process_version as number) : fallback.process_version,
    process_last_changed_at: normalizeNullableString(state.process_last_changed_at),
    process_last_change_summary: hasProcessVersion ? processLastChangeSummary : processLastChangeSummary || "Implicit upgrade from an unversioned process contract.",
    pending_process_verification: hasProcessVersion
      ? typeof state.pending_process_verification === "boolean"
        ? state.pending_process_verification
        : fallback.pending_process_verification
      : true,
    parallel_mode: normalizeParallelMode(state.parallel_mode),
  }
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

export function isPlanApprovedForTicket(workflow: WorkflowState, ticketId: string): boolean {
  return workflow.ticket_state[ticketId]?.approved_plan ?? false
}

export function setPlanApprovedForTicket(workflow: WorkflowState, ticketId: string, approved: boolean): void {
  workflow.ticket_state[ticketId] = { approved_plan: approved }
}

export function syncWorkflowSelection(workflow: WorkflowState, manifest: Manifest): void {
  const activeTicket = getTicket(manifest, manifest.active_ticket)
  if (!workflow.ticket_state[activeTicket.id]) {
    workflow.ticket_state[activeTicket.id] = { approved_plan: false }
  }
  workflow.active_ticket = activeTicket.id
  workflow.stage = activeTicket.stage
  workflow.status = activeTicket.status
  workflow.approved_plan = isPlanApprovedForTicket(workflow, activeTicket.id)
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

export function ticketNeedsProcessVerification(ticket: Ticket, workflow: WorkflowState): boolean {
  if (ticket.status !== "done") {
    return false
  }

  const processChangedAt = workflow.process_last_changed_at
  const latestQaArtifact = latestArtifact(ticket, { stage: "qa" })
  if (processChangedAt && latestQaArtifact && latestQaArtifact.created_at >= processChangedAt) {
    return false
  }

  const backlogVerificationArtifact = latestArtifact(ticket, { stage: "review", kind: "backlog-verification" })
  if (backlogVerificationArtifact) {
    return processChangedAt ? backlogVerificationArtifact.created_at < processChangedAt : false
  }

  return true
}

export function ticketsNeedingProcessVerification(manifest: Manifest, workflow: WorkflowState): Ticket[] {
  return manifest.tickets.filter((ticket) => ticketNeedsProcessVerification(ticket, workflow))
}

export function renderBoard(manifest: Manifest): string {
  const rows = manifest.tickets
    .map((ticket) => {
      const dependsOn = ticket.depends_on.length > 0 ? ticket.depends_on.join(", ") : "-"
      const parallel = ticket.parallel_safe ? "yes" : "no"
      return `| ${ticket.wave} | ${ticket.id} | ${ticket.title} | ${ticket.lane} | ${ticket.stage} | ${ticket.status} | ${parallel} | ${ticket.overlap_risk} | ${dependsOn} |`
    })
    .join("\n")
  return `# Ticket Board\n\n| Wave | ID | Title | Lane | Stage | Status | Parallel Safe | Overlap Risk | Depends On |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows}\n`
}

export function renderTicketDocument(ticket: Ticket, notes = ""): string {
  const dependsOn = ticket.depends_on.length > 0 ? ticket.depends_on.join(", ") : "None"
  const blockers = ticket.decision_blockers.length > 0 ? ticket.decision_blockers.map((item) => `- ${item}`).join("\n") : "None"
  const acceptance = ticket.acceptance.length > 0 ? ticket.acceptance.map((item) => `- [ ] ${item}`).join("\n") : "None"
  const artifacts = renderArtifactLines(ticket)
  const noteBlock = notes.trimEnd()

  return `# ${ticket.id}: ${ticket.title}

## Summary

${ticket.summary}

## Wave

${ticket.wave}

## Lane

${ticket.lane}

## Parallel Safety

- parallel_safe: ${ticket.parallel_safe ? "true" : "false"}
- overlap_risk: ${ticket.overlap_risk}

## Stage

${ticket.stage}

## Status

${ticket.status}

## Depends On

${dependsOn}

## Decision Blockers

${blockers}

## Acceptance Criteria

${acceptance}

## Artifacts

${artifacts}

## Notes

${noteBlock ? `${noteBlock}\n` : ""}
`
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

  return `# Context Snapshot\n\n## Project\n\n${manifest.project}\n\n## Active Ticket\n\n- ID: ${ticket.id}\n- Title: ${ticket.title}\n- Stage: ${ticket.stage}\n- Status: ${ticket.status}\n- Approved plan for this ticket: ${workflow.approved_plan ? "yes" : "no"}\n\n## Process State\n\n- process_version: ${workflow.process_version}\n- pending_process_verification: ${workflow.pending_process_verification ? "true" : "false"}\n- parallel_mode: ${workflow.parallel_mode}\n- process_changed_at: ${workflow.process_last_changed_at || "Not yet recorded."}\n- process_note: ${workflow.process_last_change_summary || "No recorded process change summary."}\n\n## Ticket Summary\n\n${ticket.summary}\n\n## Recent Artifacts\n\n${artifactLines}${noteBlock}\n## Next Useful Step\n\nUse the team leader or the next required specialist for the current stage.\n`
}

export function renderStartHere(manifest: Manifest, workflow: WorkflowState, options: StartHereOptions = {}): string {
  const ticket = getTicket(manifest, workflow.active_ticket)
  const processState = workflow.pending_process_verification
    ? workflow.process_last_changed_at
      ? "Process changed recently. Backlog verification is still pending before older completed work can be fully trusted."
      : "Process contract was upgraded from an unversioned state. Verify previously completed work before trusting old completion."
    : "No pending process-change verification."
  const verifierLabel = options.backlogVerifierAgent ? `\`${options.backlogVerifierAgent}\`` : "the backlog verifier"
  const recommendedAction =
    options.nextAction ||
    (workflow.pending_process_verification
      ? `Use the team leader to route ${verifierLabel} across done tickets whose latest QA proof predates the current process contract before creating any follow-up migration tickets.`
      : "Continue the required internal lifecycle from the current ticket stage.")
  return `# START HERE\n\n${START_HERE_MANAGED_START}\n## Project\n\n${manifest.project}\n\n## Current State\n\nThe repo is operating with a ticketed OpenCode workflow.\n\n## Process Contract\n\n- process_version: ${workflow.process_version}\n- parallel_mode: ${workflow.parallel_mode}\n- pending_process_verification: ${workflow.pending_process_verification ? "true" : "false"}\n- process_changed_at: ${workflow.process_last_changed_at || "Not yet recorded."}\n- process_note: ${workflow.process_last_change_summary || "No recorded process change summary."}\n- process_state: ${processState}\n\n## Read In This Order\n\n1. README.md\n2. AGENTS.md\n3. docs/spec/CANONICAL-BRIEF.md\n4. docs/process/workflow.md\n5. tickets/BOARD.md\n6. tickets/manifest.json\n\n## Current Ticket\n\n- ID: ${ticket.id}\n- Title: ${ticket.title}\n- Wave: ${ticket.wave}\n- Lane: ${ticket.lane}\n- Stage: ${ticket.stage}\n- Status: ${ticket.status}\n- Parallel safe: ${ticket.parallel_safe ? "yes" : "no"}\n\n## Validation Status\n\nUpdate this section with project-specific validation results.\n\n## Known Risks\n\n- Replace with live risks as the project evolves.\n\n## Next Action\n\n${recommendedAction}\n${START_HERE_MANAGED_END}\n`
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
