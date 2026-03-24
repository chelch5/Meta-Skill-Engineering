from __future__ import annotations

import argparse
import subprocess
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render only the OpenCode layer of the scaffold.")
    parser.add_argument("--dest", required=True, help="Destination repository root")
    parser.add_argument("--project-name", required=True, help="Human-facing project name")
    parser.add_argument("--project-slug", help="Slug used in filenames and defaults")
    parser.add_argument("--agent-prefix", help="OpenCode agent prefix")
    parser.add_argument(
        "--default-model",
        default="minimax-coding-plan/MiniMax-M2.5",
        help="Default OpenCode agent model string",
    )
    parser.add_argument("--planner-model", help="Override planner/reviewer/team-lead model string")
    parser.add_argument("--implementer-model", help="Override implementer model string")
    parser.add_argument("--stack-label", default="framework-agnostic", help="Stack label")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    script = (
        Path(__file__).resolve().parents[2]
        / "repo-scaffold-factory"
        / "scripts"
        / "bootstrap_repo_scaffold.py"
    )
    command = [
        "python",
        str(script),
        "--dest",
        args.dest,
        "--project-name",
        args.project_name,
        "--default-model",
        args.default_model,
        "--scope",
        "opencode",
        "--stack-label",
        args.stack_label,
    ]
    if args.project_slug:
        command.extend(["--project-slug", args.project_slug])
    if args.agent_prefix:
        command.extend(["--agent-prefix", args.agent_prefix])
    if args.planner_model:
        command.extend(["--planner-model", args.planner_model])
    if args.implementer_model:
        command.extend(["--implementer-model", args.implementer_model])
    if args.force:
        command.append("--force")
    result = subprocess.run(command, check=False)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
