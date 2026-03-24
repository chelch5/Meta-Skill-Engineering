from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from audit_repo_process import audit_repo


START_HERE_MANAGED_START = "<!-- SCAFFORGE:START_HERE_BLOCK START -->"
START_HERE_MANAGED_END = "<!-- SCAFFORGE:START_HERE_BLOCK END -->"
DETERMINISTIC_PROCESS_DOCS = (
    "workflow.md",
    "tooling.md",
    "model-matrix.md",
    "git-capability.md",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Apply deterministic Scafforge process repairs to an existing repo.")
    parser.add_argument("repo_root", help="Repository root to repair.")
    parser.add_argument("--project-name", help="Override project name when provenance is missing.")
    parser.add_argument("--project-slug", help="Override project slug when provenance is missing.")
    parser.add_argument("--agent-prefix", help="Override agent prefix when provenance is missing.")
    parser.add_argument("--model-provider", help="Override model provider when provenance is missing.")
    parser.add_argument("--planner-model", help="Override planner model when provenance is missing.")
    parser.add_argument("--implementer-model", help="Override implementer model when provenance is missing.")
    parser.add_argument("--utility-model", help="Override utility model when provenance is missing.")
    parser.add_argument("--stack-label", default="framework-agnostic", help="Stack label for regenerated process docs.")
    parser.add_argument(
        "--change-summary",
        default="Deterministic workflow-engine surfaces replaced by repo-process-doctor.",
        help="Summary stored in workflow-state and repair history.",
    )
    parser.add_argument("--skip-verify", action="store_true", help="Skip the post-repair audit.")
    parser.add_argument("--fail-on", choices=("never", "warning", "error"), default="never")
    return parser.parse_args()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def normalize_path(path: Path, root: Path) -> str:
    return str(path.relative_to(root)).replace("\\", "/")


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "project"


def merge_start_here(existing: str, rendered: str) -> str:
    rendered_pattern = re.compile(
        rf"{re.escape(START_HERE_MANAGED_START)}[\s\S]*?{re.escape(START_HERE_MANAGED_END)}",
        re.MULTILINE,
    )
    rendered_match = rendered_pattern.search(rendered)
    if not rendered_match:
        return rendered
    if not existing.strip():
        return rendered
    if START_HERE_MANAGED_START not in existing or START_HERE_MANAGED_END not in existing:
        return existing
    return rendered_pattern.sub(rendered_match.group(0), existing, count=1)


def package_root() -> Path:
    return Path(__file__).resolve().parents[3]


def bootstrap_script_path() -> Path:
    return Path(__file__).resolve().parents[2] / "repo-scaffold-factory" / "scripts" / "bootstrap_repo_scaffold.py"


def load_metadata(repo_root: Path, args: argparse.Namespace) -> dict[str, str]:
    provenance = read_json(repo_root / ".opencode" / "meta" / "bootstrap-provenance.json")
    manifest = read_json(repo_root / "tickets" / "manifest.json")
    runtime = provenance.get("runtime_models", {}) if isinstance(provenance, dict) else {}

    project_name = args.project_name or (provenance.get("project_name") if isinstance(provenance, dict) else None)
    if not project_name and isinstance(manifest, dict):
        raw_project = manifest.get("project")
        if isinstance(raw_project, str) and raw_project.strip():
            project_name = raw_project.strip()

    project_slug = args.project_slug or (provenance.get("project_slug") if isinstance(provenance, dict) else None)
    agent_prefix = args.agent_prefix or (provenance.get("agent_prefix") if isinstance(provenance, dict) else None)
    model_provider = args.model_provider or runtime.get("provider")
    planner_model = args.planner_model or runtime.get("planner")
    implementer_model = args.implementer_model or runtime.get("implementer")
    utility_model = args.utility_model or runtime.get("utility") or planner_model

    if not project_slug and project_name:
        project_slug = slugify(project_name)
    if not agent_prefix and project_slug:
        agent_prefix = project_slug

    values = {
        "project_name": project_name,
        "project_slug": project_slug,
        "agent_prefix": agent_prefix,
        "model_provider": model_provider,
        "planner_model": planner_model,
        "implementer_model": implementer_model,
        "utility_model": utility_model,
    }
    missing = [key for key, value in values.items() if not isinstance(value, str) or not value.strip()]
    if missing:
        missing_display = ", ".join(missing)
        raise SystemExit(
            f"Missing required metadata for repair: {missing_display}. "
            "Provide overrides on the command line or ensure bootstrap provenance exists."
        )
    return {key: value.strip() for key, value in values.items()}


def run_bootstrap_render(dest_root: Path, metadata: dict[str, str], stack_label: str) -> None:
    command = [
        sys.executable,
        str(bootstrap_script_path()),
        "--dest",
        str(dest_root),
        "--project-name",
        metadata["project_name"],
        "--project-slug",
        metadata["project_slug"],
        "--agent-prefix",
        metadata["agent_prefix"],
        "--model-provider",
        metadata["model_provider"],
        "--planner-model",
        metadata["planner_model"],
        "--implementer-model",
        metadata["implementer_model"],
        "--utility-model",
        metadata["utility_model"],
        "--stack-label",
        stack_label,
        "--scope",
        "full",
        "--force",
    ]
    result = subprocess.run(command, cwd=package_root(), check=False, capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit(
            "Unable to render repair scaffold.\n"
            f"STDOUT:\n{result.stdout}\n"
            f"STDERR:\n{result.stderr}"
        )


def replace_directory(source: Path, target: Path) -> None:
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(source, target)


def replace_file(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def normalize_ticket_state_map(value: Any) -> dict[str, dict[str, bool]]:
    if not isinstance(value, dict):
        return {}
    normalized: dict[str, dict[str, bool]] = {}
    for ticket_id, ticket_state in value.items():
        if not isinstance(ticket_id, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", ticket_id):
            continue
        approved_plan = False
        if isinstance(ticket_state, dict) and isinstance(ticket_state.get("approved_plan"), bool):
            approved_plan = ticket_state["approved_plan"]
        normalized[ticket_id] = {"approved_plan": approved_plan}
    return normalized


def current_iso_timestamp() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def update_workflow_state(repo_root: Path, rendered_provenance: dict[str, Any], change_summary: str) -> None:
    workflow_path = repo_root / ".opencode" / "state" / "workflow-state.json"
    manifest = read_json(repo_root / "tickets" / "manifest.json")
    workflow = read_json(workflow_path)

    manifest_active_ticket = None
    manifest_stage = "planning"
    manifest_status = "todo"
    if isinstance(manifest, dict):
        raw_active = manifest.get("active_ticket")
        if isinstance(raw_active, str) and raw_active.strip():
            manifest_active_ticket = raw_active.strip()
        tickets = manifest.get("tickets")
        if isinstance(tickets, list) and manifest_active_ticket:
            for ticket in tickets:
                if not isinstance(ticket, dict):
                    continue
                if ticket.get("id") == manifest_active_ticket:
                    if isinstance(ticket.get("stage"), str) and ticket["stage"].strip():
                        manifest_stage = ticket["stage"].strip()
                    if isinstance(ticket.get("status"), str) and ticket["status"].strip():
                        manifest_status = ticket["status"].strip()
                    break

    existing_active_ticket = workflow.get("active_ticket") if isinstance(workflow, dict) else None
    active_ticket = existing_active_ticket if isinstance(existing_active_ticket, str) and existing_active_ticket.strip() else manifest_active_ticket or "UNKNOWN"
    stage = workflow.get("stage") if isinstance(workflow, dict) and isinstance(workflow.get("stage"), str) and workflow.get("stage").strip() else manifest_stage
    status = workflow.get("status") if isinstance(workflow, dict) and isinstance(workflow.get("status"), str) and workflow.get("status").strip() else manifest_status
    ticket_state = normalize_ticket_state_map(workflow.get("ticket_state") if isinstance(workflow, dict) else None)
    legacy_approved_plan = workflow.get("approved_plan") if isinstance(workflow, dict) and isinstance(workflow.get("approved_plan"), bool) else False
    if isinstance(active_ticket, str) and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", active_ticket) and active_ticket not in ticket_state:
        ticket_state[active_ticket] = {"approved_plan": legacy_approved_plan}
    approved_plan = ticket_state.get(active_ticket, {}).get("approved_plan", legacy_approved_plan)

    workflow_contract = rendered_provenance.get("workflow_contract", {}) if isinstance(rendered_provenance, dict) else {}
    payload = {
        "active_ticket": active_ticket,
        "stage": stage,
        "status": status,
        "approved_plan": approved_plan,
        "ticket_state": ticket_state,
        "process_version": workflow_contract.get("process_version", 3),
        "process_last_changed_at": current_iso_timestamp(),
        "process_last_change_summary": change_summary,
        "pending_process_verification": True,
        "parallel_mode": workflow_contract.get("parallel_mode", "parallel-lanes"),
    }
    write_json(workflow_path, payload)


def update_provenance(
    repo_root: Path,
    rendered_root: Path,
    replaced_surfaces: list[str],
    change_summary: str,
) -> None:
    provenance_path = repo_root / ".opencode" / "meta" / "bootstrap-provenance.json"
    existing = read_json(provenance_path)
    rendered = read_json(rendered_root / ".opencode" / "meta" / "bootstrap-provenance.json")
    payload = rendered if isinstance(rendered, dict) else {}
    history = existing.get("repair_history") if isinstance(existing, dict) and isinstance(existing.get("repair_history"), list) else []
    payload["repair_history"] = [
        *history,
        {
            "repaired_at": current_iso_timestamp(),
            "repair_kind": "deterministic-workflow-engine-replacement",
            "summary": change_summary,
            "replaced_surfaces": replaced_surfaces,
            "project_specific_follow_up": (
                payload.get("managed_surfaces", {}).get("project_specific_follow_up", [])
                if isinstance(payload.get("managed_surfaces"), dict)
                else []
            ),
        },
    ]
    write_json(provenance_path, payload)


def apply_repair(repo_root: Path, rendered_root: Path, change_summary: str) -> list[str]:
    replaced_surfaces: list[str] = []

    replace_file(rendered_root / "opencode.jsonc", repo_root / "opencode.jsonc")
    replaced_surfaces.append("opencode.jsonc")

    for relative in (".opencode/tools", ".opencode/plugins", ".opencode/commands"):
        replace_directory(rendered_root / relative, repo_root / relative)
        replaced_surfaces.append(relative)

    rendered_skills_root = rendered_root / ".opencode" / "skills"
    target_skills_root = repo_root / ".opencode" / "skills"
    target_skills_root.mkdir(parents=True, exist_ok=True)
    for skill_dir in sorted(rendered_skills_root.iterdir()):
        if not skill_dir.is_dir():
            continue
        replace_directory(skill_dir, target_skills_root / skill_dir.name)
    replaced_surfaces.append("scaffold-managed .opencode/skills")

    for filename in DETERMINISTIC_PROCESS_DOCS:
        replace_file(rendered_root / "docs" / "process" / filename, repo_root / "docs" / "process" / filename)
        replaced_surfaces.append(f"docs/process/{filename}")

    rendered_start_here = (rendered_root / "START-HERE.md").read_text(encoding="utf-8")
    target_start_here_path = repo_root / "START-HERE.md"
    existing_start_here = target_start_here_path.read_text(encoding="utf-8") if target_start_here_path.exists() else ""
    target_start_here_path.write_text(merge_start_here(existing_start_here, rendered_start_here), encoding="utf-8")
    replaced_surfaces.append("START-HERE.md managed block")

    update_provenance(repo_root, rendered_root, replaced_surfaces, change_summary)
    update_workflow_state(repo_root, read_json(rendered_root / ".opencode" / "meta" / "bootstrap-provenance.json"), change_summary)
    return replaced_surfaces


def main() -> int:
    args = parse_args()
    repo_root = Path(args.repo_root).expanduser().resolve()
    metadata = load_metadata(repo_root, args)

    with tempfile.TemporaryDirectory(prefix="scafforge-repair-") as temp_dir:
        rendered_root = Path(temp_dir) / "rendered"
        run_bootstrap_render(rendered_root, metadata, args.stack_label)
        replaced_surfaces = apply_repair(repo_root, rendered_root, args.change_summary)

    findings = [] if args.skip_verify else audit_repo(repo_root)
    payload = {
        "repo_root": str(repo_root),
        "replaced_surfaces": replaced_surfaces,
        "verification": {
            "performed": not args.skip_verify,
            "finding_count": len(findings),
            "error_count": sum(1 for finding in findings if finding.severity == "error"),
            "warning_count": sum(1 for finding in findings if finding.severity == "warning"),
        },
    }
    print(json.dumps(payload, indent=2))

    if args.skip_verify:
        return 0
    if args.fail_on == "warning" and findings:
        return 2
    if args.fail_on == "error" and any(finding.severity == "error" for finding in findings):
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
