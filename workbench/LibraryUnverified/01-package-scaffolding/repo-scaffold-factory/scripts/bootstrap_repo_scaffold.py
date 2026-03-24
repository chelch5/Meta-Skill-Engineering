from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path


TEXT_SUFFIXES = {
    ".md",
    ".json",
    ".jsonc",
    ".txt",
    ".ts",
    ".js",
    ".mjs",
    ".cjs",
    ".yaml",
    ".yml",
}

FULL_SCOPE_FILES = {
    "README.md",
    "AGENTS.md",
    "START-HERE.md",
    "opencode.jsonc",
    "docs",
    "tickets",
    ".opencode",
}

OPENCODE_SCOPE_FILES = {
    "opencode.jsonc",
    ".opencode",
}


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "project"


def render_text(content: str, replacements: dict[str, str]) -> str:
    for key, value in replacements.items():
        content = content.replace(key, value)
    return content


def render_relative_path(path: Path, replacements: dict[str, str]) -> Path:
    rendered_parts = [render_text(part, replacements) for part in path.parts]
    return Path(*rendered_parts)


def should_copy(root_name: str, scope: str) -> bool:
    if scope == "opencode":
        return root_name in OPENCODE_SCOPE_FILES
    return root_name in FULL_SCOPE_FILES


def copy_template(template_root: Path, dest_root: Path, replacements: dict[str, str], scope: str, force: bool) -> list[Path]:
    created: list[Path] = []

    for source in template_root.iterdir():
        if not should_copy(source.name, scope):
            continue
        target = dest_root / source.name
        if source.is_dir():
            created.extend(copy_dir(source, target, replacements, force))
        else:
            write_file(source, target, replacements, force)
            created.append(target)
    return created


def copy_dir(source_dir: Path, dest_dir: Path, replacements: dict[str, str], force: bool) -> list[Path]:
    created: list[Path] = []
    dest_dir.mkdir(parents=True, exist_ok=True)
    for source in source_dir.rglob("*"):
        relative = render_relative_path(source.relative_to(source_dir), replacements)
        target = dest_dir / relative
        if source.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue
        write_file(source, target, replacements, force)
        created.append(target)
    return created


def write_file(source: Path, target: Path, replacements: dict[str, str], force: bool) -> None:
    if target.exists() and not force:
        raise FileExistsError(f"Refusing to overwrite existing file: {target}")
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.suffix in TEXT_SUFFIXES:
        text = source.read_text(encoding="utf-8")
        target.write_text(render_text(text, replacements), encoding="utf-8")
    else:
        shutil.copy2(source, target)


def managed_repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def template_commit() -> str:
    result = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=managed_repo_root(),
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        return "unknown"
    return result.stdout.strip() or "unknown"


def write_bootstrap_provenance(
    dest_root: Path,
    *,
    project_name: str,
    project_slug: str,
    agent_prefix: str,
    scope: str,
) -> None:
    steps = (
        ["repo-scaffold-factory/render-full-scaffold"]
        if scope == "full"
        else ["opencode-team-bootstrap/render-opencode-layer", "repo-scaffold-factory/render-opencode-scope"]
    )
    payload = {
        "managed_repo": str(managed_repo_root()),
        "template_commit": template_commit(),
        "template_asset_root": "skills/repo-scaffold-factory/assets/project-template",
        "project_name": project_name,
        "project_slug": project_slug,
        "agent_prefix": agent_prefix,
        "generation_scope": scope,
        "bootstrap_steps": steps,
        "tracking": {
            "invocation_log": ".opencode/state/invocation-log.jsonl",
            "skill_ping_tool": "skill_ping",
            "tracker_plugin": "invocation-tracker",
        },
    }

    target = dest_root / ".opencode" / "meta" / "bootstrap-provenance.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render the repository scaffold template.")
    parser.add_argument("--dest", required=True, help="Destination repository root")
    parser.add_argument("--project-name", required=True, help="Human-facing project name")
    parser.add_argument("--project-slug", help="Slug used in filenames and defaults")
    parser.add_argument("--agent-prefix", help="OpenCode agent prefix")
    parser.add_argument(
        "--default-model",
        default="minimax-coding-plan/MiniMax-M2.5",
        help="Default OpenCode agent model string",
    )
    parser.add_argument(
        "--planner-model",
        help="Override planner/reviewer/team-lead model string",
    )
    parser.add_argument(
        "--implementer-model",
        help="Override implementer model string",
    )
    parser.add_argument(
        "--scope",
        choices=("full", "opencode"),
        default="full",
        help="Render the full scaffold or only the OpenCode layer",
    )
    parser.add_argument(
        "--stack-label",
        default="framework-agnostic",
        help="Label used in generated docs for the current stack mode",
    )
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    dest_root = Path(args.dest).expanduser().resolve()
    template_root = Path(__file__).resolve().parent.parent / "assets" / "project-template"

    slug = args.project_slug or slugify(args.project_name)
    agent_prefix = args.agent_prefix or slug
    planner_model = args.planner_model or args.default_model
    implementer_model = args.implementer_model or args.default_model

    replacements = {
        "__PROJECT_NAME__": args.project_name,
        "__PROJECT_SLUG__": slug,
        "__AGENT_PREFIX__": agent_prefix,
        "__DEFAULT_MODEL__": args.default_model,
        "__PLANNER_MODEL__": planner_model,
        "__IMPLEMENTER_MODEL__": implementer_model,
        "__STACK_LABEL__": args.stack_label,
    }

    dest_root.mkdir(parents=True, exist_ok=True)
    created = copy_template(template_root, dest_root, replacements, args.scope, args.force)
    write_bootstrap_provenance(
        dest_root,
        project_name=args.project_name,
        project_slug=slug,
        agent_prefix=agent_prefix,
        scope=args.scope,
    )

    print(f"Rendered {len(created)} files into {dest_root}")
    for path in created[:20]:
        print(f"- {path}")
    if len(created) > 20:
        print(f"... and {len(created) - 20} more files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
