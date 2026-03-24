from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


COARSE_STATUSES = {"todo", "ready", "in_progress", "blocked", "review", "qa", "done"}
STAGE_LIKE_STATUSES = {"planned", "approved", "archived"}
MUTATING_SHELL_TOKENS = (
    '"sed *": allow',
    '"gofmt',
    '"python *": allow',
    '"node *": allow',
    '"npm *": allow',
    '"pnpm *": allow',
    '"yarn *": allow',
    '"bun *": allow',
    '"go *": allow',
    '"cargo *": allow',
    '"uv *": allow',
    '"make *": allow',
)
WRITE_LANGUAGE = (
    "update the ticket file",
    "write the plan to the file",
    "change line",
    "edit the ticket",
)
EAGER_SKILL_LOADING_PATTERNS = (
    r"(?im)^\s*load these skills:\s*$",
    r"(?im)^\s*load this skill:\s*$",
)
ARTIFACT_REGISTER_PERSIST_PATTERNS = (
    r"persist.+through `artifact_register`",
    r"persist.+with `artifact_register`",
    r"use `artifact_register` to persist",
    r"may persist their text",
)
ARTIFACT_PATH_DRIFT_PATTERNS = (
    r"\.opencode/state/plans/",
    r"\.opencode/state/artifacts/<ticket-id>/(planning|implementation|review|qa|handoff)\.md",
)
DEPRECATED_WORKFLOW_TERMS = ("ready_for_planning", "code_review", "security_review")


@dataclass
class Finding:
    code: str
    severity: str
    problem: str
    root_cause: str
    files: list[str]
    safer_pattern: str
    evidence: list[str]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def normalize_path(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root)).replace("\\", "/")
    except ValueError:
        return str(path).replace("\\", "/")


def load_manifest_statuses(manifest: dict[str, Any]) -> list[str]:
    tickets = manifest.get("tickets")
    if isinstance(tickets, dict):
        return [str(ticket.get("status", "")).strip() for ticket in tickets.values() if isinstance(ticket, dict)]
    if isinstance(tickets, list):
        return [str(ticket.get("status", "")).strip() for ticket in tickets if isinstance(ticket, dict)]
    return []


def manifest_queue_keys(manifest: dict[str, Any]) -> list[str]:
    return [key for key in ("todo", "ready", "in_progress", "blocked", "review", "qa", "done", "completed", "later") if key in manifest]


def parse_status_semantics(text: str) -> dict[str, str]:
    semantics: dict[str, str] = {}
    for match in re.finditer(r"-\s+`([^`]+)`:\s+(.+)", text):
        semantics[match.group(1).strip()] = match.group(2).strip()
    return semantics


def ticket_markdown_status(path: Path) -> str | None:
    text = read_text(path)
    match = re.search(r"^status:\s*([A-Za-z0-9_/-]+)\s*$", text, re.MULTILINE)
    return match.group(1).strip() if match else None


def extract_section_lines(text: str, heading: str) -> list[str]:
    pattern = rf"^##\s+{re.escape(heading)}\s*$"
    start = re.search(pattern, text, re.MULTILINE)
    if not start:
        return []
    remainder = text[start.end() :]
    next_heading = re.search(r"^##\s+", remainder, re.MULTILINE)
    block = remainder[: next_heading.start()] if next_heading else remainder
    return [line.strip() for line in block.splitlines() if line.strip()]


def read_only_shell_agent(path: Path) -> bool:
    text = read_text(path)
    return "write: false" in text and "edit: false" in text and "bash: true" in text


def has_eager_skill_loading(text: str) -> bool:
    return any(re.search(pattern, text) for pattern in EAGER_SKILL_LOADING_PATTERNS)


def iter_contract_paths(root: Path) -> list[Path]:
    paths: list[Path] = []
    for relative in ("README.md", "AGENTS.md", "tickets/README.md"):
        path = root / relative
        if path.exists():
            paths.append(path)
    for base, pattern in (
        (root / "docs" / "process", "*.md"),
        (root / ".opencode" / "agents", "*.md"),
        (root / ".opencode" / "skills", "*.md"),
        (root / ".opencode" / "tools", "*.ts"),
        (root / ".opencode" / "state", "*.json"),
    ):
        if base.exists():
            paths.extend(sorted(base.rglob(pattern)))
    return sorted({path.resolve(): path for path in paths}.values())


def matching_lines(text: str, patterns: tuple[str, ...]) -> list[str]:
    hits: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if line and any(re.search(pattern, line, re.IGNORECASE) for pattern in patterns):
            hits.append(line)
    return hits[:3]


def normalized_path(path: Path, root: Path) -> str:
    return str(path.relative_to(root)).replace("\\", "/")


def add_finding(findings: list[Finding], finding: Finding) -> None:
    findings.append(finding)


def audit_status_model(root: Path, findings: list[Finding]) -> None:
    manifest_path = root / "tickets" / "manifest.json"
    manifest = read_json(manifest_path)
    if not isinstance(manifest, dict):
        return

    statuses = sorted({status for status in load_manifest_statuses(manifest) if status})
    queue_keys = manifest_queue_keys(manifest)
    stage_like = sorted(set(statuses) & STAGE_LIKE_STATUSES)
    if stage_like:
        add_finding(
            findings,
            Finding(
                code="status-stage-collision",
                severity="error",
                problem="Ticket status encodes transient workflow stage instead of coarse queue state.",
                root_cause="The backlog uses statuses like planned or approved even though transient approval should live in workflow state or explicit artifacts.",
                files=[normalize_path(manifest_path, root)],
                safer_pattern="Use coarse queue statuses only and move plan approval into workflow state plus registered stage artifacts.",
                evidence=[
                    f"Manifest statuses: {', '.join(statuses) if statuses else '(none)'}",
                    f"Queue keys: {', '.join(queue_keys) if queue_keys else '(none)'}",
                ],
            ),
        )

    if queue_keys and stage_like:
        add_finding(
            findings,
            Finding(
                code="dual-state-model",
                severity="error",
                problem="The manifest mixes queue buckets and stage-like per-ticket statuses.",
                root_cause="Two overlapping state machines encourage weaker models to infer next steps from labels instead of from verified stage proofs.",
                files=[normalize_path(manifest_path, root)],
                safer_pattern="Keep the manifest as the queue source of truth and store transient approval in workflow state.",
                evidence=[
                    f"Queue buckets present: {', '.join(queue_keys)}",
                    f"Stage-like statuses present: {', '.join(stage_like)}",
                ],
            ),
        )


def audit_status_semantics_docs(root: Path, findings: list[Finding]) -> None:
    files = [
        root / "docs" / "process" / "ticketing.md",
        root / "tickets" / "README.md",
    ]
    semantics = {path: parse_status_semantics(read_text(path)) for path in files if path.exists()}
    if len(semantics) < 2:
        return

    shared_keys = set.intersection(*(set(values.keys()) for values in semantics.values()))
    mismatches: list[str] = []
    for key in sorted(shared_keys):
        values = {path: mapping[key] for path, mapping in semantics.items()}
        if len(set(values.values())) > 1:
            mismatch = "; ".join(f"{normalize_path(path, root)} -> {value}" for path, value in values.items())
            mismatches.append(f"{key}: {mismatch}")

    if mismatches:
        add_finding(
            findings,
            Finding(
                code="contradictory-status-semantics",
                severity="error",
                problem="Status terms mean different things in different ticket docs.",
                root_cause="Weaker models will follow whichever status definition they most recently read, which creates routing instability.",
                files=[normalize_path(path, root) for path in semantics],
                safer_pattern="Define each status once, keep it coarse, and align all docs to the same wording.",
                evidence=mismatches,
            ),
        )


def audit_planned_tickets_without_artifacts(root: Path, findings: list[Finding]) -> None:
    ticket_dir = root / "tickets"
    if not ticket_dir.exists():
        return

    has_workflow_tools = all(
        (root / relative).exists()
        for relative in (
            ".opencode/tools/artifact_write.ts",
            ".opencode/tools/ticket_lookup.ts",
            ".opencode/tools/ticket_update.ts",
            ".opencode/tools/artifact_register.ts",
            ".opencode/state/workflow-state.json",
        )
    )

    thin_planned: list[str] = []
    for path in ticket_dir.glob("*.md"):
        if path.name in {"README.md", "BOARD.md", "TEMPLATE.md"}:
            continue
        status = ticket_markdown_status(path)
        if status not in {"planned", "approved"}:
            continue
        brief_lines = extract_section_lines(read_text(path), "Implementation Brief")
        if len(brief_lines) <= 4:
            thin_planned.append(normalize_path(path, root))

    if thin_planned and not has_workflow_tools:
        add_finding(
            findings,
            Finding(
                code="planner-status-without-proof",
                severity="error",
                problem="Tickets are marked as planned or approved without a reliable artifact layer proving planner output exists.",
                root_cause="The repo relies on raw ticket text and stage-like statuses rather than explicit planning artifacts and workflow-state gates.",
                files=thin_planned[:10],
                safer_pattern="Keep tickets in coarse queue states and require a planning artifact plus workflow approval state before plan review or implementation.",
                evidence=[
                    f"Thin planned/approved tickets: {len(thin_planned)}",
                    "Missing workflow tool layer: .opencode/tools/artifact_write.ts, .opencode/tools/ticket_lookup.ts, .opencode/tools/ticket_update.ts, .opencode/tools/artifact_register.ts, or .opencode/state/workflow-state.json",
                ],
            ),
        )


def audit_missing_tool_layer(root: Path, findings: list[Finding]) -> None:
    required = [
        ".opencode/tools/artifact_write.ts",
        ".opencode/tools/ticket_lookup.ts",
        ".opencode/tools/ticket_update.ts",
        ".opencode/tools/artifact_register.ts",
        ".opencode/plugins/stage-gate-enforcer.ts",
        ".opencode/plugins/ticket-sync.ts",
        ".opencode/plugins/tool-guard.ts",
        ".opencode/state/workflow-state.json",
    ]
    missing = [path for path in required if not (root / path).exists()]
    if missing:
        add_finding(
            findings,
            Finding(
                code="missing-workflow-tool-layer",
                severity="error",
                problem="The repo is missing the tool and plugin layer needed for explicit workflow-state control.",
                root_cause="Without ticket tools, workflow state, and guard plugins, the agent falls back to fragile raw-file stage management.",
                files=missing,
                safer_pattern="Add artifact-write/register tools, ticket tools, workflow-state, and stage/ticket guard plugins so stage control is explicit and tool-backed.",
                evidence=missing,
            ),
        )


def audit_overloaded_artifact_register(root: Path, findings: list[Finding]) -> None:
    path = root / ".opencode" / "tools" / "artifact_register.ts"
    if not path.exists():
        return

    text = read_text(path)
    evidence: list[str] = []
    if re.search(r"\bcontent\s*:", text):
        evidence.append("artifact_register still exposes a content argument.")
    if "writeText(" in text or "writeFile(" in text:
        evidence.append("artifact_register still writes artifact body text instead of registering metadata only.")

    if evidence:
        add_finding(
            findings,
            Finding(
                code="overloaded-artifact-register",
                severity="error",
                problem="artifact_register is still overloaded to write artifact content as well as register metadata.",
                root_cause="Weak models can pass a summary string through the register tool and overwrite the canonical artifact body.",
                files=[normalize_path(path, root)],
                safer_pattern="Split artifact persistence into `artifact_write` for the full body and register-only `artifact_register` for metadata.",
                evidence=evidence,
            ),
        )


def audit_artifact_persistence_prompt_contract(root: Path, findings: list[Finding]) -> None:
    offenders: list[str] = []
    evidence: list[str] = []

    for path in iter_contract_paths(root):
        text = read_text(path)
        hits = matching_lines(text, ARTIFACT_REGISTER_PERSIST_PATTERNS)
        if not hits:
            continue
        offenders.append(normalize_path(path, root))
        evidence.extend(f"{normalize_path(path, root)} -> {hit}" for hit in hits)

    if offenders:
        add_finding(
            findings,
            Finding(
                code="artifact-persistence-through-register",
                severity="error",
                problem="Prompts or workflow docs still describe artifact_register as the tool that persists full artifact text.",
                root_cause="The prompt contract collapses writing and registration into one step, so weaker models can overwrite canonical artifacts with summaries.",
                files=offenders,
                safer_pattern="Tell stage agents to write full content with `artifact_write` and then register metadata with `artifact_register`.",
                evidence=evidence,
            ),
        )


def audit_artifact_path_contract_drift(root: Path, findings: list[Finding]) -> None:
    offenders: list[str] = []
    evidence: list[str] = []

    for path in iter_contract_paths(root):
        text = read_text(path)
        hits = matching_lines(text, ARTIFACT_PATH_DRIFT_PATTERNS)
        if not hits:
            continue
        offenders.append(normalize_path(path, root))
        evidence.extend(f"{normalize_path(path, root)} -> {hit}" for hit in hits)

    if offenders:
        add_finding(
            findings,
            Finding(
                code="artifact-path-contract-drift",
                severity="error",
                problem="Artifact guidance still points at deprecated path conventions.",
                root_cause="Docs and prompts disagree about the canonical artifact location, which makes stage proof unreliable.",
                files=offenders,
                safer_pattern="Use `.opencode/state/artifacts/<ticket-id>/<stage>-<kind>.md` consistently across prompts, docs, tools, and skills.",
                evidence=evidence,
            ),
        )


def audit_workflow_vocabulary_drift(root: Path, findings: list[Finding]) -> None:
    offenders: list[str] = []
    evidence: list[str] = []

    for path in iter_contract_paths(root):
        text = read_text(path)
        allowed_terms = {"code_review", "security_review"} if normalized_path(path, root) == ".opencode/tools/_workflow.ts" else set()
        hits = [term for term in DEPRECATED_WORKFLOW_TERMS if term in text and term not in allowed_terms]
        if not hits:
            continue
        offenders.append(normalize_path(path, root))
        evidence.extend(f"{normalize_path(path, root)} -> {', '.join(hits)}" for _ in range(1))

    if offenders:
        add_finding(
            findings,
            Finding(
                code="workflow-vocabulary-drift",
                severity="error",
                problem="Workflow tools or docs still use deprecated status or stage vocabulary.",
                root_cause="Stage gates, workflow defaults, and artifact proofs no longer agree on the state machine terms that control execution.",
                files=offenders,
                safer_pattern="Keep workflow defaults and stage checks aligned on `todo|ready|in_progress|blocked|review|qa|done` plus `planning|implementation|review|qa` stage proof.",
                evidence=evidence,
            ),
        )


def audit_artifact_brief_missing_tuple(root: Path, findings: list[Finding]) -> None:
    team_leader = next((path for path in (root / ".opencode" / "agents").glob("*team-leader*.md")), None)
    if not team_leader:
        return

    text = read_text(team_leader)
    if "Canonical artifact path when the stage must persist text" not in text:
        return

    if "Artifact stage when the stage must persist text" in text and "Artifact kind when the stage must persist text" in text:
        return

    add_finding(
        findings,
        Finding(
            code="artifact-brief-missing-tuple",
            severity="warning",
            problem="The team leader delegation brief does not include the artifact stage/kind tuple required by stricter artifact tools.",
            root_cause="A path alone is not enough to derive the canonical `(stage, kind)` pair for every artifact, so weaker models can guess the wrong tuple and fail path validation.",
            files=[normalize_path(team_leader, root)],
            safer_pattern="Include artifact stage, artifact kind, and canonical artifact path whenever a delegated stage must persist text.",
            evidence=[normalize_path(team_leader, root)],
        ),
    )


def audit_workflow_state_desync(root: Path, findings: list[Finding]) -> None:
    path = root / ".opencode" / "tools" / "ticket_update.ts"
    if not path.exists():
        return

    text = read_text(path)
    if (
        "workflow.stage = ticket.stage" not in text
        and "workflow.status = ticket.status" not in text
        and ("workflow.approved_plan = args.approved_plan" not in text or "activeTicket.id === ticket.id" in text)
    ):
        return

    add_finding(
        findings,
        Finding(
            code="workflow-state-desync",
            severity="error",
            problem="ticket_update can copy a background ticket's stage or status into workflow-state without activating that ticket.",
            root_cause="The tool updates the manifest ticket record and then mirrors the edited ticket into workflow-state even when the active ticket remains different.",
            files=[normalize_path(path, root)],
            safer_pattern="Recompute the current active ticket after manifest changes and sync workflow-state from that active ticket only.",
            evidence=[normalize_path(path, root)],
        ),
    )


def audit_handoff_overwrites_start_here(root: Path, findings: list[Finding]) -> None:
    path = root / ".opencode" / "tools" / "handoff_publish.ts"
    if not path.exists():
        return

    text = read_text(path)
    if "await writeText(startHere, content)" not in text or "mergeStartHere" in text:
        return

    add_finding(
        findings,
        Finding(
            code="handoff-overwrites-start-here",
            severity="error",
            problem="handoff_publish overwrites START-HERE.md with a generic generated handoff.",
            root_cause="The closeout tool does not preserve curated repo-specific content in START-HERE, so later sessions lose the canonical read order and live risk/validation notes.",
            files=[normalize_path(path, root)],
            safer_pattern="Write the generated handoff to `.opencode/state/latest-handoff.md` and only merge the managed block into START-HERE when explicit markers are present.",
            evidence=[normalize_path(path, root)],
        ),
    )


def tool_uses_plain_object_args(text: str) -> bool:
    return bool(re.search(r"\btype:\s*\"[A-Za-z]+\"", text) or re.search(r"\brequired:\s*(true|false)\b", text))


def tool_uses_zod_args(text: str) -> bool:
    return "tool.schema." in text or bool(re.search(r"args:\s*{\s*}", text))


def audit_invalid_tool_schemas(root: Path, findings: list[Finding]) -> None:
    tools_dir = root / ".opencode" / "tools"
    if not tools_dir.exists():
        return

    offenders: list[str] = []
    evidence: list[str] = []
    for path in tools_dir.glob("*.ts"):
        if path.name == "_workflow.ts":
            continue
        text = read_text(path)
        if "export default tool(" not in text:
            continue
        normalized = normalize_path(path, root)
        if tool_uses_plain_object_args(text):
            offenders.append(normalized)
            evidence.append(f"{normalized} uses plain JSON-style tool args (`type`/`required`) instead of `tool.schema`.")
            continue
        if not tool_uses_zod_args(text):
            offenders.append(normalized)
            evidence.append(f"{normalized} does not expose a detectable `tool.schema` arg contract.")

    if offenders:
        add_finding(
            findings,
            Finding(
                code="invalid-opencode-tool-schema",
                severity="error",
                problem="Custom OpenCode tools are not using the Zod-backed `tool.schema` contract expected by the plugin runtime.",
                root_cause="The repo mixes scaffold-era plain-object arg definitions with a plugin API that converts Zod schemas to JSON schema at load time.",
                files=offenders,
                safer_pattern="Define every custom tool arg with `tool.schema.*` and reject plain `{ type, description, required }` objects.",
                evidence=evidence,
            ),
        )


def audit_missing_observability_layer(root: Path, findings: list[Finding]) -> None:
    required = [
        ".opencode/tools/skill_ping.ts",
        ".opencode/plugins/invocation-tracker.ts",
        ".opencode/meta/bootstrap-provenance.json",
        ".opencode/state/.gitignore",
    ]
    missing = [path for path in required if not (root / path).exists()]
    if missing:
        add_finding(
            findings,
            Finding(
                code="missing-observability-layer",
                severity="warning",
                problem="The repo cannot reliably explain how its OpenCode layer was generated or which local skills/tools are actually being used.",
                root_cause="Tracking surfaces for provenance and invocation logging are missing, so audits cannot distinguish never-used skills from invisible activity.",
                files=missing,
                safer_pattern="Add bootstrap provenance, invocation tracking, and a skill ping tool so usage is observable across sessions.",
                evidence=missing,
            ),
        )


def audit_partial_workflow_layer_drift(root: Path, findings: list[Finding]) -> None:
    has_core_layer = any(
        (root / path).exists()
        for path in (
            ".opencode/tools/ticket_lookup.ts",
            ".opencode/tools/ticket_update.ts",
            ".opencode/tools/artifact_register.ts",
        )
    )
    if not has_core_layer:
        return

    optional_surfaces = [
        "opencode.jsonc",
        ".opencode/commands",
        ".opencode/tools/context_snapshot.ts",
        ".opencode/tools/handoff_publish.ts",
        ".opencode/plugins/session-compactor.ts",
    ]
    missing = [path for path in optional_surfaces if not (root / path).exists()]
    if missing:
        add_finding(
            findings,
            Finding(
                code="partial-workflow-layer-drift",
                severity="warning",
                problem="The repo has a partial OpenCode workflow layer, but some non-core scaffold surfaces are missing.",
                root_cause="The repo was retrofitted or customized without keeping the restart, handoff, or human-entrypoint surfaces aligned with the tool-backed workflow.",
                files=missing,
                safer_pattern="Keep restart commands, context/handoff tools, and session automation aligned with the repo's current workflow layer.",
                evidence=missing,
            ),
        )


def audit_raw_file_state_ownership(root: Path, findings: list[Finding]) -> None:
    team_leader = next((path for path in (root / ".opencode" / "agents").glob("*team-leader*.md")), None)
    if not team_leader:
        return

    text = read_text(team_leader)
    missing_ticket_tools = not (root / ".opencode" / "tools" / "ticket_update.ts").exists()
    if missing_ticket_tools and ("ticket state" in text.lower() or "manifest.json" in text or "board.md" in text):
        add_finding(
            findings,
            Finding(
                code="raw-file-team-leader-state",
                severity="error",
                problem="The team leader owns ticket state but has no ticket-state tool layer.",
                root_cause="The workflow expects raw file choreography across ticket files, the board, and the manifest instead of using structured tools.",
                files=[normalize_path(team_leader, root)],
                safer_pattern="Give the team leader ticket lookup/update tools and make the board a derived view.",
                evidence=[
                    "Team leader references ticket state or raw tracking surfaces.",
                    "No .opencode/tools/ticket_update.ts present.",
                ],
            ),
        )


def audit_missing_artifact_gates(root: Path, findings: list[Finding]) -> None:
    team_leader = next((path for path in (root / ".opencode" / "agents").glob("*team-leader*.md")), None)
    plan_review = next((path for path in (root / ".opencode" / "agents").glob("*plan-review*.md")), None)
    if not team_leader and not plan_review:
        return

    missing: list[str] = []
    for path in (team_leader, plan_review):
        if not path:
            continue
        text = read_text(path).lower()
        if "artifact" not in text and "approved_plan" not in text and "workflow-state" not in text:
            missing.append(normalize_path(path, root))

    if missing:
        add_finding(
            findings,
            Finding(
                code="missing-artifact-gates",
                severity="error",
                problem="Stage prompts do not require canonical artifact or workflow-state proof before advancing.",
                root_cause="The workflow relies on status inference instead of explicit planning, review, or QA evidence.",
                files=missing,
                safer_pattern="Require artifact proof before plan review, implementation, review, QA, and closeout.",
                evidence=missing,
            ),
        )


def audit_read_only_shell_mutation(root: Path, findings: list[Finding]) -> None:
    agents_dir = root / ".opencode" / "agents"
    if not agents_dir.exists():
        return

    bad_agents: list[str] = []
    for path in agents_dir.glob("*.md"):
        text = read_text(path)
        if not read_only_shell_agent(path):
            continue
        if any(token in text for token in MUTATING_SHELL_TOKENS):
            bad_agents.append(normalize_path(path, root))

    if bad_agents:
        add_finding(
            findings,
            Finding(
                code="read-only-shell-mutation-loophole",
                severity="error",
                problem="Read-only shell agents still allow commands that can mutate repo-tracked files.",
                root_cause="The repo labels an agent as inspection-only while its shell allowlist still includes mutating commands.",
                files=bad_agents,
                safer_pattern="Keep read-only shell allowlists to inspection commands only and move mutation into write-capable roles.",
                evidence=bad_agents,
            ),
        )


def audit_read_only_write_language(root: Path, findings: list[Finding]) -> None:
    agents_dir = root / ".opencode" / "agents"
    if not agents_dir.exists():
        return

    offenders: list[str] = []
    for path in agents_dir.glob("*.md"):
        text = read_text(path).lower()
        if "write: false" not in text or "edit: false" not in text:
            continue
        if any(phrase in text for phrase in WRITE_LANGUAGE):
            offenders.append(normalize_path(path, root))

    if offenders:
        add_finding(
            findings,
            Finding(
                code="read-only-write-language",
                severity="warning",
                problem="Read-only agent prompts still contain direct file-update language.",
                root_cause="Weak models may hallucinate successful writes or route around missing capabilities when prompts imply they should mutate files.",
                files=offenders,
                safer_pattern="Tell read-only agents to return blockers or artifacts, not repo file edits.",
                evidence=offenders,
            ),
        )


def audit_over_scoped_commands(root: Path, findings: list[Finding]) -> None:
    commands_dir = root / ".opencode" / "commands"
    if not commands_dir.exists():
        return

    offenders: list[str] = []
    for path in commands_dir.glob("*.md"):
        text = read_text(path)
        if "## Success Output" in text and "## Follow-On Action" in text and re.search(r"## Follow-On Action\s+Invoke", text, re.IGNORECASE):
            offenders.append(normalize_path(path, root))

    if offenders:
        add_finding(
            findings,
            Finding(
                code="over-scoped-human-command",
                severity="warning",
                problem="Human entrypoint commands also instruct autonomous continuation beyond the stated success output.",
                root_cause="The command contract is mixing summary/preflight responsibilities with automatic lifecycle continuation.",
                files=offenders,
                safer_pattern="Keep commands narrow and let the team leader stop at the command's intended handoff boundary.",
                evidence=offenders,
            ),
        )


def audit_eager_skill_loading(root: Path, findings: list[Finding]) -> None:
    agents_dir = root / ".opencode" / "agents"
    if not agents_dir.exists():
        return

    offenders: list[str] = []
    for path in agents_dir.glob("*.md"):
        text = read_text(path)
        lowered = text.lower()
        if "mode: primary" not in lowered:
            continue
        if "skill:" not in lowered:
            continue
        if has_eager_skill_loading(text):
            offenders.append(normalize_path(path, root))

    if offenders:
        add_finding(
            findings,
            Finding(
                code="eager-skill-loading",
                severity="error",
                problem="A primary agent is told to load skills before it resolves workflow state.",
                root_cause="The prompt front-loads skill-tool setup, which can make weaker models issue malformed skill calls before they inspect the active ticket.",
                files=offenders,
                safer_pattern="Resolve state from ticket tools first and load one explicitly named skill only when it materially reduces ambiguity.",
                evidence=offenders,
            ),
        )


def audit_repo(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    audit_status_model(root, findings)
    audit_status_semantics_docs(root, findings)
    audit_planned_tickets_without_artifacts(root, findings)
    audit_missing_tool_layer(root, findings)
    audit_overloaded_artifact_register(root, findings)
    audit_artifact_persistence_prompt_contract(root, findings)
    audit_artifact_path_contract_drift(root, findings)
    audit_workflow_vocabulary_drift(root, findings)
    audit_artifact_brief_missing_tuple(root, findings)
    audit_workflow_state_desync(root, findings)
    audit_handoff_overwrites_start_here(root, findings)
    audit_invalid_tool_schemas(root, findings)
    audit_missing_observability_layer(root, findings)
    audit_partial_workflow_layer_drift(root, findings)
    audit_raw_file_state_ownership(root, findings)
    audit_missing_artifact_gates(root, findings)
    audit_read_only_shell_mutation(root, findings)
    audit_read_only_write_language(root, findings)
    audit_over_scoped_commands(root, findings)
    audit_eager_skill_loading(root, findings)
    return findings


def render_markdown(root: Path, findings: list[Finding]) -> str:
    lines = [
        "# Repo Process Audit",
        "",
        f"- Repo: {root}",
        f"- Findings: {len(findings)}",
        "",
    ]
    if not findings:
        lines.extend(["No blocking workflow smells found.", ""])
        return "\n".join(lines)

    lines.append("## Findings")
    lines.append("")
    for finding in findings:
        lines.extend(
            [
                f"### [{finding.severity}] {finding.code}",
                "",
                f"Problem: {finding.problem}",
                f"Root cause: {finding.root_cause}",
                "Files:",
                *[f"- {path}" for path in finding.files],
                f"Target safer pattern: {finding.safer_pattern}",
                "Evidence:",
                *[f"- {item}" for item in finding.evidence],
                "",
            ]
        )
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit a repo for workflow and prompt-process drift.")
    parser.add_argument("repo_root", help="Repository root to audit.")
    parser.add_argument("--format", choices=("markdown", "json", "both"), default="both")
    parser.add_argument("--markdown-output", help="Optional path for markdown output.")
    parser.add_argument("--json-output", help="Optional path for JSON output.")
    parser.add_argument("--fail-on", choices=("never", "warning", "error"), default="never")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(args.repo_root).expanduser().resolve()
    findings = audit_repo(root)

    payload = {
        "repo_root": str(root),
        "finding_count": len(findings),
        "findings": [asdict(finding) for finding in findings],
    }
    markdown = render_markdown(root, findings)

    if args.markdown_output:
        Path(args.markdown_output).write_text(markdown + "\n", encoding="utf-8")
    if args.json_output:
        Path(args.json_output).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    if args.format in {"markdown", "both"}:
        print(markdown)
    if args.format in {"json", "both"} and not args.json_output:
        print(json.dumps(payload, indent=2))

    if args.fail_on == "warning" and findings:
        return 2
    if args.fail_on == "error" and any(finding.severity == "error" for finding in findings):
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
